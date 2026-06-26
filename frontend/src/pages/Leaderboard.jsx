import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const MEDALS = ["🥇", "🥈", "🥉"];
const RANK_COLORS = ["var(--accent-gold)", "#9ca3af", "#cd7f32"];

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/badges/leaderboard")
      .then(r => setLeaders(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
        <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-display)", letterSpacing: 1, fontSize: 12 }}>LOADING...</p>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "36px 40px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
          🏆 <span style={{ color: "var(--accent-gold)" }}>LEADERBOARD</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Top scholars ranked by total XP earned</p>
      </div>

      {/* Top 3 podium */}
      {leaders.length >= 3 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 16, marginBottom: 48 }}>
          {[leaders[1], leaders[0], leaders[2]].map((l, i) => {
            const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
            const heights = [120, 160, 100];
            return (
              <motion.div key={l.username} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <img src={l.avatar} alt={l.username} style={{ width: 52, height: 52, borderRadius: "50%", border: `3px solid ${RANK_COLORS[actualRank - 1]}` }} />
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>{l.username}</div>
                <div style={{ fontSize: 13, color: "var(--accent-gold)", fontFamily: "var(--font-mono)" }}>{l.xp} XP</div>
                <div style={{
                  width: 80, height: heights[i], background: "var(--bg-card)",
                  border: `2px solid ${RANK_COLORS[actualRank - 1]}`,
                  borderRadius: "8px 8px 0 0", display: "flex", alignItems: "flex-start",
                  justifyContent: "center", paddingTop: 12, fontSize: 24
                }}>
                  {MEDALS[actualRank - 1]}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border-dim)", display: "grid", gridTemplateColumns: "48px 1fr 100px 80px 70px", gap: 12, fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
          <span>#</span><span>Player</span><span>Level</span><span>XP</span><span>Badges</span>
        </div>

        {leaders.map((l, i) => {
          const isMe = l.username === user?.username;
          return (
            <motion.div key={l.username}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-dim)", display: "grid", gridTemplateColumns: "48px 1fr 100px 80px 70px", gap: 12, alignItems: "center", background: isMe ? "rgba(124,92,252,0.07)" : "transparent" }}>
              <div style={{ fontSize: 20, textAlign: "center" }}>
                {i < 3 ? MEDALS[i] : <span style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{i + 1}</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src={l.avatar} alt={l.username} style={{ width: 34, height: 34, borderRadius: "50%", border: isMe ? "2px solid var(--accent-primary)" : "2px solid var(--border-dim)" }} />
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: isMe ? "var(--accent-primary)" : "var(--text-primary)" }}>{l.username}</span>
                  {isMe && <span style={{ marginLeft: 6, fontSize: 10, color: "var(--accent-primary)", fontWeight: 600 }}>YOU</span>}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Lvl </span>
                <span style={{ fontSize: 14, color: "var(--accent-gold)", fontWeight: 700, fontFamily: "var(--font-display)" }}>{l.level}</span>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--accent-primary)", fontWeight: 600 }}>{l.xp.toLocaleString()}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>🏅 {l.badges_count}</div>
            </motion.div>
          );
        })}

        {leaders.length === 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
            No players yet — be the first to earn XP!
          </div>
        )}
      </div>
    </div>
  );
}
