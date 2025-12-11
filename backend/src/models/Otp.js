import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true, lowercase: true, trim: true },
    code: { type: String, required: true },
    purpose: { type: String, required: true, enum: ["login", "register"] },
    expiresAt: { type: Date, required: true, index: true },
    payload: { type: Object, default: {} },
  },
  { timestamps: true }
);

OtpSchema.index({ email: 1, purpose: 1, expiresAt: 1 });

export default mongoose.models.Otp || mongoose.model("Otp", OtpSchema);
