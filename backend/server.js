// server.js
// Use a relative import to the local `src/app.js` file and call app.listen.
// The project doesn't configure the `@` path alias for Node, and `app.js`
// exports the Express app as the default export (not a `listen` named export).
import app from "./src/app.js";

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
