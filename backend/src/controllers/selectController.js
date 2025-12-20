import Course from "../models/Course.js";
import { generatePPT } from "../services/aiAgentService.js";

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
    if(topic.pptLink){
      return res.json({ url: topic.pptLink });
    }
    const url = await generatePPT(subject, description);
    topic.pptLink = url;
    await course.save();

    return res.json({ url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}