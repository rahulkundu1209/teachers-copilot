import * as courseService from "../services/courseService.js";
import * as historyService from "../services/historyService.js";

export async function generate(req, res) {
  try {
    const user = req.user;
    const email = user && user.email;
    
    if (!email) {
      return res.status(401).json({ error: "Unauthorized - please log in" });
    }

    const { name, branch, numLectures, syllabusText, additionalPrompt } = req.body || {};
    
    // Create course in MongoDB
    const course = await courseService.createCourse(email, {
      name: name || "Untitled Course",
      branch: branch || "General",
      numLectures: Number(numLectures) || 10,
      syllabusText: syllabusText || "",
      additionalPrompt: additionalPrompt || "",
    });

    // Add to history
    await historyService.addHistory(email, {
      type: "created_course",
      data: { courseId: course.id, name: course.name },
    });

    return res.status(201).json({ course });
  } catch (err) {
    console.error("Generate error:", err);
    return res.status(500).json({ error: err.message || "Generation failed" });
  }
}
