import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { FiFileText, FiUser, FiCalendar, FiClock, FiHome, FiBook, FiMapPin, FiAward, FiSend, FiX, FiCheck } from 'react-icons/fi';
import './SubmitLetter.css';

const SubmitLetter = ({ onClose }) => {
  const [type, setType] = useState('');
  const [formData, setFormData] = useState({});
  const [fileBase64, setFileBase64] = useState(null);
  const [facultyList, setFacultyList] = useState([]);
  const [filteredFaculty, setFilteredFaculty] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchFacultyAndHOD = async () => {
      try {
        const rolesQuery = query(
          collection(db, 'users'),
          where('role', 'in', ['faculty', 'hod'])
        );
        const snapshot = await getDocs(rolesQuery);
        const list = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
        list.sort((a, b) => a.name.localeCompare(b.name));
        setFacultyList(list);
        setFilteredFaculty(list);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    fetchFacultyAndHOD();
  }, []);

  useEffect(() => {
    const filtered = facultyList.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.department || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFaculty(filtered);
  }, [searchQuery, facultyList]);

  const handleFileChange = (e, field) => {
    const selected = e.target.files[0];
    if (selected) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result;
        setFormData((prev) => ({ ...prev, [field]: base64Data }));
        if (field === 'fileBase64') setFileBase64(base64Data);
      };
      reader.readAsDataURL(selected);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type || !fileBase64 || selectedFaculty.length === 0) {
      return alert('Please fill in all required fields.');
    }
    setShowPreview(true);
  };

  const confirmAndSend = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return alert('User not logged in');

      const selectedUsers = facultyList.filter((f) =>
        selectedFaculty.includes(f.uid)
      );

      for (const faculty of selectedUsers) {
        const letterPayload = {
          uid: user.uid,
          type,
          ...formData,
          status: 'pending',
          timestamp: serverTimestamp(),
          receiverId: faculty.uid,
          receiverName: faculty.name,
          receiverEmail: faculty.email,
          receiverRole: faculty.role,
          receiverDepartment: faculty.department || '',
        };

        await addDoc(collection(db, 'letters'), letterPayload);
      }

      alert('Letter submitted successfully!');
      setType('');
      setFormData({});
      setFileBase64(null);
      setSelectedFaculty([]);
      setSearchQuery('');
      setShowPreview(false);
      if (onClose) onClose();
    } catch (err) {
      console.error('Submission error:', err);
      alert('Submission failed.');
    }
  };

  const renderFields = () => {
    switch (type) {
      case 'club_event':
        return (
          <div className="form-fields">
            <div className="form-group">
              <label><FiMapPin /> Club Name</label>
              <input name="clubName" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiHome /> Department Name</label>
              <input name="department" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiCalendar /> Event Name</label>
              <input name="eventName" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiClock /> Event Date</label>
              <input name="eventDate" type="date" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiBook /> Event Description</label>
              <textarea name="eventDescription" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiAward /> Type of Event</label>
              <select name="eventType" onChange={handleChange} required>
                <option value="">Select Event Type</option>
                <option value="technical">Technical</option>
                <option value="non-technical">Non-Technical</option>
                <option value="social">Social</option>
              </select>
            </div>
            <div className="form-group">
              <label><FiFileText /> Letter (PDF)</label>
              <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, 'fileBase64')} required />
            </div>
            <div className="form-group">
              <label><FiCalendar /> Signed Letter Deadline</label>
              <input name="signedLetterDeadline" type="date" onChange={handleChange} required />
            </div>
          </div>
        );
      case 'leave_letter':
        return (
          <div className="form-fields">
            <div className="form-group">
              <label><FiUser /> Student Name</label>
              <input name="studentName" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiHome /> Branch & Section</label>
              <input name="branch" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiAward /> Roll No</label>
              <input name="rollNo" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiUser /> Mentor Name</label>
              <input name="mentor" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiUser /> Incharge Name</label>
              <input name="incharge" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiBook /> Reason for Leave/Absence</label>
              <textarea name="reason" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiCalendar /> Leave Date</label>
              <input name="leaveDate" type="date" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiFileText /> Proof (PDF)</label>
              <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, 'proofFile')} />
            </div>
            <div className="form-group">
              <label><FiFileText /> Letter (PDF)</label>
              <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, 'fileBase64')} required />
            </div>
          </div>
        );
      case 'gate_pass':
        return (
          <div className="form-fields">
            <div className="form-group">
              <label><FiUser /> Student Name</label>
              <input name="studentName" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiHome /> Branch & Section</label>
              <input name="branch" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiAward /> Roll No</label>
              <input name="rollNo" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiUser /> Mentor Name</label>
              <input name="mentor" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiUser /> Incharge Name</label>
              <input name="incharge" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiBook /> Reason for Exit</label>
              <textarea name="reason" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiClock /> Exit Time</label>
              <input name="exitTime" type="time" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiFileText /> Letter (PDF)</label>
              <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, 'fileBase64')} required />
            </div>
          </div>
        );
      case 'personal_letter':
        return (
          <div className="form-fields">
            <div className="form-group">
              <label><FiUser /> Student Name</label>
              <input name="studentName" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiHome /> Branch & Section</label>
              <input name="branch" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiAward /> Roll No</label>
              <input name="rollNo" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiUser /> Mentor Name</label>
              <input name="mentor" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiUser /> Incharge Name</label>
              <input name="incharge" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiFileText /> Subject</label>
              <input name="subject" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FiFileText /> Letter (PDF)</label>
              <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, 'fileBase64')} required />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="submit-letter-container">
      <div className="submit-letter-header">
        <h2><FiFileText /> Submit New Letter</h2>
        {/* <button className="close-btn" onClick={onClose}>
          <FiX />
        </button> */}
      </div>

      <form onSubmit={handleSubmit} className="submit-letter-form">
        <div className="form-group">
          <label>Letter Type</label>
          <select 
            value={type} 
            onChange={(e) => {
              setType(e.target.value);
              setFormData({});
              setFileBase64(null);
            }} 
            required
          >
            <option value="">Select Letter Type</option>
            <option value="club_event">Club Event</option>
            <option value="leave_letter">Leave/Absence Letter</option>
            <option value="gate_pass">Gate Pass</option>
            <option value="personal_letter">Personal Letter</option>
          </select>
        </div>

        {type && (
          <>
            <div className="form-group">
              <label>Search Faculty/HOD</label>
              <input
                type="text"
                placeholder="Search by name, email, or department"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Select Recipients</label>
              <div className="faculty-select-container">
                <select
                  multiple
                  value={selectedFaculty}
                  onChange={(e) => {
                    const options = Array.from(e.target.selectedOptions).map((o) => o.value);
                    setSelectedFaculty(options);
                  }}
                  required
                  className="faculty-select"
                >
                  {filteredFaculty.map((f) => (
                    <option key={f.uid} value={f.uid}>
                      {f.name} ({f.role}) - {f.department || 'No Department'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {type && renderFields()}

        {type && !showPreview && (
          <button type="submit" className="preview-btn">
            <FiSend /> Preview Submission
          </button>
        )}

        {showPreview && (
          <div className="preview-container">
            <h3><FiFileText /> Confirm Letter Submission</h3>
            <div className="preview-details">
              <div className="preview-section">
                <h4>Letter Details</h4>
                <p><strong>Type:</strong> {type.replace(/_/g, ' ')}</p>
              </div>
              
              <div className="preview-section">
                <h4>Recipients</h4>
                <ul className="recipient-list">
                  {facultyList.filter((f) => selectedFaculty.includes(f.uid)).map((f) => (
                    <li key={f.uid}>
                      <FiUser /> {f.name} - {f.role} ({f.department || 'No Department'})
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="preview-actions">
                <button type="button" onClick={confirmAndSend} className="confirm-btn">
                  <FiCheck /> Confirm & Submit
                </button>
                <button type="button" onClick={() => setShowPreview(false)} className="cancel-btn">
                  <FiX /> Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SubmitLetter;