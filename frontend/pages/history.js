import Layout from "../components/Layout";
import { useCourses } from "../context/CourseContext";

export default function History() {
  const { history } = useCourses();

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-xl font-bold">History</h2>
        <p className="text-sm text-slate-500">Recent actions</p>
      </div>

      <div className="bg-white p-6 rounded shadow">
        {history.length === 0 && <div className="text-sm text-slate-500">No history yet.</div>}
        <div className="space-y-3">
          {history.map(h => (
            <div key={h.id} className="border rounded p-3">
              <div className="font-medium">{h.type.replaceAll("_", " ")}</div>
              <div className="text-xs text-slate-500">{JSON.stringify(h.data)} • {new Date(h.time).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
