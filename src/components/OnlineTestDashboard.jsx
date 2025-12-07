import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { post } from '../api';
import '../styles/online-dashboard.css';

export default function OnlineTestDashboard({ studentId }) {
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let currentStudentId = studentId;
    if (!currentStudentId) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('assess_user'));
        currentStudentId = storedUser?.studentId;
      } catch (e) {}
    }

    if (!currentStudentId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const r = await post('getDashboard', { studentId: currentStudentId });
        if (r.status === 'ok') {
          const s = r.summary || {};
          setData({
            aptitude: Number(s.aptitude_mark || 0),
            domain: Number(s.domain_mark || 0),
            total_participants: Number(s.total_participants || 1), // Avoid div by zero
            rank: Number(s.rank_position || 1),
            name: r.profile?.name || "Candidate",
            email: r.profile?.email || ""
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  if (loading) return <div className="od-loading">Analyzing Performance...</div>;
  if (!data) return <div className="od-loading">No Results Found.</div>;

  // --- Calculated Metrics ---
  const avgScore = ((data.aptitude + data.domain) / 2).toFixed(1);
  const totalScore = data.aptitude + data.domain;
  const maxScore = 20; // 10 + 10
  const percentage = (totalScore / maxScore) * 100;
  
  // Calculate Percentile: How many people you are ahead of
  const percentile = Math.round(((data.total_participants - data.rank) / data.total_participants) * 100);

  // Status Logic
  const isQualified = avgScore >= 5; // Example threshold
  const statusColor = isQualified ? '#10b981' : '#f59e0b';
  const statusText = isQualified ? 'Shortlisted for Interview' : 'Under Review';

  return (
    <div className="od-container">
      <div className="od-wrapper">
        
        {/* TOP BANNER */}
        <div className="od-header-card">
          <div className="od-header-left">
            <h1 className="od-title">Assessment Report</h1>
            <p className="od-subtitle">Candidate: <span style={{color:'#1e293b', fontWeight:600}}>{data.name}</span></p>
            <div className="od-badges">
              <span className="od-badge">🆔 {studentId || 'N/A'}</span>
              <span className="od-badge">📅 {new Date().toLocaleDateString()}</span>
            </div>
          </div>
          <div className="od-header-right">
             <div className="od-status-box" style={{borderColor: statusColor, color: statusColor, background: isQualified ? '#ecfdf5' : '#fffbeb'}}>
                {statusText}
             </div>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="od-metrics-grid">
          
          {/* Main Score Block */}
          <div className="od-metric-card highlight">
            <div className="metric-label">Overall Aggregate</div>
            <div className="metric-value">{percentage}%</div>
            <div className="progress-bar-bg">
               <div className="progress-bar-fill" style={{width: `${percentage}%`}}></div>
            </div>
            <div className="metric-sub">Combined score of Aptitude & Domain</div>
          </div>

          {/* Rank Block */}
          <div className="od-metric-card">
            <div className="metric-label">Class Rank</div>
            <div className="metric-value">#{data.rank}</div>
            <div className="metric-sub">Out of {data.total_participants} participants</div>
          </div>

          {/* Percentile Block */}
          <div className="od-metric-card">
            <div className="metric-label">Percentile</div>
            <div className="metric-value top-tier">Top {100 - percentile}%</div>
            <div className="metric-sub">You scored higher than {percentile}% of peers</div>
          </div>

        </div>

        {/* DETAILED ANALYSIS SECTION */}
        <h3 className="section-heading"> Detailed Performance Breakdown</h3>
        <div className="od-analysis-grid">
          
          {/* APTITUDE DETAILS */}
          <div className="od-analysis-card">
            <div className="analysis-header">
              <div className="icon-box">🧠</div>
              <div>
                <h4>General Aptitude</h4>
                <span className="score-display">{data.aptitude} / 10</span>
              </div>
            </div>
            <div className="analysis-body">
              <p><strong>Performance Level:</strong> {data.aptitude >= 8 ? 'Excellent' : data.aptitude >= 5 ? 'Average' : 'Needs Improvement'}</p>
              <div className="feedback-text">
                {data.aptitude >= 8 
                  ? "Demonstrated strong logical reasoning and quick problem-solving abilities."
                  : "Good understanding of basics, but speed and accuracy in complex problems can be improved."}
              </div>
            </div>
          </div>

          {/* DOMAIN DETAILS */}
          <div className="od-analysis-card">
            <div className="analysis-header">
               <div className="icon-box">💻</div>
               <div>
                <h4>Technical Domain</h4>
                <span className="score-display">{data.domain} / 10</span>
              </div>
            </div>
            <div className="analysis-body">
              <p><strong>Performance Level:</strong> {data.domain >= 8 ? 'Expert' : data.domain >= 5 ? 'Intermediate' : 'Basic'}</p>
              <div className="feedback-text">
                {data.domain >= 8 
                  ? "High technical proficiency. Ready for advanced technical interview rounds."
                  : "Foundational knowledge is present. Focus on practical application and coding syntax."}
              </div>
            </div>
          </div>

        </div>

        {/* NEXT STEPS JOURNEY */}
        <h3 className="section-heading">🚀 Upcoming Interview Roadmap</h3>
        <div className="od-roadmap">
           <div className="roadmap-step completed">
              <div className="step-marker">✓</div>
              <div className="step-content">
                <h5>Online Assessment</h5>
                <p>Completed on {new Date().toLocaleDateString()}</p>
              </div>
           </div>
           <div className="roadmap-line"></div>
           
           <div className="roadmap-step upcoming">
              <div className="step-marker">2</div>
              <div className="step-content">
                <h5>Group Discussion</h5>
                <p>Verify communication skills & confidence.</p>
              </div>
           </div>
           <div className="roadmap-line"></div>

           <div className="roadmap-step upcoming">
              <div className="step-marker">3</div>
              <div className="step-content">
                <h5>Technical Interview</h5>
                <p>In-depth code review & logic check.</p>
              </div>
           </div>
           
           <div className="roadmap-line"></div>
           <div className="roadmap-step upcoming">
              <div className="step-marker">4</div>
              <div className="step-content">
                <h5>HR Discussion</h5>
                <p>Salary negotiation & onboarding.</p>
              </div>
           </div>
        </div>

        <div className="od-footer">
          <p className="footer-note">Note: Please carry a printed copy of this report for the offline rounds.</p>
          {/* <button className="od-btn" onClick={() => window.print()}>📥 Download Report PDF</button> */}
        </div>

      </div>
    </div>
  );
}