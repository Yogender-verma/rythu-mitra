import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Phone, KeyRound, RefreshCw, ShieldCheck, AlertCircle, ArrowLeft, CheckCircle2, Globe } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    loginWithGoogle, 
    loginAsDemoFarmer, 
    sendPhoneOtp, 
    verifyOtp, 
    resetRecaptcha,
    isAuthenticated,
    language,
    setLanguage
  } = useAuth();

  const isSignUp = location.pathname.includes('signup');

  // Form State
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [farmerName, setFarmerName] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [otpHint, setOtpHint] = useState<string | null>(null);

  // Status & Timers
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  // If already authenticated, redirect directly to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Clean up reCAPTCHA when switching modes or unmounting
  useEffect(() => {
    return () => {
      resetRecaptcha('recaptcha-container');
    };
  }, []);

  // Handle Send Phone OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError(
        language === 'te'
          ? 'దయచేసి సరియైన 10 అంకెల భారతీయ మొబైల్ నంబర్‌ను నమోదు చేయండి.'
          : 'Please enter a valid 10-digit Indian mobile number.'
      );
      return;
    }

    setLoading(true);
    try {
      const result = await sendPhoneOtp(cleanPhone, 'recaptcha-container');
      setConfirmationResult(result);
      if (result?.mock_otp) {
        setOtpHint(
          language === 'te'
            ? `పరీక్ష OTP: ${result.mock_otp} (అలాగే Twilio SMS పంపబడింది)`
            : `Test OTP: ${result.mock_otp} (Twilio SMS dispatched)`
        );
      } else {
        setOtpHint(
          language === 'te'
            ? `OTP మీ మొబైల్ (+91 ${cleanPhone}) కు Twilio SMS ద్వారా పంపబడింది. (పరీక్ష కోడ్: 123456 కూడా పనిచేస్తుంది)`
            : `OTP sent to your mobile (+91 ${cleanPhone}) via Twilio SMS. (Test code: 123456 is also accepted)`
        );
      }
      setStep('otp');
      setResendCountdown(30);
      setError(null);
    } catch (err: any) {
      setError(err.message || (language === 'te' ? 'OTP పంపడం విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.' : 'Failed to send OTP. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setError(
        language === 'te'
          ? 'దయచేసి 6 అంకెల OTP కోడ్‌ను నమోదు చేయండి.'
          : 'Please enter the 6-digit OTP code.'
      );
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(confirmationResult || phone, cleanOtp, farmerName.trim() || undefined);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || (language === 'te' ? 'OTP ధృవీకరణ విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.' : 'OTP verification failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Handle Changing Phone Number back to step 1
  const handleChangeNumber = () => {
    setStep('phone');
    setOtp('');
    setOtpHint(null);
    setError(null);
    resetRecaptcha('recaptcha-container');
  };

  // Handle Instant Demo Farmer Login
  const handleDemoSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      await loginAsDemoFarmer();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || (language === 'te' ? 'డెమో లాగిన్ విఫలమైంది.' : 'Demo login failed.'));
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || (language === 'te' ? 'గూగుల్ లాగిన్ విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.' : 'Google sign-in failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8F2] flex flex-col md:flex-row text-black relative">
      {/* Top Floating Language Switcher */}
      <div className="absolute top-4 right-4 z-30">
        <button
          type="button"
          onClick={() => setLanguage(language === 'te' ? 'en' : 'te')}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-[#F5F8F2] text-black border-2 border-[#B7C9B3] text-xs font-black transition-all shadow-md touch-target hover:border-[#1B5E20]"
          title={language === 'te' ? 'Switch to English' : 'తెలుగులోకి మార్చండి'}
        >
          <Globe className="w-4 h-4 text-[#1B5E20]" />
          <span className="font-black">{language === 'te' ? 'English' : 'తెలుగు'}</span>
        </button>
      </div>

      {/* Left Agriculture Hero Panel */}
      <div className="md:w-1/2 bg-[#C8E6C9] border-r-2 border-[#B7C9B3] p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
        <div>
          <Logo variant="green" size="lg" />
          <div className="mt-10 space-y-5">
            <span className="inline-block text-xs font-black uppercase tracking-wider text-white bg-[#1B5E20] px-4 py-1.5 rounded-full shadow-sm">
              {language === 'te' ? 'రైతు మిత్ర AI పోర్టల్' : 'Rythu Mitra AI Portal'}
            </span>
            
            <h1 className="text-3xl md:text-5xl font-black leading-tight text-[#1B5E20]">
              {isSignUp 
                ? (language === 'te' ? 'రైతు మిత్ర ఖాతా తెరవండి' : 'Create RythuMitra Account') 
                : (language === 'te' ? 'స్వాగతం, రైతు సోదరా' : 'Welcome back, Farmer')}
            </h1>
            
            <p className="text-[#0e241b] text-base md:text-lg font-black leading-relaxed">
              {language === 'te'
                ? 'మీ పంట ఆరోగ్యాన్ని కాపాడుకోవడానికి మరియు వాతావరణ ఆధారిత నిజసమయ తెలుగు సలహాలను పొందడానికి సైన్ ఇన్ చేయండి.'
                : 'Sign in to safeguard crop health, detect plant diseases early, and receive real-time weather-guided advisory.'}
            </p>
          </div>
        </div>

        {/* Trust Card */}
        <div className="mt-10 p-6 bg-white rounded-3xl border-2 border-[#B7C9B3] shadow-md space-y-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[#1B5E20]" />
            <span className="font-black text-[#1B5E20] text-sm">
              {language === 'te' ? 'అధికారిక Firebase ఫోన్ ధృవీకరణ' : 'Official Firebase Phone Authentication'}
            </span>
          </div>
          <p className="text-xs text-black font-black leading-relaxed">
            {language === 'te'
              ? 'మీ మొబైల్ నంబర్‌కు వచ్చే సురక్షితమైన OTP ద్వారా వేగంగా మరియు భద్రంగా లాగిన్ అవ్వండి.'
              : 'Fast, secure and verified login using instant OTP sent directly to your phone.'}
          </p>
        </div>
      </div>

      {/* Right Authentication Card */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-[#F5F8F2]">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border-2 border-[#B7C9B3] space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-black text-black">
                {step === 'otp' 
                  ? (language === 'te' ? 'OTP ధృవీకరణ' : 'Verify OTP')
                  : (isSignUp 
                      ? (language === 'te' ? 'ఖాతా తెరవండి' : 'Create Account') 
                      : (language === 'te' ? 'రైతు లాగిన్' : 'Farmer Sign In'))}
              </h2>
              <p className="text-xs text-[#1B5E20] font-black mt-1.5">
                {step === 'otp' 
                  ? (language === 'te' ? `+91 ${phone} కు పంపిన 6-అంకెల OTP ని నమోదు చేయండి` : `Enter the 6-digit OTP sent to +91 ${phone}`) 
                  : (language === 'te' ? 'మీ 10 అంకెల మొబైల్ నంబర్ ద్వారా OTP పొందండి' : 'Enter your 10-digit mobile number to receive OTP')}
              </p>
            </div>

            {/* In-Card Language Switcher Button */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'te' ? 'en' : 'te')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E8F5E9] hover:bg-[#C8E6C9] text-black border border-[#B7C9B3] text-xs font-black transition-all touch-target shrink-0"
              title={language === 'te' ? 'Switch to English' : 'తెలుగులోకి మార్చండి'}
            >
              <Globe className="w-3.5 h-3.5 text-[#1B5E20]" />
              <span>{language === 'te' ? 'EN' : 'తెలుగు'}</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-amber-50 text-amber-950 rounded-2xl text-xs font-black border-2 border-amber-300 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
              <button
                onClick={handleDemoSignIn}
                type="button"
                className="w-full bg-[#1B5E20] hover:bg-[#2E7D32] text-white py-2.5 px-4 rounded-xl font-black text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>🌾</span>
                <span>{language === 'te' ? 'డెమో లాగిన్ తో కొనసాగించండి' : 'Continue with Demo Farmer'}</span>
              </button>
            </div>
          )}

          {/* Invisible reCAPTCHA container */}
          <div id="recaptcha-container"></div>

          {/* STAGE 1: PHONE NUMBER INPUT */}
          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1.5">
                    {language === 'te' ? 'రైతు పేరు (ఐచ్ఛికం)' : 'Farmer Name (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    placeholder={language === 'te' ? 'ఉదా: రాము లేదా శ్రీనివాస్' : 'e.g. Ramu or Srinivas'}
                    className="w-full px-4 py-3 bg-[#F5F8F2] border-2 border-[#B7C9B3] rounded-2xl text-sm font-black focus:outline-none focus:border-[#1B5E20] transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5">
                  {language === 'te' ? 'మొబైల్ నంబర్' : 'Mobile Number'}
                </label>
                <div className="flex items-center rounded-2xl border-2 border-[#B7C9B3] bg-[#F5F8F2] focus-within:border-[#1B5E20] transition-colors overflow-hidden">
                  <span className="px-4 py-3 bg-[#E8F5E9] font-black text-sm text-[#1B5E20] border-r-2 border-[#B7C9B3] select-none flex items-center gap-1.5">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(val);
                    }}
                    placeholder="98765 43210"
                    required
                    className="w-full px-4 py-3 bg-transparent text-base font-black tracking-wider focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-gray-500 font-bold mt-1">
                  {language === 'te' ? 'భారతీయ 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి' : 'Enter 10-digit Indian mobile number'}
                </p>
              </div>

              {/* Send OTP Button */}
              <button
                type="submit"
                disabled={loading || phone.length !== 10}
                className={`w-full py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-lg touch-target ${
                  loading || phone.length !== 10
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#1B5E20] hover:bg-[#2E7D32] text-white'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{language === 'te' ? 'OTP పంపుతోంది...' : 'Sending OTP...'}</span>
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5" />
                    <span>{language === 'te' ? 'OTP పంపండి' : 'Send OTP'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STAGE 2: OTP VERIFICATION */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="p-3.5 bg-[#E8F5E9] rounded-2xl border-2 border-[#C8E6C9] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">📱</span>
                  <div>
                    <span className="text-xs text-gray-600 block">
                      {language === 'te' ? 'OTP పంపిన నంబర్:' : 'OTP Sent To:'}
                    </span>
                    <span className="text-sm font-black text-[#1B5E20]">+91 {phone}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleChangeNumber}
                  className="text-xs text-[#1B5E20] font-black underline flex items-center gap-1 hover:text-[#2E7D32]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{language === 'te' ? 'మార్చండి' : 'Change'}</span>
                </button>
              </div>

              {otpHint && (
                <div className="p-3.5 bg-emerald-50 text-emerald-950 rounded-2xl border-2 border-emerald-300 text-xs font-black flex items-start gap-2.5 shadow-sm">
                  <span className="text-base shrink-0">📨</span>
                  <span className="leading-relaxed">{otpHint}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5">
                  {language === 'te' ? 'SMS లో వచ్చిన 6 అంకెల OTP' : 'Enter 6-Digit SMS OTP'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(val);
                    }}
                    placeholder="• • • • • •"
                    autoFocus
                    required
                    className="w-full px-4 py-3.5 text-center bg-[#F5F8F2] border-2 border-[#B7C9B3] rounded-2xl text-2xl font-black tracking-[0.4em] focus:outline-none focus:border-[#1B5E20] transition-colors"
                  />
                  <KeyRound className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Verify OTP Button */}
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className={`w-full py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-lg touch-target ${
                  loading || otp.length !== 6
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#1B5E20] hover:bg-[#2E7D32] text-white'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{language === 'te' ? 'ధృవీకరిస్తోంది...' : 'Verifying...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{language === 'te' ? 'ధృవీకరించండి & ప్రవేశించండి' : 'Verify & Continue'}</span>
                  </>
                )}
              </button>

              {/* Resend OTP Block */}
              <div className="text-center pt-1">
                {resendCountdown > 0 ? (
                  <p className="text-xs text-gray-500 font-black">
                    {language === 'te' ? 'మళ్ళీ OTP పంపడానికి వేచి ఉండండి:' : 'Resend OTP in:'}{' '}
                    <span className="text-[#1B5E20]">{resendCountdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={loading}
                    className="text-xs text-[#1B5E20] font-black underline hover:text-[#2E7D32] transition-colors"
                  >
                    {language === 'te' ? 'మళ్ళీ OTP పంపండి' : 'Resend OTP'}
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Alternative Auth Methods */}
          <div className="space-y-3 pt-2">
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t-2 border-[#B7C9B3]"></div>
              <span className="flex-shrink mx-3 text-xs font-black text-gray-500 uppercase">
                {language === 'te' ? 'లేదా' : 'OR'}
              </span>
              <div className="flex-grow border-t-2 border-[#B7C9B3]"></div>
            </div>

            {/* Quick Demo Farmer Sign-In Button */}
            <button
              onClick={handleDemoSignIn}
              disabled={loading}
              type="button"
              className="w-full bg-[#E8F5E9] hover:bg-[#C8E6C9] text-black font-black py-3.5 rounded-2xl border-2 border-[#B7C9B3] transition-all flex flex-col items-center justify-center gap-0.5 touch-target shadow-sm text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🌾</span>
                <span className="text-[#1B5E20]">
                  {language === 'te' ? 'రైతు డెమో లాగిన్' : 'Instant Demo Sign In'}
                </span>
              </div>
              <span className="text-[10px] text-gray-600 font-bold">
                {language === 'te' 
                  ? 'Firebase OTP లేకుండా నేరుగా అన్ని ఫీచర్లు చూడండి' 
                  : 'Explore all features instantly without OTP setup'}
              </span>
            </button>

            {/* Google Auth Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              type="button"
              className="w-full bg-white hover:bg-[#F5F8F2] text-black border-2 border-[#B7C9B3] font-black py-3.5 rounded-2xl transition-all flex items-center justify-center gap-3 touch-target shadow-sm hover:border-[#1B5E20] text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{language === 'te' ? 'గూగుల్ తో కొనసాగించండి' : 'Continue with Google'}</span>
            </button>
          </div>

          {/* Bottom Switcher Link */}
          <div className="text-center text-xs text-black font-black pt-2 border-t-2 border-[#B7C9B3]">
            {isSignUp ? (
              <span>
                {language === 'te' ? 'ఇప్పటికే ఖాతా ఉందా?' : 'Already have an account?'}{' '}
                <Link to="/auth/signin" className="text-[#1B5E20] font-black underline">
                  {language === 'te' ? 'లాగిన్ అవ్వండి' : 'Sign In'}
                </Link>
              </span>
            ) : (
              <span>
                {language === 'te' ? 'కొత్త రైతులా?' : 'New to RythuMitra?'}{' '}
                <Link to="/auth/signup" className="text-[#1B5E20] font-black underline">
                  {language === 'te' ? 'ఖాతా తెరవండి' : 'Create an account'}
                </Link>
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
