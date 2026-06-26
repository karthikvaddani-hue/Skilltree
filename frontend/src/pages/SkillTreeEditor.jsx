import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import api from "../utils/api";
import toast from "react-hot-toast";

const TIER_COLORS = ["#fbbf24", "#34d399", "#60a5fa", "#a78bfa", "#f87171"];
const NODE_R = 36;

export default function SkillTreeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const svgRef = useRef(null);

  const [tree, setTree] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [progress, setProgress] = useState({ completed_nodes: [], tree_completed: false });
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState(null); // source node id
  const [selectedNode, setSelectedNode] = useState(null);
  const [mode, setMode] = useState("view"); // view | edit | connect
  const [addForm, setAddForm] = useState({ title: "", description: "", xp_reward: 100 });
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [saving, setSaving] = useState(false);
  const [xpPopups, setXpPopups] = useState([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef(null);

  useEffect(() => {
    loadTree();
  }, [id]);

  const loadTree = async () => {
    const [treeRes, progRes] = await Promise.all([
      api.get(`/skills/${id}`),
      api.get(`/progress/${id}`),
    ]);
    setTree(treeRes.data);
    setNodes(treeRes.data.nodes || []);
    setProgress(progRes.data);
  };

  // ─── SVG coordinates ───────────────────────────────────────────────
  const getSVGPoint = (e) => {
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / 1,
      y: (e.clientY - rect.top - pan.y) / 1,
    };
  };

  // ─── Drag handlers ─────────────────────────────────────────────────
  const onNodeMouseDown = (e, nodeId) => {
    if (mode !== "edit") return;
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    const pt = getSVGPoint(e);
    setDragging(nodeId);
    setDragOffset({ x: pt.x - node.x, y: pt.y - node.y });
  };

  const onSVGMouseMove = (e) => {
    if (dragging && mode === "edit") {
      const pt = getSVGPoint(e);
      setNodes(prev => prev.map(n => n.id === dragging ? { ...n, x: pt.x - dragOffset.x, y: pt.y - dragOffset.y } : n));
    }
    if (isPanning && panStart.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      panStart.current = { x: e.clientX, y: e.clientY };
    }
  };

  const onSVGMouseUp = () => {
    setDragging(null);
    setIsPanning(false);
    panStart.current = null;
  };

  const onSVGMouseDown = (e) => {
    if (mode === "view" && e.target === svgRef.current) {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
    }
  };

  // ─── Node click ────────────────────────────────────────────────────
  const onNodeClick = async (e, node) => {
    e.stopPropagation();
    if (mode === "connect") {
      if (!connecting) {
        setConnecting(node.id);
        toast("Now click the target node", { icon: "🔗" });
      } else if (connecting !== node.id) {
        // Check not already connected
        const alreadyLinked = node.parents?.includes(connecting);
        if (!alreadyLinked) {
          setNodes(prev => prev.map(n => n.id === node.id
            ? { ...n, parents: [...(n.parents || []), connecting] }
            : n
          ));
          toast.success("Nodes connected!");
        }
        setConnecting(null);
      }
      return;
    }

    if (mode === "view") {
      setSelectedNode(node);
    }
  };

  const onNodeDoubleClick = async (e, node) => {
    e.stopPropagation();
    if (mode !== "view") return;
    const completed = progress.completed_nodes.includes(node.id);
    if (completed) {
      // Uncomplete
      try {
        const res = await api.post(`/progress/${id}/uncomplete-node`, { node_id: node.id });
        setProgress(p => ({ ...p, completed_nodes: p.completed_nodes.filter(x => x !== node.id), tree_completed: false }));
        toast(`-${res.data.xp_lost} XP`, { icon: "↩️" });
      } catch { toast.error("Error"); }
    } else {
      // Check if parents are done
      const unmetParents = (node.parents || []).filter(pid => !progress.completed_nodes.includes(pid));
      if (unmetParents.length > 0) {
        toast.error("Complete prerequisite nodes first!");
        return;
      }
      try {
        const res = await api.post(`/progress/${id}/complete-node`, { node_id: node.id });
        const newCompleted = [...progress.completed_nodes, node.id];
        setProgress(p => ({ ...p, completed_nodes: newCompleted, tree_completed: res.data.tree_completed }));

        // XP popup
        const nodeEl = nodes.find(n => n.id === node.id);
        const popupId = uuidv4();
        setXpPopups(prev => [...prev, { id: popupId, xp: res.data.xp_gained, x: nodeEl.x, y: nodeEl.y }]);
        setTimeout(() => setXpPopups(prev => prev.filter(p => p.id !== popupId)), 2000);

        toast.success(`+${res.data.xp_gained} XP earned!`);

        if (res.data.new_badges?.length > 0) {
          res.data.new_badges.forEach(b => {
            setTimeout(() => toast.success(`Badge unlocked: ${b.icon} ${b.title}`, { duration: 4000 }), 600);
          });
        }
        if (res.data.tree_completed) {
          setTimeout(() => toast.success("🌳 TREE COMPLETE! Legendary achievement!", { duration: 5000 }), 1000);
        }
      } catch { toast.error("Error completing node"); }
    }
  };

  // ─── Add node ──────────────────────────────────────────────────────
  const addNode = () => {
    if (!addForm.title.trim()) { toast.error("Title required"); return; }
    const newNode = {
      id: uuidv4(),
      title: addForm.title,
      description: addForm.description,
      xp_reward: parseInt(addForm.xp_reward) || 100,
      x: 200 + Math.random() * 400,
      y: 100 + Math.random() * 300,
      tier: nodes.length === 0 ? 0 : Math.max(...nodes.map(n => n.tier || 0)),
      parents: [],
    };
    setNodes(prev => [...prev, newNode]);
    setAddForm({ title: "", description: "", xp_reward: 100 });
    toast.success("Node added — drag to position it");
  };

  const deleteNode = (nodeId) => {
    setNodes(prev => prev
      .filter(n => n.id !== nodeId)
      .map(n => ({ ...n, parents: (n.parents || []).filter(p => p !== nodeId) }))
    );
    if (selectedNode?.id === nodeId) setSelectedNode(null);
  };

  // ─── Save ──────────────────────────────────────────────────────────
  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/skills/${id}`, { nodes });
      toast.success("Saved!");
      await loadTree();
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  // ─── Draw SVG paths ────────────────────────────────────────────────
  const getEdges = () => {
    const edges = [];
    nodes.forEach(n => {
      (n.parents || []).forEach(pid => {
        const parent = nodes.find(p => p.id === pid);
        if (parent) edges.push({ from: parent, to: n });
      });
    });
    return edges;
  };

  const cubicPath = (x1, y1, x2, y2) => {
    const mid = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`;
  };

  if (!tree) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg-void)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌳</div>
        <div style={{ fontFamily: "var(--font-display)", color: "var(--accent-primary)", fontSize: 12, letterSpacing: 2 }}>LOADING TREE...</div>
      </div>
    </div>
  );

  const pct = nodes.length ? Math.round((progress.completed_nodes.length / nodes.length) * 100) : 0;
  const treeColor = tree.color || "var(--accent-primary)";

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg-void)", overflow: "hidden" }}>
      {/* ── Sidebar ── */}
      <div style={{ width: 280, background: "var(--bg-surface)", borderRight: "1px solid var(--border-dim)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border-dim)" }}>
          <button onClick={() => navigate("/dashboard")} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
            ← Dashboard
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>{tree.icon || "📚"}</span>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{tree.title}</h2>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{tree.category}</span>
            </div>
          </div>
          {/* Progress */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5 }}>
              <span style={{ color: "var(--text-muted)" }}>{progress.completed_nodes.length}/{nodes.length} nodes</span>
              <span style={{ color: treeColor, fontWeight: 600 }}>{pct}%</span>
            </div>
            <div style={{ height: 5, background: "var(--bg-deep)", borderRadius: 3, overflow: "hidden" }}>
              <motion.div animate={{ width: `${pct}%` }} style={{ height: "100%", background: treeColor, borderRadius: 3 }} />
            </div>
          </div>
          {progress.tree_completed && (
            <div style={{ marginTop: 10, padding: "6px 12px", background: "rgba(52,211,153,0.15)", border: "1px solid var(--accent-emerald)", borderRadius: 6, fontSize: 11, color: "var(--accent-emerald)", textAlign: "center" }}>
              🎉 TREE COMPLETE!
            </div>
          )}
        </div>

        {/* Mode toggle */}
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-dim)" }}>
          <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Mode</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {[
              { key: "view", label: "👁 View", tip: "Double-click nodes to complete" },
              { key: "edit", label: "✏️ Edit", tip: "Drag nodes to reposition" },
              { key: "connect", label: "🔗 Link", tip: "Click nodes to connect them" },
            ].map(m => (
              <button key={m.key} title={m.tip} onClick={() => { setMode(m.key); setConnecting(null); setSelectedNode(null); }}
                style={{
                  padding: "6px 4px", fontSize: 11, borderRadius: 6, border: "1px solid",
                  borderColor: mode === m.key ? treeColor : "var(--border-dim)",
                  background: mode === m.key ? "rgba(124,92,252,0.15)" : "transparent",
                  color: mode === m.key ? "var(--text-primary)" : "var(--text-muted)",
                  cursor: "pointer", transition: "all 0.2s"
                }}>
                {m.label}
              </button>
            ))}
          </div>
          {mode === "view" && <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>Double-click a node to complete/uncomplete it. Drag canvas to pan.</p>}
          {mode === "edit" && <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>Drag nodes to reposition them. Click to select and delete.</p>}
          {mode === "connect" && <p style={{ fontSize: 10, color: connecting ? "var(--accent-gold)" : "var(--text-muted)", marginTop: 6 }}>
            {connecting ? "Now click the child node →" : "Click a parent node to start linking."}
          </p>}
        </div>

        {/* Add node panel */}
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-dim)" }}>
          <button onClick={() => setShowAddPanel(p => !p)} style={{ width: "100%", padding: "8px 12px", background: "rgba(124,92,252,0.12)", border: "1px solid var(--border-dim)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between" }}>
            <span>+ Add Node</span><span>{showAddPanel ? "▲" : "▼"}</span>
          </button>
          <AnimatePresence>
            {showAddPanel && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  <input className="input" placeholder="Node title *" value={addForm.title}
                    onChange={e => setAddForm(p => ({ ...p, title: e.target.value }))} style={{ fontSize: 13 }} />
                  <textarea className="input" placeholder="Description (optional)" rows={2} value={addForm.description}
                    onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))} style={{ resize: "none", fontSize: 13 }} />
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>XP:</span>
                    <input className="input" type="number" value={addForm.xp_reward} min={10} max={1000}
                      onChange={e => setAddForm(p => ({ ...p, xp_reward: e.target.value }))} style={{ fontSize: 13 }} />
                  </div>
                  <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "9px" }} onClick={addNode}>
                    Add Node
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Node list */}
        <div style={{ flex: 1, overflow: "auto", padding: "14px 16px" }}>
          <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Nodes ({nodes.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {nodes.map(node => {
              const done = progress.completed_nodes.includes(node.id);
              return (
                <div key={node.id} onClick={() => setSelectedNode(node === selectedNode ? null : node)}
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid", cursor: "pointer",
                    borderColor: selectedNode?.id === node.id ? treeColor : done ? "rgba(52,211,153,0.3)" : "var(--border-dim)",
                    background: done ? "rgba(52,211,153,0.07)" : "var(--bg-deep)",
                    display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: done ? "var(--accent-emerald)" : TIER_COLORS[node.tier || 0] || "#9ca3af", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, flex: 1, color: done ? "var(--text-secondary)" : "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.title}</span>
                  <span style={{ fontSize: 10, color: "var(--accent-gold)", fontFamily: "var(--font-mono)" }}>+{node.xp_reward}</span>
                  {mode === "edit" && (
                    <button onClick={e => { e.stopPropagation(); deleteNode(node.id); }}
                      style={{ background: "none", border: "none", color: "var(--accent-rose)", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>✕</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom save */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid var(--border-dim)" }}>
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={save} disabled={saving}>
            {saving ? "Saving..." : "💾 Save Tree"}
          </button>
        </div>
      </div>

      {/* ── SVG Canvas ── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Toolbar hints */}
        <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 10, background: "rgba(11,13,26,0.85)", backdropFilter: "blur(8px)", padding: "6px 16px", borderRadius: 20, border: "1px solid var(--border-dim)", fontSize: 11, color: "var(--text-muted)" }}>
          {mode === "view" && "👁 View Mode — double-click a node to complete/uncomplete · drag canvas to pan"}
          {mode === "edit" && "✏️ Edit Mode — drag nodes to arrange · use sidebar to add or delete"}
          {mode === "connect" && `🔗 Link Mode — ${connecting ? "now click the child node" : "click any node to start linking"}`}
        </div>

        <svg ref={svgRef} width="100%" height="100%"
          style={{ cursor: mode === "view" ? (isPanning ? "grabbing" : "grab") : "default" }}
          onMouseMove={onSVGMouseMove}
          onMouseUp={onSVGMouseUp}
          onMouseDown={onSVGMouseDown}>
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="rgba(124,92,252,0.6)" />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-strong">
              <feGaussianBlur stdDeviation="8" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y})`}>
            {/* Grid */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(124,92,252,0.05)" strokeWidth="1" />
            </pattern>
            <rect x="-2000" y="-2000" width="6000" height="6000" fill="url(#grid)" />

            {/* Edges */}
            {getEdges().map((edge, i) => {
              const fromDone = progress.completed_nodes.includes(edge.from.id);
              const toDone = progress.completed_nodes.includes(edge.to.id);
              const active = fromDone && toDone;
              return (
                <motion.path key={i}
                  d={cubicPath(edge.from.x, edge.from.y + NODE_R, edge.to.x, edge.to.y - NODE_R)}
                  fill="none"
                  stroke={active ? treeColor : "rgba(124,92,252,0.25)"}
                  strokeWidth={active ? 2.5 : 1.5}
                  strokeDasharray={active ? "none" : "6 4"}
                  markerEnd="url(#arrow)"
                  filter={active ? "url(#glow)" : "none"}
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }}
                />
              );
            })}

            {/* Connecting line preview */}
            {/* Nodes */}
            {nodes.map(node => {
              const done = progress.completed_nodes.includes(node.id);
              const isSelected = selectedNode?.id === node.id;
              const isConnectingSource = connecting === node.id;
              const tier = node.tier || 0;
              const color = done ? "var(--accent-emerald)" : TIER_COLORS[tier % TIER_COLORS.length];
              const canComplete = (node.parents || []).every(p => progress.completed_nodes.includes(p));

              return (
                <g key={node.id}
                  onMouseDown={e => onNodeMouseDown(e, node.id)}
                  onClick={e => onNodeClick(e, node)}
                  onDoubleClick={e => onNodeDoubleClick(e, node)}
                  style={{ cursor: mode === "edit" ? "move" : "pointer" }}>

                  {/* Pulse ring for completable */}
                  {!done && canComplete && mode === "view" && (
                    <motion.circle cx={node.x} cy={node.y} r={NODE_R + 10} fill="none" stroke={color}
                      strokeWidth={1.5} opacity={0.4}
                      animate={{ r: [NODE_R + 6, NODE_R + 18], opacity: [0.5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}

                  {/* Selection / connecting ring */}
                  {(isSelected || isConnectingSource) && (
                    <circle cx={node.x} cy={node.y} r={NODE_R + 8} fill="none"
                      stroke={isConnectingSource ? "var(--accent-gold)" : treeColor} strokeWidth={2} opacity={0.8} />
                  )}

                  {/* Main node */}
                  <motion.circle cx={node.x} cy={node.y} r={NODE_R}
                    fill={done ? color : "var(--bg-elevated)"}
                    stroke={color} strokeWidth={2}
                    filter={done ? "url(#glow-strong)" : isSelected ? "url(#glow)" : "none"}
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    whileHover={{ scale: 1.08 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />

                  {/* Icon / checkmark */}
                  <text x={node.x} y={node.y - 6} textAnchor="middle" fontSize={done ? 16 : 18} dominantBaseline="middle"
                    style={{ pointerEvents: "none", userSelect: "none" }}>
                    {done ? "✅" : "📖"}
                  </text>

                  {/* Title */}
                  <text x={node.x} y={node.y + NODE_R + 14} textAnchor="middle" fontSize={11} fontWeight="600"
                    fill={done ? "var(--accent-emerald)" : "var(--text-primary)"}
                    style={{ pointerEvents: "none", userSelect: "none" }}>
                    {node.title.length > 14 ? node.title.slice(0, 13) + "…" : node.title}
                  </text>

                  {/* XP label */}
                  <text x={node.x} y={node.y + NODE_R + 26} textAnchor="middle" fontSize={9}
                    fill="var(--accent-gold)" fontFamily="monospace"
                    style={{ pointerEvents: "none", userSelect: "none" }}>
                    +{node.xp_reward} XP
                  </text>

                  {/* Locked overlay */}
                  {!done && !canComplete && (
                    <text x={node.x + NODE_R - 6} y={node.y - NODE_R + 6} textAnchor="middle" fontSize={14}
                      style={{ pointerEvents: "none", userSelect: "none" }}>🔒</text>
                  )}
                </g>
              );
            })}

            {/* XP Popups */}
            {xpPopups.map(popup => (
              <motion.text key={popup.id}
                x={popup.x} y={popup.y - NODE_R - 10}
                textAnchor="middle" fontSize={18} fontWeight="900" fontFamily="var(--font-display)"
                fill="var(--accent-gold)"
                initial={{ y: popup.y - NODE_R - 10, opacity: 1 }}
                animate={{ y: popup.y - NODE_R - 60, opacity: 0 }}
                transition={{ duration: 1.8 }}>
                +{popup.xp} XP!
              </motion.text>
            ))}
          </g>
        </svg>

        {/* Empty state */}
        {nodes.length === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🌱</div>
              <h3 style={{ fontSize: 18, color: "var(--text-secondary)", marginBottom: 8 }}>Empty Skill Tree</h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Use the sidebar to add your first node</p>
            </div>
          </div>
        )}

        {/* Node detail popup */}
        <AnimatePresence>
          {selectedNode && mode === "view" && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              style={{ position: "absolute", right: 20, top: 60, width: 260, background: "var(--bg-elevated)", border: "1px solid var(--border-dim)", borderRadius: "var(--radius-md)", padding: 20, zIndex: 20 }}>
              <button onClick={() => setSelectedNode(null)} style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16 }}>✕</button>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>NODE DETAIL</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{selectedNode.title}</h3>
              {selectedNode.description && <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.5 }}>{selectedNode.description}</p>}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>XP Reward</span>
                <span style={{ fontSize: 14, color: "var(--accent-gold)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>+{selectedNode.xp_reward}</span>
              </div>
              {(() => {
                const done = progress.completed_nodes.includes(selectedNode.id);
                const canComplete = (selectedNode.parents || []).every(p => progress.completed_nodes.includes(p));
                return (
                  <div>
                    {done ? (
                      <div style={{ textAlign: "center", padding: "10px", background: "rgba(52,211,153,0.12)", borderRadius: 8, fontSize: 13, color: "var(--accent-emerald)", fontWeight: 600 }}>✅ Completed</div>
                    ) : canComplete ? (
                      <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>Double-click the node to mark complete</p>
                    ) : (
                      <div style={{ padding: 10, background: "rgba(107,114,128,0.1)", borderRadius: 8, fontSize: 12, color: "var(--text-muted)" }}>
                        🔒 Complete prerequisite nodes first
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
