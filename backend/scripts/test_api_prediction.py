import os
import glob
import urllib.request
import json

def test_api():
    print("==================================================")
    print("        FASTAPI BACKEND ENDPOINT TEST             ")
    print("==================================================")

    test_images = glob.glob("dataset/test/*/*.*")
    if not test_images:
        print("No test images found.")
        return

    test_img = test_images[0]
    print(f"Uploading image: {test_img}")

    url = "http://127.0.0.1:8000/api/scans"

    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = []

    # Field: crop
    body.append(f"--{boundary}".encode('utf-8'))
    body.append('Content-Disposition: form-data; name="crop"'.encode('utf-8'))
    body.append(''.encode('utf-8'))
    body.append('Chilli'.encode('utf-8'))

    # Field: file
    with open(test_img, 'rb') as f:
        file_bytes = f.read()

    filename = os.path.basename(test_img)
    body.append(f"--{boundary}".encode('utf-8'))
    body.append(f'Content-Disposition: form-data; name="file"; filename="{filename}"'.encode('utf-8'))
    body.append('Content-Type: image/jpeg'.encode('utf-8'))
    body.append(''.encode('utf-8'))
    body.append(file_bytes)

    body.append(f"--{boundary}--".encode('utf-8'))
    body.append(''.encode('utf-8'))

    payload = b"\r\n".join(body)

    req = urllib.request.Request(url, data=payload, headers={
        "Content-Type": f"multipart/form-data; boundary={boundary}"
    })

    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode('utf-8'))
        print("\n--- FASTAPI API RESPONSE ---")
        print(f"HTTP Status: {res.status}")
        print(f"Scan ID: {data.get('id')}")
        print(f"Crop: {data.get('crop')}")
        print(f"Diagnosis Disease: {data['diagnosis'].get('disease')}")
        print(f"Diagnosis Confidence: {data['diagnosis'].get('confidence') * 100:.2f}%")
        print(f"Risk Level: {data['diagnosis'].get('risk_level')}")
        print(f"PJTSAU Recommendation: {data['advisory'].get('recommendation_en')[:100]}...")
        print("API TEST: PASS")
        print("==================================================\n")
    except Exception as e:
        print(f"API TEST FAILED: {e}")

if __name__ == "__main__":
    test_api()
