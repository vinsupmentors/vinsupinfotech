  // src/pages/Login.jsx
  import React, { useState } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { post } from '../api';
  import '../styles/login.css'; // Make sure to create this file!

  // Optional: Use a vector or image here. 
  // If Vinsup.png is transparent, it will look great on the blue background.
  const LEFT_IMAGE1 = './src/assets/info.png'; 
  const LEFT_IMAGE2 = './src/assets/skill.png'; 

  export default function Login({ onLogin }) {
    const nav = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
      e?.preventDefault();
      if (!email || !password) return alert('Please enter credentials');
      setLoading(true);
      try {
        const res = await post('login', { email, password });
        if (res.status === 'ok') {
          const user = { 
            studentId: res.studentId, 
            name: res.name || '', 
            email, 
            profileCompleted: !!res.profileCompleted, 
            progressPercent: res.progressPercent || 0 
          };
          localStorage.setItem('assess_user', JSON.stringify(user));
          if (typeof onLogin === 'function') onLogin(user);
          
          // Navigation Logic
          if (!user.profileCompleted) nav('/profile'); 
          else nav('/select-role');
          
        } else {
          alert(res.message || 'Login failed');
        }
      } catch (err) {
        alert('Network error: ' + (err.message || err));
      } finally {
        setLoading(false);
      }
    }

    return (
      <div className="login-container">
        <div className="login-wrapper">
          
          {/* Left Side - Branding/Image */}
          <div className="login-left">
            {/* If image fails to load, the gradient background still looks good */}
            <img src={LEFT_IMAGE1} alt="Vinsup Info Tech" className="login-illustration" onError={(e) => e.target.style.display='none'} />
            
            <br />  <br />
            <h3>Welcome Back!</h3>
            <p>
              Access your attempt, evaluate the feedback provided, refine your preparation, and achieve excellence.
            </p>
          </div>

          {/* Right Side - Login Form */}
          <div className="login-right">
            <div className="login-header">
              <h2 className="login-title">Sign In</h2>
              <p className="login-sub">Enter your credentials to continue</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="student@college.edu" 
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                />
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </button>

              <div className="login-actions">
                <div>
                  Forgot password? 
                  <span className="link-text" onClick={()=>alert('Please contact your administrator to reset password.')}>
                    Reset
                  </span>
                </div>
                
                <div style={{borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '5px'}}>
                  Don't have an account? 
                  <span className="link-text" onClick={()=>nav('/')}>
                    Register Now
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }