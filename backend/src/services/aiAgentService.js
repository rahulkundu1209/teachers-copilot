import axios from "axios";
import { getProfile } from "./profileService.js";
import { createPresentationFromPayload } from "./googleSlidesService.js";

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
          messageId: "msg-1",
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

export async function generatePPT(email, subject, description, threadId=""){
  const AIAGENT_BASE_URL = process.env.AIAGENT_BASE_URL;
  const PPTGENERATOR_ASSISTANT_ID = process.env.PPTGENERATOR_ASSISTANT_ID;
  const prompt = `Subject: ${subject}\nTopic Description: ${description}`;
  const options = {
    method: "POST",
    url: `${AIAGENT_BASE_URL}a2a/${PPTGENERATOR_ASSISTANT_ID}`,
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    data: {
      jsonrpc: "2.0",
      id: "",
      method: "message/send",
      params: {
        message: {
          role: "user",
          parts: [{ kind: "text", text: JSON.stringify(prompt) }],
          messageId: "msg-2",
        },
        thread: { threadId: threadId },
      },
    },
  };
  try {
    const { data } = await axios.request(options);
    console.log("generatePPT ai-agent response data:", data);
    if (data) {
      const text =
        data.result.artifacts?.[0]?.parts?.[0]?.text ||
        data.result.history?.[1]?.parts?.[0]?.text ||
        "";

      if (!text) {
        throw new Error("No payload returned from PPT generator agent");
      }

      let payload;
      try {
        payload = JSON.parse(text);
      } catch (error) {
        throw new Error(`Invalid JSON payload from PPT generator agent: ${error.message}`);
      }

      return await createPresentationFromPayload(email, payload);
    }
  } catch (error) {
    console.error("generatePPT error:", error);
    throw error;
  }
}