import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs, query, where, updateDoc, doc, addDoc, deleteDoc, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import './HODDashboard.css';
import Header from '../components/Header';
import { onAuthStateChanged } from 'firebase/auth';
import SignatureCanvas from 'react-signature-canvas';
import { PDFDocument } from 'pdf-lib';
import { FiCheck, FiX, FiFileText, FiEdit2, FiTrash2, FiSend, FiMessageSquare, FiUser, FiCalendar, FiClock, FiHome, FiBook, FiMapPin, FiAward, FiPrinter, FiXCircle, FiNavigation } from 'react-icons/fi';

const HODDashboard = () => {
  const [sigPad, setSigPad] = useState(null);
  const [letters, setLetters] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [signedFile, setSignedFile] = useState(null);
  const [tab, setTab] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [signaturePosition, setSignaturePosition] = useState({ x: 50, y: 50 });
  const iframeRef = useRef(null);
  const [sigImageURL, setSigImageURL] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const [letterComments, setLetterComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (sigPad && typeof sigPad.getCanvas === 'function') { // Added typeof check for robustness
      const canvas = sigPad.getCanvas();
      const ctx = canvas.getContext('2d');
      const ratio = window.devicePixelRatio || 1;

      // Save original width & height from the props or CSS
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Resize for high DPI displays
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(ratio, ratio);
    }
  }, [sigPad]);

  useEffect(() => {
    const fetchLetters = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const q = query(collection(db, 'letters'), where('receiverId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const fetchedLetters = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLetters(fetchedLetters);
      } catch (error) {
        console.error('Error fetching letters:', error);
      }
    };
    fetchLetters();
  }, [user]);

  useEffect(() => {
    if (!selectedLetter) {
      setLetterComments([]);
      setSummaryText('');
      setSummaryError(null);
      setSignedFile(null); // Clear signed file preview on close
      setSigImageURL(null); // Clear signature preview when closing
      setSignaturePosition({ x: 50, y: 50 }); // Reset position for next letter
      if (sigPad) { // Safely clear and nullify sigPad
        sigPad.clear();
        setSigPad(null);
      }
      return;
    }

    setSummaryText(selectedLetter.summaryText || '');

    const commentsRef = collection(db, 'letters', selectedLetter.id, 'comments');
    const q = query(commentsRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLetterComments(comments);
    }, (error) => {
      console.error("Error fetching real-time comments:", error);
    });

    // Get PDF dimensions when a new letter is selected
    const getPdfDimensions = async () => {
      try {
        const existingPdfBytes = await fetch(selectedLetter.fileBase64).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const firstPage = pdfDoc.getPages()[0];

        setPdfDimensions({
          width: firstPage.getWidth(),
          height: firstPage.getHeight()
        });
      } catch (error) {
        console.error('Error getting PDF dimensions:', error);
      }
    };

    getPdfDimensions();

    return () => unsubscribe();
  }, [selectedLetter, sigPad]); // Added sigPad to dependencies

  // Update display dimensions when iframe loads
  const handleIframeLoad = () => {
    if (iframeRef.current) {
      const rect = iframeRef.current.getBoundingClientRect();
      setDisplayDimensions({
        width: rect.width,
        height: rect.height
      });
    }
  };

  const filteredLetters = letters.filter(l => {
    const matchesTab = tab === 'all' || (tab === 'pending' ? !l.status || l.status === 'pending' : l.status === tab);
    const matchesType = filterType === 'all' || l.type === filterType;
    return matchesTab && matchesType;
  });

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateDoc(doc(db, 'letters', id), { status });
      setLetters(prev => prev.map(l => (l.id === id ? { ...l, status } : l)));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleSendSignedLetter = async () => {
    if (!selectedLetter || !signedFile) {
      alert('Please prepare the signed preview before sending.');
      return;
    }
    try {
      // This line updates the existing document with the new signed PDF
      await updateDoc(doc(db, 'letters', selectedLetter.id), { fileBase64: signedFile, status: 'signed' });
      setLetters(prev => prev.map(l => (l.id === selectedLetter.id ? { ...l, fileBase64: signedFile, status: 'signed' } : l)));
      setSelectedLetter(null);
      setSignedFile(null);
      setSigImageURL(null);
      if (sigPad) { // Safely clear sigPad
        sigPad.clear();
        setSigPad(null);
      }
      setSignaturePosition({ x: 50, y: 50 }); // Reset position
      alert('Signed letter submitted successfully!');
    } catch (error) {
      console.error('Error sending signed letter:', error);
      alert('Failed to send signed letter. Please try again.');
    }
  };

  const generateSignaturePreview = async () => {
    if (!sigPad || sigPad.isEmpty()) {
      alert('Please draw your signature.');
      return;
    }
    const pngUrl = sigPad.getCanvas().toDataURL('image/png');
    setSigImageURL(pngUrl);
  };

  const handleFinalSignatureOverlay = async () => {
    if (!selectedLetter || !selectedLetter.fileBase64 || !sigImageURL || !iframeRef.current) {
      alert('Missing letter or signature.');
      return;
    }

    try {
      const existingPdfBytes = await fetch(selectedLetter.fileBase64).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const firstPage = pdfDoc.getPages()[0];

      const pngImageBytes = await fetch(sigImageURL).then(res => res.arrayBuffer());
      const pngImage = await pdfDoc.embedPng(pngImageBytes);

      // Calculate scale factors
      const scaleX = pdfDimensions.width / displayDimensions.width;
      const scaleY = pdfDimensions.height / displayDimensions.height;

      // Note: PDF-lib's Y-coordinate is from the bottom-left, React's (and CSS) is from top-left.
      // So, pdfHeight - (reactY + imageHeight) will be the correct PDF y-coordinate.
      const signatureWidth = 150; // assuming the signature overlay has a fixed width
      const signatureHeight = 50; // assuming the signature overlay has a fixed height

      const x = signaturePosition.x * scaleX;
      const y = pdfDimensions.height - (signaturePosition.y * scaleY) - (signatureHeight * scaleY); // Adjusted y calculation

      firstPage.drawImage(pngImage, {
        x,
        y,
        width: signatureWidth * scaleX, // Apply scale to desired overlay width
        height: signatureHeight * scaleY // Apply scale to desired overlay height
      });

      const pdfBytes = await pdfDoc.saveAsBase64({ dataUri: true });
      setSignedFile(pdfBytes);
      alert('Preview ready!');
    } catch (error) {
      console.error('Error applying signature overlay:', error);
      alert('Failed to generate preview. Please try again.');
    }
  };


  const handleResetSignaturePreview = () => {
    setSigImageURL(null);
    setSignedFile(null);
    setSignaturePosition({ x: 50, y: 50 });
    sigPad?.clear();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !dragRef.current || !iframeRef.current) return;

      const container = iframeRef.current.getBoundingClientRect();
      const sig = dragRef.current.getBoundingClientRect();

      // Mouse position relative to the iframe's content area
      const rawX = e.clientX - container.left;
      const rawY = e.clientY - container.top;

      // Calculate new position of the signature element
      const newX = rawX - (sig.width / 2);
      const newY = rawY - (sig.height / 2);

      // Clamp within bounds of the iframe (PDF display area)
      const boundedX = Math.max(0, Math.min(newX, container.width - sig.width));
      const boundedY = Math.max(0, Math.min(newY, container.height - sig.height));

      setSignaturePosition({ x: boundedX, y: boundedY });
    };

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, displayDimensions, pdfDimensions]); // Added displayDimensions, pdfDimensions to dependency array

  const getStatusClass = status => status ? `status-${status}` : 'status-pending';
  const countByStatus = status => {
    if (status === 'pending') return letters.filter(l => !l.status || l.status === 'pending').length;
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
              <FiCalendar className="icon" />
              <span><strong>Event:</strong> {letter.eventName}</span>
            </div>
            <div className="detail-item">
              <FiClock className="icon" />
              <span><strong>Date:</strong> {letter.eventDate}</span>
            </div>
            <div className="detail-item">
              <FiMapPin className="icon" />
              <span><strong>Club:</strong> {letter.clubName}</span>
            </div>
            <div className="detail-item">
              <FiBook className="icon" />
              <span><strong>Type:</strong> {letter.eventType}</span>
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
              <FiAward className="icon" />
              <span><strong>Roll No:</strong> {letter.rollNo}</span>
            </div>
            <div className="detail-item">
              <FiHome className="icon" />
              <span><strong>Branch:</strong> {letter.branch}</span>
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
              <FiAward className="icon" />
              <span><strong>Roll No:</strong> {letter.rollNo}</span>
            </div>
            <div className="detail-item">
              <FiHome className="icon" />
              <span><strong>Branch:</strong> {letter.branch}</span>
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
              <FiAward className="icon" />
              <span><strong>Roll No:</strong> {letter.rollNo}</span>
            </div>
            <div className="detail-item">
              <FiHome className="icon" />
              <span><strong>Branch:</strong> {letter.branch}</span>
            </div>
            <div className="detail-item">
              <FiFileText className="icon" />
              <span><strong>Subject:</strong> {letter.subject}</span>
            </div>
          </>
        );
      default:
        return <p>Letter type information not available.</p>;
    }
  };

  const handleSummarizeLetter = async () => {
    if (!selectedLetter || !selectedLetter.fileBase64) {
      alert('Please select a letter with a PDF file to summarize.');
      return;
    }

    setIsSummarizing(true);
    setSummaryError(null);

    try {
      // Send the base64 string to your backend's new endpoint
      const response = await fetch('http://localhost:5000/api/summarize-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileBase64: selectedLetter.fileBase64 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get summary from backend.');
      }

      const data = await response.json();
      setSummaryText(data.summary);

      // Save the summary back to Firestore
      await updateDoc(doc(db, 'letters', selectedLetter.id), {
        summaryText: data.summary,
        summaryGeneratedAt: serverTimestamp(),
      });
      setLetters(prev => prev.map(l => (l.id === selectedLetter.id ? { ...l, summaryText: data.summary } : l)));

    } catch (error) {
      console.error('Error summarizing letter:', error);
      setSummaryError(`Error: ${error.message}`);
      setSummaryText('Could not generate summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAddComment = async () => {
    if (!newCommentText.trim() || !selectedLetter || !user) return;

    try {
      await addDoc(collection(db, 'letters', selectedLetter.id, 'comments'), {
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
    if (!editingCommentText.trim() || !selectedLetter || !user || editingCommentId !== commentId) return;

    try {
      await updateDoc(doc(db, 'letters', selectedLetter.id, 'comments', commentId), {
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
    if (!selectedLetter || !user) return;

    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteDoc(doc(db, 'letters', selectedLetter.id, 'comments', commentId));
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  const startEditingComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
  };

  const handleCloseLetterViewer = () => {
    setSelectedLetter(null);
    setSignedFile(null);
    setSigImageURL(null);
    setLetterComments([]);
    setSummaryText('');
    setSummaryError(null);
    setSignaturePosition({ x: 50, y: 50 }); // Reset position
    if (sigPad) { // Safely clear and nullify sigPad
      sigPad.clear();
      setSigPad(null);
    }
  };

  return (
    <div className="hod-dashboard">
      <Header user={user} />

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1><FiFileText /> HOD Dashboard</h1>
          <div className="stats-container">
            <div className="stat-card">
              <div className="stat-value">{letters.length}</div>
              <div className="stat-label">Total Requests</div>
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
                onClick={() => setTab(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({countByStatus(status)})
              </button>
            ))}
          </div>

          <div className="filter-section">
            <label>Filter by Type:</label>
            <select
              className="filter-select"
              onChange={e => setFilterType(e.target.value)}
              value={filterType}
            >
              <option value="all">All Types</option>
              <option value="club_event">Club Event ({countByType('club_event')})</option>
              <option value="leave_letter">Leave Letter ({countByType('leave_letter')})</option>
              <option value="gate_pass">Gate Pass ({countByType('gate_pass')})</option>
              <option value="personal_letter">Personal Letter ({countByType('personal_letter')})</option>
            </select>
          </div>
        </div>

        <div className="letters-grid">
          {filteredLetters.length === 0 ? (
            <div className="no-letters">
              <FiFileText size={48} />
              <p>No letters found matching your criteria</p>
            </div>
          ) : (
            filteredLetters.map(req => (
              <div key={req.id} className="letter-card">
                <div className="card-header">
                  <div className={`status-badge ${getStatusClass(req.status)}`}>
                    {req.status || 'pending'}
                  </div>
                  <div className="letter-type">
                    {req.type ? req.type.replace(/_/g, ' ') : 'Unknown'}
                  </div>
                </div>

                <div className="card-content">
                  {renderLetterDetails(req)}

                  <div className="timestamp">
                    <FiCalendar /> {req.timestamp?.toDate ? new Date(req.timestamp.toDate()).toLocaleDateString() : 'N/A'}
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="view-btn"
                    onClick={() => setSelectedLetter(req)}
                  >
                    <FiFileText /> View
                  </button>

                  {req.status !== 'approved' && (
                    <button
                      className="approve-btn"
                      onClick={() => handleStatusUpdate(req.id, 'approved')}
                    >
                      <FiCheck /> Approve
                    </button>
                  )}

                  {req.status !== 'declined' && (
                    <button
                      className="decline-btn"
                      onClick={() => handleStatusUpdate(req.id, 'declined')}
                    >
                      <FiX /> Decline
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedLetter && (
        <div className="letter-viewer-modal">
          <div className="modal-overlay" onClick={handleCloseLetterViewer}></div>

          <div className="modal-content">
            <div className="modal-header">
              <h2>
                <FiFileText />
                {selectedLetter.type ? selectedLetter.type.replace(/_/g, ' ') : 'Letter'} Request
              </h2>
              <button className="close-btn" onClick={handleCloseLetterViewer}>
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="letter-details">
                <div className="detail-group">
                  <h3>Request Details</h3>
                  {renderLetterDetails(selectedLetter)}
                </div>

                <div className="letter-pdf-container">
                  <div className="pdf-header">
                    <h3>Document Preview</h3>
                    <div className="signature-instructions">
                      <FiNavigation /> Drag signature to position
                    </div>
                  </div>

                  <div className="pdf-viewer" style={{ position: 'relative' }}>
                    <iframe
                      ref={iframeRef}
                      src={selectedLetter.fileBase64}
                      title="Letter PDF"
                      width="100%"
                      height="1200px"
                      onLoad={handleIframeLoad}
                    ></iframe>

                    {sigImageURL && (
                      <img
                        ref={dragRef}
                        src={sigImageURL}
                        alt="Draggable Signature"
                        className={`signature-overlay ${isDragging ? 'dragging' : ''}`}
                        style={{
                          top: signaturePosition.y,
                          left: signaturePosition.x,
                        }}
                        onMouseDown={() => setIsDragging(true)}
                      />
                    )}
                  </div>

                  {/* Signature tools directly below the PDF viewer */}
                  <div className="signature-tools-section">
                    <h4><FiEdit2 /> Create Signature</h4>
                    <div className="signature-container">
                      <SignatureCanvas
                        penColor="black"
                        canvasProps={{ width: 400, height: 150, className: 'signature-canvas' }}
                        ref={setSigPad}
                      />

                      <div className="signature-actions">

                        <button className="action-btn primary" onClick={generateSignaturePreview}>
                          Add Signature
                        </button>
                        <button className="action-btn" onClick={handleResetSignaturePreview}>
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="letter-actions">
                <button
                  className="action-btn primary"
                  onClick={handleFinalSignatureOverlay}
                >
                  <FiPrinter /> Preview Signed Letter
                </button>

                <button
                  className="action-btn success"
                  onClick={handleSendSignedLetter}
                  disabled={!signedFile}
                >
                  <FiSend /> Send Signed Letter
                </button>

                <button
                  className="action-btn summarize"
                  onClick={handleSummarizeLetter}
                  disabled={isSummarizing || !selectedLetter.fileBase64}
                >
                  {isSummarizing ? 'Summarizing...' : 'AI Summarize'}
                </button>
              </div>

              {/* MOVED: Signed PDF Preview section */}
              {signedFile && (
                <div className="signed-pdf-preview-in-modal"> {/* Added a new class for styling */}
                  <div className="preview-header">
                    <h3><FiPrinter /> Signed PDF Preview</h3>
                    <button onClick={() => setSignedFile(null)}>
                      <FiXCircle />
                    </button>
                  </div>
                  <iframe src={signedFile} title="Signed PDF" width="100%" height="600px" />
                </div>
              )}

              <div className="summary-section">
                <h3><FiBook /> AI Summary</h3>
                {summaryText ? (
                  <div className="summary-content">{summaryText}</div>
                ) : (
                  <div className="summary-placeholder">
                    {summaryError ? (
                      <div className="error-message">{summaryError}</div>
                    ) : (
                      <p>No summary available. Click "AI Summarize" to generate one.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="comments-section">
                <h3><FiMessageSquare /> Comments</h3>

                <div className="comments-list">
                  {letterComments.length === 0 ? (
                    <div className="no-comments">
                      <FiMessageSquare size={24} />
                      <p>No comments yet. Be the first to add one!</p>
                    </div>
                  ) : (
                    letterComments.map(comment => (
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
  );
};

export default HODDashboard;