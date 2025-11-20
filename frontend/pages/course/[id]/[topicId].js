import { useRouter } from "next/router";
import Layout from "../../../components/Layout";
import { useCourses } from "../../../context/CourseContext";

export default function TopicPage() {
  const router = useRouter();
  const { id, topicId } = router.query;
  const { getCourseById } = useCourses();
  const course = getCourseById(id);

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
          <div className="text-sm text-slate-700">{topic.slides || "Slides outline placeholder."}</div>
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
