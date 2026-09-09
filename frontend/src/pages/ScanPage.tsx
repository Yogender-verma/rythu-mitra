import React, { useState, useEffect, useRef } from 'react';
import { Camera, Volume2, Sparkles, AlertTriangle, RefreshCw, Globe, Info, AlertCircle, MapPin, Thermometer, Droplets, CheckCircle, HelpCircle, ShieldAlert } from 'lucide-react';
import type { CropScanRecord, SupportedCrop, WeatherData } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ScanPage: React.FC = () => {
  const { language } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Geolocation & Weather State
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('idle');
  const [liveWeather, setLiveWeather] = useState<WeatherData | null>(null);

  // UI State
  const [loading, setLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<CropScanRecord | null>(null);
  
  // Language View Toggle (Telugu default)
  const [showEnglish, setShowEnglish] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const loadingMessages = [
    "పంట ఆకు ఫోటోను లోడ్ చేస్తోంది (Loading crop leaf)...",
    "రియల్ PyTorch AI మోడల్ ద్వారా విశ్లేషిస్తోంది (Running PyTorch classifier)...",
    "నమ్మక స్థాయిని లెక్కిస్తోంది (Calculating diagnosis confidence)...",
    "PJTSAU వ్యవసాయ నిపుణుల సలహాలను పొందుతోంది (Retrieving PJTSAU advisory)...",
    "లైవ్ వాతావరణం మరియు వాయిస్ గైడెన్స్ సిద్ధం చేస్తోంది..."
  ];

  // Request Geolocation on mount or button
  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('unsupported');
      return;
    }
    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserCoords({ lat, lon });
        setLocationStatus('granted');
        
        // Fetch Live Open-Meteo & Nominatim Weather
        const wData = await api.getLiveWeather(lat, lon);
        setLiveWeather(wData);
      },
      (err) => {
        console.warn('Geolocation denied/failed:', err);
        setLocationStatus('denied');
        // Fetch fallback weather without lat/lon
        api.getLiveWeather().then(wData => setLiveWeather(wData));
      },
      { timeout: 8000 }
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        setError('దయచేసి సరైన JPG, PNG, లేదా WebP ఫోటోను ఎంచుకోండి.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('ఫోటో సైజు 10 MB కంటే తక్కువగా ఉండాలి.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile && !imagePreview) {
      setError('దయచేసి ముందుగా పంట ఆకు ఫోటోను తీయండి లేదా అప్‌లోడ్ చేయండి.');
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingMessageIndex(0);

    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1000);

    try {
      const formData = new FormData();
      formData.append('district', 'Karimnagar');
      formData.append('mandal', 'Choppadandi');
      if (userCoords) {
        formData.append('lat', userCoords.lat.toString());
        formData.append('lon', userCoords.lon.toString());
      }
      if (imageFile) {
        formData.append('file', imageFile);
      }

      const result = await api.submitScan(formData);
      setScanResult(result);
      if (result.weather) {
        setLiveWeather(result.weather);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'విశ్లేషణ విఫలమైంది. దయచేసి ఇంటర్నెట్ కనెక్షన్ మరియు మోడల్ సర్వర్‌ను తనిఖీ చేయండి.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handlePlayAudio = () => {
    if (isPlayingAudio) {
      if (audioRef) audioRef.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const audioScript = showEnglish
      ? (scanResult?.advisory.audio_text_en || scanResult?.advisory.why_en)
      : (scanResult?.advisory.audio_text_te || scanResult?.advisory.why_te);

    if (!audioScript) return;

    if (scanResult?.audio_url && !showEnglish) {
      const audioUrl = scanResult.audio_url.startsWith('http')
        ? scanResult.audio_url
        : `http://localhost:8000${scanResult.audio_url}`;
        
      const audio = new Audio(audioUrl);
      setAudioRef(audio);
      setIsPlayingAudio(true);
      audio.play().catch(() => {
        speakFallback(audioScript, showEnglish ? 'en-US' : 'te-IN');
      });
      audio.onended = () => setIsPlayingAudio(false);
    } else {
      speakFallback(audioScript, showEnglish ? 'en-US' : 'te-IN');
    }
  };

  const speakFallback = (text: string, langCode: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    if (isPlayingAudio) {
      if (audioRef) audioRef.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-black">

      {/* Main Grid: Left Column for Scan/Advisory, Right Column for Sticky Live Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: SCAN CONTROLS & RESULT DISPLAY */}
        <div className="lg:col-span-8 space-y-6">

          {/* Page Header */}
          <div className="bg-white p-6 rounded-3xl border-2 border-[#B7C9B3] shadow-sm flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#1B5E20] bg-[#C8E6C9] px-3 py-1 rounded-full border border-[#B7C9B3]">
                AI Crop Doctor Studio
              </span>
              <h1 className="text-2xl font-black text-black mt-1 text-telugu">
                {showEnglish ? 'Crop Disease Scanner' : 'పంట వ్యాధి నిర్ధారణ (Crop Doctor)'}
              </h1>
            </div>

            {scanResult && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black text-xs transition-colors shadow border border-[#1B5E20]"
              >
                <RefreshCw className="w-4 h-4 text-white" />
                <span className="text-telugu">{showEnglish ? 'Scan Another' : 'మరొక పంటను స్కాన్ చేయండి'}</span>
              </button>
            )}
          </div>

          {/* ERROR DISPLAY */}
          {error && (
            <div className="bg-red-50 p-4 rounded-2xl border-2 border-red-300 flex items-center gap-3 text-red-950">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <span className="text-sm font-black">{error}</span>
            </div>
          )}

          {/* LOADING STATE */}
          {loading && (
            <div className="bg-white p-12 rounded-3xl border-2 border-[#B7C9B3] shadow-lg text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-[#2E7D32] animate-ping opacity-75"></div>
                <div className="relative w-20 h-20 bg-[#1B5E20] text-white rounded-full flex items-center justify-center shadow-xl">
                  <Sparkles className="w-10 h-10 animate-spin text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-black text-telugu">
                  {loadingMessages[loadingMessageIndex]}
                </h3>
                <p className="text-xs text-[#1B5E20] font-black">
                  Analyzing via PyTorch MobileNetV3 multi-crop network...
                </p>
              </div>
            </div>
          )}

          {/* STEP 1: CROP & STAGE SELECTOR + PHOTO UPLOAD */}
          {!loading && !scanResult && (
            <div className="space-y-6">

              {/* Photo Upload Area */}
              <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-[#B7C9B3] hover:border-[#1B5E20] transition-colors text-center space-y-6 shadow-sm">
                {imagePreview ? (
                  <div className="relative max-w-sm mx-auto space-y-4">
                    <img
                      src={imagePreview}
                      alt="Crop Leaf"
                      className="w-full h-64 object-cover rounded-2xl border-2 border-[#B7C9B3] shadow-md"
                    />
                    <button
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        setError(null);
                      }}
                      className="bg-red-600 text-white text-xs px-4 py-2 rounded-full font-black shadow-md hover:bg-red-700 transition"
                    >
                      Change Photo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 py-6">
                    <div className="w-20 h-20 bg-[#C8E6C9] text-black rounded-full flex items-center justify-center mx-auto shadow-inner border border-[#B7C9B3]">
                      <Camera className="w-10 h-10 text-[#1B5E20]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-black text-telugu">
                        ఆకు ఫోటోను అప్‌లోడ్ చేయండి (Upload Leaf Photo)
                      </h3>
                      <p className="text-xs text-black font-black mt-1">
                        Take a clear close-up photo of the affected leaf in good lighting
                      </p>
                    </div>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black px-8 py-4 rounded-2xl shadow-lg transition-all flex items-center gap-3 touch-target text-base border border-[#1B5E20] mx-auto"
                    >
                      <Camera className="w-6 h-6 text-white" />
                      <span className="text-telugu">క్యామెరా / గ్యాలరీ తెరువుము</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Submit Analyze Button */}
              {imagePreview && (
                <button
                  onClick={handleAnalyze}
                  className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 touch-target text-lg border border-[#1B5E20]"
                >
                  <Sparkles className="w-6 h-6 text-white" />
                  <span className="text-telugu">పంటను విశ్లేషించండి (Analyze Crop Now)</span>
                </button>
              )}

            </div>
          )}

          {/* STEP 2: DIAGNOSIS & ADVISORY RESULT DISPLAY */}
          {scanResult && !loading && (
            <div className="space-y-6">

              {/* Language Toggle & Voice Controls Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border-2 border-[#B7C9B3]">
                <button
                  onClick={() => setShowEnglish(!showEnglish)}
                  className="px-4 py-2 rounded-xl bg-[#C8E6C9] hover:bg-[#A5D6A7] text-xs font-black text-black border border-[#B7C9B3] flex items-center gap-2 transition-colors"
                >
                  <Globe className="w-4 h-4 text-[#1B5E20]" />
                  <span>{showEnglish ? 'తెలుగులో చూడండి (View in Telugu)' : 'Translate to English'}</span>
                </button>

                {/* TELUGU VOICE BUTTON (Reads ONLY Why + What to do) */}
                <button
                  onClick={handlePlayAudio}
                  className={`px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg transition-all ${
                    isPlayingAudio
                      ? 'bg-red-600 text-white animate-pulse border border-red-700'
                      : 'bg-[#2E7D32] hover:bg-[#1B5E20] text-white hover:scale-105 border border-[#1B5E20]'
                  }`}
                >
                  <Volume2 className="w-5 h-5 text-white" />
                  <span className="text-telugu">
                    {isPlayingAudio ? (showEnglish ? 'Stop' : 'ఆగుము') : (showEnglish ? '🔊 Listen (Why + Action)' : '🔊 వినండి (కారణం + చర్యలు)')}
                  </span>
                </button>
              </div>

              {/* HEALTHY RESULT VIEW (Requirement 7 & 12) */}
              {scanResult.advisory.is_healthy ? (
                <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-[#2E7D32] shadow-lg space-y-6">
                  <div className="flex items-center gap-3 p-4 bg-[#C8E6C9] rounded-2xl border border-[#B7C9B3]">
                    <CheckCircle className="w-8 h-8 text-[#1B5E20] flex-shrink-0" />
                    <div>
                      <h2 className="text-xl font-black text-black text-telugu">
                        {showEnglish ? 'There are no clear disease symptoms detected in this crop.' : 'ఈ పంటలో వ్యాధి లక్షణాలు కనిపించలేదు.'}
                      </h2>
                      <span className="text-xs text-black font-black">
                        Status: Healthy {scanResult.crop} Crop (Confidence: {Math.round(scanResult.diagnosis.confidence * 100)}%)
                      </span>
                    </div>
                  </div>

                  {/* Season Information */}
                  <div className="bg-[#F5F8F2] p-5 rounded-2xl border border-[#B7C9B3] space-y-2">
                    <span className="text-xs font-black text-[#1B5E20] uppercase tracking-wider">
                      {showEnglish ? 'Current Season Information' : '📅 ప్రస్తుత కాలానికి సంబంధించిన సమాచారం'}
                    </span>
                    <p className="text-sm text-black font-bold text-telugu">
                      {showEnglish ? scanResult.advisory.season_en : scanResult.advisory.season_te}
                    </p>
                  </div>

                  {/* General Crop Monitoring Advice */}
                  <div className="bg-[#F5F8F2] p-5 rounded-2xl border border-[#B7C9B3] space-y-2">
                    <span className="text-xs font-black text-[#1B5E20] uppercase tracking-wider">
                      {showEnglish ? 'General Crop Monitoring Tip' : '💡 సూచన (Crop Monitoring Tip)'}
                    </span>
                    <p className="text-sm md:text-base text-black font-extrabold text-telugu leading-relaxed">
                      {showEnglish ? scanResult.advisory.actions_en : scanResult.advisory.actions_te}
                    </p>
                  </div>
                </div>
              ) : scanResult.diagnosis.is_low_confidence ? (
                
                /* SAFE LOW CONFIDENCE FALLBACK VIEW (Requirement 1 & 5) */
                <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-amber-400 shadow-lg space-y-6">
                  <div className="flex items-start gap-3 p-5 bg-amber-100 rounded-2xl border-2 border-amber-300 text-amber-950">
                    <ShieldAlert className="w-8 h-8 text-amber-800 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <h2 className="text-lg font-black text-telugu">
                        {showEnglish
                          ? 'We could not confidently identify the condition from this image. Please take a clear, close-up photo of the affected leaf.'
                          : 'ఈ చిత్రాన్ని బట్టి వ్యాధిని ఖచ్చితంగా గుర్తించలేకపోయాము. దయచేసి ప్రభావిత ఆకును దగ్గరగా, స్పష్టమైన వెలుతురులో ఫోటో తీయండి.'}
                      </h2>
                      <span className="text-xs font-black text-amber-900 block">
                        Confidence Score: {Math.round(scanResult.diagnosis.confidence * 100)}% (Below 40% threshold)
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#F5F8F2] p-5 rounded-2xl border border-[#B7C9B3] space-y-2">
                    <span className="text-xs font-black text-[#1B5E20] uppercase tracking-wider">
                      {showEnglish ? 'Instructions for Retaking Photo' : 'చర్యలు (Instructions)'}
                    </span>
                    <p className="text-sm text-black font-bold text-telugu leading-relaxed">
                      {showEnglish ? scanResult.advisory.actions_en : scanResult.advisory.actions_te}
                    </p>
                  </div>
                </div>
              ) : (

                /* DISEASE DETECTED VIEW (Requirement 8) */
                <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-[#B7C9B3] shadow-lg space-y-6">
                  
                  {/* Diagnosis Header */}
                  <div className="border-b border-[#B7C9B3] pb-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-white bg-red-700 px-3 py-1 rounded-full border border-red-800">
                        {showEnglish ? 'Disease Symptoms Detected' : '⚠️ వ్యాధి లక్షణాలు గుర్తించబడ్డాయి'}
                      </span>
                      <span className="bg-[#2E7D32] text-white px-3.5 py-1 rounded-full font-black text-xs">
                        Confidence: {Math.round(scanResult.diagnosis.confidence * 100)}%
                      </span>
                    </div>

                    <h2 className="text-2xl font-black text-black text-telugu mt-2">
                      🌱 పంట: {scanResult.crop}
                    </h2>
                    <h3 className="text-xl font-black text-red-950 text-telugu">
                      🔍 గుర్తింపు: {showEnglish ? scanResult.advisory.disease_en : scanResult.advisory.disease_te}
                    </h3>
                  </div>

                  {/* Season Information (Requirement 6) */}
                  <div className="bg-[#F5F8F2] p-5 rounded-2xl border border-[#B7C9B3] space-y-1.5">
                    <span className="text-xs font-black text-[#1B5E20] uppercase tracking-wider flex items-center gap-1.5">
                      <span>📅 సాధారణంగా కనిపించే కాలం (Common Season):</span>
                    </span>
                    <p className="text-sm font-bold text-black text-telugu">
                      {showEnglish ? scanResult.advisory.season_en : scanResult.advisory.season_te}
                    </p>
                  </div>

                  {/* WHY DID IT HAPPEN? (Requirement 7) */}
                  <div className="bg-[#F5F8F2] p-5 rounded-2xl border border-[#B7C9B3] space-y-2">
                    <h4 className="text-sm font-black text-[#1B5E20] uppercase tracking-wider flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-[#1B5E20]" />
                      <span className="text-telugu">{showEnglish ? 'Why Did This Happen?' : '❓ ఇది ఎందుకు వచ్చింది?'}</span>
                    </h4>
                    <p className="text-base text-black font-bold text-telugu leading-relaxed">
                      {showEnglish ? scanResult.advisory.why_en : scanResult.advisory.why_te}
                    </p>
                  </div>

                  {/* WHAT SHOULD THE FARMER DO? (Requirement 8) */}
                  <div className="bg-[#F5F8F2] p-5 rounded-2xl border border-[#B7C9B3] space-y-2">
                    <h4 className="text-sm font-black text-[#1B5E20] uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-[#1B5E20]" />
                      <span className="text-telugu">{showEnglish ? 'What Should I Do Now?' : '✅ ఇప్పుడు ఏమి చేయాలి?'}</span>
                    </h4>
                    <div className="text-sm md:text-base text-black font-extrabold text-telugu leading-relaxed whitespace-pre-line">
                      {showEnglish ? scanResult.advisory.actions_en : scanResult.advisory.actions_te}
                    </div>
                  </div>

                  {/* VERIFIED DOSAGE & TREATMENT */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#C8E6C9] p-4 rounded-2xl border border-[#B7C9B3] space-y-1">
                      <span className="text-xs font-black text-[#1B5E20] uppercase tracking-wider">
                        {showEnglish ? 'PJTSAU Approved Dosage' : 'మందుల మోతాదు (PJTSAU Verified)'}
                      </span>
                      <p className="text-xs text-black font-black text-telugu leading-relaxed">
                        {showEnglish ? scanResult.advisory.dosage_en : scanResult.advisory.dosage_te}
                      </p>
                    </div>

                    <div className="bg-[#F5F8F2] p-4 rounded-2xl border border-[#B7C9B3] space-y-1">
                      <span className="text-xs font-black text-[#1B5E20] uppercase tracking-wider">
                        {showEnglish ? 'Safety Notes' : 'రైతు జాగ్రత్తలు (Safety)'}
                      </span>
                      <p className="text-xs text-black font-black text-telugu leading-relaxed">
                        {showEnglish ? scanResult.advisory.safety_notes_en : scanResult.advisory.safety_notes_te}
                      </p>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

        {/* RIGHT COLUMN: STICKY LIVE WEATHER CARD (Requirement 5 & 13) */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-6 space-y-6">

            <div className="bg-white p-6 rounded-3xl border-2 border-[#B7C9B3] shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-[#B7C9B3] pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-[#1B5E20] bg-[#C8E6C9] px-3 py-1 rounded-full border border-[#B7C9B3]">
                  Live Location Weather
                </span>

                {locationStatus !== 'granted' && (
                  <button
                    onClick={requestLocation}
                    className="text-xs font-black text-[#2E7D32] hover:underline"
                  >
                    Allow Location
                  </button>
                )}
              </div>

              {/* Location Status Message */}
              {locationStatus === 'requesting' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-black text-amber-950 animate-pulse">
                  మీ ప్రాంతంలోని వాతావరణ సమాచారం కోసం మీ స్థానాన్ని అనుమతించండి...
                </div>
              )}

              {/* Weather Content */}
              {liveWeather?.is_weather_available ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-black font-extrabold text-base">
                    <MapPin className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <span>📍 {liveWeather.location_name}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#F5F8F2] p-4 rounded-2xl border border-[#B7C9B3] flex items-center gap-3">
                      <Thermometer className="w-8 h-8 text-amber-600 flex-shrink-0" />
                      <div>
                        <span className="text-xs text-black font-black block">Temp</span>
                        <span className="text-lg font-black text-black">{liveWeather.temperature}</span>
                      </div>
                    </div>

                    <div className="bg-[#F5F8F2] p-4 rounded-2xl border border-[#B7C9B3] flex items-center gap-3">
                      <Droplets className="w-8 h-8 text-blue-600 flex-shrink-0" />
                      <div>
                        <span className="text-xs text-black font-black block">Humidity</span>
                        <span className="text-lg font-black text-black">{liveWeather.humidity}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#C8E6C9] p-3 rounded-xl border border-[#B7C9B3] text-xs font-black text-black">
                    🌤️ {liveWeather.condition_telugu} ({liveWeather.condition})
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-2">
                  <AlertTriangle className="w-6 h-6 text-gray-500 mx-auto" />
                  <span className="text-xs font-black text-gray-700 block text-telugu">
                    లైవ్ వాతావరణ సమాచారం అందుబాటులో లేదు (Live Weather Unavailable)
                  </span>
                  <button
                    onClick={requestLocation}
                    className="text-xs font-black bg-[#2E7D32] text-white px-3 py-1.5 rounded-lg shadow"
                  >
                    Enable Geolocation
                  </button>
                </div>
              )}
            </div>

            {/* Verified PJTSAU Trust Badge */}
            <div className="bg-white p-5 rounded-3xl border-2 border-[#B7C9B3] shadow-sm text-xs font-black text-black space-y-2">
              <span className="font-extrabold text-[#1B5E20] block">🏛️ Telangana Agriculture PJTSAU Package of Practices</span>
              <p className="text-gray-700 leading-relaxed">
                సలహాలన్నీ జయశంకర్ తెలంగాణ రాష్ట్ర వ్యవసాయ విశ్వవిద్యాలయం (PJTSAU) ప్రామాణిక మార్గదర్శకాల ఆధారంగా రూపొందించబడ్డాయి.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
