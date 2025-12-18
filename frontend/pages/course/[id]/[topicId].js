import { useRouter } from "next/router";
import Layout from "../../../components/Layout";
import { useCourses } from "../../../context/CourseContext";
import { useEffect, useState } from "react";

export default function TopicPage() {
  const router = useRouter();
  const { id, topicId } = router.query;
  const { getCourseById } = useCourses();
  const course = getCourseById(id);
  
  const [slideUrl, setSlideUrl] = useState("");

  useEffect(() => {
    if (!topicId) return;
    // Fetch slide URL from backend
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const topic = (course && course.topics || []).find(t => String(t.id) === String(topicId));
    const reqBody = { subject: course ? course.name : "General", description: topic && topic.content };
    fetch(`${API_BASE}/api/select`, { method: "POST", headers, body: JSON.stringify(reqBody) })
    .then(res => res.json())
    .then(data => {
      console.log("Fetched slide URL data:", data);
      setSlideUrl(data.url);
    })
    .catch(err => {
      console.error("Failed to fetch slide URL", err);
    });
  }, [course]);

  const openSlideHandler = (e) => {
    e.preventDefault();
    if(slideUrl){
      window.open(slideUrl, "_blank");
    } else {
      alert("Slide URL not available");
    }
  };

  if (!course) return <Layout><div className="bg-white p-6 rounded shadow">Loading…</div></Layout>;

  const topic = (course.topics || []).find(t => String(t.id) === String(topicId));
  if (!topic) return <Layout><div className="bg-white p-6 rounded shadow">Topic not found</div></Layout>;

  return (
    <Layout>
      <div className="mb-4">
        <h2 className="text-xl font-bold">{topic.title}</h2>
        <div className="text-sm text-slate-500">Part of course: {course.name}</div>
      </div>

      <div className="bg-white p-6 rounded shadow space-y-6">
        <div>
          <h3 className="font-semibold mb-2">Lecture content</h3>
          <div className="text-sm text-slate-700 whitespace-pre-wrap">{topic.content || "No detailed content (placeholder)."}</div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Slides outline</h3>
          <div className="text-sm text-slate-700">
            {slideUrl ? <button className="bg-indigo-600 text-white px-3 py-1 rounded" onClick={openSlideHandler}>Open Slides</button> : "Loading slides…"}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Quiz (sample)</h3>
          <div className="text-sm text-slate-700">{topic.quiz || "1. Sample question?"}</div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Assignments</h3>
          <div className="text-sm text-slate-700">{topic.assignments || "Assignment description placeholder."}</div>
        </div>
      </div>
    </Layout>
  );
}
