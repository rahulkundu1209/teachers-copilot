import axios from "axios";
import fs from "fs";

export async function parseSyllabusFile(subjectName, filePath) {
  const AGENT_BASE_URL = process.env.AGENT_BASE_URL || "http://localhost:8000";
  
  // Read file content
  let fileContent;
  try {
    fileContent = fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    throw new Error("Could not read file: " + err.message);
  }
  
  // Limit file size - Groq free tier has low token limits
  // Each char is roughly 1 token, so keep it under 3000 chars
  const MAX_CHARS = 8000;
  if (fileContent.length > MAX_CHARS) {
    console.warn(`File too large (${fileContent.length} chars). Truncating to ${MAX_CHARS} chars.`);
    fileContent = fileContent.substring(0, MAX_CHARS);
  }
  
  // Simplified prompt to reduce tokens
  const prompt = `Extract "${subjectName}" from:\n${fileContent}`;

  const payload = {
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  };

  try {
    const response = await axios.post(`${AGENT_BASE_URL}/invoke`, payload, {
      timeout: 30000
    });

    console.log("Full agent response:", JSON.stringify(response.data, null, 2));
    
    console.log("Agent response structure:", {
      hasOutput: !!response.data?.output,
      outputType: typeof response.data?.output,
      outputKeys: Object.keys(response.data?.output || {}),
      hasText: !!response.data?.output?.text,
      textType: typeof response.data?.output?.text,
      textValue: response.data?.output?.text ? response.data.output.text.substring(0, 100) : "undefined"
    });
    
    // Directly get the text from output.text
    let extractedText = response.data?.output?.text;
    
    // Ensure it's a string
    if (typeof extractedText !== "string") {
      console.warn("extractedText is not a string, converting:", typeof extractedText);
      extractedText = String(extractedText || "");
    }
    
    // If somehow empty, use fallback
    if (!extractedText || extractedText === "[object Object]") {
      console.warn("Invalid extraction, using fallback");
      extractedText = fileContent;
    }
    
    console.log("Final extracted text length:", extractedText.length);
    
    // Clean up temp file
    try { fs.unlinkSync(filePath); } catch (e) {}
    
    return extractedText;
  } catch (error) {
    console.error("Agent API error details:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: `${AGENT_BASE_URL}/invoke`
    });
    try { fs.unlinkSync(filePath); } catch (e) {}
    return fallbackExtract(subjectName, fileContent);
  }
}

function fallbackExtract(subjectName, fileContent) {
  const regex = new RegExp(`${subjectName}[\\s\\S]*?(?=^[A-Z][A-Z\\s]+:|$)`, "m");
  const match = fileContent.match(regex);
  return match ? match[0] : fileContent;
}