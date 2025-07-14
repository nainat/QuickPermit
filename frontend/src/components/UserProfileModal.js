// src/components/UserProfileModal.js
import React from 'react';
import './UserProfileModal.css'; // Create this CSS file

const UserProfileModal = ({ user, userRole, onClose }) => {
  if (!user) return null; // Don't render if no user data

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Stop propagation to prevent closing when clicking inside the modal */}
        
        <button className="close-button" onClick={onClose}>&times;</button>
        
        <h2>User Profile</h2>
        
        <div className="profile-details">
          <img 
            src={user.photoURL || 'https://i.pravatar.cc/100'} 
            alt="Profile" 
            className="modal-profile-pic" 
          />
          <p><strong>Name:</strong> {user.displayName || 'N/A'}</p>
          <p><strong>Email:</strong> {user.email || 'N/A'}</p>
          <p><strong>Role:</strong> {userRole.toUpperCase() || 'N/A'}</p>
          {/* Add more user details here if available from your Firebase 'users' collection */}
          {/* Example: */}
          {/* <p><strong>Department:</strong> {user.department || 'N/A'}</p> */}
        </div>

        {/* You can add an "Edit Profile" button here if you implement that functionality */}
        {/* <button className="edit-profile-btn">Edit Profile</button> */}
      </div>
    </div>
  );
};

export default UserProfileModal;