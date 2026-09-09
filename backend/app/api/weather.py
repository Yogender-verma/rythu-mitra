from fastapi import APIRouter
import random

router = APIRouter(prefix="/api/weather", tags=["Weather"])

TELANGANA_DISTRICTS_WEATHER = {
    "Karimnagar": {"temp": "31°C", "humidity": "72%", "rain_prob": "45%", "condition": "Partly Cloudy", "condition_te": "పాక్షికంగా మేఘావృతం", "tip_en": "Rain is expected soon. Avoid unnecessary irrigation for your paddy field.", "tip_te": "త్వరలో వర్ష సూచన ఉంది. వరి పొలానికి అనవసర తడి పెట్టకండి."},
    "Warangal": {"temp": "32°C", "humidity": "68%", "rain_prob": "20%", "condition": "Sunny with clouds", "condition_te": "మేఘాలతో కూడిన ఎండ", "tip_en": "Good weather for spraying bio-pesticides on cotton in the evening.", "tip_te": "సాయంత్రం వేళ ప్రత్తిలో మందుల పిచికారీకి అనుకూల వాతావరణం."},
    "Khammam": {"temp": "33°C", "humidity": "75%", "rain_prob": "60%", "condition": "Scattered Showers", "condition_te": "జల్లులు పడే అవకాశం", "tip_en": "High humidity detected. Keep drain channels clear in chilli plots.", "tip_te": "గాలిలో తేమ ఎక్కువ. మిర్చి పొలంలో మురుగు కాల్వలను నిరంతరం గమనించండి."},
    "Nalgonda": {"temp": "34°C", "humidity": "62%", "rain_prob": "15%", "condition": "Clear Sky", "condition_te": "నిర్మలమైన ఆకాశం", "tip_en": "High sunlight intensity. Ensure adequate evening soil moisture.", "tip_te": "ఎండ తీవ్రత ఎక్కువగా ఉంది. సాయంత్రం తడి అందించండి."}
}

@router.get("")
def get_weather(district: str = "Karimnagar", mandal: str = "Choppadandi"):
    dist_info = TELANGANA_DISTRICTS_WEATHER.get(district, TELANGANA_DISTRICTS_WEATHER["Karimnagar"])
    return {
        "district": district,
        "mandal": mandal,
        "temperature": dist_info["temp"],
        "humidity": dist_info["humidity"],
        "rainfall_probability": dist_info["rain_prob"],
        "condition": dist_info["condition"],
        "condition_telugu": dist_info["condition_te"],
        "insight_en": dist_info["tip_en"],
        "insight_te": dist_info["tip_te"]
    }
