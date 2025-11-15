
import express, { json } from "express";
import cors from "cors";
import calcRoutes from "./routes/calcRoutes.js";

const app = express();
app.use(cors());    // allow frontend to call backend (dev)
app.use(json());    // parse JSON body

app.use("/api", calcRoutes);

export default app;
