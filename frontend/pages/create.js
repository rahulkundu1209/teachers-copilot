// pages/create.js
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { useCourses } from "../context/CourseContext";

export default function CreateCoursePage() {
  const router = useRouter();
  const { user, initialized } = useAuth();
  const { addCourse } = useCourses();

  useEffect(() => {
    if (initialized && !user) router.push("/");
  }, [initialized, user]);

  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [numLectures, setNumLectures] = useState("");
  const [syllabusText, setSyllabusText] = useState("");
  const [additionalPrompt, setAdditionalPrompt] = useState("");
  const [uploadLabel, setUploadLabel] = useState("No file chosen");
  const [loading, setLoading] = useState(false);

  function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    setUploadLabel(f ? f.name : "No file chosen");
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: name || "Untitled Course",
      branch: branch || "General",
      numLectures: Number(numLectures) || 10,
      syllabusText,
      additionalPrompt,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      const generated = json?.course || {
        id: "course_" + Math.random().toString(36).slice(2, 8),
        name: payload.name,
        branch: payload.branch,
        numLectures: payload.numLectures,
        createdAt: payload.createdAt,
        topics:
          json?.topics?.length
            ? json.topics
            : createDummyTopics(payload.numLectures || 10),
      };

      addCourse(generated);
      router.push(`/course/${generated.id}`);
    } catch (err) {
      console.error(err);
      alert("Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="py-6">

        <h2 className="serif-head text-3xl font-bold mb-2">
          Plan Your Next Lesson? Let’s get started.
        </h2>

        {/* >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
             ONLY CHANGE YOU ASKED FOR:
             This wrapper background is now #F0F0F0
           <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< */}
        <div
          className="mt-6 rounded-2xl p-6"
          style={{ background: "#F0F0F0" }}
        >
          <div className="bg-white rounded-xl p-6 tc-card" style={{ background: "transparent" }}>
            <form onSubmit={handleGenerate} className="space-y-6">

              {/* Course Name */}
              <div className="grid grid-cols-12 items-center gap-4">
                <label className="col-span-2 text-sm font-medium">Course Name :</label>
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
                <label className="col-span-2 text-sm font-medium">Branch Name :</label>
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
                    onChange={(e) => setSyllabusText(e.target.value)}
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
                        <path d="M12 5v10" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                        <path d="M7 10l5-5 5 5" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>

                    <div className="mt-3 text-sm">Upload Syllabus</div>
                    <div className="mt-2 text-xs text-gray-600">{uploadLabel}</div>

                    <input
                      id="create-file-input"
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Prompt */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium">Additional Prompt:</label>
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
