import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  language: 'te' | 'en';
  setLanguage: (lang: 'te' | 'en') => void;
  loginWithPhone: (phone: string, otp: string) => Promise<boolean>;
  sendPhoneOtp: (phone: string) => Promise<any>;
  loginWithGoogle: () => Promise<boolean>;
  addPhoneToAccount: (phone: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('rythumitra_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [language, setLanguageState] = useState<'te' | 'en'>(() => {
    return (localStorage.getItem('rythumitra_lang') as 'te' | 'en') || 'te';
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('rythumitra_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('rythumitra_user');
    }
  }, [user]);

  const setLanguage = (lang: 'te' | 'en') => {
    setLanguageState(lang);
    localStorage.setItem('rythumitra_lang', lang);
  };

  const sendPhoneOtp = async (phone: string) => {
    return await api.sendOtp(phone);
  };

  const loginWithPhone = async (phone: string, otp: string): Promise<boolean> => {
    const res = await api.verifyOtp(phone, otp);
    if (res.success && res.user) {
      setUser(res.user);
      return true;
    }
    return false;
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    const res = await api.loginWithGoogle();
    if (res.user) {
      setUser(res.user);
      return true;
    }
    return false;
  };

  const addPhoneToAccount = async (phone: string): Promise<boolean> => {
    if (user) {
      const updated = { ...user, phone, has_phone: true };
      setUser(updated);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rythumitra_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        language,
        setLanguage,
        loginWithPhone,
        sendPhoneOtp,
        loginWithGoogle,
        addPhoneToAccount,
        logout,
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
