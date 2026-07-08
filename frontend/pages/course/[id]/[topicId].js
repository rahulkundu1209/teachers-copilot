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
  const [pyqData, setPyqData] = useState(null);
  const [loadingPyq, setLoadingPyq] = useState(false);
  const [pyqError, setPyqError] = useState("");
  const [assessmentsData, setAssessmentsData] = useState(null);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [assessmentsError, setAssessmentsError] = useState("");

  const topic = (course?.topics || []).find((t) => String(t.id) === String(topicId));

  useEffect(() => {
    if (!topic) return;
    if (topic.pptLink) {
      setSlideUrl(topic.pptLink);
    }
    if (topic.pyqData && topic.pyqData.length) {
      setPyqData(topic.pyqData);
    } else {
      setPyqData(null);
    }
    if (topic.assessments && topic.assessments.length) {
      setAssessmentsData(topic.assessments);
    } else {
      setAssessmentsData(null);
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

  const fetchPYQs = async () => {
    if (!topic || !course) return;

    if (topic.pyqData && topic.pyqData.length) {
      setPyqData(topic.pyqData);
      return;
    }

    setLoadingPyq(true);
    setPyqError("");
    setPyqData(null);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch(`${API_BASE}/api/select/pyq`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          topicId,
          courseId: id,
          subject: course.name || "General",
          topic: topic.title || topic.content || "Topic",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch PYQs");
      }

      setPyqData(data.pyqs ?? data);
    } catch (err) {
      setPyqError(err.message || "Failed to fetch PYQs");
    } finally {
      setLoadingPyq(false);
    }
  };

  const fetchAssessments = async () => {
    if (!topic || !course) return;

    if (topic.assessments && topic.assessments.length) {
      setAssessmentsData(topic.assessments);
      return;
    }

    setLoadingAssessments(true);
    setAssessmentsError("");
    setAssessmentsData(null);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch(`${API_BASE}/api/select/assessments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          topicId,
          courseId: id,
          subject: course.name || "General",
          topic: topic.title || topic.content || "Topic",
          description: topic.content || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch assessments");
      }

      setAssessmentsData(data.assessments ?? data);
    } catch (err) {
      setAssessmentsError(err.message || "Failed to fetch assessments");
    } finally {
      setLoadingAssessments(false);
    }
  };

  const renderPyqContent = (payload) => {
    if (Array.isArray(payload)) {
      if (payload.length === 0) {
        return <div className="text-slate-600">No PYQ for this Topic</div>;
      }
      return payload.map((item, index) => {
        if (typeof item === "string") {
          return (
            <div key={index} className="mb-3 rounded border border-slate-200 bg-white p-3">
              {item}
            </div>
          );
        }
        if (typeof item === "object" && item !== null) {
          return (
            <div key={index} className="mb-3 rounded border border-slate-200 bg-white p-3">
              <div className="text-sm">
                {item.question_text && (
                  <div className="mb-2 font-medium">{item.question_text}</div>
                )}
                <div className="text-xs text-slate-600 space-y-1">
                  {item.marks && <div>Marks: {item.marks}</div>}
                  {item.year && <div>Year: {item.year}</div>}
                </div>
              </div>
            </div>
          );
        }
        return (
          <div key={index} className="mb-3 rounded border border-slate-200 bg-white p-3 text-xs">
            {String(item)}
          </div>
        );
      });
    }

    if (payload && typeof payload === "object") {
      if (payload.question_text) {
        return (
          <div className="rounded border border-slate-200 bg-white p-3">
            <div className="text-sm">
              <div className="mb-2 font-medium">{payload.question_text}</div>
              <div className="text-xs text-slate-600 space-y-1">
                {payload.marks && <div>Marks: {payload.marks}</div>}
                {payload.year && <div>Year: {payload.year}</div>}
              </div>
            </div>
          </div>
        );
      }
      return <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(payload, null, 2)}</pre>;
    }

    return <div className="text-slate-600">No PYQ for this Topic</div>;
  };

  useEffect(() => {
    if (topic && !topic.pyqData) {
      fetchPYQs();
    }
  }, [topic]);

  const isStudent = user?.role === "student";
  const backHref = course?.id ? `/course/${course.id}` : "/my-courses";
  const rootHref = isStudent ? "/studdashboard" : "/my-courses";
  const rootLabel = isStudent ? "Student Dashboard" : "My Courses";

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
        backHref={backHref}
        items={[
          {
            label: rootLabel,
            href: rootHref,
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
          <h3 className="font-semibold mb-2">Previous Year Questions</h3>
          <div className="text-sm text-slate-700">
            {pyqData === null && (
              <button
                className="bg-slate-700 text-white px-3 py-1 rounded"
                onClick={fetchPYQs}
                disabled={loadingPyq}
              >
                {loadingPyq ? "Loading PYQs…" : "Show PYQs"}
              </button>
            )}
            {pyqError ? <div className="text-red-600 mt-2">{pyqError}</div> : null}
            {pyqData !== null ? (
              <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-3">
                {renderPyqContent(pyqData)}
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Real World Analogy/Industry News</h3>
          <div className="text-sm text-slate-700">{topic.quiz || "Coming Soon..."}</div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Assessments</h3>
          <div className="text-sm text-slate-700">
            {assessmentsData === null && (
              <button
                className="bg-slate-700 text-white px-3 py-1 rounded"
                onClick={fetchAssessments}
                disabled={loadingAssessments}
              >
                {loadingAssessments ? "Generating assessments…" : "Generate Assessments"}
              </button>
            )}
            {assessmentsError ? <div className="text-red-600 mt-2">{assessmentsError}</div> : null}
            {assessmentsData !== null ? (
              <div className="mt-3 space-y-3">
                {Array.isArray(assessmentsData) && assessmentsData.length > 0 ? (
                  assessmentsData.map((q, idx) => (
                    <div key={q.id || idx} className="rounded border border-slate-200 bg-white p-3">
                      <div className="font-medium">Q{idx + 1} {q.type ? `(${q.type.toUpperCase()})` : ""}</div>
                      <div className="mt-1">{q.question_text || JSON.stringify(q)}</div>
                      {q.type === "mcq" && Array.isArray(q.choices) && (
                        <ul className="mt-2 list-disc list-inside text-sm text-slate-700">
                          {q.choices.map((c, ci) => (
                            <li key={ci}>{c}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-600">No assessments available for this topic.</div>
                )}
              </div>
            ) : null}
          </div>
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
