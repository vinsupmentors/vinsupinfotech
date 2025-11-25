// src/components/RequireProfile.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function RequireProfile({ children }) {
  const u = localStorage.getItem('assess_user');
  const user = u ? JSON.parse(u) : null;
  // If no user at all -> redirect to login
  if (!user || !user.studentId) return <Navigate to="/login" replace />;

  // If profile not completed -> redirect to profile
  if (!user.profileCompleted) return <Navigate to="/profile" replace />;

  // OK: allow access
  return children;
}
