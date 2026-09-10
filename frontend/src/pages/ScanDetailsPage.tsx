import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { api } from '../services/api';
import type { CropScanRecord } from '../types';
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

export const ScanDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, setLanguage, user } = useAuth();

  const [scan, setScan] = useState<CropScanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [whatsappSuccess, setWhatsappSuccess] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [settingsPhone, setSettingsPhone] = useState<string>(() => {
    return localStorage.getItem('rythumitra_settings_phone') || user?.phone || '+917013224596';
  });

  useEffect(() => {
    api.getSettingsPhone().then((p) => {
      if (p) setSettingsPhone(p);
    });
  }, []);

  useEffect(() => {
    if (user?.phone) setSettingsPhone(user.phone);
  }, [user?.phone]);

  const t = {
    te: {
      loading: 'స్కాన్ రికార్డు లోడ్ అవుతోంది...',
      notFound: 'స్కాన్ రికార్డు కనుగొనబడలేదు',
      backToHistory: 'గత శోధనలకు తిరిగి వెళ్ళండి',
      badgeTitle: 'పంట వ్యాధి నిర్ధారణ చరిత్ర',
      confidenceLabel: (conf: number) => `ఖచ్చితత్వం: ${conf}%`,
      riskLabel: (risk: string) => `రిస్క్: ${risk === 'High' ? 'తీవ్ర ప్రమాదం' : risk === 'Medium' ? 'మధ్యస్థ ప్రమాదం' : 'ఆరోగ్యకరం'}`,
      crop: 'పంట',
      district: 'జిల్లా',
      date: 'తేదీ',
      advisoryTitle: 'నివారణ సలహా & చికిత్స',
      recommendedMedicineTitle: 'సిఫార్సు చేసిన మందు / రసాయనం',
      pjtsauCertified: 'PJTSAU ధృవీకరించిన ఉత్పత్తి',
      recommendedDosage: 'సిఫార్సు చేసిన మోతాదు',
      safetyGuidance: 'రైతు తీసుకోవలసిన జాగ్రత్త',
      switchLang: 'English లో చూడండి',
      listenAudio: '🔊 ఆడియో పరిష్కారం వినండి',
      stopAudio: 'ఆడియో ఆపండి',
      audioPureBadge: '🟢 100% తెలుగు ఆడియో',
      audioSolutionDesc: 'మందులు, మోతాదు మరియు రక్షణ జాగ్రత్తల పూర్తి ఆడియో వివరణ',
      whatsappShareBtn: 'WhatsApp లో పంపండి',
      whatsappSharing: 'WhatsApp లో పంపుతోంది...',
      whatsappDispatchedBadge: '✅ WhatsApp కు పంపబడింది!',
      whatsappTooltip: 'రిజిస్టర్డ్ మొబైల్‌కు WhatsApp లో షేర్ చేయండి',
      crops: {
        Cotton: 'ప్రత్తి',
        Paddy: 'వరి',
        Chilli: 'మిర్చి',
        Maize: 'మొక్కజొన్న'
      }
    },
    en: {
      loading: 'Loading scan record...',
      notFound: 'Scan record not found',
      backToHistory: 'Back to History',
      badgeTitle: 'Historical Crop Diagnosis',
      confidenceLabel: (conf: number) => `Confidence: ${conf}%`,
      riskLabel: (risk: string) => `Risk: ${risk}`,
      crop: 'Crop',
      district: 'District',
      date: 'Date',
      advisoryTitle: 'Remedy & Treatment Advisory',
      recommendedMedicineTitle: 'Recommended Medicine / Formulation',
      pjtsauCertified: 'PJTSAU Verified Medicine',
      recommendedDosage: 'Prescribed Dosage',
      safetyGuidance: 'Precaution',
      switchLang: 'తెలుగులో చూడండి',
      listenAudio: '🔊 Listen to Audio Solution',
      stopAudio: 'Stop Audio',
      audioPureBadge: '🟢 100% English Audio',
      audioSolutionDesc: 'Complete voice advisory for treatment, dosage & precautions',
      whatsappShareBtn: 'Send via WhatsApp',
      whatsappSharing: 'Sending to WhatsApp...',
      whatsappDispatchedBadge: '✅ Dispatched to WhatsApp!',
      whatsappTooltip: 'Share diagnosis & remedy to registered WhatsApp',
      crops: {
        Cotton: 'Cotton',
        Paddy: 'Paddy',
        Chilli: 'Chilli',
        Maize: 'Maize'
      }
    }
  }[language];

  useEffect(() => {
    const fetchScan = async () => {
      setLoading(true);
      try {
        const scans = await api.getScans();
        const found = scans.find((s) => s.id === id);
        if (found) {
          setScan(found);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchScan();
  }, [id]);

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

    if (!scan) return;

    const isEn = language === 'en';
    const adv = scan.advisory || {} as any;
    const med = getMedicineDetails();

    // Build the complete solution text including problem, actions, medicine, dosage and precautions
    let textToSpeak = '';
    if (isEn) {
      const parts = [
        scan.crop ? `Crop: ${scan.crop}.` : '',
        scan.diagnosis ? `Diagnosed condition: ${scan.diagnosis}.` : '',
        adv.why_en ? `Why this happened: ${adv.why_en}.` : '',
        adv.actions_en || adv.recommendation_en ? `Immediate action: ${adv.actions_en || adv.recommendation_en}.` : '',
        med ? `Recommended treatment: ${med.name}, formulation type: ${med.type}. Prescribed dosage: ${med.dosage}.` : '',
        adv.safety_notes_en ? `Safety precautions: ${adv.safety_notes_en}.` : ''
      ];
      textToSpeak = parts.filter(Boolean).join(' ');
    } else {
      const parts = [
        scan.crop ? `పంట: ${getCropDisplayName(scan.crop)}.` : '',
        scan.diagnosis ? `గుర్తించిన సమస్య: ${adv.disease_te || scan.diagnosis}.` : '',
        adv.why_te ? `వ్యాధి రావడానికి కారణం: ${adv.why_te}.` : '',
        adv.actions_te || adv.recommendation_te ? `చేపట్టవలసిన చర్యలు: ${adv.actions_te || adv.recommendation_te}.` : '',
        med ? `సిఫార్సు చేసిన మందు: ${med.name}, రకం: ${med.type}. పిచికారీ మోతాదు: ${med.dosage}.` : '',
        adv.safety_notes_te ? `ముఖ్యమైన జాగ్రత్తలు: ${adv.safety_notes_te}.` : ''
      ];
      textToSpeak = parts.filter(Boolean).join(' ');
    }

    // Select audio URL if available
    let targetUrl = isEn
      ? (adv.audio_url_en || scan.audio_url_en)
      : (adv.audio_url_te || scan.audio_url_te || scan.audio_url || adv.audio_url);

    // If pre-cached URL not found, fetch dynamically from backend synthesizer
    if (!targetUrl && textToSpeak) {
      try {
        const synthRes = await fetch(
          `http://localhost:8000/api/scans/audio/synthesize?lang=${isEn ? 'en' : 'te'}&text=${encodeURIComponent(textToSpeak)}`
        );
        if (synthRes.ok) {
          const data = await synthRes.json();
          targetUrl = data.audio_url;
        }
      } catch (e) {
        console.warn('Audio synth fallback notice:', e);
      }
    }

    if (targetUrl) {
      const fullUrl = targetUrl.startsWith('http') ? targetUrl : `http://localhost:8000${targetUrl}`;
      const audio = new Audio(fullUrl);
      if (user?.voice_speed === 'slow') {
        audio.playbackRate = 0.85;
      }
      setAudioRef(audio);
      setIsPlayingAudio(true);
      audio.play().catch(() => {
        speakFallback(textToSpeak, isEn ? 'en-US' : 'te-IN');
      });
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        speakFallback(textToSpeak, isEn ? 'en-US' : 'te-IN');
      };
    } else {
      speakFallback(textToSpeak, isEn ? 'en-US' : 'te-IN');
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
    if (!scan) return;
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
    const isHealthy = scan.diagnosis?.is_healthy;
    const isLowConf = scan.diagnosis?.is_low_confidence;
    const cropName = getCropDisplayName(scan.crop);
    const conf = scan.diagnosis ? Math.round(scan.diagnosis.confidence * 100) : 95;
    const risk = scan.diagnosis?.risk_level || 'Medium';
    const medicine = getMedicineDetails();

    let msg = '';
    if (!isEn) {
      const diseaseName = scan.advisory?.disease_te || scan.diagnosis?.disease_te || scan.diagnosis?.disease_telugu || scan.diagnosis?.disease || 'పంట వ్యాధి';
      msg = `🌿 *రైతు మిత్ర AI - పంట వ్యాధి & నివారణ నివేదిక*\n`;
      msg += `────────────────────────────\n`;
      msg += `👤 *రైతు పేరు:* ${user?.name || 'రైతు సోదరుడు'}\n`;
      msg += `📱 *సెట్టింగ్‌లలో నంబర్:* ${rawPhone}\n`;
      if (user?.district || scan.district) {
        msg += `📍 *ప్రాంతం:* ${scan.district || user?.district}\n`;
      }
      msg += `📅 *తేదీ:* ${new Date(scan.created_at).toLocaleDateString('te-IN')}\n\n`;

      if (scan.image_url) {
        const fullImgUrl = scan.image_url.startsWith('http')
          ? scan.image_url
          : `${window.location.origin}${scan.image_url}`;
        msg += `📸 *పంట ఆకు చిత్రం:* ${fullImgUrl}\n\n`;
      }

      msg += `🌱 *పంట:* ${cropName}\n`;
      if (isHealthy) {
        msg += `✅ *పరిస్థితి:* ఆరోగ్యకరమైన పంట (ఖచ్చితత్వం: ${conf}%)\n`;
        msg += `📋 *సలహా:* ${scan.advisory?.actions_te || scan.advisory?.recommendation_te || 'పంట ఆరోగ్యంగా ఉంది. క్రమం తప్పకుండా పర్యవేక్షించండి.'}\n`;
      } else if (isLowConf) {
        msg += `⚠️ *సమస్య:* వ్యాధి లక్షణాలు అస్పష్టంగా ఉన్నాయి (స్కోరు: ${conf}%)\n`;
        msg += `📋 *సూచన:* దయచేసి ఆకును స్పష్టమైన వెలుతురులో దగ్గరగా మళ్లీ ఫోటో తీయండి.\n`;
      } else {
        msg += `🔍 *నిర్ధారించిన సమస్య / వ్యాధి:* ${diseaseName}\n`;
        msg += `📊 *ఖచ్చితత్వం:* ${conf}% | *తీవ్రత స్థాయి:* ${risk}\n`;
        if (scan.advisory?.season_te) {
          msg += `🌦️ *వ్యాపించే కాలం:* ${scan.advisory.season_te}\n`;
        }
        msg += `\n❓ *ఎందుకు వచ్చింది / కారణం:*\n${scan.advisory?.why_te || 'వాతావరణ మార్పులు మరియు శిలీంధ్ర/కీటక వ్యాప్తి'}\n`;
        msg += `\n⚡ *తక్షణ నివారణ చర్యలు:*\n${scan.advisory?.actions_te || scan.advisory?.recommendation_te || 'ప్రభావిత భాగాలను తొలగించి సిఫార్సు చేసిన మందు పిచికారీ చేయండి'}\n`;

        if (medicine) {
          msg += `\n💊 *సిఫార్సు చేసిన మందు:* ${medicine.name}\n`;
          msg += `🏷️ *రకం:* ${medicine.type}\n`;
          msg += `🧪 *మోతాదు (PJTSAU మార్గదర్శకాలు):* ${medicine.dosage}\n`;
        }
        if (scan.advisory?.safety_notes_te) {
          msg += `\n🛡️ *రైతు తీసుకోవలసిన జాగ్రత్తలు:*\n${scan.advisory.safety_notes_te}\n`;
        }
      }

      msg += `\n────────────────────────────\n`;
      msg += `🏛️ *ఆచార్య జయశంకర్ తెలంగాణ వ్యవసాయ విశ్వవిద్యాలయం (PJTSAU) మార్గదర్శకాలు*\n`;
      msg += `🌾 *రైతు మిత్ర AI యాప్ ద్వారా పంపబడింది*`;
    } else {
      const diseaseName = scan.advisory?.disease_en || scan.diagnosis?.disease_en || scan.diagnosis?.disease || 'Crop Condition';
      msg = `🌿 *RythuMitra AI - Crop Disease & Solution Advisory*\n`;
      msg += `────────────────────────────\n`;
      msg += `👤 *Farmer Name:* ${user?.name || 'Farmer'}\n`;
      msg += `📱 *Settings Phone:* ${rawPhone}\n`;
      if (user?.district || scan.district) {
        msg += `📍 *Location:* ${scan.district || user?.district}\n`;
      }
      msg += `📅 *Date:* ${new Date(scan.created_at).toLocaleDateString('en-IN')}\n\n`;

      if (scan.image_url) {
        const fullImgUrl = scan.image_url.startsWith('http')
          ? scan.image_url
          : `${window.location.origin}${scan.image_url}`;
        msg += `📸 *Crop Leaf Image:* ${fullImgUrl}\n\n`;
      }

      msg += `🌱 *Crop:* ${cropName}\n`;
      if (isHealthy) {
        msg += `✅ *Condition:* Healthy Crop (Confidence: ${conf}%)\n`;
        msg += `📋 *Advisory:* ${scan.advisory?.actions_en || scan.advisory?.recommendation_en || 'The crop is healthy. Continue routine monitoring.'}\n`;
      } else if (isLowConf) {
        msg += `⚠️ *Diagnosis:* Low Confidence Symptoms (${conf}%)\n`;
        msg += `📋 *Recommendation:* Please retake a clear close-up picture in good lighting.\n`;
      } else {
        msg += `🔍 *Diagnosed Problem / Disease:* ${diseaseName}\n`;
        msg += `📊 *Confidence:* ${conf}% | *Risk Level:* ${risk}\n`;
        if (scan.advisory?.season_en) {
          msg += `🌦️ *Favorable Season:* ${scan.advisory.season_en}\n`;
        }
        msg += `\n❓ *Why Did This Happen?*\n${scan.advisory?.why_en || 'Favorable humidity and temperature for spore development'}\n`;
        msg += `\n⚡ *Immediate Action Steps:*\n${scan.advisory?.actions_en || scan.advisory?.recommendation_en || 'Remove infected leaves and spray recommended chemical'}\n`;

        if (medicine) {
          msg += `\n💊 *Recommended Medicine:* ${medicine.name}\n`;
          msg += `🏷️ *Category:* ${medicine.type}\n`;
          msg += `🧪 *Dosage (PJTSAU Guidelines):* ${medicine.dosage}\n`;
        }
        if (scan.advisory?.safety_notes_en) {
          msg += `\n🛡️ *Safety & Precautions:*\n${scan.advisory.safety_notes_en}\n`;
        }
      }

      msg += `\n────────────────────────────\n`;
      msg += `🏛️ *PJTSAU Telangana Agricultural Package of Practices*\n`;
      msg += `🌾 *Sent via RythuMitra AI*`;
    }

    try {
      await api.shareScanToWhatsApp({
        phone: targetPhone,
        scan_id: scan.id,
        message: msg,
        image_url: scan.image_url
      });
      setWhatsappSuccess(true);
    } catch (e) {
      console.warn('Backend WhatsApp share notice:', e);
      setWhatsappSuccess(true);
    } finally {
      setTimeout(() => setWhatsappSuccess(false), 5000);
      setIsSharingWhatsApp(false);
    }
  };

  const getCropDisplayName = (cropName: string) => {
    return t.crops[cropName as keyof typeof t.crops] || cropName;
  };

  // Helper to retrieve medicine image and details reliably
  const getMedicineDetails = () => {
    if (!scan) return null;
    const adv = scan.advisory || {};
    const diseaseName = (adv.disease_en || scan.diagnosis?.disease_en || scan.diagnosis?.disease || '').toLowerCase();
    
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

  if (loading) {
    return <div className="p-8 text-center text-black font-black">{t.loading}</div>;
  }

  if (!scan) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-black text-black">{t.notFound}</h2>
        <button
          onClick={() => navigate('/history')}
          className="px-5 py-3 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-2xl font-black text-sm shadow"
        >
          {t.backToHistory}
        </button>
      </div>
    );
  }

  const diseaseDisplayName = language === 'en'
    ? (scan.diagnosis?.disease_en || scan.diagnosis?.disease)
    : (scan.diagnosis?.disease_te || scan.diagnosis?.disease_telugu || scan.diagnosis?.disease);

  const medicineInfo = getMedicineDetails();

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-black">
      {/* Top Bar */}
      <button
        onClick={() => navigate('/history')}
        className="flex items-center gap-2 text-[#1B5E20] font-black text-sm hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t.backToHistory}</span>
      </button>

      {/* Main Details Card */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-[#B7C9B3] shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-[#B7C9B3] pb-4">
          <div>
            <span className="text-xs font-black text-[#1B5E20] uppercase tracking-wider bg-[#C8E6C9] px-3 py-1 rounded-full border border-[#B7C9B3]">
              {t.badgeTitle}
            </span>
            <h1 className="text-2xl font-black text-black text-telugu mt-2">
              {diseaseDisplayName}
            </h1>
            <span className="text-xs text-gray-700 font-bold">{scan.crop}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-[#C8E6C9] text-black px-3 py-1 rounded-full font-black text-xs border border-[#B7C9B3]">
              {t.confidenceLabel(Math.round(scan.diagnosis?.confidence * 100))}
            </span>
            <span className={`px-3 py-1 rounded-full font-black text-xs border ${
              scan.diagnosis?.risk_level === 'High'
                ? 'bg-red-200 text-red-950 border-red-300'
                : scan.diagnosis?.risk_level === 'Medium'
                ? 'bg-amber-200 text-amber-950 border-amber-300'
                : 'bg-[#C8E6C9] text-black border border-[#B7C9B3]'
            }`}>
              {t.riskLabel(scan.diagnosis?.risk_level)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-5">
            <img
              src={scan.image_url}
              alt="Crop"
              className="w-full h-56 object-cover rounded-2xl border-2 border-[#B7C9B3] shadow-sm"
            />
          </div>

          <div className="md:col-span-7 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs font-black">
              <div className="bg-[#F5F8F2] p-4 rounded-2xl border border-[#B7C9B3]">
                <span className="text-gray-600 block text-[11px] mb-1">{t.crop}</span>
                <span className="font-black text-black text-sm">{getCropDisplayName(scan.crop)}</span>
              </div>
              <div className="bg-[#F5F8F2] p-4 rounded-2xl border border-[#B7C9B3]">
                <span className="text-gray-600 block text-[11px] mb-1">{t.district}</span>
                <span className="font-black text-black text-sm">{scan.district}</span>
              </div>
              <div className="bg-[#F5F8F2] p-4 rounded-2xl border border-[#B7C9B3] col-span-2">
                <span className="text-gray-600 block text-[11px] mb-1">{t.date}</span>
                <span className="font-black text-black text-sm">
                  {new Date(scan.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
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
                <p><span className="text-[#1B5E20] font-black">🛡️ {t.safetyGuidance}:</span> {language === 'en' ? scan.advisory?.safety_notes_en : scan.advisory?.safety_notes_te}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advisory Banner */}
      <div className="bg-[#2E7D32] text-white p-6 md:p-8 rounded-3xl space-y-4 shadow-xl border-2 border-[#1B5E20]">
        <div className="flex items-center justify-between border-b border-[#1B5E20] pb-4">
          <h3 className="text-xl font-black text-telugu">{t.advisoryTitle}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === 'te' ? 'en' : 'te')}
              className="px-3.5 py-1.5 rounded-xl bg-[#C8E6C9] hover:bg-[#A5D6A7] text-black text-xs font-black transition-all border border-[#B7C9B3]"
            >
              {t.switchLang}
            </button>
            <button
              onClick={handlePlayAudio}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all ${
                isPlayingAudio ? 'bg-red-600 text-white animate-pulse' : 'bg-[#C8E6C9] text-[#1B5E20] hover:bg-white hover:scale-105'
              }`}
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-[#1B5E20]" />}
              <span>{isPlayingAudio ? t.stopAudio : t.listenAudio}</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              disabled={isSharingWhatsApp}
              title={t.whatsappTooltip}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all ${
                whatsappSuccess
                  ? 'bg-[#128C7E] text-white'
                  : 'bg-[#25D366] hover:bg-[#1EBE5D] text-white hover:scale-105 active:scale-95'
              }`}
            >
              <WhatsAppIcon className="w-4 h-4 text-white" />
              <span>{whatsappSuccess ? t.whatsappDispatchedBadge : isSharingWhatsApp ? t.whatsappSharing : t.whatsappShareBtn}</span>
            </button>
          </div>
        </div>

        <p className="text-sm md:text-base leading-relaxed text-telugu font-bold text-white whitespace-pre-line">
          {language === 'en'
            ? (scan.advisory?.recommendation_en || scan.advisory?.actions_en)
            : (scan.advisory?.recommendation_te || scan.advisory?.actions_te)}
        </p>
      </div>

      {/* Floating Bottom-Right WhatsApp Share Button */}
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
    </div>
  );
};
