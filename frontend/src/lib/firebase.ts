import { app, auth } from '../firebase';
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type ConfirmationResult,
  type User as FirebaseUser
} from 'firebase/auth';

export { app, auth };

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
 * Friendly bilingual error message converter for Firebase Authentication errors
 */
export function getFirebaseErrorMessage(error: any): string {
  const code = error?.code || '';
  const message = error?.message || '';

  if (code.includes('api-key-not-valid') || message.includes('api-key-not-valid') || code.includes('invalid-api-key')) {
    return 'Firebase API Key is not configured. Click "Demo Farmer Login" below to test all features instantly without Firebase setup.';
  }

  if (message.includes('already been rendered') || code.includes('already-rendered')) {
    return 'reCAPTCHA రీసెట్ చేయబడింది. దయచేసి మళ్ళీ "OTP పంపండి" క్లిక్ చేయండి. (reCAPTCHA refreshed. Please click "Send OTP" again).';
  }

  switch (code) {
    case 'auth/invalid-phone-number':
      return 'దయచేసి సరియైన 10 అంకెల భారతీయ ఫోన్ నంబర్‌ను నమోదు చేయండి. (Invalid 10-digit Indian phone number)';
    case 'auth/missing-phone-number':
      return 'దయచేసి మీ 10 అంకెల ఫోన్ నంబర్‌ను నమోదు చేయండి. (Please enter your mobile number)';
    case 'auth/invalid-verification-code':
      return 'తప్పు OTP కోడ్. దయచేసి SMS లో వచ్చిన సరైన 6 అంకెల OTP నమోదు చేయండి. (Incorrect OTP. Please check your SMS)';
    case 'auth/code-expired':
      return 'OTP గడువు ముగిసింది. దయచేసి "మళ్ళీ OTP పంపండి" క్లిక్ చేయండి. (OTP has expired. Please request a new OTP)';
    case 'auth/quota-exceeded':
      return 'నేటి SMS పరిమితి (Quota) పూర్తయింది. దయచేసి కాసేపటి తర్వాత ప్రయత్నించండి లేదా డెమో లాగిన్ వాడండి. (SMS quota exceeded for today)';
    case 'auth/captcha-check-failed':
      return 'reCAPTCHA ధృవీకరణ విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి. (reCAPTCHA verification failed. Please try again)';
    case 'auth/too-many-requests':
      return 'చాలా ఎక్కువ ప్రయత్నాలు జరిగాయి. దయచేసి కాసేపటి తర్వాత ప్రయత్నించండి. (Too many verification attempts. Please try again later)';
    case 'auth/unauthorized-domain':
      return 'ఈ డొమైన్ Firebase లో ఆమోదించబడలేదు. Firebase Console -> Authentication -> Settings -> Authorized Domains లో localhost ను చేర్చండి. (Unauthorized Domain)';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was closed before completing. Please try again.';
    case 'auth/network-request-failed':
      return 'నెట్‌వర్క్ కనెక్షన్ లోపం. దయచేసి మీ ఇంటర్నెట్ తనిఖీ చేయండి. (Network connection error)';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email address.';
    case 'auth/configuration-not-found':
      return 'Phone Authentication is not enabled in Firebase Console yet. Please go to Firebase Console -> Authentication -> Sign-in method -> Enable Phone.';
    case 'auth/operation-not-allowed':
      if (message.toLowerCase().includes('region')) {
        return 'భారతదేశానికి (+91) SMS పంపడం Firebase Console లో ఎనేబుల్ చేయలేదు. Firebase Console -> Authentication -> Settings -> SMS Region Policy లో "India (+91)" ని Allowlist లో చేర్చండి, లేదా Test Phone Number ఉపయోగించండి.';
      }
      return 'ఫోన్ లాగిన్ Firebase Console లో ఎనేబుల్ చేయబడలేదు. దయచేసి Firebase Console -> Authentication -> Sign-in method లో Phone ఎనేబుల్ చేయండి. (Phone auth disabled)';
    default:
      return error?.message || 'Authentication error. Please try again.';
  }
}
