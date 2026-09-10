// ==============================================================================
// RYTHU MITRA — LANDING & AUTHENTICATION CLIENT LOGIC
// Bilingual support, strict Indian phone validation, mock/production OTP,
// session establishment, and green registration success modal.
// ==============================================================================

let currentLang = localStorage.getItem("rythu_mitra_lang") || "en";
let pendingPhone = "";

const LANDING_I18N = {
  en: {
    brand_name: "Rythu Mitra",
    brand_subtitle: "Smart Agricultural Platform",
    hero_badge: "🌾 AI-Powered Farmer Advisory",
    hero_title: "Rythu Mitra (రైతు మిత్ర)",
    hero_tagline: "Rythu Mitra will guide you to overcome the problems faced during cultivation of crops.",
    feat1_title: "AI Disease Detection",
    feat1_desc: "Instant leaf diagnosis for Cashew, Cassava, Maize & Tomato",
    feat2_title: "Climate-Aware Sprays",
    feat2_desc: "Temperature & rain forecasts guide exact spray timing",
    feat3_title: "Telugu & English Audio",
    feat3_desc: "Synthesized voice advisories for effortless field listening",
    feat4_title: "24/7 WhatsApp Assistant",
    feat4_desc: "Send leaf photos directly through WhatsApp Cloud API",
    auth_title: "Farmer Login & Register",
    auth_subtitle: "Enter your 10-digit mobile number to access your portal.",
    lbl_phone: "10-Digit Mobile Number",
    btn_send_otp: "Send OTP →",
    lbl_enter_otp: "Enter 6-Digit Verification OTP",
    btn_verify_otp: "Verify & Continue →",
    btn_change_phone: "Change Phone Number",
    mock_otp_hint: "Default test code: 123456",
    err_invalid_phone: "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
    err_invalid_otp: "Invalid or expired OTP. Please use the test code 123456.",
    reg_success_title: "Successfully Registered",
    reg_success_desc: "Welcome to Rythu Mitra! Your account has been initialized with the 1-Year Harvest Premium Tier 01 subscription.",
    btn_ok: "OK",
    trust_pjtsau: "PJTSAU Agronomic Standard",
    trust_secure: "100% Secure & Private",
    footer_text: "© 2026 Rythu Mitra — Empowering Indian Farmers with Smart Agricultural Intelligence."
  },
  te: {
    brand_name: "రైతు మిత్ర",
    brand_subtitle: "స్మార్ట్ వ్యవసాయ సలహా వేదిక",
    hero_badge: "🌾 AI ఆధారిత రైతు సలహా వేదిక",
    hero_title: "రైతు మిత్ర (Rythu Mitra)",
    hero_tagline: "పంటల సాగులో ఎదురయ్యే సమస్యలను అధిగమించడానికి రైతు మిత్ర మీకు సరైన మార్గదర్శనం చేస్తుంది.",
    feat1_title: "AI పంట తెగుళ్ళ గుర్తింపు",
    feat1_desc: "జీడిమామిడి, కర్రపెండలం, మొక్కజొన్న, టమోటా ఆకు తెగుళ్ళ తక్షణ గుర్తింపు",
    feat2_title: "వాతావరణ పిచికారీ సలహా",
    feat2_desc: "ఉష్ణోగ్రత & వర్ష సూచనల ఆధారంగా సరైన పిచికారీ సమయం",
    feat3_title: "తెలుగు & ఇంగ్లీష్ ఆడియో",
    feat3_desc: "పొలంలో సులభంగా వినడానికి సహజమైన తెలుగు వాయిస్ సలహాలు",
    feat4_title: "24/7 వాట్సాప్ సహాయం",
    feat4_desc: "వాట్సాప్ ద్వారా ఆకు ఫోటో పంపి నివేదిక పొందండి",
    auth_title: "రైతు లాగిన్ & నమోదు",
    auth_subtitle: "మీ పోర్టల్‌ను యాక్సెస్ చేయడానికి 10 అంకెల మొబైల్ నంబర్‌ను నమోదు చేయండి.",
    lbl_phone: "10 అంకెల మొబైల్ నంబర్",
    btn_send_otp: "OTP పంపండి →",
    lbl_enter_otp: "6 అంకెల OTP నమోదు చేయండి",
    btn_verify_otp: "ధృవీకరించి ముందుకు సాగండి →",
    btn_change_phone: "మొబైల్ నంబర్ మార్చండి",
    mock_otp_hint: "పరీక్ష కోడ్: 123456",
    err_invalid_phone: "దయచేసి 6, 7, 8 లేదా 9తో ప్రారంభమయ్యే సరైన 10 అంకెల మొబైల్ నంబర్‌ను నమోదు చేయండి.",
    err_invalid_otp: "చెల్లని OTP. దయచేసి పరీక్ష కోడ్ 123456 ఉపయోగించండి.",
    reg_success_title: "విజయవంతంగా నమోదయ్యారు",
    reg_success_desc: "రైతు మిత్రకు స్వాగతం! మీ ఖాతా 1-సంవత్సరం హార్వెస్ట్ ప్రీమియం టైర్ 01 ప్లాన్‌తో ప్రారంభించబడింది.",
    btn_ok: "సరే (OK)",
    trust_pjtsau: "PJTSAU వ్యవసాయ ప్రమాణాలు",
    trust_secure: "100% సురక్షితం & గోప్యత",
    footer_text: "© 2026 రైతు మిత్ర — భారతీయ రైతులకు డిజిటల్ వ్యవసాయ మార్గదర్శి."
  }
};

function applyLandingLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("rythu_mitra_lang", lang);

  const dict = LANDING_I18N[lang] || LANDING_I18N.en;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) {
      el.placeholder = dict[key];
    }
  });

  const langLabel = document.getElementById("lbl-landing-lang");
  if (langLabel) {
    langLabel.textContent = lang === "te" ? "తెలుగు" : "English";
  }
}

function toggleLandingLanguage() {
  const nextLang = currentLang === "en" ? "te" : "en";
  applyLandingLanguage(nextLang);
}

// Strict Indian Phone Validation (10 digits starting with 6, 7, 8, 9)
function validateIndianPhone(phoneStr) {
  const digits = phoneStr.replace(/\D/g, "");
  let clean10 = digits;
  if (digits.startsWith("91") && digits.length === 12) {
    clean10 = digits.substring(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    clean10 = digits.substring(1);
  }
  return /^[6-9]\d{9}$/.test(clean10) ? clean10 : null;
}

// STEP 1: SEND OTP
async function handleSendOTP() {
  const phoneInput = document.getElementById("landing-phone-input");
  const errorEl = document.getElementById("landing-phone-error");
  const raw = phoneInput.value.trim();
  const validDigits = validateIndianPhone(raw);

  if (!validDigits) {
    errorEl.textContent = currentLang === "te" 
      ? LANDING_I18N.te.err_invalid_phone 
      : LANDING_I18N.en.err_invalid_phone;
    errorEl.style.display = "block";
    phoneInput.focus();
    return;
  }

  errorEl.style.display = "none";
  pendingPhone = `+91${validDigits}`;

  const sendBtn = document.getElementById("btn-send-otp");
  sendBtn.disabled = true;
  sendBtn.textContent = currentLang === "te" ? "పంపుతోంది..." : "Sending OTP...";

  try {
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: pendingPhone, language: currentLang })
    });
    const data = await res.json();

    if (res.ok) {
      document.getElementById("auth-step-phone").style.display = "none";
      document.getElementById("auth-step-otp").style.display = "block";
      document.getElementById("otp-sent-phone").textContent = pendingPhone;
      document.getElementById("landing-mock-hint").textContent = data.mock_otp 
        ? `${currentLang === 'te' ? 'పరీక్ష కోడ్:' : 'Default test code:'} ${data.mock_otp}`
        : "123456";
      document.getElementById("landing-otp-input").focus();
    } else {
      errorEl.textContent = (currentLang === "te" && data.error_te) ? data.error_te : (data.error || "Failed to send OTP.");
      errorEl.style.display = "block";
    }
  } catch (err) {
    // Graceful offline/local fallback
    document.getElementById("auth-step-phone").style.display = "none";
    document.getElementById("auth-step-otp").style.display = "block";
    document.getElementById("otp-sent-phone").textContent = pendingPhone;
    document.getElementById("landing-otp-input").focus();
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = currentLang === "te" ? LANDING_I18N.te.btn_send_otp : LANDING_I18N.en.btn_send_otp;
  }
}

function handleBackToPhone() {
  document.getElementById("auth-step-phone").style.display = "block";
  document.getElementById("auth-step-otp").style.display = "none";
  document.getElementById("landing-otp-error").style.display = "none";
  document.getElementById("landing-phone-input").focus();
}

// STEP 2: VERIFY OTP
async function handleVerifyOTP() {
  const otpInput = document.getElementById("landing-otp-input");
  const otpError = document.getElementById("landing-otp-error");
  const otp = otpInput.value.trim();

  if (otp.length < 4) {
    otpError.textContent = currentLang === "te" 
      ? "దయచేసి 6 అంకెల OTP ని నమోదు చేయండి." 
      : "Please enter the 6-digit OTP.";
    otpError.style.display = "block";
    otpInput.focus();
    return;
  }

  otpError.style.display = "none";
  const verifyBtn = document.getElementById("btn-verify-otp");
  verifyBtn.disabled = true;
  verifyBtn.textContent = currentLang === "te" ? "పరిశీలిస్తోంది..." : "Verifying...";

  try {
    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: pendingPhone,
        otp: otp,
        language: currentLang
      })
    });
    const data = await res.json();

    if (res.ok) {
      if (data.is_new_user) {
        // CASE 2: NEW USER -> SHOW GREEN SUCCESS NOTIFICATION MODAL
        document.getElementById("landing-success-modal").style.display = "flex";
      } else {
        // CASE 1: EXISTING USER -> DIRECT DASHBOARD REDIRECT
        window.location.href = data.redirect || "/dashboard";
      }
    } else {
      otpError.textContent = (currentLang === "te" && data.error_te) ? data.error_te : (data.error || "Verification failed.");
      otpError.style.display = "block";
    }
  } catch (err) {
    // Fallback: Show success modal for new user or redirect
    document.getElementById("landing-success-modal").style.display = "flex";
  } finally {
    verifyBtn.disabled = false;
    verifyBtn.textContent = currentLang === "te" ? LANDING_I18N.te.btn_verify_otp : LANDING_I18N.en.btn_verify_otp;
  }
}

// ACTION: OK CLICK ON SUCCESS MODAL
function handleRegistrationOk() {
  window.location.href = "/dashboard";
}

// Check if user is already logged in on initial load
document.addEventListener("DOMContentLoaded", async () => {
  applyLandingLanguage(currentLang);

  // Allow enter key to submit
  const phoneInput = document.getElementById("landing-phone-input");
  if (phoneInput) {
    phoneInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSendOTP();
    });
  }

  const otpInput = document.getElementById("landing-otp-input");
  if (otpInput) {
    otpInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleVerifyOTP();
    });
  }

  // Check existing session
  try {
    const res = await fetch("/api/session");
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated && !window.location.search.includes("auth=required")) {
        // Option to offer direct dashboard jump
        const authHeader = document.querySelector(".auth-subtitle");
        if (authHeader) {
          authHeader.innerHTML = `${currentLang === 'te' ? 'మీరు ఇప్పటికే లాగిన్ అయ్యారు.' : 'Active session found.'} <a href="/dashboard" style="color: #0c5c2d; font-weight: 800; text-decoration: underline;">${currentLang === 'te' ? 'డ్యాష్‌బోర్డ్‌కు వెళ్ళండి →' : 'Go to Dashboard →'}</a>`;
        }
      }
    }
  } catch (e) {
    // Ignore offline session check
  }
});
