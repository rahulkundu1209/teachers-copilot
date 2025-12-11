import History from "../models/History.js";
import Course from "../models/Course.js";

export async function listHistory(email) {
  if (!email) return [];
  const items = await History.find({ userId: email.toLowerCase() }).sort({ time: -1 });

  // Return all history events (created + deleted) without filtering
  return items.map((h) => ({
    id: h._id.toString(),
    type: h.type,
    data: h.data,
    time: h.time,
  }));
}

export async function addHistory(email, entry) {
  if (!email) throw new Error("Email required for history");
  const item = await History.create({
    userId: email.toLowerCase(),
    type: entry.type || "action",
    data: entry.data || {},
  });
  return {
    id: item._id.toString(),
    type: item.type,
    data: item.data,
    time: item.time,
  };
}

export async function clearHistory(email) {
  if (!email) throw new Error("Email required for history");
  const result = await History.deleteMany({ userId: email.toLowerCase() });
  return result.deletedCount;
}
