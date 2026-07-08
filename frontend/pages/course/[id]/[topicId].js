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
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false);
  const [selectedAssessmentAnswers, setSelectedAssessmentAnswers] = useState({});
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false);
  const [assessmentSubmissions, setAssessmentSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionsError, setSubmissionsError] = useState("");

  const [hasSubmittedAssessment, setHasSubmittedAssessment] =
  useState(false);
const [checkingAssessmentStatus, setCheckingAssessmentStatus] =
  useState(false);

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

  useEffect(() => {
    if (!assessmentModalOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setAssessmentModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [assessmentModalOpen]);

  useEffect(() => {
    if (!assessmentModalOpen) {
      setAssessmentSubmitted(false);
    }
  }, [assessmentModalOpen]);

  const isStudent = user?.role === "student";
  const backHref = course?.id ? `/course/${course.id}` : "/my-courses";
  const rootHref = isStudent ? "/studdashboard" : "/my-courses";
  const rootLabel = isStudent ? "Student Dashboard" : "My Courses";

  useEffect(() => {
  if (!isStudent || !course?.id || !topic?.id) return;

  async function checkAssessmentStatus() {
    setCheckingAssessmentStatus(true);

    try {
      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("tc_token");

      const res = await fetch(
        `${API_BASE}/api/assessments/${course.id}/${topic.id}/status`,
        {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        }
      );

      const data = await res.json();

      if (res.ok) {
        setHasSubmittedAssessment(Boolean(data.hasSubmitted));
      }
    } catch (err) {
      console.error("Could not check assessment status", err);
    } finally {
      setCheckingAssessmentStatus(false);
    }
  }

  checkAssessmentStatus();
}, [isStudent, course?.id, topic?.id]);

  const openAssessmentModal = () => {
    setSelectedAssessmentAnswers({});
    setAssessmentSubmitted(false);
    setAssessmentResult(null);
    setAssessmentModalOpen(true);
  };

  const closeAssessmentModal = () => {
    setAssessmentModalOpen(false);
  };

  const handleChoiceSelect = (questionIndex, choice) => {
    setSelectedAssessmentAnswers((current) => ({
      ...current,
      [questionIndex]: choice,
    }));
  };

  const handleAssessmentSubmit = async () => {
    if (!course || !topic || assessmentQuestions.length === 0) return;

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const responses = assessmentQuestions.reduce((accumulator, question, index) => {
        const key = String(question.id ?? index);
        if (selectedAssessmentAnswers[index] !== undefined) {
          accumulator[key] = selectedAssessmentAnswers[index];
        }
        return accumulator;
      }, {});

      const res = await fetch(`${API_BASE}/api/assessments/submit`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          courseId: course.id,
          topicId,
          responses,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit assessment");
      }

      setAssessmentSubmitted(true);
      setHasSubmittedAssessment(true);
      setAssessmentResult(data);
    } catch (err) {
      setAssessmentSubmitted(true);
      setAssessmentResult({ error: err.message || "Failed to submit assessment" });
    }
  };

  const openSubmissionsModal = async () => {
  if (!course || !topic) return;

  setSubmissionsModalOpen(true);
  setLoadingSubmissions(true);
  setSubmissionsError("");
  setAssessmentSubmissions([]);

  try {
    const API_BASE =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("tc_token")
        : null;

    const res = await fetch(
      `${API_BASE}/api/assessments/${course.id}/${topic.id}/submissions`,
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error || "Failed to load submissions"
      );
    }

    setAssessmentSubmissions(
      Array.isArray(data.submissions) ? data.submissions : []
    );
  } catch (err) {
    setSubmissionsError(
      err.message || "Failed to load submissions"
    );
  } finally {
    setLoadingSubmissions(false);
  }
};


  const assessmentQuestions = Array.isArray(assessmentsData) ? assessmentsData : [];

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
            {isStudent ? (
              assessmentsData !== null && assessmentQuestions.length > 0 ? (
                <button
      type="button"
      className="rounded bg-indigo-600 px-3 py-1 text-white disabled:cursor-not-allowed disabled:bg-slate-400"
      onClick={openAssessmentModal}
      disabled={
        checkingAssessmentStatus || hasSubmittedAssessment
      }
    >
      {checkingAssessmentStatus
        ? "Checking..."
        : hasSubmittedAssessment
          ? "Assessment Submitted"
          : "Take Assessment"}
    </button>
              ) : (
                <div className="text-slate-600">Assessment will appear here once your teacher generates it.</div>
              )
            ) : (
              <>

              <button
      type="button"
      className="mb-3 rounded bg-indigo-600 px-3 py-1 text-white"
      onClick={openSubmissionsModal}
    >
      Submitted Assessments
    </button>
                {assessmentsData === null && (
                  <button
                    className="rounded bg-slate-700 px-3 py-1 text-white"
                    onClick={fetchAssessments}
                    disabled={loadingAssessments}
                  >
                    {loadingAssessments ? "Generating assessments…" : "Generate Assessments"}
                  </button>
                )}
                {assessmentsError ? <div className="mt-2 text-red-600">{assessmentsError}</div> : null}
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
              </>
            )}
          </div>
        </div>
      </div>

      {isStudent && assessmentModalOpen && assessmentQuestions.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6"
          onClick={closeAssessmentModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Take Assessment</h3>
                <p className="text-sm text-slate-500">Answer the questions and submit when you are done.</p>
              </div>
              <button
                type="button"
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-200"
                onClick={closeAssessmentModal}
              >
                Close
              </button>
            </div>

            <div className="max-h-[calc(90vh-140px)] overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                {assessmentQuestions.map((question, questionIndex) => (
                  <div key={question.id || questionIndex} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 text-sm font-semibold text-slate-900">
                      Q{questionIndex + 1}. {question.question_text || question.title || "Question"}
                    </div>
                    {Array.isArray(question.choices) && question.choices.length > 0 ? (
                      <div className="space-y-2">
                        {question.choices.map((choice, choiceIndex) => {
                          const isSelected = selectedAssessmentAnswers[questionIndex] === choice;
                          return (
                            <button
                              key={choiceIndex}
                              type="button"
                              className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                                isSelected
                                  ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50"
                              }`}
                              onClick={() => handleChoiceSelect(questionIndex, choice)}
                            >
                              {choice}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-600">No options available for this question.</div>
                    )}
                  </div>
                ))}
              </div>

              {assessmentSubmitted || assessmentResult?.error ? (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  {assessmentResult?.error ? (
                    <div className="text-red-700">{assessmentResult.error}</div>
                  ) : (
                    <div>
                      Your assessment has been submitted. Score: {assessmentResult?.score ?? 0}/{assessmentResult?.maxScore ?? 0}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
              <div className="text-sm text-slate-500">
                {Object.keys(selectedAssessmentAnswers).length} of {assessmentQuestions.length} answered
              </div>
              <button
                type="button"
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                onClick={handleAssessmentSubmit}
                disabled={assessmentQuestions.length === 0 || assessmentSubmitted}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}


      {!isStudent && submissionsModalOpen && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6"
    onClick={() => setSubmissionsModalOpen(false)}
  >
    <div
      className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h3 className="text-lg font-semibold">
            Submitted Assessments
          </h3>
          <p className="text-sm text-slate-500">
            {topic.title}
          </p>
        </div>

        <button
          type="button"
          className="rounded bg-slate-100 px-3 py-1"
          onClick={() => setSubmissionsModalOpen(false)}
        >
          Close
        </button>
      </div>

      <div className="max-h-[65vh] overflow-y-auto p-6">
        {loadingSubmissions ? (
          <div className="text-slate-500">
            Loading submissions...
          </div>
        ) : submissionsError ? (
          <div className="text-red-600">
            {submissionsError}
          </div>
        ) : assessmentSubmissions.length === 0 ? (
          <div className="rounded-lg bg-slate-50 p-4 text-slate-500">
            No student has attempted this assessment yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="p-3">Student</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Submitted</th>
                </tr>
              </thead>

              <tbody>
                {assessmentSubmissions.map((submission) => (
                  <tr
                    key={submission.id}
                    className="border-b"
                  >
                    <td className="p-3 font-medium">
                      {submission.studentName}
                    </td>
                    <td className="p-3">
                      {submission.studentEmail}
                    </td>
                    <td className="p-3 font-semibold">
                      {submission.score}/{submission.maxScore}
                    </td>
                    <td className="p-3">
                      {submission.submittedAt
                        ? new Date(
                            submission.submittedAt
                          ).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  </div>
)}
    </>
  );

  return (
    isStudent && initialized
      ? <div className="min-h-screen bg-slate-50 text-slate-900 p-6">{content}</div>
      : <Layout>{content}</Layout>
  );
}
