import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-void)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} className="grid-bg">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌳</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, color: "var(--accent-glow)", letterSpacing: 2 }}>
            SKILL<span style={{ color: "var(--accent-electric)" }}>TREE</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>Continue your learning journey</p>
        </div>

        <div className="card" style={{ padding: 36 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 28, color: "var(--text-primary)" }}>Sign In</h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}>EMAIL</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}>PASSWORD</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
            </div>
            <motion.button type="submit" className="btn btn-primary" style={{ marginTop: 8, padding: "13px", fontSize: 15 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading}>
              {loading ? "Signing in..." : "Sign In →"}
            </motion.button>
          </form>

          {/* Demo credentials */}
          <div style={{ marginTop: 20, padding: 14, background: "rgba(124,92,252,0.08)", borderRadius: 8, border: "1px solid var(--border-dim)" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>DEMO CREDENTIALS</p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>Email: demo@skilltree.dev</p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>Password: demo1234</p>
          </div>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "var(--text-muted)" }}>
            No account? <Link to="/register" style={{ color: "var(--accent-primary)", fontWeight: 600 }}>Register here</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
