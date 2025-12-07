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
    // Alert removed because the button below will change automatically
  }

  const getStatusClass = (isDone, isNext) => {
    if (isDone) return 'completed';
    if (isNext) return 'active';
    return 'pending';
  };

  const getStatusIcon = (isDone, isNext) => {
    if (isDone) return '✅';
    if (isNext) return '🚀';
    return '🔒';
  };

  // --- LOGIC UPDATES START HERE ---

  // 1. Current Step Logic
  const isAptitudeNext = !status.aptitude;
  const isDomainNext = status.aptitude && !status.domain;
  
  // NOTE: For GD, Tech, and HR, we pass 'false' for isNext because 
  // we don't want the user to try and click them online.
  
  const completedCount = Object.values(status).filter(Boolean).length;
  const progressPercent = (completedCount / 5) * 100;

  // 2. NEW CONDITION: Check if the "Online" portion is finished
  const isOnlineTestDone = status.aptitude && status.domain;

  return (
    <div className="checklist-container">
      <div className="checklist-card-wrapper">
        
        <div className="checklist-header">
          <h2 className="checklist-title">Interview Roadmap</h2>
          <p className="checklist-subtitle">Complete Aptitude & Domain to view your report</p>
        </div>

        {/* <div className="progress-track">
          <div className="progress-fill" style={{width: `${progressPercent}%`}}></div>
        </div> */}

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

          {/* 3. GD - Updated Label */}
          <div className={`status-card ${getStatusClass(status.gd, false)}`}>
            <div className="card-icon">{status.gd ? '✅' : '🗣️'}</div>
            <div className="card-title">Group Discussion</div>
            <div className="card-status">{status.gd ? 'Completed' : 'Offline Round'}</div>
          </div>

          {/* 4. Technical - Updated Label */}
          <div className={`status-card ${getStatusClass(status.technical, false)}`}>
            <div className="card-icon">{status.technical ? '✅' : '⚙️'}</div>
            <div className="card-title">Technical Interview</div>
            <div className="card-status">{status.technical ? 'Completed' : 'Offline Round'}</div>
          </div>

          {/* 5. HR - Updated Label */}
          <div className={`status-card ${getStatusClass(status.hr, false)}`}>
            <div className="card-icon">{status.hr ? '✅' : '🤝'}</div>
            <div className="card-title">HR Round</div>
            <div className="card-status">{status.hr ? 'Completed' : 'Offline Round'}</div>
          </div>

        </div>

        <div className="checklist-footer">
          <button className="btn-secondary" onClick={load} disabled={loading}>
            {loading ? 'Refreshing...' : '↻ Refresh Status'}
          </button>

          {/* 3. CHANGED BUTTON LOGIC */}
          {isOnlineTestDone ? (
            // LINK TO NEW COMPONENT HERE
            <button className="btn-primary" onClick={()=>nav('/online-result')}>
              View Assessment Report
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