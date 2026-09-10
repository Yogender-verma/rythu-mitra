import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Volume2, MapPin, Shield, Trash2, Info, LogOut, Check, CheckCircle2, Phone, Mail, Edit3, Globe, Sprout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { user, firebaseUser, language, setLanguage, logout, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  // Form State initialized from user profile and settings
  const [name, setName] = useState(user?.name || 'Telangana Farmer');
  const [phone, setPhone] = useState<string>(() => {
    return localStorage.getItem('rythumitra_settings_phone') || user?.phone || firebaseUser?.phoneNumber || '+917013224596';
  });
  const [email, setEmail] = useState(user?.email || firebaseUser?.email || '');
  const [district, setDistrict] = useState(user?.district || 'Karimnagar');
  const [mandal, setMandal] = useState(user?.mandal || 'Choppadandi');
  const [village, setVillage] = useState(user?.village || 'Kondapur');
  const [preferredCrop, setPreferredCrop] = useState(user?.preferred_crop || 'Cotton');
  const [voiceSpeed, setVoiceSpeed] = useState(user?.voice_speed || 'normal');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  useEffect(() => {
    api.getSettingsPhone().then((p) => {
      if (p) setPhone(p);
    });

    if (user) {
      if (user.name) setName(user.name);
      if (user.phone) setPhone(user.phone);
      if (user.email) setEmail(user.email);
      if (user.district) setDistrict(user.district);
      if (user.mandal) setMandal(user.mandal);
      if (user.village) setVillage(user.village);
      if (user.preferred_crop) setPreferredCrop(user.preferred_crop);
      if (user.voice_speed) setVoiceSpeed(user.voice_speed);
    }
  }, [user]);

  const t = {
    te: {
      pageTag: 'ఖాతా ప్రాధాన్యతలు',
      pageTitle: 'సెట్టింగ్‌లు',
      savedSuccess: 'సెట్టింగ్‌లు విజయవంతంగా భద్రపరచబడ్డాయి!',
      authTitle: '🔐 అధికారిక ధృవీకరణ & రైతు ప్రొఫైల్',
      farmerName: 'రైతు పేరు',
      emailAddress: 'ఈమెయిల్ చిరునామా',
      phoneNumber: 'మొబైల్ నంబర్',
      notConnected: 'కనెక్ట్ కాలేదు',
      verified: 'ధృవీకరించబడింది',
      authProvider: 'లాగిన్ పద్ధతి',
      editPhone: 'నంబర్ మార్చండి',
      profileSection: '🌱 రైతు ప్రొఫైల్ వివరాలు (సవరించవచ్చు)',
      nameLabel: 'రైతు పేరు (పూర్తి పేరు)',
      phoneLabel: 'మొబైల్ నంబర్ (సంప్రదింపు నంబర్)',
      emailLabel: 'ఈమెయిల్ చిరునామా (ఐచ్ఛికం)',
      enterName: 'రైతు పేరు నమోదు చేయండి',
      enterPhone: '10 అంకెల మొబైల్ నంబర్',
      enterEmail: 'రైతు ఈమెయిల్ నమోదు చేయండి',
      langSection: '🌐 భాష & వాయిస్ ప్రాధాన్యతలు',
      appLang: 'యాప్ భాష ఎంపిక',
      voiceSpeed: 'తెలుగు వాయిస్ వేగం',
      speedNormal: 'సాధారణ వేగం (సిఫార్సు చేయబడింది)',
      speedSlow: 'నెమ్మదిగా',
      locationSection: '📍 వ్యవసాయ ప్రాంతం & ప్రధాన పంట వివరాలు',
      district: 'జిల్లా',
      mandal: 'మండలం',
      village: 'గ్రామం',
      preferredCrop: 'ప్రధాన సాగు పంట',
      cropCotton: 'ప్రత్తి (Cotton)',
      cropPaddy: 'వరి (Paddy)',
      cropChilli: 'మిర్చి (Chilli)',
      cropMaize: 'మొక్కజొన్న (Maize)',
      saveBtn: 'మార్పులను భద్రపరచండి',
      securitySection: 'భద్రత & ఖాతా నిర్వహణ',
      aboutBtn: 'రైతు మిత్ర AI గురించి',
      logoutBtn: 'లాగౌట్ (నిష్క్రమించండి)',
      deleteBtn: 'ఖాతాను తొలగించండి',
      aboutModalTitle: 'రైతు మిత్ర AI గురించి',
      aboutModalDesc: 'రైతు మిత్ర AI అనేది తెలంగాణ రైతులకు పంట చీడపీడల వ్యాధి నిర్ధారణ మరియు తెలుగు వాయిస్ సలహాల కోసం అభివృద్ధి చేయబడిన అత్యాధునిక ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ ప్లాట్‌ఫారమ్.',
      aboutFeatures: 'ప్రధాన సేవలు: 22 పంట వ్యాధుల వర్గీకరణ, PJTSAU విశ్వవిద్యాలయ సలహాలు, ప్రత్యక్ష వాతావరణ నీటి యాజమాన్య సూచనలు.',
      close: 'మూసివేయండి',
      deleteModalTitle: 'ఖాతాను తొలగించాలా?',
      deleteModalDesc: 'మీరు మీ ఖాతాను ఖచ్చితంగా తొలగించాలనుకుంటున్నారా? మీ గత స్కాన్ రికార్డులు అన్నీ శాశ్వతంగా తొలగించబడతాయి.',
      cancel: 'రద్దు చేయండి',
      confirmDelete: 'ఖాతాను తొలగించు'
    },
    en: {
      pageTag: 'Account Preferences',
      pageTitle: 'Settings',
      savedSuccess: 'Settings saved successfully!',
      authTitle: '🔐 Authentication & Farmer Profile',
      farmerName: 'Farmer Name',
      emailAddress: 'Email Address',
      phoneNumber: 'Phone Number',
      notConnected: 'Not connected',
      verified: 'Verified',
      authProvider: 'Authentication Provider',
      editPhone: 'Change Number',
      profileSection: '🌱 Farmer Profile Information (Editable)',
      nameLabel: 'Farmer Full Name',
      phoneLabel: 'Mobile Phone Number',
      emailLabel: 'Email Address (Optional)',
      enterName: 'Enter farmer full name',
      enterPhone: 'Enter 10-digit phone number',
      enterEmail: 'Enter farmer email address',
      langSection: '🌐 Language & Voice Preferences',
      appLang: 'Application Language',
      voiceSpeed: 'Voice Advisory Playback Speed',
      speedNormal: 'Normal Speed (Recommended)',
      speedSlow: 'Slow Speed',
      locationSection: '📍 Farm Location & Primary Crop',
      district: 'District',
      mandal: 'Mandal',
      village: 'Village',
      preferredCrop: 'Primary Cultivated Crop',
      cropCotton: 'Cotton',
      cropPaddy: 'Paddy',
      cropChilli: 'Chilli',
      cropMaize: 'Maize',
      saveBtn: 'Save Preferences',
      securitySection: 'Security & Account Management',
      aboutBtn: 'About RythuMitra AI',
      logoutBtn: 'Logout',
      deleteBtn: 'Delete Account',
      aboutModalTitle: 'About RythuMitra AI',
      aboutModalDesc: 'RythuMitra AI is an advanced agricultural intelligence platform designed for farmers, delivering real-time deep learning crop disease diagnostics and climate-aware advisory.',
      aboutFeatures: 'Key Features: 22-class MobileNet crop diagnostics, PJTSAU university agronomic guidance, live weather integration.',
      close: 'Close',
      deleteModalTitle: 'Delete Account?',
      deleteModalDesc: 'Are you sure you want to delete your account? All saved scan history will be permanently erased.',
      cancel: 'Cancel',
      confirmDelete: 'Confirm Delete'
    }
  }[language];

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    if (cleanPhone) {
      localStorage.setItem('rythumitra_settings_phone', cleanPhone);
      api.saveSettingsPhone(cleanPhone);
    }
    updateUserProfile({
      name: name.trim() || 'Telangana Farmer',
      phone: cleanPhone || undefined,
      email: email.trim() || undefined,
      district: district.trim(),
      mandal: mandal.trim(),
      village: village.trim(),
      preferred_crop: preferredCrop,
      voice_speed: voiceSpeed,
      language: language
    });
    setIsEditingPhone(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const getAuthProviderDisplay = () => {
    if (user?.auth_provider === 'demo') {
      return language === 'te' ? 'డెమో రైతు మోడ్ (Demo Farmer)' : 'Demo Farmer Mode';
    }
    if (firebaseUser?.phoneNumber || user?.phone) {
      return language === 'te' ? 'మొబైల్ ఫోన్ (SMS OTP)' : 'Phone Number (SMS OTP)';
    }
    if (firebaseUser?.email || user?.email) {
      return language === 'te' ? 'గూగుల్ ఖాతా (Google Auth)' : 'Google Authentication';
    }
    return language === 'te' ? 'ఫోన్ నంబర్' : 'Phone Number';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-black">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-3xl border-2 border-[#B7C9B3] shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-black bg-[#C8E6C9] px-3 py-1 rounded-full border border-[#B7C9B3]">
            {t.pageTag}
          </span>
          <h1 className="text-2xl font-black text-black mt-2">
            {t.pageTitle}
          </h1>
        </div>

        {/* Top Language Toggle Button */}
        <button
          type="button"
          onClick={() => setLanguage(language === 'te' ? 'en' : 'te')}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#E8F5E9] hover:bg-[#C8E6C9] text-black border-2 border-[#B7C9B3] text-xs font-black transition-all shadow-sm touch-target"
        >
          <Globe className="w-4 h-4 text-[#1B5E20]" />
          <span>{language === 'te' ? 'English' : 'తెలుగు'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-[#C8E6C9] text-black rounded-2xl text-xs font-black flex items-center gap-2 border-2 border-[#B7C9B3] animate-fadeIn">
          <Check className="w-4 h-4 text-[#1B5E20]" />
          <span>{t.savedSuccess}</span>
        </div>
      )}

      {/* Authentication & Profile Status */}
      <div className="bg-white p-6 rounded-3xl border-2 border-[#B7C9B3] shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b-2 border-[#B7C9B3] pb-3">
          <Shield className="w-5 h-5 text-black" />
          <h3 className="font-black text-black text-sm">{t.authTitle}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-black">
          {/* Farmer Name */}
          <div className="p-4 bg-[#F5F8F2] rounded-2xl border border-[#B7C9B3] space-y-1">
            <span className="text-[#1B5E20] uppercase text-[10px]">{t.farmerName}</span>
            <div className="text-base text-black">{user?.name || name}</div>
          </div>

          {/* Email */}
          <div className="p-4 bg-[#F5F8F2] rounded-2xl border border-[#B7C9B3] space-y-1">
            <span className="text-[#1B5E20] uppercase text-[10px] flex items-center gap-1">
              <Mail className="w-3 h-3 text-black" /> {t.emailAddress}
            </span>
            <div className="text-sm text-black">{user?.email || email || t.notConnected}</div>
          </div>

          {/* Phone Number */}
          <div className="p-4 bg-[#F5F8F2] rounded-2xl border border-[#B7C9B3] space-y-1">
            <span className="text-[#1B5E20] uppercase text-[10px] flex items-center gap-1">
              <Phone className="w-3 h-3 text-black" /> {t.phoneNumber}
            </span>
            <div className="flex items-center justify-between">
              <span className="text-sm text-black">{phone || user?.phone || t.notConnected}</span>
              <span className="bg-[#C8E6C9] text-[#1B5E20] px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 border border-[#B7C9B3]">
                <CheckCircle2 className="w-3 h-3 text-[#1B5E20]" /> {t.verified}
              </span>
            </div>
          </div>

          {/* Authentication Provider */}
          <div className="p-4 bg-[#F5F8F2] rounded-2xl border border-[#B7C9B3] space-y-1">
            <span className="text-[#1B5E20] uppercase text-[10px]">{t.authProvider}</span>
            <div className="text-sm text-black">{getAuthProviderDisplay()}</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">

        {/* 1. Profile Section with Editable Fields */}
        <div className="bg-white p-6 rounded-3xl border-2 border-[#B7C9B3] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#B7C9B3] pb-3">
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-black" />
              <h3 className="font-black text-black text-sm">{t.profileSection}</h3>
            </div>
            <span className="text-[11px] text-[#1B5E20] font-black flex items-center gap-1 bg-[#E8F5E9] px-2.5 py-1 rounded-xl border border-[#B7C9B3]">
              <Edit3 className="w-3 h-3" />
              <span>{language === 'te' ? 'సవరణ మోడ్' : 'Edit Mode'}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Farmer Name */}
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                {t.nameLabel}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.enterName}
                required
                className="w-full p-3.5 rounded-2xl border-2 border-[#B7C9B3] focus:border-[#2E7D32] outline-none text-sm font-black text-black touch-target bg-white"
              />
            </div>

            {/* Phone Number - Editable */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black text-black uppercase tracking-wider">
                  {t.phoneLabel}
                </label>
                {!isEditingPhone ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(true)}
                    className="text-xs text-[#1B5E20] font-black underline flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{t.editPhone}</span>
                  </button>
                ) : (
                  <span className="text-xs text-amber-700 font-black">
                    {language === 'te' ? 'నంబర్ మార్చండి' : 'Editing Phone'}
                  </span>
                )}
              </div>
              <input
                type="tel"
                value={phone}
                disabled={!isEditingPhone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.enterPhone}
                className={`w-full p-3.5 rounded-2xl border-2 text-sm font-black text-black touch-target transition-all ${
                  isEditingPhone
                    ? 'border-[#2E7D32] bg-white ring-2 ring-emerald-100'
                    : 'border-[#B7C9B3] bg-[#F5F8F2] cursor-pointer'
                }`}
              />
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#1B5E20] font-bold">
                <span>💬</span>
                <span>
                  {language === 'te'
                    ? 'ఈ నంబర్‌కే పంట వ్యాధి నిర్ధారణ మరియు మందుల సలహా WhatsApp ద్వారా పంపబడుతుంది.'
                    : 'Crop diagnostics & remedy reports will be sent directly to this WhatsApp number.'}
                </span>
              </div>
            </div>

            {/* Email Address - Editable */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                {t.emailLabel}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.enterEmail}
                className="w-full p-3.5 rounded-2xl border-2 border-[#B7C9B3] focus:border-[#2E7D32] outline-none text-sm font-black text-black touch-target bg-white"
              />
            </div>
          </div>
        </div>

        {/* 2. Language & Voice Section */}
        <div className="bg-white p-6 rounded-3xl border-2 border-[#B7C9B3] shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-[#B7C9B3] pb-3">
            <Volume2 className="w-5 h-5 text-black" />
            <h3 className="font-black text-black text-sm">{t.langSection}</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                {t.appLang}
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
                {t.voiceSpeed}
              </label>
              <select
                value={voiceSpeed}
                onChange={(e) => setVoiceSpeed(e.target.value)}
                className="w-full p-3.5 rounded-2xl border-2 border-[#B7C9B3] focus:border-[#2E7D32] text-sm font-black text-black outline-none touch-target bg-white"
              >
                <option value="normal">{t.speedNormal}</option>
                <option value="slow">{t.speedSlow}</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Location & Crop Preferences - Fully Editable */}
        <div className="bg-white p-6 rounded-3xl border-2 border-[#B7C9B3] shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-[#B7C9B3] pb-3">
            <MapPin className="w-5 h-5 text-black" />
            <h3 className="font-black text-black text-sm">{t.locationSection}</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* District */}
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                {t.district}
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Karimnagar"
                className="w-full p-3.5 rounded-2xl border-2 border-[#B7C9B3] focus:border-[#2E7D32] text-sm font-black text-black outline-none touch-target bg-white"
              />
            </div>

            {/* Mandal */}
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                {t.mandal}
              </label>
              <input
                type="text"
                value={mandal}
                onChange={(e) => setMandal(e.target.value)}
                placeholder="e.g. Choppadandi"
                className="w-full p-3.5 rounded-2xl border-2 border-[#B7C9B3] focus:border-[#2E7D32] text-sm font-black text-black outline-none touch-target bg-white"
              />
            </div>

            {/* Village */}
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                {t.village}
              </label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="e.g. Kondapur"
                className="w-full p-3.5 rounded-2xl border-2 border-[#B7C9B3] focus:border-[#2E7D32] text-sm font-black text-black outline-none touch-target bg-white"
              />
            </div>

            {/* Primary Cultivated Crop */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-[#1B5E20]" />
                <span>{t.preferredCrop}</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'Cotton', icon: '🌿', label: t.cropCotton },
                  { id: 'Paddy', icon: '🌾', label: t.cropPaddy },
                  { id: 'Chilli', icon: '🌶️', label: t.cropChilli },
                  { id: 'Maize', icon: '🌽', label: t.cropMaize },
                ].map((cropItem) => (
                  <button
                    key={cropItem.id}
                    type="button"
                    onClick={() => setPreferredCrop(cropItem.id)}
                    className={`p-3 rounded-2xl border-2 text-xs font-black flex items-center justify-center gap-2 transition-all touch-target ${
                      preferredCrop === cropItem.id
                        ? 'bg-[#2E7D32] text-white border-[#1B5E20] shadow-md'
                        : 'bg-[#F5F8F2] text-black border-[#B7C9B3] hover:bg-[#E8F5E9]'
                    }`}
                  >
                    <span>{cropItem.icon}</span>
                    <span>{cropItem.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black py-4 rounded-2xl shadow-xl transition-all text-base touch-target border border-[#1B5E20] flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5 text-white" />
          <span>{t.saveBtn}</span>
        </button>

      </form>

      {/* Security & Account Options */}
      <div className="bg-white p-6 rounded-3xl border-2 border-[#B7C9B3] shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b-2 border-[#B7C9B3] pb-3">
          <Shield className="w-5 h-5 text-black" />
          <h3 className="font-black text-black text-sm">{t.securitySection}</h3>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            onClick={() => setShowAboutModal(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#C8E6C9] text-black text-xs font-black hover:bg-[#A5D6A7] border border-[#B7C9B3]"
          >
            <Info className="w-4 h-4 text-black" />
            <span>{t.aboutBtn}</span>
          </button>

          <button
            onClick={async () => {
              await logout();
              navigate('/auth/signin');
            }}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-100 text-amber-950 text-xs font-black hover:bg-amber-200 border border-amber-300"
          >
            <LogOut className="w-4 h-4 text-black" />
            <span>{t.logoutBtn}</span>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-100 text-red-950 text-xs font-black hover:bg-red-200 border border-red-300"
          >
            <Trash2 className="w-4 h-4 text-black" />
            <span>{t.deleteBtn}</span>
          </button>
        </div>
      </div>

      {/* ABOUT MODAL */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-4 text-left border-2 border-[#B7C9B3]">
            <h3 className="text-xl font-black text-black">{t.aboutModalTitle}</h3>
            <p className="text-xs text-black font-black leading-relaxed">
              {t.aboutModalDesc}
            </p>
            <div className="bg-[#C8E6C9] p-4 rounded-2xl space-y-2 text-xs text-black font-black border border-[#B7C9B3]">
              <div>• {t.aboutFeatures}</div>
              <div>• {language === 'te' ? 'ధృవీకరణ: Firebase Web SDK & Phone OTP' : 'Auth: Firebase Web SDK & Phone OTP'}</div>
              <div>• {language === 'te' ? 'నిర్మాణం: React 19 + Vite + TypeScript + Tailwind CSS' : 'Stack: React 19 + Vite + TypeScript + Tailwind CSS'}</div>
            </div>
            <button
              onClick={() => setShowAboutModal(false)}
              className="w-full bg-[#2E7D32] text-white font-black py-3 rounded-xl text-xs shadow"
            >
              {t.close}
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
            <h3 className="text-xl font-black text-black">{t.deleteModalTitle}</h3>
            <p className="text-xs text-black font-black">
              {t.deleteModalDesc}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-[#C8E6C9] text-black rounded-xl text-xs font-black border border-[#B7C9B3]"
              >
                {t.cancel}
              </button>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/auth/signin');
                }}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-black"
              >
                {t.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
