import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { post } from '../api';
import '../styles/role-selection.css';

// Data strictly organized by column
const DOMAINS = {
  noCoding: ["Business Analysis", "Consulting", "Content Writing", "Customer Success", "Data Entry", "Digital Marketing", "Event Management", "Finance Basics", "Graphic Design", "HR & Recruitment", "Operations", "Project Management", "Sales", "Teaching & Training", "UX Research"],
  lowCoding: ["Basic Dashboarding", "BI Tools", "CMS Admin", "CRM Basics", "Data Analyst", "ETL Basics", "Excel Power Users", "Forms & Workflows", "Low-Code Apps", "No-Code Mobile Apps", "Power Platform", "RPA Basics", "Sheets Automation", "WordPress", "Zapier Automations"],
  coding: ["AI/ML", "Backend Development", "Blockchain", "Cloud Engineering", "Data Science", "Database Admin", "DevOps", "Embedded Systems", "Frontend Development", "Game Development", "Mobile Dev", "QA & Testing", "Security", "SRE", "Web Development"]
};

// Added onDomainSaved prop
export default function RoleSelection({ studentId, onDomainSaved }) { 
  const nav = useNavigate();
  
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  async function saveSelection() {
    if (!selectedDomain) { alert('Please select a domain to continue'); return; }
    
    setLoading(true);
    try {
      const r = await post('selectDomain', { studentId, category: selectedCategory, domain: selectedDomain });
      if (r.status === 'ok') {
        const domainData = { selectedCategory, selectedDomain, profileCompleted: true };

        // 1. Update Local Storage
        try {
            const existing = localStorage.getItem('assess_user') ? JSON.parse(localStorage.getItem('assess_user')) : {};
            const updated = { ...existing, ...domainData };
            localStorage.setItem('assess_user', JSON.stringify(updated));
            // 2. Notify Parent (App.jsx)
            if (onDomainSaved) onDomainSaved(domainData);
        } catch (e) { console.error("Local storage error", e); }

        nav('/checklist'); 
      } else {
        nav('/checklist'); 
      }
    } catch (err) {
      console.error(err);
      nav('/checklist');
    } finally { 
      setLoading(false); 
    }
  }

  const handleSelect = (catKey, domain) => {
    setSelectedCategory(catKey);
    setSelectedDomain(domain);
  };

  return (
    <div className="role-container">
      <div className="role-card-wrapper">
        
        {/* Header */}
        <div className="role-header">
          <h2 className="role-title">Choose Your Designation</h2>
          <p className="role-subtitle">Select the role you want to practice for</p>
        </div>

        {/* 3-Column Body */}
        <div className="role-body">
          <div className="three-column-grid">
            
            {/* Column 1: No Coding */}
            <div className="role-column">
              <div className="column-header header-noCoding">No Coding</div>
              <div className="column-content">
                {DOMAINS.noCoding.map(d => (
                  <div 
                    key={d} 
                    className={`role-item ${selectedDomain === d ? 'selected' : ''}`}
                    onClick={() => handleSelect('noCoding', d)}
                  >
                    {d}
                    {selectedDomain === d && <span className="check-mark">✓</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Low Coding */}
            <div className="role-column">
              <div className="column-header header-lowCoding">Low Coding</div>
              <div className="column-content">
                {DOMAINS.lowCoding.map(d => (
                  <div 
                    key={d} 
                    className={`role-item ${selectedDomain === d ? 'selected' : ''}`}
                    onClick={() => handleSelect('lowCoding', d)}
                  >
                    {d}
                    {selectedDomain === d && <span className="check-mark">✓</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Coding */}
            <div className="role-column">
              <div className="column-header header-coding">Coding</div>
              <div className="column-content">
                {DOMAINS.coding.map(d => (
                  <div 
                    key={d} 
                    className={`role-item ${selectedDomain === d ? 'selected' : ''}`}
                    onClick={() => handleSelect('coding', d)}
                  >
                    {d}
                    {selectedDomain === d && <span className="check-mark">✓</span>}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Fixed Footer */}
        <div className="role-footer">
          <button 
            className="btn-save" 
            onClick={saveSelection} 
            disabled={loading || !selectedDomain}
          >
            {loading ? 'Saving...' : (selectedDomain ? `Confirm: ${selectedDomain}` : 'Select a Role')}
          </button>
        </div>

      </div>
    </div>
  );
}