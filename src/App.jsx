import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';

// --- Pages ---
import Register from './pages/Register';
import Login from './pages/Login';
const IMAGE = './src/assets/info.png';

// --- Components ---
import StudentProfileForm from './components/StudentProfileForm';
import RoleSelection from './components/RoleSelection';
import InterviewChecklist from './components/InterviewChecklist';
import AptitudeTest from './components/AptitudeTest';
import DomainTest from './components/DomainTest';
import Dashboard from './components/Dashboard';


function RequireAuth({ children, user }) {
  const nav = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("DEBUG — RequireAuth:", {
      profileCompleted: user?.profileCompleted,
      progressPercent: user?.progressPercent,
      pathname: location.pathname
    });

    if (!user) {
      nav('/login');
      return;
    }

    // 1. Profile not complete → force profile page
    if (!user.profileCompleted && location.pathname !== '/profile') {
      nav('/profile');
      return;
    }

    const isDomainSaved = user.progressPercent >= 30;

    // 2. Skip role selection if domain already chosen
    if (user.profileCompleted && isDomainSaved && location.pathname === '/select-role') {
      nav('/checklist');
      return;
    }

    // ❌ DO NOT BLOCK DASHBOARD
    // let dashboard be open normally
    // Checklist will show buttons based on Google sheet values only

  }, [user, nav, location.pathname]);

  return user ? children : null;
}



export default function App() {
  const nav = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('assess_user');
      const u = saved ? JSON.parse(saved) : null;
      if (u) u.progressPercent = Number(u.progressPercent || 0);
      return u;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem('assess_user', JSON.stringify(user));
    else localStorage.removeItem('assess_user');
  }, [user]);

  // --- LOGIN FLOW (most important) ---
  const handleLogin = (u) => {
    u.progressPercent = Number(u.progressPercent || 0);
    setUser(u);

    const p = u.progressPercent;

    if (p < 20) nav('/profile');
    else if (p < 30) nav('/select-role');
    else if (p < 60) nav('/checklist');
    else nav('/dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    nav('/login');
  };

  const hideNav = location.pathname === '/login' || location.pathname === '/';

  return (
    <div className="app-root">

      {!hideNav && (
        <header className="app-header">
          <div className="header-inner">

            <div className="header-brand" onClick={() => nav(user ? '/dashboard' : '/')}>
              <div className="brand-text-container">
                <img src={IMAGE} alt="logo" className="logo" />
              </div>
            </div>

            <div className="header-controls">
              {!user ? (
                <>
                  <button className="nav-btn btn-ghost" onClick={() => nav('/login')}>Log in</button>
                  <button className="nav-btn btn-filled" onClick={() => nav('/')}>Register</button>
                </>
              ) : (
                <>
                  <span style={{ marginRight: 15, fontSize: '1.4rem', fontWeight: 600 }}>
                    Hi, {user.name}
                  </span>
                  <button
                    className="nav-btn btn-ghost"
                    onClick={handleLogout}
                    style={{ fontSize: '1.4rem', fontWeight: 600 }}
                  >
                    Logout
                  </button>
                </>
              )}
            </div>

          </div>
        </header>
      )}

      <main className="main-content">
        <Routes>

          {/* Public Routes */}
          <Route path="/" element={<Register />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          


          {/* Protected Routes */}
          <Route path="/profile" element={
            <RequireAuth user={user}>
              <StudentProfileForm
                studentId={user?.studentId}
                onSaved={(u) => setUser({ ...user, ...u })}
              />
            </RequireAuth>
          } />

          <Route path="/select-role" element={
            <RequireAuth user={user}>
              <RoleSelection
                studentId={user?.studentId}
                onDomainSaved={(d) => setUser(prev => ({ ...prev, ...d, progressPercent: 30 }))}
              />
            </RequireAuth>
          } />

          <Route path="/checklist" element={
            <RequireAuth user={user}>
              <InterviewChecklist studentId={user?.studentId} />
            </RequireAuth>
          } />

          <Route path="/aptitude" element={
            <RequireAuth user={user}>
              <AptitudeTest studentId={user?.studentId} />
            </RequireAuth>
          } />

          <Route path="/domain" element={
            <RequireAuth user={user}>
              <DomainTest studentId={user?.studentId} />
            </RequireAuth>
          } />

          <Route path="/dashboard" element={
            <RequireAuth user={user}>
              <Dashboard studentId={user?.studentId} />
            </RequireAuth>
          } />

        </Routes>
      </main>

    </div>
  );
}
