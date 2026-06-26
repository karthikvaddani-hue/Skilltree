import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    { icon: "🗺️", title: "Custom Skill Trees", desc: "Design non-linear RPG-style learning paths with drag-and-drop nodes and branching connections." },
    { icon: "🏅", title: "Badge System", desc: "Earn legendary badges as you complete nodes — First Step, Rising Scholar, XP Champion and more." },
    { icon: "⚡", title: "XP & Levels", desc: "Every completed node rewards XP. Level up your profile as you master more skills." },
    { icon: "🎨", title: "SVG Skill Trees", desc: "Animated SVG paths connect your nodes with cinematic visual flair." },
    { icon: "📊", title: "Progress Tracking", desc: "Nested MongoDB schemas track every node, every path, every milestone in real time." },
    { icon: "🔐", title: "JWT Auth", desc: "Secure Flask backend with JWT-protected routes keeps your progress safe." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-void)", overflow: "hidden" }}>
      {/* Nav */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 48px", borderBottom: "1px solid var(--border-dim)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 32 }}>🌳</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 900, color: "var(--accent-glow)", letterSpacing: 2 }}>
            SKILL<span style={{ color: "var(--accent-electric)" }}>TREE</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => navigate("/login")}>Sign In</button>
          <button className="btn btn-primary" onClick={() => navigate("/register")}>Start for Free</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "100px 24px 80px", position: "relative" }}>
        {/* Grid bg */}
        <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.5 }} />

        {/* Glow orbs */}
        <div style={{ position: "absolute", top: "20%", left: "15%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,92,252,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "30%", right: "15%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,195,247,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} style={{ position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 18px", background: "rgba(124,92,252,0.12)", border: "1px solid var(--border-glow)", borderRadius: 20, marginBottom: 32, fontSize: 12, color: "var(--accent-glow)", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
            🎮 Gamified Learning Platform
          </div>

          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: -1 }}>
            Level Up Your<br />
            <span style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-electric))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Learning Journey
            </span>
          </h1>

          <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto 48px", lineHeight: 1.7 }}>
            Build RPG-style skill trees, check off nodes to earn XP and badges, and unlock advanced paths as you grow.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <motion.button
              className="btn btn-primary"
              style={{ padding: "16px 36px", fontSize: 16 }}
              onClick={() => navigate("/register")}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Begin Your Quest →
            </motion.button>
            <button className="btn btn-ghost" style={{ padding: "16px 36px", fontSize: 16 }} onClick={() => navigate("/login")}>
              Sign In
            </button>
          </div>
        </motion.div>

        {/* Mini demo SVG tree */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 0.8 }} style={{ marginTop: 72, position: "relative" }}>
          <svg viewBox="0 0 700 320" style={{ width: "100%", maxWidth: 700, margin: "0 auto", display: "block" }}>
            {/* Connections */}
            {[
              [350, 60, 210, 160], [350, 60, 490, 160],
              [210, 160, 140, 260], [210, 160, 280, 260],
              [490, 160, 420, 260], [490, 160, 560, 260],
            ].map(([x1, y1, x2, y2], i) => (
              <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="url(#lineGrad)" strokeWidth={2} strokeDasharray="6 4"
                initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
              />
            ))}
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c5cfc" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#4fc3f7" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Nodes */}
            {[
              { x: 350, y: 60, color: "#fbbf24", label: "HTML", done: true },
              { x: 210, y: 160, color: "#34d399", label: "CSS", done: true },
              { x: 490, y: 160, color: "#60a5fa", label: "JS", done: false },
              { x: 140, y: 260, color: "#a78bfa", label: "React", done: false },
              { x: 280, y: 260, color: "#a78bfa", label: "SCSS", done: false },
              { x: 420, y: 260, color: "#6b7280", label: "Node", done: false },
              { x: 560, y: 260, color: "#6b7280", label: "API", done: false },
            ].map((node, i) => (
              <motion.g key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 + i * 0.08, type: "spring" }}>
                <circle cx={node.x} cy={node.y} r={32} fill={node.color} opacity={node.done ? 1 : 0.4} />
                {node.done && <circle cx={node.x} cy={node.y} r={38} fill="none" stroke={node.color} strokeWidth={1.5} opacity={0.4} />}
                <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={11} fontWeight="700" fontFamily="monospace">{node.label}</text>
                {node.done && <text x={node.x + 20} y={node.y - 20} fontSize={14}>✅</text>}
              </motion.g>
            ))}
          </svg>
        </motion.div>
      </section>

      {/* Features */}
      <section style={{ padding: "80px 48px", maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
          Everything You Need to <span style={{ color: "var(--accent-primary)" }}>Level Up</span>
        </h2>
        <p style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: 56 }}>Built for internship showcase — full-stack, interactive, and production-ready.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {features.map((f, i) => (
            <motion.div key={i} className="card" style={{ padding: 28 }}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }} viewport={{ once: true }}
            >
              <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: "center", padding: "80px 24px", borderTop: "1px solid var(--border-dim)" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 900, marginBottom: 20 }}>
          Ready to Start?
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>Join and build your first skill tree in minutes.</p>
        <motion.button className="btn btn-primary" style={{ padding: "16px 48px", fontSize: 16 }}
          onClick={() => navigate("/register")} whileHover={{ scale: 1.04 }}>
          Create Free Account
        </motion.button>
      </section>
    </div>
  );
}
