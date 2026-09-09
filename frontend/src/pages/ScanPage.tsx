import React, { useState, useRef } from 'react';
import { Camera, Volume2, Sparkles, AlertTriangle, RefreshCw, Globe, Info } from 'lucide-react';
import type { SupportedCrop, CropStage, CropScanRecord } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ScanPage: React.FC = () => {
  const { language } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [selectedCrop, setSelectedCrop] = useState<SupportedCrop>('Cotton');
  const [selectedStage, setSelectedStage] = useState<CropStage>('Flowering');
  const [district, setDistrict] = useState('Karimnagar');
  const [mandal, setMandal] = useState('Choppadandi');
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // UI State
  const [loading, setLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [scanResult, setScanResult] = useState<CropScanRecord | null>(null);
  
  // Language view state for advisory
  const [showTeluguAdvisory, setShowTeluguAdvisory] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const loadingMessages = [
    "Analyzing your crop image...",
    "Checking crop health against Telangana disease database...",
    "Retrieving weather-aware agricultural advisory...",
    "Preparing Telugu voice guidance..."
  ];

  const cropsList: { name: SupportedCrop; telugu: string; icon: string }[] = [
    { name: 'Cotton', telugu: 'ప్రత్తి', icon: '🌿' },
    { name: 'Paddy', telugu: 'వరి', icon: '🌾' },
    { name: 'Chilli', telugu: 'మిర్చి', icon: '🌶️' },
    { name: 'Maize', telugu: 'మొక్కజొన్న', icon: '🌽' },
  ];

  const stagesList: { name: CropStage; telugu: string }[] = [
    { name: 'Seedling', telugu: 'మొలక దశ' },
    { name: 'Vegetative', telugu: 'ఎదుగుదల దశ' },
    { name: 'Flowering', telugu: 'పూత దశ' },
    { name: 'Fruiting', telugu: 'కాయ / గింజ దశ' },
    { name: 'Harvest', telugu: 'కోత దశ' },
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setLoadingMessageIndex(0);

    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 900);

    try {
      const formData = new FormData();
      formData.append('crop', selectedCrop);
      formData.append('crop_stage', selectedStage);
      formData.append('district', district);
      formData.append('mandal', mandal);
      if (imageFile) {
        formData.append('file', imageFile);
      }

      const result = await api.submitScan(formData);
      setScanResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handlePlayAudio = () => {
    if (isPlayingAudio) {
      audioRef?.pause();
      setIsPlayingAudio(false);
      return;
    }

    if (scanResult?.advisory.audio_url) {
      const audioUrl = scanResult.advisory.audio_url.startsWith('http')
        ? scanResult.advisory.audio_url
        : `http://localhost:8000${scanResult.advisory.audio_url}`;
        
      const audio = new Audio(audioUrl);
      setAudioRef(audio);
      setIsPlayingAudio(true);
      audio.play().catch(() => {
        speakTeluguFallback(scanResult.advisory.recommendation_te);
      });
      audio.onended = () => setIsPlayingAudio(false);
    } else if (scanResult) {
      speakTeluguFallback(scanResult.advisory.recommendation_te);
    }
  };

  const speakTeluguFallback = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'te-IN';
      setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border-2 border-emerald-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-forest-950 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">AI Crop Studio</span>
          <h1 className="text-2xl font-black text-black mt-1.5 text-telugu">
            {language === 'te' ? 'పంటను స్కాన్ చేయండి (Scan Your Crop)' : 'Scan Your Crop'}
          </h1>
        </div>

        {scanResult && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs transition-colors shadow border border-emerald-600"
          >
            <RefreshCw className="w-4 h-4 text-black" />
            <span>Scan Another Crop</span>
          </button>
        )}
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="bg-white p-12 rounded-3xl border-2 border-emerald-300 shadow-lg text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping opacity-75"></div>
            <div className="relative w-20 h-20 bg-forest-900 text-emerald-300 rounded-full flex items-center justify-center shadow-xl">
              <Sparkles className="w-10 h-10 animate-spin text-emerald-300" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-black">
              {loadingMessages[loadingMessageIndex]}
            </h3>
            <p className="text-xs text-forest-950 font-black text-telugu">
              తెలంగాణ వ్యవసాయ సమాచార నిధితో తనిఖీ జరుగుతోంది...
            </p>
          </div>
        </div>
      )}

      {/* STEP 1: PHOTO CAPTURE & SELECTION FORM */}
      {!loading && !scanResult && (
        <div className="space-y-6">

          {/* Upload Area */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-dashed border-emerald-400 hover:border-forest-800 transition-colors text-center space-y-4 shadow-sm">
            {imagePreview ? (
              <div className="relative max-w-sm mx-auto">
                <img
                  src={imagePreview}
                  alt="Selected Crop"
                  className="w-full h-56 object-cover rounded-2xl border-2 border-emerald-500 shadow-md"
                />
                <button
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 bg-red-600 text-white text-xs px-3 py-1.5 rounded-full font-black shadow-md hover:bg-red-700"
                >
                  Change Photo
                </button>
              </div>
            ) : (
              <div className="space-y-4 py-6">
                <div className="w-20 h-20 bg-emerald-100 text-forest-950 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-300">
                  <Camera className="w-10 h-10 text-forest-950" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black text-telugu">
                    Take or Upload Crop Photo (ఫోటో తీయండి)
                  </h3>
                  <p className="text-xs text-forest-950 font-extrabold mt-1">
                    Upload a clear photo of the leaf, stalk, or affected plant part
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-emerald-500 hover:bg-emerald-600 text-black font-black px-8 py-4 rounded-2xl shadow-lg transition-all flex items-center gap-2 touch-target text-base border border-emerald-600"
                  >
                    <Camera className="w-6 h-6 text-black" />
                    <span>Open Camera / Upload File</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Crop Selector Cards */}
          <div className="bg-white p-6 rounded-3xl border-2 border-emerald-300 shadow-sm space-y-4">
            <label className="block text-xs font-black text-black uppercase tracking-wider text-telugu">
              Select Crop (పంటను ఎంచుకోండి)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {cropsList.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedCrop(c.name)}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 touch-target ${
                    selectedCrop === c.name
                      ? 'border-forest-900 bg-emerald-100 text-black font-black ring-2 ring-emerald-300 shadow-sm'
                      : 'border-emerald-200 hover:border-emerald-400 text-black font-extrabold bg-white'
                  }`}
                >
                  <span className="text-3xl">{c.icon}</span>
                  <span className="text-sm font-black text-black">{c.name}</span>
                  <span className="text-xs text-forest-950 font-black text-telugu">({c.telugu})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Crop Stage Selector */}
          <div className="bg-white p-6 rounded-3xl border-2 border-emerald-300 shadow-sm space-y-4">
            <label className="block text-xs font-black text-black uppercase tracking-wider text-telugu">
              Crop Growth Stage (పంట దశ)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {stagesList.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setSelectedStage(s.name)}
                  className={`py-3 px-2 rounded-xl border-2 text-xs font-black transition-all text-center touch-target ${
                    selectedStage === s.name
                      ? 'border-forest-900 bg-emerald-500 text-black shadow-md'
                      : 'border-emerald-200 hover:border-emerald-400 text-black bg-white'
                  }`}
                >
                  <div>{s.name}</div>
                  <div className="text-[10px] text-black font-black text-telugu">{s.telugu}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Location Form */}
          <div className="bg-white p-6 rounded-3xl border-2 border-emerald-300 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                District (జిల్లా)
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full p-3.5 rounded-2xl border-2 border-emerald-300 focus:border-forest-800 outline-none text-sm font-black text-black touch-target bg-white"
              >
                <option value="Karimnagar">Karimnagar (కరీంనగర్)</option>
                <option value="Warangal">Warangal (వరంగల్)</option>
                <option value="Khammam">Khammam (ఖమ్మం)</option>
                <option value="Nalgonda">Nalgonda (నల్గొండ)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                Mandal (మండలం)
              </label>
              <input
                type="text"
                value={mandal}
                onChange={(e) => setMandal(e.target.value)}
                placeholder="Choppadandi"
                className="w-full p-3.5 rounded-2xl border-2 border-emerald-300 focus:border-forest-800 outline-none text-sm font-black text-black touch-target bg-white"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleAnalyze}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 touch-target text-lg border border-emerald-600"
          >
            <Sparkles className="w-6 h-6 text-black" />
            <span className="text-telugu">Analyze Crop Now (విశ్లేషించండి)</span>
          </button>

        </div>
      )}

      {/* STEP 2: DIAGNOSIS & ADVISORY RESULT DISPLAY */}
      {scanResult && !loading && (
        <div className="space-y-6">

          {/* AI Diagnosis Header Card - Crisp White with Emerald Border */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-emerald-300 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-200 pb-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-forest-950 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">AI Prediction Result</span>
                <h2 className="text-2xl font-black text-black mt-1.5 text-telugu">
                  {scanResult.diagnosis.disease_telugu || scanResult.diagnosis.disease}
                </h2>
                <span className="text-xs text-forest-950 font-black">{scanResult.diagnosis.disease}</span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1.5 rounded-full font-black text-xs ${
                    scanResult.diagnosis.risk_level === 'High'
                      ? 'bg-red-200 text-red-950 border border-red-400'
                      : scanResult.diagnosis.risk_level === 'Medium'
                      ? 'bg-amber-200 text-amber-950 border border-amber-400'
                      : 'bg-emerald-200 text-forest-950 border border-emerald-400'
                  }`}
                >
                  Risk: {scanResult.diagnosis.risk_level}
                </span>

                <span className="bg-emerald-500 text-black px-3.5 py-1.5 rounded-full font-black text-xs shadow-sm border border-emerald-600">
                  Confidence: {Math.round(scanResult.diagnosis.confidence * 100)}%
                </span>
              </div>
            </div>

            {/* Low Confidence Warning */}
            {scanResult.diagnosis.is_low_confidence && (
              <div className="p-4 bg-amber-100 rounded-2xl border-2 border-amber-300 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-950 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-black font-black space-y-1">
                  <span className="font-black text-telugu block">Unable to confidently identify the problem.</span>
                  <p className="text-telugu">
                    చిత్రం స్పష్టంగా లేదు. దయచేసి వెలుతురులో ఫోటోను మళ్ళీ తీయండి లేదా వ్యవసాయ అధికారిని సంప్రదించండి.
                  </p>
                </div>
              </div>
            )}

            {/* Preview Image & Quick Info */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5">
                <img
                  src={scanResult.image_url}
                  alt="Crop Scan"
                  className="w-full h-48 object-cover rounded-2xl border-2 border-emerald-300 shadow"
                />
              </div>

              <div className="md:col-span-7 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <span className="text-forest-950 font-black block">Crop</span>
                    <span className="font-black text-black text-sm">{scanResult.crop}</span>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <span className="text-forest-950 font-black block">Stage</span>
                    <span className="font-black text-black text-sm">{scanResult.crop_stage}</span>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <span className="text-forest-950 font-black block">Location</span>
                    <span className="font-black text-black text-sm">{scanResult.district}</span>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <span className="text-forest-950 font-black block">Weather</span>
                    <span className="font-black text-black text-sm">{scanResult.weather?.temperature || '31°C'}</span>
                  </div>
                </div>

                <div className="bg-emerald-100 p-3 rounded-xl border border-emerald-300 text-xs text-black font-black flex items-center gap-2">
                  <Info className="w-4 h-4 text-forest-900" />
                  <span>AI prediction is verified against Telangana PJTSAU Advisory Engine.</span>
                </div>
              </div>
            </div>
          </div>

          {/* ADVISORY ENGINE SECTION WITH TELUGU VOICE PLAYER - Clean Green & White */}
          <div className="bg-white rounded-3xl p-6 md:p-8 text-black border-2 border-emerald-400 shadow-xl space-y-6">

            {/* Header & Voice Play Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-200 pb-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-forest-950 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">Contextual Advisory</span>
                <h3 className="text-2xl font-black mt-1 text-telugu text-black">పంట నివారణ సలహా (Recommended Action)</h3>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowTeluguAdvisory(!showTeluguAdvisory)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-xs font-black text-black border border-emerald-300 flex items-center gap-1.5 transition-colors"
                >
                  <Globe className="w-4 h-4 text-forest-900" />
                  <span>{showTeluguAdvisory ? 'Show in English' : 'Show in Telugu'}</span>
                </button>

                {/* TELUGU VOICE BUTTON */}
                <button
                  onClick={handlePlayAudio}
                  className={`px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg transition-all ${
                    isPlayingAudio
                      ? 'bg-red-600 text-white animate-pulse border border-red-700'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-black hover:scale-105 border border-emerald-600'
                  }`}
                >
                  <Volume2 className="w-5 h-5 text-black" />
                  <span className="text-telugu">{isPlayingAudio ? 'ఆగుము (Stop)' : '🔊 వినండి (Listen)'}</span>
                </button>
              </div>
            </div>

            {/* Advisory Text Content */}
            <div className="space-y-4">
              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-300 space-y-2">
                <span className="text-xs font-black text-forest-950 uppercase tracking-wider">
                  {showTeluguAdvisory ? 'సిఫార్సు చేసిన నివారణ చర్య' : 'Recommended Treatment'}
                </span>
                <p className="text-base md:text-lg leading-relaxed text-telugu text-black font-extrabold">
                  {showTeluguAdvisory ? scanResult.advisory.recommendation_te : scanResult.advisory.recommendation_en}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-300 space-y-1.5">
                  <span className="text-xs font-black text-forest-950 uppercase tracking-wider">
                    {showTeluguAdvisory ? 'మందుల మోతాదు (Dosage)' : 'Dosage'}
                  </span>
                  <p className="text-xs text-black font-extrabold text-telugu leading-relaxed">
                    {showTeluguAdvisory ? scanResult.advisory.dosage_te : scanResult.advisory.dosage_en}
                  </p>
                </div>

                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-300 space-y-1.5">
                  <span className="text-xs font-black text-forest-950 uppercase tracking-wider">
                    {showTeluguAdvisory ? 'రైతు జాగ్రత్తలు (Safety Notes)' : 'Safety Notes'}
                  </span>
                  <p className="text-xs text-black font-extrabold text-telugu leading-relaxed">
                    {showTeluguAdvisory ? scanResult.advisory.safety_notes_te : scanResult.advisory.safety_notes_en}
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
