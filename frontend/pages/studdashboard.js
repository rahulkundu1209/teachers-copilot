import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useAuth } from "../context/AuthContext";
import { useCourses } from "../context/CourseContext";

const courses = [
  { id: "course-1", name: "Math Basics", branch: "Science", numLectures: 12 },
  { id: "course-2", name: "Communication Skills", branch: "Arts", numLectures: 9 },
  { id: "course-3", name: "Computer Fundamentals", branch: "Technology", numLectures: 14 },
];

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user, initialized, logout } = useAuth();
  const { courses, reloadCourses } = useCourses();
  const [courseCode, setCourseCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    if (initialized && !user) router.replace("/");
    if (initialized && user && user.role !== "student") router.replace("/dashboard");
  }, [initialized, user, router]);

  const initials = useMemo(() => {
    const source = user?.name || "Student";
    return source
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [user]);

  function handleJoinCourse(e) {
    e.preventDefault();
    const code = courseCode.trim().toUpperCase();

    if (!code) {
      setJoinError("Enter a course code");
      return;
    }

    if (!/^[A-Z0-9]{6}$/.test(code)) {
      setJoinError("Course code must be 6 alphanumeric characters");
      return;
    }

    setLoading(true);
    setJoinError("");

    (async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;
        const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

        const res = await fetch(`${API_BASE}/api/courses/join`, {
          method: "POST",
          headers,
          body: JSON.stringify({ code }),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Could not join course");
        }

        if (typeof reloadCourses === "function") {
          await reloadCourses();
        }

        setCourseCode("");
        router.push(`/course/${data.courseId}`);
      } catch (err) {
        setJoinError(err.message || "Could not join course");
      } finally {
        setLoading(false);
      }
    })();
  }

  function handleSignOut() {
    if (typeof logout === "function") logout();
    router.replace("/");
  }

  return (
    <div className="min-h-screen flex bg-[linear-gradient(135deg,#edf2f7_0%,#f7f3ea_48%,#e6eef7_100%)] text-slate-900">
      <Head>
        <title>Student Dashboard - Teacher's Copilot</title>
      </Head>

      <aside className="w-72 max-w-[85vw] min-h-screen flex flex-col justify-between bg-[#eef2f6]/95 backdrop-blur border-r border-white/70 shadow-[0_0_40px_rgba(15,23,42,0.06)]">
        <div>
          <div className="px-6 py-6 border-b border-slate-200/70">
            <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Teacher's Copilot</div>
            <div className="mt-2 text-2xl font-semibold text-[#0b1220]">Student Space</div>
            <p className="mt-2 text-sm text-slate-600 leading-6">Track your joined courses, enter a course code, and keep everything in one place.</p>
          </div>

          <nav className="px-4 py-6">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 px-2 mb-3">Menu</div>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#dbe5ef] text-left shadow-sm hover:bg-[#cfdae6] transition">
              <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                <CoursesIcon className="w-5 h-5 text-[#35506b]" />
              </span>
              <span>
                <span className="block font-semibold text-[#0b1220]">Course Joined</span>
                <span className="block text-xs text-slate-600">Courses you are enrolled in</span>
              </span>
            </button>
          </nav>

          <div className="px-4 pt-2">
            <div className="rounded-3xl bg-white/80 border border-white shadow-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#35506b] to-[#6e879f] text-white flex items-center justify-center font-semibold">
                  {initials || "S"}
                </div>
                <div>
                  <div className="font-semibold text-[#0b1220]">{user?.name || "Student"}</div>
                  <div className="text-xs text-slate-500">{user?.email || "student@example.com"}</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowProfile(true)}
                  className="text-sm font-medium text-[#35506b] hover:text-[#223548] transition"
                >
                  View profile
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 text-xs text-slate-500">Joined as student</div>
      </aside>

      <main className="flex-1 px-6 py-8 lg:px-10 xl:px-14">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm text-slate-600 shadow-sm border border-white/70">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Student dashboard
              </div>
              <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-[#0b1220]">
                Welcome back, {user?.name || "learner"}
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-slate-600 leading-8">
                Enter your course code to join a class, then check the courses you already have access to.
              </p>
            </div>
          </div>

          <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-[2rem] bg-white/80 backdrop-blur border border-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6 md:p-8 min-h-[420px] flex items-center justify-center">
              <form onSubmit={handleJoinCourse} className="w-full max-w-xl">
                <div className="text-center mb-8">
                  <div className="mx-auto w-20 h-20 rounded-3xl bg-[linear-gradient(135deg,#35506b_0%,#5f7f97_100%)] text-white flex items-center justify-center shadow-lg">
                    <span className="text-6xl font-light leading-none">+</span>
                  </div>
                  <h2 className="mt-6 text-2xl md:text-3xl font-semibold text-[#0b1220]">Enter course code</h2>
                  <p className="mt-2 text-sm md:text-base text-slate-500">Use the code shared by your teacher to join a course.</p>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => {
                      setCourseCode(e.target.value.toUpperCase());
                      if (joinError) setJoinError("");
                    }}
                    placeholder="Enter course code"
                    className="w-full h-16 rounded-2xl px-5 text-lg tracking-[0.12em] uppercase border border-slate-200 bg-[#eef4f8] text-[#0b1220] placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#a9bfd3]/30"
                  />

                  {joinError ? <div className="text-sm text-red-600">{joinError}</div> : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 rounded-2xl bg-[linear-gradient(135deg,#35506b_0%,#4e6f86_100%)] text-white font-semibold text-lg shadow-[0_14px_30px_rgba(53,80,107,0.28)] transition hover:translate-y-[-1px] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Joining..." : "Join course"}
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] bg-white/80 backdrop-blur border border-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-[#0b1220]">Joined courses</h3>
                  <span className="text-sm text-slate-500">{courses.length} total</span>
                </div>

                <div className="space-y-3">
                  {courses.length === 0 ? (
                    <div className="rounded-2xl bg-[#edf2f7] px-4 py-4 text-sm text-slate-500">
                      No joined courses yet. Enter a code to join your first class.
                    </div>
                  ) : (
                    courses.map((course) => (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => router.push(`/course/${course.id}`)}
                        className="w-full rounded-2xl bg-[#edf2f7] px-4 py-4 flex items-start justify-between gap-4 text-left hover:bg-[#e3ebf2] transition"
                      >
                        <div>
                          <div className="font-semibold text-[#0b1220]">{course.name}</div>
                          <div className="mt-1 text-sm text-slate-500">{course.branch} • {course.numLectures} lectures</div>
                        </div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#35506b]">Open</div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] bg-[linear-gradient(135deg,#eaf2f8_0%,#f8f5ef_100%)] border border-white shadow-[0_20px_60px_rgba(15,23,42,0.06)] p-6">
                <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500 mb-2">Tip</div>
                <div className="text-base text-slate-700 leading-7">
                  Keep your course code handy. After you join, this section can be expanded to show live assignments, notices, and progress.
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {showProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4"
          onClick={() => setShowProfile(false)}
        >
          <div
            className="w-full max-w-md rounded-[1.75rem] bg-white shadow-[0_25px_80px_rgba(15,23,42,0.22)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 bg-[linear-gradient(135deg,#35506b_0%,#6e879f_100%)] text-white">
              <div className="text-xs uppercase tracking-[0.24em] opacity-80">Student profile</div>
              <h3 className="mt-2 text-2xl font-semibold">Your details</h3>
            </div>

            <div className="px-6 py-6 space-y-4">
              <ProfileRow label="Name" value={user?.name || "Student"} />
              <ProfileRow label="Email" value={user?.email || "-"} />
              <ProfileRow label="Department" value={user?.department || "-"} />
            </div>

            <div className="px-6 pb-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowProfile(false)}
                className="h-11 px-5 rounded-xl bg-[#35506b] text-white font-medium hover:bg-[#223548] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-1 text-base font-medium text-slate-900 break-words">{value}</div>
    </div>
  );
}

function CoursesIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4 6h16v2H4zM4 10h16v2H4zM4 14h10v2H4z" />
    </svg>
  );
}