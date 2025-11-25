import React, { useState } from "react";

import { useNavigate, Link } from "react-router-dom";
import { post } from "../api"; 
import "../styles/register.css";

const LEFT_IMAGE = './src/assets/info.png'; 
const LEFT_IMAGE1 = './src/assets/info.png'; 

// Large degree list
const DEGREE_LIST = [
  "B.Tech / B.E - Computer Science",
  "B.Tech / B.E - Information Technology",
  "B.Tech / B.E - Electronics & Communication",
  "B.Tech / B.E - Electrical Engineering",
  "B.Tech / B.E - Mechanical Engineering",
  "B.Tech / B.E - Civil Engineering",
  "B.Sc Computer Science",
  "B.Sc Information Technology",
  "BCA",
  "MCA",
  "M.Sc Computer Science",
  "M.Sc IT",
  "MBA",
  "B.Com",
  "BBA",
  "Other"
];

// Year range 2000 → 2030
const YEARS = Array.from({ length: 31 }, (_, i) => 2000 + i).reverse(); // Reverse for typical selection order (newest first)

export default function Register() {
  const nav = useNavigate();
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    college: "",
    degree: "",
    graduationYear: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  function update(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function validate() {
    if (!form.name) return "Please enter your name.";
    if (!form.email) return "Please enter your email.";
    if (!form.phone) return "Please enter phone.";
    if (!form.degree) return "Please select degree.";
    if (!form.graduationYear) return "Please select graduation year.";
    if (!form.password) return "Please enter password.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);

    try {
      const res = await post("register", form);

      if (res.status === "ok" && res.studentId) {
        // If registration is successful, set the success state
        setIsSuccess(true);
      } else {
        // Display API error message
        setError(res.message || "Registration failed");
      }
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- Success UI (Minimal Split View) ---
  if (isSuccess) {
    return (
      <div className="register-container">
        <div className="register-wrapper">
          <div className="register-left">
            <div className="register-left-content">
              {/* Use placeholder if asset path is uncertain */}
              <img src={LEFT_IMAGE1 || "https://placehold.co/400x300/1a73e8/ffffff?text=Success"} alt="Success Illustration" className="login-illustration" />
              <h3>Your journey starts now.</h3>
            </div>
          </div>

          <div className="register-right" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: "2rem" }}>
              <div style={{
                width: 60, height: 60, borderRadius: "50%",
                background: "#e6f4ea", color: "#1e8e3e",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, margin: "0 auto 1rem"
              }}>
                ✓
              </div>

              <h2 className="form-title">Registration Successful!</h2>
              <p style={{ color: "#5f6368" }}>
                Your account has been created successfully.
              </p>
            </div>

            <div style={{
              background: "#f8f9fa", border: "1px dashed #dadce0",
              borderRadius: 8, padding: "1.5rem", marginBottom: "2rem",
              textAlign: "left"
            }}>
              <div style={{ marginBottom: 10 }}>
                <small style={{color: '#5f6368', fontWeight: 700}}>Username</small>
                <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>{form.email}</div>
              </div>

              <div>
                <small style={{color: '#5f6368', fontWeight: 700}}>Password</small>
                <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>{form.password}</div>
              </div>
            </div>

            <button onClick={() => nav('/login')} className="btn-submit">
              Click here to Login →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Form UI (Styled with rc-form-grid) ---
  return (
    <div className="register-container">
      <div className="register-wrapper">

        {/* Left Side: Illustration / Branding */}
        <div className="register-left">
          <div className="register-left-content">
            <img src={LEFT_IMAGE || "https://placehold.co/400x300/1a73e8/ffffff?text=Vinsup+Portal"} alt="Welcome Illustration" className="login-illustration1" />
            <h3>Welcome to Vinsup Info Tech</h3>
            <p>Join the assessment portal to launch your career.</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="register-right">
          <div className="form-header">
            <h2 className="form-title">Registration</h2>
            <div className="title-underline"></div>
          </div>

          {error && <div className="rc-error">{error}</div>}

          <form className="rc-form" onSubmit={handleSubmit}>

            <div className="rc-form-grid">

              <div className="input-group">
                <label>Full Name</label>
                <input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Enter your name" />
              </div>

              <div className="input-group">
                <label>Phone Number</label>
                <input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="10 digit mobile" />
              </div>

              <div className="input-group">
                <label>Email Address</label>
                <input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="you@college.edu" />
              </div>

              <div className="input-group">
                <label>College Name</label>
                <input value={form.college} onChange={e => update("college", e.target.value)} placeholder="Institute Name" />
              </div>

              {/* DEGREE DROPDOWN */}
              <div className="input-group">
                <label>Degree</label>
                <select value={form.degree} onChange={e => update("degree", e.target.value)}>
                  <option value="">Select degree</option>
                  {DEGREE_LIST.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* YEAR DROPDOWN */}
              <div className="input-group">
                <label>Graduation Year</label>
                <select value={form.graduationYear} onChange={e => update("graduationYear", e.target.value)}>
                  <option value="">Select year</option>
                  {YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="input-group full-width">
                <label>Password</label>
                <input type="password" value={form.password} onChange={e => update("password", e.target.value)} placeholder="Create a strong password" />
              </div>

            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Creating..." : "Next Step →"}
            </button>

            <div className="rc-footer">
              Already have an account? <Link to="/login" className="link-login">Sign in</Link>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}