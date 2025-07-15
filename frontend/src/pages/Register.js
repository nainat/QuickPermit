import React, { useState } from 'react';
import { auth, db, googleProvider } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Register.css';

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: '',
    designation: '',
    phone: '',
  });
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const userData = {
        uid: user.uid,
        name: form.name,
        email: form.email,
        role: form.role,
        department: form.department,
        designation: form.designation,
        phone: form.phone,
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      alert('Registration successful! Please sign in.');
      navigate('/');
    } catch (err) {
      console.error('Registration failed:', err);
      alert('Registration failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        const role = prompt('Enter your role (student/hod/faculty):');
        if (!['student', 'hod', 'faculty'].includes(role)) {
          alert('Invalid role');
          return;
        }

        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          role,
        });
      }

      navigate('/');
    } catch (err) {
      console.error('Google Sign-In Failed:', err);
      alert('Google Sign-In Failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="university-section">
        <div className="welcome-overlay">
          <h1>Join <span className="brand">QuickPermit</span></h1>
          <p className="tagline">Become part of our academic community</p>
        </div>
        <div className="campus-features">
          <div className="feature">
            <div className="feature-icon">🎓</div>
            <div className="feature-text">Student Portal Access</div>
          </div>
          <div className="feature">
            <div className="feature-icon">📅</div>
            <div className="feature-text">Manage Campus Permissions</div>
          </div>
          <div className="feature">
            <div className="feature-icon">🔐</div>
            <div className="feature-text">Secure Campus Access</div>
          </div>
        </div>
      </div>
      
      <div className="register-section">
        <div className="register-card">
          <div className="register-header">
            <h2>Create Your Account</h2>
            <p>Get started with QuickPermit in minutes</p>
          </div>
          
          <form onSubmit={handleRegister} className="register-form">
            <div className="input-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                placeholder="John Doe"
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="email">University Email</label>
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
              <div className="password-hint">Must be at least 8 characters</div>
            </div>
            
            <div className="input-group">
              <label htmlFor="role">Account Type</label>
              <select 
                id="role" 
                name="role" 
                onChange={handleChange} 
                required
                value={form.role}
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty Member</option>
                <option value="hod">Department Head (HOD)</option>
              </select>
            </div>
            
            {(form.role === 'faculty' || form.role === 'hod') && (
              <>
                <div className="input-group">
                  <label htmlFor="department">Department</label>
                  <input
                    id="department"
                    name="department"
                    placeholder="Computer Science"
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label htmlFor="designation">Designation</label>
                  <input
                    id="designation"
                    name="designation"
                    placeholder="Professor"
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="+1 (555) 123-4567"
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}
            
            <div className="terms-agreement">
              <input type="checkbox" id="terms" required />
              <label htmlFor="terms">I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></label>
            </div>
            
            <button 
              type="submit" 
              className="register-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner"></span>
              ) : "Create Account"}
            </button>
          </form>

          <div className="divider">
            <span>or sign up with</span>
          </div>
          
          <button 
            className="google-btn"
            onClick={handleGoogleSignUp}
            disabled={loading}
          >
            <svg className="google-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            Register with Google
          </button>

          <div className="login-section">
            <p>Already have an account? <a href="/">Sign in</a></p>
          </div>
        </div>
        
        <div className="footer">
          <p>© 2023 QuickPermit. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Support</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
