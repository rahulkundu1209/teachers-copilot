import Course from "../models/Course.js";

export async function listCourses(email) {
  if (!email) return [];
  const courses = await Course.find({ userId: email.toLowerCase() }).sort({ createdAt: -1 });
  return courses.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    branch: c.branch,
    numLectures: c.numLectures,
    syllabusText: c.syllabusText,
    additionalPrompt: c.additionalPrompt,
    topics: c.topics,
    createdAt: c.createdAt,
  }));
}

export async function createCourse(email, course) {
  if (!email) throw new Error("Email required");
  const { name, branch, numLectures, syllabusText, additionalPrompt } = course;
  
  if (!name || !branch || !numLectures) {
    throw new Error("Course name, branch, and number of lectures are required");
  }
  
  // Generate dummy topics based on numLectures
  const topics = [];
  for (let i = 1; i <= numLectures; i++) {
    topics.push({
      id: `t${i}`,
      title: `Topic ${i}`,
      content: "Auto-generated content placeholder",
    });
  }

  const doc = await Course.create({
    name,
    branch,
    numLectures,
    syllabusText: syllabusText || "",
    additionalPrompt: additionalPrompt || "",
    topics,
    userId: email.toLowerCase(),
  });

  return {
    id: doc._id.toString(),
    name: doc.name,
    branch: doc.branch,
    numLectures: doc.numLectures,
    syllabusText: doc.syllabusText,
    additionalPrompt: doc.additionalPrompt,
    topics: doc.topics,
    createdAt: doc.createdAt,
  };
}

export async function getCourse(email, id) {
  if (!email || !id) return null;
  const course = await Course.findOne({ _id: id, userId: email.toLowerCase() });
  if (!course) return null;
  return {
    id: course._id.toString(),
    name: course.name,
    branch: course.branch,
    numLectures: course.numLectures,
    syllabusText: course.syllabusText,
    additionalPrompt: course.additionalPrompt,
    topics: course.topics,
    createdAt: course.createdAt,
  };
}

export async function updateCourse(email, id, patch) {
  if (!email || !id) return null;
  const course = await Course.findOneAndUpdate(
    { _id: id, userId: email.toLowerCase() },
    { $set: patch },
    { new: true }
  );
  if (!course) return null;
  return {
    id: course._id.toString(),
    name: course.name,
    branch: course.branch,
    numLectures: course.numLectures,
    syllabusText: course.syllabusText,
    additionalPrompt: course.additionalPrompt,
    topics: course.topics,
    createdAt: course.createdAt,
  };
}

export async function deleteCourse(email, id) {
  if (!email || !id) return false;
  const result = await Course.deleteOne({ _id: id, userId: email.toLowerCase() });
  return result.deletedCount > 0;
}
