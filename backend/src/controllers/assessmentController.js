import Course from "../models/Course.js";
import User from "../models/User.js";
import * as historyService from "../services/historyService.js";

function normalizeAnswer(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getQuestionKey(question, index) {
  return String(question?.id ?? index);
}

function scoreAssessment(assessments, responses) {
  const questions = Array.isArray(assessments) ? assessments : [];
  const responseMap = responses && typeof responses === "object" ? responses : {};

  return questions.reduce(
    (result, question, index) => {
      const key = getQuestionKey(question, index);
      const userAnswer = normalizeAnswer(responseMap[key]);
      const correctAnswer = normalizeAnswer(question?.answer);
      const marks = Number(question?.marks || 0);
      const isCorrect = userAnswer && correctAnswer && userAnswer === correctAnswer;

      return {
        score: result.score + (isCorrect ? marks : 0),
        maxScore: result.maxScore + marks,
        responses: {
          ...result.responses,
          [key]: {
            selected: responseMap[key] ?? null,
            correct: question?.answer ?? null,
            isCorrect,
            marks: isCorrect ? marks : 0,
          },
        },
      };
    },
    { score: 0, maxScore: 0, responses: {} }
  );
}

export async function submitAssessment(req, res) {
  try {
    const user = req.user || {};
    const email = user.email;

    if (!email) {
      return res.status(401).json({ error: "Unauthorized - please log in" });
    }

    const { courseId, topicId, responses } = req.body || {};
    if (!courseId || !topicId || !responses) {
      return res.status(400).json({ error: "courseId, topicId, and responses are required" });
    }

    const course = await Course.findOne({
      _id: courseId,
      joinedStudentEmails: email.toLowerCase(),
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const topic = course.topics.find((item) => String(item.id) === String(topicId));
    if (!topic) {
      return res.status(404).json({ error: "Topic not found" });
    }

    if (!Array.isArray(topic.assessments) || topic.assessments.length === 0) {
      return res.status(400).json({ error: "No assessments available for this topic" });
    }

    if (!Array.isArray(topic.assessmentSubmissions)) {
      topic.assessmentSubmissions = [];
    }

    const existingSubmission = topic.assessmentSubmissions.find(
      (entry) => String(entry?.userId || "").toLowerCase() === email.toLowerCase()
    );

    if (existingSubmission) {
      return res.status(409).json({
        error: "You have already submitted this assessment",
        score: existingSubmission.score,
        maxScore: existingSubmission.maxScore,
        submittedAt: existingSubmission.submittedAt,
      });
    }

    const result = scoreAssessment(topic.assessments, responses);
    const submittedAt = new Date();

    const submission = {
      id: submittedAt.getTime().toString(),
      userId: email.toLowerCase(),
      responses,
      score: result.score,
      maxScore: result.maxScore,
      submittedAt,
    };

    topic.assessmentSubmissions.push(submission);
    await course.save();

    await historyService.addHistory(email, {
      type: "assessment_submitted",
      data: {
        courseId: course._id.toString(),
        topicId,
        score: result.score,
        maxScore: result.maxScore,
        responses,
        submittedAt,
      },
    });

    return res.json({
      ok: true,
      score: result.score,
      maxScore: result.maxScore,
      responses: result.responses,
      submittedAt,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function listAssessmentSubmissions(req, res) {
  try {
    const user = req.user || {};
    const email = user.email;

    if (!email) {
      return res.status(401).json({ error: "Unauthorized - please log in" });
    }

    const { courseId, topicId } = req.query || {};
    if (!courseId || !topicId) {
      return res.status(400).json({ error: "courseId and topicId are required" });
    }

    const course = await Course.findOne({ _id: courseId, userId: email.toLowerCase() });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const topic = course.topics.find((item) => String(item.id) === String(topicId));
    if (!topic) {
      return res.status(404).json({ error: "Topic not found" });
    }

    const submissions = Array.isArray(topic.assessmentSubmissions) ? topic.assessmentSubmissions : [];
    const studentEmails = [...new Set(submissions.map((entry) => String(entry?.userId || "").toLowerCase()).filter(Boolean))];
    const students = studentEmails.length > 0
      ? await User.find({ email: { $in: studentEmails } }).select("email name").lean()
      : [];

    const studentMap = new Map(students.map((student) => [String(student.email).toLowerCase(), student]));

    return res.json({
      submissions: submissions
        .slice()
        .sort((left, right) => new Date(right?.submittedAt || 0) - new Date(left?.submittedAt || 0))
        .map((submission) => {
          const student = studentMap.get(String(submission?.userId || "").toLowerCase());
          return {
            studentName: student?.name || submission?.userId || "Unknown student",
            email: submission?.userId || "",
            score: submission?.score ?? 0,
            maxScore: submission?.maxScore ?? 0,
            submittedAt: submission?.submittedAt || null,
          };
        }),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}