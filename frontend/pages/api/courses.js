import mock from "../../data/mockCourses.json";

export default function handler(req, res) {
  res.status(200).json(mock);
}
