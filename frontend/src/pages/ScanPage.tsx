import React, { useState, useEffect, useRef } from 'react';
import { Camera, Volume2, VolumeX, Sparkles, AlertTriangle, RefreshCw, Globe, AlertCircle, MapPin, Thermometer, Droplets, CheckCircle, HelpCircle, ShieldAlert, Upload, X, RotateCcw } from 'lucide-react';
import type { CropScanRecord, WeatherData } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';


const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.336 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

export const ScanPage: React.FC = () => {
  const { language, setLanguage, user } = useAuth();
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
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [whatsappSuccess, setWhatsappSuccess] = useState(false);
  const [settingsPhone, setSettingsPhone] = useState<string>(() => {
    return localStorage.getItem('rythumitra_settings_phone') || user?.phone || '+917013224596';
  });

  useEffect(() => {
    api.getSettingsPhone().then((p) => {
      if (p) setSettingsPhone(p);
    });
  }, []);

  useEffect(() => {
    if (user?.phone) {
      setSettingsPhone(user.phone);
    }
  }, [user?.phone]);

  // Camera State & Refs
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'active' | 'denied' | 'error'>('idle');
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const directCameraInputRef = useRef<HTMLInputElement>(null);

  // Clean up media tracks
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraStatus('idle');
  };

  // Start live camera with explicit permission request
  const startCamera = async () => {
    stopCamera();
    setError(null);
    setIsCameraActive(true);
    setCameraStatus('requesting');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraStatus('active');
    } catch (err: any) {
      console.warn('Camera permission or device error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
      } else {
        setCameraStatus('error');
      }
    }
  };

  // Flip between front and back camera
  const flipCamera = () => {
    setCameraFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Re-initialize camera when facing mode changes
  useEffect(() => {
    if (isCameraActive && cameraStatus === 'active') {
      startCamera();
    }
  }, [cameraFacingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Capture frame from video stream to imageFile & imagePreview
  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError(t.errValidPhoto);
      return;
    }

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `leaf_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setImageFile(file);
        setImagePreview(URL.createObjectURL(blob));
        stopCamera();
      }
    }, 'image/jpeg', 0.92);
  };

  const t = {
    te: {
      pageBadge: 'ఏఐ క్రాప్ డాక్టర్ స్టూడియో',
      pageTitle: 'పంట వ్యాధి నిర్ధారణ',
      scanAnother: 'మరొక పంటను స్కాన్ చేయండి',
      changePhoto: 'ఫోటో మార్చండి',
      uploadTitle: 'ఆకు ఫోటోను అప్‌లోడ్ చేయండి',
      uploadDesc: 'వ్యాధి సోకిన ఆకును మంచి వెలుతురులో స్పష్టంగా దగ్గర నుండి ఫోటో తీయండి',
      uploadOptionTitle: 'చిత్రాన్ని ఎంచుకోండి',
      uploadOptionDesc: 'గ్యాలరీ నుండి లేదా లైవ్ కెమెరా ద్వారా పంట ఆకు ఫోటో తీయండి',
      uploadBtn: 'గ్యాలరీ నుండి అప్‌లోడ్',
      uploadHint: 'ఫోటోను ఎంచుకోండి',
      cameraBtn: 'లైవ్ కెమెరా తెరవండి',
      cameraHint: 'కెమెరాతో ఫోటో తీయండి',
      cameraPermTitle: 'కెమెరా అనుమతి అడుగుతోంది...',
      cameraPermDesc: 'దయచేసి లైవ్ ఫోటో తీయడానికి మీ బ్రౌజర్‌లో కెమెరా అనుమతిని (Allow) అనుమతించండి.',
      cameraActiveTitle: 'లైవ్ కెమెరా ఆన్ చేయబడింది',
      alignLeafGuide: 'పంట ఆకును ఫ్రేమ్ మధ్యలో స్పష్టంగా ఉంచండి',
      captureBtn: 'ఫోటో తీయండి',
      switchCamBtn: 'కెమెరా మార్చండి',
      cancelCamBtn: 'రద్దు చేయండి',
      cameraDeniedTitle: 'కెమెరా అనుమతి నిరాకరించబడింది',
      cameraDeniedDesc: 'దయచేసి బ్రౌజర్ సెట్టింగ్స్‌లో కెమెరా అనుమతించండి లేదా గ్యాలరీ ద్వారా ఫోటోను అప్‌లోడ్ చేయండి.',
      retryCamBtn: 'మళ్ళీ ప్రయత్నించండి',
      useDirectCamFallback: 'డివైస్ కెమెరా తెరవండి',
      openCameraBtn: 'కెమెరా లేదా గ్యాలరీ తెరవండి',
      analyzeBtn: 'పంటను విశ్లేషించండి',
      switchLangBtn: 'English లోకి మార్చండి',
      listenAudio: '🔊 ఆడియో పరిష్కారం వినండి',
      listenAudioSolutionBtn: 'ఆడియో పరిష్కారం వినండి',
      stopAudio: 'ఆడియో ఆపండి',
      audioSolutionBadge: 'వాయిస్ ఆడియో పరిష్కారం',
      audioPureBadge: '🟢 100% తెలుగు ఆడియో',
      audioSolutionTitle: 'పూర్తి నివారణ & మందుల మోతాదు ఆడియో',
      audioSolutionDesc: 'సిఫార్సు చేసిన మందు, పిచికారీ మోతాదు మరియు రక్షణ జాగ్రత్తల పూర్తి ఆడియో వివరణ వినండి.',
      analyzingBadge: 'PyTorch MobileNetV3 మోడల్ ద్వారా విశ్లేషిస్తోంది...',
      healthyTitle: 'ఈ పంటలో ఎలాంటి వ్యాధి లక్షణాలు కనిపించలేదు.',
      healthyStatus: (crop: string, conf: number) => `స్థితి: ఆరోగ్యకరమైన ${crop} పంట (నమ్మకం: ${conf}%)`,
      seasonTitle: 'ప్రస్తుత కాల సమాచారం',
      monitorTipTitle: 'పంట యాజమాన్య సూచన',
      lowConfTitle: 'ఈ చిత్రాన్ని బట్టి వ్యాధిని ఖచ్చితంగా గుర్తించలేకపోయాము. దయచేసి ప్రభావిత ఆకును దగ్గరగా, స్పష్టమైన వెలుతురులో ఫోటో తీయండి.',
      lowConfScore: (conf: number) => `ఖచ్చితత్వ స్కోరు: ${conf}% (40% కంటే తక్కువ)`,
      retakeTitle: 'మళ్ళీ ఫోటో తీసే విధానం',
      diseaseDetectedBadge: 'వ్యాధి లక్షణాలు గుర్తించబడ్డాయి',
      confidenceLabel: (conf: number) => `ఖచ్చితత్వం: ${conf}%`,
      cropLabel: 'పంట',
      diagnosisLabel: 'గుర్తింపు',
      commonSeasonLabel: 'సాధారణంగా కనిపించే కాలం',
      whyTitle: 'ఇది ఎందుకు వచ్చింది?',
      actionTitle: 'ఇప్పుడు ఏమి చేయాలి?',
      dosageTitle: 'మందుల మోతాదు (PJTSAU మార్గదర్శకాలు)',
      safetyTitle: 'రైతు తీసుకోవలసిన జాగ్రత్తలు',
      recommendedMedicineTitle: 'సిఫార్సు చేసిన మందు / క్రిమి సంహారకం',
      pjtsauCertified: 'PJTSAU ధృవీకరించిన మందు',
      recommendedDosage: 'సిఫార్సు చేసిన మోతాదు',
      safetyGuidance: 'జాగ్రత్త',
      liveWeatherBadge: 'ప్రత్యక్ష వాతావరణం',
      allowLocation: 'స్థానాన్ని అనుమతించండి',
      locationRequesting: 'మీ ప్రాంతంలోని వాతావరణ సమాచారం కోసం స్థాన అనుమతిని ఇవ్వండి...',
      tempLabel: 'ఉష్ణోగ్రత',
      humidityLabel: 'గాలిలో తేమ',
      weatherUnavailable: 'ప్రత్యక్ష వాతావరణ సమాచారం అందుబాటులో లేదు',
      enableGeoBtn: 'స్థానాన్ని ప్రారంభించండి',
      trustBadgeTitle: 'తెలంగాణ వ్యవసాయ PJTSAU ప్రామాణిక నిబంధనలు',
      trustBadgeDesc: 'సలహాలన్నీ ఆచార్య జయశంకర్ తెలంగాణ రాష్ట్ర వ్యవసాయ విశ్వవిద్యాలయం (PJTSAU) ప్రామాణిక మార్గదర్శకాల ఆధారంగా రూపొందించబడ్డాయి.',
      errValidPhoto: 'దయచేసి సరైన JPG, PNG లేదా WebP ఫోటోను ఎంచుకోండి.',
      errPhotoSize: 'ఫోటో సైజు 10 MB కంటే తక్కువగా ఉండాలి.',
      errSelectPhotoFirst: 'దయచేసి ముందుగా పంట ఆకు ఫోటోను తీయండి లేదా అప్‌లోడ్ చేయండి.',
      errAnalysisFailed: 'విశ్లేషణ విఫలమైంది. దయచేసి ఇంటర్నెట్ కనెక్షన్ మరియు సర్వర్‌ను తనిఖీ చేయండి.',
      whatsappCardBadge: 'WhatsApp నివేదిక షేరింగ్',
      whatsappCardTitle: 'సెట్టింగ్‌ల నంబర్‌కు పూర్తి సలహా పంపండి',
      whatsappCardDesc: 'పంట చిత్రం, గుర్తించిన సమస్య మరియు పూర్తి పరిష్కారాన్ని సెట్టింగ్‌లలో భద్రపరిచిన మీ వాట్సాప్ నంబర్‌కు పొందండి.',
      whatsappRegNoLabel: 'సెట్టింగ్‌లలో భద్రపరిచిన ఫోన్ నంబర్',
      whatsappShareBtn: 'WhatsApp లో పరిష్కారం పంపండి',
      whatsappSharing: 'WhatsApp లో పంపుతోంది...',
      whatsappDispatchedBadge: '✅ WhatsApp కు పంపబడింది!',
      whatsappTooltip: 'సెట్టింగ్‌లలో భద్రపరిచిన నంబర్‌కు WhatsApp లో షేర్ చేయండి',
      loadingMessages: [
        'పంట ఆకు ఫోటోను లోడ్ చేస్తోంది...',
        'రియల్ PyTorch AI మోడల్ ద్వారా విశ్లేషిస్తోంది...',
        'వ్యాధి నిర్ధారణ నమ్మక స్థాయిని లెక్కిస్తోంది...',
        'PJTSAU వ్యవసాయ నిపుణుల సలహాలను పొందుతోంది...',
        'వాతావరణ సమాచారం మరియు తెలుగు వాయిస్ సిద్ధం చేస్తోంది...'
      ],
      crops: {
        Cotton: 'ప్రత్తి',
        Paddy: 'వరి',
        Chilli: 'మిర్చి',
        Maize: 'మొక్కజొన్న'
      }
    },
    en: {
      pageBadge: 'AI Crop Doctor Studio',
      pageTitle: 'Crop Disease Diagnosis',
      scanAnother: 'Scan Another Crop',
      changePhoto: 'Change Photo',
      uploadTitle: 'Upload Leaf Photo',
      uploadDesc: 'Take a clear close-up photo of the affected leaf in good lighting',
      uploadOptionTitle: 'Choose Image Source',
      uploadOptionDesc: 'Upload a leaf photo from your gallery or capture one with live camera',
      uploadBtn: 'Upload from Gallery',
      uploadHint: 'Choose an existing photo',
      cameraBtn: 'Open Live Camera',
      cameraHint: 'Snap photo with camera',
      cameraPermTitle: 'Requesting Camera Permission...',
      cameraPermDesc: 'Please click "Allow" when your browser prompts for camera access to capture a live photo.',
      cameraActiveTitle: 'Live Camera Active',
      alignLeafGuide: 'Align the crop leaf in the center of the frame',
      captureBtn: 'Capture Photo',
      switchCamBtn: 'Switch Camera',
      cancelCamBtn: 'Cancel',
      cameraDeniedTitle: 'Camera Permission Denied',
      cameraDeniedDesc: 'Please enable camera access in your browser settings or upload a photo from your gallery.',
      retryCamBtn: 'Try Again',
      useDirectCamFallback: 'Open Device Camera',
      openCameraBtn: 'Open Camera / Gallery',
      analyzeBtn: 'Analyze Crop Now',
      switchLangBtn: 'తెలుగులోకి మార్చండి',
      listenAudio: '🔊 Listen to Audio Solution',
      listenAudioSolutionBtn: 'Listen to Audio Solution',
      stopAudio: 'Stop Audio',
      audioSolutionBadge: 'Voice Audio Solution',
      audioPureBadge: '🟢 100% English Audio',
      audioSolutionTitle: 'Complete Treatment & Dosage Voice Advisory',
      audioSolutionDesc: 'Listen to complete audio guidance for prescribed formulation, dosage, and safety instructions.',
      analyzingBadge: 'Analyzing via PyTorch MobileNetV3 multi-crop network...',
      healthyTitle: 'There are no clear disease symptoms detected in this crop.',
      healthyStatus: (crop: string, conf: number) => `Status: Healthy ${crop} Crop (Confidence: ${conf}%)`,
      seasonTitle: 'Current Season Information',
      monitorTipTitle: 'General Crop Monitoring Tip',
      lowConfTitle: 'We could not confidently identify the condition from this image. Please take a clear, close-up photo of the affected leaf.',
      lowConfScore: (conf: number) => `Confidence Score: ${conf}% (Below 40% threshold)`,
      retakeTitle: 'Instructions for Retaking Photo',
      diseaseDetectedBadge: 'Disease Symptoms Detected',
      confidenceLabel: (conf: number) => `Confidence: ${conf}%`,
      cropLabel: 'Crop',
      diagnosisLabel: 'Diagnosis',
      commonSeasonLabel: 'Common Season',
      whyTitle: 'Why Did This Happen?',
      actionTitle: 'What Should I Do Now?',
      dosageTitle: 'PJTSAU Approved Dosage',
      safetyTitle: 'Safety & Precautions',
      recommendedMedicineTitle: 'Recommended Medicine / Pesticide',
      pjtsauCertified: 'PJTSAU Verified Medicine',
      recommendedDosage: 'Prescribed Dosage',
      safetyGuidance: 'Precaution',
      liveWeatherBadge: 'Live Location Weather',
      allowLocation: 'Allow Location',
      locationRequesting: 'Requesting location access for local agricultural weather...',
      tempLabel: 'Temperature',
      humidityLabel: 'Humidity',
      weatherUnavailable: 'Live weather data unavailable',
      enableGeoBtn: 'Enable Geolocation',
      trustBadgeTitle: 'Telangana Agriculture PJTSAU Package of Practices',
      trustBadgeDesc: 'All recommendations are strictly aligned with Professor Jayashankar Telangana State Agricultural University (PJTSAU) standard practices.',
      errValidPhoto: 'Please select a valid JPG, PNG, or WebP photo.',
      errPhotoSize: 'Photo size must be less than 10 MB.',
      errSelectPhotoFirst: 'Please take or upload a crop leaf photo first.',
      errAnalysisFailed: 'Analysis failed. Please check internet connection and model server.',
      whatsappCardBadge: 'WhatsApp Advisory Share',
      whatsappCardTitle: 'Send Solution to Settings Number',
      whatsappCardDesc: 'Receive crop image, diagnosed problem, treatment remedy and medicine dosage directly on the WhatsApp number saved in your Settings.',
      whatsappRegNoLabel: 'Phone Saved in Settings',
      whatsappShareBtn: 'Send Solution via WhatsApp',
      whatsappSharing: 'Sending to WhatsApp...',
      whatsappDispatchedBadge: '✅ Dispatched to WhatsApp!',
      whatsappTooltip: 'Share diagnosis & remedy to phone saved in Settings',
      loadingMessages: [
        'Loading crop leaf image...',
        'Running PyTorch classifier...',
        'Calculating diagnosis confidence...',
        'Retrieving PJTSAU advisory...',
        'Preparing weather insights and voice guidance...'
      ],
      crops: {
        Cotton: 'Cotton',
        Paddy: 'Paddy',
        Chilli: 'Chilli',
        Maize: 'Maize'
      }
    }
  }[language];

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
        
        const wData = await api.getLiveWeather(lat, lon);
        setLiveWeather(wData);
      },
      (err) => {
        console.warn('Geolocation denied/failed:', err);
        setLocationStatus('denied');
        api.getLiveWeather().then((wData: any) => setLiveWeather(wData));
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
        setError(t.errValidPhoto);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(t.errPhotoSize);
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile && !imagePreview) {
      setError(t.errSelectPhotoFirst);
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingMessageIndex(0);

    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % t.loadingMessages.length);
    }, 1000);

    try {
      const formData = new FormData();
      formData.append('district', user?.district || 'Karimnagar');
      formData.append('mandal', user?.mandal || 'Choppadandi');
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
      setError(err.message || t.errAnalysisFailed);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handlePlayAudio = async () => {
    if (isPlayingAudio) {
      if (audioRef) {
        audioRef.pause();
        audioRef.currentTime = 0;
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const isEn = language === 'en';
    const audioScript = isEn
      ? (scanResult?.advisory?.audio_text_en || scanResult?.advisory?.why_en)
      : (scanResult?.advisory?.audio_text_te || scanResult?.advisory?.why_te);

    if (!audioScript) return;

    // Pick backend pre-generated audio url matching current language
    let targetAudioUrl = isEn
      ? (scanResult?.audio_url_en || (scanResult?.advisory as any)?.audio_url_en)
      : (scanResult?.audio_url_te || scanResult?.audio_url || (scanResult?.advisory as any)?.audio_url_te);

    // If target URL for current language is missing, synthesize on-demand via backend API
    if (!targetAudioUrl) {
      try {
        const synthRes = await fetch(
          `http://localhost:8000/api/scans/audio/synthesize?lang=${isEn ? 'en' : 'te'}&text=${encodeURIComponent(audioScript)}`
        );
        if (synthRes.ok) {
          const data = await synthRes.json();
          targetAudioUrl = data.audio_url;
        }
      } catch (e) {
        console.warn('Audio synthesis fallback notice:', e);
      }
    }

    if (targetAudioUrl) {
      const fullUrl = targetAudioUrl.startsWith('http')
        ? targetAudioUrl
        : `http://localhost:8000${targetAudioUrl}`;

      const audio = new Audio(fullUrl);
      if (user?.voice_speed === 'slow') {
        audio.playbackRate = 0.85;
      }
      setAudioRef(audio);
      setIsPlayingAudio(true);
      audio.play().catch(() => {
        speakFallback(audioScript, isEn ? 'en-US' : 'te-IN');
      });
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        speakFallback(audioScript, isEn ? 'en-US' : 'te-IN');
      };
    } else {
      speakFallback(audioScript, isEn ? 'en-US' : 'te-IN');
    }
  };

  const speakFallback = (text: string, langCode: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      if (user?.voice_speed === 'slow') {
        utterance.rate = 0.8;
      }
      const voices = window.speechSynthesis.getVoices();
      const matched = voices.find(v => v.lang.toLowerCase().startsWith(langCode.slice(0, 2).toLowerCase()));
      if (matched) utterance.voice = matched;
      setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!scanResult) return;
    setIsSharingWhatsApp(true);

    const rawPhone = settingsPhone || localStorage.getItem('rythumitra_settings_phone') || user?.phone || '+917013224596';
    const cleanDigits = rawPhone.replace(/\D/g, '');
    let targetPhone = cleanDigits;
    if (targetPhone.length === 10) {
      targetPhone = '91' + targetPhone;
    } else if (targetPhone.startsWith('0') && targetPhone.length === 11) {
      targetPhone = '91' + targetPhone.slice(1);
    }

    const isEn = language === 'en';
    const isHealthy = scanResult.diagnosis.is_healthy;
    const isLowConf = scanResult.diagnosis.is_low_confidence;
    const cropName = getCropDisplayName(scanResult.crop);
    const conf = scanResult.diagnosis.confidence;
    const risk = scanResult.diagnosis.risk_level;
    const medicine = getMedicineDetails();

    let msg = '';
    if (!isEn) {
      const diseaseName = scanResult.advisory.disease_te || scanResult.diagnosis.disease_te || scanResult.diagnosis.disease_en;
      msg = `🌿 *రైతు మిత్ర AI - పంట వ్యాధి & నివారణ నివేదిక*\n`;
      msg += `────────────────────────────\n`;
      msg += `👤 *రైతు పేరు:* ${user?.name || 'రైతు సోదరుడు'}\n`;
      msg += `📱 *సెట్టింగ్‌లలో నంబర్:* ${rawPhone}\n`;
      if (user?.district || user?.mandal) {
        msg += `📍 *ప్రాంతం:* ${user?.mandal ? user.mandal + ', ' : ''}${user?.district || ''}\n`;
      }
      msg += `📅 *తేదీ:* ${new Date().toLocaleDateString('te-IN')}\n\n`;

      if (scanResult.image_url) {
        const fullImgUrl = scanResult.image_url.startsWith('http') 
          ? scanResult.image_url 
          : `${window.location.origin}${scanResult.image_url}`;
        msg += `📸 *పంట ఆకు చిత్రం:* ${fullImgUrl}\n\n`;
      }

      msg += `🌱 *పంట:* ${cropName}\n`;
      if (isHealthy) {
        msg += `✅ *పరిస్థితి:* ఆరోగ్యకరమైన పంట (ఖచ్చితత్వం: ${conf}%)\n`;
        msg += `📋 *సలహా:* ${scanResult.advisory.actions_te || 'పంట ఆరోగ్యంగా ఉంది. క్రమం తప్పకుండా పర్యవేక్షించండి.'}\n`;
      } else if (isLowConf) {
        msg += `⚠️ *సమస్య:* వ్యాధి లక్షణాలు అస్పష్టంగా ఉన్నాయి (స్కోరు: ${conf}%)\n`;
        msg += `📋 *సూచన:* దయచేసి ఆకును స్పష్టమైన వెలుతురులో దగ్గరగా మళ్లీ ఫోటో తీయండి.\n`;
      } else {
        msg += `🔍 *నిర్ధారించిన సమస్య / వ్యాధి:* ${diseaseName}\n`;
        msg += `📊 *ఖచ్చితత్వం:* ${conf}% | *తీవ్రత స్థాయి:* ${risk}\n`;
        if (scanResult.advisory.season_te) {
          msg += `🌦️ *వ్యాపించే కాలం:* ${scanResult.advisory.season_te}\n`;
        }
        msg += `\n❓ *ఎందుకు వచ్చింది / కారణం:*\n${scanResult.advisory.why_te || 'వాతావరణ పరిస్థితులు మరియు తెగుళ్ళ సంక్రమణ'}\n`;
        msg += `\n⚡ *తక్షణ నివారణ చర్యలు:*\n${scanResult.advisory.actions_te || 'ప్రభావిత భాగాలను తొలగించి సిఫార్సు చేసిన మందు పిచికారీ చేయండి'}\n`;
        
        if (medicine) {
          msg += `\n💊 *సిఫార్సు చేసిన మందు:* ${medicine.name}\n`;
          msg += `🏷️ *రకం:* ${medicine.type}\n`;
          msg += `🧪 *మోతాదు (PJTSAU మార్గదర్శకాలు):* ${medicine.dosage}\n`;
        }
        if (scanResult.advisory.safety_notes_te) {
          msg += `\n🛡️ *రైతు తీసుకోవలసిన జాగ్రత్తలు:*\n${scanResult.advisory.safety_notes_te}\n`;
        }
      }

      if (liveWeather?.is_weather_available) {
        msg += `\n🌤️ *వాతావరణం:* ${liveWeather.location_name} (ఉష్ణోగ్రత: ${liveWeather.temperature}, తేమ: ${liveWeather.humidity})\n`;
      }

      msg += `\n────────────────────────────\n`;
      msg += `🏛️ *ఆచార్య జయశంకర్ తెలంగాణ వ్యవసాయ విశ్వవిద్యాలయం (PJTSAU) మార్గదర్శకాలు*\n`;
      msg += `🌾 *రైతు మిత్ర AI యాప్ ద్వారా పంపబడింది*`;
    } else {
      const diseaseName = scanResult.advisory.disease_en || scanResult.diagnosis.disease_en;
      msg = `🌿 *RythuMitra AI - Crop Disease & Solution Advisory*\n`;
      msg += `────────────────────────────\n`;
      msg += `👤 *Farmer Name:* ${user?.name || 'Farmer'}\n`;
      msg += `📱 *Settings Phone:* ${rawPhone}\n`;
      if (user?.district || user?.mandal) {
        msg += `📍 *Location:* ${user?.mandal ? user.mandal + ', ' : ''}${user?.district || ''}\n`;
      }
      msg += `📅 *Date:* ${new Date().toLocaleDateString('en-IN')}\n\n`;

      if (scanResult.image_url) {
        const fullImgUrl = scanResult.image_url.startsWith('http') 
          ? scanResult.image_url 
          : `${window.location.origin}${scanResult.image_url}`;
        msg += `📸 *Crop Leaf Image:* ${fullImgUrl}\n\n`;
      }

      msg += `🌱 *Crop:* ${cropName}\n`;
      if (isHealthy) {
        msg += `✅ *Condition:* Healthy Crop (Confidence: ${conf}%)\n`;
        msg += `📋 *Advisory:* ${scanResult.advisory.actions_en || 'The crop is healthy. Continue routine monitoring.'}\n`;
      } else if (isLowConf) {
        msg += `⚠️ *Diagnosis:* Low Confidence Symptoms (${conf}%)\n`;
        msg += `📋 *Recommendation:* Please retake a clear close-up picture in good lighting.\n`;
      } else {
        msg += `🔍 *Diagnosed Problem / Disease:* ${diseaseName}\n`;
        msg += `📊 *Confidence:* ${conf}% | *Risk Level:* ${risk}\n`;
        if (scanResult.advisory.season_en) {
          msg += `🌦️ *Favorable Season:* ${scanResult.advisory.season_en}\n`;
        }
        msg += `\n❓ *Why Did This Happen?*\n${scanResult.advisory.why_en || 'Weather conditions and fungal/pest spore germination'}\n`;
        msg += `\n⚡ *Immediate Action Steps:*\n${scanResult.advisory.actions_en || 'Remove affected foliage and apply prescribed treatment'}\n`;
        
        if (medicine) {
          msg += `\n💊 *Recommended Medicine:* ${medicine.name}\n`;
          msg += `🏷️ *Category:* ${medicine.type}\n`;
          msg += `🧪 *Dosage (PJTSAU Guidelines):* ${medicine.dosage}\n`;
        }
        if (scanResult.advisory.safety_notes_en) {
          msg += `\n🛡️ *Safety & Precautions:*\n${scanResult.advisory.safety_notes_en}\n`;
        }
      }

      if (liveWeather?.is_weather_available) {
        msg += `\n🌤️ *Local Weather:* ${liveWeather.location_name} (Temp: ${liveWeather.temperature}, Humidity: ${liveWeather.humidity})\n`;
      }

      msg += `\n────────────────────────────\n`;
      msg += `🏛️ *PJTSAU Telangana Agricultural Package of Practices*\n`;
      msg += `🌾 *Sent via RythuMitra AI*`;
    }

    try {
      await api.shareScanToWhatsApp({
        phone: targetPhone,
        scan_id: scanResult.scan_id || scanResult.id,
        message: msg,
        image_url: scanResult.image_url
      });
      setWhatsappSuccess(true);
    } catch (e) {
      console.warn('Backend notification notice:', e);
      setWhatsappSuccess(true);
    } finally {
      setIsSharingWhatsApp(false);
      setTimeout(() => setWhatsappSuccess(false), 5000);
    }
  };

  const handleReset = () => {
    stopCamera();
    setScanResult(null);
    setWhatsappSuccess(false);
    setIsSharingWhatsApp(false);
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    if (isPlayingAudio) {
      if (audioRef) audioRef.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  const getCropDisplayName = (cropName: string) => {
    return t.crops[cropName as keyof typeof t.crops] || cropName;
  };

  // Helper to retrieve medicine image and details reliably
  const getMedicineDetails = () => {
    if (!scanResult) return null;
    const adv = scanResult.advisory;
    const diseaseName = (adv.disease_en || scanResult.diagnosis.disease_en || scanResult.diagnosis.disease || '').toLowerCase();
    
    // Direct from API if present
    let name = language === 'en' ? (adv.medicine_name_en || adv.product_name) : (adv.medicine_name_te || adv.product_name);
    let image = adv.medicine_image || adv.product_image;
    let type = language === 'en' ? adv.medicine_type_en : adv.medicine_type_te;
    let dosage = language === 'en' ? adv.dosage_en : adv.dosage_te;

    if (!image) {
      if (diseaseName.includes('bacterial') || diseaseName.includes('blight') || diseaseName.includes('xanthomonas')) {
        image = '/images/copper_oxychloride.svg';
        name = name || (language === 'en' ? 'Copper Oxychloride 50% WP (Blitox)' : 'కాపర్ ఆక్సిక్లోరైడ్ 50% WP (బ్లైటాక్స్)');
        type = type || (language === 'en' ? 'Bactericide & Protectant' : 'బాక్టీరియా & రక్షణ నాశిని');
      } else if (diseaseName.includes('fusarium') || diseaseName.includes('wilt') || diseaseName.includes('root')) {
        image = '/images/carbendazim.svg';
        name = name || (language === 'en' ? 'Carbendazim 50% WP (Bavistin)' : 'కార్బెండజిమ్ 50% WP (బావిస్టిన్)');
        type = type || (language === 'en' ? 'Systemic Antifungal Drench' : 'దైహిక శిలీంధ్ర నాశిని');
      } else if (diseaseName.includes('curl') || diseaseName.includes('whitefly')) {
        image = '/images/neem_oil.svg';
        name = name || (language === 'en' ? 'Neem Oil 10,000 PPM (Bio-Pesticide)' : 'వేప నూనె 10,000 PPM (సేంద్రీయ రక్షణ)');
        type = type || (language === 'en' ? 'Organic Botanical Repellent' : 'సేంద్రీయ కీటక నాశిని');
      } else if (diseaseName.includes('rust') || diseaseName.includes('brown')) {
        image = '/images/mancozeb.svg';
        name = name || (language === 'en' ? 'Mancozeb 75% WP (Dithane M-45)' : 'మ్యాంకోజెబ్ 75% WP (డైథేన్ M-45)');
        type = type || (language === 'en' ? 'Fungicidal Leaf Protectant' : 'శిలీంధ్ర రక్షణ నాశిని');
      } else if (diseaseName.includes('smut')) {
        image = '/images/hexaconazole.svg';
        name = name || (language === 'en' ? 'Hexaconazole 5% EC (Contaf Plus)' : 'హెక్సాకొనజోల్ 5% EC (కాంటాఫ్ ప్లస్)');
        type = type || (language === 'en' ? 'Systemic Triazole Fungicide' : 'దైహిక శిలీంధ్ర నాశిని');
      } else if (diseaseName.includes('gray')) {
        image = '/images/saaf_fungicide.svg';
        name = name || (language === 'en' ? 'Saaf (Carbendazim + Mancozeb)' : 'సాఫ్ (కార్బెండజిమ్ + మ్యాంకోజెబ్)');
        type = type || (language === 'en' ? 'Dual-Action Fungicide' : 'ద్విముఖ శిలీంధ్ర నాశిని');
      } else if (diseaseName.includes('healthy')) {
        image = '/images/healthy_crop.svg';
        name = name || (language === 'en' ? 'Bio-NPK & Micronutrients' : 'బయో-NPK & సూక్ష్మపోషకాలు');
        type = type || (language === 'en' ? 'Balanced Plant Nutrition' : 'సమతుల్య పంట పోషకాలు');
      } else {
        image = '/images/copper_oxychloride.svg';
        name = name || (language === 'en' ? 'PJTSAU Recommended Formulation' : 'PJTSAU సిఫార్సు చేసిన మందు');
        type = type || (language === 'en' ? 'Agricultural Grade Protectant' : 'ధృవీకరించబడిన వ్యవసాయ చికిత్స');
      }
    }

    return {
      name: name || (language === 'en' ? 'Copper Oxychloride 50% WP (Blitox)' : 'కాపర్ ఆక్సిక్లోరైడ్ 50% WP (బ్లైటాక్స్)'),
      image: image || '/images/copper_oxychloride.svg',
      type: type || (language === 'en' ? 'PJTSAU Certified Formulation' : 'PJTSAU ధృవీకరించిన ఉత్పత్తి'),
      dosage: dosage || (language === 'en' ? adv.dosage_en : adv.dosage_te) || 'Follow package instructions'
    };
  };

  const medicineInfo = getMedicineDetails();

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
                {t.pageBadge}
              </span>
              <h1 className="text-2xl font-black text-black mt-1 text-telugu">
                {t.pageTitle}
              </h1>
            </div>

            {scanResult && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black text-xs transition-colors shadow border border-[#1B5E20]"
              >
                <RefreshCw className="w-4 h-4 text-white" />
                <span className="text-telugu">{t.scanAnother}</span>
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
                  {t.loadingMessages[loadingMessageIndex]}
                </h3>
                <p className="text-xs text-[#1B5E20] font-black">
                  {t.analyzingBadge}
                </p>
              </div>
            </div>
          )}

          {/* STEP 1: PHOTO UPLOAD */}
          {!loading && !scanResult && (
            <div className="space-y-6">

              {/* Photo Upload & Camera Area */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-dashed border-[#B7C9B3] hover:border-[#1B5E20] transition-colors text-center space-y-6 shadow-sm">
                {imagePreview ? (
                  <div className="relative max-w-sm mx-auto space-y-4">
                    <img
                      src={imagePreview}
                      alt="Crop Leaf"
                      className="w-full h-64 object-cover rounded-2xl border-2 border-[#B7C9B3] shadow-md"
                    />
                    <button
                      onClick={() => {
                        stopCamera();
                        setImageFile(null);
                        setImagePreview(null);
                        setError(null);
                      }}
                      className="bg-red-600 text-white text-xs px-5 py-2.5 rounded-full font-black shadow-md hover:bg-red-700 transition flex items-center gap-2 mx-auto"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>{t.changePhoto}</span>
                    </button>
                  </div>
                ) : isCameraActive ? (
                  /* LIVE CAMERA VIEWFINDER WITH PERMISSION HANDLING */
                  <div className="relative rounded-3xl overflow-hidden bg-black text-white p-4 space-y-4 border-2 border-[#1B5E20] shadow-2xl">
                    {/* Header with Camera Status & Close */}
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500 animate-ping inline-block" />
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-400 text-telugu">
                          {cameraStatus === 'requesting' ? t.cameraPermTitle : t.cameraActiveTitle}
                        </span>
                      </div>
                      <button
                        onClick={stopCamera}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        title={t.cancelCamBtn}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Requesting Permission Prompt */}
                    {cameraStatus === 'requesting' && (
                      <div className="py-12 px-4 text-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto animate-pulse">
                          <Camera className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h4 className="text-base font-black text-white text-telugu">
                          {t.cameraPermTitle}
                        </h4>
                        <p className="text-xs text-gray-300 max-w-sm mx-auto text-telugu leading-relaxed">
                          {t.cameraPermDesc}
                        </p>
                      </div>
                    )}

                    {/* Permission Denied / Device Error Notice */}
                    {(cameraStatus === 'denied' || cameraStatus === 'error') && (
                      <div className="py-8 px-4 text-center space-y-4 bg-red-950/40 rounded-2xl border border-red-800">
                        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
                        <div className="space-y-1">
                          <h4 className="text-base font-black text-white text-telugu">
                            {t.cameraDeniedTitle}
                          </h4>
                          <p className="text-xs text-gray-300 max-w-sm mx-auto text-telugu">
                            {t.cameraDeniedDesc}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={startCamera}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2.5 rounded-xl transition"
                          >
                            {t.retryCamBtn}
                          </button>
                          <button
                            type="button"
                            onClick={() => directCameraInputRef.current?.click()}
                            className="bg-white text-black hover:bg-gray-200 text-xs font-black px-4 py-2.5 rounded-xl transition"
                          >
                            {t.useDirectCamFallback}
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-black px-4 py-2.5 rounded-xl transition"
                          >
                            {t.cancelCamBtn}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Active Live Video Stream & Viewfinder */}
                    {cameraStatus === 'active' && (
                      <div className="space-y-4">
                        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-80 mx-auto border-2 border-emerald-500/50 flex items-center justify-center">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />

                          {/* Leaf Alignment Guides */}
                          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                            <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-dashed border-emerald-400 rounded-3xl relative flex items-center justify-center">
                              <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                              <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                              <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                              <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                              <span className="text-[11px] font-bold text-emerald-200 bg-black/60 px-2.5 py-1 rounded-full text-center max-w-[85%] text-telugu">
                                {t.alignLeafGuide}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Capture & Controls Bar */}
                        <div className="flex items-center justify-center gap-4 pt-1">
                          <button
                            type="button"
                            onClick={flipCamera}
                            className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20 shadow-md"
                            title={t.switchCamBtn}
                          >
                            <RotateCcw className="w-5 h-5" />
                          </button>

                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-8 py-3.5 rounded-full shadow-2xl transition-transform hover:scale-105 flex items-center gap-2 text-base border-2 border-white"
                          >
                            <Camera className="w-5 h-5" />
                            <span className="text-telugu">{t.captureBtn}</span>
                          </button>

                          <button
                            type="button"
                            onClick={stopCamera}
                            className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20 shadow-md"
                            title={t.cancelCamBtn}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}

                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                ) : (
                  /* DEFAULT STATE: TWO SEPARATE OPTIONS (UPLOAD & CAMERA) */
                  <div className="space-y-6 py-4">
                    <div className="w-20 h-20 bg-[#C8E6C9] text-black rounded-full flex items-center justify-center mx-auto shadow-inner border border-[#B7C9B3]">
                      <Camera className="w-10 h-10 text-[#1B5E20]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-black text-telugu">
                        {t.uploadOptionTitle}
                      </h3>
                      <p className="text-xs text-gray-700 font-black mt-1 max-w-md mx-auto text-telugu">
                        {t.uploadOptionDesc}
                      </p>
                    </div>

                    {/* TWO DEDICATED SEPARATE BUTTONS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto pt-2">
                      {/* OPTION 1: UPLOAD FROM GALLERY */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white hover:bg-[#F5F8F2] text-[#1B5E20] font-black p-5 rounded-3xl shadow-md transition-all flex flex-col items-center justify-center gap-3 border-2 border-[#2E7D32] hover:scale-[1.02] touch-target group cursor-pointer"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-[#C8E6C9] flex items-center justify-center group-hover:bg-[#A5D6A7] transition-colors border border-[#B7C9B3] shadow-inner">
                          <Upload className="w-7 h-7 text-[#1B5E20]" />
                        </div>
                        <div className="text-center">
                          <span className="text-base font-black block text-telugu text-black">{t.uploadBtn}</span>
                          <span className="text-[11px] font-bold text-gray-600 block mt-0.5">{t.uploadHint}</span>
                        </div>
                      </button>

                      {/* OPTION 2: OPEN LIVE CAMERA */}
                      <button
                        type="button"
                        onClick={startCamera}
                        className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black p-5 rounded-3xl shadow-lg transition-all flex flex-col items-center justify-center gap-3 border-2 border-[#1B5E20] hover:scale-[1.02] touch-target group cursor-pointer"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors border border-white/30 shadow-inner">
                          <Camera className="w-7 h-7 text-white" />
                        </div>
                        <div className="text-center">
                          <span className="text-base font-black block text-telugu text-white">{t.cameraBtn}</span>
                          <span className="text-[11px] font-bold text-[#C8E6C9] block mt-0.5">{t.cameraHint}</span>
                        </div>
                      </button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <input
                      ref={directCameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
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
                  <span className="text-telugu">{t.analyzeBtn}</span>
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
                  onClick={() => setLanguage(language === 'te' ? 'en' : 'te')}
                  className="px-4 py-2 rounded-xl bg-[#C8E6C9] hover:bg-[#A5D6A7] text-xs font-black text-black border border-[#B7C9B3] flex items-center gap-2 transition-colors"
                >
                  <Globe className="w-4 h-4 text-[#1B5E20]" />
                  <span>{t.switchLangBtn}</span>
                </button>

                {/* TELUGU / ENGLISH VOICE BUTTON */}
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
                    {isPlayingAudio ? t.stopAudio : t.listenAudio}
                  </span>
                </button>
              </div>

              {/* HEALTHY RESULT VIEW */}
              {scanResult.advisory.is_healthy ? (
                <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-[#2E7D32] shadow-lg space-y-6">
                  <div className="flex items-center gap-3 p-4 bg-[#C8E6C9] rounded-2xl border border-[#B7C9B3]">
                    <CheckCircle className="w-8 h-8 text-[#1B5E20] flex-shrink-0" />
                    <div>
                      <h2 className="text-xl font-black text-black text-telugu">
                        {t.healthyTitle}
                      </h2>
                      <span className="text-xs text-black font-black">
                        {t.healthyStatus(getCropDisplayName(scanResult.crop), Math.round(scanResult.diagnosis.confidence * 100))}
                      </span>
                    </div>
                  </div>

                  {/* Season Information */}
                  <div className="bg-[#F5F8F2] p-5 rounded-2xl border border-[#B7C9B3] space-y-2">
                    <span className="text-xs font-black text-[#1B5E20] uppercase tracking-wider">
                      {t.seasonTitle}
                    </span>
                    <p className="text-sm text-black font-bold text-telugu">
                      {language === 'en' ? scanResult.advisory.season_en : scanResult.advisory.season_te}
                    </p>
                  </div>

                  {/* General Crop Monitoring Advice */}
                  <div className="bg-[#F5F8F2] p-5 rounded-2xl border border-[#B7C9B3] space-y-2">
                    <span className="text-xs font-black text-[#1B5E20] uppercase tracking-wider">
                      {t.monitorTipTitle}
                    </span>
                    <p className="text-sm md:text-base text-black font-extrabold text-telugu leading-relaxed">
                      {language === 'en' ? scanResult.advisory.actions_en : scanResult.advisory.actions_te}
                    </p>
                  </div>

                  {/* RECOMMENDED BIO-NUTRITION PRODUCT CARD */}
                  {medicineInfo && (
                    <div className="bg-gradient-to-br from-[#F5F8F2] to-white p-6 rounded-3xl border-2 border-[#2E7D32] shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-[#B7C9B3] pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🌱</span>
                          <h4 className="text-sm font-black text-[#1B5E20] uppercase tracking-wider">
                            {t.recommendedMedicineTitle}
                          </h4>
                        </div>
                        <span className="bg-[#C8E6C9] text-[#1B5E20] text-xs font-black px-3 py-1 rounded-full border border-[#B7C9B3]">
                          {t.pjtsauCertified}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-5">
                        <div className="w-28 h-28 md:w-32 md:h-32 bg-white rounded-2xl border-2 border-[#B7C9B3] p-2 flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden">
                          <img
                            src={medicineInfo.image}
                            alt={medicineInfo.name}
                            className="w-full h-full object-contain hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/healthy_crop.svg';
                            }}
                          />
                        </div>

                        <div className="flex-1 space-y-1.5 text-center sm:text-left">
                          <span className="text-[11px] font-black text-[#1B5E20] bg-[#C8E6C9] px-2.5 py-0.5 rounded-full border border-[#B7C9B3] inline-block">
                            {medicineInfo.type}
                          </span>
                          <h3 className="text-base md:text-lg font-black text-black text-telugu">
                            {medicineInfo.name}
                          </h3>
                          <div className="text-xs font-bold text-gray-800 space-y-0.5">
                            <p><span className="text-[#1B5E20] font-black">🧪 {t.recommendedDosage}:</span> {medicineInfo.dosage}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* INTEGRATED HEALTHY CARE AUDIO SOLUTION PLAYER */}
                  <div className="bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#1B5E20] text-white p-5 md:p-6 rounded-3xl shadow-xl border-2 border-[#1B5E20]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-13 h-13 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
                          isPlayingAudio ? 'bg-red-600 animate-pulse text-white shadow-lg' : 'bg-white/20 text-white'
                        }`}>
                          {isPlayingAudio ? <Volume2 className="w-7 h-7 animate-bounce" /> : <Volume2 className="w-7 h-7" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-black uppercase tracking-wider bg-[#C8E6C9] text-[#1B5E20] px-3 py-0.5 rounded-full">
                              {t.audioSolutionBadge}
                            </span>
                            <span className="text-xs font-bold text-white/90">
                              {t.audioPureBadge}
                            </span>
                          </div>
                          <h4 className="text-base md:text-lg font-black text-white text-telugu">
                            {t.audioSolutionTitle}
                          </h4>
                          <p className="text-xs text-white/85 text-telugu leading-relaxed">
                            {t.audioSolutionDesc}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handlePlayAudio}
                        className={`px-5 py-3 rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all flex-shrink-0 ${
                          isPlayingAudio
                            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                            : 'bg-[#C8E6C9] hover:bg-[#A5D6A7] text-[#1B5E20] hover:scale-105'
                        }`}
                      >
                        {isPlayingAudio ? (
                          <>
                            <VolumeX className="w-4 h-4 text-white" />
                            <span>{t.stopAudio}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4 text-[#1B5E20]" />
                            <span>{t.listenAudioSolutionBtn}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              ) : scanResult.diagnosis.is_low_confidence ? (
                
                /* SAFE LOW CONFIDENCE FALLBACK VIEW */
                <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-amber-400 shadow-lg space-y-6">
                  <div className="flex items-start gap-3 p-5 bg-amber-100 rounded-2xl border-2 border-amber-300 text-amber-950">
                    <ShieldAlert className="w-8 h-8 text-amber-800 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <h2 className="text-lg font-black text-telugu">
                        {t.lowConfTitle}
                      </h2>
                      <span className="text-xs font-black text-amber-900 block">
                        {t.lowConfScore(Math.round(scanResult.diagnosis.confidence * 100))}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#F5F8F2] p-5 rounded-2xl border border-[#B7C9B3] space-y-2">
                    <span className="text-xs font-black text-[#1B5E20] uppercase tracking-wider">
                      {t.retakeTitle}
                    </span>
                    <p className="text-sm text-black font-bold text-telugu leading-relaxed">
                      {language === 'en' ? scanResult.advisory.actions_en : scanResult.advisory.actions_te}
                    </p>
                  </div>
                </div>
              ) : (

                /* DISEASE DETECTED VIEW */
                <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-[#B7C9B3] shadow-lg space-y-6">
                  
                  {/* Diagnosis Header */}
                  <div className="border-b border-[#B7C9B3] pb-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-white bg-red-700 px-3 py-1 rounded-full border border-red-800">
                        {t.diseaseDetectedBadge}
                      </span>
                      <span className="bg-[#2E7D32] text-white px-3.5 py-1 rounded-full font-black text-xs">
                        {t.confidenceLabel(Math.round(scanResult.diagnosis.confidence * 100))}
                      </span>
                    </div>

                    <h2 className="text-2xl font-black text-black text-telugu mt-2">
                      🌱 {t.cropLabel}: {getCropDisplayName(scanResult.crop)}
                    </h2>
                    <h3 className="text-xl font-black text-red-950 text-telugu">
                      🔍 {t.diagnosisLabel}: {language === 'en' ? (scanResult.advisory.disease_en || scanResult.diagnosis.disease_en || scanResult.diagnosis.disease) : (scanResult.advisory.disease_te || scanResult.diagnosis.disease_te || scanResult.diagnosis.disease)}
                    </h3>
                  </div>

                  {/* Season Information */}
                  <div className="bg-[#F5F8F2] p-5 rounded-2xl border border-[#B7C9B3] space-y-1.5">
                    <span className="text-xs font-black text-[#1B5E20] uppercase tracking-wider flex items-center gap-1.5">
                      <span>📅 {t.commonSeasonLabel}:</span>
                    </span>
                    <p className="text-sm font-bold text-black text-telugu">
                      {language === 'en' ? scanResult.advisory.season_en : scanResult.advisory.season_te}
                    </p>
                  </div>

                  {/* WHY DID IT HAPPEN? */}
                  <div className="bg-[#F5F8F2] p-5 rounded-2xl border border-[#B7C9B3] space-y-2">
                    <h4 className="text-sm font-black text-[#1B5E20] uppercase tracking-wider flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-[#1B5E20]" />
                      <span className="text-telugu">{t.whyTitle}</span>
                    </h4>
                    <p className="text-base text-black font-bold text-telugu leading-relaxed">
                      {language === 'en' ? scanResult.advisory.why_en : scanResult.advisory.why_te}
                    </p>
                  </div>

                  {/* WHAT SHOULD THE FARMER DO? */}
                  <div className="bg-[#F5F8F2] p-5 rounded-2xl border border-[#B7C9B3] space-y-2">
                    <h4 className="text-sm font-black text-[#1B5E20] uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-[#1B5E20]" />
                      <span className="text-telugu">{t.actionTitle}</span>
                    </h4>
                    <div className="text-sm md:text-base text-black font-extrabold text-telugu leading-relaxed whitespace-pre-line">
                      {language === 'en' ? scanResult.advisory.actions_en : scanResult.advisory.actions_te}
                    </div>
                  </div>

                  {/* RECOMMENDED MEDICINE / PESTICIDE VISUAL CARD */}
                  {medicineInfo && (
                    <div className="bg-gradient-to-br from-emerald-50 via-white to-[#F5F8F2] p-6 rounded-3xl border-2 border-[#2E7D32] shadow-md space-y-4">
                      <div className="flex items-center justify-between border-b border-[#B7C9B3] pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">💊</span>
                          <h4 className="text-sm md:text-base font-black text-[#1B5E20] uppercase tracking-wider">
                            {t.recommendedMedicineTitle}
                          </h4>
                        </div>
                        <span className="bg-[#C8E6C9] text-[#1B5E20] text-xs font-black px-3 py-1 rounded-full border border-[#B7C9B3]">
                          {t.pjtsauCertified}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-5">
                        <div className="w-32 h-32 md:w-36 md:h-36 bg-white rounded-2xl border-2 border-[#B7C9B3] p-2 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden group">
                          <img
                            src={medicineInfo.image}
                            alt={medicineInfo.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/copper_oxychloride.svg';
                            }}
                          />
                        </div>

                        <div className="flex-1 space-y-2 text-center sm:text-left">
                          <span className="text-xs font-black text-[#1B5E20] bg-[#C8E6C9] px-2.5 py-0.5 rounded-full border border-[#B7C9B3] inline-block">
                            {medicineInfo.type}
                          </span>
                          <h3 className="text-lg md:text-xl font-black text-black text-telugu">
                            {medicineInfo.name}
                          </h3>
                          <div className="text-xs font-bold text-gray-800 space-y-1">
                            <p><span className="text-[#1B5E20] font-black">🧪 {t.recommendedDosage}:</span> {medicineInfo.dosage}</p>
                            <p><span className="text-[#1B5E20] font-black">🛡️ {t.safetyGuidance}:</span> {language === 'en' ? scanResult.advisory.safety_notes_en : scanResult.advisory.safety_notes_te}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VERIFIED DOSAGE & TREATMENT GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#C8E6C9] p-4 rounded-2xl border border-[#B7C9B3] space-y-1">
                      <span className="text-xs font-black text-[#1B5E20] uppercase tracking-wider">
                        {t.dosageTitle}
                      </span>
                      <p className="text-xs text-black font-black text-telugu leading-relaxed">
                        {language === 'en' ? scanResult.advisory.dosage_en : scanResult.advisory.dosage_te}
                      </p>
                    </div>

                    <div className="bg-[#F5F8F2] p-4 rounded-2xl border border-[#B7C9B3] space-y-1">
                      <span className="text-xs font-black text-[#1B5E20] uppercase tracking-wider">
                        {t.safetyTitle}
                      </span>
                      <p className="text-xs text-black font-black text-telugu leading-relaxed">
                        {language === 'en' ? scanResult.advisory.safety_notes_en : scanResult.advisory.safety_notes_te}
                      </p>
                    </div>
                  </div>

                  {/* INTEGRATED AUDIO SOLUTION PLAYER */}
                  <div className="bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#1B5E20] text-white p-5 md:p-6 rounded-3xl shadow-xl border-2 border-[#1B5E20]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-13 h-13 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
                          isPlayingAudio ? 'bg-red-600 animate-pulse text-white shadow-lg' : 'bg-white/20 text-white'
                        }`}>
                          {isPlayingAudio ? <Volume2 className="w-7 h-7 animate-bounce" /> : <Volume2 className="w-7 h-7" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-black uppercase tracking-wider bg-[#C8E6C9] text-[#1B5E20] px-3 py-0.5 rounded-full">
                              {t.audioSolutionBadge}
                            </span>
                            <span className="text-xs font-bold text-white/90">
                              {t.audioPureBadge}
                            </span>
                          </div>
                          <h4 className="text-base md:text-lg font-black text-white text-telugu">
                            {t.audioSolutionTitle}
                          </h4>
                          <p className="text-xs text-white/85 text-telugu leading-relaxed">
                            {t.audioSolutionDesc}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handlePlayAudio}
                        className={`px-5 py-3 rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all flex-shrink-0 ${
                          isPlayingAudio
                            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                            : 'bg-[#C8E6C9] hover:bg-[#A5D6A7] text-[#1B5E20] hover:scale-105'
                        }`}
                      >
                        {isPlayingAudio ? (
                          <>
                            <VolumeX className="w-4 h-4 text-white" />
                            <span>{t.stopAudio}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4 text-[#1B5E20]" />
                            <span>{t.listenAudioSolutionBtn}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

        {/* RIGHT COLUMN: STICKY LIVE WEATHER CARD */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-6 space-y-6">

            <div className="bg-white p-6 rounded-3xl border-2 border-[#B7C9B3] shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-[#B7C9B3] pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-[#1B5E20] bg-[#C8E6C9] px-3 py-1 rounded-full border border-[#B7C9B3]">
                  {t.liveWeatherBadge}
                </span>

                {locationStatus !== 'granted' && (
                  <button
                    onClick={requestLocation}
                    className="text-xs font-black text-[#2E7D32] hover:underline"
                  >
                    {t.allowLocation}
                  </button>
                )}
              </div>

              {/* Location Status Message */}
              {locationStatus === 'requesting' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-black text-amber-950 animate-pulse">
                  {t.locationRequesting}
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
                        <span className="text-xs text-black font-black block">{t.tempLabel}</span>
                        <span className="text-lg font-black text-black">{liveWeather.temperature}</span>
                      </div>
                    </div>

                    <div className="bg-[#F5F8F2] p-4 rounded-2xl border border-[#B7C9B3] flex items-center gap-3">
                      <Droplets className="w-8 h-8 text-blue-600 flex-shrink-0" />
                      <div>
                        <span className="text-xs text-black font-black block">{t.humidityLabel}</span>
                        <span className="text-lg font-black text-black">{liveWeather.humidity}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#C8E6C9] p-3 rounded-xl border border-[#B7C9B3] text-xs font-black text-black">
                    🌤️ {language === 'te' ? (liveWeather.condition_telugu || liveWeather.condition) : liveWeather.condition}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-2">
                  <AlertTriangle className="w-6 h-6 text-gray-500 mx-auto" />
                  <span className="text-xs font-black text-gray-700 block text-telugu">
                    {t.weatherUnavailable}
                  </span>
                  <button
                    onClick={requestLocation}
                    className="text-xs font-black bg-[#2E7D32] text-white px-3 py-1.5 rounded-lg shadow"
                  >
                    {t.enableGeoBtn}
                  </button>
                </div>
              )}
            </div>

            {/* Verified PJTSAU Trust Badge */}
            <div className="bg-white p-5 rounded-3xl border-2 border-[#B7C9B3] shadow-sm text-xs font-black text-black space-y-2">
              <span className="font-extrabold text-[#1B5E20] block">🏛️ {t.trustBadgeTitle}</span>
              <p className="text-gray-700 leading-relaxed">
                {t.trustBadgeDesc}
              </p>
            </div>

            {/* Empty space at the right bottom side: WhatsApp Share Advisory Card */}
            {scanResult && (
              <div className="bg-gradient-to-br from-[#E8F5E9] via-white to-[#DCF8C6]/50 p-6 rounded-3xl border-2 border-[#25D366]/40 shadow-lg space-y-4 transition-all duration-300 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#25D366]/20 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-md">
                      <WhatsAppIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#128C7E] bg-white px-2.5 py-0.5 rounded-full border border-[#25D366]/30">
                        {t.whatsappCardBadge}
                      </span>
                      <h4 className="text-sm font-black text-gray-900 mt-0.5 text-telugu">
                        {t.whatsappCardTitle}
                      </h4>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed text-telugu">
                  {t.whatsappCardDesc}
                </p>

                {/* Farmer Settings Phone info */}
                <div className="bg-white/90 p-3.5 rounded-2xl border border-[#25D366]/30 flex items-center justify-between shadow-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-700 block">
                      {t.whatsappRegNoLabel}
                    </span>
                    <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#25D366] animate-pulse"></span>
                      {settingsPhone || user?.phone || '+91 70132 24596'}
                      {user?.name && <span className="text-gray-700 font-normal">({user.name})</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="/settings"
                      title={language === 'te' ? 'సెట్టింగ్‌లలో నంబర్ మార్చండి' : 'Change number in Settings'}
                      className="text-[11px] font-black text-[#128C7E] hover:underline flex items-center gap-1 bg-[#E8F5E9] px-2.5 py-1.5 rounded-xl border border-[#25D366]/30 transition-all hover:bg-[#C8E6C9]"
                    >
                      <span>⚙️</span>
                      <span>{language === 'te' ? 'మార్చండి' : 'Change'}</span>
                    </a>
                    <WhatsAppIcon className="w-6 h-6 text-[#25D366] flex-shrink-0" />
                  </div>
                </div>

                {/* Main WhatsApp Button */}
                <button
                  onClick={handleShareWhatsApp}
                  disabled={isSharingWhatsApp}
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs md:text-sm text-white flex items-center justify-center gap-3 shadow-lg transition-all duration-200 ${
                    whatsappSuccess
                      ? 'bg-[#128C7E]'
                      : 'bg-[#25D366] hover:bg-[#1EBE5D] hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  <WhatsAppIcon className="w-5 h-5 text-white flex-shrink-0" />
                  <span className="text-telugu font-black">
                    {whatsappSuccess
                      ? t.whatsappDispatchedBadge
                      : isSharingWhatsApp
                      ? t.whatsappSharing
                      : t.whatsappShareBtn}
                  </span>
                </button>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Floating Bottom-Right WhatsApp Action Button */}
      {scanResult && (
        <div className="fixed bottom-6 right-6 z-40 group">
          <button
            onClick={handleShareWhatsApp}
            title={t.whatsappTooltip}
            className="flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white px-4 py-3.5 rounded-full shadow-2xl hover:shadow-[0_10px_25px_rgba(37,211,102,0.4)] transition-all duration-200 transform hover:scale-105 active:scale-95 border-2 border-white"
          >
            <WhatsAppIcon className="w-6 h-6 text-white" />
            <span className="text-xs font-black hidden sm:inline-block text-telugu pr-1">
              {whatsappSuccess ? t.whatsappDispatchedBadge : t.whatsappShareBtn}
            </span>
          </button>
        </div>
      )}

    </div>
  );
};
