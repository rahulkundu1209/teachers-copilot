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
  const responseMap =
    responses && typeof responses === "object" ? responses : {};

  return questions.reduce(
    (result, question, index) => {
      const key = getQuestionKey(question, index);
      const userAnswer = normalizeAnswer(responseMap[key]);
      const correctAnswer = normalizeAnswer(question?.answer);
      const marks = Number(question?.marks || 0);

      const isCorrect =
        Boolean(userAnswer) &&
        Boolean(correctAnswer) &&
        userAnswer === correctAnswer;

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
    const email = user.email?.toLowerCase();

    if (!email) {
      return res.status(401).json({ error: "Please log in" });
    }

    if (user.role !== "student") {
      return res.status(403).json({
        error: "Only students can submit assessments",
      });
    }

    const { courseId, topicId, responses } = req.body || {};

    if (!courseId || !topicId || !responses) {
      return res.status(400).json({
        error: "courseId, topicId, and responses are required",
      });
    }

    const course = await Course.findOne({
      _id: courseId,
      joinedStudentEmails: email,
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const topic = course.topics.find(
      (item) => String(item.id) === String(topicId)
    );

    if (!topic) {
      return res.status(404).json({ error: "Topic not found" });
    }

    if (
      !Array.isArray(topic.assessments) ||
      topic.assessments.length === 0
    ) {
      return res.status(400).json({
        error: "No assessment is available for this topic",
      });
    }

    const result = scoreAssessment(topic.assessments, responses);
    const submittedAt = new Date();

    const submission = {
      id: `${Date.now()}-${email}`,
      userId: email,
      studentName: user.name || email,
      responses,
      score: result.score,
      maxScore: result.maxScore,
      submittedAt,
    };

    /*
     * Atomic update:
     * The topic must not already contain a submission from this student.
     * This protects against refreshes, repeated clicks, and concurrent requests.
     */
    // const updateResult = await Course.updateOne(
    //   {
    //     _id: courseId,
    //     joinedStudentEmails: email,
    //     topics: {
    //       $elemMatch: {
    //         id: String(topicId),
    //         "assessmentSubmissions.userId": { $ne: email },
    //       },
    //     },
    //   },
    //   {
    //     $push: {
    //       "topics.$.assessmentSubmissions": submission,
    //     },
    //   }
    // );

    const updateResult = await Course.updateOne(
  {
    _id: courseId,
    joinedStudentEmails: email,
    topics: {
      $elemMatch: {
        id: String(topicId),
        "assessmentSubmissions.userId": { $ne: email },
      },
    },
  },
  {
    $push: {
      "topics.$[targetTopic].assessmentSubmissions": submission,
    },
  },
  {
    arrayFilters: [
      {
        "targetTopic.id": String(topicId),
      },
    ],
  }
);


    if (updateResult.modifiedCount === 0) {
      return res.status(409).json({
        error: "You have already submitted this assessment",
      });
    }

    // History failure should not undo a successful submission.
    try {
      await historyService.addHistory(email, {
        type: "assessment_submitted",
        data: {
          courseId: course._id.toString(),
          topicId,
          score: result.score,
          maxScore: result.maxScore,
          submittedAt,
        },
      });
    } catch (historyError) {
      console.warn(
        "Could not record assessment history:",
        historyError.message
      );
    }

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

export async function getAssessmentSubmissions(req, res) {
  try {
    const user = req.user || {};
    const email = user.email?.toLowerCase();
    const { courseId, topicId } = req.params;

    if (!email) {
      return res.status(401).json({ error: "Please log in" });
    }

    if (user.role !== "teacher") {
      return res.status(403).json({
        error: "Only teachers can view submissions",
      });
    }

    // lean() returns normal JavaScript objects.
    const course = await Course.findOne({
      _id: courseId,
      userId: email,
    }).lean();

    if (!course) {
      return res.status(404).json({
        error: "Course not found or you are not its owner",
      });
    }

    const topic = (course.topics || []).find(
      (item) => String(item.id) === String(topicId)
    );

    if (!topic) {
      return res.status(404).json({ error: "Topic not found" });
    }

    if (
  !Array.isArray(topic.assessments) ||
  topic.assessments.length === 0
) {
  return res.json({
    submissions: [],
    count: 0,
    assessmentGenerated: false,
  });
}

    const submissions = Array.isArray(topic.assessmentSubmissions)
      ? topic.assessmentSubmissions
      : [];

    const result = submissions.map((submission) => ({
      id: submission.id,
      studentName:
        submission.studentName ||
        submission.userId ||
        "Unknown student",
      studentEmail: submission.userId || "",
      score: Number(submission.score || 0),
      maxScore: Number(submission.maxScore || 0),
      submittedAt: submission.submittedAt || null,
    }));

    result.sort(
      (a, b) =>
        new Date(b.submittedAt || 0).getTime() -
        new Date(a.submittedAt || 0).getTime()
    );

    return res.json({
      submissions: result,
      count: result.length,
    });
  } catch (err) {
    console.error("getAssessmentSubmissions error:", err);
    return res.status(500).json({ error: err.message });
  }
}



export async function getAssessmentStatus(req, res) {
  try {
    const user = req.user || {};
    const email = user.email?.toLowerCase();
    const { courseId, topicId } = req.params;

    if (!email) {
      return res.status(401).json({ error: "Please log in" });
    }

    if (user.role !== "student") {
      return res.status(403).json({
        error: "Only students can check assessment status",
      });
    }

    const course = await Course.findOne({
      _id: courseId,
      joinedStudentEmails: email,
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const topic = course.topics.find(
      (item) => String(item.id) === String(topicId)
    );

    if (!topic) {
      return res.status(404).json({ error: "Topic not found" });
    }

    const submissions = Array.isArray(topic.assessmentSubmissions)
      ? topic.assessmentSubmissions
      : [];

    const submission = submissions.find(
      (item) => item.userId?.toLowerCase() === email
    );

    return res.json({
      hasSubmitted: Boolean(submission),
      score: submission?.score ?? null,
      maxScore: submission?.maxScore ?? null,
      submittedAt: submission?.submittedAt ?? null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}







