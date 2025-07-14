// src/pages/Login.js
import React, { useState } from 'react';
import { auth, db, googleProvider } from '../services/firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, form.email, form.password);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const role = userDoc.data()?.role;

      if (role === 'student') navigate('/student');
      else if (role === 'faculty' || role === 'hod') navigate('/hod');
      else alert('No valid role found');
    } catch (err) {
      alert('Login failed: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
        const role = userDoc.data().role;
        if (role === 'student') navigate('/student');
        else if (role === 'faculty' || role === 'hod') navigate('/hod');
        else alert("No role assigned.");
      } else {
        alert("Account not registered. Please register first.");
      }
    } catch (err) {
      alert('Google Sign-In Failed: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="university-section">
        <div className="welcome-overlay">
          <h1>Welcome to <span className="brand">QuickPermit</span></h1>
          <p className="tagline">Streamlining campus permissions for students and faculty</p>
        </div>
        <div className="campus-features">
          <div className="feature">
            <div className="feature-icon">📋</div>
            <div className="feature-text">Easy permit requests</div>
          </div>
          <div className="feature">
            <div className="feature-icon">⏱️</div>
            <div className="feature-text">Fast approval process</div>
          </div>
          <div className="feature">
            <div className="feature-icon">🔒</div>
            <div className="feature-text">Secure campus access</div>
          </div>
        </div>
      </div>
      
      <div className="login-section">
        <div className="login-card">
          <div className="login-header">
            <h2>Sign in to your account</h2>
            <p>Enter your credentials to continue</p>
          </div>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="name@university.edu"
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-options">
              <div className="remember-me">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Remember me</label>
              </div>
              <a href="/forgot-password" className="forgot-link">Forgot password?</a>
            </div>
            
            <button 
              type="submit" 
              className="login-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner"></span>
              ) : "Sign in"}
            </button>
          </form>

          <div className="divider">
            <span>or continue with</span>
          </div>
          
          <button 
            className="google-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="google-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            Sign in with Google
          </button>

          <div className="register-section">
            <p>Don't have an account? <a href="/register">Create account</a></p>
          </div>
        </div>
        
        <div className="footer">
          <p>© 2023 QuickPermit. All rights reserved.</p>
          <div className="footer-links">
            <a>Privacy Policy</a>
            <a>Terms of Service</a>
            <a>Contact Support</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;