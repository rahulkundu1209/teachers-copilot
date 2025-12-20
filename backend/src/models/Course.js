import mongoose from "mongoose";

// const ContentSchema = new mongoose.Schema({
//   pptLink: {type: String, default: ""},
// });

const TopicSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  content: {type: String, default: ""},
  pptLink: {type: String, default: ""},
}, { _id: false });

const CourseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  branch: { type: String, required: true },
  numLectures: { type: Number, required: true, min: 1 },
  syllabusText: { type: String, default: "" },
  additionalPrompt: { type: String, default: "" },
  topics: [TopicSchema],
  userId: { type: String, required: true }, // email of the user who created it
  createdAt: { type: Date, default: Date.now },
});

const Course = mongoose.model("Course", CourseSchema);
export default Course;
