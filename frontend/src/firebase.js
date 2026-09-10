// Firebase Web SDK Configuration for RythuMitra AI
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBHUjTNTKa9mPZ73U8f8cse9rwKEXZ1LNE",
  authDomain: "rythu-mitra-7409d.firebaseapp.com",
  projectId: "rythu-mitra-7409d",
  storageBucket: "rythu-mitra-7409d.firebasestorage.app",
  messagingSenderId: "603395884244",
  appId: "1:603395884244:web:969baf4475f20cc7cda741",
  measurementId: "G-ZQHWGR4PJD"
};

// Initialize Firebase modular app (single instance pattern)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export default app;
