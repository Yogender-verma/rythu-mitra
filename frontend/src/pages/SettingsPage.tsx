import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Volume2, MapPin, Shield, Trash2, Info, LogOut, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user, language, setLanguage, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || 'Telangana Farmer');
  const [district, setDistrict] = useState('Karimnagar');
  const [mandal, setMandal] = useState('Choppadandi');
  const [voiceSpeed, setVoiceSpeed] = useState('normal');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-black">
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
                value={user?.phone || '+91 9876543210'}
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
            onClick={() => {
              logout();
              navigate('/');
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

      {/* ABOUT MODAL */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-4 text-left border-2 border-[#B7C9B3]">
            <h3 className="text-xl font-black text-black">About RythuMitra AI</h3>
            <p className="text-xs text-black font-black leading-relaxed">
              RythuMitra AI is a 100% software-only agricultural tech solution developed for Telangana smallholder farmers to diagnose crop pests and diseases and receive Telugu voice advisories.
            </p>
            <div className="bg-[#C8E6C9] p-4 rounded-2xl space-y-2 text-xs text-black font-black border border-[#B7C9B3]">
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
                onClick={() => {
                  logout();
                  navigate('/');
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
