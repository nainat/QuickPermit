// src/pages/ViewLetters.js
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Link } from 'react-router-dom';
const ViewLetters = () => {
  const [letters, setLetters] = useState([]);

  useEffect(() => {
    const fetchLetters = async () => {
      const querySnapshot = await getDocs(collection(db, 'letters'));
      const fetched = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLetters(fetched);
    };

    fetchLetters();
  }, []);

  const handleDownload = (fileBase64, eventName) => {
    const link = document.createElement('a');
    link.href = fileBase64;
    link.download = `${eventName}.pdf`;
    link.click();
  };

  return (
    <div>
      <h2>Uploaded Letters</h2>
      
      <ul>
        {letters.map(doc => (
          <li key={doc.id}>
            {doc.eventName}
            <button onClick={() => handleDownload(doc.fileBase64, doc.eventName)}>
              📥 Download
            </button>
            <Link to="/view-letters">View Submitted Letters</Link>

          </li>
        ))}
      </ul>
    </div>
  );
};

export default ViewLetters;
