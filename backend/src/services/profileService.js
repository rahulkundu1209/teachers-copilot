import Profile from "../models/Profile.js";

export async function getProfile(userId) {
  if (!userId) return null;
  const profile = await Profile.findOne({ userId: userId.toLowerCase() });
  if (!profile) return null;
  return {
    jobTitle: profile.jobTitle,
    expertise: profile.expertise,
    locationCountry: profile.locationCountry,
    briefBio: profile.briefBio,
    primaryTeachingStyle: profile.primaryTeachingStyle,
    supplementaryMaterials: profile.supplementaryMaterials,
    studentAttentionTechnique: profile.studentAttentionTechnique,
  };
}

export async function createOrUpdateProfile(userId, profileData) {
  if (!userId) throw new Error("userId required");
  
  const updateData = {
    ...profileData,
    updatedAt: new Date(),
  };
  
  const profile = await Profile.findOneAndUpdate(
    { userId: userId.toLowerCase() },
    { $set: updateData },
    { upsert: true, new: true }
  );

  return {
    jobTitle: profile.jobTitle,
    expertise: profile.expertise,
    locationCountry: profile.locationCountry,
    briefBio: profile.briefBio,
    primaryTeachingStyle: profile.primaryTeachingStyle,
    supplementaryMaterials: profile.supplementaryMaterials,
    studentAttentionTechnique: profile.studentAttentionTechnique,
  };
}
