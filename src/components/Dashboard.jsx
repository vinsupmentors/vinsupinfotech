import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { post } from '../api';
import '../styles/dashboard.css';

export default function Dashboard({ studentId }) {
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get ID from prop OR local storage
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

    // 2. Fetch Data
    (async () => {
      try {
        const r = await post('getDashboard', { studentId: currentStudentId });
        if (r.status === 'ok') {
          const s = r.summary || {};
          setData({
            ...s,
            aptitude_mark: Number(s.aptitude_mark || 0),
            domain_mark: Number(s.domain_mark || 0),
            gd_mark: Number(s.gd_mark || 0),
            technical_mark: Number(s.technical_mark || 0),
            hr_mark: Number(s.hr_mark || 0),
            overall_score: Number(s.overall_score || 0),
            rank_position: Number(s.rank_position || 0),
            total_participants: Number(s.total_participants || 0),
            tests_completed: Number(s.tests_completed || 0),
            feedback: s.feedback || {},
            roadmap: s.roadmap || []
          });
          
          // Get profile data
          let fetchedProfile = r.profile || {};

          // FALLBACK: If API returned empty/null for profile fields, try to fill from LocalStorage
          if (!fetchedProfile.name || fetchedProfile.name === 'N/A') {
             try {
                const localUser = JSON.parse(localStorage.getItem('assess_user'));
                if (localUser) {
                   fetchedProfile = {
                      ...fetchedProfile,
                      name: localUser.name || fetchedProfile.name,
                      email: localUser.email || fetchedProfile.email
                   };
                }
             } catch(e) {}
          }
          setProfile(fetchedProfile);
        } else {
          setData(null);
        }
      } catch (err) {
        console.error(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId, nav]);

  const handleDownloadPDF = () => {
    window.print();
  };

  if (loading) return <div className="dashboard-container center-content">Loading Profile...</div>;
  if (!data) return <div className="dashboard-container center-content">No Data Found.</div>;

  // Helper: Get color/label based on score
  function getInterpretation(score, roundKey) {
    const s = Number(score || 0);
    if (s >= 8) return { label: 'Excellent', color: '#4ade80', message: interpretationMessages(roundKey, 'excellent') }; 
    if (s >= 6) return { label: 'Good', color: '#facc15', message: interpretationMessages(roundKey, 'good') }; 
    if (s >= 4) return { label: 'Average', color: '#38bdf8', message: interpretationMessages(roundKey, 'average') }; 
    if (s >= 2) return { label: 'Basic', color: '#fb923c', message: interpretationMessages(roundKey, 'basic') }; 
    return { label: 'Weak', color: '#f87171', message: interpretationMessages(roundKey, 'weak') }; 
  }

  function interpretationMessages(roundKey, level) {
    const pool = {
      aptitude: {
        excellent: 'Excellent logical reasoning and analytical strength.',
        good: 'Good grasp; practice timed problems to improve speed.',
        average: 'Understands basics but needs accuracy and speed practice.',
        basic: 'Needs improvement in core reasoning concepts.',
        weak: 'Fundamentals need strengthening; start with basics.'
      },
      domain: {
        excellent: 'Strong domain expertise and industry readiness.',
        good: 'Good domain understanding; deepen core practical topics.',
        average: 'Average knowledge; revise core concepts and examples.',
        basic: 'Weak domain foundation; revisit fundamentals.',
        weak: 'Not clear on domain basics; recommended foundational study.'
      },
      gd: {
        excellent: 'Strong communication & leadership presence.',
        good: 'Communicates well; improve structure.',
        average: 'Understands topic but lacks flow.',
        basic: 'Struggles expressing ideas clearly.',
        weak: 'Very low participation; work on basics.'
      },
      technical: {
        excellent: 'Strong technical fundamentals & problem solving.',
        good: 'Good basics; more hands-on practice recommended.',
        average: 'Understands concepts but needs applied practice.',
        basic: 'Weak fundamentals; strengthen core concepts.',
        weak: 'Struggles with technical questions.'
      },
      hr: {
        excellent: 'Excellent confidence and cultural fit.',
        good: 'Good attitude; strengthen communication.',
        average: 'Average clarity; prepare common scenarios.',
        basic: 'Low confidence; practice mock conversations.',
        weak: 'Needs improvement in self-presentation.'
      }
    };
    const map = { aptitude: 'aptitude', domain: 'domain', gd: 'gd', technical: 'technical', hr: 'hr' };
    return pool[map[roundKey] || 'domain'][level];
  }

  const rounds = [
    { id: 'aptitude', title: 'Aptitude Test', score: Number(data.aptitude_mark || 0), max: 10 },
    { id: 'domain', title: 'Domain Test', score: Number(data.domain_mark || 0), max: 10 },
    { id: 'gd', title: 'Group Discussion', score: Number(data.gd_mark || 0), max: 10 },
    { id: 'technical', title: 'Technical Interview', score: Number(data.technical_mark || 0), max: 10 },
    { id: 'hr', title: 'HR Round', score: Number(data.hr_mark || 0), max: 10 }
  ];

  const sortedByNeed = [...rounds].sort((a,b) => a.score - b.score);
  const suggestions = [];
  for (let r of sortedByNeed) {
    if (suggestions.length >= 3) break;
    if (r.score < 8) {
      const interp = getInterpretation(r.score, r.id);
      suggestions.push({ round: r.title, score: r.score, suggestion: interp.message });
    }
  }
  if (suggestions.length === 0) suggestions.push({ round: 'All Rounds', score: 10, suggestion: 'Excellent performance. Keep practicing.' });

  const percent = Math.round((data.overall_score || 0));

  return (
    <div className="dashboard-container">
      <div className="dashboard-wrapper">
        
        <div className="dash-header">
          <h1 className="dash-title">Career Command Center</h1>
          <p className="dash-subtitle">Your personalized performance report and action plan.</p>
        </div>

        {/* PROFILE SECTION (Top of Page 1 in Print) */}
        {profile && (
          <div className="profile-section bento-card">
            <h3 className="profile-title">Candidate Profile</h3>
            <div className="profile-grid">
              <div className="profile-item">
                <span className="p-label">Name:</span>
                <span className="p-value">{profile.name || "N/A"}</span>
              </div>
              <div className="profile-item">
                <span className="p-label">Email:</span>
                <span className="p-value">{profile.email || "N/A"}</span>
              </div>
              <div className="profile-item">
                <span className="p-label">Phone:</span>
                <span className="p-value">{profile.phone || "N/A"}</span>
              </div>
              <div className="profile-item">
                <span className="p-label">College:</span>
                <span className="p-value">{profile.college || "N/A"}</span>
              </div>
              <div className="profile-item">
                <span className="p-label">Degree:</span>
                <span className="p-value">
                  {profile.degree || "N/A"} {profile.year ? `(${profile.year})` : ''}
                </span>
              </div>
              <div className="profile-item">
                <span className="p-label">Domain:</span>
                <span className="p-value">{profile.domain || "N/A"}</span>
              </div>
              <div className="profile-item">
                <span className="p-label">Assessment Date:</span>
                <span className="p-value">{profile.assessmentDate || new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}

        <div className="bento-grid advanced-grid">

          {/* LEFT: BLUE SCORE CARD (Bottom of Page 1 in Print) */}
          <div className="bento-card score-card">
            <div className="rank-badge">🏆 Rank #{data.rank_position || '-'}</div>
            <div className="score-content-wrapper">
              <div className="score-top-section">
                <div className="big-score-row">
                  <div className="big-score">{percent}%</div>
                  <div className="score-meta">
                    <div style={{fontWeight: 700, fontSize: '1.2rem'}}>Based on {data.tests_completed || 0} assessments</div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{width: `${percent}%`}}></div>
                    </div>
                    <div style={{marginTop: 10, fontSize: '1rem', opacity: 0.95}}>
                      Percentile: {data.ranking_top || 'N/A'} • Participants: {data.total_participants || '-'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounds-scroll-area">
                {rounds.map((r) => {
                  const interp = getInterpretation(r.score, r.id);
                  return (
                    <div key={r.id} className="round-item">
                      <div className="round-circle" style={{borderColor: interp.color}}>
                        <div className="round-val" style={{color: interp.color}}>{r.score.toFixed(1)}</div>
                      </div>
                      <div className="round-info">
                        <h4>{r.title}</h4>
                        <div className="round-status" style={{color: interp.color}}>{interp.label}</div>
                        <div className="round-desc">{interp.message}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: ROADMAP & SUGGESTIONS (Screen: Right Column / Print: Page 2 Bottom) */}
          <div className="roadmap-wrapper" style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
            <div className="bento-card roadmap-card">
              <div className="card-title">🚀 Your 30-Day Action Plan</div>
              <div className="timeline">
                {data.roadmap && data.roadmap.map((step, i) => (
                  <div key={i} className={`timeline-item ${step.status || ''}`}>
                    <div className="timeline-dot">{step.status === 'done' ? '✓' : i+1}</div>
                    <div className="timeline-content">
                      <h4>{step.week}: {step.focus}</h4>
                      <p>{step.task}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bento-card suggestions-card">
              <div className="card-title">💡 Suggested Actions</div>
              <div className="suggest-list">
                {suggestions.map((s, i) => (
                  <div key={i} className="suggest-item">
                    <div className="suggest-left">{i+1}</div>
                    <div className="suggest-right">
                      <div className="s-title">{s.round} — <strong>{Number(s.score).toFixed(2)}/10</strong></div>
                      <div className="s-msg">{s.suggestion}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BOTTOM: DETAILED ANALYSIS (Screen: Bottom / Print: Page 2 Top) */}
          <div className="bento-card analysis-card" style={{gridColumn: '1 / -1'}}>
            <div className="card-title">📊 Detailed Analysis</div>
            <div className="analysis-grid">
              <div className="analysis-left">
                <div className="analysis-row header">
                  <div>Round</div>
                  <div>Score</div>
                  <div>Status</div>
                  <div>Action</div>
                </div>
                {rounds.map((r) => {
                  const interp = getInterpretation(r.score, r.id);
                  return (
                    <div key={r.id} className="analysis-row">
                      <div className="ar-round">{r.title}</div>
                      <div className="ar-score">{r.score.toFixed(2)} / {r.max}</div>
                      <div className="ar-status" style={{color: interp.color === '#4ade80' ? '#16a34a' : interp.color === '#facc15' ? '#ca8a04' : '#0284c7'}}>{interp.label}</div>
                      <div className="ar-action">{interp.message}</div>
                    </div>
                  );
                })}
              </div>
              <div className="analysis-right">
                <div style={{marginBottom: '1.5rem'}}>
                  <div className="fb-title" style={{color:'#059669', fontWeight:700, marginBottom:8}}>👍 Top Strengths</div>
                  <ul className="fb-list">
                    {data.feedback?.strengths?.length ? data.feedback.strengths.map((s,i)=><li key={i}>{s}</li>) : <li>No specific strengths detected yet.</li>}
                  </ul>
                </div>
                <div>
                  <div className="fb-title" style={{color:'#d97706', fontWeight:700, marginBottom:8}}>⚡ Focus Areas</div>
                  <ul className="fb-list">
                    {data.feedback?.improvements?.length ? data.feedback.improvements.map((s,i)=><li key={i}>{s}</li>) : <li>No specific focus areas yet.</li>}
                  </ul>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button className="pdf-btn" onClick={handleDownloadPDF}>📥 Download Report as PDF</button>
              <a href="https://wa.me/918925876525?text=I%20want%20career%20guidance%20based%20on%20my%20score." target="_blank" rel="noopener noreferrer" className="career-guidance-btn">
                💬 Get 1-on-1 Free Career Guidance
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}