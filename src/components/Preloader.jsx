import React from 'react';
import '../styles/preloader.css';
import LOGO_1 from '../assets/info.png'; // Your first logo
import LOGO_2 from '../assets/1.png'; // REPLACE THIS with your second logo path

export default function Preloader() {
  return (
    <div className="preloader-overlay">
      
      <div className="preloader-content">
        
        {/* TWO LOGOS CONTAINER (No Pop Circle) */}
        <div className="dual-logo-container">
          <img src={LOGO_1} alt="Logo 1" className="preloader-logo" />
          <div className="logo-divider"></div> {/* Vertical line between logos */}
          <img src={LOGO_2} alt="Logo 2" className="preloader-logo" />
        </div>

        {/* Text Section */}
        <div className="preloader-text-group">
          <h3 className="presents-text">Vinsup Presents</h3>
          <h1 className="main-title">Mock Interview Assessment</h1>
          <div className="divider-line"></div>
          <h2 className="lets-begin">Let's Begin</h2>
        </div>

        {/* Loading Indicator */}
        <div className="loader-status">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="loading-label">Loading Resources</span>
        </div>
      </div>

      {/* BOTTOM QUOTE */}
      <div className="preloader-footer">
        <p className="quote">"Success is where preparation and opportunity meet."</p>
      </div>

    </div>
  );
}