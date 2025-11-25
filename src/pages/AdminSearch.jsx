// src/pages/AdminSearch.jsx
import React, { useState } from 'react';
import { post } from '../api';
import '../styles/admin.css';

// Reuse your Dashboard component
import Dashboard from '../components/Dashboard';

export default function AdminSearch() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const search = async () => {
    setError(''); setResult(null);
    if (!phone || String(phone).trim().length < 6) { setError('Enter a valid phone'); return; }
    setLoading(true);
    try {
      const r = await post('adminCheckStatus', { phone: String(phone).trim() });
      if (r.status === 'ok') setResult(r.result);
      else if (r.status === 'notfound') setError('Student not found');
      else setError(r.message || 'Error');
    } catch (err) {
      setError('Network error: ' + (err.message || err));
    } finally { setLoading(false); }
  };

  return (
    <div className="admin-container">
      <div className="admin-card">
        <h2>Admin — Student Quick Lookup</h2>
        <div className="admin-form">
          <input
            placeholder="Enter student phone number"
            value={phone}
            onChange={e=>setPhone(e.target.value)}
          />
          <button onClick={search} disabled={loading}>{loading ? 'Searching...' : 'Search'}</button>
        </div>

        {error && <div className="admin-error">{error}</div>}

        {result && (
          <div className="admin-result">
            <div className="student-info">
              <div><strong>{result.name || '—'}</strong> ({result.studentId || '—'})</div>
              <div>Phone: {result.phone}</div>
              <div>Domain: {result.selectedDomain || '—'}</div>
              <div>Progress: {result.progressPercent}%</div>
            </div>

            <div className="stage-box">
              <div className={result.aptitudeDone ? 'done' : 'pending'}>Aptitude: {result.aptitudeDone ? 'Done' : 'Pending'}</div>
              <div className={result.domainDone ? 'done' : 'pending'}>Domain: {result.domainDone ? 'Done' : 'Pending'}</div>
              <div className={result.gdDone ? 'done' : 'pending'}>GD: {result.gdDone ? 'Done' : 'Pending'}</div>
              <div className={result.technicalDone ? 'done' : 'pending'}>Technical: {result.technicalDone ? 'Done' : 'Pending'}</div>
              <div className={result.hrDone ? 'done' : 'pending'}>HR: {result.hrDone ? 'Done' : 'Pending'}</div>
            </div>

            <div className="score-box">
              <div>Aptitude mark: {result.studentScore.aptitude_mark || '—'}</div>
              <div>Domain mark: {result.studentScore.domain_mark || '—'}</div>
              <div>GD: {result.studentScore.gd_mark || '—'}</div>
              <div>Technical: {result.studentScore.technical_mark || '—'}</div>
              <div>HR: {result.studentScore.hr_mark || '—'}</div>
            </div>

            {result.allDone ? (
              <div className="dashboard-container-inner">
                <h3>Full Dashboard Preview</h3>
                {/* Reuse your Dashboard component to preview student dashboard */}
                <Dashboard studentId={result.studentId} />
              </div>
            ) : (
              <div className="admin-note">
                Student not finished. Use the above stages to know what to update.
              </div>
            )}

            {/* Optional: show uploaded recording path (local) */}
            {result.recordingPath && (
              <div className="recording-link">
                Recording path: <code>{result.recordingPath}</code>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
