import Course from "../models/Course.js";
import { analyzeSyllabus } from "./aiAgentService.js";
import crypto from "node:crypto";

const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function normalizeEmail(email) {
  return (email || "").toLowerCase();
}

function sanitizeAssessmentForStudent(question) {
  if (!question || typeof question !== "object") {
    return question;
  }

  const sanitized = { ...question };
  delete sanitized.answer;
  return sanitized;
}

// function sanitizeTopicForStudent(topic) {
//   if (!topic || typeof topic !== "object") {
//     return topic;
//   }

//   const sanitized = { ...topic };
//   if (Array.isArray(sanitized.assessments)) {
//     sanitized.assessments = sanitized.assessments.map(sanitizeAssessmentForStudent);
//   }

//   return sanitized;
// }

function sanitizeTopicForStudent(topic) {
  if (!topic || typeof topic !== "object") {
    return topic;
  }

  // Convert Mongoose subdocument into a normal object
  const sanitized =
    typeof topic.toObject === "function"
      ? topic.toObject()
      : { ...topic };

  if (Array.isArray(sanitized.assessments)) {
    sanitized.assessments = sanitized.assessments.map(
      sanitizeAssessmentForStudent
    );
  }

  delete sanitized.assessmentSubmissions;

  return sanitized;
}


function sanitizeCourseForStudent(course) {
  if (!course || typeof course !== "object") {
    return course;
  }

  return {
    ...course,
    topics: Array.isArray(course.topics) ? course.topics.map(sanitizeTopicForStudent) : course.topics,
  };
}

function generateJoinCode(length = 6) {
  const bytes = crypto.randomBytes(length);
  let code = "";
  for (let index = 0; index < length; index += 1) {
    code += JOIN_CODE_ALPHABET[bytes[index] % JOIN_CODE_ALPHABET.length];
  }
  return code;
}

async function createUniqueJoinCode() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = generateJoinCode(6);
    const existing = await Course.findOne({ joinCode: code }).select("_id");
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique course code");
}

function toCoursePayload(course, { includeJoinCode = false } = {}) {
  if (!course) return null;
  const payload = {
    id: course._id.toString(),
    name: course.name,
    branch: course.branch,
    numLectures: course.numLectures,
    syllabusText: course.syllabusText,
    additionalPrompt: course.additionalPrompt,
    topics: course.topics,
    createdAt: course.createdAt,
  };

  if (includeJoinCode && course.joinCode) {
    payload.joinCode = course.joinCode;
  }

  return payload;
}

async function backfillJoinCode(course) {
  if (!course || course.joinCode) return course;
  course.joinCode = await createUniqueJoinCode();
  await course.save();
  return course;
}

export async function listCourses(userOrEmail) {
  const email = normalizeEmail(typeof userOrEmail === "string" ? userOrEmail : userOrEmail?.email);
  const role = typeof userOrEmail === "object" ? userOrEmail?.role : undefined;

  if (!email) return [];

  const query = role === "student"
    ? { joinedStudentEmails: email }
    : { userId: email };

  const courses = await Course.find(query).sort({ createdAt: -1 });

  if (role !== "student") {
    for (const course of courses) {
      if (!course.joinCode) {
        await backfillJoinCode(course);
      }
    }
  }

  return courses.map((course) => {
    const payload = toCoursePayload(course, { includeJoinCode: role !== "student" && course.userId === email });
    return role === "student" ? sanitizeCourseForStudent(payload) : payload;
  });
}

export async function createCourse(email, course) {
  if (!email) throw new Error("Email required");
  const { name, branch, numLectures, syllabusText, additionalPrompt } = course;
  
  if (!name || !branch || !numLectures || !syllabusText) {
    throw new Error("Course name, branch, number of lectures and syllabus are required");
  }
  
  // Generate dummy topics based on numLectures
  const generatedTopics = await analyzeSyllabus(email, course);
  const topics = [];
  for (let i = 1; i <= numLectures; i++) {
    topics.push({
      id: `t${i}`,
      title: generatedTopics[i-1].title,
      content: generatedTopics[i-1].description,
    });
  }

  const ownerEmail = normalizeEmail(email);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const joinCode = await createUniqueJoinCode();
    try {
      const doc = await Course.create({
        name,
        branch,
        numLectures,
        syllabusText: syllabusText || "",
        additionalPrompt: additionalPrompt || "",
        topics,
        joinCode,
        joinedStudentEmails: [],
        userId: ownerEmail,
      });

      return toCoursePayload(doc, { includeJoinCode: true });
    } catch (err) {
      if (err?.code === 11000 && err?.keyPattern?.joinCode) {
        continue;
      }
      throw err;
    }
  }

  throw new Error("Could not create a unique course code");
}

export async function getCourse(email, id) {
  if (!email || !id) return null;
  const normalizedEmail = normalizeEmail(email);
  const course = await Course.findOne({
    _id: id,
    $or: [
      { userId: normalizedEmail },
      { joinedStudentEmails: normalizedEmail },
    ],
  });
  if (!course) return null;

  if (course.userId === normalizedEmail && !course.joinCode) {
    await backfillJoinCode(course);
  }

  return toCoursePayload(course, { includeJoinCode: course.userId === normalizedEmail });
}

export async function getCourseForStudent(email, id) {
  const course = await getCourse(email, id);
  return sanitizeCourseForStudent(course);
}

export async function joinCourseByCode(email, code) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedCode = (code || "").trim().toUpperCase();

  if (!normalizedEmail) throw new Error("Email required");
  if (!normalizedCode) throw new Error("Course code required");
  if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
    throw new Error("Invalid course code format");
  }

  const course = await Course.findOne({ joinCode: normalizedCode });
  if (!course) {
    throw new Error("Course code not found");
  }

  const enrolledStudents = Array.isArray(course.joinedStudentEmails) ? course.joinedStudentEmails : [];
  if (!enrolledStudents.includes(normalizedEmail)) {
    course.joinedStudentEmails = enrolledStudents;
    course.joinedStudentEmails.push(normalizedEmail);
    await course.save();
  }

  return toCoursePayload(course, { includeJoinCode: false });
}

export async function updateCourse(email, id, patch) {
  if (!email || !id) return null;
  const course = await Course.findOneAndUpdate(
    { _id: id, userId: normalizeEmail(email) },
    { $set: patch },
    { new: true }
  );
  if (!course) return null;
  return toCoursePayload(course, { includeJoinCode: true });
}

export async function deleteCourse(email, id) {
  if (!email || !id) return false;
  const result = await Course.deleteOne({ _id: id, userId: normalizeEmail(email) });
  return result.deletedCount > 0;
}
