import * as historyService from "../services/historyService.js";

export async function list(req, res) {
  try {
    const user = req.user;
    const email = user && user.email;
    const h = await historyService.listHistory(email);
    return res.json(h);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function add(req, res) {
  try {
    const user = req.user;
    const email = user && user.email;
    const entry = req.body || {};
    const item = await historyService.addHistory(email, entry);
    return res.status(201).json(item);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function clearAll(req, res) {
  try {
    const user = req.user;
    const email = user && user.email;
     //console.log("DEBUG: clearAll endpoint hit");
     //console.log("DEBUG: req.user:", user);
     //console.log("DEBUG: email:", email);
   
     if (!email) {
       console.log("DEBUG: No email found, returning 401");
       return res.status(401).json({ error: "Unauthorized - no email in token" });
     }
    
     //console.log("DEBUG: Calling historyService.clearHistory for:", email);
     const deletedCount = await historyService.clearHistory(email);
     //console.log("DEBUG: Successfully deleted", deletedCount, "history items for", email);
   
    return res.json({ success: true, deletedCount });
  } catch (err) {
    console.error("DEBUG: clearAll error:", err.message, err.stack);
    return res.status(500).json({ error: err.message || "Error clearing history" });
  }
}
