import sys
import requests
import json

sys.stdout.reconfigure(encoding='utf-8')

url = 'http://127.0.0.1:8000/api/scans'
sample_img = r'C:\Users\shara\Downloads\cotton\fussarium_wilt\3-Figure1-1.jpg'

with open(sample_img, 'rb') as f:
    files = {'file': ('sample.jpg', f, 'image/jpeg')}
    data = {'crop': 'Cotton', 'district': 'Warangal', 'mandal': 'Hanamkonda'}
    res = requests.post(url, data=data, files=files)

print("="*60)
print(f"HTTP Status: {res.status_code}")
d = res.json()
print("Diagnosis EN:", d.get('diagnosis'))
print("Advisory Disease:", d.get('advisory', {}).get('disease_en'))
print("Advisory Disease (TE):", d.get('advisory', {}).get('disease_te'))
print("Risk Level:", d.get('advisory', {}).get('risk_level'))
print("Advisory Dosage (EN):", d.get('advisory', {}).get('dosage_en'))
print("Advisory Dosage (TE):", d.get('advisory', {}).get('dosage_te'))
print("Audio URL:", d.get('audio_url'))
print("="*60)
