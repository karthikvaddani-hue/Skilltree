import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SkillTreeEditor from "./pages/SkillTreeEditor";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import Landing from "./pages/Landing";
import Layout from "./components/Layout";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg-void)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16, animation: "spin 1s linear infinite" }}>🌳</div>
        <div style={{ fontFamily: "var(--font-display)", color: "var(--accent-primary)", fontSize: 14, letterSpacing: 2 }}>LOADING...</div>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  // While loading, show nothing (avoids flash of login page)
  if (loading) return null;
  return !user ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-dim)" },
            success: { iconTheme: { primary: "var(--accent-emerald)", secondary: "var(--bg-void)" } },
          }}
        />
        <Routes>
          {/* Landing always accessible — no auth check needed */}
          <Route path="/" element={<Landing />} />
          {/* Public auth pages (redirect to dashboard if already logged in) */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          {/* Protected app routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/tree/:id" element={<ProtectedRoute><SkillTreeEditor /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Layout><Leaderboard /></Layout></ProtectedRoute>} />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
