import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const CourseContext = createContext();

export function useCourses() {
  return useContext(CourseContext);
}

function generateId(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 9);
}

export function CourseProvider({ children }) {
  const [courses, setCourses] = useState([]);
  const [history, setHistory] = useState([]);
  const { user, initialized } = useAuth();

  async function loadCourses() {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [cRes, hRes] = await Promise.all([
        fetch(`${API_BASE}/api/courses`, { headers }),
        fetch(`${API_BASE}/api/history`, { headers }),
      ]);

      let cJson = [];
      let hJson = [];
      if (cRes && cRes.ok) cJson = await cRes.json();
      if (hRes && hRes.ok) hJson = await hRes.json();
      // Require backend responses. Do not fallback to localStorage here so
      // pages (My Courses / History) reflect backend state during testing.
      setCourses(Array.isArray(cJson) ? cJson : []);
      setHistory(Array.isArray(hJson) ? hJson : []);
    } catch (err) {
      // If backend is unavailable, set empty lists and surface the error.
      console.error("Error loading initial data (backend likely down)", err);
      setCourses([]);
      setHistory([]);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  // Reload courses/history when auth user changes
  useEffect(() => {
    if (!initialized) return;
    if (user) {
      loadCourses();
    } else {
      setCourses([]);
      setHistory([]);
    }
  }, [user, initialized]);

  useEffect(() => {
    localStorage.setItem("tc_courses", JSON.stringify(courses));
  }, [courses]);

  function addCourse(course) {
    const withId = { ...course, id: course.id || generateId("course_"), createdAt: new Date().toISOString() };
    // Persist to backend only. If backend call fails, do not fallback to localStorage.
    (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;
        const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_BASE}/api/courses`, { method: "POST", headers, body: JSON.stringify(withId) });
        if (res && res.ok) {
          const saved = await res.json();
          setCourses(prev => [saved, ...prev]);
          // record history to backend (best-effort)
          try { await fetch(`${API_BASE}/api/history`, { method: "POST", headers, body: JSON.stringify({ type: "created_course", data: { courseId: saved.id, name: saved.name } }) }); } catch(e){}
          return;
        }
        // If response is not ok, log and leave UI unchanged so tests reveal the backend error.
        console.error("Failed to create course on backend", res && (await res.text()).slice(0,200));
      } catch (err) {
        console.error("Error creating course (backend likely down)", err);
      }
    })();

    return withId; // return candidate but courses list will only be updated on successful backend response
  }

  function getCourseById(id) {
    return courses.find(c => String(c.id) === String(id));
  }

  const value = {
    courses,
    history,
    addCourse,
    getCourseById,
    reloadCourses: loadCourses,
    reloadHistory: loadCourses, // Same function loads both
  };

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}
