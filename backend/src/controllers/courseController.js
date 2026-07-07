import * as courseService from "../services/courseService.js";
import * as historyService from "../services/historyService.js";

export async function list(req, res) {
  try {
    const user = req.user || {};
    const courses = await courseService.listCourses(user);
    return res.json(courses);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function create(req, res) {
  try {
    const user = req.user;
    const email = user && user.email;
    const body = req.body || {};
    const course = await courseService.createCourse(email, body);
    return res.status(201).json(course);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getOne(req, res) {
  try {
    const user = req.user;
    const email = user && user.email;
    const id = req.params.id;
    const c = await courseService.getCourse(email, id);
    if (!c) return res.status(404).json({ error: "Not found" });
    return res.json(c);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function update(req, res) {
  try {
    const user = req.user;
    const email = user && user.email;
    const id = req.params.id;
    const updated = await courseService.updateCourse(email, id, req.body || {});
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function remove(req, res) {
  try {
    const user = req.user;
    const email = user && user.email;
    const id = req.params.id;
    
    // Get course details before deletion for history
    const course = await courseService.getCourse(email, id);
    if (!course) return res.status(404).json({ error: "Not found" });
    
    const ok = await courseService.deleteCourse(email, id);
    if (!ok) return res.status(404).json({ error: "Not found" });
    
    // Record deletion in history
    try {
      await historyService.addHistory(email, {
        type: "deleted_course",
        data: { courseId: id, name: course.name }
      });
    } catch (histErr) {
      console.warn("Could not record course deletion in history:", histErr);
      // Don't fail the deletion if history recording fails
    }
    
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function joinByCode(req, res) {
  try {
    const user = req.user || {};
    if (user.role !== "student") {
      return res.status(403).json({ error: "Only students can join by code" });
    }

    const { code } = req.body || {};
    const joinedCourse = await courseService.joinCourseByCode(user.email, code);

    return res.json({
      ok: true,
      courseId: joinedCourse.id,
      course: joinedCourse,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || "Could not join course" });
  }
}
