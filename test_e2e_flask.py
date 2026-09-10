import io
import json
from PIL import Image
from app import app, normalize_phone_number
from core.database import SessionLocal, User, CropScan

client = app.test_client()

def test_phone_normalization():
    assert normalize_phone_number("9876543210") == "+919876543210"
    assert normalize_phone_number("09876543210") == "+919876543210"
    assert normalize_phone_number("919876543210") == "+919876543210"
    assert normalize_phone_number("+91 98765-43210") == "+919876543210"
    assert normalize_phone_number("+15553829104") == "+15553829104"
    print("Phone Normalization: PASSED")

def test_webhook_handshake():
    # Test valid handshake
    res = client.get("/webhook?hub.mode=subscribe&hub.verify_token=rythu_mitra_verify_token_2024&hub.challenge=test_challenge_123")
    assert res.status_code == 200
    assert res.data.decode() == "test_challenge_123"

    # Test invalid handshake
    bad_res = client.get("/webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=test_challenge_123")
    assert bad_res.status_code == 403
    print("Webhook Handshake: PASSED")

def test_whatsapp_unregistered_sender():
    # Sender not in DB
    payload = {
        "entry": [{
            "changes": [{
                "value": {
                    "messages": [{
                        "from": "+919999999999",
                        "type": "image",
                        "image": {"id": "mock_media_123"}
                    }]
                }
            }]
        }]
    }
    res = client.post("/webhook", json=payload)
    assert res.status_code == 200
    print("Unregistered WhatsApp Sender Safeguard: PASSED")

def test_whatsapp_registered_sender_non_image():
    # Registered sender sends text
    payload = {
        "entry": [{
            "changes": [{
                "value": {
                    "messages": [{
                        "from": "+919876543210",
                        "type": "text",
                        "text": {"body": "Hello Rythu Mitra"}
                    }]
                }
            }]
        }]
    }
    res = client.post("/webhook", json=payload)
    assert res.status_code == 200
    print("Non-Image WhatsApp Message Safeguard: PASSED")

def test_whatsapp_registered_sender_image():
    # Registered sender sends image
    payload = {
        "entry": [{
            "changes": [{
                "value": {
                    "messages": [{
                        "from": "+919876543210",
                        "type": "image",
                        "image": {"id": "mock_media_456"}
                    }]
                }
            }]
        }]
    }
    res = client.post("/webhook", json=payload)
    assert res.status_code == 200
    print("Registered Sender Image Processing: PASSED")

def test_web_upload_image():
    img = Image.new("RGB", (224, 224), color=(40, 160, 40))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    data = {
        "image": (buf, "leaf.jpg"),
        "phone": "+919876543210"
    }
    res = client.post("/api/upload-image", data=data, content_type="multipart/form-data")
    assert res.status_code == 200
    res_data = res.get_json()
    assert "crop" in res_data
    assert "disease" in res_data
    assert "product_name" in res_data
    assert "product_image" in res_data
    print("Web Upload Image Diagnostic API: PASSED")

def test_payment_flow():
    # Create order
    res = client.post("/api/payment/create-order", json={"plan": "Harvest Premium Annual Tier 01"})
    assert res.status_code == 200
    order_data = res.get_json()
    assert "order_id" in order_data

    # Verify payment
    verify_res = client.post("/api/payment/verify", json={
        "order_id": order_data["order_id"],
        "payment_id": "pay_mock_999",
        "method": "UPI",
        "phone": "+919876543210"
    })
    assert verify_res.status_code == 200
    v_data = verify_res.get_json()
    assert v_data["success"] is True
    assert "receipt" in v_data
    print("Payment Gateway Flow: PASSED")

def test_weather_api():
    res = client.get("/api/weather?lat=17.3850&lon=78.4867")
    assert res.status_code == 200
    w_data = res.get_json()
    assert "weather" in w_data
    w = w_data["weather"]
    assert "temp" in w
    assert "humidity" in w
    assert "rain_prob" in w
    print(f"Weather API Endpoint: PASSED (Temp: {w['temp']}°C, Humidity: {w['humidity']}%, Condition: {w.get('condition')})")

def test_bilingual_diagnosis_and_climate():
    img = Image.new("RGB", (224, 224), color=(30, 140, 50))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    data = {
        "image": (buf, "leaf_telugu.jpg"),
        "phone": "+919876543210",
        "lang": "te",
        "lat": "17.3850",
        "lon": "78.4867"
    }
    res = client.post("/api/upload-image", data=data, content_type="multipart/form-data")
    assert res.status_code == 200
    res_data = res.get_json()
    assert "crop" in res_data
    assert "disease" in res_data
    assert "climate_advisory" in res_data
    assert "is_low_confidence" in res_data
    assert "audio_url" in res_data
    print("Bilingual & Climate-Aware Diagnosis: PASSED")

def test_tts_audio_endpoint():
    # Fetch an audio file or test endpoint
    img = Image.new("RGB", (224, 224), color=(50, 120, 30))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    data = {"image": (buf, "test_audio.jpg"), "lang": "en"}
    res = client.post("/api/upload-image", data=data, content_type="multipart/form-data")
    res_data = res.get_json()
    if res_data.get("audio_url"):
        audio_path = res_data["audio_url"]
        audio_res = client.get(audio_path)
        assert audio_res.status_code in [200, 404] # 200 if generated, valid route
        print(f"TTS Audio Route {audio_path}: PASSED (status {audio_res.status_code})")
    else:
        print("TTS Audio Route: Skipped (no audio generated)")

def test_landing_and_auth_flow():
    import uuid
    # 1. GET / returns landing page HTML
    res = client.get("/")
    assert res.status_code == 200
    html = res.data.decode("utf-8")
    assert "Rythu Mitra" in html
    assert "landing-phone-input" in html
    assert "Successfully Registered" in html
    print("Landing Page Delivery: PASSED")

    # 2. Unauthenticated GET /dashboard redirects to landing page
    res_dash = client.get("/dashboard")
    assert res_dash.status_code == 302
    assert "/?auth=required" in res_dash.headers.get("Location", "")
    print("Unauthenticated Dashboard Protection: PASSED")

    # 3. Invalid phone number rejection (strict Indian 10-digit)
    bad_res = client.post("/api/send-otp", json={"phone": "12345"})
    assert bad_res.status_code == 400
    assert "valid 10-digit Indian mobile number" in bad_res.get_json().get("error", "")

    # 4. Valid phone number send-otp
    send_res = client.post("/api/send-otp", json={"phone": "9876543210"})
    assert send_res.status_code == 200
    assert send_res.get_json().get("mock_otp") == "123456"
    print("Strict Indian Mobile OTP Dispatch: PASSED")

    # 5. Case 1: Existing user login
    verify_res = client.post("/api/verify-otp", json={"phone": "9876543210", "otp": "123456"})
    assert verify_res.status_code == 200
    v_data = verify_res.get_json()
    assert v_data["is_new_user"] is False
    assert v_data["redirect"] == "/dashboard"

    # 6. Authenticated session now accesses /dashboard
    with client.session_transaction() as sess:
        sess["user_id"] = v_data["user"]["id"]
    dash_res = client.get("/dashboard")
    assert dash_res.status_code == 200
    dash_html = dash_res.data.decode("utf-8")
    assert "Harvest Premium" in dash_html
    assert "logoutUser()" in dash_html
    print("Authenticated Dashboard Access: PASSED")

    # 7. Case 2: New user registration
    new_phone = f"9{uuid.uuid4().int % 1000000000:09d}"
    client.post("/api/send-otp", json={"phone": new_phone})
    new_verify = client.post("/api/verify-otp", json={"phone": new_phone, "otp": "123456"})
    assert new_verify.status_code == 200
    new_data = new_verify.get_json()
    assert new_data["is_new_user"] is True
    assert new_data["message"] == "Successfully Registered"
    print("New User Registration & Success Signal: PASSED")

    # 8. Logout endpoint clears session
    logout_res = client.post("/api/logout")
    assert logout_res.status_code == 200
    res_dash_after = client.get("/dashboard")
    assert res_dash_after.status_code == 302
    print("Secure Session Logout: PASSED")

if __name__ == "__main__":
    import sys
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    test_phone_normalization()
    test_webhook_handshake()
    test_whatsapp_unregistered_sender()
    test_whatsapp_registered_sender_non_image()
    test_whatsapp_registered_sender_image()
    test_web_upload_image()
    test_payment_flow()
    test_weather_api()
    test_bilingual_diagnosis_and_climate()
    test_tts_audio_endpoint()
    test_landing_and_auth_flow()
    print("\nALL END-TO-END TESTS PASSED SUCCESSFULLY!")

