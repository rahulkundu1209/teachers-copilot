import axios from "axios";
import fs from "fs";

export async function parseSyllabusFile(subjectName, filePath, threadId = "") {
  const AIAGENT_BASE_URL = process.env.AIAGENT_BASE_URL;
  const SYLLABUSPARSE_ASSISTANT_ID = process.env.SYLLABUSPARSE_ASSISTANT_ID;
  
  // Read file content
  let fileContent;
  try {
    fileContent = fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    throw new Error("Could not read file: " + err.message);
  }
  
  // Limit file size - AI agent has token limits
  const MAX_CHARS = 8000;
  if (fileContent.length > MAX_CHARS) {
    console.warn(`File too large (${fileContent.length} chars). Truncating to ${MAX_CHARS} chars.`);
    fileContent = fileContent.substring(0, MAX_CHARS);
  }
  
  // Create prompt
  const prompt = `Extract syllabus content for "${subjectName}" from the following text:\n${fileContent}`;

  const options = {
    method: "POST",
    url: `${AIAGENT_BASE_URL}a2a/${SYLLABUSPARSE_ASSISTANT_ID}`,
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
        thread: { threadId: threadId },
      },
    },
  };

  try {
    const { data } = await axios.request(options);
    
    if (data && data.result && data.result.artifacts && data.result.artifacts.length > 0) {
      const extractedText = data.result.artifacts[0].parts[0].text;
      console.log("Extracted text length:", extractedText.length);
      
      // Clean up temp file
      try { fs.unlinkSync(filePath); } catch (e) {}
      
      return extractedText;
    } else {
      console.warn("Unexpected response structure:", JSON.stringify(data, null, 2));
      throw new Error("Invalid response format from AI agent");
    }
  } catch (error) {
    console.error("AI Agent API error details:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: `${AIAGENT_BASE_URL}a2a/${SYLLABUSPARSE_ASSISTANT_ID}`
    });
    try { fs.unlinkSync(filePath); } catch (e) {}
    return fallbackExtract(subjectName, fileContent);
  }
}

function fallbackExtract(subjectName, fileContent) {
  console.log("Using fallback extraction method");
  const regex = new RegExp(`${subjectName}[\\s\\S]*?(?=^[A-Z][A-Z\\s]+:|$)`, "m");
  const match = fileContent.match(regex);
  return match ? match[0] : fileContent;
}