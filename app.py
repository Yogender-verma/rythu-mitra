import os
import io
import re
import base64
import uuid
import logging
import threading
import datetime
import requests
from flask import Flask, request, jsonify, send_from_directory, session, redirect, url_for, Response
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from core.database import init_db, SessionLocal, User, OTPVerification, CropScan, PaymentTransaction
from core.pipeline import pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rythu-mitra-app")

app = Flask(__name__, static_folder="static", static_url_path="")
SECRET_KEY = os.environ.get("SECRET_KEY", "rythu-mitra-flask-secret-key-2024")
app.secret_key = SECRET_KEY
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["PERMANENT_SESSION_LIFETIME"] = datetime.timedelta(days=30)
CORS(app, supports_credentials=True)

# Configuration settings
WHATSAPP_ACCESS_TOKEN = os.environ.get("WHATSAPP_ACCESS_TOKEN", "mock_whatsapp_access_token")
WHATSAPP_PHONE_NUMBER_ID = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "100012345678901")
WHATSAPP_BUSINESS_ACCOUNT_ID = os.environ.get("WHATSAPP_BUSINESS_ACCOUNT_ID", "100098765432109")
WHATSAPP_VERIFY_TOKEN = os.environ.get("WHATSAPP_VERIFY_TOKEN", "rythu_mitra_verify_token_2024")
PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", "http://localhost:5000")
WEATHER_API_KEY = os.environ.get("WEATHER_API_KEY", "")
AUDIO_CACHE_DIR = os.path.join(os.path.dirname(__file__), "audio_cache")
os.makedirs(AUDIO_CACHE_DIR, exist_ok=True)

# Twilio SMS / OTP Gateway Settings
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER", "")

def send_twilio_sms(to_phone: str, message_body: str) -> bool:
    """
    Dispatches SMS to farmer via Twilio REST API.
    Uses standard requests with HTTP Basic Authentication without requiring external packages.
    Gracefully logs and falls back in mock/dev mode.
    """
    if not (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER):
        logger.info(f"[Twilio Dev Mode] SMS to {to_phone}: {message_body}")
        return True

    if TWILIO_ACCOUNT_SID.startswith("mock_") or TWILIO_AUTH_TOKEN.startswith("mock_"):
        logger.info(f"[Twilio Mock] SMS to {to_phone}: {message_body}")
        return True

    try:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
        res = requests.post(
            url,
            auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
            data={
                "From": TWILIO_PHONE_NUMBER,
                "To": to_phone,
                "Body": message_body
            },
            timeout=10
        )
        if res.status_code in [200, 201]:
            logger.info(f"[Twilio SMS] Dispatched successfully to {to_phone}")
            return True
        else:
            logger.error(f"[Twilio SMS] API Error {res.status_code}: {res.text}")
            return False
    except Exception as e:
        logger.error(f"[Twilio SMS] Delivery exception: {e}")
        return False

def twiml_message(body: str) -> Response:
    """
    Constructs a standard, fast, zero-dependency TwiML XML response for Twilio WhatsApp.
    Properly escapes XML special characters.
    """
    escaped = (
        str(body)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )
    xml = f'<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n    <Message>{escaped}</Message>\n</Response>'
    return Response(xml, mimetype="application/xml")

def send_twilio_whatsapp_message(to_phone: str, message_body: str, media_url: Optional[str] = None) -> dict:
    """
    Dispatches a proactive or asynchronous WhatsApp message via Twilio REST API.
    Uses standard requests with HTTP Basic Authentication.
    """
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID", TWILIO_ACCOUNT_SID)
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN", TWILIO_AUTH_TOKEN)
    from_wa = os.environ.get("TWILIO_WHATSAPP_NUMBER", "whatsapp:+17372508034")

    if not from_wa.startswith("whatsapp:"):
        from_wa = f"whatsapp:{from_wa}"

    target_wa = to_phone if to_phone.startswith("whatsapp:") else f"whatsapp:{to_phone}"

    if not (account_sid and auth_token) or account_sid.startswith("mock_"):
        logger.info(f"[Twilio WA Mock] Message to {target_wa}: {message_body[:80]}...")
        return {
            "success": True,
            "mode": "mock",
            "to": target_wa,
            "message": "Logged in development/mock mode"
        }

    data = {
        "From": from_wa,
        "To": target_wa,
        "Body": message_body
    }
    if media_url and media_url.startswith("http"):
        data["MediaUrl"] = media_url

    try:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
        res = requests.post(url, auth=(account_sid, auth_token), data=data, timeout=15)
        res_json = {}
        try:
            res_json = res.json()
        except Exception:
            pass

        # If MediaUrl was rejected due to trial account restrictions, retry without MediaUrl (image URL is in Body)
        if res.status_code == 400 and ("trial accounts have limited parameter" in str(res_json) or res_json.get("code") == 0):
            logger.info("[Twilio WA REST] Retrying without MediaUrl parameter for trial sandbox compatibility")
            data.pop("MediaUrl", None)
            res = requests.post(url, auth=(account_sid, auth_token), data=data, timeout=15)
            try:
                res_json = res.json()
            except Exception:
                pass

        if res.status_code in [200, 201]:
            logger.info(f"[Twilio WA REST] Dispatched successfully to {target_wa} (SID: {res_json.get('sid')})")
            return {
                "success": True,
                "sid": res_json.get("sid"),
                "status": res_json.get("status", "queued"),
                "to": target_wa
            }
        else:
            err_msg = res_json.get("message") or res.text
            err_code = res_json.get("code")
            logger.error(f"[Twilio WA REST] Error {res.status_code} ({err_code}): {err_msg}")

            # Specific explanation for Twilio Sandbox session activation requirement
            sandbox_note = None
            if err_code in [21654, 21608] or "ContentSid Required" in err_msg or "not currently reachable" in err_msg:
                sandbox_note = (
                    "Twilio Trial Sandbox Requirement: To receive messages directly from the Twilio Trial bot, "
                    "send 'join <keyword>' or 'hello' from your WhatsApp (+91 70132 24596) to +1 415 523 8886. "
                    "This opens the 24-hour bot session, allowing the bot to send the advisory and image directly to you!"
                )

            return {
                "success": False,
                "error": err_msg,
                "code": err_code,
                "status_code": res.status_code,
                "sandbox_note": sandbox_note,
                "to": target_wa
            }
    except Exception as e:
        logger.error(f"[Twilio WA REST] Exception: {e}")
        return {
            "success": False,
            "error": str(e),
            "to": target_wa
        }

init_db()


# ==============================================================================
# PHONE NUMBER NORMALIZATION HELPER (E.164 Standard)
# ==============================================================================
def normalize_phone_number(raw_phone: str) -> str:
    """Standardizes phone numbers to standard E.164 format (+91XXXXXXXXXX)."""
    if not raw_phone:
        return ""

    cleaned = re.sub(r"[\s\-\(\)]", "", str(raw_phone).strip())
    if cleaned.startswith("+"):
        digits_only = re.sub(r"[^\d]", "", cleaned[1:])
        return f"+{digits_only}"

    cleaned_digits = re.sub(r"[^\d]", "", cleaned)
    if cleaned_digits.startswith("0") and len(cleaned_digits) == 11:
        cleaned_digits = cleaned_digits[1:]

    if len(cleaned_digits) == 10:
        return f"+91{cleaned_digits}"

    if len(cleaned_digits) == 12 and cleaned_digits.startswith("91"):
        return f"+{cleaned_digits}"

    return f"+{cleaned_digits}"


# ==============================================================================
# WEATHER SERVICE HELPER (Tasks 6, 7 & 8)
# Uses coordinates to retrieve real-time temperature, humidity, and rainfall
# ==============================================================================
def get_weather_from_coordinates(lat: float, lon: float) -> Optional[dict]:
    """
    Retrieves real-time local weather using latitude and longitude.
    Includes comprehensive error handling for network/API failures.
    """
    try:
        # High-precision meteorological query
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code"
        )
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json().get("current", {})
            code = data.get("weather_code", 0)

            # WMO Weather interpretation
            if code == 0:
                cond = "Clear Sky"
            elif code in [1, 2, 3]:
                cond = "Partly Cloudy"
            elif code in [45, 48]:
                cond = "Foggy"
            elif code in [51, 53, 55, 61, 63, 65]:
                cond = "Rainy"
            elif code in [80, 81, 82]:
                cond = "Rain Showers"
            elif code in [95, 96, 99]:
                cond = "Thunderstorm"
            else:
                cond = "Mild / Overcast"

            precip = float(data.get("precipitation", 0.0))
            rain_prob = 75 if precip > 0.5 else 15

            return {
                "temp": round(float(data.get("temperature_2m", 28.0)), 1),
                "humidity": round(float(data.get("relative_humidity_2m", 65.0)), 1),
                "precipitation": precip,
                "rain_prob": rain_prob,
                "condition": cond
            }
    except Exception as e:
        logger.warning(f"[Weather API] Weather fetch notice: {e}")

    # Graceful fallback default
    return {
        "temp": 28.0,
        "humidity": 65.0,
        "precipitation": 0.0,
        "rain_prob": 10,
        "condition": "Stable / Normal"
    }


# ==============================================================================
# META WHATSAPP CLOUD API HELPERS (Task 10)
# ==============================================================================
def send_whatsapp_text(recipient_phone: str, message_text: str) -> bool:
    url = f"https://graph.facebook.com/v19.0/{WHATSAPP_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": recipient_phone.replace("+", ""),
        "type": "text",
        "text": {"preview_url": False, "body": message_text}
    }
    try:
        if WHATSAPP_ACCESS_TOKEN.startswith("mock_"):
            logger.info(f"[Mock WhatsApp] Text to {recipient_phone}: {message_text[:80]}...")
            return True
        res = requests.post(url, headers=headers, json=payload, timeout=10)
        return res.status_code in [200, 201]
    except Exception as e:
        logger.error(f"[WhatsApp API] Outbound text failed: {e}")
        return False


def send_whatsapp_audio(recipient_phone: str, audio_url: str) -> bool:
    url = f"https://graph.facebook.com/v19.0/{WHATSAPP_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    full_audio_url = audio_url if audio_url.startswith("http") else f"{PUBLIC_BASE_URL.rstrip('/')}{audio_url}"
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": recipient_phone.replace("+", ""),
        "type": "audio",
        "audio": {"link": full_audio_url}
    }
    try:
        if WHATSAPP_ACCESS_TOKEN.startswith("mock_"):
            logger.info(f"[Mock WhatsApp] Audio to {recipient_phone}: {full_audio_url}")
            return True
        res = requests.post(url, headers=headers, json=payload, timeout=10)
        return res.status_code in [200, 201]
    except Exception as e:
        logger.error(f"[WhatsApp API] Outbound audio notice: {e}")
        return False


def download_whatsapp_media(media_id: str) -> bytes:
    if WHATSAPP_ACCESS_TOKEN.startswith("mock_"):
        from PIL import Image
        img = Image.new("RGB", (224, 224), color=(34, 139, 34))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        return buf.getvalue()

    headers = {"Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}"}
    info_url = f"https://graph.facebook.com/v19.0/{media_id}"
    res = requests.get(info_url, headers=headers, timeout=10)
    res.raise_for_status()
    media_url = res.json().get("url")

    dl_res = requests.get(media_url, headers=headers, timeout=15)
    dl_res.raise_for_status()
    return dl_res.content


# ==============================================================================
# ASYNC WHATSAPP BACKGROUND PROCESSOR
# ==============================================================================
def process_whatsapp_event(payload: dict):
    db = SessionLocal()
    try:
        entries = payload.get("entry", [])
        for entry in entries:
            for change in entry.get("changes", []):
                for msg in change.get("value", {}).get("messages", []):
                    sender_raw = msg.get("from")
                    if not sender_raw:
                        continue

                    normalized_phone = normalize_phone_number(sender_raw)

                    # TASK 9: REGISTERED FARMER CHECK
                    user = db.query(User).filter(User.phone == normalized_phone).first()

                    if not user:
                        unregistered_reply = "Please register in Rythu Mitra to use this service."
                        send_whatsapp_text(normalized_phone, unregistered_reply)
                        continue

                    # Non-Image Safeguard
                    if msg.get("type") != "image":
                        non_image_reply = "Please send a clear photo of the crop/leaf showing the affected part."
                        send_whatsapp_text(normalized_phone, non_image_reply)
                        continue

                    # Retrieve and download image bytes
                    media_id = msg.get("image", {}).get("id")
                    try:
                        image_bytes = download_whatsapp_media(media_id)
                    except Exception:
                        send_whatsapp_text(normalized_phone, "Error retrieving image. Please resend the photo.")
                        continue

                    # EXECUTE UNIFIED INFERENCE PIPELINE
                    try:
                        result = pipeline.run_pipeline(image_bytes, weather_data=None, lang="te")
                    except ValueError:
                        send_whatsapp_text(normalized_phone, "Corrupt or invalid image. Please send a clear leaf photo.")
                        continue

                    # LOW CONFIDENCE SAFEGUARD (< 0.60)
                    if result.get("is_low_confidence", False):
                        low_conf_reply = (
                            "The disease could not be clearly identified with high certainty. "
                            "We recommend consulting an agricultural officer or PJTSAU expert."
                        )
                        send_whatsapp_text(normalized_phone, low_conf_reply)
                        continue

                    # Record scan in database
                    scan_id = str(uuid.uuid4())
                    scan_record = CropScan(
                        id=scan_id,
                        user_id=user.id,
                        phone=normalized_phone,
                        crop=result["crop"],
                        disease=result["disease"],
                        disease_telugu=result["disease_telugu"],
                        confidence=result["confidence"],
                        risk_level=result["risk_level"],
                        organic_solution=result["organic_solution_te"],
                        chemical_solution=result["chemical_solution_te"],
                        product_name=result["product_name"],
                        product_image=result["product_image"],
                        dosage=result["dosage"],
                        audio_url=result.get("audio_url"),
                        source="whatsapp"
                    )
                    db.add(scan_record)
                    db.commit()

                    # Rich WhatsApp response
                    conf_pct = int(result["confidence"] * 100)
                    advisory_text = (
                        f"🌿 *Rythu Mitra (రైతు మిత్ర) Crop Advisory* 🌿\n\n"
                        f"🌾 *పంట (Crop):* {result['crop_te']} ({result['crop']})\n"
                        f"🔍 *సమస్య (Disease):* {result['disease_telugu']}\n"
                        f"📊 *ఖచ్చితత్వం (Confidence):* {conf_pct}%\n\n"
                        f"📖 *వివరణ (Problem):*\n{result['description_te']}\n\n"
                        f"🍃 *సేంద్రీయ నివారణ (Organic):*\n{result['organic_solution_te']}\n\n"
                        f"🧪 *రసాయనిక నివారణ (Chemical):*\n{result['chemical_solution_te']}\n\n"
                        f"💊 *సిఫార్సు చేసిన మందు (Product):* {result['product_name']}\n"
                        f"⚖️ *మోతాదు (Dosage):* {result['dosage']}\n\n"
                        f"⚠️ *జాగ్రత్తలు (Precautions):*\n{result['precautions_te']}\n\n"
                        f"🔊 *వాయిస్ సలహా ఆడియో కింద అందించబడింది.*"
                    )

                    send_whatsapp_text(normalized_phone, advisory_text)

                    if result.get("audio_url"):
                        send_whatsapp_audio(normalized_phone, result["audio_url"])

    except Exception as e:
        logger.error(f"[WhatsApp Webhook] Processing error: {e}", exc_info=True)
    finally:
        db.close()


# ==============================================================================
# WEBHOOK HANDLERS
# ==============================================================================
@app.route("/webhook", methods=["GET"])
def whatsapp_webhook_handshake():
    mode = request.args.get("hub.mode")
    token = request.args.get("hub.verify_token")
    challenge = request.args.get("hub.challenge")

    if mode == "subscribe" and token == WHATSAPP_VERIFY_TOKEN:
        return challenge, 200
    return "Verification token mismatch", 403


@app.route("/webhook", methods=["POST"])
def whatsapp_webhook_receiver():
    payload = request.get_json(silent=True) or {}
    threading.Thread(target=process_whatsapp_event, args=(payload,), daemon=True).start()
    return jsonify({"status": "received"}), 200


# ==============================================================================
# WEB APPLICATION API ROUTES
# ==============================================================================
@app.route("/")
def serve_landing():
    """Serves the separate Landing & Authentication Page (Task 13)."""
    return send_from_directory("static", "landing.html")


@app.route("/dashboard")
def serve_dashboard():
    """
    Task 14 & 15: Protected Dashboard Application.
    Requires active authenticated session; unauthenticated users are redirected to landing.
    """
    if not session.get("user_id"):
        return redirect("/?auth=required")
    return send_from_directory("static", "dashboard.html")


@app.route("/api/session", methods=["GET"])
def check_session():
    """Returns active session authentication status and user details."""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"authenticated": False, "user": None})
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            session.clear()
            return jsonify({"authenticated": False, "user": None})
        return jsonify({"authenticated": True, "user": user.to_dict()})
    finally:
        db.close()


@app.route("/api/logout", methods=["POST", "GET"])
def logout_endpoint():
    """Task 15: Clears authenticated session and redirects to landing."""
    session.clear()
    if request.method == "POST" or request.is_json:
        return jsonify({"success": True, "redirect": "/"})
    return redirect("/")


@app.route("/api/user", methods=["GET"])
def get_user_profile():
    phone = request.args.get("phone")
    user_id = session.get("user_id")
    db = SessionLocal()
    try:
        if phone:
            user = db.query(User).filter(User.phone == normalize_phone_number(phone)).first()
        elif user_id:
            user = db.query(User).filter(User.id == user_id).first()
        else:
            user = db.query(User).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"user": user.to_dict()})
    finally:
        db.close()


@app.route("/api/weather", methods=["GET"])
def get_weather_endpoint():
    """TASK 6 & 8: Weather API endpoint querying local climate conditions."""
    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)

    if lat is None or lon is None:
        return jsonify({"error": "Latitude and longitude coordinates are required."}), 400

    weather = get_weather_from_coordinates(lat, lon)
    return jsonify({"success": True, "weather": weather})


@app.route("/api/send-otp", methods=["POST"])
def send_otp():
    """
    Task 13-B: Phone Login & Registration Module.
    Validates that only valid 10-digit Indian mobile numbers (starting with 6-9) are accepted.
    Dispatches OTP via mock or production SMS provider configured via environment variables.
    """
    data = request.get_json() or {}
    raw_phone = str(data.get("phone", "")).strip()

    digits = re.sub(r"[^\d]", "", raw_phone)
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    elif digits.startswith("0") and len(digits) == 11:
        digits = digits[1:]

    # Strict Indian mobile number validation (10 digits starting with 6, 7, 8, or 9)
    if not (len(digits) == 10 and digits[0] in "6789"):
        return jsonify({
            "error": "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
            "error_te": "దయచేసి 6, 7, 8 లేదా 9తో ప్రారంభమయ్యే సరైన 10 అంకెల మొబైల్ నంబర్‌ను నమోదు చేయండి."
        }), 400

    norm_phone = f"+91{digits}"
    
    # Twilio / Production OTP generation
    import random
    if TWILIO_ACCOUNT_SID and not TWILIO_ACCOUNT_SID.startswith("mock_"):
        otp_code = f"{random.randint(100000, 999999)}"
    else:
        otp_code = "123456"

    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)

    # Dispatch SMS via Twilio API
    sms_body = (
        f"రైతు మిత్ర (Rythu Mitra) Verification OTP: {otp_code}. "
        f"Valid for 10 minutes. Do not share this OTP with anyone."
    )
    sms_sent = send_twilio_sms(norm_phone, sms_body)

    # Optional Production SMS Gateway dispatch if configured
    sms_gateway_url = os.environ.get("SMS_GATEWAY_URL")
    if sms_gateway_url:
        try:
            requests.post(sms_gateway_url, json={"to": norm_phone, "otp": otp_code}, timeout=5)
        except Exception as e:
            logger.warning(f"[SMS Gateway] Notice: {e}")

    db = SessionLocal()
    try:
        record = OTPVerification(phone=norm_phone, otp_code=otp_code, expires_at=expires_at)
        db.add(record)
        db.commit()
        return jsonify({
            "success": True,
            "message": f"OTP sent to {norm_phone}",
            "mock_otp": otp_code if (not TWILIO_ACCOUNT_SID or TWILIO_ACCOUNT_SID.startswith("mock_")) else None,
            "phone": norm_phone,
            "channel": "Twilio SMS" if (TWILIO_ACCOUNT_SID and not TWILIO_ACCOUNT_SID.startswith("mock_")) else "Mock SMS"
        })
    finally:
        db.close()


@app.route("/api/verify-otp", methods=["POST"])
def verify_otp():
    """
    Task 13-C: OTP Verification & Session Establishment.
    Case 1 - Existing User: Logs in, creates session, redirects to /dashboard.
    Case 2 - New User: Creates DB user record, creates session, returns is_new_user=True for Green Success Modal.
    """
    data = request.get_json() or {}
    raw_phone = str(data.get("phone", "")).strip()
    submitted_otp = str(data.get("otp", "")).strip()

    digits = re.sub(r"[^\d]", "", raw_phone)
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    elif digits.startswith("0") and len(digits) == 11:
        digits = digits[1:]

    norm_phone = f"+91{digits}" if len(digits) == 10 else normalize_phone_number(raw_phone)

    if not submitted_otp:
        return jsonify({"error": "Please enter the 6-digit verification OTP."}), 400

    # Verify against database record with expiry check
    db = SessionLocal()
    try:
        active_rec = db.query(OTPVerification).filter(
            OTPVerification.phone == norm_phone,
            OTPVerification.otp_code == submitted_otp,
            OTPVerification.expires_at > datetime.datetime.utcnow()
        ).order_by(OTPVerification.created_at.desc()).first()

        valid_otp = bool(active_rec)
        # Development / test mode fallback
        if not valid_otp and submitted_otp == "123456":
            valid_otp = True

        if not valid_otp:
            return jsonify({
                "error": "Invalid or expired OTP. Please use the test code 123456 or request a new OTP.",
                "error_te": "చెల్లని లేదా గడువు ముగిసిన OTP. దయచేసి పరీక్ష కోడ్ 123456 ఉపయోగించండి లేదా క్రొత్త OTP కోరండి."
            }), 400

        user = db.query(User).filter(User.phone == norm_phone).first()
        is_new_user = False

        if not user:
            is_new_user = True
            user = User(
                phone=norm_phone,
                name="Farmer Subscriber",
                language=data.get("language", "te"),
                subscription_tier="Tier 01 Plan",
                subscription_status="ACTIVE",
                subscription_start=datetime.datetime.utcnow(),
                subscription_expiry=datetime.datetime.utcnow() + datetime.timedelta(days=365)
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Establish server-side session (Task 13-E)
        session["user_id"] = user.id
        session["phone"] = user.phone
        session.permanent = True

        return jsonify({
            "success": True,
            "is_new_user": is_new_user,
            "message": "Successfully Registered" if is_new_user else "Login Successful",
            "redirect": "/dashboard",
            "user": user.to_dict()
        })
    finally:
        db.close()


@app.route("/api/upload-image", methods=["POST"])
@app.route("/upload-image", methods=["POST"])
def upload_image_diagnostic():
    """
    TASKS 3, 7, 9 & 11: Unified Diagnostic Inference Endpoint.
    Accepts image, optional phone, optional geolocation, and language preference.
    """
    image_bytes = None
    phone = None
    lat = None
    lon = None
    lang = "te"

    if "image" in request.files:
        image_bytes = request.files["image"].read()
        phone = request.form.get("phone")
        lat = request.form.get("lat", type=float)
        lon = request.form.get("lon", type=float)
        lang = request.form.get("language") or request.form.get("lang") or "te"
    elif request.is_json:
        data = request.get_json() or {}
        b64_data = data.get("image", "")
        phone = data.get("phone")
        lat = data.get("lat")
        lon = data.get("lon")
        lang = data.get("language") or data.get("lang") or "te"
        if "," in b64_data:
            b64_data = b64_data.split(",", 1)[1]
        try:
            image_bytes = base64.b64decode(b64_data)
        except Exception:
            return jsonify({"error": "Invalid base64 image data."}), 400

    if not image_bytes:
        return jsonify({"error": "No image payload provided."}), 400

    # TASK 9: REGISTERED FARMER CHECK
    db = SessionLocal()
    user = None
    try:
        if phone:
            norm_phone = normalize_phone_number(phone)
            user = db.query(User).filter(User.phone == norm_phone).first()
            # If explicit registration check requested and user not in DB
            if request.args.get("strict_auth") == "true" and not user:
                return jsonify({
                    "registered": False,
                    "message": "Please register in Rythu Mitra to use this service."
                }), 403

        # TASK 6 & 7: GEOLOCATION & WEATHER INTEGRATION
        weather_data = None
        if lat is not None and lon is not None:
            weather_data = get_weather_from_coordinates(float(lat), float(lon))

        # EXECUTE UNIFIED INFERENCE
        result = pipeline.run_pipeline(image_bytes, weather_data=weather_data, lang=lang)

        # Persist in DB
        scan_id = str(uuid.uuid4())
        scan = CropScan(
            id=scan_id,
            user_id=user.id if user else None,
            phone=phone or "+919876543210",
            crop=result["crop"],
            disease=result["disease"],
            disease_telugu=result["disease_telugu"],
            confidence=result["confidence"],
            risk_level=result["risk_level"],
            organic_solution=result["organic_solution_te"] if lang == "te" else result["organic_solution_en"],
            chemical_solution=result["chemical_solution_te"] if lang == "te" else result["chemical_solution_en"],
            product_name=result["product_name"],
            product_image=result["product_image"],
            dosage=result["dosage"],
            audio_url=result.get("audio_url"),
            source="web"
        )
        db.add(scan)
        db.commit()

        result["scan_id"] = scan_id
        result["registered"] = True if user else False
        return jsonify(result)

    finally:
        db.close()


@app.route("/api/scans", methods=["GET"])
def get_scans_endpoint():
    db = SessionLocal()
    try:
        scans = db.query(CropScan).order_by(CropScan.created_at.desc()).limit(20).all()
        return jsonify({"scans": [s.to_dict() for s in scans]})
    finally:
        db.close()


@app.route("/api/payment/create-order", methods=["POST"])
def create_payment_order():
    return jsonify({
        "order_id": f"order_{uuid.uuid4().hex[:12]}",
        "amount": 99900,
        "currency": "INR",
        "plan_name": "Harvest Premium Annual Tier 01"
    })


@app.route("/api/payment/verify", methods=["POST"])
def verify_payment():
    data = request.get_json() or {}
    order_id = data.get("order_id", f"order_{uuid.uuid4().hex[:8]}")
    payment_id = data.get("payment_id", f"pay_{uuid.uuid4().hex[:10]}")
    method = data.get("method", "UPI")
    norm_phone = normalize_phone_number(data.get("phone", "+919876543210"))

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.phone == norm_phone).first() or db.query(User).first()
        now = datetime.datetime.utcnow()
        new_expiry = now + datetime.timedelta(days=365)

        if user:
            user.subscription_tier = "Tier 01 Plan"
            user.subscription_status = "ACTIVE"
            user.subscription_start = now
            user.subscription_expiry = new_expiry
            tx = PaymentTransaction(
                id=str(uuid.uuid4()),
                user_id=user.id,
                order_id=order_id,
                payment_id=payment_id,
                amount=999.0,
                currency="INR",
                status="SUCCESS",
                payment_method=method,
                plan="Harvest Premium Annual Tier 01"
            )
            db.add(tx)
            db.commit()

        return jsonify({
            "success": True,
            "receipt": {
                "transaction_id": payment_id,
                "order_id": order_id,
                "plan": "Harvest Premium Annual Tier 01",
                "amount": "₹999.00",
                "status": "PAID / ACTIVE",
                "payment_method": method,
                "valid_until": new_expiry.strftime("%d %b %Y")
            },
            "user": user.to_dict() if user else {}
        })
    finally:
        db.close()


@app.route("/api/audio/<filename>")
def get_audio_file(filename):
    return send_from_directory(AUDIO_CACHE_DIR, filename)

SETTINGS_PHONE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "settings_phone.txt")

@app.route("/api/settings/phone", methods=["GET", "POST"])
def settings_phone_endpoint():
    global SETTINGS_PHONE_FILE
    if request.method == "POST":
        data = request.get_json() or {}
        phone = str(data.get("phone", "")).strip()
        if phone:
            digits = re.sub(r"[^\d]", "", phone)
            if digits.startswith("91") and len(digits) == 12:
                digits = digits[2:]
            elif digits.startswith("0") and len(digits) == 11:
                digits = digits[1:]
            norm_phone = f"+91{digits}" if len(digits) == 10 else phone
            try:
                with open(SETTINGS_PHONE_FILE, "w", encoding="utf-8") as f:
                    f.write(norm_phone)
            except Exception as e:
                logger.warning(f"Could not write settings phone file: {e}")
            
            # Sync to latest user in DB
            try:
                db_session = SessionLocal()
                latest_user = db_session.query(User).order_by(User.id.desc()).first()
                if latest_user:
                    latest_user.phone = norm_phone
                    db_session.commit()
                db_session.close()
            except Exception as e:
                logger.warning(f"Could not update user in DB: {e}")

            logger.info(f"[Settings] Saved destination phone: {norm_phone}")
            return jsonify({"success": True, "phone": norm_phone})
        return jsonify({"error": "Phone number required"}), 400

    # GET request: return saved settings phone
    saved_phone = None
    if os.path.exists(SETTINGS_PHONE_FILE):
        try:
            with open(SETTINGS_PHONE_FILE, "r", encoding="utf-8") as f:
                saved_phone = f.read().strip()
        except Exception:
            pass

    if not saved_phone:
        try:
            db_session = SessionLocal()
            latest_user = db_session.query(User).order_by(User.id.desc()).first()
            if latest_user and latest_user.phone:
                saved_phone = latest_user.phone
            db_session.close()
        except Exception:
            pass

    if not saved_phone:
        saved_phone = "+917013224596"

    return jsonify({"phone": saved_phone})

@app.route("/api/scans/share-whatsapp", methods=["POST"])
def share_whatsapp_scan():
    """
    Website -> WhatsApp Result Sharing Endpoint.
    Dispatches the pre-computed crop diagnosis, solution, and weather advisory
    directly to the farmer's WhatsApp saved in Settings via Twilio WhatsApp REST API.
    Does NOT rerun the AI disease model.
    """
    data = request.get_json() or {}
    raw_phone = str(data.get("phone", "")).strip()

    # Prioritize number saved in Settings if missing or default
    if not raw_phone or raw_phone == "+919876543210":
        saved_phone = None
        if os.path.exists(SETTINGS_PHONE_FILE):
            try:
                with open(SETTINGS_PHONE_FILE, "r", encoding="utf-8") as f:
                    saved_phone = f.read().strip()
            except Exception:
                pass
        if not saved_phone:
            try:
                db_session = SessionLocal()
                latest_user = db_session.query(User).order_by(User.id.desc()).first()
                if latest_user and latest_user.phone:
                    saved_phone = latest_user.phone
                db_session.close()
            except Exception:
                pass
        raw_phone = saved_phone or "+917013224596"

    scan_id = data.get("scan_id")
    message = data.get("message", "")
    raw_image = data.get("image_url")
    public_img_url = None

    if raw_image:
        try:
            raw_bytes = None
            if raw_image.startswith("data:"):
                # Base64 data URI
                encoded = raw_image.split(",", 1)[1] if "," in raw_image else raw_image
                raw_bytes = base64.b64decode(encoded)
            elif raw_image.startswith("http") and "localhost" not in raw_image and "127.0.0.1" not in raw_image:
                public_img_url = raw_image

            if raw_bytes:
                r_up = requests.post(
                    "https://tmpfiles.org/api/v1/upload",
                    files={"file": ("crop_leaf.jpg", io.BytesIO(raw_bytes), "image/jpeg")},
                    timeout=2.5
                )
                if r_up.ok:
                    u = r_up.json().get("data", {}).get("url", "")
                    if u:
                        public_img_url = u.replace("tmpfiles.org/", "tmpfiles.org/dl/")
                        logger.info(f"[WhatsApp Flask] Crop image public URL generated: {public_img_url}")
        except Exception as img_err:
            logger.warning(f"Failed to generate public image url for WhatsApp: {img_err}")

    if public_img_url and "📸" not in message:
        message = f"📸 *పంట ఆకు చిత్రం:* {public_img_url}\n\n" + message

    digits = re.sub(r"[^\d]", "", raw_phone)
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    elif digits.startswith("0") and len(digits) == 11:
        digits = digits[1:]
    norm_phone = f"+91{digits}" if len(digits) == 10 else raw_phone

    logger.info(f"[WhatsApp Flask] Dispatching advisory to saved settings phone: {norm_phone} (scan: {scan_id}, media: {bool(public_img_url)})")

    twilio_result = send_twilio_whatsapp_message(norm_phone, message, media_url=public_img_url)
    return jsonify({
        "success": twilio_result.get("success", False),
        "phone": norm_phone,
        "scan_id": scan_id,
        "media_url": public_img_url,
        "message_length": len(message),
        "twilio": twilio_result
    })

# ==============================================================================
# TWILIO WHATSAPP SANDBOX WEBHOOK (POST /whatsapp)
# Handles text greetings ("hello"), incoming leaf images, AI disease prediction,
# weather integration, and PJTSAU Telugu advisories.
# ==============================================================================
@app.route("/whatsapp", methods=["POST", "GET"])
def twilio_whatsapp_webhook():
    """
    Twilio WhatsApp Sandbox Webhook Endpoint.
    Receives incoming WhatsApp text and image messages from farmers,
    executes AI crop disease diagnosis via AgriculturalPipeline, fetches real-time weather,
    and returns comprehensive PJTSAU agricultural advisories in Telugu.
    """
    if request.method == "GET":
        return jsonify({
            "status": "RythuMitra Twilio WhatsApp Webhook Active",
            "endpoint": "/whatsapp",
            "method": "POST"
        })

    data = request.form or {}
    raw_from = data.get("From", "")
    raw_body = data.get("Body", "").strip()
    num_media_raw = data.get("NumMedia", "0")
    try:
        num_media = int(num_media_raw)
    except (ValueError, TypeError):
        num_media = 0

    media_url = data.get("MediaUrl0")
    media_content_type = data.get("MediaContentType0", "")
    profile_name = data.get("ProfileName", "")

    sender_phone = raw_from.replace("whatsapp:", "").strip()
    norm_phone = normalize_phone_number(sender_phone) if sender_phone else "+919876543210"

    logger.info(f"[Twilio Webhook] Received message from {sender_phone} ({profile_name}): Body='{raw_body[:40]}', Media={num_media}")

    # 1. GREETING & TEXT HANDLING (No Media attached)
    if num_media == 0:
        clean_text = raw_body.lower()
        greeting_words = ["hello", "hi", "hey", "namaste", "namaskaram", "start", "help", "rythu", "mitra", "doctor"]
        is_greeting = any(word in clean_text for word in greeting_words) or not clean_text

        if is_greeting:
            greeting_reply = (
                "Namaste! RythuMitraAI received your message 🌱\n\n"
                "🌾 *రైతు మిత్ర AI - పంట డాక్టర్ సేవకు స్వాగతం!*\n"
                "────────────────────────────\n"
                "నమస్కారం! మీ పంటకు ఏదైనా తెగులు లేదా వ్యాధి సోకినట్లయితే:\n\n"
                "📸 *ప్రభావిత ఆకు ఫోటోను ఇక్కడ వాట్సాప్‌లో పంపండి* (Send Image).\n\n"
                "మా AI మోడల్ ఆకును పరిశీలించి:\n"
                "1. పంట & వ్యాధి పేరును గుర్తిస్తుంది\n"
                "2. సేంద్రీయ మరియు రసాయన నివారణ మందులను సూచిస్తుంది\n"
                "3. PJTSAU విశ్వవిద్యాలయ ప్రామాణిక మోతాదును తెలియజేస్తుంది\n"
                "4. స్థానిక వాతావరణ హెచ్చరికలను అందిస్తుంది\n\n"
                "దయచేసి ఆకు దగ్గరగా ఉండే స్పష్టమైన ఫోటో తీసి ఇప్పుడే పంపండి!"
            )
            return twiml_message(greeting_reply)
        else:
            info_reply = (
                "🌿 *రైతు మిత్ర AI - పంట వ్యాధి సహాయం*\n"
                "────────────────────────────\n"
                f"మీ సందేశం అందింది: \"{raw_body[:50]}\"\n\n"
                "వ్యాధిని నిర్ధారించడానికి మరియు నివారణ మందుల వివరాలు పొందడానికి, "
                "దయచేసి వ్యాధి సోకిన *పంట ఆకు ఫోటోను (Camera / Gallery)* వాట్సాప్‌లో పంపండి 📸\n\n"
                "Send a clear photo of the affected leaf to get disease diagnosis & treatment advice."
            )
            return twiml_message(info_reply)

    # 2. UNSUPPORTED MEDIA TYPE CHECK
    if not media_content_type.startswith("image/"):
        logger.warning(f"[Twilio Webhook] Unsupported media type: {media_content_type}")
        unsupported_reply = (
            "⚠️ *ఫైల్ ఫార్మాట్ సరికాదు*\n"
            "────────────────────────────\n"
            "దయచేసి పంట ఆకు ఫోటోను మాత్రమే పంపండి (JPG, PNG లేదా WebP).\n"
            "వీడియోలు, ఆడియో లేదా PDF ఫైల్స్ ద్వారా వ్యాధిని విశ్లేషించలేము.\n\n"
            "Please send a valid crop leaf photo (JPG, PNG or WebP)."
        )
        return twiml_message(unsupported_reply)

    # 3. SECURE IMAGE DOWNLOAD VIA TWILIO BASIC AUTH
    try:
        account_sid = os.environ.get("TWILIO_ACCOUNT_SID", TWILIO_ACCOUNT_SID)
        auth_token = os.environ.get("TWILIO_AUTH_TOKEN", TWILIO_AUTH_TOKEN)
        auth = (account_sid, auth_token) if (account_sid and auth_token and not account_sid.startswith("mock_")) else None

        logger.info(f"[Twilio Webhook] Downloading crop media from Twilio: {media_url}")
        # Twilio media URLs often redirect (HTTP 307) to AWS S3.
        # Avoid forwarding Twilio Basic Auth headers to S3 which causes S3 400 errors.
        initial_res = requests.get(media_url, auth=auth, allow_redirects=False, timeout=20)
        if initial_res.status_code in (301, 302, 303, 307):
            s3_url = initial_res.headers.get("Location")
            img_res = requests.get(s3_url, timeout=30)
        elif initial_res.status_code == 200:
            img_res = initial_res
        else:
            img_res = requests.get(media_url, auth=auth, timeout=30)

        if img_res.status_code != 200:
            logger.error(f"[Twilio Webhook] Failed downloading image: HTTP {img_res.status_code}")
            return twiml_message(
                "⚠️ చిత్రం డౌన్‌లోడ్ చేయడంలో సమస్య ఎదురైంది. దయచేసి నెట్‌వర్క్ తనిఖీ చేసి ఫోటోను మళ్లీ పంపండి.\n"
                "Failed to download image. Please resend the photo."
            )
        image_bytes = img_res.content
    except Exception as e:
        logger.error(f"[Twilio Webhook] Image download exception: {e}")
        return twiml_message(
            "⚠️ చిత్రం పొందడంలో లోపం ఏర్పడింది. దయచేసి ఫోటోను మళ్లీ పంపండి.\n"
            "Could not process image download. Please try again."
        )

    # 4. WEATHER CONTEXT RETRIEVAL
    lat = data.get("Latitude", type=float)
    lon = data.get("Longitude", type=float)
    weather_data = None
    try:
        if lat is None or lon is None:
            # Check if farmer has registered location in DB
            db = SessionLocal()
            try:
                user = db.query(User).filter(User.phone == norm_phone).first()
                # Default Telangana agricultural center (Karimnagar: 18.4386, 79.1288)
                lat, lon = 18.4386, 79.1288
            finally:
                db.close()
        weather_data = get_weather_from_coordinates(float(lat), float(lon))
    except Exception as w_err:
        logger.warn(f"[Twilio Webhook] Weather retrieval notice: {w_err}")
        weather_data = None

    # 5. AI INFERENCE & PJTSAU ADVISORY PIPELINE
    try:
        logger.info(f"[Twilio Webhook] Executing AgriculturalPipeline for farmer {norm_phone}...")
        diag = pipeline.run_pipeline(image_bytes, weather_data=weather_data, lang="te")

        crop_name = diag.get("crop", "Crop")
        crop_te = diag.get("crop_te", crop_name)
        disease_te = diag.get("disease_telugu") or diag.get("disease") or "గుర్తించబడలేదు"
        disease_en = diag.get("disease", "")
        conf_val = round(float(diag.get("confidence", 0.0)) * 100, 1)
        risk = diag.get("risk_level", "Medium")
        risk_te = "తీవ్ర ప్రమాదం (High)" if risk == "High" else "మధ్యస్థం (Medium)" if risk == "Medium" else "తక్కువ (Low)"

        desc_te = diag.get("description_te", "")
        organic_te = diag.get("organic_solution_te", "")
        chemical_te = diag.get("chemical_solution_te", "")
        product_name = diag.get("product_name", "PJTSAU రక్షణ మందు")
        product_type = diag.get("product_type", "వ్యవసాయ చికిత్స")
        dosage = diag.get("dosage", "లీటరు నీటికి 2-3 గ్రాములు")
        precautions_te = diag.get("precautions_te", "పిచికారీ సమయంలో మాస్క్, గ్లౌజులు ధరించండి.")
        climate_adv_obj = diag.get("climate_advisory")
        climate_advisory_text = ""
        if isinstance(climate_adv_obj, dict):
            climate_advisory_text = climate_adv_obj.get("advisory_te") or climate_adv_obj.get("advisory_en") or ""
        elif isinstance(climate_adv_obj, str):
            climate_advisory_text = climate_adv_obj

        # Persist Scan to Database
        try:
            db = SessionLocal()
            user = db.query(User).filter(User.phone == norm_phone).first()
            scan_id = str(uuid.uuid4())
            scan_rec = CropScan(
                id=scan_id,
                user_id=user.id if user else None,
                phone=norm_phone,
                crop=crop_name,
                disease=disease_en,
                disease_telugu=disease_te,
                confidence=float(diag.get("confidence", 0.0)),
                risk_level=risk,
                organic_solution=organic_te,
                chemical_solution=chemical_te,
                product_name=product_name,
                product_image=diag.get("product_image"),
                dosage=dosage,
                audio_url=diag.get("audio_url"),
                source="twilio_whatsapp"
            )
            db.add(scan_rec)
            db.commit()
            db.close()
        except Exception as db_err:
            logger.warn(f"[Twilio Webhook] Scan save notice: {db_err}")

        # 6. CONSTRUCT FINAL COMPREHENSIVE TELUGU ADVISORY
        advisory_lines = [
            "🌿 *రైతు మిత్ర AI - పంట వ్యాధి & నివారణ నివేదిక*",
            "────────────────────────────",
            f"🌱 *పంట:* {crop_te} ({crop_name})",
            f"🔍 *వ్యాధి / సమస్య:* *{disease_te}*",
            f"📊 *ఖచ్చితత్వం:* {conf_val}%  |  *ప్రమాద తీవ్రత:* {risk_te}",
            ""
        ]

        if desc_te:
            advisory_lines.extend([
                "❓ *సమస్య వివరాలు / లక్షణాలు:*",
                f"{desc_te.strip()}",
                ""
            ])

        if organic_te:
            advisory_lines.extend([
                "🍃 *సేంద్రీయ నివారణ పద్ధతులు:*",
                f"{organic_te.strip()}",
                ""
            ])

        if product_name or chemical_te:
            advisory_lines.extend([
                "💊 *రసాయన చికిత్స & సిఫార్సు చేసిన మందు:*",
                f"• సిఫార్సు చేసిన మందు: *{product_name}*",
                f"• రకం: {product_type}",
                f"• మోతాదు: *{dosage}*",
                f"{chemical_te.strip() if chemical_te else ''}",
                ""
            ])

        if precautions_te:
            advisory_lines.extend([
                "🛡️ *రైతు తీసుకోవలసిన జాగ్రత్తలు:*",
                f"{precautions_te.strip()}",
                ""
            ])

        if weather_data and weather_data.get("temp"):
            advisory_lines.extend([
                f"🌤️ *స్థానిక వాతావరణం:* ఉష్ణోగ్రత {weather_data.get('temp')}°C, తేమ {weather_data.get('humidity', '65')}%",
            ])
            if climate_advisory_text:
                advisory_lines.append(f"🌦️ {climate_advisory_text.strip()}")
            advisory_lines.append("")

        advisory_lines.extend([
            "────────────────────────────",
            "🏛️ *ఆచార్య జయశంకర్ తెలంగాణ వ్యవసాయ విశ్వవిద్యాలయం (PJTSAU) ప్రామాణిక సిఫార్సు*",
            "🌾 *RythuMitra AI - మీ చేతిలో డిజిటల్ వ్యవసాయ సహాయకుడు*"
        ])

        final_msg = "\n".join(advisory_lines)
        logger.info(f"[Twilio Webhook] Advisory compiled successfully ({len(final_msg)} chars). Returning TwiML.")
        return twiml_message(final_msg)

    except Exception as diag_err:
        logger.error(f"[Twilio Webhook] Diagnosis pipeline error: {diag_err}", exc_info=True)
        fallback_msg = (
            "⚠️ *విశ్లేషణలో సాంకేతిక లోపం ఏర్పడింది*\n"
            "────────────────────────────\n"
            "చిత్రాన్ని పరిశీలించడంలో సమస్య ఎదురైంది. దయచేసి ఆకు దగ్గరగా, స్పష్టమైన వెలుతురులో ఉన్న మరొక ఫోటోను పంపండి.\n\n"
            "An error occurred during image processing. Please send another clear photo of the leaf."
        )
        return twiml_message(fallback_msg)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

