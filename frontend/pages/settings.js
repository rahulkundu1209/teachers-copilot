import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useRouter } from "next/router";

export default function Settings() {
  const { user, initialized } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialized && !user) router.push("/");
  }, [initialized, user]);

  useEffect(() => {
    async function load() {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/api/settings`, { headers });
        if (res && res.ok) {
          const j = await res.json();
          setSettings(j);
          return;
        }
      } catch (err) {
        console.warn("Could not load settings from backend, using defaults", err);
      }
      setSettings({ theme: "light" });
    }
    if (initialized) load();
  }, [initialized]);

  async function save(patch) {
    setSaving(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;
      const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const res = await fetch(`${API_BASE}/api/settings`, { method: "PUT", headers, body: JSON.stringify(patch) });
      if (res && res.ok) {
        const j = await res.json();
        setSettings(j);
        return;
      }
    } catch (err) {
      console.warn("Could not save settings to backend, applying locally", err);
    } finally {
      setSaving(false);
    }
    setSettings(prev => ({ ...(prev || {}), ...patch }));
  }

  if (!initialized) return null;
  if (!user) return null;

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Settings</h2>
        <p className="text-sm text-slate-500">Profile and preferences</p>
      </div>

      <div className="bg-white p-6 rounded shadow space-y-4">
        <div>
          <div className="text-sm font-medium">Theme</div>
          <div className="mt-2 flex gap-2">
            <button 
              onClick={() => setTheme('light')} 
              className={`px-4 py-2 rounded font-medium transition ${theme === 'light' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-900'}`}
            >
              Light
            </button>
            <button 
              onClick={() => setTheme('dark')} 
              className={`px-4 py-2 rounded font-medium transition ${theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-900'}`}
            >
              Dark
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold">Account</h3>
          <button
            onClick={() => router.push("/create-profile?mode=edit")}
            className="mt-2 inline-flex items-center px-4 py-2 rounded bg-blue-500 text-white text-sm font-medium shadow hover:bg-blue-600 transition"
          >
            Edit profile
          </button>
        </div>
      </div>
    </Layout>
  );
}
