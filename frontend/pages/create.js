// pages/create.js
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { useCourses } from "../context/CourseContext";
import Head from "next/head";

// This page requires the backend to be running. We poll the health endpoint
// and redirect back to dashboard if the backend is unavailable.

export default function CreateCoursePage() {
  const router = useRouter();
  const { user, initialized } = useAuth();
  const { reloadCourses } = useCourses();
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [checkingBackend, setCheckingBackend] = useState(true);

  useEffect(() => {
    if (initialized && !user) router.push("/");
  }, [initialized, user]);

  useEffect(() => {
    let mounted = true;
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    async function check() {
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        if (!mounted) return;
        setBackendAvailable(!!(res && res.ok));
      } catch (err) {
        if (!mounted) return;
        setBackendAvailable(false);
      } finally {
        if (mounted) setCheckingBackend(false);
      }
    }

    check();
    const id = setInterval(check, 5000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [numLectures, setNumLectures] = useState("");
  const [syllabusText, setSyllabusText] = useState("");
  const [additionalPrompt, setAdditionalPrompt] = useState("");
  const [uploadLabel, setUploadLabel] = useState("No file chosen");
  const [loading, setLoading] = useState(false);

  const handleSyllabusChange = (e) => {
    let text = e.target.value;

    // Auto-format the text:
    // 1. Trim extra whitespace at start/end
    // 2. Replace multiple spaces with single space
    // 3. Replace multiple newlines with single newline
    // 4. Normalize spacing around punctuation

    text = text.trim(); // Remove leading/trailing spaces
    text = text.replace(/\s{2,}/g, " "); // Replace multiple spaces with single space
    text = text.replace(/\n{2,}/g, "\n"); // Replace multiple newlines with single newline
    text = text.replace(/\s+\n/g, "\n"); // Remove spaces before newlines

    setSyllabusText(text);
  };

  /*function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    setUploadLabel(f ? f.name : "No file chosen");
  }*/

  async function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    setUploadLabel(f ? f.name : "No file chosen");

    if (f && name) {
      try {
        // Use FormData instead of sending raw content
        const formData = new FormData();
        formData.append("file", f);
        formData.append("subjectName", name);

        const API_BASE =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("tc_token")
            : null;

        console.log("File content: ", f);
        const response = await fetch(`${API_BASE}/api/parse-syllabus`, {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            // Don't set Content-Type, let browser set it with boundary
          },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Extracted syllabus text:", data.extractedText);
          setSyllabusText(data.extractedText);
        } else {
          alert("Error parsing syllabus. Using full file content.");
          const fileContent = await f.text();
          console.log("Full file content:", fileContent);
          setSyllabusText(fileContent);
        }
      } catch (err) {
        console.error("File parse error:", err);
        alert("Error reading file: " + err.message);
      }
    } else if (f && !name) {
      alert(
        "Please enter a Course Name first to extract the relevant subject."
      );
    }
  }

  async function handleGenerate(e) {
    e.preventDefault();

    if (loading) return; // Prevent duplicate submissions

    if (!backendAvailable) {
      alert("Backend unavailable — start the backend to generate content.");
      return;
    }
    setLoading(true);

    const payload = {
      name: name || "Untitled Course",
      branch: branch || "General",
      numLectures: Number(numLectures) || 10,
      syllabusText,
      additionalPrompt,
    };

    try {
      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token =
        typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;

      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error || "Generation failed");
      }

      const json = await res.json();
      const generated = json?.course;

      if (generated) {
        // Reload courses from backend to show the new one
        await reloadCourses();
        router.push("/my-courses");
      } else {
        throw new Error("No course returned from backend");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Generation failed.");
      setLoading(false); // Reset on error
    }
  }

  return (
    <Layout>
      <Head>
        <title>Create course</title>
      </Head>
      <div className="py-6">
        {!checkingBackend && !backendAvailable && (
          <div className="mb-4 p-4 rounded bg-red-50 border border-red-200 text-red-800">
            Backend unavailable. Start the backend to use the Create flow.
          </div>
        )}

        <h2 className="serif-head text-3xl font-bold mb-2">
          Plan Your Next Lesson? Let’s get started.
        </h2>

        {/* >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
             ONLY CHANGE YOU ASKED FOR:
             This wrapper background is now #F0F0F0
           <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< */}
        <div className="mt-6 rounded-2xl p-6" style={{ background: "#F0F0F0" }}>
          <div
            className="bg-white rounded-xl p-6 tc-card"
            style={{ background: "transparent" }}
          >
            <form onSubmit={handleGenerate} className="space-y-6">
              {/* Course Name */}
              <div className="grid grid-cols-12 items-center gap-4">
                <label className="col-span-2 text-sm font-medium">
                  Course Name :
                </label>
                <div className="col-span-10">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='Example: "Introduction to Machine Learning"'
                    className="w-full rounded-lg p-3"
                    style={{ background: "#909DAE" }}
                  />
                </div>
              </div>

              {/* Branch Name */}
              <div className="grid grid-cols-12 items-center gap-4">
                <label className="col-span-2 text-sm font-medium">
                  Branch Name :
                </label>
                <div className="col-span-10">
                  <input
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder='Example: "Computer Science And Business Systems"'
                    className="w-full rounded-lg p-3"
                    style={{ background: "#909DAE" }}
                  />
                </div>
              </div>

              {/* Number of Lectures */}
              <div className="grid grid-cols-12 items-center gap-4">
                <label className="col-span-2 text-sm font-medium">
                  Number of Lectures Planned :
                </label>
                <div className="col-span-10">
                  <input
                    type="number"
                    min="1"
                    value={numLectures}
                    onChange={(e) => setNumLectures(e.target.value)}
                    placeholder='Example: "10" or "15"'
                    className="w-full rounded-lg p-3"
                    style={{ background: "#909DAE" }}
                  />
                </div>
              </div>

              {/* Syllabus */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <div className="col-span-2">
                  <label className="text-sm font-medium">
                    Enter a topic, subject, or paste a section of your syllabus:
                  </label>
                </div>

                {/* textarea */}
                <div className="col-span-7">
                  <textarea
                    value={syllabusText}
                    onChange={handleSyllabusChange}
                    placeholder="Paste syllabus here..."
                    className="w-full min-h-[160px] rounded-lg p-4"
                    style={{ background: "#909DAE" }}
                  />
                </div>

                {/* Upload Tile */}
                <div className="col-span-3">
                  <div className="upload-tile rounded-lg p-6 flex flex-col items-center justify-center">
                    <div className="text-sm font-semibold mb-3">OR</div>

                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("create-file-input").click()
                      }
                      className="w-20 h-20 bg-white rounded-md flex items-center justify-center shadow cursor-pointer"
                    >
                      <svg width="28" height="28" fill="none">
                        <path
                          d="M12 5v10"
                          stroke="#0f172a"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M7 10l5-5 5 5"
                          stroke="#0f172a"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>

                    <div className="mt-3 text-sm">Upload Syllabus</div>
                    <div className="mt-2 text-xs text-gray-600">
                      {uploadLabel}
                    </div>

                    <input
                      id="create-file-input"
                      type="file"
                      accept=".txt,.pdf,image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Prompt */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium">
                    Additional Prompt:
                  </label>
                </div>

                <div className="col-span-10">
                  <textarea
                    value={additionalPrompt}
                    onChange={(e) => setAdditionalPrompt(e.target.value)}
                    placeholder="Enter prompt here:"
                    className="w-full min-h-[100px] rounded-md p-4"
                    style={{ background: "#909DAE" }}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  disabled={loading}
                  type="submit"
                  className="btn-generate"
                  style={{ background: "var(--tc-generate)" }}
                >
                  {loading ? "Generating..." : "Generate Content"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function createDummyTopics(num = 8) {
  const arr = [];
  for (let i = 1; i <= num; i++) {
    arr.push({
      id: "t" + i,
      title: `Topic ${i}`,
      content: "Auto-generated",
    });
  }
  return arr;
}
