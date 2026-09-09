import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithPhone, sendPhoneOtp, loginWithGoogle, addPhoneToAccount } = useAuth();

  const isSignUp = location.pathname.includes('signup');

  // Mode: 'METHOD_SELECT' | 'OTP_VERIFY' | 'ADD_PHONE' | 'ADD_PHONE_OTP'
  const [step, setStep] = useState<'METHOD_SELECT' | 'OTP_VERIFY' | 'ADD_PHONE' | 'ADD_PHONE_OTP'>('METHOD_SELECT');

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('దయచేసి సరైన 10 అంకెల ఫోన్ నంబర్‌ను నమోదు చేయండి.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await sendPhoneOtp(phone);
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
      }
      setCooldown(60);
      setStep('OTP_VERIFY');
    } catch (err: any) {
      setError(err.message || 'OTP పంపడం విఫలమైంది.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('దయచేసి 6 అంకెల OTP నమోదు చేయండి.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const success = await loginWithPhone(phone, otp);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('తప్పు OTP. దయచేసి మళ్ళీ ప్రయత్నించండి.');
      }
    } catch (err: any) {
      setError(err.message || 'OTP సరిచూడడం విఫలమైంది.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const success = await loginWithGoogle();
      if (success) {
        const currentUser = JSON.parse(localStorage.getItem('rythumitra_user') || '{}');
        if (currentUser && currentUser.has_phone) {
          navigate('/dashboard');
        } else {
          setStep('ADD_PHONE');
        }
      }
    } catch (err: any) {
      setError('గూగుల్ లాగిన్ విఫలమైంది.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhoneSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('దయచేసి 10 అంకెల ఫోన్ నంబర్ నమోదు చేయండి.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendPhoneOtp(phone);
      setDevOtp('123456');
      setStep('ADD_PHONE_OTP');
    } catch (err: any) {
      setError('OTP పంపడం విఫలమైంది.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAddPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('దయచేసి 6 అంకెల OTP నమోదు చేయండి.');
      return;
    }
    setLoading(true);
    try {
      await addPhoneToAccount(phone);
      navigate('/dashboard');
    } catch (err) {
      setError('ఫోన్ నంబర్ జత చేయడం విఫలమైంది.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8F2] flex flex-col md:flex-row text-black">
      {/* Left Agriculture Hero Panel - Light Green Background with Dark Green & Black Text */}
      <div className="md:w-1/2 bg-[#C8E6C9] border-r-2 border-[#B7C9B3] p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
        <div>
          <Logo variant="green" size="lg" />
          <div className="mt-10 space-y-5">
            <span className="inline-block text-xs font-black uppercase tracking-wider text-white bg-[#1B5E20] px-4 py-1.5 rounded-full shadow-sm">
              రైతు ఖాతా లాగిన్
            </span>
            
            <h1 className="text-3xl md:text-5xl font-black leading-tight text-[#1B5E20]">
              Welcome to RythuMitra AI
            </h1>
            
            <p className="text-[#0e241b] text-base md:text-lg font-black leading-relaxed text-telugu">
              మీ పంట ఆరోగ్యాన్ని కాపాడుకోవడానికి మరియు వాతావరణ ఆధారిత తెలుగు సలహాలను పొందడానికి లాగిన్ అవ్వండి.
            </p>
          </div>
        </div>

        {/* Bottom Trust Card */}
        <div className="mt-10 p-6 bg-white rounded-3xl border-2 border-[#B7C9B3] shadow-md space-y-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[#1B5E20]" />
            <span className="font-black text-[#1B5E20] text-sm">Secure & Farmer Friendly</span>
          </div>
          <p className="text-xs text-black font-black text-telugu leading-relaxed">
            మీ ఫోన్ నంబర్ లేదా గూగుల్ ఖాతా ద్వారా ఉచితంగా సులభంగా సైన్ ఇన్ అవ్వవచ్చు.
          </p>
        </div>
      </div>

      {/* Right Authentication Card */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-[#F5F8F2]">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border-2 border-[#B7C9B3] space-y-6">

          {/* Header */}
          <div>
            <h2 className="text-2xl font-black text-black">
              {isSignUp ? 'Create Farmer Account' : 'Sign In to RythuMitra'}
            </h2>
            <p className="text-xs text-[#1B5E20] font-black mt-1.5 text-telugu">
              మీ ఫోన్ నంబర్ లేదా గూగుల్ ద్వారా సైన్ ఇన్ చేయండి
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-100 text-red-950 rounded-2xl text-xs font-black border-2 border-red-300">
              {error}
            </div>
          )}

          {/* STEP 1: METHOD SELECT */}
          {step === 'METHOD_SELECT' && (
            <div className="space-y-4">
              {/* Phone OTP Auth Form */}
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                    Phone Number (ఫోన్ నంబర్)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black font-black text-sm">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className="w-full pl-14 pr-4 py-3.5 rounded-2xl border-2 border-[#B7C9B3] focus:border-[#1B5E20] outline-none text-base font-black text-black touch-target bg-white"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 touch-target text-base border border-[#1B5E20]"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight className="w-5 h-5 text-white" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-[#B7C9B3]"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-black font-black">Or Continue With</span>
                </div>
              </div>

              {/* Google Auth Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white hover:bg-[#F5F8F2] text-black border-2 border-[#B7C9B3] font-black py-3.5 rounded-2xl transition-all flex items-center justify-center gap-3 touch-target shadow-sm"
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
                <span>Continue with Google</span>
              </button>
            </div>
          )}

          {/* STEP 2: VERIFY PHONE OTP */}
          {step === 'OTP_VERIFY' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-[#C8E6C9] p-4 rounded-2xl border-2 border-[#B7C9B3] space-y-1 text-black">
                <span className="text-xs text-[#1B5E20] font-black block">OTP Sent to:</span>
                <span className="font-black text-black text-sm">+91 {phone}</span>
                {devOtp && (
                  <div className="mt-2 text-xs bg-white text-black p-2 rounded-xl font-black border border-[#B7C9B3]">
                    🛠️ Dev Demo OTP: <span className="text-base tracking-widest ml-1">{devOtp}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                  Enter 6-Digit OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-2xl font-black py-3.5 rounded-2xl border-2 border-[#B7C9B3] focus:border-[#1B5E20] outline-none text-black touch-target bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 touch-target text-base border border-[#1B5E20]"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin text-white" /> : <span>Verify & Login</span>}
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setStep('METHOD_SELECT')}
                  className="text-[#1B5E20] hover:text-black font-black underline"
                >
                  Change Phone Number
                </button>

                <button
                  type="button"
                  disabled={cooldown > 0}
                  onClick={handleSendOtp}
                  className={`font-black ${cooldown > 0 ? 'text-slate-400' : 'text-[#1B5E20] hover:underline'}`}
                >
                  {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: ADD PHONE NUMBER AFTER GOOGLE LOGIN */}
          {step === 'ADD_PHONE' && (
            <form onSubmit={handleAddPhoneSendOtp} className="space-y-4">
              <div className="bg-amber-100 p-4 rounded-2xl border-2 border-amber-300">
                <span className="font-black text-black text-sm block">Add your phone number</span>
                <p className="text-xs text-amber-950 font-black mt-1 text-telugu">
                  గూగుల్ లాగిన్ విజయవంతమైంది. మీ ఖాతాకు 10 అంకెల ఫోన్ నంబర్‌ను జత చేయండి.
                </p>
              </div>

              <div>
                <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black font-black text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="w-full pl-14 pr-4 py-3.5 rounded-2xl border-2 border-[#B7C9B3] focus:border-[#1B5E20] outline-none text-base font-black text-black touch-target bg-white"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black py-4 rounded-2xl shadow-lg text-base touch-target border border-[#1B5E20]"
              >
                Send Verification OTP
              </button>
            </form>
          )}

          {/* STEP 4: VERIFY ADD PHONE OTP */}
          {step === 'ADD_PHONE_OTP' && (
            <form onSubmit={handleVerifyAddPhoneOtp} className="space-y-4">
              <div className="bg-[#C8E6C9] p-3.5 rounded-2xl text-xs text-black font-black border-2 border-[#B7C9B3]">
                🛠️ Dev Demo OTP: 123456
              </div>

              <div>
                <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">
                  Enter OTP sent to +91 {phone}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-2xl font-black py-3.5 rounded-2xl border-2 border-[#B7C9B3] focus:border-[#1B5E20] outline-none text-black touch-target bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black py-4 rounded-2xl shadow-lg text-base touch-target border border-[#1B5E20]"
              >
                Verify & Continue to Dashboard
              </button>
            </form>
          )}

          {/* Bottom Switcher Link */}
          <div className="text-center text-xs text-black font-black pt-4 border-t-2 border-[#B7C9B3]">
            {isSignUp ? (
              <span>
                Already have an account?{' '}
                <Link to="/auth/signin" className="text-[#1B5E20] font-black underline">
                  Sign In
                </Link>
              </span>
            ) : (
              <span>
                New to RythuMitra?{' '}
                <Link to="/auth/signup" className="text-[#1B5E20] font-black underline">
                  Create an account
                </Link>
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
