import { useRouter } from "next/router";
import Layout from "../../../components/Layout";
import { useCourses } from "../../../context/CourseContext";
import { useEffect, useState } from "react";
import Head from "next/head";
import Breadcrumb from "../../../components/Breadcrumb";
import { useAuth } from "../../../context/AuthContext";

export default function TopicPage() {
  const router = useRouter();
  const { id, topicId, google_connected } = router.query;
  const { getCourseById } = useCourses();
  const { user, initialized } = useAuth();
  const course = getCourseById(id);

  const [slideUrl, setSlideUrl] = useState("");
  const [loadingSlides, setLoadingSlides] = useState(false);
  const [slideError, setSlideError] = useState("");

  const topic = (course?.topics || []).find((t) => String(t.id) === String(topicId));

  useEffect(() => {
    if (!topic) return;
    if (topic.pptLink) {
      setSlideUrl(topic.pptLink);
    }
  }, [topic]);

  useEffect(() => {
    if (google_connected === "1" && topic) {
      createSlides();
      const newQuery = { ...router.query };
      delete newQuery.google_connected;
      router.replace({ pathname: router.pathname, query: newQuery }, undefined, {
        shallow: true,
      });
    }
  }, [google_connected, topic]);

  const createSlides = async () => {
    if (!topic || !course) return;

    setLoadingSlides(true);
    setSlideError("");

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const reqBody = {
        topicId,
        courseId: id,
        subject: course.name || "General",
        description: topic.content || "",
      };

      const res = await fetch(`${API_BASE}/api/select`, {
        method: "POST",
        headers,
        body: JSON.stringify(reqBody),
      });
      const data = await res.json();

      if (res.status === 403 && data.needsGoogleConnect) {
        const authUrlRes = await fetch(
          `${API_BASE}/api/google/auth-url?returnUrl=${encodeURIComponent(window.location.href)}`,
          { method: "GET", headers }
        );
        const authData = await authUrlRes.json();
        if (authUrlRes.ok && authData.url) {
          window.location.href = authData.url;
          return;
        }
        throw new Error(authData.error || "Failed to get Google auth URL");
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate slides");
      }

      if (!data.url) {
        throw new Error("No slide URL returned from backend");
      }

      setSlideUrl(data.url);
    } catch (err) {
      setSlideError(err.message || "Slide creation failed");
    } finally {
      setLoadingSlides(false);
    }
  };

  const openSlideHandler = (e) => {
    e.preventDefault();
    if (slideUrl) {
      window.open(slideUrl, "_blank");
    } else {
      alert("Slide URL not available");
    }
  };

  const isStudent = user?.role === "student";

  if (!course) {
    const fallback = <div className="bg-white p-6 rounded shadow">Loading…</div>;
    if (isStudent && initialized) {
      return <div className="min-h-screen bg-slate-50 text-slate-900 p-6">{fallback}</div>;
    }
    return <Layout>{fallback}</Layout>;
  }

  if (!topic) {
    const fallback = <div className="bg-white p-6 rounded shadow">Topic not found</div>;
    if (isStudent && initialized) {
      return <div className="min-h-screen bg-slate-50 text-slate-900 p-6">{fallback}</div>;
    }
    return <Layout>{fallback}</Layout>;
  }

  const content = (
    <>
      <Head>
        <title>{topic.title} | Teacher's Copilot</title>
      </Head>
      <Breadcrumb
        backHref={`/course/${course.id}`}
        items={[
          {
            label: "My Courses",
            href: "/my-courses",
          },
          {
            label: course.name,
            href: `/course/${course.id}`,
          },
          {
            label: topic.title,
          },
        ]}
      />

      <div className="mb-4">
        <h2 className="text-xl font-bold">{topic.title}</h2>
        <div className="text-sm text-slate-500">
          Part of course: {course.name}
        </div>
      </div>


      <div className="bg-white p-6 rounded shadow space-y-6">
        <div>
          <h3 className="font-semibold mb-2">Lecture content</h3>
          <div className="text-sm text-slate-700 whitespace-pre-wrap">{topic.content || "No detailed content (placeholder)."}</div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Slides outline</h3>
          <div className="text-sm text-slate-700">
            {slideUrl ? (
              <button className="bg-indigo-600 text-white px-3 py-1 rounded" onClick={openSlideHandler}>
                Open Slides
              </button>
            ) : (
              <button
                className="bg-indigo-600 text-white px-3 py-1 rounded"
                onClick={createSlides}
                disabled={loadingSlides}
              >
                {loadingSlides ? "Creating slides…" : "Create Slides"}
              </button>
            )}
            {slideError ? <div className="text-red-600 mt-2">{slideError}</div> : null}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Real World Analogy/Industry News</h3>
          <div className="text-sm text-slate-700">{topic.quiz || "Coming Soon..."}</div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Assessments</h3>
          <div className="text-sm text-slate-700">{topic.assignments || "Coming Soon..."}</div>
        </div>
      </div>
    </>
  );

  return (
    isStudent && initialized
      ? <div className="min-h-screen bg-slate-50 text-slate-900 p-6">{content}</div>
      : <Layout>{content}</Layout>
  );
}
