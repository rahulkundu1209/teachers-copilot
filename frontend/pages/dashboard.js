// pages/dashboard.js
import Layout from "../components/Layout";
import Link from "next/link";
import { useCourses } from "../context/CourseContext";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function DashboardPage() {
  const { courses } = useCourses();
  const { user, initialized } = useAuth();
  const router = useRouter();
  // start as unavailable so navigation is blocked until health check confirms
  const [backendAvailable, setBackendAvailable] = useState(false);

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
      }
    }

    check();
    const id = setInterval(check, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  // Keep existing guard but only run after initialization
  useEffect(() => {
    if (initialized && !user) router.push("/");
  }, [initialized, user]);

  // Block back navigation on dashboard (only via physical back button)
  useEffect(() => {
    // Only add popstate listener if we're actually on the dashboard
    if (router.pathname !== "/dashboard") return;

    if (typeof window !== "undefined") {
      const handlePopState = (e) => {
        // User pressed back button - stay on dashboard by preventing default navigation
        e.preventDefault();
        // Replace history entry instead of pushing, to avoid accumulating fake entries
        window.history.replaceState(null, "", window.location.href);
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [router.pathname]);

  // wait until auth initialized to avoid redirect race
  if (!initialized) return null;

  // if user is missing after initialization, return null (redirect will run)
  if (!user) return null;

  function handleCreateClick(e) {
    e.preventDefault();
    if (!initialized) return; // avoid race
    if (!user) router.push("/");
    else {
      if (!backendAvailable) {
        try { alert("Backend unavailable — start backend to create a course."); } catch (err) {}
        return;
      }
      router.push("/create");
    }
  }

  return (
    <Layout>
      <div className="pt-4 pb-8">
        <div className="flex items-start gap-6">
          <div>
            <h1 className="serif-head text-4xl font-bold">Welcome back, {user.name || "hello"}!</h1>
            <p className="mt-4 text-lg text-gray-700">Ready to plan an engaging lesson? Let's get started.</p>
          </div>
        </div>

        {/* big card + centered create square button */}
        <div className="mt-12">
          <div className="bg-white tc-card p-8 rounded-lg" style={{ minHeight: 420 }}>
            <div className="h-80 flex items-center justify-center">
              <button
                onClick={handleCreateClick}
                className="inline-flex items-center justify-center rounded-xl"
                aria-label="Create New Course"
                style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
              >
                <div
                  className="create-square flex items-center justify-center"
                  style={{
                    background: "var(--tc-accent)",
                    width: 200,
                    height: 200,
                    borderRadius: 12,
                    color: "white",
                    boxShadow: "0 6px 14px rgba(0,0,0,0.06)"
                  }}
                >
                  <div className="flex flex-col items-center justify-center">
                    <div style={{ fontSize: 24, lineHeight: "30px", marginBottom: 6, fontWeight: 800, textAlign: "center" }}>
                      Create New<br />Course
                    </div>
                    <div style={{ fontSize: 100, fontWeight: 900, lineHeight: "70px" }}>+</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Recent courses */}
          <div className="mt-8">
            <div className="bg-white tc-card p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">My recent courses</h3>
              <div className="text-sm text-gray-500">
                {courses.length === 0 ? "No saved courses yet. Create one to get started." : ""}
              </div>

              {courses.slice(0, 5).map((c) => (
                <div key={c.id} className="mt-4 flex items-center justify-between py-3 px-4 rounded" style={{ background: "#faf9f7" }}>
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.branch} • {c.numLectures} lectures</div>
                  </div>
                  <Link href={`/course/${c.id}`} className="text-sm text-indigo-700">
                    Open
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
