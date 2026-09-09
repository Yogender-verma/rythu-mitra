import urllib.request
import json
from typing import Optional
from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/weather", tags=["Weather"])

WEATHER_CODE_MAP = {
    0: ("Clear Sky", "నిర్మలమైన ఆకాశం"),
    1: ("Mainly Clear", "ప్రశాంతమైన వాతావరణం"),
    2: ("Partly Cloudy", "పాక్షికంగా మేఘావృతం"),
    3: ("Overcast", "మబ్బుగా ఉంది"),
    45: ("Foggy", "పొగమంచు"),
    48: ("Depositing Rime Fog", "దట్టమైన పొగమంచు"),
    51: ("Light Drizzle", "లేత జల్లులు"),
    53: ("Moderate Drizzle", "కుండపోత జల్లులు"),
    55: ("Dense Drizzle", "తుంపర వర్షం"),
    61: ("Slight Rain", "చినుకులు"),
    63: ("Moderate Rain", "మధ్యస్థ వర్షం"),
    65: ("Heavy Rain", "భారీ వర్షం"),
    80: ("Rain Showers", "వర్షపు జల్లులు"),
    81: ("Moderate Rain Showers", "భారీ జల్లులు"),
    82: ("Violent Rain Showers", "అతి భారీ వర్షం"),
    95: ("Thunderstorm", "ఉరుములతో కూడిన వర్షం"),
    96: ("Thunderstorm with Hail", "వడగండ్ల వాన")
}

def fetch_real_weather_and_location(lat: float, lon: float):
    headers = {'User-Agent': 'RythuMitra-AgriApp/1.0'}
    
    # 1. Open-Meteo Live Weather
    temperature = "N/A"
    humidity = "N/A"
    condition_en = "Clear"
    condition_te = "సాధారణ వాతావరణం"
    weather_code = 0
    
    try:
        w_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,weather_code"
        req = urllib.request.Request(w_url, headers=headers)
        with urllib.request.urlopen(req, timeout=4) as response:
            w_data = json.loads(response.read().decode('utf-8'))
            curr = w_data.get('current', {})
            temp_c = curr.get('temperature_2m')
            hum = curr.get('relative_humidity_2m')
            code = curr.get('weather_code', 0)
            
            if temp_c is not None:
                temperature = f"{round(temp_c)}°C"
            if hum is not None:
                humidity = f"{round(hum)}%"
                
            code_info = WEATHER_CODE_MAP.get(code, ("Partly Cloudy", "పాక్షికంగా మేఘావృతం"))
            condition_en, condition_te = code_info
            weather_code = code
    except Exception as e:
        print(f"[Weather API Warning] Open-Meteo query failed: {e}")

    # 2. Nominatim Reverse Geocoding
    location_name = "Telangana"
    try:
        g_url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
        req2 = urllib.request.Request(g_url, headers=headers)
        with urllib.request.urlopen(req2, timeout=4) as response2:
            g_data = json.loads(response2.read().decode('utf-8'))
            addr = g_data.get('address', {})
            town = addr.get('village') or addr.get('town') or addr.get('city') or addr.get('county') or addr.get('state_district')
            state = addr.get('state', 'Telangana')
            if town:
                location_name = f"{town}, {state}"
            else:
                location_name = g_data.get('display_name', 'Telangana, India').split(',')[0]
    except Exception as e:
        print(f"[Reverse Geocoding Warning] Nominatim query failed: {e}")

    is_available = (temperature != "N/A")
    return {
        "is_weather_available": is_available,
        "location_name": location_name,
        "temperature": temperature,
        "humidity": humidity,
        "condition": condition_en,
        "condition_telugu": condition_te,
        "weather_code": weather_code
    }

@router.get("")
def get_weather(
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    district: Optional[str] = Query("Karimnagar"),
    mandal: Optional[str] = Query("Choppadandi")
):
    if lat is not None and lon is not None:
        data = fetch_real_weather_and_location(lat, lon)
        if data["is_weather_available"]:
            return data

    # Fallback response if lat/lon not provided or network is down
    return {
        "is_weather_available": False,
        "location_name": f"{mandal}, {district}" if mandal else "Live Location Unavailable",
        "temperature": "N/A",
        "humidity": "N/A",
        "condition": "Live weather unavailable",
        "condition_telugu": "లైవ్ వాతావరణ సమాచారం అందుబాటులో లేదు",
        "weather_code": 0
    }
