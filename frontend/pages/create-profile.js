// pages/create-profile.js  (F6 + F7) — full updated file
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

export default function CreateProfile() {
  const { user, updateProfile, initialized } = useAuth();
  const router = useRouter();

  // allow arriving from register flow even when user is not set yet
  useEffect(() => {
    if (!router.isReady) return;
    const fromRegister = router.query?.from === "register";
    if (initialized && !user && !fromRegister) {
      router.push("/");
    }
  }, [user, initialized, router.isReady, router.query]);

  const [tab, setTab] = useState("professional");
  const [errors, setErrors] = useState({});
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [jobTitle, setJobTitle] = useState("");
  const [expertise, setExpertise] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");

  const [teachingStyle, setTeachingStyle] = useState("");
  const [suppMaterials, setSuppMaterials] = useState("");
  const [technique, setTechnique] = useState("");

  // Prevent back navigation on this flow (simple client guard)
  useEffect(() => {
    if (!router.isReady) return;
    // Allow normal navigation when editing from settings
    if (router?.query?.mode === "edit") return;

    // Seed an extra history entry so first back press stays on this page
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", window.location.href);
    }

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const handlePopState = () => {
      if (typeof window !== "undefined") {
        window.history.pushState(null, "", window.location.href);
        window.alert(`${window.location.host} says complete the create profile and save.`);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", handleBeforeUnload);
      window.addEventListener("popstate", handlePopState);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.removeEventListener("popstate", handlePopState);
      }
    };
  }, [router]);

  // Fetch existing profile from backend when in edit mode
  useEffect(() => {
    if (!router.isReady) return;
    const isEditMode = router?.query?.mode === "edit";
    if (!isEditMode) return;

    async function loadProfile() {
      setLoadingProfile(true);
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;
        if (!token) return;

        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`${API_BASE}/api/profile`, { headers });
        
        if (res && res.ok) {
          const profile = await res.json();
          setJobTitle(profile.jobTitle || "");
          setExpertise(profile.expertise || "");
          setCountry(profile.locationCountry || "");
          setBio(profile.briefBio || "");
          setTeachingStyle(profile.primaryTeachingStyle || "");
          setSuppMaterials(profile.supplementaryMaterials || "");
          setTechnique(profile.studentAttentionTechnique || "");
        }
      } catch (err) {
        console.error("Could not load profile", err);
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfile();
  }, [router.isReady, router.query]);

  function saveProfessional(e) {
    e?.preventDefault();
    const newErrors = {};
    if (!jobTitle.trim()) newErrors.jobTitle = "Job title is required";
    if (!expertise.trim()) newErrors.expertise = "Expertise is required";
    if (!country.trim()) newErrors.country = "Country is required";
    if (!bio.trim()) newErrors.bio = "Bio is required";
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    // Save professional info to backend
    (async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;
        const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
        
        await fetch(`${API_BASE}/api/profile`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            jobTitle,
            expertise,
            locationCountry: country,
            briefBio: bio,
          }),
        });
      } catch (err) {
        console.error("Could not save professional info", err);
      }
    })();

    if (typeof updateProfile === "function") updateProfile({ jobTitle, expertise, country, bio }, false);
    setTab("teaching");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveTeaching(e) {
    e?.preventDefault();
    const newErrors = {};
    if (!teachingStyle.trim()) newErrors.teachingStyle = "Teaching style is required";
    if (!suppMaterials.trim()) newErrors.suppMaterials = "Supplementary materials are required";
    if (!technique.trim()) newErrors.technique = "Technique is required";
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    // Save teaching info to backend
    (async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;
        const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
        
        await fetch(`${API_BASE}/api/profile`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            primaryTeachingStyle: teachingStyle,
            supplementaryMaterials: suppMaterials,
            studentAttentionTechnique: technique,
          }),
        });
      } catch (err) {
        console.error("Could not save teaching info", err);
      }
    })();

    if (typeof updateProfile === "function") updateProfile({ teachingStyle, suppMaterials, technique }, true);
    
    // Check if in edit mode from settings
    const isEditMode = router?.query?.mode === "edit";
    
    if (isEditMode) {
      router.replace("/settings");
    } else {
      router.replace("/dashboard");
    }
  }

  // while auth initializing, render nothing (avoids race)
  if (!initialized && !router.query?.from) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center py-12">
      <div className="w-full max-w-5xl p-8 bg-white rounded-2xl shadow">
        <h2 className="text-2xl font-semibold mb-6">
          {router?.query?.mode === "edit" ? "Edit Profile" : "Create Profile"}
        </h2>

        <div className="flex gap-16 mb-8 items-center justify-center">
          <button
            type="button"
            onClick={() => setTab("professional")}
            className="flex items-center gap-2 focus:outline-none"
            aria-pressed={tab === "professional"}
          >
            <span
              className={`w-3 h-3 rounded-full border-2 ${
                tab === "professional" ? "border-gray-800 bg-gray-800" : "border-gray-400 bg-transparent"
              }`}
              aria-hidden="true"
            ></span>

            <span className={`text-sm ${tab === "professional" ? "font-semibold text-black" : "text-gray-500"}`}>
              Professional Snapshot
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              // Require professional snapshot first
              const newErrors = {};
              if (!jobTitle.trim()) newErrors.jobTitle = "Job title is required";
              if (!expertise.trim()) newErrors.expertise = "Expertise is required";
              if (!country.trim()) newErrors.country = "Country is required";
              if (!bio.trim()) newErrors.bio = "Bio is required";
              setErrors(newErrors);
              if (Object.keys(newErrors).length) return;
              setTab("teaching");
            }}
            className="flex items-center gap-2 focus:outline-none"
            aria-pressed={tab === "teaching"}
          >
            <span
              className={`w-3 h-3 rounded-full border-2 ${
                tab === "teaching" ? "border-gray-800 bg-gray-800" : "border-gray-400 bg-transparent"
              }`}
              aria-hidden="true"
            ></span>

            <span className={`text-sm ${tab === "teaching" ? "font-semibold text-black" : "text-gray-500"}`}>
              Teaching Style
            </span>
          </button>
        </div>

        {tab === "professional" && (
          <form onSubmit={saveProfessional} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Job Title</label>
              <input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Ex: Senior Lecturer"
                className="w-full rounded-md p-3 profile-placeholder"
                style={{ background: "#909DAE", color: "#0B1220", border: "none" }}
              />
              {errors.jobTitle && <p className="text-red-600 text-xs mt-1">{errors.jobTitle}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Expertise</label>
              <select className="w-full rounded-md p-3 bg-white border" value={expertise} onChange={(e) => setExpertise(e.target.value)}>
                <option value="">Select an Option</option>
                <option>Computer Science</option>
                <option>Mathematics</option>
                <option>Business</option>
                <option>Electrical Engineering</option>
              </select>
              {errors.expertise && <p className="text-red-600 text-xs mt-1">{errors.expertise}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location Country</label>
              <select className="w-full rounded-md p-3 bg-white border" value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="">Select an Option</option>
                <option>India</option>
                <option>USA</option>
                <option>UK</option>
                <option>Other</option>
              </select>
              {errors.country && <p className="text-red-600 text-xs mt-1">{errors.country}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Brief Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell something about yourself"
                className="w-full rounded-md p-3 min-h-[160px] profile-placeholder"
                style={{ background: "#909DAE", color: "#0B1220", border: "none" }}
              />
              {errors.bio && <p className="text-red-600 text-xs mt-1">{errors.bio}</p>}
            </div>

            <div className="flex justify-end">
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">Next</button>
            </div>
          </form>
        )}

        {tab === "teaching" && (
          <form onSubmit={saveTeaching} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">What is Your Primary Teaching Style</label>
              <select className="w-full rounded-md p-3 bg-white border" value={teachingStyle} onChange={(e) => setTeachingStyle(e.target.value)}>
                <option value="">Select an Option</option>
                <option>Lecture & Discussion</option>
                <option>Project-based</option>
                <option>Blended / Hybrid</option>
                <option>Flipped Classroom</option>
              </select>
              {errors.teachingStyle && <p className="text-red-600 text-xs mt-1">{errors.teachingStyle}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">What types of supplementary materials do you prefer to use</label>
              <select className="w-full rounded-md p-3 bg-white border" value={suppMaterials} onChange={(e) => setSuppMaterials(e.target.value)}>
                <option value="">Select an Option</option>
                <option>Slides / PPT</option>
                <option>Quizzes</option>
                <option>Code labs</option>
                <option>Case studies</option>
              </select>
              {errors.suppMaterials && <p className="text-red-600 text-xs mt-1">{errors.suppMaterials}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Preferred technique you already follow to maintain student attention</label>
              <textarea
                value={technique}
                onChange={(e) => setTechnique(e.target.value)}
                placeholder="Your Answer"
                className="w-full rounded-md p-3 min-h-[160px] profile-placeholder"
                style={{ background: "#909DAE", color: "#0B1220", border: "none" }}
              />
              {errors.technique && <p className="text-red-600 text-xs mt-1">{errors.technique}</p>}
            </div>

            <div className="flex justify-end">
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">Save</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
