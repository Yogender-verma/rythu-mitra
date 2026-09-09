import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Volume2, CloudSun, ShieldCheck, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleStartScan = () => {
    if (isAuthenticated) {
      navigate('/scan');
    } else {
      navigate('/auth/signin');
    }
  };

  const supportedCrops = [
    { name: 'Cotton', telugu: 'ప్రత్తి', icon: '🌿', desc: 'Leaf curl virus, bacterial blight detection' },
    { name: 'Paddy', telugu: 'వరి', icon: '🌾', desc: 'Rice blast, sheath blight diagnosis' },
    { name: 'Chilli', telugu: 'మిర్చి', icon: '🌶️', desc: 'Leaf curl, fruit rot management' },
    { name: 'Maize', telugu: 'మొక్కజొన్న', icon: '🌽', desc: 'Turcicum blight, armyworm control' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F8F2] text-black flex flex-col font-sans">
      
      {/* 1. LANDING PAGE NAVBAR / HEADER - Agricultural Green (#2E7D32) + Black Text */}
      <header className="bg-[#2E7D32] text-black sticky top-0 z-50 border-b-2 border-[#B7C9B3] shadow-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Logo variant="green" size="md" />

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="bg-[#C8E6C9] hover:bg-[#A5D6A7] text-black font-black px-5 py-2.5 rounded-2xl transition-all shadow text-sm flex items-center gap-2 border-2 border-[#B7C9B3]"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </Link>
            ) : (
              <>
                <Link
                  to="/auth/signin"
                  className="bg-[#C8E6C9] hover:bg-[#A5D6A7] text-black font-black px-4 py-2.5 rounded-2xl text-sm transition-all border-2 border-[#B7C9B3]"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth/signup"
                  className="bg-[#C8E6C9] hover:bg-[#A5D6A7] text-black font-black px-4 py-2.5 rounded-2xl transition-all shadow text-sm border-2 border-[#B7C9B3]"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION - Light Green (#C8E6C9) with Black & Dark Green Text */}
      <section className="bg-[#C8E6C9] border-b-2 border-[#B7C9B3] py-16 md:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          
          <div className="md:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2E7D32] text-white text-xs font-black shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-telugu">తెలంగాణ రైతులకు ప్రత్యేక ఏఐ సేవలు</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-[#1B5E20]">
              Your AI Farming Assistant
            </h1>

            <p className="text-xl md:text-2xl text-black font-black leading-relaxed text-telugu max-w-2xl">
              Identify crop problems. Get the right advice. Hear it in Telugu.
            </p>
            <p className="text-sm md:text-base text-[#1B5E20] font-black leading-relaxed text-telugu">
              మీ పంట ఫోటో తీయండి, సమస్యను సులభంగా అర్థం చేసుకోండి మరియు వాతావరణ ఆధారిత తెలుగు సలహాలు వినండి.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <button
                onClick={handleStartScan}
                className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black px-8 py-4 rounded-2xl shadow-xl text-base flex items-center justify-center gap-3 transition-all hover:scale-105 touch-target border border-[#1B5E20]"
              >
                <Camera className="w-6 h-6 text-white" />
                <span>Start Scanning Now</span>
              </button>

              <a
                href="#how-it-works"
                className="bg-white text-black hover:bg-[#F5F8F2] font-black px-6 py-4 rounded-2xl border-2 border-[#B7C9B3] text-center transition-all touch-target"
              >
                Learn How It Works
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-black text-black">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#1B5E20]" />
                <span>100% Free Demo Scan</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#1B5E20]" />
                <span>Telugu Voice Audio Support</span>
              </div>
            </div>
          </div>

          {/* 3. HERO VISUAL - Agricultural Farmer Visual Card */}
          <div className="md:col-span-5">
            <div className="relative">
              <div className="relative bg-white border-2 border-[#B7C9B3] rounded-3xl overflow-hidden shadow-2xl p-4 text-black">
                <img
                  src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=800&auto=format&fit=crop"
                  alt="Telangana Farmer examining cotton crop field"
                  className="w-full h-64 md:h-80 object-cover rounded-2xl border border-[#B7C9B3]"
                />

                <div className="p-4 bg-[#F5F8F2] rounded-2xl mt-4 border-2 border-[#B7C9B3] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white bg-[#1B5E20] px-3 py-0.5 rounded-full">AI Crop Diagnosis</span>
                    <span className="text-xs bg-[#C8E6C9] text-black px-2.5 py-0.5 rounded-full font-black border border-[#B7C9B3]">92% Confidence</span>
                  </div>
                  <h3 className="text-lg font-black text-[#1B5E20] text-telugu">ప్రత్తి ఆకు ముడుత తెగులు (Cotton Leaf Curl)</h3>
                  <p className="text-xs text-black font-black text-telugu">
                    తెల్ల ఈగ నివారణకు వేప నూనె 2 మి.లీ చొప్పున పిచికారీ చేయండి.
                  </p>
                  <div className="pt-2 flex items-center justify-between border-t border-[#B7C9B3]">
                    <span className="text-xs text-[#1B5E20] font-black flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-[#1B5E20]" /> 🔊 తెలుగు ఆడియో అందుబాటులో ఉంది
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. "HOW IT WORKS" SECTION - 4-Step Flow */}
      <section id="how-it-works" className="py-16 md:py-20 bg-white border-b-2 border-[#B7C9B3]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-white bg-[#1B5E20] px-3.5 py-1 rounded-full shadow-sm">Simple 4-Step Flow</span>
            <h2 className="text-2xl md:text-4xl font-black text-[#1B5E20]">How RythuMitra AI Works</h2>
            <p className="text-black font-black text-telugu">నాలుగు సులభమైన దశల్లో మీ పంట సమస్యను గుర్తించి తెలుగులో సలహా పొందండి</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#F5F8F2] p-6 rounded-3xl border-2 border-[#B7C9B3] hover:border-[#2E7D32] transition-all shadow-sm space-y-3">
              <div className="w-12 h-12 bg-[#2E7D32] text-white rounded-2xl flex items-center justify-center font-black text-xl shadow">
                1
              </div>
              <h3 className="text-lg font-black text-[#1B5E20]">1. 📷 Take a Crop Photo</h3>
              <p className="text-black text-xs font-black leading-relaxed text-telugu">
                మీ ఫోన్ ద్వారా పంట ఆకు లేదా కాయ ఫోటో తీసి అప్‌లోడ్ చేయండి.
              </p>
            </div>

            <div className="bg-[#F5F8F2] p-6 rounded-3xl border-2 border-[#B7C9B3] hover:border-[#2E7D32] transition-all shadow-sm space-y-3">
              <div className="w-12 h-12 bg-[#2E7D32] text-white rounded-2xl flex items-center justify-center font-black text-xl shadow">
                2
              </div>
              <h3 className="text-lg font-black text-[#1B5E20]">2. 🤖 AI Identifies Problem</h3>
              <p className="text-black text-xs font-black leading-relaxed text-telugu">
                మా ఏఐ సిస్టమ్ పంట తెగులు లేదా పురుగును తక్షణమే విశ్లేషిస్తుంది.
              </p>
            </div>

            <div className="bg-[#F5F8F2] p-6 rounded-3xl border-2 border-[#B7C9B3] hover:border-[#2E7D32] transition-all shadow-sm space-y-3">
              <div className="w-12 h-12 bg-[#2E7D32] text-white rounded-2xl flex items-center justify-center font-black text-xl shadow">
                3
              </div>
              <h3 className="text-lg font-black text-[#1B5E20]">3. 🌦️ Weather & Stage Checked</h3>
              <p className="text-black text-xs font-black leading-relaxed text-telugu">
                జిల్లా వాతావరణం మరియు పంట దశ ఆధారంగా సలహా ప్రాసెస్ అవుతుంది.
              </p>
            </div>

            <div className="bg-[#F5F8F2] p-6 rounded-3xl border-2 border-[#B7C9B3] hover:border-[#2E7D32] transition-all shadow-sm space-y-3">
              <div className="w-12 h-12 bg-[#2E7D32] text-white rounded-2xl flex items-center justify-center font-black text-xl shadow">
                4
              </div>
              <h3 className="text-lg font-black text-[#1B5E20]">4. 🔊 Advice in Telugu Voice</h3>
              <p className="text-black text-xs font-black leading-relaxed text-telugu">
                సరైన మందుల మోతాదును తెలుగు పాఠం మరియు ఆడియో ద్వారా వినండి.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SUPPORTED CROPS SECTION */}
      <section className="py-16 md:py-20 bg-[#C8E6C9] border-b-2 border-[#B7C9B3]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-white bg-[#1B5E20] px-3.5 py-1 rounded-full shadow-sm">Telangana Crops</span>
              <h2 className="text-2xl md:text-4xl font-black text-[#1B5E20] mt-2">Supported Major Crops</h2>
            </div>
            <p className="text-black font-black text-sm mt-2 md:mt-0 text-telugu">ప్రత్తి, వరి, మిర్చి మరియు మొక్కజొన్న పంటలపై ప్రత్యేకాధికారం</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportedCrops.map((crop) => (
              <div key={crop.name} className="bg-white p-6 rounded-3xl border-2 border-[#B7C9B3] shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{crop.icon}</div>
                <div className="flex items-baseline gap-2 mb-2">
                  <h3 className="text-xl font-black text-black">{crop.name}</h3>
                  <span className="text-[#1B5E20] font-black text-sm text-telugu">({crop.telugu})</span>
                </div>
                <p className="text-black font-black text-xs">{crop.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. AI ADVISORY FLOW SECTION */}
      <section className="py-16 bg-white border-b-2 border-[#B7C9B3]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-white bg-[#1B5E20] px-3.5 py-1 rounded-full shadow-sm">End-to-End System</span>
            <h2 className="text-2xl md:text-4xl font-black text-[#1B5E20]">Complete Agricultural Advisory Pipeline</h2>
            <p className="text-black font-black text-telugu">ఫోటో ఆధారిత గుర్తింపు నుండి స్పష్టమైన తెలుగు సలహా వరకు</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="bg-[#F5F8F2] p-4 rounded-2xl border-2 border-[#B7C9B3]">
              <span className="text-2xl block mb-1">📷</span>
              <span className="text-xs font-black text-[#1B5E20] block">CROP PHOTO</span>
            </div>
            <div className="bg-[#F5F8F2] p-4 rounded-2xl border-2 border-[#B7C9B3]">
              <span className="text-2xl block mb-1">🤖</span>
              <span className="text-xs font-black text-[#1B5E20] block">AI DIAGNOSIS</span>
            </div>
            <div className="bg-[#F5F8F2] p-4 rounded-2xl border-2 border-[#B7C9B3]">
              <span className="text-2xl block mb-1">🌦️</span>
              <span className="text-xs font-black text-[#1B5E20] block">WEATHER + STAGE</span>
            </div>
            <div className="bg-[#F5F8F2] p-4 rounded-2xl border-2 border-[#B7C9B3]">
              <span className="text-2xl block mb-1">📋</span>
              <span className="text-xs font-black text-[#1B5E20] block">ACTION ADVISORY</span>
            </div>
            <div className="bg-[#F5F8F2] p-4 rounded-2xl border-2 border-[#B7C9B3]">
              <span className="text-2xl block mb-1">🔊</span>
              <span className="text-xs font-black text-[#1B5E20] block">TELUGU VOICE</span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. TELUGU VOICE SECTION */}
      <section className="py-16 bg-[#C8E6C9] border-b-2 border-[#B7C9B3]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-[#2E7D32] text-white flex items-center justify-center font-black shadow">
              <Volume2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-black text-[#1B5E20]">Advice You Can Hear, Not Just Read</h2>
            <p className="text-black font-black text-lg leading-relaxed text-telugu">
              "మీ పంటకు ఏమి సమస్య ఉందో తెలుసుకోండి. ఏం చేయాలో తెలుగులో వినండి."
            </p>
            <p className="text-black font-black text-xs leading-relaxed text-telugu">
              చదవడం కష్టంగా ఉన్న రైతు సోదరుల కోసం ప్రతి పంట నివారణ సలహాను స్పష్టమైన తెలుగు ఆడియో రూపంలో వినిపిస్తుంది.
            </p>
            <div className="bg-white p-4 rounded-2xl border-2 border-[#B7C9B3] flex items-center gap-4 shadow-sm">
              <button className="w-12 h-12 bg-[#2E7D32] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all">
                <Volume2 className="w-6 h-6 text-white" />
              </button>
              <div>
                <span className="text-xs font-black text-[#1B5E20] block text-telugu">తెలుగు సలహా వినండి</span>
                <span className="text-xs font-black text-black">Click to play sample Telugu advisory voice</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-[#2E7D32] text-white flex items-center justify-center font-black shadow">
              <CloudSun className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-black text-[#1B5E20]">🌦️ Weather-Aware Recommendations</h2>
            <p className="text-black font-black text-xs leading-relaxed text-telugu">
              వర్షం కురిసే ముందు రసాయనాలు పిచికారీ చేస్తే వృథా అవుతుంది. మా సిస్టమ్ నేరుగా మీ జిల్లా వాతావరణాన్ని బట్టి మందులు పిచికారీ చేయడానికి సరైన సమయాన్ని సూచిస్తుంది.
            </p>
            <div className="bg-white p-4 rounded-2xl border-2 border-[#B7C9B3] flex items-center gap-3 shadow-sm">
              <ShieldCheck className="w-6 h-6 text-[#1B5E20] flex-shrink-0" />
              <span className="text-xs text-black font-black text-telugu">
                PJTSAU (తెలంగాణ వ్యవసాయ విశ్వవిద్యాలయం) ప్రామాణిక నిబంధనల ఆధారంగా తయారు చేసిన సలహాలు.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 13. FOOTER - Deep Agricultural Green (#1B5E20) + Black & White Text */}
      <footer className="bg-[#1B5E20] text-white mt-auto py-12 border-t-2 border-[#B7C9B3]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <Logo variant="green" size="md" />
            <p className="text-xs text-[#C8E6C9] font-black leading-relaxed">
              Telugu Voice Crop Advisory for Smallholder Farmers in Telangana. Built with React, Vite, Tailwind & FastAPI.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-black text-[#C8E6C9] uppercase tracking-wider mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-sm text-[#C8E6C9] font-black">
              <li><Link to="/auth/signin" className="hover:text-white">Sign In</Link></li>
              <li><Link to="/auth/signup" className="hover:text-white">Sign Up</Link></li>
              <li><Link to="/scan" className="hover:text-white">Scan Crop</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black text-[#C8E6C9] uppercase tracking-wider mb-3">Crops Supported</h4>
            <ul className="space-y-1 text-sm text-[#C8E6C9] font-black">
              <li>Cotton (ప్రత్తి)</li>
              <li>Paddy (వరి)</li>
              <li>Chilli (మిర్చి)</li>
              <li>Maize (మొక్కజొన్న)</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black text-[#C8E6C9] uppercase tracking-wider mb-3">Trust & Safety</h4>
            <p className="text-xs text-[#C8E6C9] font-black">
              Verified agricultural knowledge base engine. Zero hallucinated pesticide dosage.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 border-t border-[#2E7D32] flex flex-col sm:flex-row items-center justify-between text-xs text-[#C8E6C9] font-black">
          <span>© 2026 RythuMitra AI. Built for Telangana Farmers.</span>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <Link to="/auth/signin" className="hover:text-white">Sign In</Link>
            <span>•</span>
            <Link to="/auth/signup" className="hover:text-white">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
