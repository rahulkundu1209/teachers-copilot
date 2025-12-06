import sample from "../../data/mockGeneratedCourses.json";

function generateId(prefix="g_") {
  return prefix + Math.random().toString(36).slice(2,9);
}

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  const body = req.body || {};
  const base = (Array.isArray(sample) && sample[0]) ? sample[0] : sample;
  const course = {
    ...base,
    id: generateId("course_"),
    name: body.name || base.name,
    branch: body.branch || base.branch,
    numLectures: Number(body.numLectures) || base.numLectures,
    createdAt: new Date().toISOString(),
    topics: (base.topics || []).map((t, i) => ({
      ...t,
      id: t.id || generateId("t_"),
      lectures: Math.max(1, Math.round((Number(body.numLectures || base.numLectures) / (base.topics.length || 1)))),
      content: (i === 0 && body.syllabusText) ? (`${t.content}\n\nSyllabus pasted by user:\n${body.syllabusText}`) : t.content
    }))
  };

  res.status(200).json(course);
}
