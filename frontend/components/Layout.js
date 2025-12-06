// components/Layout.js
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 p-8" style={{ background: "var(--tc-bg)" }}>
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
