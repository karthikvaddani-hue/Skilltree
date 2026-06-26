import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import toast from "react-hot-toast";

const XP_PER_LEVEL = 500;

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [badges, setBadges] = useState([]);
  const [trees, setTrees] = useState([]);
  const [bio, setBio] = useState(user?.bio || "");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    api.get("/badges/").then(r => setBadges(r.data));
    api.get("/skills/").then(r => setTrees(r.data));
  }, []);

  const saveProfile = async () => {
    await api.put("/auth/update-profile", { bio });
    await refreshUser();
    setEditing(false);
    toast.success("Profile updated!");
  };

  const xp = user?.xp || 0;
  const level = user?.level || 1;
  const xpInLevel = xp % XP_PER_LEVEL;
  const xpPct = (xpInLevel / XP_PER_LEVEL) * 100;

  const BADGE_DEFS = [
    { id: "first_node", icon: "🌱", title: "First Step", desc: "Complete your first skill node" },
    { id: "five_nodes", icon: "⭐", title: "Getting Started", desc: "Complete 5 nodes" },
    { id: "ten_nodes", icon: "🎯", title: "Rising Scholar", desc: "Complete 10 nodes" },
    { id: "first_tree", icon: "🌳", title: "Tree Master", desc: "Complete an entire skill tree" },
    { id: "xp_500", icon: "💎", title: "XP Hunter", desc: "Earn 500 XP total" },
    { id: "xp_1000", icon: "🏆", title: "XP Champion", desc: "Earn 1000 XP total" },
    { id: "level_5", icon: "🔥", title: "Level 5 Reached", desc: "Reach level 5" },
  ];

  const earnedIds = new Set(badges.map(b => b.badge_id));

  return (
    <div style={{ padding: "36px 40px", maxWidth: 900, margin: "0 auto" }}>
      {/* Profile card */}
      <motion.div className="card" style={{ padding: 36, marginBottom: 28, display: "flex", gap: 32, alignItems: "flex-start" }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ flexShrink: 0 }}>
          <img src={user?.avatar} alt={user?.username}
            style={{ width: 90, height: 90, borderRadius: "50%", border: "3px solid var(--accent-primary)", display: "block" }} />
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Level</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--accent-gold)", fontWeight: 900 }}>{level}</div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{user?.username}</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>{user?.email}</p>

          {/* XP bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5 }}>
              <span style={{ color: "var(--text-muted)" }}>XP Progress to Level {level + 1}</span>
              <span style={{ color: "var(--accent-primary)", fontFamily: "var(--font-mono)" }}>{xpInLevel} / {XP_PER_LEVEL}</span>
            </div>
            <div style={{ height: 8, background: "var(--bg-deep)", borderRadius: 4, overflow: "hidden" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 1 }}
                style={{ height: "100%", borderRadius: 4 }} className="xp-bar-fill" />
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 24, marginBottom: 18, flexWrap: "wrap" }}>
            {[
              { label: "Total XP", value: xp, color: "var(--accent-primary)" },
              { label: "Skill Trees", value: user?.trees_count || trees.length, color: "var(--accent-electric)" },
              { label: "Badges", value: user?.badges_count || 0, color: "var(--accent-gold)" },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: "var(--font-display)" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Bio */}
          {editing ? (
            <div style={{ display: "flex", gap: 10 }}>
              <input className="input" value={bio} onChange={e => setBio(e.target.value)} placeholder="Add a bio..." style={{ flex: 1, fontSize: 13 }} />
              <button className="btn btn-primary" style={{ padding: "8px 16px" }} onClick={saveProfile}>Save</button>
              <button className="btn btn-ghost" style={{ padding: "8px 16px" }} onClick={() => setEditing(false)}>Cancel</button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <p style={{ fontSize: 14, color: user?.bio ? "var(--text-secondary)" : "var(--text-muted)", fontStyle: user?.bio ? "normal" : "italic" }}>
                {user?.bio || "No bio yet..."}
              </p>
              <button onClick={() => setEditing(true)} style={{ background: "none", border: "none", color: "var(--accent-primary)", cursor: "pointer", fontSize: 12 }}>Edit</button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Badges collection */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>🏅 Badge Collection</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          {BADGE_DEFS.map((b, i) => {
            const earned = earnedIds.has(b.id);
            return (
              <motion.div key={b.id} className="card" style={{ padding: 18, opacity: earned ? 1 : 0.4, position: "relative", overflow: "hidden" }}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: earned ? 1 : 0.4, scale: 1 }} transition={{ delay: i * 0.05 }}>
                {earned && (
                  <div style={{ position: "absolute", top: 0, right: 0, width: 0, height: 0, borderTop: "32px solid var(--accent-emerald)", borderLeft: "32px solid transparent" }} />
                )}
                <div style={{ fontSize: 30, marginBottom: 8 }}>{b.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: earned ? "var(--text-primary)" : "var(--text-muted)" }}>{b.title}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{b.desc}</div>
                {!earned && <div style={{ fontSize: 10, marginTop: 8, color: "var(--text-muted)" }}>🔒 Locked</div>}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Joined date */}
      <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
        Member since {user?.joined_at ? new Date(user.joined_at).toLocaleDateString("en-IN", { year: "numeric", month: "long" }) : "recently"}
      </p>
    </div>
  );
}
