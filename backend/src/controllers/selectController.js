import { generatePPT } from "../services/aiAgentService.js";

// The aiAgentService's generatePPT(subject, description, threadId="") will be used to create PPTs based on the subject and description provided.
export async function selectTopic(req, res){
  const user = req.user;
  const email = user && user.email;
  
  if (!email) {
    return res.status(401).json({ error: "Unauthorized - please log in" });
  }
  const { subject, description } = req.body;
  if(!subject || !description){
    return res.status(400).json({ error: "Subject and description are required" });
  }

  try {
    const url = await generatePPT(subject, description);
    return res.json({ url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}