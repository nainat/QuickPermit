// src/services/firebase.js
import {GoogleAuthProvider } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDVLjhJklb2aVtfmBS9eEKUAXMNsA6wtGQ",
  authDomain: "event-approval-system.firebaseapp.com",
  projectId: "event-approval-system",
storageBucket: "event-approval-system.appspot.com",
  messagingSenderId: "963386785087",
  appId: "1:963386785087:web:8a37a1148770941a90678a",
  measurementId: "G-77MERB76JY"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { db };