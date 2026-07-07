import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["teacher", "student"], default: "teacher" },
    department: { type: String, default: "" },
    googleTokens: { type: Object, default: {} },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
