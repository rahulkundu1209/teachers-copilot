import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  // Professional Snapshot
  jobTitle: { type: String, default: "" },
  expertise: { type: String, default: "" },
  locationCountry: { type: String, default: "" },
  briefBio: { type: String, default: "" },
  // Teaching Style
  primaryTeachingStyle: { type: String, default: "" },
  supplementaryMaterials: { type: String, default: "" },
  studentAttentionTechnique: { type: String, default: "" },
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Profile = mongoose.model("Profile", ProfileSchema);
export default Profile;
