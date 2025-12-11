// server.js
// Use a relative import to the local `src/app.js` file and call app.listen.
// The project doesn't configure the `@` path alias for Node, and `app.js`
// exports the Express app as the default export (not a `listen` named export).
import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import connectMongo from "./src/db.js";

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectMongo();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection failed", err.message);
  }

  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });
}

start();
