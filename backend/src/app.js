
import express, { json } from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import generateRoutes from "./routes/generateRoutes.js";
import selectRoutes from "./routes/selectRoutes.js";

const app = express();
app.use(cors()); // allow frontend to call backend (dev)
app.use(json()); // parse JSON body

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/generate", generateRoutes);
app.use("/api/select", selectRoutes);

export default app;
