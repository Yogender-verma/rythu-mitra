import re
from typing import Dict, Any, Optional


def clean_telugu_for_tts(text: str) -> str:
    """
    Transforms any English acronyms, measurements, brands, and Latin characters
    into natural, pure phonetic Telugu pronunciation so that Google TTS speaks 100% pure Telugu
    without pronouncing even a single English word or letter.
    """
    if not text:
        return ""
    replacements = [
        # Agro-chemical formulations & institutions
        (r'\bWP\b', 'పౌడర్'),
        (r'\bEC\b', 'ద్రవం'),
        (r'\bSC\b', 'ద్రావణం'),
        (r'\bSP\b', 'పొడి'),
        (r'\bSL\b', 'ద్రావణం'),
        (r'\bWDG\b', 'కరిగే నూకలు'),
        (r'\bppm\b', 'భాగాలు'),
        (r'\bPPM\b', 'భాగాలు'),
        (r'\bNPK\b', 'ఎరువులు'),
        (r'\bPJTSAU\b', 'తెలంగాణ వ్యవసాయ విశ్వవిద్యాలయం'),
        (r'\bAEO\s*అధికారి(?:ని)?\b', 'వ్యవసాయ అధికారిని'),
        (r'\bAEO\b', 'వ్యవసాయ అధికారి'),
        
        # Product brands and terms
        (r'\bBlitox\s*50\b', 'బ్లైటాక్స్'),
        (r'\bBlitox\b', 'బ్లైటాక్స్'),
        (r'\bBavistin\b', 'బావిస్టిన్'),
        (r'\bPlantomycin\b', 'ప్లాంటోమైసిన్'),
        (r'\bContaf\s*Plus\b', 'కాంటాఫ్ ప్లస్'),
        (r'\bContaf\b', 'కాంటాఫ్'),
        (r'\bPlus\b', 'ప్లస్'),
        (r'\bAmistar\b', 'అమిస్టార్'),
        (r'\bSaaf\b', 'సాఫ్'),
        (r'\bFormula-4\b', 'ఫార్ములా నాలుగు'),
        (r'\bFormula 4\b', 'ఫార్ములా నాలుగు'),
        (r'\bM-45\b', 'నలభై ఐదు'),
        (r'\bM45\b', 'నలభై ఐదు'),
        (r'\bDithane\b', 'డైథేన్'),
        (r'\bIndofil\b', 'ఇండోఫిల్'),
        (r'\bConfidor\b', 'కాన్ఫిడార్'),
        (r'\bOmite\b', 'ఓమైట్'),
        (r'\bStreptocycline\b', 'స్ట్రెప్టోసైక్లిన్'),
        (r'\bCopper\s*Oxychloride\b', 'కాపర్ ఆక్సిక్లోరైడ్'),
        (r'\bCarbendazim\b', 'కార్బెండజిమ్'),
        (r'\bMancozeb\b', 'మ్యాంకోజెబ్'),
        (r'\bHexaconazole\b', 'హెక్సాకొనజోల్'),
        (r'\bAzoxystrobin\b', 'అజాక్సీస్ట్రోబిన్'),
        
        # Units and measurements
        (r'(\d+)\s*g/L', r'\1 గ్రాములు లీటరు నీటికి'),
        (r'(\d+)\s*ml/L', r'\1 మిల్లీలీటర్లు లీటరు నీటికి'),
        (r'(\d+)\s*మి\.లీ', r'\1 మిల్లీలీటర్లు'),
        (r'(\d+)\s*గ్రా(?:\.|\b)(?!ములు|ము)', r'\1 గ్రాములు'),
        (r'(\d+)%', r'\1 శాతం'),
        (r'°C', 'డిగ్రీల సెల్సియస్'),
        
        # Connectors and brackets
        (r'[#@*~_`\+]', ' మరియు '),
        (r'[\[\]\(\)]', ' '),
    ]
    res = text
    for pattern, repl in replacements:
        res = re.sub(pattern, repl, res, flags=re.IGNORECASE)
    # Strip any remaining Latin characters completely to guarantee 100% pure Telugu audio
    res = re.sub(r'[A-Za-z]+', '', res)
    res = re.sub(r'\s+', ' ', res).strip()
    return res

def clean_english_for_tts(text: str) -> str:
    """
    Cleans and standardizes English text for clear audio pronunciation.
    Removes any Telugu characters and expands common acronyms for natural speech.
    """
    if not text:
        return ""
    # Strip any accidental Telugu characters
    res = re.sub(r'[\u0c00-\u0c7f]+', '', text)
    # Expand common abbreviations for speech clarity
    res = re.sub(r'\bWP\b', 'Wettable Powder', res)
    res = re.sub(r'\bEC\b', 'Emulsifiable Concentrate', res)
    res = re.sub(r'\bSC\b', 'Suspension Concentrate', res)
    res = re.sub(r'\bSP\b', 'Soluble Powder', res)
    res = re.sub(r'\bppm\b', 'parts per million', res, flags=re.IGNORECASE)
    res = re.sub(r'\bPJTSAU\b', 'Jayashankar Agricultural University', res)
    res = re.sub(r'\bAEO\b', 'Agricultural Extension Officer', res)
    res = re.sub(r'(\d+)\s*g/L(?:\s*water)?', r'\1 grams per liter of water', res)
    res = re.sub(r'(\d+)\s*ml/L(?:\s*water)?', r'\1 milliliters per liter of water', res)
    res = re.sub(r'(\d+)\s*g/acre', r'\1 grams per acre', res)
    res = re.sub(r'(\d+)\s*ml/acre', r'\1 milliliters per acre', res)
    res = re.sub(r'[#*~_`]', ' ', res)
    res = re.sub(r'\s+', ' ', res).strip()
    return res

class AdvisoryEngine:
    """
    Contextual Advisory Rule & Knowledge Engine for RythuMitra AI.
    
    Uses pre-verified agricultural recommendations from Professor Jayashankar Telangana State
    Agricultural University (PJTSAU) guidelines based on crop, disease, crop stage, and live weather.
    Includes visual medicine / pesticide packaging illustrations for smallholder farmer clarity.
    """

    KNOWLEDGE_BASE = {
        "Cotton": {
            "Cotton_Bacterial_Blight": {
                "disease_en": "Bacterial Blight (Xanthomonas malvacearum)",
                "disease_te": "ప్రత్తి బ్యాక్టీరియల్ ఆకు మచ్చ తెగులు",
                "risk_level": "High",
                "season_en": "Kharif / Monsoon Season (July - October)",
                "season_te": "ఖరీఫ్ / వర్షాకాలం (జూలై - అక్టోబర్)",
                "why_en": "High relative humidity (>75%), frequent rains, and warm temperatures (28-32°C) create ideal conditions for Xanthomonas bacteria to multiply and spread through water droplets.",
                "why_te": "అధిక గాలి తేమ (75% పైన), వర్షపు నీటి తుంపరలు మరియు వేడి వాతావరణం (28-32°C) వల్ల ఈ బ్యాక్టీరియా వేగంగా వ్యాప్తి చెందుతుంది.",
                "actions_en": "1. Remove and destroy severely infected leaves away from the field.\n2. Avoid sprinkler irrigation to prevent leaf wetness.\n3. Spray Copper Oxychloride @ 3g/L + Streptocycline @ 0.1g/L of water.\n4. Repeat after 10-12 days if wet weather continues.",
                "actions_te": "1. తెగులు బాగా సోకిన ఆకులను ఏరివేసి కాల్చివేయండి.\n2. ఆకులపై ఎక్కువసేపు నీరు నిల్వ ఉండకుండా నీటి యాజమాన్యం చేపట్టండి.\n3. లీటరు నీటికి కాపర్ ఆక్సిక్లోరైడ్ 3 గ్రాములు + స్ట్రెప్టోసైక్లిన్ 0.1 గ్రాము కలిపి పిచికారీ చేయండి.\n4. వర్షాలు కొనసాగితే 10-12 రోజుల తర్వాత మళ్ళీ పిచికారీ చేయండి.",
                "dosage_en": "Copper Oxychloride 50% WP: 3g/L water (600g/acre) + Streptocycline: 0.1g/L water (20g/acre).",
                "dosage_te": "కాపర్ ఆక్సిక్లోరైడ్ 50% WP: లీటరు నీటికి 3 గ్రాములు (ఎకరాకు 600 గ్రా) + స్ట్రెప్టోసైక్లిన్: లీటరు నీటికి 0.1 గ్రాము (ఎకరాకు 20 గ్రా).",
                "safety_notes_en": "Wear mask and gloves during spraying. Postpone spraying if rain is expected within 4 hours.",
                "safety_notes_te": "మందుల పిచికారీ సమయంలో మాస్క్, గ్లౌజులు ధరించండి. వర్షం పడే సూచన ఉంటే పిచికారీ వాయిదా వేయండి.",
                "medicine_name_en": "Copper Oxychloride 50% WP (Blitox)",
                "medicine_name_te": "కాపర్ ఆక్సిక్లోరైడ్ 50% WP (బ్లైటాక్స్)",
                "medicine_image": "/images/copper_oxychloride.svg",
                "medicine_type_en": "Bactericide & Contact Fungicide",
                "medicine_type_te": "బాక్టీరియా & రక్షణ శిలీంధ్ర నాశిని"
            },
            "Cotton_Fusarium_Wilt": {
                "disease_en": "Fusarium Wilt (Fusarium oxysporum f. sp. vasinfectum)",
                "disease_te": "ప్రత్తి ఫ్యుసేరియం ఎండు తెగులు / వాడి తెగులు",
                "risk_level": "High",
                "season_en": "Kharif Season (Vegetative to Flowering)",
                "season_te": "ఖరీఫ్ కాలం (శాకీయ దశ నుండి పూత దశ వరకు)",
                "why_en": "Soil-borne fungus invades the vascular system through roots, blocking water and nutrient translocation, leading to vein clearing, yellowing, and sudden wilting.",
                "why_te": "నేలలోని ఫ్యుసేరియం సిలీంధ్రం వేర్ల ద్వారా ప్రవేశించి మొక్క నాళికా వ్యవస్థను మూసివేయడం వల్ల ఆకులు పసుపు రంగులోకి మారి మొక్కలు నిలువునా ఎండిపోతాయి.",
                "actions_en": "1. Drench root zones of affected and surrounding plants with Carbendazim 50% WP @ 1g/L or Copper Oxychloride @ 3g/L.\n2. Apply Trichoderma viride enriched farm yard manure (FYM) around root zones.\n3. Avoid water stagnation and ensure proper field drainage channels.",
                "actions_te": "1. తెగులు సోకిన మరియు చుట్టుపక్కల మొక్కల కుదుళ్ల వద్ద లీటరు నీటికి కార్బెండజిమ్ 1 గ్రాము లేదా కాపర్ ఆక్సిక్లోరైడ్ 3 గ్రాములు కలిపి నేల తడిసేలా పోయండి.\n2. పశువుల ఎరువుతో కలిపిన ట్రైకోడెర్మా విరిడే జీవ శిలీంధ్ర నాశినిని వేర్ల వద్ద వేయండి.\n3. పొలంలో నీరు నిల్వ ఉండకుండా తగిన మురుగు నీటి కాల్వలు తీయండి.",
                "dosage_en": "Carbendazim 50% WP: 1g/L water or Copper Oxychloride 50% WP: 3g/L water for soil drenching.",
                "dosage_te": "కార్బెండజిమ్ 50% WP: లీటరు నీటికి 1 గ్రాము లేదా కాపర్ ఆక్సిక్లోరైడ్ 50% WP: లీటరు నీటికి 3 గ్రాములు చొప్పున కుదుళ్ల వద్ద పోయండి.",
                "safety_notes_en": "Avoid excess nitrogenous fertilizer which increases susceptibility. Rotate with non-host crops like sorghum or maize in subsequent seasons.",
                "safety_notes_te": "యూరియా ఎరువును ఎక్కువగా వాడవద్దు. తెగులు ఉధృతి తగ్గించడానికి తదుపరి పంటగా జొన్న లేదా మొక్కజొన్నను సాగు చేయండి.",
                "medicine_name_en": "Carbendazim 50% WP (Bavistin)",
                "medicine_name_te": "కార్బెండజిమ్ 50% WP (బావిస్టిన్)",
                "medicine_image": "/images/carbendazim.svg",
                "medicine_type_en": "Systemic Fungicide Drench",
                "medicine_type_te": "దైహిక శిలీంధ్ర నాశిని"
            },
            "Cotton_Diseased_Plant": {
                "disease_en": "Cotton Wilt / Root-Rot Complex",
                "disease_te": "ప్రత్తి సిలీంధ్ర వేరు కుళ్ళు / వాడి తెగులు",
                "risk_level": "High",
                "season_en": "Kharif Season (August - November)",
                "season_te": "ఖరీఫ్ కాలం (ఆగస్టు - నవంబర్)",
                "why_en": "Poor soil drainage, excessive soil moisture, and fungal soil pathogens cause root vascular clogging, leading to yellowing and wilting.",
                "why_te": "పొలంలో నీరు ఇంకిపోకపోవడం, తేమ ఎక్కువ కావడం వల్ల వేరు వ్యవస్థ దెబ్బతిని మొక్కలు వాడిపోతాయి.",
                "actions_en": "1. Ensure clean surface drainage channels in the field.\n2. Drench plant base with Carbendazim @ 1g/L of water.\n3. Apply Trichoderma viride bio-fungicide mixed with neem cake near root zone.",
                "actions_te": "1. పొలంలో నీరు నిల్వ ఉండకుండా మురుగు కాలువలు తీయండి.\n2. మొక్క మొదళ్ళలో కార్బెండజిమ్ 1 గ్రాము లీటరు నీటికి కలిపి కుదుళ్ళు తడిసేలా పోయండి.\n3. వేపపిండితో కలిపిన ట్రైకోడెర్మా విరిడే సిలీంధ్ర నాశినిని వేర్ల వద్ద అందించండి.",
                "dosage_en": "Carbendazim 50% WP: 1g/L water drenching around plant basin.",
                "dosage_te": "కార్బెండజిమ్ 50% WP: లీటరు నీటికి 1 గ్రాము చొప్పున కుదుళ్ళ వద్ద పోయండి.",
                "safety_notes_en": "Do not mix chemical fungicides directly with bio-agents.",
                "safety_notes_te": "జీవ సిలీంధ్ర నాశినులను రసాయనిక మందులతో నేరుగా కలపవద్దు.",
                "medicine_name_en": "Carbendazim 50% WP (Bavistin)",
                "medicine_name_te": "కార్బెండజిమ్ 50% WP (బావిస్టిన్)",
                "medicine_image": "/images/carbendazim.svg",
                "medicine_type_en": "Root-Zone Antifungal Drench",
                "medicine_type_te": "వేరు కుళ్ళు నివారణ ద్రవణం"
            },
            "Cotton_Leaf_Curl": {
                "disease_en": "Cotton Leaf Curl Virus (CLCuV)",
                "disease_te": "ప్రత్తి ఆకు ముడుత వైరస్ తెగులు",
                "risk_level": "High",
                "season_en": "Early Kharif (July - September)",
                "season_te": "ప్రారంభ ఖరీఫ్ (జూలై - సెప్టెంబర్)",
                "why_en": "Transmitted primarily by the whitefly vector (Bemisia tabaci) during warm, humid spells with low rainfall.",
                "why_te": "తెల్ల ఈగ పురుగు ద్వారా ఈ వైరస్ తెగులు ఒక మొక్క నుండి మరొక మొక్కకు వేగంగా వ్యాపిస్తుంది.",
                "actions_en": "1. Install yellow sticky traps (10-15 per acre) to monitor and catch whiteflies.\n2. Remove heavily stunted infected plants.\n3. Spray Neem Oil 10,000 ppm @ 2 ml/L or Acetamiprid 20% SP @ 0.2g/L of water.",
                "actions_te": "1. తెల్ల ఈగ నివారణకు ఎకరాకు 10-15 పసుపు రంగు జిగురు అట్టలను ఏర్పాటు చేయండి.\n2. వైరస్ సోకిన మొక్కలను పీకి నాశనం చేయండి.\n3. వేప నూనె 10,000 ppm లీటరు నీటికి 2 మి.లీ లేదా ఎసిటామిప్రిడ్ 20% SP 0.2 గ్రాములు పిచికారీ చేయండి.",
                "dosage_en": "Neem Oil 10,000 ppm: 2 ml/L water or Acetamiprid 20% SP: 0.2g/L water (40g/acre).",
                "dosage_te": "వేప నూనె 10,000 ppm: లీటరు నీటికి 2 మి.లీ లేదా ఎసిటామిప్రిడ్ 20% SP: లీటరు నీటికి 0.2 గ్రా (ఎకరాకు 40 గ్రా).",
                "safety_notes_en": "Spray on lower leaf surfaces where whiteflies colonize.",
                "safety_notes_te": "తెల్ల ఈగలు ఆకుల అడుగు భాగాన ఉంటాయి కాబట్టి అడుగు భాగం తడిసేలా పిచికారీ చేయండి.",
                "medicine_name_en": "Neem Oil 10,000 PPM Bio-Pesticide",
                "medicine_name_te": "వేప నూనె 10,000 PPM (సేంద్రీయ రక్షణ)",
                "medicine_image": "/images/neem_oil.svg",
                "medicine_type_en": "Organic Botanical Insecticide",
                "medicine_type_te": "సేంద్రీయ కీటక నాశిని"
            },
            "Cotton_Healthy": {
                "disease_en": "Healthy Cotton Crop",
                "disease_te": "ఆరోగ్యకరమైన ప్రత్తి పైరు",
                "risk_level": "Low",
                "season_en": "Current Season Growth Phase",
                "season_te": "ప్రస్తుత పంట ఎదుగుదల కాలం",
                "why_en": "Optimal nutrient management, balanced irrigation, and healthy foliage development.",
                "why_te": "సమతుల్య ఎరువులు మరియు సరైన సంరక్షణ వల్ల పంట ఆరోగ్యంగా ఉంది.",
                "actions_en": "1. Continue regular field scouting for sucking pests.\n2. Apply recommended split dose of Nitrogen and Potash fertilizers.\n3. Maintain clean field borders.",
                "actions_te": "1. పొలాన్ని క్రమం తప్పకుండా పరిశీలిస్తూ రసం పీల్చే పురుగుల ఉనికిని గమనించండి.\n2. పంట దశను బట్టి నత్రజని, పొటాష్ ఎరువులను విడతలవారీగా అందించండి.\n3. పొలం గట్లను పరిశుభ్రంగా ఉంచండి.",
                "dosage_en": "Apply Urea @ 25 kg/acre + MOP @ 15 kg/acre during flowering/boll formation stage.",
                "dosage_te": "పూత మరియు కాయ దశలో ఎకరాకు 25 కేజీల యూరియా + 15 కేజీల పొటాష్ అందించండి.",
                "safety_notes_en": "Inspect under-surface of top leaves weekly.",
                "safety_notes_te": "వారానికి ఒకసారి లేత ఆకుల వెనుక భాగాన్ని గమనించండి.",
                "medicine_name_en": "Bio-NPK & Plant Vitalizer",
                "medicine_name_te": "బయో-NPK & పైరు పోషకాలు",
                "medicine_image": "/images/healthy_crop.svg",
                "medicine_type_en": "Balanced Crop Nutrition",
                "medicine_type_te": "సమతుల్య పంట పోషకాలు"
            }
        },
        "Paddy": {
            "Paddy_Bacterial_Leaf_Blight": {
                "disease_en": "Bacterial Leaf Blight (Xanthomonas oryzae)",
                "disease_te": "వరి బ్యాక్టీరియల్ ఆకు ఎండు తెగులు",
                "risk_level": "High",
                "season_en": "Kharif & Late Rabi (August - October, January - March)",
                "season_te": "ఖరీఫ్ మరియు చివరి రబీ (ఆగస్టు - అక్టోబర్)",
                "why_en": "Excessive Nitrogen fertilizer application, high humidity (>80%), and strong winds with rain cause bacterial entry through leaf margins and wounds.",
                "why_te": "అధిక నత్రజని (యూరియా) వాడకం, గాలిలో ఎక్కువ తేమ మరియు ఈదురు గాలులతో కూడిన వర్షాల వల్ల ఈ బ్యాక్టీరియా ఆకుల అంచుల గుండా ప్రవేశిస్తుంది.",
                "actions_en": "1. Temporarily drain out standing water from paddy fields.\n2. Reduce Nitrogen (Urea) application until symptoms recede.\n3. Spray Plantomycin @ 0.2g/L + Copper Oxychloride @ 2.5g/L of water.",
                "actions_te": "1. పొలంలో నీటిని తాత్కాలికంగా తీసివేసి ఆరబెట్టండి.\n2. తెగులు తగ్గేవరకు నత్రజని (యూరియా) వేయడం ఆపివేయండి.\n3. ప్లాంటోమైసిన్ 0.2 గ్రాములు + కాపర్ ఆక్సిక్లోరైడ్ 2.5 గ్రాములు లీటరు నీటికి కలిపి పిచికారీ చేయండి.",
                "dosage_en": "Plantomycin: 40g/acre + Copper Oxychloride: 500g/acre in 200 Liters of water.",
                "dosage_te": "ప్లాంటోమైసిన్: ఎకరాకు 40 గ్రాములు + కాపర్ ఆక్సిక్లోరైడ్: ఎకరాకు 500 గ్రాములు 200 లీటర్ల నీటిలో.",
                "safety_notes_en": "Avoid spraying during peak noon temperature.",
                "safety_notes_te": "మధ్యాహ్నం బాగా ఎండగా ఉన్న సమయంలో పిచికారీ చేయవద్దు.",
                "medicine_name_en": "Plantomycin Antibiotic Bactericide",
                "medicine_name_te": "ప్లాంటోమైసిన్ బాక్టీరియా నాశిని",
                "medicine_image": "/images/plantomycin.svg",
                "medicine_type_en": "Broad-Spectrum Antibiotic",
                "medicine_type_te": "వ్యవసాయ బాక్టీరియా నాశిని"
            },
            "Paddy_Brown_Spot": {
                "disease_en": "Brown Spot (Bipolaris oryzae / Helminthosporium)",
                "disease_te": "వరి గోధుమ రంగు మచ్చ తెగులు",
                "risk_level": "Medium",
                "season_en": "Kharif & Rabi (September - November)",
                "season_te": "ఖరీఫ్ మరియు రబీ కాలం (సెప్టెంబర్ - నవంబర్)",
                "why_en": "Nutritional deficiency (especially Potassium and Iron) in light soils combined with dew wetness and cloudy weather.",
                "why_te": "నేలలో పొటాష్ మరియు సూక్ష్మపోషకాల లోపం, ఆకులపై మంచు తేమ నిలిచి ఉండటం వల్ల ఈ సిలీంధ్ర మచ్చలు ఏర్పడతాయి.",
                "actions_en": "1. Apply balanced Potash fertilizer (MOP) to correct nutrient stress.\n2. Spray Mancozeb 75% WP @ 2g/L or Propiconazole 25% EC @ 1 ml/L of water.\n3. Ensure adequate field water management.",
                "actions_te": "1. నేలలో పొటాష్ లోపాన్ని సవరించడానికి ఎకరాకు పొటాష్ ఎరువును అందించండి.\n2. మ్యాంకోజెబ్ 75% WP 2 గ్రాములు లేదా ప్రొపికోనజోల్ 25% EC 1 మి.లీ లీటరు నీటికి కలిపి పిచికారీ చేయండి.\n3. పొలానికి క్రమం తప్పకుండా నీటి తడులు అందించండి.",
                "dosage_en": "Mancozeb 75% WP: 400g/acre or Propiconazole 25% EC: 200 ml/acre in 200L water.",
                "dosage_te": "మ్యాంకోజెబ్ 75% WP: ఎకరాకు 400 గ్రాములు లేదా ప్రొపికోనజోల్ 25% EC: ఎకరాకు 200 మి.లీ 200 లీటర్ల నీటిలో.",
                "safety_notes_en": "Ensure complete coverage of leaf canopy.",
                "safety_notes_te": "ఆకులన్నీ బాగా తడిసేలా పిచికారీ చేయండి.",
                "medicine_name_en": "Mancozeb 75% WP (Dithane M-45)",
                "medicine_name_te": "మ్యాంకోజెబ్ 75% WP (డైథేన్ M-45)",
                "medicine_image": "/images/mancozeb.svg",
                "medicine_type_en": "Broad-Spectrum Contact Fungicide",
                "medicine_type_te": "శిలీంధ్ర రక్షణ నాశిని"
            },
            "Paddy_Leaf_Smut": {
                "disease_en": "Leaf Smut (Entyloma oryzae)",
                "disease_te": "వరి ఆకు కాటుక తెగులు",
                "risk_level": "Medium",
                "season_en": "Late Kharif (October - November)",
                "season_te": "చలికాలం ప్రారంభం (అక్టోబర్ - నవంబర్)",
                "why_en": "Favored by high humidity, cool night temperatures, and excess vegetative growth in late crop stages.",
                "why_te": "రాత్రి వేళల్లో తక్కువ ఉష్ణోగ్రతలు, గాలిలో ఎక్కువ తేమ వల్ల ఆకులపై నల్లటి చారలతో కూడిన కాటుక మచ్చలు వస్తాయి.",
                "actions_en": "1. Avoid excessive late nitrogen top-dressing.\n2. Spray Copper Hydroxide @ 2g/L or Hexaconazole @ 2 ml/L of water.\n3. Maintain clean bunds.",
                "actions_te": "1. ఆలస్యంగా నత్రజని ఎరువులు వేయడం తగ్గించండి.\n2. కాపర్ హైడ్రాక్సైడ్ 2 గ్రాములు లేదా హెక్సాకొనజోల్ 2 మి.లీ లీటరు నీటికి కలిపి పిచికారీ చేయండి.\n3. పొలం గట్లపై కలుపు లేకుండా పరిశుభ్రంగా ఉంచండి.",
                "dosage_en": "Hexaconazole 5% EC: 2 ml per liter of water (400 ml/acre).",
                "dosage_te": "హెక్సాకొనజోల్ 5% EC: లీటరు నీటికి 2 మి.లీ (ఎకరాకు 400 మి.లీ).",
                "safety_notes_en": "Use clean water for preparing chemical spray mixture.",
                "safety_notes_te": "పిచికారీకి పరిశుభ్రమైన నీటిని మాత్రమే వాడండి.",
                "medicine_name_en": "Hexaconazole 5% EC (Contaf Plus)",
                "medicine_name_te": "హెక్సాకొనజోల్ 5% EC (కాంటాఫ్ ప్లస్)",
                "medicine_image": "/images/hexaconazole.svg",
                "medicine_type_en": "Systemic Protective Fungicide",
                "medicine_type_te": "దైహిక శిలీంధ్ర నాశిని"
            },
            "Paddy_Healthy": {
                "disease_en": "Healthy Paddy Crop",
                "disease_te": "ఆరోగ్యకరమైన వరి పైరు",
                "risk_level": "Low",
                "season_en": "Current Season Growth Phase",
                "season_te": "ప్రస్తుత పంట ఎదుగుదల కాలం",
                "why_en": "Proper water depth, optimal tillering, and healthy green leaf sheath development.",
                "why_te": "తగినంత నీటి మట్టం మరియు పోషకాల యాజమాన్యం వల్ల పైరు పచ్చగా ఆరోగ్యంగా ఉంది.",
                "actions_en": "1. Maintain 2-5 cm shallow water depth during tillering and panicle initiation.\n2. Monitor for stem borer and BPH pest activity.\n3. Apply Potash @ 15 kg/acre at booting stage.",
                "actions_te": "1. పిలకలు తొడిగే మరియు చిరుపొట్ట దశలో 2-5 సెం.మీ నీటి మట్టం నిర్వహించండి.\n2. కాండం తొలిచే పురుగు మరియు సుడి దోమ ఉనికిని గమనించండి.\n3. చిరుపొట్ట దశలో ఎకరాకు 15 కేజీల పొటాష్ ఎరువు వేయండి.",
                "dosage_en": "Apply MOP (Muriate of Potash) @ 15 kg/acre at booting stage.",
                "dosage_te": "చిరుపొట్ట దశలో ఎకరాకు 15 కేజీల పొటాష్ అందించండి.",
                "safety_notes_en": "Alternate wetting and drying practice saves water and promotes root health.",
                "safety_notes_te": "మడిని ఆరబెడుతూ తడులు ఇవ్వడం వల్ల వేర్లు దృఢంగా పెరుగుతాయి.",
                "medicine_name_en": "Muriate of Potash (MOP) & Micronutrients",
                "medicine_name_te": "పొటాష్ & సూక్ష్మపోషకాలు",
                "medicine_image": "/images/healthy_crop.svg",
                "medicine_type_en": "Grain Filling Nutrient Support",
                "medicine_type_te": "గింజ గట్టిపడటానికి పోషకాలు"
            }
        },
        "Chilli": {
            "Chilli_Bacterial_Spot": {
                "disease_en": "Bacterial Leaf Spot (Xanthomonas vesicatoria)",
                "disease_te": "మిర్చి బ్యాక్టీరియల్ ఆకు మచ్చ తెగులు",
                "risk_level": "High",
                "season_en": "Kharif & Post-Monsoon (August - December)",
                "season_te": "ఖరీఫ్ మరియు వర్షాకాలం తర్వాత (ఆగస్టు - డిసెంబర్)",
                "why_en": "High humidity (>80%), rain splashes, and warm days spread bacterial spores causing dark water-soaked spots on leaves and pods.",
                "why_te": "వర్షపు నీటి తుంపరలు, గాలిలో తేమ ఎక్కువగా ఉండటం వల్ల ఈ మచ్చల తెగులు ఆకులు మరియు కాయలకు వేగంగా సోకుతుంది.",
                "actions_en": "1. Remove affected leaves and fallen spotted fruits.\n2. Avoid furrow flood irrigation that spreads bacteria.\n3. Spray Copper Oxychloride @ 3g/L + Streptocycline @ 0.1g/L of water.\n4. Repeat spray after 10 days.",
                "actions_te": "1. తెగులు సోకిన ఆకులను, రాలిన కాయలను ఏరివేసి నాశనం చేయండి.\n2. పొలంలో నీరు పారించేటప్పుడు చైన్ నీటి పారుదల వద్దండి.\n3. కాపర్ ఆక్సిక్లోరైడ్ 3 గ్రాములు + స్ట్రెప్టోసైక్లిన్ 0.1 గ్రాము లీటరు నీటికి కలిపి పిచికారీ చేయండి.\n4. 10 రోజుల తర్వాత మళ్ళీ పిచికారీ చేయండి.",
                "dosage_en": "Copper Oxychloride 50% WP: 3g/L (600g/acre) + Streptocycline: 0.1g/L (20g/acre).",
                "dosage_te": "కాపర్ ఆక్సిక్లోరైడ్ 50% WP: లీటరు నీటికి 3 గ్రా (ఎకరాకు 600 గ్రా) + స్ట్రెప్టోసైక్లిన్: లీటరు నీటికి 0.1 గ్రా (ఎకరాకు 20 గ్రా).",
                "safety_notes_en": "Avoid spraying during strong winds.",
                "safety_notes_te": "గాలి తీవ్రత ఎక్కువగా ఉన్నప్పుడు పిచికారీ చేయవద్దు.",
                "medicine_name_en": "Copper Oxychloride 50% WP (Blitox)",
                "medicine_name_te": "కాపర్ ఆక్సిక్లోరైడ్ 50% WP (బ్లైటాక్స్)",
                "medicine_image": "/images/copper_oxychloride.svg",
                "medicine_type_en": "Protective Bactericide & Fungicide",
                "medicine_type_te": "రక్షణ బాక్టీరియా నాశిని"
            },
            "Chilli_Healthy": {
                "disease_en": "Healthy Chilli Crop",
                "disease_te": "ఆరోగ్యకరమైన మిర్చి పైరు",
                "risk_level": "Low",
                "season_en": "Current Season Growth Phase",
                "season_te": "ప్రస్తుత పంట ఎదుగుదల కాలం",
                "why_en": "Good soil aeration, balanced micronutrients, and effective thrips/mite management.",
                "why_te": "తగినంత తేమ, సూక్ష్మపోషకాల లభ్యత వల్ల మిర్చి తోట ఆరోగ్యంగా ఎదుగుతోంది.",
                "actions_en": "1. Install blue and yellow sticky traps (10 per acre) for thrips and whiteflies.\n2. Apply Micronutrient Mixture @ 5g/L during flowering.\n3. Ensure adequate drip irrigation.",
                "actions_te": "1. తామర పురుగులు, తెల్ల ఈగ కోసం ఎకరాకు 10 పసుపు, నీలి రంగు జిగురు అట్టలను ఏర్పాటు చేయండి.\n2. పూత దశలో సూక్ష్మపోషకాల మిశ్రమాన్ని లీటరు నీటికి 5 గ్రాముల చొప్పున పిచికారీ చేయండి.\n3. బిందు సేద్యం ద్వారా క్రమబద్ధంగా నీరు అందించండి.",
                "dosage_en": "Micronutrient Formula 4: 5g per liter of water during flowering and fruiting stage.",
                "dosage_te": "సూక్ష్మపోషకాల మిశ్రమం: పూత, కాయ దశలో లీటరు నీటికి 5 గ్రాములు.",
                "safety_notes_en": "Keep soil moist but not waterlogged.",
                "safety_notes_te": "నేలలో తేమ ఉండేలా చూడండి, వేర్ల వద్ద నీరు నిల్వ ఉండనివ్వకండి.",
                "medicine_name_en": "Telangana Ag Formula-4 Micronutrients",
                "medicine_name_te": "ఫార్ములా-4 సూక్ష్మపోషకాల మిశ్రమం",
                "medicine_image": "/images/micronutrient.svg",
                "medicine_type_en": "Flower & Pod Growth Booster",
                "medicine_type_te": "పూత, కాయ బలానికి పోషకాలు"
            }
        },
        "Maize": {
            "Maize_Common_Rust": {
                "disease_en": "Common Rust (Puccinia sorghi)",
                "disease_te": "మొక్కజొన్న సాధారణ తుప్పు తెగులు",
                "risk_level": "High",
                "season_en": "Rabi & Winter Season (November - February)",
                "season_te": "రబీ మరియు చలికాలం (నవంబర్ - ఫిబ్రవరి)",
                "why_en": "Cool temperatures (16-23°C), high humidity, and prolonged leaf dew enable rust fungal urediniospores to germinate on both leaf surfaces.",
                "why_te": "చలి వాతావరణం (16-23°C), గాలిలో తేమ మరియు రాత్రి పూట ఎక్కువ మంచు కురవడం వల్ల ఆకులపై ఇటుక ఎరుపు రంగు తుప్పు మచ్చలు ఏర్పడతాయి.",
                "actions_en": "1. Destroy infected crop residue after harvest.\n2. Spray Mancozeb 75% WP @ 2.5g/L or Propiconazole 25% EC @ 1 ml/L of water at first sign of rust pustules.\n3. Repeat after 12-14 days if cool damp weather continues.",
                "actions_te": "1. ఆకులపై ఇటుక ఎరుపు రంగు మచ్చలు కనిపించగానే పిచికారీ ప్రారంభించండి.\n2. మ్యాంకోజెబ్ 75% WP 2.5 గ్రాములు లేదా ప్రొపికోనజోల్ 25% EC 1 మి.లీ లీటరు నీటికి కలిపి పిచికారీ చేయండి.\n3. చలి, మంచు ఎక్కువ ఉంటే 12-14 రోజుల తర్వాత మళ్ళీ పిచికారీ చేయండి.",
                "dosage_en": "Mancozeb 75% WP: 500g/acre or Propiconazole 25% EC: 200 ml/acre in 200L water.",
                "dosage_te": "మ్యాంకోజెబ్ 75% WP: ఎకరాకు 500 గ్రాములు లేదా ప్రొపికోనజోల్ 25% EC: ఎకరాకు 200 మి.లీ 200 లీటర్ల నీటిలో.",
                "safety_notes_en": "Target spray on both upper and lower leaf surfaces.",
                "safety_notes_te": "ఆకు పై మరియు క్రింది భాగం తడిసేలా పిచికారీ చేయండి.",
                "medicine_name_en": "Mancozeb 75% WP (Dithane M-45)",
                "medicine_name_te": "మ్యాంకోజెబ్ 75% WP (డైథేన్ M-45)",
                "medicine_image": "/images/mancozeb.svg",
                "medicine_type_en": "Rust Protective Fungicide",
                "medicine_type_te": "తుప్పు తెగులు రక్షణ మందు"
            },
            "Maize_Gray_Leaf_Spot": {
                "disease_en": "Gray Leaf Spot (Cercospora zeae-maydis)",
                "disease_te": "మొక్కజొన్న బూడిద మచ్చ తెగులు",
                "risk_level": "Medium",
                "season_en": "Kharif & Late Kharif (August - October)",
                "season_te": "ఖరీఫ్ కాలం (ఆగస్టు - అక్టోబర్)",
                "why_en": "Warm, humid conditions with overcast foggy mornings encourage rectangular gray-brown fungal lesions along leaf veins.",
                "why_te": "వేడి వాతావరణం, మబ్బుగా ఉండటం వల్ల ఆకు ఈనెల మధ్య పొడవాటి బూడిద రంగు మచ్చలు ఏర్పడి ఆకులు త్వరగా ఎండిపోతాయి.",
                "actions_en": "1. Practice crop rotation with non-graminaceous crops.\n2. Spray Carbendazim 12% + Mancozeb 63% WP @ 2g/L of water.\n3. Avoid overcrowded plant spacing.",
                "actions_te": "1. పంట మార్పిడి పద్ధతులను పాటించండి.\n2. కార్బెండజిమ్ 12% + మ్యాంకోజెబ్ 63% WP లీటరు నీటికి 2 గ్రాముల చొప్పున పిచికారీ చేయండి.\n3. మొక్కల మధ్య గాలి వెలుతురు ప్రసరించేలా చూడండి.",
                "dosage_en": "Carbendazim + Mancozeb (Saaf): 400g per acre in 200L water.",
                "dosage_te": "సాఫ్ (కార్బెండజిమ్ + మ్యాంకోజెబ్): ఎకరాకు 400 గ్రాములు 200 లీటర్ల నీటిలో.",
                "safety_notes_en": "Do not harvest green cobs within 14 days of spraying.",
                "safety_notes_te": "పిచికారీ చేసిన 14 రోజుల వరకు పచ్చికంకులను కోయవద్దు.",
                "medicine_name_en": "Saaf Fungicide (Carbendazim + Mancozeb)",
                "medicine_name_te": "సాఫ్ శిలీంధ్ర నాశిని (కార్బెండజిమ్ + మ్యాంకోజెబ్)",
                "medicine_image": "/images/saaf_fungicide.svg",
                "medicine_type_en": "Dual-Action Contact & Systemic Fungicide",
                "medicine_type_te": "ద్విముఖ ప్రభావ శిలీంధ్ర నాశిని"
            },
            "Maize_Northern_Leaf_Blight": {
                "disease_en": "Northern Leaf Blight (Exserohilum turcicum)",
                "disease_te": "మొక్కజొన్న ఉత్తర ఆకు ఎండు తెగులు",
                "risk_level": "High",
                "season_en": "Kharif & Rabi (August - December)",
                "season_te": "ఖరీఫ్ మరియు రబీ (ఆగస్టు - డిసెంబర్)",
                "why_en": "Moderate temperatures (18-27°C) with high relative humidity and heavy dew formation lead to large cigar-shaped grayish lesions.",
                "why_te": "మితమైన ఉష్ణోగ్రత, రాత్రి మంచు ఎక్కువ కావడం వల్ల ఆకులపై పొడవాటి నావ ఆకారపు ఎండు మచ్చలు ఏర్పడతాయి.",
                "actions_en": "1. Collect and burn heavily affected lower leaves.\n2. Spray Mancozeb 75% WP @ 2.5g/L or Azoxystrobin 23% SC @ 1 ml/L of water.\n3. Apply balanced potassium to strengthen leaf tissue.",
                "actions_te": "1. కింద భాగంలో తెగులు సోకిన ఆకులను తీసివేసి నాశనం చేయండి.\n2. మ్యాంకోజెబ్ 75% WP 2.5 గ్రాములు లేదా అజాక్సీస్ట్రోబిన్ 23% SC 1 మి.లీ లీటరు నీటికి కలిపి పిచికారీ చేయండి.\n3. పైరు దృఢత్వానికి పొటాష్ ఎరువును అందించండి.",
                "dosage_en": "Azoxystrobin 23% SC: 200 ml/acre in 200L water or Mancozeb: 500g/acre.",
                "dosage_te": "అజాక్సీస్ట్రోబిన్ 23% SC: ఎకరాకు 200 మి.లీ లేదా మ్యాంకోజెబ్: ఎకరాకు 500 గ్రాములు 200 లీటర్ల నీటిలో.",
                "safety_notes_en": "Spray early at first symptom detection.",
                "safety_notes_te": "తెగులు మచ్చలు కనిపించిన వెంటనే తొలి దశలోనే పిచికారీ చేయండి.",
                "medicine_name_en": "Azoxystrobin 23% SC (Amistar)",
                "medicine_name_te": "అజాక్సీస్ట్రోబిన్ 23% SC (అమిస్టార్)",
                "medicine_image": "/images/azoxystrobin.svg",
                "medicine_type_en": "Curative & Preventive Strobilurin Fungicide",
                "medicine_type_te": "ఆకు ఎండు తెగులు నివారణ మందు"
            },
            "Maize_Healthy": {
                "disease_en": "Healthy Maize Crop",
                "disease_te": "ఆరోగ్యకరమైన మొక్కజొన్న పైరు",
                "risk_level": "Low",
                "season_en": "Current Season Growth Phase",
                "season_te": "ప్రస్తుత పంట ఎదుగుదల కాలం",
                "why_en": "Sturdy stalk development, optimal leaf nitrogen index, and clear cob formation.",
                "why_te": "మొక్క బలంగా ఎదుగుతోంది, ఆకులు పచ్చగా ఆరోగ్యంగా ఉన్నాయి.",
                "actions_en": "1. Apply top-dressing Nitrogen fertilizer during kneehigh and taselling stage.\n2. Monitor central leaf whorl for Fall Armyworm eggs.\n3. Ensure adequate moisture during cob filling.",
                "actions_te": "1. మోకాలు ఎత్తు మరియు పిలక దశలో ఎకరాకు నత్రజని ఎరువును వేయండి.\n2. కత్తెర పురుగు ఉనికి కోసం మొక్క సుడి భాగాన్ని పరిశీలించండి.\n3. కంకి తొడిగే దశలో నేలలో తగినంత తేమ ఉండేలా చూడండి.",
                "dosage_en": "Urea: 35 kg/acre during knee-high stage + MOP: 15 kg/acre during flowering.",
                "dosage_te": "మోకాలు ఎత్తు దశలో ఎకరాకు 35 కేజీల యూరియా + 15 కేజీల పొటాష్ అందించండి.",
                "safety_notes_en": "Maintain clean field margins.",
                "safety_notes_te": "పొలం గట్లపై కలుపు లేకుండా చూడండి.",
                "medicine_name_en": "Bio-NPK & Zinc Vitalizer",
                "medicine_name_te": "బయో-NPK & జింక్ పోషకాలు",
                "medicine_image": "/images/healthy_crop.svg",
                "medicine_type_en": "Balanced Vegetative Tonic",
                "medicine_type_te": "సమతుల్య మొక్కజొన్న బలానికి టానిక్"
            }
        }
    }

    @classmethod
    def get_advisory(
        cls,
        crop: str,
        disease_key: str,
        weather_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        crop_name = crop.capitalize() if crop else "Cotton"
        crop_kb = cls.KNOWLEDGE_BASE.get(crop_name, cls.KNOWLEDGE_BASE["Cotton"])
        
        # Match disease key or fallback
        info = crop_kb.get(disease_key)
        if not info:
            d_lower = disease_key.lower().replace("_", " ")
            for k, v in crop_kb.items():
                k_clean = k.lower().replace("_", " ")
                v_en = v.get("disease_en", "").lower()
                if (disease_key.lower() in k.lower() or 
                    k.lower() in disease_key.lower() or 
                    d_lower in v_en or 
                    v_en in d_lower or
                    ("bacterial" in d_lower and "bacterial" in k_clean) or
                    ("fusarium" in d_lower and "fusarium" in k_clean) or
                    ("wilt" in d_lower and "wilt" in k_clean) or
                    ("curl" in d_lower and "curl" in k_clean) or
                    ("blast" in d_lower and "blast" in k_clean) or
                    ("smut" in d_lower and "smut" in k_clean) or
                    ("brown" in d_lower and "brown" in k_clean) or
                    ("rust" in d_lower and "rust" in k_clean) or
                    ("blight" in d_lower and "blight" in k_clean) or
                    ("healthy" in d_lower and "healthy" in k_clean)):
                    info = v
                    break
        if not info:
            info = crop_kb.get(f"{crop_name}_Healthy", list(crop_kb.values())[0])

        is_healthy = "healthy" in disease_key.lower() or "healthy" in info.get("disease_en", "").lower()
        
        # Weather & Season Context
        w_avail = weather_info.get("is_weather_available", False) if weather_info else False
        w_temp = weather_info.get("temperature", "N/A") if weather_info else "N/A"
        w_hum = weather_info.get("humidity", "N/A") if weather_info else "N/A"
        w_cond_en = weather_info.get("condition", "Clear") if weather_info else "Clear"
        w_cond_te = weather_info.get("condition_telugu", "సాధారణ వాతావరణం") if weather_info else "సాధారణ వాతావరణం"

        weather_summary_en = f"📍 {weather_info.get('location_name', 'Telangana')} | 🌡️ {w_temp} | 💧 Humidity: {w_hum} ({w_cond_en})" if w_avail else "Live weather unavailable"
        weather_summary_te = f"📍 {weather_info.get('location_name', 'తెలంగాణ')} | 🌡️ {w_temp} | 💧 తేమ: {w_hum} ({w_cond_te})" if w_avail else "లైవ్ వాతావరణ సమాచారం అందుబాటులో లేదు"

        # Why Explanation
        why_en = info["why_en"]
        why_te = info["why_te"]
        if w_avail:
            why_en += f" Current live weather ({w_temp}, {w_hum} humidity, {w_cond_en}) directly influences this disease trajectory."
            why_te += f" ప్రస్తుతం ఉన్న వాతావరణం ({w_temp}, తేమ {w_hum}, {w_cond_te}) తెగులు తీవ్రత పై ప్రభావం చూపుతాయి."

        # Actions & Treatments
        actions_en = info["actions_en"]
        actions_te = info["actions_te"]

        # Crop name translation map
        crop_te_map = {
            "Cotton": "ప్రత్తి",
            "Rice": "వరి",
            "Paddy": "వరి",
            "Chilli": "మిర్చి",
            "Maize": "మొక్కజొన్న"
        }
        crop_te = crop_te_map.get(crop_name, crop_name)

        med_name_te = info.get("medicine_name_te", "వ్యవసాయ సిఫార్సు చేసిన మందు")
        med_type_te = info.get("medicine_type_te", "రక్షణ మందు")
        dosage_te = info.get("dosage_te", "")
        safety_te = info.get("safety_notes_te", "")

        med_name_en = info.get("medicine_name_en", "PJTSAU Recommended Formulation")
        med_type_en = info.get("medicine_type_en", "Agricultural Grade Treatment")
        dosage_en = info.get("dosage_en", "")
        safety_en = info.get("safety_notes_en", "")

        # COMPLETE AUDIO SOLUTION SCRIPT:
        # Includes full disease diagnosis, why it happened, action steps, recommended medicine/pesticide, dosage, and precautions.
        if is_healthy:
            raw_audio_te = (
                f"రైతు మిత్ర వ్యవసాయ నివేదిక. మీ {info['disease_te']}. ప్రస్తుతం ఎలాంటి తెగులు లక్షణాలు లేవు. "
                f"పంట యాజమాన్య సూచనలు: {actions_te}. "
                f"సిఫార్సు చేసిన పోషకాలు: {med_name_te}. "
                f"మోతాదు: {dosage_te}. "
                f"మంచి దిగుబడి కొరకు పొలాన్ని నిరంతరం గమనించండి."
            )
            raw_audio_en = (
                f"Rythu Mitra Crop Health Report. Your {info['disease_en']}. No active disease symptoms detected. "
                f"Crop management instructions: {actions_en}. "
                f"Recommended crop nutrition: {med_name_en}. "
                f"Prescribed dosage: {dosage_en}. "
                f"Keep monitoring field conditions regularly for optimal crop growth."
            )
        else:
            raw_audio_te = (
                f"రైతు మిత్ర వ్యవసాయ నివేదిక. పంట: {crop_te}. గుర్తించిన సమస్య: {info['disease_te']}. "
                f"వ్యాధి రావడానికి కారణం: {why_te}. "
                f"చేపట్టవలసిన చర్యలు: {actions_te}. "
                f"సిఫార్సు చేసిన మందు: {med_name_te}. రకం: {med_type_te}. "
                f"పిచికారీ మోతాదు: {dosage_te}. "
                f"ముఖ్యమైన జాగ్రత్తలు: {safety_te}."
            )
            raw_audio_en = (
                f"Rythu Mitra Crop Advisory Report. Crop: {crop_name}. Diagnosed condition: {info['disease_en']}. "
                f"Why this happened: {why_en}. "
                f"Immediate actions to take: {actions_en}. "
                f"Recommended treatment: {med_name_en}. Category: {med_type_en}. "
                f"Prescribed dosage: {dosage_en}. "
                f"Important safety precautions: {safety_en}."
            )

        # Strict monolingual cleaning: Zero foreign words or letters in either language
        audio_text_te = clean_telugu_for_tts(raw_audio_te)
        audio_text_en = clean_english_for_tts(raw_audio_en)

        return {
            "is_healthy": is_healthy,
            "disease_en": info["disease_en"],
            "disease_te": info["disease_te"],
            "risk_level": info["risk_level"],
            "season_en": info["season_en"],
            "season_te": info["season_te"],
            "why_en": why_en,
            "why_te": why_te,
            "actions_en": actions_en,
            "actions_te": actions_te,
            "dosage_en": info["dosage_en"],
            "dosage_te": info["dosage_te"],
            "safety_notes_en": info["safety_notes_en"],
            "safety_notes_te": info["safety_notes_te"],
            "medicine_name_en": info.get("medicine_name_en", "PJTSAU Recommended Formulation"),
            "medicine_name_te": info.get("medicine_name_te", "PJTSAU సిఫార్సు చేసిన మందు"),
            "medicine_image": info.get("medicine_image", "/images/copper_oxychloride.svg"),
            "medicine_type_en": info.get("medicine_type_en", "Agricultural Grade Treatment"),
            "medicine_type_te": info.get("medicine_type_te", "ధృవీకరించబడిన వ్యవసాయ చికిత్స"),
            "weather_summary_en": weather_summary_en,
            "weather_summary_te": weather_summary_te,
            "audio_text_te": audio_text_te,
            "audio_text_en": audio_text_en
        }

    @classmethod
    def get_low_confidence_advisory(cls, crop: str) -> Dict[str, Any]:
        return {
            "is_healthy": False,
            "is_low_confidence": True,
            "disease_en": "Unable to confidently identify the problem. Please capture a clearer image of the affected leaf.",
            "disease_te": "ఈ చిత్రాన్ని బట్టి వ్యాధిని ఖచ్చితంగా గుర్తించలేకపోయాము. దయచేసి ప్రభావిత ఆకును దగ్గరగా, స్పష్టమైన వెలుతురులో ఫోటో తీయండి.",
            "risk_level": "Unknown",
            "season_en": "N/A",
            "season_te": "వర్తించదు",
            "why_en": "The uploaded photo is blurry, improperly lit, or outside the trained disease classification boundaries.",
            "why_te": "అప్‌లోడ్ చేసిన ఫోటో స్పష్టంగా లేదు లేదా సరిపడా వెలుతురు లేదు. అందువల్ల ఖచ్చితమైన విశ్లేషణ సాధ్యపడలేదు.",
            "actions_en": "1. Move closer to the affected leaf.\n2. Ensure good natural sunlight daylighting.\n3. Keep your mobile camera steady and retake the photograph.",
            "actions_te": "1. వ్యాధి సోకిన ఆకుకు దగ్గరగా రండి.\n2. మంచి వెలుతురు ఉండేలా చూసుకోండి.\n3. ఫోటో స్పష్టంగా వచ్చేలా మళ్ళీ స్కాన్ చేయండి.",
            "dosage_en": "No chemical dosage recommended for low confidence scans.",
            "dosage_te": "ఖచ్చితమైన గుర్తింపు లేనిదే ఎలాంటి మందులు వాడవద్దు.",
            "safety_notes_en": "Consult your local Agricultural Officer (AEO) if symptoms persist.",
            "safety_notes_te": "సందేహాలు ఉంటే మీ సమీప వ్యవసాయ అధికారి (AEO)ని సంప్రదించండి.",
            "medicine_name_en": "Clear Image Required",
            "medicine_name_te": "స్పష్టమైన ఫోటో అవసరం",
            "medicine_image": "/images/healthy_crop.svg",
            "medicine_type_en": "No chemical application recommended",
            "medicine_type_te": "ఎలాంటి మందులు వాడవద్దు",
            "weather_summary_en": "N/A",
            "weather_summary_te": "వర్తించదు",
            "audio_text_te": clean_telugu_for_tts("రైతు మిత్ర వ్యవసాయ సూచన. ఈ చిత్రాన్ని బట్టి పంట వ్యాధిని ఖచ్చితంగా గుర్తించలేకపోయాము. దయచేసి మంచి వెలుతురులో ప్రభావిత ఆకును దగ్గరగా ఉంచి స్థిరంగా ఫోటో తీయండి. ఖచ్చితమైన నిర్ధారణ లేకుండా ఎలాంటి రసాయన మందులు పిచికారీ చేయవద్దు. సందేహాలు ఉంటే వ్యవసాయ అధికారిని సంప్రదించండి."),
            "audio_text_en": clean_english_for_tts("Rythu Mitra Advisory Notice. We could not confidently identify the crop condition from this image. Please hold your camera steady in good natural daylight and take a clear close-up photo of the affected leaf. Do not spray chemical pesticides without verified disease identification. Consult your local agricultural extension officer if symptoms continue.")
        }
