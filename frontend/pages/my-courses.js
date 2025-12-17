import Layout from "../components/Layout";
import { useCourses } from "../context/CourseContext";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function MyCourses() {
  const { courses, reloadCourses } = useCourses();
  const { user, initialized } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (initialized && !user) router.push("/");
  }, [initialized, user]);

  async function handleDeleteCourse(courseId, courseName) {
    if (!confirm(`Are you sure you want to delete "${courseName}"? This cannot be undone.`)) return;
    
    setDeleting(courseId);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;
      const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      
      const res = await fetch(`${API_BASE}/api/courses/${courseId}`, {
        method: "DELETE",
        headers,
      });
      
      if (res && res.ok) {
        if (typeof reloadCourses === "function") {
          reloadCourses();
        }
      } else {
        alert("Failed to delete course");
      }
    } catch (err) {
      console.error("Could not delete course", err);
      alert("Error deleting course");
    } finally {
      setDeleting(null);
    }
  }

  if (!initialized) return null;
  if (!user) return null;

  return (
    <Layout>
      <Head>
        <title>My Courses - Teacher's Copilot</title>
      </Head>
      <div className="mb-6">
        <h2 className="text-xl font-bold">My Courses</h2>
        <p className="text-sm text-slate-500">Saved courses</p>
      </div>

      <div className="bg-white p-6 rounded shadow">
        {courses.length === 0 && <div className="text-sm text-slate-500">No saved courses yet.</div>}
        <div className="space-y-4">
          {courses.map(c => (
            <div key={c.id} className="flex justify-between items-center border rounded p-4">
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-slate-500">{c.branch} • {c.numLectures} lectures</div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDeleteCourse(c.id, c.name)}
                  disabled={deleting === c.id}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm font-medium shadow hover:bg-red-600 transition disabled:opacity-50"
                  title="Delete course"
                >
                  {deleting === c.id ? "..." : "🗑"}
                </button>
                
                {/* Link used directly (no <a>) */}
                <Link
                  href={`/course/${c.id}`}
                  className="bg-indigo-600 text-white px-3 py-1 rounded"
                >
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
