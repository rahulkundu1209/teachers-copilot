import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { useCourses } from "../../context/CourseContext";
import Link from "next/link";
import Head from "next/head"
import { useState, useEffect } from "react";
import Breadcrumb from "../../components/Breadcrumb";
import { useAuth } from "../../context/AuthContext";

export default function CoursePage() {
  const router = useRouter();
  const { id } = router.query;
  const { getCourseById } = useCourses();
  const { user, initialized } = useAuth();
  const localCourse = getCourseById(id);
  const [remoteCourse, setRemoteCourse] = useState(null);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [courseError, setCourseError] = useState("");

  const course = localCourse || remoteCourse;

  

  async function copyJoinCode(code) {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      alert(`Course code ${code} copied`);
    } catch (err) {
      alert(`Could not copy code. Please copy it manually: ${code}`);
    }
  }

  const isStudent = user?.role === "student";
  const backHref = isStudent ? "/studdashboard" : "/my-courses";
  const backLabel = isStudent ? "Student Dashboard" : "My Courses";

  useEffect(() => {
    if (!id || localCourse) return;

    let mounted = true;

    async function loadCourse() {
      setLoadingRemote(true);
      setCourseError("");
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;

        const res = await fetch(`${API_BASE}/api/courses/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json().catch(() => null);

        if (!mounted) return;

        if (!res.ok) {
          throw new Error(data?.error || "Course not found");
        }

        setRemoteCourse(data);
      } catch (err) {
        if (mounted) {
          setCourseError(err.message || "Error fetching course");
        }
      } finally {
        if (mounted) setLoadingRemote(false);
      }
    }

    loadCourse();

    return () => {
      mounted = false;
    };
  }, [id, localCourse]);

  if (!course) {
    if (loadingRemote) {
      return (
        <Layout>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-lg font-semibold">Loading course…</h3>
            <p className="text-sm text-slate-500">Fetching the course details from the backend.</p>
          </div>
        </Layout>
      );
    }

    return (
      <Layout>
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-lg font-semibold">Course not found</h3>
          <p className="text-sm text-slate-500">{courseError || "The course data is not available in local state. Try reloading or check My Courses."}</p>

          <Link href="/my-courses" className="inline-block mt-4 bg-indigo-50 text-indigo-600 px-3 py-1 rounded">
            My Courses
          </Link>
        </div>
      </Layout>
    );
  }

  const content = (
    <>
      <Head>
        <title>course - {course?.name || "Loading"}</title>
      </Head>
      <div className={isStudent ? "py-6" : ""}>
        <Breadcrumb
          backHref={backHref}
          items={[
            {
              label: backLabel,
              href: backHref,
            },
            {
              label: course.name,
            },
          ]}
        />


        {course?.joinCode ? (
          <div className="mb-4 flex items-center gap-3 rounded-lg bg-slate-50 border px-4 py-3">
            <div className="text-sm text-slate-600">Join code:</div>
            <div className="font-semibold tracking-[0.2em]">{course.joinCode}</div>
            <button
              type="button"
              onClick={() => copyJoinCode(course.joinCode)}
              className="ml-auto bg-indigo-600 text-white px-3 py-1 rounded text-sm"
            >
              Copy code
            </button>
          </div>
        ) : null}

        <div className="flex items-center justify-between mb-4 ml-6">
          <div>
            <h2 className="text-xl font-bold">{course.name}</h2>
            <div className="text-sm text-slate-500">
              {course.branch} • {course.numLectures} lectures
            </div>
          </div>
        </div>


        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Lecture breakdown</h3>
          <div className="space-y-3">
            {Array.isArray(course.topics) && course.topics.map((t, idx) => (
              <div key={t.id || idx} className="flex justify-between items-center border rounded p-3">
                <div>
                  <div className="font-semibold">{idx + 1}. {t.title}</div>
                  <div className="text-xs text-slate-500">Description: {t.content}</div>
                </div>
                <div>
                  {/* Link to topic page without <a> */}
                  <Link
                    href={`/course/${course.id}/${t.id}`}
                    className="bg-indigo-600 text-white px-3 py-1 rounded"
                  >
                    Select
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  if (isStudent && initialized) {
    return <div className="min-h-screen bg-slate-50 text-slate-900">{content}</div>;
  }

  return <Layout>{content}</Layout>;
}
