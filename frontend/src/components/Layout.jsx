import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: "⚡" },
  { path: "/leaderboard", label: "Leaderboard", icon: "🏆" },
  { path: "/profile", label: "Profile", icon: "👤" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const xpToNextLevel = 500;
  const xpProgress = ((user?.xp || 0) % xpToNextLevel) / xpToNextLevel * 100;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Top Nav */}
      <nav style={{
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-dim)",
        padding: "0 24px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
        backdropFilter: "blur(12px)",
      }}>
        {/* Logo */}
        <Link to="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28 }}>🌳</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--accent-glow)", letterSpacing: 1 }}>
            SKILL<span style={{ color: "var(--accent-electric)" }}>TREE</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {NAV_ITEMS.map(item => (
            <Link key={item.path} to={item.path} style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-sm)",
              fontSize: 13,
              fontWeight: 500,
              color: location.pathname === item.path ? "var(--text-primary)" : "var(--text-secondary)",
              background: location.pathname === item.path ? "rgba(124,92,252,0.15)" : "transparent",
              border: location.pathname === item.path ? "1px solid var(--border-glow)" : "1px solid transparent",
              transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {item.icon} {item.label}
            </Link>
          ))}
        </div>

        {/* User info */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* XP Bar */}
          <div style={{ width: 120 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>LVL {user?.level || 1}</span>
              <span style={{ fontSize: 10, color: "var(--accent-gold)", fontFamily: "var(--font-mono)" }}>{user?.xp || 0} XP</span>
            </div>
            <div style={{ height: 4, background: "var(--bg-deep)", borderRadius: 2, overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                style={{ height: "100%", borderRadius: 2 }}
                className="xp-bar-fill"
              />
            </div>
          </div>

          {/* Avatar */}
          <img
            src={user?.avatar}
            alt={user?.username}
            style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid var(--accent-primary)", cursor: "pointer" }}
            onClick={() => navigate("/profile")}
          />

          <button onClick={handleLogout} className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 14px" }}>
            Exit
          </button>
        </div>
      </nav>

      {/* Page content */}
      <main style={{ flex: 1, background: "var(--bg-void)" }}>
        {children}
      </main>
    </div>
  );
}
