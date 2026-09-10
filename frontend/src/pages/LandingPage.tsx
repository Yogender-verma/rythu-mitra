import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Volume2, CloudSun, ShieldCheck, ArrowRight, CheckCircle2, Sparkles, Globe } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, language, setLanguage } = useAuth();
  const navigate = useNavigate();

  const handleStartScan = () => {
    if (isAuthenticated) {
      navigate('/scan');
    } else {
      navigate('/auth/signin');
    }
  };

  const t = {
    te: {
      langBtn: 'English',
      dashboardBtn: 'డ్యాష్‌బోర్డ్',
      signInBtn: 'లాగిన్',
      signUpBtn: 'రిజిస్టర్',
      heroBadge: 'తెలంగాణ రైతులకు ప్రత్యేక ఏఐ సేవలు',
      heroTitle: 'మీ ఏఐ వ్యవసాయ సహాయకుడు',
      heroTagline: 'పంట సమస్యలను తక్షణమే గుర్తించండి. సరైన సలహాను పొందండి. తెలుగులో వినండి.',
      heroDesc: 'మీ పంట ఆకు ఫోటో తీయండి, సమస్యను సులభంగా అర్థం చేసుకోండి మరియు వాతావరణ ఆధారిత నిపుణుల సలహాలు పొందండి.',
      startScanBtn: 'ఇప్పుడే పంటను స్కాన్ చేయండి',
      howItWorksBtn: 'ఇది ఎలా పనిచేస్తుందో చూడండి',
      freeDemo: '100% ఉచిత డెమో స్కాన్',
      voiceSupport: 'తెలుగు వాయిస్ ఆడియో సదుపాయం',
      sampleBadge: 'ఏఐ పంట వ్యాధి నిర్ధారణ',
      sampleConf: '92% నమ్మకం',
      sampleCropTitle: 'ప్రత్తి ఆకు ముడుత తెగులు',
      sampleCropDesc: 'తెల్ల ఈగ నివారణకు వేప నూనె 2 మి.లీ చొప్పున పిచికారీ చేయండి.',
      sampleAudioText: '🔊 తెలుగు ఆడియో అందుబాటులో ఉంది',
      howBadge: '4 సులభ దశలు',
      howTitle: 'రైతు మిత్ర ఏఐ ఎలా పనిచేస్తుంది',
      howSubtitle: 'నాలుగు సులభమైన దశల్లో మీ పంట సమస్యను గుర్తించి తెలుగులో సలహా పొందండి',
      step1Title: '1. 📷 పంట ఫోటో తీయండి',
      step1Desc: 'మీ ఫోన్ ద్వారా పంట ఆకు లేదా కాయను స్పష్టంగా ఫోటో తీసి అప్‌లోడ్ చేయండి.',
      step2Title: '2. 🤖 ఏఐ సమస్యను గుర్తిస్తుంది',
      step2Desc: 'మా డీప్ లెర్నింగ్ మోడల్ పంట తెగులు లేదా పురుగును క్షణాల్లో విశ్లేషిస్తుంది.',
      step3Title: '3. 🌦️ వాతావరణం & దశ పరిశీలన',
      step3Desc: 'మీ జిల్లా వాతావరణం మరియు పంట ఎదుగుదల దశ ఆధారంగా సలహా సరిచూడబడుతుంది.',
      step4Title: '4. 🔊 తెలుగు వాయిస్ సలహా',
      step4Desc: 'సరైన మందుల మోతాదును తెలుగు పాఠం మరియు స్పష్టమైన ఆడియో ద్వారా వినండి.',
      cropsBadge: 'తెలంగాణ పంటలు',
      cropsTitle: 'మద్దతు ఇచ్చే ప్రధాన పంటలు',
      cropsSubtitle: 'ప్రత్తి, వరి, మిర్చి మరియు మొక్కజొన్న పంటలపై ప్రత్యేకాధికారం',
      pipelineBadge: 'సమగ్ర వ్యవస్థ',
      pipelineTitle: 'పూర్తి వ్యవసాయ సలహా ప్రక్రియ',
      pipelineSubtitle: 'ఫోటో ఆధారిత గుర్తింపు నుండి స్పష్టమైన తెలుగు సలహా వరకు',
      pipelineSteps: ['📷 పంట ఫోటో', '🤖 ఏఐ గుర్తింపు', '🌦️ వాతావరణం + దశ', '📋 నివారణ చర్యలు', '🔊 తెలుగు వాయిస్'],
      voiceTitle: 'చదవడం మాత్రమే కాదు, వినగలిగే సలహా',
      voiceQuote: '"మీ పంటకు ఏమి సమస్య ఉందో తెలుసుకోండి. ఏం చేయాలో తెలుగులో వినండి."',
      voiceDesc: 'చదవడం కష్టంగా ఉన్న రైతు సోదరుల కోసం ప్రతి పంట నివారణ సలహాను స్పష్టమైన తెలుగు ఆడియో రూపంలో వినిపిస్తుంది.',
      voiceSampleTitle: 'తెలుగు సలహా వినండి',
      voiceSampleDesc: 'నమూనా వాయిస్ వినడానికి క్లిక్ చేయండి',
      weatherTitle: '🌦️ వాతావరణ అనుకూల సిఫార్సులు',
      weatherDesc: 'వర్షం కురిసే ముందు రసాయనాలు పిచికారీ చేస్తే మందు వృథా అవుతుంది. మా సిస్టమ్ నేరుగా మీ జిల్లా వాతావరణాన్ని బట్టి మందులు పిచికారీ చేయడానికి సరైన సమయాన్ని సూచిస్తుంది.',
      weatherTrust: 'PJTSAU (తెలంగాణ వ్యవసాయ విశ్వవిద్యాలయం) ప్రామాణిక నిబంధనల ఆధారంగా తయారు చేసిన సలహాలు.',
      footerTagline: 'తెలంగాణ చిన్నకారు రైతులకు తెలుగు వాయిస్ పంట సలహా వేదిక.',
      quickNavTitle: 'త్వరిత లింకులు',
      supportedCropsTitle: 'మద్దతు ఉన్న పంటలు',
      trustTitle: 'విశ్వసనీయత & భద్రత',
      trustDesc: 'ధృవీకరించబడిన వ్యవసాయ మార్గదర్శకాలు. తప్పు మోతాదులు లేని నమ్మకమైన సూచనలు.',
      copyright: '© 2026 రైతు మిత్ర ఏఐ. తెలంగాణ రైతుల కోసం రూపొందించబడింది.',
      cropsList: [
        { name: 'ప్రత్తి', icon: '🌿', desc: 'ఆకు ముడుత తెగులు, బాక్టీరియల్ బ్లైట్ గుర్తింపు' },
        { name: 'వరి', icon: '🌾', desc: 'అగ్గి తెగులు (బ్లాస్ట్), కాండం కుళ్లు రోగనిర్ధారణ' },
        { name: 'మిర్చి', icon: '🌶️', desc: 'బొబ్బర తెగులు, కాయ కుళ్లు నివారణ' },
        { name: 'మొక్కజొన్న', icon: '🌽', desc: 'టర్సికమ్ ఆకు ఎండు తెగులు, కత్తెర పురుగు నియంత్రణ' },
      ]
    },
    en: {
      langBtn: 'తెలుగు',
      dashboardBtn: 'Dashboard',
      signInBtn: 'Sign In',
      signUpBtn: 'Sign Up',
      heroBadge: 'AI Agritech Built for Telangana Farmers',
      heroTitle: 'Your AI Farming Assistant',
      heroTagline: 'Identify crop problems. Get the right advice. Hear it in Telugu.',
      heroDesc: 'Snap a leaf photo, diagnose crop diseases early, and receive weather-guided agricultural expert advice.',
      startScanBtn: 'Start Scanning Now',
      howItWorksBtn: 'Learn How It Works',
      freeDemo: '100% Free Demo Scan',
      voiceSupport: 'Telugu Voice Audio Support',
      sampleBadge: 'AI Crop Diagnosis',
      sampleConf: '92% Confidence',
      sampleCropTitle: 'Cotton Leaf Curl Virus',
      sampleCropDesc: 'Spray Neem Oil at 2ml/L to manage whiteflies and prevent secondary spread.',
      sampleAudioText: '🔊 Voice Audio Available',
      howBadge: 'Simple 4-Step Flow',
      howTitle: 'How RythuMitra AI Works',
      howSubtitle: 'Diagnose plant problems and receive verified Telugu advice in four simple steps',
      step1Title: '1. 📷 Take a Crop Photo',
      step1Desc: 'Snap and upload a clear photo of the affected leaf or crop using your smartphone.',
      step2Title: '2. 🤖 AI Identifies Problem',
      step2Desc: 'Our deep learning classifier pinpoints the crop disease or pest infestation in seconds.',
      step3Title: '3. 🌦️ Weather & Stage Checked',
      step3Desc: 'Recommendations are cross-referenced with your local live weather and crop growth stage.',
      step4Title: '4. 🔊 Advice in Telugu Voice',
      step4Desc: 'Listen to precise PJTSAU verified dosages in crystal-clear Telugu voice audio.',
      cropsBadge: 'Telangana Crops',
      cropsTitle: 'Supported Major Crops',
      cropsSubtitle: 'Specialized AI diagnosis for Cotton, Paddy, Chilli, and Maize crops',
      pipelineBadge: 'End-to-End System',
      pipelineTitle: 'Complete Agricultural Advisory Pipeline',
      pipelineSubtitle: 'From mobile photo upload to verified voice-guided treatment',
      pipelineSteps: ['📷 CROP PHOTO', '🤖 AI DIAGNOSIS', '🌦️ WEATHER + STAGE', '📋 ACTION ADVISORY', '🔊 TELUGU VOICE'],
      voiceTitle: 'Advice You Can Hear, Not Just Read',
      voiceQuote: '"Know what affects your crop. Hear exactly what to do in Telugu."',
      voiceDesc: 'Designed for accessibility—every advisory is narrated in authentic, clear Telugu audio for ease of understanding.',
      voiceSampleTitle: 'Listen to Telugu Advisory',
      voiceSampleDesc: 'Click to play sample Telugu advisory voice',
      weatherTitle: '🌦️ Weather-Aware Recommendations',
      weatherDesc: 'Spraying pesticides right before heavy rain wastes money. Our live weather integration ensures spray windows are timely and effective.',
      weatherTrust: 'All advisories follow official PJTSAU (Telangana Agricultural University) package of practices.',
      footerTagline: 'Telugu Voice Crop Advisory for Smallholder Farmers in Telangana. Built with React, Vite, Tailwind & FastAPI.',
      quickNavTitle: 'Quick Navigation',
      supportedCropsTitle: 'Supported Crops',
      trustTitle: 'Trust & Safety',
      trustDesc: 'Verified agricultural knowledge base engine. Zero hallucinated pesticide dosage.',
      copyright: '© 2026 RythuMitra AI. Built for Telangana Farmers.',
      cropsList: [
        { name: 'Cotton', icon: '🌿', desc: 'Leaf curl virus, bacterial blight detection' },
        { name: 'Paddy', icon: '🌾', desc: 'Rice blast, sheath blight diagnosis' },
        { name: 'Chilli', icon: '🌶️', desc: 'Leaf curl, fruit rot management' },
        { name: 'Maize', icon: '🌽', desc: 'Turcicum blight, armyworm control' },
      ]
    }
  }[language];

  return (
    <div className="min-h-screen bg-[#F5F8F2] text-black flex flex-col font-sans">
      
      {/* 1. LANDING PAGE NAVBAR / HEADER */}
      <header className="bg-[#2E7D32] text-black sticky top-0 z-50 border-b-2 border-[#B7C9B3] shadow-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Logo variant="green" size="md" />

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'te' ? 'en' : 'te')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#C8E6C9] hover:bg-[#A5D6A7] text-black border-2 border-[#B7C9B3] text-xs font-black transition-all touch-target shadow-sm"
              title={language === 'te' ? 'Switch to English' : 'తెలుగులోకి మార్చండి'}
            >
              <Globe className="w-4 h-4 text-black" />
              <span>{t.langBtn}</span>
            </button>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="bg-[#C8E6C9] hover:bg-[#A5D6A7] text-black font-black px-5 py-2.5 rounded-2xl transition-all shadow text-sm flex items-center gap-2 border-2 border-[#B7C9B3]"
              >
                <span>{t.dashboardBtn}</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </Link>
            ) : (
              <>
                <Link
                  to="/auth/signin"
                  className="bg-[#C8E6C9] hover:bg-[#A5D6A7] text-black font-black px-4 py-2.5 rounded-2xl text-sm transition-all border-2 border-[#B7C9B3]"
                >
                  {t.signInBtn}
                </Link>
                <Link
                  to="/auth/signup"
                  className="bg-[#C8E6C9] hover:bg-[#A5D6A7] text-black font-black px-4 py-2.5 rounded-2xl transition-all shadow text-sm border-2 border-[#B7C9B3]"
                >
                  {t.signUpBtn}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="bg-[#C8E6C9] border-b-2 border-[#B7C9B3] py-16 md:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          
          <div className="md:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2E7D32] text-white text-xs font-black shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-telugu">{t.heroBadge}</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-[#1B5E20]">
              {t.heroTitle}
            </h1>

            <p className="text-xl md:text-2xl text-black font-black leading-relaxed text-telugu max-w-2xl">
              {t.heroTagline}
            </p>
            <p className="text-sm md:text-base text-[#1B5E20] font-black leading-relaxed text-telugu">
              {t.heroDesc}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <button
                onClick={handleStartScan}
                className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black px-8 py-4 rounded-2xl shadow-xl text-base flex items-center justify-center gap-3 transition-all hover:scale-105 touch-target border border-[#1B5E20]"
              >
                <Camera className="w-6 h-6 text-white" />
                <span>{t.startScanBtn}</span>
              </button>

              <a
                href="#how-it-works"
                className="bg-white text-black hover:bg-[#F5F8F2] font-black px-6 py-4 rounded-2xl border-2 border-[#B7C9B3] text-center transition-all touch-target"
              >
                {t.howItWorksBtn}
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-black text-black">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#1B5E20]" />
                <span>{t.freeDemo}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#1B5E20]" />
                <span>{t.voiceSupport}</span>
              </div>
            </div>
          </div>

          {/* 3. HERO VISUAL */}
          <div className="md:col-span-5">
            <div className="relative">
              <div className="relative bg-white border-2 border-[#B7C9B3] rounded-3xl overflow-hidden shadow-2xl p-4 text-black">
                <img
                  src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=800&auto=format&fit=crop"
                  alt="Farmer examining crop field"
                  className="w-full h-64 md:h-80 object-cover rounded-2xl border border-[#B7C9B3]"
                />

                <div className="p-4 bg-[#F5F8F2] rounded-2xl mt-4 border-2 border-[#B7C9B3] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white bg-[#1B5E20] px-3 py-0.5 rounded-full">
                      {t.sampleBadge}
                    </span>
                    <span className="text-xs bg-[#C8E6C9] text-black px-2.5 py-0.5 rounded-full font-black border border-[#B7C9B3]">
                      {t.sampleConf}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-[#1B5E20] text-telugu">{t.sampleCropTitle}</h3>
                  <p className="text-xs text-black font-black text-telugu">
                    {t.sampleCropDesc}
                  </p>
                  <div className="pt-2 flex items-center justify-between border-t border-[#B7C9B3]">
                    <span className="text-xs text-[#1B5E20] font-black flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-[#1B5E20]" /> {t.sampleAudioText}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. "HOW IT WORKS" SECTION */}
      <section id="how-it-works" className="py-16 md:py-20 bg-white border-b-2 border-[#B7C9B3]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-white bg-[#1B5E20] px-3.5 py-1 rounded-full shadow-sm">
              {t.howBadge}
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-[#1B5E20]">{t.howTitle}</h2>
            <p className="text-black font-black text-telugu">{t.howSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#F5F8F2] p-6 rounded-3xl border-2 border-[#B7C9B3] hover:border-[#2E7D32] transition-all shadow-sm space-y-3">
              <div className="w-12 h-12 bg-[#2E7D32] text-white rounded-2xl flex items-center justify-center font-black text-xl shadow">
                1
              </div>
              <h3 className="text-lg font-black text-[#1B5E20]">{t.step1Title}</h3>
              <p className="text-black text-xs font-black leading-relaxed text-telugu">
                {t.step1Desc}
              </p>
            </div>

            <div className="bg-[#F5F8F2] p-6 rounded-3xl border-2 border-[#B7C9B3] hover:border-[#2E7D32] transition-all shadow-sm space-y-3">
              <div className="w-12 h-12 bg-[#2E7D32] text-white rounded-2xl flex items-center justify-center font-black text-xl shadow">
                2
              </div>
              <h3 className="text-lg font-black text-[#1B5E20]">{t.step2Title}</h3>
              <p className="text-black text-xs font-black leading-relaxed text-telugu">
                {t.step2Desc}
              </p>
            </div>

            <div className="bg-[#F5F8F2] p-6 rounded-3xl border-2 border-[#B7C9B3] hover:border-[#2E7D32] transition-all shadow-sm space-y-3">
              <div className="w-12 h-12 bg-[#2E7D32] text-white rounded-2xl flex items-center justify-center font-black text-xl shadow">
                3
              </div>
              <h3 className="text-lg font-black text-[#1B5E20]">{t.step3Title}</h3>
              <p className="text-black text-xs font-black leading-relaxed text-telugu">
                {t.step3Desc}
              </p>
            </div>

            <div className="bg-[#F5F8F2] p-6 rounded-3xl border-2 border-[#B7C9B3] hover:border-[#2E7D32] transition-all shadow-sm space-y-3">
              <div className="w-12 h-12 bg-[#2E7D32] text-white rounded-2xl flex items-center justify-center font-black text-xl shadow">
                4
              </div>
              <h3 className="text-lg font-black text-[#1B5E20]">{t.step4Title}</h3>
              <p className="text-black text-xs font-black leading-relaxed text-telugu">
                {t.step4Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SUPPORTED CROPS SECTION */}
      <section className="py-16 md:py-20 bg-[#C8E6C9] border-b-2 border-[#B7C9B3]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-white bg-[#1B5E20] px-3.5 py-1 rounded-full shadow-sm">
                {t.cropsBadge}
              </span>
              <h2 className="text-2xl md:text-4xl font-black text-[#1B5E20] mt-2">{t.cropsTitle}</h2>
            </div>
            <p className="text-black font-black text-sm mt-2 md:mt-0 text-telugu">{t.cropsSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.cropsList.map((crop) => (
              <div key={crop.name} className="bg-white p-6 rounded-3xl border-2 border-[#B7C9B3] shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{crop.icon}</div>
                <div className="flex items-baseline gap-2 mb-2">
                  <h3 className="text-xl font-black text-black">{crop.name}</h3>
                </div>
                <p className="text-black font-black text-xs leading-relaxed">{crop.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. AI ADVISORY PIPELINE SECTION */}
      <section className="py-16 bg-white border-b-2 border-[#B7C9B3]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-white bg-[#1B5E20] px-3.5 py-1 rounded-full shadow-sm">
              {t.pipelineBadge}
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-[#1B5E20]">{t.pipelineTitle}</h2>
            <p className="text-black font-black text-telugu">{t.pipelineSubtitle}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            {t.pipelineSteps.map((step, idx) => (
              <div key={idx} className="bg-[#F5F8F2] p-4 rounded-2xl border-2 border-[#B7C9B3]">
                <span className="text-xs font-black text-[#1B5E20] block">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. VOICE & WEATHER SECTION */}
      <section className="py-16 bg-[#C8E6C9] border-b-2 border-[#B7C9B3]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-[#2E7D32] text-white flex items-center justify-center font-black shadow">
              <Volume2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-black text-[#1B5E20]">{t.voiceTitle}</h2>
            <p className="text-black font-black text-lg leading-relaxed text-telugu">
              {t.voiceQuote}
            </p>
            <p className="text-black font-black text-xs leading-relaxed text-telugu">
              {t.voiceDesc}
            </p>
            <div className="bg-white p-4 rounded-2xl border-2 border-[#B7C9B3] flex items-center gap-4 shadow-sm">
              <button className="w-12 h-12 bg-[#2E7D32] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all">
                <Volume2 className="w-6 h-6 text-white" />
              </button>
              <div>
                <span className="text-xs font-black text-[#1B5E20] block text-telugu">{t.voiceSampleTitle}</span>
                <span className="text-xs font-black text-black">{t.voiceSampleDesc}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-[#2E7D32] text-white flex items-center justify-center font-black shadow">
              <CloudSun className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-black text-[#1B5E20]">{t.weatherTitle}</h2>
            <p className="text-black font-black text-xs leading-relaxed text-telugu">
              {t.weatherDesc}
            </p>
            <div className="bg-white p-4 rounded-2xl border-2 border-[#B7C9B3] flex items-center gap-3 shadow-sm">
              <ShieldCheck className="w-6 h-6 text-[#1B5E20] flex-shrink-0" />
              <span className="text-xs text-black font-black text-telugu">
                {t.weatherTrust}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-[#1B5E20] text-white mt-auto py-12 border-t-2 border-[#B7C9B3]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <Logo variant="green" size="md" />
            <p className="text-xs text-[#C8E6C9] font-black leading-relaxed">
              {t.footerTagline}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-black text-[#C8E6C9] uppercase tracking-wider mb-3">
              {t.quickNavTitle}
            </h4>
            <ul className="space-y-2 text-sm text-[#C8E6C9] font-black">
              <li><Link to="/auth/signin" className="hover:text-white">{t.signInBtn}</Link></li>
              <li><Link to="/auth/signup" className="hover:text-white">{t.signUpBtn}</Link></li>
              <li><Link to="/scan" className="hover:text-white">{language === 'te' ? 'పంట స్కాన్' : 'Scan Crop'}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black text-[#C8E6C9] uppercase tracking-wider mb-3">
              {t.supportedCropsTitle}
            </h4>
            <ul className="space-y-1 text-sm text-[#C8E6C9] font-black">
              {t.cropsList.map((c) => (
                <li key={c.name}>{c.name}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black text-[#C8E6C9] uppercase tracking-wider mb-3">
              {t.trustTitle}
            </h4>
            <p className="text-xs text-[#C8E6C9] font-black">
              {t.trustDesc}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 border-t border-[#2E7D32] flex flex-col sm:flex-row items-center justify-between text-xs text-[#C8E6C9] font-black">
          <span>{t.copyright}</span>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <Link to="/auth/signin" className="hover:text-white">{t.signInBtn}</Link>
            <span>•</span>
            <Link to="/auth/signup" className="hover:text-white">{t.signUpBtn}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
