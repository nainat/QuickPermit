import React from 'react';
import './UserProfileModal.css'; 

const UserProfileModal = ({ user, userRole, onClose }) => {
  if (!user) return null; 

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        
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
      
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
