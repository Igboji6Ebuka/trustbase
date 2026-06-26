import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { getStoredUser, clearSession } from './api';

// User Pages
import BottomNav from './components/BottomNav';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import ReportsList from './pages/ReportsList';
import ReportScam from './pages/ReportScam';
import VerifiedProfile from './pages/VerifiedProfile';
import GetVerified from './pages/GetVerified';
import VerificationStatus from './pages/VerificationStatus';
import MyReports from './pages/MyReports';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import More from './pages/More';
import PrivacySettings from './pages/PrivacySettings';
import PrivacySecurity from './pages/PrivacySecurity';

// Admin Pages
import AdminLogin from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';
import AdminReports from './admin/AdminReports';
import AdminVerifications from './admin/AdminVerifications';
import AdminUsers from './admin/AdminUsers';
import AdminFlagged from './admin/AdminFlagged';

function App() {
  const [user, setUser]   = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      setIsAdmin(!!stored.is_admin);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAdmin(!!userData?.is_admin);
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setIsAdmin(false);
  };

  const isAuthenticated = !!user;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F5F6FA' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #ECEFF1', borderTop: '3px solid #E53935', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* ────────────────── ADMIN ROUTES ────────────────── */}
        <Route path="/admin-login" element={<AdminLogin onAdminLogin={handleLogin} />} />
        <Route path="/admin" element={isAdmin ? <AdminDashboard onLogout={handleLogout} /> : <Navigate to="/admin-login" />} />
        <Route path="/admin/reports" element={isAdmin ? <AdminReports onLogout={handleLogout} /> : <Navigate to="/admin-login" />} />
        <Route path="/admin/verifications" element={isAdmin ? <AdminVerifications onLogout={handleLogout} /> : <Navigate to="/admin-login" />} />
        <Route path="/admin/users" element={isAdmin ? <AdminUsers onLogout={handleLogout} /> : <Navigate to="/admin-login" />} />
        <Route path="/admin/flagged" element={isAdmin ? <AdminFlagged onLogout={handleLogout} /> : <Navigate to="/admin-login" />} />

        {/* ────────────────── USER AUTH ────────────────── */}
        <Route path="/signup" element={<Signup onLogin={handleLogin} />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />

        {/* ────────────────── USER APP ────────────────── */}
        <Route path="/home" element={isAuthenticated ? <><Home user={user} /><BottomNav /></> : <Navigate to="/signup" />} />
        <Route path="/search-results" element={isAuthenticated ? <><SearchResults /><BottomNav /></> : <Navigate to="/signup" />} />
        <Route path="/reports-list" element={isAuthenticated ? <><ReportsList /><BottomNav /></> : <Navigate to="/signup" />} />
        <Route path="/report-scam" element={isAuthenticated ? <><ReportScam /><BottomNav /></> : <Navigate to="/signup" />} />
        <Route path="/verified-profile" element={isAuthenticated ? <><VerifiedProfile /><BottomNav /></> : <Navigate to="/signup" />} />
        <Route path="/get-verified" element={isAuthenticated ? <><GetVerified /><BottomNav /></> : <Navigate to="/signup" />} />
        <Route path="/verification-status" element={isAuthenticated ? <><VerificationStatus /><BottomNav /></> : <Navigate to="/signup" />} />
        <Route path="/my-reports" element={isAuthenticated ? <><MyReports /><BottomNav /></> : <Navigate to="/signup" />} />
        <Route path="/notifications" element={isAuthenticated ? <><Notifications /><BottomNav /></> : <Navigate to="/signup" />} />
        <Route path="/profile" element={isAuthenticated ? <><Profile user={user} onLogout={handleLogout} /><BottomNav /></> : <Navigate to="/signup" />} />
        <Route path="/privacy-settings" element={isAuthenticated ? <><PrivacySettings /><BottomNav /></> : <Navigate to="/signup" />} />
        <Route path="/privacy-security" element={isAuthenticated ? <><PrivacySecurity /><BottomNav /></> : <Navigate to="/signup" />} />
        <Route path="/more" element={isAuthenticated ? <><More user={user} onLogout={handleLogout} /><BottomNav /></> : <Navigate to="/signup" />} />

        {/* Default */}
        <Route path="/" element={<Navigate to={isAuthenticated ? '/home' : '/signup'} />} />
      </Routes>
    </Router>
  );
}

export default App;
