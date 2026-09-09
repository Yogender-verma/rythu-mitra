import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User as FirebaseUser, ConfirmationResult } from 'firebase/auth';
import { 
  auth, 
  googleProvider, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  getFirebaseErrorMessage
} from '../lib/firebase';
import type { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  language: 'te' | 'en';
  setLanguage: (lang: 'te' | 'en') => void;
  sendPhoneOtp: (phoneNumber: string, containerId?: string) => Promise<ConfirmationResult>;
  verifyOtp: (confirmationResult: ConfirmationResult, otpCode: string, farmerName?: string) => Promise<User>;
  loginWithGoogle: () => Promise<{ firebaseUser: FirebaseUser; hasPhone: boolean }>;
  linkPhoneToAccount: (phone: string, confirmationResult: ConfirmationResult, otpCode: string) => Promise<boolean>;
  logout: () => Promise<void>;
  recaptchaVerifier: RecaptchaVerifier | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  const [language, setLanguageState] = useState<'te' | 'en'>(() => {
    return (localStorage.getItem('rythumitra_lang') as 'te' | 'en') || 'te';
  });

  const setLanguage = (lang: 'te' | 'en') => {
    setLanguageState(lang);
    localStorage.setItem('rythumitra_lang', lang);
  };

  // Sync state when Firebase Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);

      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          api.setAuthToken(token);
          
          // Sync profile with backend
          const syncRes = await api.syncFirebaseUser(token);
          if (syncRes && syncRes.user) {
            setUser(syncRes.user);
          } else {
            // Basic fallback user profile if backend unreachable
            const hasPhone = !!(currentUser.phoneNumber);
            setUser({
              id: 1,
              name: currentUser.displayName || 'Telangana Farmer',
              email: currentUser.email || undefined,
              phone: currentUser.phoneNumber || undefined,
              language: 'te',
              has_phone: hasPhone
            });
          }
        } catch (err) {
          console.error("Error setting auth token / fetching user profile:", err);
        }
      } else {
        api.setAuthToken(null);
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const sendPhoneOtp = async (phoneNumber: string, containerId = 'recaptcha-container'): Promise<ConfirmationResult> => {
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.length === 10) {
        formattedPhone = `+91${formattedPhone}`;
      } else {
        formattedPhone = `+${formattedPhone}`;
      }
    }

    try {
      // Clear existing verifier if any
      let verifier = recaptchaVerifier;
      if (!verifier) {
        verifier = new RecaptchaVerifier(auth, containerId, {
          size: 'invisible',
          callback: () => {},
          'expired-callback': () => {}
        });
        setRecaptchaVerifier(verifier);
      }

      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      return confirmationResult;
    } catch (err: any) {
      // Reset verifier on error so fresh attempt can render
      if (recaptchaVerifier) {
        try { recaptchaVerifier.clear(); } catch (_) {}
        setRecaptchaVerifier(null);
      }
      const message = getFirebaseErrorMessage(err);
      throw new Error(message);
    }
  };

  const verifyOtp = async (
    confirmationResult: ConfirmationResult, 
    otpCode: string, 
    farmerName?: string
  ): Promise<User> => {
    try {
      const userCredential = await confirmationResult.confirm(otpCode);
      const fbUser = userCredential.user;
      setFirebaseUser(fbUser);

      const token = await fbUser.getIdToken();
      api.setAuthToken(token);

      const syncRes = await api.syncFirebaseUser(token, farmerName);
      let profile: User;
      if (syncRes && syncRes.user) {
        profile = syncRes.user;
      } else {
        profile = {
          id: 1,
          name: farmerName || fbUser.displayName || 'Telangana Farmer',
          phone: fbUser.phoneNumber || undefined,
          email: fbUser.email || undefined,
          language: 'te',
          has_phone: true
        };
      }
      setUser(profile);
      return profile;
    } catch (err: any) {
      const message = getFirebaseErrorMessage(err);
      throw new Error(message);
    }
  };

  const loginWithGoogle = async (): Promise<{ firebaseUser: FirebaseUser; hasPhone: boolean }> => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const fbUser = userCredential.user;
      setFirebaseUser(fbUser);

      const token = await fbUser.getIdToken();
      api.setAuthToken(token);

      const syncRes = await api.syncFirebaseUser(token);
      const hasPhone = !!(fbUser.phoneNumber || (syncRes?.user?.has_phone));

      if (syncRes && syncRes.user) {
        setUser(syncRes.user);
      }

      return { firebaseUser: fbUser, hasPhone };
    } catch (err: any) {
      const message = getFirebaseErrorMessage(err);
      throw new Error(message);
    }
  };

  const linkPhoneToAccount = async (
    phone: string,
    confirmationResult: ConfirmationResult,
    otpCode: string
  ): Promise<boolean> => {
    try {
      // Verifying OTP for phone linking
      await confirmationResult.confirm(otpCode);
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        let formattedPhone = phone.trim();
        if (!formattedPhone.startsWith('+')) {
          if (formattedPhone.length === 10) formattedPhone = `+91${formattedPhone}`;
          else formattedPhone = `+${formattedPhone}`;
        }
        const res = await api.linkPhoneToProfile(token, formattedPhone);
        if (res && res.user) {
          setUser(res.user);
        }
      }
      return true;
    } catch (err: any) {
      const message = getFirebaseErrorMessage(err);
      throw new Error(message);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setFirebaseUser(null);
      setUser(null);
      api.setAuthToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        isAuthenticated: !!firebaseUser || !!user,
        loading,
        language,
        setLanguage,
        sendPhoneOtp,
        verifyOtp,
        loginWithGoogle,
        linkPhoneToAccount,
        logout,
        recaptchaVerifier
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
