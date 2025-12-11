import mongoose from "mongoose";

const HistorySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  time: { type: Date, default: Date.now },
});

const History = mongoose.model("History", HistorySchema);
export default History;
