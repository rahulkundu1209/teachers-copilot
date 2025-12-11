// components/Sidebar.js
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import profileImage from "../assets/profile.png"; 

export default function Sidebar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null); // key of hovered item for tooltip
  const tooltipRef = useRef();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tc_sidebar_collapsed");
      setCollapsed(raw === "true");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("tc_sidebar_collapsed", collapsed ? "true" : "false");
    } catch {}
  }, [collapsed]);

  const navItems = [
    { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
    { key: "my-courses", href: "/my-courses", label: "My Courses", icon: CoursesIcon },
    { key: "history", href: "/history", label: "History", icon: HistoryIcon },
    { key: "settings", href: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  // start as unavailable so navigation is blocked until we confirm backend health
  const [backendAvailable, setBackendAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    async function check() {
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        if (!mounted) return;
        setBackendAvailable(!!(res && res.ok));
      } catch (err) {
        if (!mounted) return;
        setBackendAvailable(false);
      }
    }

    // initial check
    check();
    // poll every 5s
    const id = setInterval(check, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  function handleSignOut() {
    logout();
    if (typeof window !== "undefined") window.location.href = "/";
  }

  return (
    <aside
      className={`relative transition-all duration-300 ease-in-out flex flex-col ${collapsed ? "w-20" : "w-56"}`}
      style={{ minHeight: "100vh", background: "var(--tc-sidebar-bg)" }}
    >
      {/* TOP: logo and collapse button */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="text-lg font-semibold">
          {!collapsed ? <span>Teacher's Copilot</span> : <span>TC</span>}
        </div>

        <button
          onClick={() => setCollapsed((s) => !s)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1 rounded hover:bg-gray-200 transition"
        >
          <div className="w-7 h-7 flex items-center justify-center border rounded">
            {collapsed ? <RightArrowIcon /> : <LeftArrowIcon />}
          </div>
        </button>
      </div>

      {/* nav list */}
      <nav className="px-4 py-6 flex-1">
        <ul className="space-y-3">
          {navItems.map((it) => {
            const active = router.pathname.startsWith(it.href);
            const Icon = it.icon;

            if (collapsed) {
              // collapsed: circles with icon + tooltip on hover
              return (
                <li key={it.key} className="flex justify-center relative">
                  <Link
                    href={it.href}
                    onClick={(e) => {
                      if (!backendAvailable && ["my-courses", "history", "settings"].includes(it.key)) {
                        e.preventDefault();
                        try { alert("Backend unavailable — start backend to access this page."); } catch (err) {}
                      }
                    }}
                    className={`flex items-center justify-center w-12 h-12 rounded-md transition ${active ? "bg-white shadow" : "bg-white/70 hover:bg-white"}`}
                    onMouseEnter={() => setHoveredItem(it.key)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <Icon className={`w-6 h-6 ${active ? "text-black" : "text-black/70"}`} />
                  </Link>

                  {/* tooltip */}
                  {hoveredItem === it.key && (
                    <div className="sidebar-tooltip" ref={tooltipRef} role="status">
                      {it.label}
                    </div>
                  )}
                </li>
              );
            }

            // expanded: big rounded rectangle pill with icon + label (beige style)
            return (
              <li key={it.key}>
                    <Link
                      href={it.href}
                      onClick={(e) => {
                        // block navigation to certain tabs while backend is down
                        if (!backendAvailable && ["my-courses", "history", "settings"].includes(it.key)) {
                          e.preventDefault();
                          // small visible feedback
                          try { alert("Backend unavailable — start backend to access this page."); } catch (err) {}
                        }
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg tc-card transition ${active ? "bg-[#cfc3b4]" : "bg-[#e9e6e2]"}`}
                    >
                      <span className="w-8 h-8 flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </span>
                      <span className="text-lg">{it.label}</span>
                    </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* bottom: profile area */}
      <div className="px-4 pb-6">
        <div className="flex items-center gap-3">
          <div className={`${collapsed ? "w-10 h-10" : "w-12 h-12"} rounded-full overflow-hidden bg-white`}>
            <img src={profileImage.src} alt="profile" className="w-full h-full object-cover" />
          </div>

          {!collapsed && (
            <div>
              <div className="font-medium">{user?.name || "Dr. Raj Malik"}</div>
              <div className="text-xs text-gray-500">View Profile</div>
            </div>
          )}
        </div>

        {!collapsed ? (
          <button onClick={handleSignOut} className="mt-4 text-sm text-gray-600 hover:text-black">Sign out</button>
        ) : (
          <div className="mt-3 flex justify-center">
            <button onClick={handleSignOut} aria-label="Sign out" className="text-gray-600 hover:text-black">
              <LogoutIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

/* -------------------------
   SVG icon components
   ------------------------- */

function DashboardIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3 13h8V3H3v10zM3 21h8v-6H3v6zM13 21h8V11h-8v10zM13 3v6h8V3h-8z" />
    </svg>
  );
}
function CoursesIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4 6h16v2H4zM4 10h16v2H4zM4 14h10v6H4z" />
    </svg>
  );
}
function HistoryIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13 3a9 9 0 1 0 6.32 15.32l1.38 1.38 1.3-1.3-1.38-1.38A9 9 0 0 0 13 3zm-1 5h2v5l4 2-1 1-5-2V8z" />
    </svg>
  );
}
function SettingsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" fill="currentColor" />
      <path d="M19.4 15a7 7 0 0 0 .1-1 7 7 0 0 0-.1-1l2.1-1.6-2-3.5-2.5 1a7 7 0 0 0-1.7-1l-.4-2.6h-4l-.4 2.6a7 7 0 0 0-1.7 1l-2.5-1-2 3.5L4.5 12a7 7 0 0 0 0 2l2.1 1.6-2 3.5 2.5 1 1.7-1a7 7 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7 7 0 0 0 1.7-1l1.7 1 2.5-1-2-3.5L19.4 15z" fill="currentColor" opacity="0.4"/>
        </svg>
  );
}
function LeftArrowIcon(props) {
  return (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" {...props}>
      <path d="M15 5l-7 7 7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function RightArrowIcon(props) {
  return (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" {...props}>
      <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LogoutIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16 13v-2H7V8l-5 4 5 4v-3zM20 3h-8v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
    </svg>
  );
}
