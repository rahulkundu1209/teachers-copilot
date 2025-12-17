import Layout from "../components/Layout";
import { useCourses } from "../context/CourseContext";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function History() {
  const { history, reloadHistory } = useCourses();
  const { user, initialized } = useAuth();
  const router = useRouter();
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (initialized && !user) router.push("/");
  }, [initialized, user]);

  async function handleClearHistory() {
    if (!confirm("Are you sure you want to delete all history? This cannot be undone.")) return;
    
    setClearing(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;
      const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      
      const res = await fetch(`${API_BASE}/api/history`, {
        method: "DELETE",
        headers,
      });
      
      if (res && res.ok) {
        if (typeof reloadHistory === "function") {
          reloadHistory();
        }
      } else {
        let errText = `Failed to clear history (HTTP ${res?.status ?? "unknown"})`;
        try {
          const errJson = await res.json();
          errText = errJson.error || errText;
        } catch(e) {
          errText = `Failed to clear history - HTTP ${res?.status ?? "unknown"} (no JSON details)`;
        }
        console.error("Failed to clear history:", errText, "Status:", res?.status);
        alert(errText);
      }
    } catch (err) {
      console.error("Could not clear history", err);
      alert("Error clearing history: " + err.message);
    } finally {
      setClearing(false);
    }
  }

  if (!initialized) return null;
  if (!user) return null;

  return (
    <Layout>
      <Head>
        <title>History - Teacher's Copilot</title>
      </Head>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">History</h2>
          <p className="text-sm text-slate-500">Recent actions</p>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            disabled={clearing}
            className="px-4 py-2 bg-red-500 text-white rounded text-sm font-medium shadow hover:bg-red-600 transition disabled:opacity-50"
          >
            {clearing ? "Clearing..." : "Clear all history"}
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded shadow">
        {history.length === 0 && <div className="text-sm text-slate-500">No history yet.</div>}
        <div className="space-y-3">
          {history.map(h => {
            const displayText = h.data?.name || JSON.stringify(h.data);
            const typeLabel = h.type.replaceAll("_", " ");
            return (
              <div key={h.id} className="border rounded p-3">
                <div className="font-bold text-sm">{typeLabel} = {displayText}</div>
                <div className="text-xs text-slate-500 mt-1">{new Date(h.time).toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
