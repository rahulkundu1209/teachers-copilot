import axios from "axios";
import { getProfile } from "./profileService.js";

export async function analyzeSyllabus(email, course) {
  const AIAGENT_BASE_URL = process.env.AIAGENT_BASE_URL;
  const ANALYZER_ASSISTANT_ID = process.env.ANALYZER_ASSISTANT_ID;
  const { name, branch, numLectures, syllabusText, additionalPrompt } = course;
  // Fetch the teacher's information
  const profile = await getProfile(email);
  if (!profile) return null;

  const prompt = {
    teacher_background: `${profile.jobTitle} with expertise in ${profile.expertise}, teach engineering undergraduate students in an institute of ${profile.locationCountry}`,
    scenario: `${name} subject for ${branch} students in ${numLectures} lectures. ${additionalPrompt}`,
    syllabus: syllabusText,
  };

  const options = {
    method: "POST",
    url: `${AIAGENT_BASE_URL}a2a/${ANALYZER_ASSISTANT_ID}`,
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    data: {
      jsonrpc: "2.0",
      id: "",
      method: "message/send",
      params: {
        message: {
          role: "user",
          parts: [{ kind: "text", text: JSON.stringify(prompt) }],
          messageId: "",
        },
        thread: { threadId: "" },
      },
    },
  };

  try {
    const { data } = await axios.request(options);
    if(data){
      const text = data.result.history[1].parts[0].text;
      const jsonString = text.match(/\[[\s\S]*\]/)[0];
      return JSON.parse(jsonString);
    }
  } catch (error) {
    console.error(error);
  }
}
