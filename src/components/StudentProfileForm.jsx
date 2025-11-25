// src/components/StudentProfileForm.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { post } from '../api'; 
import '../styles/profile.css';

export default function StudentProfileForm({ studentId, onSaved }) {
  const nav = useNavigate();
  const topRef = useRef(null);

  const [form, setForm] = useState({
    name:'', phone:'', college:'', degree:'', graduationYear:'', 
    dreamJobRole:'', planAfterCollege:'', seeYourself2Years:'', whyThisPath:'', 
    interestedCoding:false, interestedCreative:false, interestedMarketing:false,
    preferredJobType:'', domainsCurious:'', toolsKnown:'', languagesKnown:'', 
    projectsDone:false, projectsDescription:'', internshipExperience:false, githubLink:'',
    resumeFile: null,        // File object chosen by user (frontend only)
    resumeUrl: ''            // Existing Drive URL (fetched from backend)
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(()=> {
    if (!studentId) return;
    (async ()=> {
      try {
        const r = await post('getProfile', { studentId });
        if (r.status === 'ok' && r.profile) {
          const p = r.profile;
          setForm(prev => ({
            ...prev,
            name: p.name || prev.name,
            phone: p.phone || prev.phone,
            college: p.college || prev.college,
            degree: p.degree || prev.degree,
            graduationYear: p.graduationYear || prev.graduationYear,
            dreamJobRole: p.dreamJobRole || prev.dreamJobRole,
            planAfterCollege: p.planAfterCollege || prev.planAfterCollege,
            seeYourself2Years: p.seeYourself2Years || prev.seeYourself2Years,
            whyThisPath: p.whyThisPath || prev.whyThisPath,
            interestedCoding: (p.interestedCoding === true || p.interestedCoding === 'true') || prev.interestedCoding,
            interestedCreative: (p.interestedCreative === true || p.interestedCreative === 'true') || prev.interestedCreative,
            interestedMarketing: (p.interestedMarketing === true || p.interestedMarketing === 'true') || prev.interestedMarketing,
            preferredJobType: p.preferredJobType || prev.preferredJobType,
            domainsCurious: p.domainsCurious || prev.domainsCurious,
            toolsKnown: p.toolsKnown || prev.toolsKnown,
            languagesKnown: p.languagesKnown || prev.languagesKnown,
            projectsDone: (p.projectsDone === true || p.projectsDone === 'true') || prev.projectsDone,
            projectsDescription: p.projectsDescription || prev.projectsDescription,
            internshipExperience: (p.internshipExperience === true || p.internshipExperience === 'true') || prev.internshipExperience,
            githubLink: p.githubLink || prev.githubLink,
            resumeUrl: p.resumeLink || p.resumeURL || prev.resumeUrl // tolerate both names
          }));
        }
      } catch (err) {
        // ignore silently
      }
    })();
  }, [studentId]);

  function update(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  const isBlank = (value) => !String(value || '').trim();

  function validate() {
    // Basic validation (keep your existing rules)
    if (isBlank(form.name)) return "Full Name is required";
    if (isBlank(form.phone)) return "Phone Number is required";
    if (isBlank(form.college)) return "College Name is required";
    if (isBlank(form.degree)) return "Degree is required";
    if (isBlank(form.graduationYear)) return "Graduation Year is required";
    if (isBlank(form.dreamJobRole)) return "Dream Job Role is required";
    if (isBlank(form.planAfterCollege)) return "Please select a Plan After College";
    if (isBlank(form.seeYourself2Years)) return "Please tell us where you see yourself in 2 years";
    if (isBlank(form.whyThisPath)) return "Please explain why you chose this path";
    if (isBlank(form.domainsCurious)) return "Please list domains you are curious about";
    if (isBlank(form.preferredJobType)) return "Preferred Job Type is required";
    if (isBlank(form.languagesKnown)) return "Please list languages you know (or type 'None')";
    if (isBlank(form.toolsKnown)) return "Please list tools you know (or type 'None')";
    if (!form.interestedCoding && !form.interestedCreative && !form.interestedMarketing) {
      return "Please select at least one Primary Interest";
    }
    if (form.projectsDone && isBlank(form.projectsDescription)) {
      return "Since you selected 'Built projects', please describe them.";
    }
    // resume optional; you can require by uncommenting below:
    // if (!form.resumeUrl && !form.resumeFile) return "Please upload your resume (PDF/DOC/DOCX).";
    return "";
  }

  const scrollToError = () => {
    if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Acceptable mime types
  const ACCEPTED = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  function handleFilePick(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (!ACCEPTED.includes(f.type) && !/\.(pdf|doc|docx)$/i.test(f.name)) {
      alert('Only PDF or Word files are allowed.');
      return;
    }
    // Limit file size to, say, 8MB
    if (f.size && f.size > 8 * 1024 * 1024) {
      alert('File too large. Max allowed size is 8MB.');
      return;
    }
    setForm(prev => ({ ...prev, resumeFile: f }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg('');
    const error = validate();
    if (error) {
      setMsg(error);
      setTimeout(scrollToError, 120);
      return;
    }

    setLoading(true);
    try {

      // -----------------------------
      // Convert resumeFile (if any) to base64
      // -----------------------------
      let resumeBase64 = "";
      if (form.resumeFile) {
        resumeBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            // result is like: data:application/pdf;base64,JVBERi0x...
            const parts = String(reader.result).split(',');
            resolve(parts[1] || '');
          };
          reader.onerror = () => reject("");
          reader.readAsDataURL(form.resumeFile);
        });
      }

      // Build payload: we will send resumeBase64 and file name (backend will save to Drive)
      const payload = {
        studentId,
        // main profile fields (only send the ones that matter)
        name: form.name,
        phone: form.phone,
        college: form.college,
        degree: form.degree,
        graduationYear: form.graduationYear,
        dreamJobRole: form.dreamJobRole,
        planAfterCollege: form.planAfterCollege,
        seeYourself2Years: form.seeYourself2Years,
        whyThisPath: form.whyThisPath,
        interestedCoding: form.interestedCoding,
        interestedCreative: form.interestedCreative,
        interestedMarketing: form.interestedMarketing,
        preferredJobType: form.preferredJobType,
        domainsCurious: form.domainsCurious,
        toolsKnown: form.toolsKnown,
        languagesKnown: form.languagesKnown,
        projectsDone: form.projectsDone,
        projectsDescription: form.projectsDescription,
        internshipExperience: form.internshipExperience,
        githubLink: form.githubLink,
        // resume payload
        resumeFile: resumeBase64,
        resumeFileName: form.resumeFile ? form.resumeFile.name : "",
      };

      const r = await post('saveProfile', payload);

      if (r.status === 'ok') {
        // if backend returned updated resume link, apply it
        const updatedResumeLink = r.resumeLink || r.resumeURL || null;

        const existing = localStorage.getItem('assess_user') ? JSON.parse(localStorage.getItem('assess_user')) : {};
        const updated = {
          ...existing,
          profileCompleted: true,
          profile: payload,
          progressPercent: 20
        };
        localStorage.setItem('assess_user', JSON.stringify(updated));
        if (typeof onSaved === 'function') onSaved(updated);

        // If resume URL present, update local form state
        if (updatedResumeLink) setForm(prev => ({ ...prev, resumeUrl: updatedResumeLink, resumeFile: null }));

        nav('/select-role');
      } else {
        setMsg(r.message || 'Could not save profile');
        if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

    } catch (err) {
      setMsg('Network error: ' + (err.message || err));
      if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } finally {
      setLoading(false);
    }
  }

  const InterestChip = ({ label, field }) => (
    <div className={`chip-label ${form[field] ? 'active' : ''}`} onClick={() => update(field, !form[field])}>
      {form[field] && <span style={{marginRight:6}}>✓</span>}
      {label}
    </div>
  );

  return (
    <div className="profile-container">
      <div className="profile-card">
        
        <div className="profile-header">
          <h2 className="profile-title" ref={topRef}>Complete Your Profile</h2>
          <p className="profile-subtitle">All fields marked with <span style={{color:'#d93025'}}>*</span> are required</p>
          
          {msg && (
            <div className="rc-error" style={{
                marginTop: 20, padding: '15px', backgroundColor: '#fee2e2', color: '#b91c1c',
                borderRadius: '8px', fontWeight: '600', border: '1px solid #fecaca', textAlign: 'center'
            }}>
              ⚠️ {msg}
            </div>
          )}
        </div>

        <div className="profile-scroll-area">
          <form id="profileForm" onSubmit={handleSubmit}>

            {/* --- Basic Details (read-only for registration fields) --- */}
            <div className="form-section">
              <div className="section-title">Basic Details</div>
              
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Full Name <span className="req">*</span></label>
                  <input value={form.name} readOnly />
                </div>
                <div className="form-group">
                  <label>Phone Number <span className="req">*</span></label>
                  <input value={form.phone} readOnly />
                </div>
              </div>

              <div className="form-group">
                <label>College Name <span className="req">*</span></label>
                <input value={form.college} readOnly />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Degree & Dept <span className="req">*</span></label>
                  <input value={form.degree} readOnly />
                </div>
                <div className="form-group">
                  <label>Year of Graduation <span className="req">*</span></label>
                  <input value={form.graduationYear} readOnly />
                </div>
              </div>
            </div>

            {/* Other sections (career/goals/skills/experience) */}
            <div className="form-section">
              <div className="section-title">Career Aspirations</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Dream Job Role <span className="req">*</span></label>
                  <input value={form.dreamJobRole} onChange={e=>update('dreamJobRole', e.target.value)} placeholder="e.g. Full Stack Developer" />
                </div>
                <div className="form-group">
                  <label>Plan After College <span className="req">*</span></label>
                  <select value={form.planAfterCollege} onChange={e=>update('planAfterCollege', e.target.value)}>
                    <option value="">Select an option</option>
                    <option>Job / Placement</option>
                    <option>Higher Studies (Masters/MBA)</option>
                    <option>Entrepreneurship</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Where do you see yourself in 2 years? <span className="req">*</span></label>
                <input value={form.seeYourself2Years} onChange={e=>update('seeYourself2Years', e.target.value)} placeholder="Briefly describe your vision" />
              </div>

              <div className="form-group">
                <label>Why did you choose this career path? <span className="req">*</span></label>
                <textarea value={form.whyThisPath} onChange={e=>update('whyThisPath', e.target.value)} placeholder="I love building things because..." />
              </div>
            </div>

            <div className="form-section">
              <div className="section-title">Skills & Interests</div>
              <div className="form-group">
                <label>Primary Interests (Select at least one) <span className="req">*</span></label>
                <div className="interest-chips">
                  <InterestChip label="Coding & Development" field="interestedCoding" />
                  <InterestChip label="Creative & Design" field="interestedCreative" />
                  <InterestChip label="Marketing & Sales" field="interestedMarketing" />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Domains Curious About <span className="req">*</span></label>
                  <input value={form.domainsCurious} onChange={e=>update('domainsCurious', e.target.value)} placeholder="AI, Blockchain, Cloud..." />
                </div>
                <div className="form-group">
                  <label>Preferred Job Type <span className="req">*</span></label>
                  <input value={form.preferredJobType} onChange={e=>update('preferredJobType', e.target.value)} placeholder="Remote, On-site, Hybrid" />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Programming Languages <span className="req">*</span></label>
                  <input value={form.languagesKnown} onChange={e=>update('languagesKnown', e.target.value)} placeholder="Java, Python, JS..." />
                </div>
                <div className="form-group">
                  <label>Tools & Frameworks <span className="req">*</span></label>
                  <input value={form.toolsKnown} onChange={e=>update('toolsKnown', e.target.value)} placeholder="React, Figma, VS Code..." />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="section-title">Experience</div>

              <div className="form-group">
                <label style={{marginBottom:10}}>Have you built any projects?</label>
                <InterestChip label="Yes, I have built projects" field="projectsDone" />
              </div>

              {form.projectsDone && (
                <div className="form-group">
                  <label>Project Descriptions <span className="req">*</span></label>
                  <textarea value={form.projectsDescription} onChange={e=>update('projectsDescription', e.target.value)} placeholder="Describe 1 or 2 key projects..." />
                </div>
              )}

              <div className="form-group">
                <label style={{marginBottom:10}}>Internship Experience</label>
                <InterestChip label="Yes, I have done internships" field="internshipExperience" />
              </div>

              <div className="form-group">
                <label>GitHub / Portfolio Link (Optional)</label>
                <input value={form.githubLink} onChange={e=>update('githubLink', e.target.value)} placeholder="https://github.com/username" />
              </div>

              {/* RESUME UPLOAD */}
              <div className="form-group" style={{marginTop: 12}}>
                <label>Upload Resume (PDF or Word)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFilePick}
                />
                {form.resumeUrl && (
                  <div style={{marginTop:8}}>
                    <a href={form.resumeUrl} target="_blank" rel="noopener noreferrer">View uploaded resume</a>
                  </div>
                )}
                {form.resumeFile && (
                  <div style={{marginTop:8, color:'#0f5132', fontWeight:600}}>
                    Selected: {form.resumeFile.name}
                  </div>
                )}
              </div>

            </div>
          </form>
        </div>

        <div className="profile-footer">
          <button className="btn-save" type="submit" form="profileForm" disabled={loading}>
            {loading ? 'Saving Profile...' : 'Save & Continue'}
          </button>
        </div>

      </div>
    </div>
  );
}
