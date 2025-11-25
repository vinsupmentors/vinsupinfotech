// src/components/ProgressBar.jsx
import React from 'react';

export default function ProgressBar({ percent = 0 }) {
  return (
    <div className="progress-wrap" style={{marginBottom:16}}>
      <div className="progress-bar" style={{width: `${Math.min(100, Math.max(0, percent))}%`}} />
    </div>
  );
}
