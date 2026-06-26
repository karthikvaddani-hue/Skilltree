import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import toast from "react-hot-toast";

const TIER_COLORS = ["#fbbf24","#34d399","#60a5fa","#a78bfa","#f87171"];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trees, setTrees] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [allProgress, setAllProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("mine");
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title:"", description:"", category:"Programming", icon:"💻" });

  useEffect(() => {
    Promise.all([
      api.get("/skills/"),
      api.get("/skills/templates"),
      api.get("/progress/all"),
    ]).then(([treesRes, tmplRes, progRes]) => {
      setTrees(treesRes.data);
      setTemplates(tmplRes.data);
      setAllProgress(progRes.data);
    }).catch(() => toast.error("Failed to load data")).finally(() => setLoading(false));
  }, []);

  const getProgress = (treeId) => allProgress.find(p => p.tree_id === treeId) || { completed_nodes: [], tree_completed: false };

  const createTree = async () => {
    if (!form.title.trim()) return toast.error("Title required");
    try {
      const res = await api.post("/skills/", {
        title: form.title, description: form.description,
        category: form.category, icon: form.icon, color: "#6366f1",
        nodes: [], is_public: false,
      });
      setTrees(prev => [res.data, ...prev]);
      setShowCreate(false);
      setForm({ title:"", description:"", category:"Programming", icon:"💻" });
      toast.success("Tree created!");
      navigate(`/tree/${res.data._id}`);
    } catch { toast.error("Failed to create tree"); }
  };

  const useTemplate = async (tmpl) => {
    try {
      const res = await api.post("/skills/", {
        title: tmpl.title, description: tmpl.description,
        category: tmpl.category, icon: tmpl.icon, color: tmpl.color,
        nodes: tmpl.nodes, is_public: false,
      });
      setTrees(prev => [res.data, ...prev]);
      toast.success(`"${tmpl.title}" created!`);
      navigate(`/tree/${res.data._id}`);
    } catch { toast.error("Failed to use template"); }
  };

  const deleteTree = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this skill tree?")) return;
    try {
      await api.delete(`/skills/${id}`);
      setTrees(prev => prev.filter(t => t._id !== id));
      toast.success("Deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const totalNodes = trees.reduce((s,t)=>s+(t.nodes?.length||0),0);
  const completedNodes = allProgress.reduce((s,p)=>s+(p.completed_nodes?.length||0),0);
  const completedTrees = allProgress.filter(p=>p.tree_completed).length;
  const level = user?.level || 1;
  const xp = user?.xp || 0;
  const xpPct = (xp % 500) / 500 * 100;

  const filteredTrees = trees.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.category?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60vh"}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:48}}>🌳</div><div style={{color:"var(--text-muted)",marginTop:12}}>Loading your trees...</div></div>
    </div>
  );

  return (
    <div style={{padding:"32px 40px",maxWidth:1200,margin:"0 auto"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:36}}>
        <div>
          <h1 style={{fontSize:28,fontWeight:700,marginBottom:4}}>
            Welcome back, <span style={{color:"var(--accent-glow)"}}>{user?.username}</span> 👋
          </h1>
          <p style={{color:"var(--text-secondary)",fontSize:14}}>Continue your learning journey — your next level awaits.</p>
        </div>
        <button className="btn btn-primary" style={{padding:"12px 24px"}} onClick={()=>setShowCreate(true)}>+ New Skill Tree</button>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:16,marginBottom:32}}>
        {[
          {icon:"⭐",val:level,lbl:"Level",color:"var(--accent-gold)"},
          {icon:"⚡",val:xp,lbl:"Total XP",color:"var(--accent-primary)"},
          {icon:"🏅",val:user?.badges_count||0,lbl:"Badges",color:"var(--accent-emerald)"},
          {icon:"✅",val:`${completedNodes}/${totalNodes}`,lbl:"Nodes Done",color:"var(--accent-electric)"},
          {icon:"🌳",val:completedTrees,lbl:"Trees Done",color:"#60a5fa"},
        ].map((s,i)=>(
          <motion.div key={i} className="card" style={{padding:20,textAlign:"center"}} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}>
            <div style={{fontSize:24,marginBottom:6}}>{s.icon}</div>
            <div style={{fontFamily:"var(--font-display)",fontSize:22,fontWeight:700,color:s.color}}>{s.val}</div>
            <div style={{fontSize:11,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:0.5,marginTop:2}}>{s.lbl}</div>
          </motion.div>
        ))}
      </div>

      {/* XP bar */}
      <div className="card" style={{padding:"16px 24px",marginBottom:32,display:"flex",alignItems:"center",gap:16}}>
        <div style={{fontSize:24}}>🎯</div>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:12}}>
            <span style={{color:"var(--text-secondary)"}}>Level {level} → Level {level+1}</span>
            <span style={{color:"var(--accent-primary)",fontFamily:"var(--font-mono)"}}>{xp%500} / 500 XP</span>
          </div>
          <div style={{height:8,background:"var(--bg-deep)",borderRadius:4,overflow:"hidden"}}>
            <motion.div initial={{width:0}} animate={{width:`${xpPct}%`}} transition={{duration:1}} style={{height:"100%",borderRadius:4}} className="xp-bar-fill"/>
          </div>
        </div>
        <div style={{fontSize:12,color:"var(--text-muted)"}}>{Math.round(xpPct)}% complete</div>
      </div>

      {/* Tabs + Search */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{display:"flex",gap:8,borderBottom:"1px solid var(--border-dim)"}}>
          {[
            {id:"mine",label:`My Trees (${trees.length})`},
            {id:"templates",label:"Templates"},
          ].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:"10px 20px",background:"none",border:"none",cursor:"pointer",
              fontSize:13,fontWeight:600,color:tab===t.id?"var(--accent-primary)":"var(--text-muted)",
              borderBottom:`2px solid ${tab===t.id?"var(--accent-primary)":"transparent"}`,
              marginBottom:-1,transition:"all 0.2s"
            }}>{t.label}</button>
          ))}
        </div>
        {tab==="mine" && (
          <input className="input" value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search trees..." style={{width:220,fontSize:13,padding:"8px 14px"}} />
        )}
      </div>

      {/* My Trees */}
      {tab==="mine" && (
        filteredTrees.length===0 ? (
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:"64px 24px",border:"2px dashed var(--border-dim)",borderRadius:"var(--radius-lg)"}}>
            <div style={{fontSize:56,marginBottom:16}}>🌱</div>
            <h3 style={{fontSize:18,fontWeight:600,marginBottom:8}}>{search ? "No trees match your search" : "No skill trees yet"}</h3>
            <p style={{color:"var(--text-secondary)",fontSize:14,marginBottom:24}}>{search ? "Try a different search term." : "Start by creating one or pick a template below."}</p>
            {!search && <button className="btn btn-primary" onClick={()=>setShowCreate(true)}>Create Your First Tree</button>}
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:20}}>
            {filteredTrees.map((tree,i) => {
              const prog = getProgress(tree._id);
              const done = prog.completed_nodes.length;
              const total = tree.nodes?.length || 0;
              const pct = total ? Math.round((done/total)*100) : 0;
              return (
                <motion.div key={tree._id} className="card" style={{overflow:"hidden",cursor:"pointer",transition:"transform 0.2s"}}
                  initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                  whileHover={{y:-4}} onClick={()=>navigate(`/tree/${tree._id}`)}>
                  <div style={{height:5,background:tree.color||"var(--accent-primary)"}}/>
                  <div style={{padding:24}}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
                      <div style={{display:"flex",gap:12,alignItems:"center"}}>
                        <span style={{fontSize:32}}>{tree.icon||"📚"}</span>
                        <div>
                          <h3 style={{fontSize:15,fontWeight:600,marginBottom:3}}>{tree.title}</h3>
                          <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"rgba(124,92,252,0.15)",color:"var(--accent-glow)",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{tree.category}</span>
                        </div>
                      </div>
                      <button onClick={e=>deleteTree(tree._id,e)} style={{background:"none",border:"none",color:"var(--text-muted)",fontSize:16,cursor:"pointer",padding:"2px 6px",borderRadius:4,lineHeight:1}}>✕</button>
                    </div>
                    {tree.description && <p style={{fontSize:13,color:"var(--text-secondary)",marginBottom:16,lineHeight:1.5}}>{tree.description}</p>}
                    <div style={{marginBottom:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}>
                        <span style={{color:"var(--text-muted)"}}>{done}/{total} nodes</span>
                        <span style={{color:tree.color||"var(--accent-primary)",fontWeight:600}}>{pct}%</span>
                      </div>
                      <div style={{height:6,background:"var(--bg-deep)",borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",borderRadius:3,background:tree.color||"var(--accent-primary)",width:`${pct}%`,transition:"width 0.8s"}}/>
                      </div>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:12,color:"var(--text-muted)"}}>{tree.nodes?.reduce((s,n)=>s+(n.xp_reward||0),0)||0} XP total</span>
                      {prog.tree_completed&&<span style={{fontSize:11,color:"var(--accent-emerald)",fontWeight:600}}>✅ COMPLETE</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      )}

      {/* Templates */}
      {tab==="templates" && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:20}}>
          {templates.map((tmpl,i)=>(
            <motion.div key={tmpl.id} className="card" style={{overflow:"hidden"}}
              initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.08}}>
              <div style={{height:5,background:tmpl.color}}/>
              <div style={{padding:24}}>
                <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}>
                  <span style={{fontSize:32}}>{tmpl.icon}</span>
                  <div>
                    <h3 style={{fontSize:15,fontWeight:600,marginBottom:3}}>{tmpl.title}</h3>
                    <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"rgba(79,195,247,0.15)",color:"var(--accent-electric)",fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{tmpl.category}</span>
                  </div>
                </div>
                <p style={{fontSize:13,color:"var(--text-secondary)",marginBottom:16,lineHeight:1.5}}>{tmpl.description}</p>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--text-muted)",marginBottom:18}}>
                  <span>{tmpl.nodes?.length||0} nodes</span>
                  <span>{tmpl.nodes?.reduce((s,n)=>s+n.xp_reward,0)||0} XP</span>
                  <span>{new Set(tmpl.nodes?.map(n=>n.tier)||[]).size} tiers</span>
                </div>
                <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} onClick={()=>useTemplate(tmpl)}>Use Template →</button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:24}}
            onClick={e=>{if(e.target===e.currentTarget)setShowCreate(false)}}>
            <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
              style={{background:"var(--bg-elevated)",border:"1px solid var(--border-dim)",borderRadius:"var(--radius-lg)",padding:36,width:"100%",maxWidth:480}}>
              <h2 style={{fontSize:20,fontWeight:700,marginBottom:24}}>🌱 Create Skill Tree</h2>
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div>
                  <label style={{display:"block",fontSize:12,color:"var(--text-secondary)",marginBottom:6,fontWeight:500,letterSpacing:0.5}}>TITLE *</label>
                  <input className="input" placeholder="e.g. Master React Development" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
                </div>
                <div>
                  <label style={{display:"block",fontSize:12,color:"var(--text-secondary)",marginBottom:6,fontWeight:500,letterSpacing:0.5}}>DESCRIPTION</label>
                  <textarea className="input" rows={3} placeholder="What will you learn?" style={{resize:"vertical"}} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div>
                    <label style={{display:"block",fontSize:12,color:"var(--text-secondary)",marginBottom:6,fontWeight:500,letterSpacing:0.5}}>CATEGORY</label>
                    <select className="input" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                      {["Programming","Design","Mathematics","Language","Science","Business","Arts","Other"].map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{display:"block",fontSize:12,color:"var(--text-secondary)",marginBottom:6,fontWeight:500,letterSpacing:0.5}}>ICON</label>
                    <select className="input" value={form.icon} onChange={e=>setForm(f=>({...f,icon:e.target.value}))}>
                      {["💻","📚","🎨","🔬","🌐","📐","🎵","🏋️","🎮","🌿","⚗️","🛠️"].map(ic=><option key={ic}>{ic}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{display:"flex",gap:12,marginTop:8}}>
                  <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setShowCreate(false)}>Cancel</button>
                  <button className="btn btn-primary" style={{flex:2}} onClick={createTree}>Create & Open Editor</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
