import React, { useEffect, useState, useRef } from 'react'; // Import useRef
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import './Header.css';

const Header = ({ user }) => {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [userDetailsFromDb, setUserDetailsFromDb] = useState(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const profileRef = useRef(null); // Create a ref for the clickable area

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) {
        // Reset state if user is not available
        setRole('');
        setUserDetailsFromDb(null);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setRole(userData.role || '');
          setUserDetailsFromDb(userData);
        } else {
          console.warn(`User document for UID ${user.uid} not found.`);
          setRole(''); // Ensure role is cleared if doc doesn't exist
          setUserDetailsFromDb(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setRole('');
        setUserDetailsFromDb(null);
      }
    };

    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleProfileClick = () => {
    setShowProfilePopup((prev) => !prev);
  };

  // Close popup when clicked outside
  useEffect(() => {
    const closeOnClickOutside = (e) => {
      // Check if the click is outside the profile area (which includes the popup itself)
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfilePopup(false);
      }
    };
    document.addEventListener('mousedown', closeOnClickOutside); // Use mousedown for better handling
    return () => document.removeEventListener('mousedown', closeOnClickOutside);
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo-container">
          <svg className="logo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
            <path d="M15.232 5.232a2.5 2.5 0 113.536 3.536L7 20H3v-4L15.232 5.232z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="app-title">QuickPermit</span>
        </div>
      </div>

      <div className="header-right">
        {/* Wrap user info and popup in a div for positioning */}
        <div className="profile-wrapper" ref={profileRef}>
          <div className="user-info" onClick={handleProfileClick}>
            <div className="user-details">
              {/* Ensure userDetailsFromDb is used for consistency */}
              <span className="user-name">{userDetailsFromDb?.name || user?.displayName || 'User'}</span>
              <span className="user-role">{role?.toUpperCase()}</span>
            </div>
            <div className="avatar-container">
              <img
                src={user?.photoURL || 'https://i.pravatar.cc/40'}
                alt="Profile"
                className="profile-pic"
              />
            </div>
          </div>

          {/* This is where the popup should be, as a sibling to user-info */}
          {showProfilePopup && userDetailsFromDb && ( // Only show if user details are loaded
            <div className="profile-popup">
              {/* Fallback to user.email if userDetailsFromDb.email is not set */}
              <p><strong>{userDetailsFromDb?.name || user?.displayName || 'N/A'}</strong></p>
              <p>{userDetailsFromDb?.email || user?.email || 'N/A'}</p>
              <p>{userDetailsFromDb?.role?.toUpperCase() || 'N/A'}</p>
              {userDetailsFromDb?.designation && <p>{userDetailsFromDb.designation}</p>}
              {userDetailsFromDb?.department && <p>{userDetailsFromDb.department}</p>}
            </div>
          )}
        </div>

        <button onClick={handleLogout} className="logout-btn">
          <svg xmlns="http://www.w3.org/2000/svg" className="logout-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;