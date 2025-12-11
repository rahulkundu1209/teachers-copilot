import * as profileService from "../services/profileService.js";

export async function getProfile(req, res) {
  try {
    const user = req.user;
    const userId = user && user.email;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const profile = await profileService.getProfile(userId);
    return res.json(profile || {});
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function updateProfile(req, res) {
  try {
    const user = req.user;
    const userId = user && user.email;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const body = req.body || {};
    //console.log("DEBUG: updateProfile received body:", JSON.stringify(body, null, 2));
    //console.log("DEBUG: userId:", userId);
    
    const profileData = {};
    
    // Only add fields that are explicitly provided in the request
    if (body.jobTitle !== undefined) profileData.jobTitle = body.jobTitle;
    if (body.expertise !== undefined) profileData.expertise = body.expertise;
    if (body.locationCountry !== undefined) profileData.locationCountry = body.locationCountry;
    if (body.briefBio !== undefined) profileData.briefBio = body.briefBio;
    if (body.primaryTeachingStyle !== undefined) profileData.primaryTeachingStyle = body.primaryTeachingStyle;
    if (body.supplementaryMaterials !== undefined) profileData.supplementaryMaterials = body.supplementaryMaterials;
    if (body.studentAttentionTechnique !== undefined) profileData.studentAttentionTechnique = body.studentAttentionTechnique;

    //console.log("DEBUG: profileData to update:", JSON.stringify(profileData, null, 2));
    
    const profile = await profileService.createOrUpdateProfile(userId, profileData);
    //console.log("DEBUG: profile after save:", JSON.stringify(profile, null, 2));
    
    return res.json(profile);
  } catch (err) {
    console.error("DEBUG: error in updateProfile:", err);
    return res.status(500).json({ error: err.message });
  }
}
