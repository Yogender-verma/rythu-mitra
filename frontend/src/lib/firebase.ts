import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type ConfirmationResult,
  type User as FirebaseUser
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAAGuYkZa94C33tNe3a7OSZ0tSZJiDFXtc',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'rythu-mitra-2.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'rythu-mitra-2',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'rythu-mitra-2.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '812311834294',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:812311834294:web:ee186bdade59bec1574017',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  onAuthStateChanged
};

export type { ConfirmationResult, FirebaseUser };

/**
 * Friendly error message converter for Firebase Authentication errors
 */
export function getFirebaseErrorMessage(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-phone-number':
      return 'దయచేసి సరియైన 10 అంకెల ఫోన్ నంబర్‌ను నమోదు చేయండి. (+91 format)';
    case 'auth/invalid-verification-code':
      return 'Incorrect OTP. Please check the SMS message and try again.';
    case 'auth/code-expired':
      return 'OTP has expired. Please request a new OTP.';
    case 'auth/too-many-requests':
      return 'Too many verification attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was closed before completing. Please try again.';
    case 'auth/quota-exceeded':
      return 'SMS quota exceeded for today. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email address.';
    case 'auth/configuration-not-found':
      return 'Google Authentication is not enabled in Firebase Console yet. Please go to Firebase Console -> Authentication -> Sign-in method -> Enable Google.';
    default:
      return error?.message || 'Authentication error. Please try again.';
  }
}
