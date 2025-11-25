import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { post } from '../api';
import '../styles/checklist.css';

export default function InterviewChecklist({ studentId }) {
  const nav = useNavigate();
  const [status, setStatus] = useState({ aptitude:false, domain:false, gd:false, technical:false, hr:false });
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!studentId) return;
    setLoading(true);
    try {
      const r = await post('getDashboard', { studentId });
      if (r.status === 'ok') {
        const s = r.summary || {};
        setStatus({
          aptitude: (s.aptitude_mark || 0) > 0,
          domain: (s.domain_mark || 0) > 0,
          gd: (s.gd_mark || 0) > 0,
          technical: (s.technical_mark || 0) > 0,
          hr: (s.hr_mark || 0) > 0
        });
      }
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  }

  useEffect(()=> { load(); }, [studentId]);

  function startNext() {
    if (!status.aptitude) return nav('/aptitude');
    if (!status.domain) return nav('/domain');
    alert('Aptitude and Domain done. Please ask admin to enter GD/Technical/HR marks then refresh.');
  }

  // --- Status Logic Helpers ---
  const getStatusClass = (isDone, isNext) => {
    if (isDone) return 'completed';
    if (isNext) return 'active';
    return 'pending';
  };

  const getStatusIcon = (isDone, isNext) => {
    if (isDone) return '✅'; // Check mark
    if (isNext) return '🚀'; // Rocket for next
    return '🔒'; // Lock for pending
  };

  // Determine current stage
  const isAptitudeNext = !status.aptitude;
  const isDomainNext = status.aptitude && !status.domain;
  const isGDNext = status.aptitude && status.domain && !status.gd;
  const isTechNext = status.aptitude && status.domain && status.gd && !status.technical;
  const isHRNext = status.aptitude && status.domain && status.gd && status.technical && !status.hr;
  
  // Calculate progress bar width
  const completedCount = Object.values(status).filter(Boolean).length;
  const progressPercent = (completedCount / 5) * 100;

  return (
    <div className="checklist-container">
      <div className="checklist-card-wrapper">
        
        {/* Header */}
        <div className="checklist-header">
          <h2 className="checklist-title">Interview Roadmap</h2>
          <p className="checklist-subtitle">Complete each stage to unlock your final results</p>
        </div>

        {/* Progress Bar */}
        <div className="progress-track">
          <div className="progress-fill" style={{width: `${progressPercent}%`}}></div>
        </div>

        {/* The Grid of Cards */}
        <div className="checklist-grid">
          
          {/* 1. Aptitude */}
          <div className={`status-card ${getStatusClass(status.aptitude, isAptitudeNext)}`}>
            <div className="card-icon">{getStatusIcon(status.aptitude, isAptitudeNext)}</div>
            <div className="card-title">Aptitude Test</div>
            <div className="card-status">{status.aptitude ? 'Completed' : (isAptitudeNext ? 'Up Next' : 'Locked')}</div>
          </div>

          {/* 2. Domain */}
          <div className={`status-card ${getStatusClass(status.domain, isDomainNext)}`}>
            <div className="card-icon">{getStatusIcon(status.domain, isDomainNext)}</div>
            <div className="card-title">Technical Test</div>
            <div className="card-status">{status.domain ? 'Completed' : (isDomainNext ? 'Up Next' : 'Locked')}</div>
          </div>

          {/* 3. GD */}
          <div className={`status-card ${getStatusClass(status.gd, isGDNext)}`}>
            <div className="card-icon">{getStatusIcon(status.gd, isGDNext)}</div>
            <div className="card-title">Group Discussion</div>
            <div className="card-status">{status.gd ? 'Completed' : (isGDNext ? 'Pending Admin' : 'Locked')}</div>
          </div>

          {/* 4. Technical */}
          <div className={`status-card ${getStatusClass(status.technical, isTechNext)}`}>
            <div className="card-icon">{getStatusIcon(status.technical, isTechNext)}</div>
            <div className="card-title">Technical Interview</div>
            <div className="card-status">{status.technical ? 'Completed' : (isTechNext ? 'Pending Admin' : 'Locked')}</div>
          </div>

          {/* 5. HR */}
          <div className={`status-card ${getStatusClass(status.hr, isHRNext)}`}>
            <div className="card-icon">{getStatusIcon(status.hr, isHRNext)}</div>
            <div className="card-title">HR Round</div>
            <div className="card-status">{status.hr ? 'Completed' : (isHRNext ? 'Pending Admin' : 'Locked')}</div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="checklist-footer">
          <button className="btn-secondary" onClick={load} disabled={loading}>
            {loading ? 'Refreshing...' : '↻ Refresh Status'}
          </button>

          {/* Show "View Results" if all done, else "Start Next Step" */}
          {progressPercent === 100 ? (
            <button className="btn-primary" onClick={()=>nav('/dashboard')}>
              View Final Results
            </button>
          ) : (
            <button className="btn-primary" onClick={startNext} disabled={loading}>
              Start Next Assessment →
            </button>
          )}
        </div>

      </div>
    </div>
  );
}