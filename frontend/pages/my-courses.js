import Layout from "../components/Layout";
import { useCourses } from "../context/CourseContext";
import Link from "next/link";

export default function MyCourses() {
  const { courses } = useCourses();

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-xl font-bold">My Courses</h2>
        <p className="text-sm text-slate-500">Saved courses (persisted to localStorage)</p>
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

              {/* Link used directly (no <a>) */}
              <Link
                href={`/course/${c.id}`}
                className="bg-indigo-600 text-white px-3 py-1 rounded"
              >
                Open
              </Link>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
