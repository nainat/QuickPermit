import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, updateDoc, doc, addDoc, deleteDoc, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './StudentDashboard.css';
import Modal from '../components/Modal';
import SubmitLetter from './SubmitLetter';
import Header from '../components/Header';
import { FiFileText, FiX, FiDownload, FiMessageSquare, FiUser, FiCalendar, FiClock, FiHome, FiBook, FiMapPin, FiAward, FiPlus, FiEdit2, FiTrash2, FiSend } from 'react-icons/fi';

const StudentDashboard = () => {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [previewLetter, setPreviewLetter] = useState(null);
  const [previewLetterComments, setPreviewLetterComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (loggedUser) => {
      if (!loggedUser) {
        setLoading(false);
        return;
      }

      setUser(loggedUser);

      try {
        const snapshot = await getDocs(collection(db, 'letters'));
        const userLetters = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(doc => doc.uid === loggedUser.uid)
          .sort((a, b) => b.timestamp?.toMillis?.() - a.timestamp?.toMillis?.());

        setLetters(userLetters);
      } catch (error) {
        console.error('Error fetching letters:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!previewLetter) {
      setPreviewLetterComments([]);
      return;
    }

    const commentsRef = collection(db, 'letters', previewLetter.id, 'comments');
    const q = query(commentsRef, orderBy('timestamp', 'asc'));

    const unsubscribeComments = onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPreviewLetterComments(comments);
    }, (error) => {
      console.error("Error fetching real-time comments for preview:", error);
    });

    return () => unsubscribeComments();
  }, [previewLetter]);

  const handleDownload = (letter) => {
    if (!letter.fileBase64) return alert('No file found');
    const link = document.createElement('a');
    link.href = letter.fileBase64;
    link.download = `${letter.type || 'letter'}.pdf`;
    link.click();
  };

  const formatDate = (timestamp) => {
    return timestamp?.toDate?.().toLocaleString() || 'N/A';
  };

  const getStatusClass = (status) => {
    if (status === 'approved') return 'status-approved';
    if (status === 'declined') return 'status-declined';
    return 'status-pending';
  };

  const filteredLetters = letters.filter(letter => {
    const matchesTab = tab === 'all' || (tab === 'pending' ? !letter.status || letter.status === 'pending' : letter.status === tab);
    const matchesType = filterType === 'all' || letter.type === filterType;
    return matchesTab && matchesType;
  });

  const countByStatus = status => {
    if (status === 'pending') {
      return letters.filter(l => !l.status || l.status === 'pending').length;
    }
    if (status === 'all') return letters.length;
    return letters.filter(l => l.status === status).length;
  };

  const countByType = type => letters.filter(l => l.type === type).length;

  const renderLetterDetails = (letter) => {
    switch (letter.type) {
      case 'club_event':
        return (
          <>
            <div className="detail-item">
              <FiMapPin className="icon" />
              <span><strong>Club:</strong> {letter.clubName}</span>
            </div>
            <div className="detail-item">
              <FiCalendar className="icon" />
              <span><strong>Event:</strong> {letter.eventName}</span>
            </div>
            <div className="detail-item">
              <FiClock className="icon" />
              <span><strong>Event Date:</strong> {letter.eventDate}</span>
            </div>
            <div className="detail-item">
              <FiBook className="icon" />
              <span><strong>Description:</strong> {letter.eventDescription}</span>
            </div>
            <div className="detail-item">
              <FiAward className="icon" />
              <span><strong>Event Type:</strong> {letter.eventType}</span>
            </div>
          </>
        );
      case 'leave_letter':
        return (
          <>
            <div className="detail-item">
              <FiUser className="icon" />
              <span><strong>Name:</strong> {letter.studentName}</span>
            </div>
            <div className="detail-item">
              <FiHome className="icon" />
              <span><strong>Branch:</strong> {letter.branch}</span>
            </div>
            <div className="detail-item">
              <FiAward className="icon" />
              <span><strong>Roll No:</strong> {letter.rollNo}</span>
            </div>
            <div className="detail-item">
              <FiCalendar className="icon" />
              <span><strong>Leave Date:</strong> {letter.leaveDate}</span>
            </div>
          </>
        );
      case 'gate_pass':
        return (
          <>
            <div className="detail-item">
              <FiUser className="icon" />
              <span><strong>Name:</strong> {letter.studentName}</span>
            </div>
            <div className="detail-item">
              <FiHome className="icon" />
              <span><strong>Branch:</strong> {letter.branch}</span>
            </div>
            <div className="detail-item">
              <FiAward className="icon" />
              <span><strong>Roll No:</strong> {letter.rollNo}</span>
            </div>
            <div className="detail-item">
              <FiClock className="icon" />
              <span><strong>Exit Time:</strong> {letter.exitTime}</span>
            </div>
          </>
        );
      case 'personal_letter':
        return (
          <>
            <div className="detail-item">
              <FiUser className="icon" />
              <span><strong>Name:</strong> {letter.studentName}</span>
            </div>
            <div className="detail-item">
              <FiHome className="icon" />
              <span><strong>Branch:</strong> {letter.branch}</span>
            </div>
            <div className="detail-item">
              <FiAward className="icon" />
              <span><strong>Roll No:</strong> {letter.rollNo}</span>
            </div>
            <div className="detail-item">
              <FiFileText className="icon" />
              <span><strong>Subject:</strong> {letter.subject}</span>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const handleAddComment = async () => {
    if (!newCommentText.trim() || !previewLetter || !user) return;

    try {
      await addDoc(collection(db, 'letters', previewLetter.id, 'comments'), {
        text: newCommentText,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhotoURL: user.photoURL || '',
        timestamp: serverTimestamp(),
      });
      setNewCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editingCommentText.trim() || !previewLetter || !user || editingCommentId !== commentId) return;

    try {
      await updateDoc(doc(db, 'letters', previewLetter.id, 'comments', commentId), {
        text: editingCommentText,
        timestamp: serverTimestamp(),
      });
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!previewLetter || !user) return;

    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteDoc(doc(db, 'letters', previewLetter.id, 'comments', commentId));
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  const startEditingComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
  };

  return (
    <div className="student-dashboard">
      <Header user={user} />
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1><FiFileText /> My Letters</h1>
          <div className="stats-container">
            <div className="stat-card">
              <div className="stat-value">{letters.length}</div>
              <div className="stat-label">Total Letters</div>
            </div>
            <div className="stat-card pending">
              <div className="stat-value">{countByStatus('pending')}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-card approved">
              <div className="stat-value">{countByStatus('approved')}</div>
              <div className="stat-label">Approved</div>
            </div>
            <div className="stat-card declined">
              <div className="stat-value">{countByStatus('declined')}</div>
              <div className="stat-label">Declined</div>
            </div>
          </div>
        </div>

        <div className="dashboard-controls">
          <div className="tabs">
            {['all', 'pending', 'approved', 'declined'].map(status => (
              <button
                key={status}
                className={`tab-btn ${tab === status ? 'active' : ''}`}
                onClick={() => { setTab(status); setPreviewLetter(null); }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({countByStatus(status)})
              </button>
            ))}
          </div>

          <div className="filter-section">
            <label>Filter by Type:</label>
            <select 
              className="filter-select"
              onChange={e => { setFilterType(e.target.value); setPreviewLetter(null); }} 
              value={filterType}
            >
              <option value="all">All Types</option>
              <option value="club_event">Club Event ({countByType('club_event')})</option>
              <option value="leave_letter">Leave Letter ({countByType('leave_letter')})</option>
              <option value="gate_pass">Gate Pass ({countByType('gate_pass')})</option>
              <option value="personal_letter">Personal Letter ({countByType('personal_letter')})</option>
            </select>
          </div>

          <button 
            onClick={() => { setShowModal(true); setPreviewLetter(null); }} 
            className="submit-btn"
          >
            <FiPlus /> Submit New Letter
          </button>
        </div>

        {showModal && (
          <Modal onClose={() => { setShowModal(false); setPreviewLetter(null); }}>
            <SubmitLetter onClose={() => { setShowModal(false); setPreviewLetter(null); }} />
          </Modal>
        )}

        <div className="letters-grid">
          {loading ? (
            <div className="loading-spinner">Loading...</div>
          ) : filteredLetters.length === 0 ? (
            <div className="no-letters">
              <FiFileText size={48} />
              <p>No letters found matching your criteria</p>
            </div>
          ) : (
            filteredLetters.map((letter) => (
              <div key={letter.id} className="letter-card">
                <div className="card-header">
                  <div className={`status-badge ${getStatusClass(letter.status)}`}>
                    {letter.status || 'pending'}
                  </div>
                  <div className="letter-type">
                    {letter.type ? letter.type.replace(/_/g, ' ') : 'Unknown'}
                  </div>
                </div>
                
                <div className="card-content">
                  {renderLetterDetails(letter)}
                  
                  <div className="timestamp">
                    <FiCalendar /> {letter.timestamp?.toDate ? new Date(letter.timestamp.toDate()).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                
                <div className="card-actions">
                  {letter.fileBase64 ? (
                    <>
                      <button 
                        className="download-btn"
                        onClick={() => handleDownload(letter)}
                      >
                        <FiDownload /> Download
                      </button>
                      <button 
                        className="view-btn"
                        onClick={() => setPreviewLetter(letter)}
                      >
                        <FiFileText /> View
                      </button>
                    </>
                  ) : (
                    <div className="no-file">No file attached</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {previewLetter && (
          <div className="letter-viewer-modal">
            <div className="modal-overlay" onClick={() => setPreviewLetter(null)}></div>
            
            <div className="modal-content">
              <div className="modal-header">
                <h2>
                  <FiFileText /> 
                  {previewLetter.type ? previewLetter.type.replace(/_/g, ' ') : 'Letter'} Preview
                </h2>
                <button className="close-btn" onClick={() => setPreviewLetter(null)}>
                  <FiX />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="letter-details">
                  <div className="detail-group">
                    <h3>Letter Details</h3>
                    <p><strong>Type:</strong> {previewLetter.type}</p>
                    <p>
                      <strong>Status:</strong>{' '}
                      <span className={`status ${getStatusClass(previewLetter.status)}`}>
                        {previewLetter.status || 'pending'}
                      </span>
                    </p>
                    <p><strong>Submitted on:</strong> {formatDate(previewLetter.timestamp)}</p>
                    {renderLetterDetails(previewLetter)}
                  </div>
                  
                  <div className="letter-pdf-container">
                    <h3>Document Preview</h3>
                    <div className="pdf-viewer">
                      <iframe
                        src={previewLetter.fileBase64}
                        title="Preview PDF"
                        width="100%"
                        height="600px"
                      ></iframe>
                    </div>
                  </div>
                </div>
                
                <div className="comments-section">
                  <h3><FiMessageSquare /> Comments</h3>
                  
                  <div className="comments-list">
                    {previewLetterComments.length === 0 ? (
                      <div className="no-comments">
                        <FiMessageSquare size={24} />
                        <p>No comments yet. Be the first to add one!</p>
                      </div>
                    ) : (
                      previewLetterComments.map(comment => (
                        <div key={comment.id} className="comment-item">
                          <div className="comment-header">
                            <div className="user-avatar">
                              {comment.userPhotoURL ? (
                                <img src={comment.userPhotoURL} alt="Profile" />
                              ) : (
                                <FiUser />
                              )}
                            </div>
                            <div className="user-info">
                              <strong>{comment.userName}</strong>
                              <span className="comment-timestamp">
                                {comment.timestamp && new Date(comment.timestamp.toDate()).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          
                          {editingCommentId === comment.id ? (
                            <div className="comment-edit">
                              <textarea
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                autoFocus
                              />
                              <div className="edit-actions">
                                <button onClick={() => handleEditComment(comment.id)}>Save</button>
                                <button onClick={() => setEditingCommentId(null)}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div className="comment-content">
                              <p>{comment.text}</p>
                              {user && user.uid === comment.userId && (
                                <div className="comment-actions">
                                  <button onClick={() => startEditingComment(comment)}>
                                    <FiEdit2 />
                                  </button>
                                  <button onClick={() => handleDeleteComment(comment.id)}>
                                    <FiTrash2 />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="add-comment">
                    <textarea
                      placeholder="Add a new comment..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                    ></textarea>
                    <button 
                      className="add-comment-btn"
                      onClick={handleAddComment}
                      disabled={!newCommentText.trim()}
                    >
                      <FiSend /> Add Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;