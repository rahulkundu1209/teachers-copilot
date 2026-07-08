import Course from "../models/Course.js";
import { generatePPT, retrievePYQ } from "../services/aiAgentService.js";
import * as googleService from "../services/googleSlidesService.js";

// The aiAgentService's generatePPT(subject, description, threadId="") will be used to create PPTs based on the subject and description provided.
export async function selectTopic(req, res){
  const user = req.user;
  const email = user && user.email;
  
  if (!email) {
    return res.status(401).json({ error: "Unauthorized - please log in" });
  }
  const { subject, description, topicId, courseId } = req.body;
  if(!subject || !description || !topicId || !courseId){
    return res.status(400).json({ error: "Subject, description, topicId, and courseId are required" });
  }

  try {
    const course = await Course.findOne({ _id: courseId, userId: email });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    const topic = course.topics.find(t => t.id === topicId);
    if (!topic) {
      return res.status(404).json({ error: "Topic not found in the specified course" });
    }
    if (topic.pptLink) {
      return res.json({ url: topic.pptLink });
    }

    const hasGoogle = await googleService.userHasGoogleTokens(email);
    if (!hasGoogle) {
      return res.status(403).json({ needsGoogleConnect: true });
    }

    const url = await generatePPT(email,subject, description);
    topic.pptLink = url;
    await course.save();

    return res.json({ url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getTopicPYQ(req, res) {
  const user = req.user;
  const email = user && user.email;

  if (!email) {
    return res.status(401).json({ error: "Unauthorized - please log in" });
  }

  const { subject, topic, topicId, courseId } = req.body;
  if (!subject || !topic || !topicId || !courseId) {
    return res.status(400).json({ error: "Subject, topic, topicId, and courseId are required" });
  }

  try {
    const course = await Course.findOne({ _id: courseId, userId: email });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const topicItem = course.topics.find((t) => t.id === topicId);
    if (!topicItem) {
      return res.status(404).json({ error: "Topic not found in the specified course" });
    }

    if (topicItem.pyqData && topicItem.pyqData.length) {
      return res.json({ pyqs: topicItem.pyqData });
    }

    const pyqPayload = await retrievePYQ(subject, topic);
    topicItem.pyqData = pyqPayload;
    await course.save();

    return res.json({ pyqs: pyqPayload });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}