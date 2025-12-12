import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { useCourses } from "../../context/CourseContext";
import Link from "next/link";

export default function CoursePage() {
  const router = useRouter();
  const { id } = router.query;
  const { getCourseById } = useCourses();
  const course = getCourseById(id);

  if (!course) {
    return (
      <Layout>
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-lg font-semibold">Course not found</h3>
          <p className="text-sm text-slate-500">The course data is not available in local state. Try reloading or check My Courses.</p>

          <Link href="/my-courses" className="inline-block mt-4 bg-indigo-50 text-indigo-600 px-3 py-1 rounded">
            My Courses
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">{course.name}</h2>
          <div className="text-sm text-slate-500">{course.branch} • {course.numLectures} lectures</div>
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
    </Layout>
  );
}
