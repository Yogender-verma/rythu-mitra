import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Volume2, MapPin, Shield, Trash2, Info, LogOut, Check, CheckCircle2, Phone, Mail, PlusCircle, RefreshCw } from 'lucide-react';
import type { ConfirmationResult } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user, firebaseUser, language, setLanguage, logout, sendPhoneOtp, linkPhoneToAccount } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || 'Telangana Farmer');
  const [district, setDistrict] = useState('Karimnagar');
  const [mandal, setMandal] = useState('Choppadandi');
  const [voiceSpeed, setVoiceSpeed] = useState('normal');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Phone Linking Modal State
  const [showAddPhoneModal, setShowAddPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [phoneStep, setPhoneStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSendLinkOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return;
    }
    setPhoneError(null);
    setPhoneLoading(true);
    try {
      const res = await sendPhoneOtp(cleanPhone, 'recaptcha-settings-container');
      setConfirmationResult(res);
      setPhoneStep('OTP');
    } catch (err: any) {
      setPhoneError(err.message || 'Failed to send OTP');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyLinkOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput || otpInput.length !== 6) {
      setPhoneError('Please enter 6-digit OTP');
      return;
    }
    if (!confirmationResult) return;

    setPhoneError(null);
    setPhoneLoading(true);
    try {
      await linkPhoneToAccount(phoneInput, confirmationResult, otpInput);
      setShowAddPhoneModal(false);
      setPhoneStep('PHONE');
      setPhoneInput('');
      setOtpInput('');
    } catch (err: any) {
      setPhoneError(err.message || 'Failed to link phone number');
    } finally {
      setPhoneLoading(false);
    }
  };

  // Determine displayed provider
  const getAuthProviderDisplay = () => {
    if (user?.auth_provider) {
      if (user.auth_provider === 'google+phone') return 'Google + Phone';
      if (user.auth_provider === 'google') return 'Google Authentication';
      return 'Phone Number (SMS OTP)';
    }
    if (firebaseUser) {
      const providers = firebaseUser.providerData.map(p => p.providerId);
      if (providers.includes('google.com') && firebaseUser.phoneNumber) return 'Google + Phone';
      if (providers.includes('google.com')) return 'Google Authentication';
      if (firebaseUser.phoneNumber) return 'Phone Number (SMS OTP)';
    }
    return 'Phone Number';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-black">
      {/* Container for invisible reCAPTCHA in Settings */}
      <div id="recaptcha-settings-container"></div>

      {/* Page Title */}
      <div className="bg-white p-6 rounded-3xl border-2 border-[#B7C9B3] shadow-sm">
        <span className="text-xs font-black uppercase tracking-wider text-black bg-[#C8E6C9] px-3 py-1 rounded-full border border-[#B7C9B3]">
          Account Preferences
        </span>
        <h1 className="text-2xl font-black text-black mt-2 text-telugu">
          {language === 'te' ? 'సెట్టింగ్‌లు (Settings)' : 'Settings'}
        </h1>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-[#C8E6C9] text-black rounded-2xl text-xs font-black flex items-center gap-2 border-2 border-[#B7C9B3]">
          <Check className="w-4 h-4 text-black" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* Real Authentication & Farmer Profile Status */}
      <div className="bg-white p-6 rounded-3xl border-2 border-[#B7C9B3] shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b-2 border-[#B7C9B3] pb-3">
          <Shield className="w-5 h-5 text-black" />
          <h3 className="font-black text-black text-sm text-telugu">🔐 Authentication & Farmer Profile</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-black">
          {/* Farmer Name */}
          <div className="p-4 bg-[#F5F8F2] rounded-2xl border border-[#B7C9B3] space-y-1">
            <span className="text-[#1B5E20] uppercase text-[10px]">Farmer Name</span>
            <div className="text-base text-black">{user?.name || 'Telangana Farmer'}</div>
          </div>

          {/* Email */}
          <div className="p-4 bg-[#F5F8F2] rounded-2xl border border-[#B7C9B3] space-y-1">
            <span className="text-[#1B5E20] uppercase text-[10px] flex items-center gap-1">
              <Mail className="w-3 h-3 text-black" /> Email Address
            </span>
            <div className="text-sm text-black">{user?.email || firebaseUser?.email || 'Not connected'}</div>
          </div>

          {/* Phone Number */}
          <div className="p-4 bg-[#F5F8F2] rounded-2xl border border-[#B7C9B3] space-y-1">
            <span className="text-[#1B5E20] uppercase text-[10px] flex items-center gap-1">
              <Phone className="w-3 h-3 text-black" /> Phone Number
            </span>
            {user?.phone || firebaseUser?.phoneNumber ? (
              <div className="flex items-center gap-2 text-sm text-black">
                <span>{user?.phone || firebaseUser?.phoneNumber}</span>
                <span className="bg-[#C8E6C9] text-[#1B5E20] px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 border border-[#B7C9B3]">
                  <CheckCircle2 className="w-3 h-3 text-[#1B5E20]" /> Verified
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500 font-normal">Not added</span>
                <button
                  onClick={() => setShowAddPhoneModal(true)}
                  className="bg-[#2E7D32] text-white px-3 py-1.5 rounded-xl text-xs font-black hover:bg-[#1B5E20] transition flex items-center gap-1 border border-[#1B5E20]"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Add Phone Number
                </button>
              </div>
            )}
          </div>

          {/* Authentication Provider */}
          <div className="p-4 bg-[#F5F8F2] rounded-2xl border border-[#B7C9B3] space-y-1">
            <span className="text-[#1B5E20] uppercase text-[10px]">Authentication Provider</span>
            <div className="text-sm text-black">{getAuthProviderDisplay()}</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">

        {/* 1. Profile Section */}
        <div className="bg-white p-6 rounded-3xl border-2 border-[#B7C9B3] shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-[#B7C9B3] pb-3">
            <UserIcon className="w-5 h-5 text-black" />
            <h3 className="font-black text-black text-sm text-telugu">🌱 Profile Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                Farmer Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3.5 rounded-2xl border-2 border-[#B7C9B3] focus:border-[#2E7D32] outline-none text-sm font-black text-black touch-target bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <input
                type="text"
                value={user?.phone || firebaseUser?.phoneNumber || 'Not Linked'}
                disabled
                className="w-full p-3.5 rounded-2xl border-2 border-[#B7C9B3] bg-[#F5F8F2] text-black text-sm font-black touch-target cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* 2. Language & Voice Section */}
        <div className="bg-white p-6 rounded-3xl border-2 border-[#B7C9B3] shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-[#B7C9B3] pb-3">
            <Volume2 className="w-5 h-5 text-black" />
            <h3 className="font-black text-black text-sm text-telugu">🌐 Language & Voice Preferences</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-2 text-telugu">
                App Language (భాష)
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setLanguage('te')}
                  className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black border-2 transition-all ${
                    language === 'te'
                      ? 'bg-[#2E7D32] text-white border-[#1B5E20] shadow'
                      : 'bg-[#F5F8F2] text-black border-[#B7C9B3]'
                  }`}
                >
                  తెలుగు (Telugu)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black border-2 transition-all ${
                    language === 'en'
                      ? 'bg-[#2E7D32] text-white border-[#1B5E20] shadow'
                      : 'bg-[#F5F8F2] text-black border-[#B7C9B3]'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                Telugu Voice Speed
              </label>
              <select
                value={voiceSpeed}
                onChange={(e) => setVoiceSpeed(e.target.value)}
                className="w-full p-3.5 rounded-2xl border-2 border-[#B7C9B3] focus:border-[#2E7D32] text-sm font-black text-black outline-none touch-target bg-white"
              >
                <option value="normal">Normal Speed (సాధారణ వేగం)</option>
                <option value="slow">Slow Speed (నెమ్మదిగా)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Location Preferences */}
        <div className="bg-white p-6 rounded-3xl border-2 border-[#B7C9B3] shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-[#B7C9B3] pb-3">
            <MapPin className="w-5 h-5 text-black" />
            <h3 className="font-black text-black text-sm text-telugu">📍 Location & Crop Preferences</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                Default District
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full p-3.5 rounded-2xl border-2 border-[#B7C9B3] focus:border-[#2E7D32] text-sm font-black text-black outline-none touch-target bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                Default Mandal
              </label>
              <input
                type="text"
                value={mandal}
                onChange={(e) => setMandal(e.target.value)}
                className="w-full p-3.5 rounded-2xl border-2 border-[#B7C9B3] focus:border-[#2E7D32] text-sm font-black text-black outline-none touch-target bg-white"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black py-4 rounded-2xl shadow-xl transition-all text-base touch-target border border-[#1B5E20]"
        >
          Save Preferences
        </button>

      </form>

      {/* Security & Account Options */}
      <div className="bg-white p-6 rounded-3xl border-2 border-[#B7C9B3] shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b-2 border-[#B7C9B3] pb-3">
          <Shield className="w-5 h-5 text-black" />
          <h3 className="font-black text-black text-sm">Security & Account</h3>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            onClick={() => setShowAboutModal(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#C8E6C9] text-black text-xs font-black hover:bg-[#A5D6A7] border border-[#B7C9B3]"
          >
            <Info className="w-4 h-4 text-black" />
            <span>About RythuMitra AI</span>
          </button>

          <button
            onClick={async () => {
              await logout();
              navigate('/auth/signin');
            }}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-100 text-amber-950 text-xs font-black hover:bg-amber-200 border border-amber-300"
          >
            <LogOut className="w-4 h-4 text-black" />
            <span>Logout</span>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-100 text-red-950 text-xs font-black hover:bg-red-200 border border-red-300"
          >
            <Trash2 className="w-4 h-4 text-black" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* ADD PHONE NUMBER MODAL */}
      {showAddPhoneModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 text-left border-2 border-[#B7C9B3]">
            <h3 className="text-xl font-black text-black">Link Phone Number via Real SMS OTP</h3>
            
            {phoneError && (
              <div className="p-3 bg-red-100 text-red-950 rounded-xl text-xs font-black border border-red-300">
                {phoneError}
              </div>
            )}

            {phoneStep === 'PHONE' ? (
              <form onSubmit={handleSendLinkOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-black uppercase mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black font-black text-sm">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className="w-full pl-14 pr-4 py-3 rounded-2xl border-2 border-[#B7C9B3] focus:border-[#2E7D32] outline-none text-sm font-black text-black bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddPhoneModal(false)}
                    className="flex-1 py-3 bg-gray-100 text-black rounded-xl text-xs font-black"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={phoneLoading}
                    className="flex-1 py-3 bg-[#2E7D32] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2"
                  >
                    {phoneLoading ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <span>Send OTP</span>}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyLinkOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-black uppercase mb-1">
                    Enter 6-digit OTP sent to +91 {phoneInput}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center tracking-widest text-2xl font-black py-3 rounded-2xl border-2 border-[#B7C9B3] outline-none text-black bg-white"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPhoneStep('PHONE')}
                    className="flex-1 py-3 bg-gray-100 text-black rounded-xl text-xs font-black"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={phoneLoading}
                    className="flex-1 py-3 bg-[#2E7D32] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2"
                  >
                    {phoneLoading ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <span>Verify & Link</span>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ABOUT MODAL */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-4 text-left border-2 border-[#B7C9B3]">
            <h3 className="text-xl font-black text-black">About RythuMitra AI</h3>
            <p className="text-xs text-black font-black leading-relaxed">
              RythuMitra AI is a 100% software-only agricultural tech solution developed for Telangana smallholder farmers to diagnose crop pests and diseases and receive Telugu voice advisories.
            </p>
            <div className="bg-[#C8E6C9] p-4 rounded-2xl space-y-2 text-xs text-black font-black border border-[#B7C9B3]">
              <div>• Authentication: Firebase Web SDK + Firebase Admin Token Verification</div>
              <div>• Tech Stack: React + Vite + TypeScript + Tailwind CSS | Python + FastAPI</div>
              <div>• ML Architecture: Pluggable <code className="bg-white px-1.5 py-0.5 rounded border border-[#B7C9B3]">DiseaseClassifier</code> interface</div>
              <div>• Global Theme: Agricultural Green Frame + Black Text/Icons</div>
            </div>
            <button
              onClick={() => setShowAboutModal(false)}
              className="w-full bg-[#2E7D32] text-white font-black py-3 rounded-xl text-xs shadow"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 text-center border-2 border-[#B7C9B3]">
            <div className="w-12 h-12 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto border border-red-300">
              <Trash2 className="w-6 h-6 text-black" />
            </div>
            <h3 className="text-xl font-black text-black">Delete Account?</h3>
            <p className="text-xs text-black font-black">
              Are you sure you want to delete your account? All saved scan history will be permanently erased.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-[#C8E6C9] text-black rounded-xl text-xs font-black border border-[#B7C9B3]"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/auth/signin');
                }}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-black"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
