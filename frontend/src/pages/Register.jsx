import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9!@#$%^&*]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#34d399", "#7c5cfc"][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      toast.success("Account created! Welcome to SkillTree 🌳");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-void)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} className="grid-bg">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌳</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, color: "var(--accent-glow)", letterSpacing: 2 }}>
            SKILL<span style={{ color: "var(--accent-electric)" }}>TREE</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>Begin your quest</p>
        </div>

        <div className="card" style={{ padding: 36 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 28 }}>Create Account</h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}>USERNAME</label>
              <input className="input" placeholder="hero_scholar" value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}>EMAIL</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}>PASSWORD</label>
              <input className="input" type="password" placeholder="min. 6 characters" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
              {form.password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 3, background: "var(--bg-deep)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${strength * 25}%`, background: strengthColor, borderRadius: 2, transition: "all 0.3s" }} />
                  </div>
                  <p style={{ fontSize: 11, color: strengthColor, marginTop: 4 }}>{strengthLabel}</p>
                </div>
              )}
            </div>

            <motion.button type="submit" className="btn btn-primary" style={{ marginTop: 8, padding: "13px", fontSize: 15 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading}>
              {loading ? "Creating..." : "Create Account →"}
            </motion.button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "var(--text-muted)" }}>
            Already have an account? <Link to="/login" style={{ color: "var(--accent-primary)", fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
