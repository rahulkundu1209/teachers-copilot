import React, { createContext, useContext, useState, useEffect } from "react";

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

  useEffect(() => {
    async function load() {
      try {
        const [cRes, hRes] = await Promise.all([
          fetch("/api/courses"),
          fetch("/api/history"),
        ]);
        const cJson = await cRes.json();
        const hJson = await hRes.json();
        const saved = localStorage.getItem("tc_courses");
        if (saved) {
          setCourses(JSON.parse(saved));
        } else {
          setCourses(Array.isArray(cJson) ? cJson : []);
          localStorage.setItem("tc_courses", JSON.stringify(Array.isArray(cJson) ? cJson : []));
        }
        setHistory(Array.isArray(hJson) ? hJson : []);
      } catch (err) {
        console.error("Error loading initial data", err);
      }
    }
    load();
  }, []);

  useEffect(() => {
    localStorage.setItem("tc_courses", JSON.stringify(courses));
  }, [courses]);

  function addCourse(course) {
    const withId = { ...course, id: course.id || generateId("course_"), createdAt: new Date().toISOString() };
    setCourses(prev => [withId, ...prev]);
    setHistory(prev => [{ id: generateId("h_"), type: "created_course", data: { courseId: withId.id, name: withId.name }, time: new Date().toISOString() }, ...prev]);
    return withId;
  }

  function getCourseById(id) {
    return courses.find(c => String(c.id) === String(id));
  }

  const value = {
    courses,
    history,
    addCourse,
    getCourseById,
  };

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}
