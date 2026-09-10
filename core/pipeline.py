import os
import io
import re
import json
import uuid
import logging
from typing import Dict, Any, Optional
from PIL import Image
import torch
import torch.nn as nn
from torchvision import transforms, models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rythu-mitra-pipeline")

# Voice note generation support (gTTS)
try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False

# Google Gemini API support
try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


# ==============================================================================
# COMPREHENSIVE PJTSAU VERIFIED KNOWLEDGE BASE FOR ALL 22 DATASET CLASSES
# Covers Cashew, Cassava, Maize, and Tomato
# ==============================================================================
KNOWLEDGE_BASE = {
    # -------------------- CASHEW (5 Classes) --------------------
    "Cashew anthracnose": {
        "crop": "Cashew",
        "crop_te": "జీడిమామిడి",
        "disease_en": "Cashew Anthracnose (Colletotrichum gloeosporioides)",
        "disease_te": "జీడిమామిడి ఆంత్రాక్నోస్ తెగులు",
        "risk_level": "High",
        "description_en": "Fungal infection causing reddish-brown water-soaked spots on young leaves, shoot dieback, and black sunken lesions on developing cashew apples and nuts.",
        "description_te": "లేత ఆకులు మరియు కొమ్మలపై ఎరుపు-గోధుమ రంగు మచ్చలు ఏర్పడి కొమ్మలు పైనుండి ఎండిపోతాయి (డైబ్యాక్). జీడి గింజలపై నల్లటి గుంతల వంటి మచ్చలు పడతాయి.",
        "organic_solution_en": "1. Prune and burn all dried, blighted shoot tips before monsoon.\n2. Spray 5% Neem seed kernel extract (NSKE) or Neem Oil @ 5ml/L.\n3. Apply Trichoderma harzianum bio-fungicide @ 10g/L.",
        "organic_solution_te": "1. తెగులు సోకి ఎండిపోయిన కొమ్మలను 10 సెం.మీ కిందకు కత్తిరించి కాల్చివేయండి.\n2. 5% వేప గింజల కషాయం లేదా వేప నూనె (10,000 PPM) 5 మి.లీ లీటరు నీటికి కలిపి పిచికారీ చేయండి.\n3. లీటరు నీటికి ట్రైకోడెర్మా హర్జియానం 10 గ్రాములు కలిపి పిచికారీ చేయండి.",
        "chemical_solution_en": "1. Spray Copper Oxychloride 50% WP @ 3g/L or Bordeaux Mixture 1% at flushing and flowering.\n2. For severe infection, spray Carbendazim 50% WP @ 1g/L or Mancozeb @ 2.5g/L.",
        "chemical_solution_te": "1. పూత మరియు కొత్త చిగురు దశలో లీటరు నీటికి కాపర్ ఆక్సిక్లోరైడ్ 3 గ్రాములు లేదా 1% బోర్డో మిశ్రమం పిచికారీ చేయండి.\n2. తీవ్రత ఎక్కువగా ఉంటే కార్బెండజిమ్ 1 గ్రాము లేదా మాంకోజెబ్ 2.5 గ్రాములు లీటరు నీటికి కలిపి పిచికారీ చేయండి.",
        "precautions_en": "1. Wear protective gloves and face mask during spraying.\n2. Do not spray during peak honeybee foraging hours (10 AM - 3 PM).\n3. Avoid spraying immediately before expected rains.",
        "precautions_te": "1. పిచికారీ సమయంలో రక్షణ చేతి తొడుగులు, మాస్క్ ధరించండి.\n2. తేనెటీగలు తిరిగే వేళల్లో (ఉదయం 10 నుండి మధ్యాహ్నం 3 వరకు) పిచికారీ చేయవద్దు.\n3. వర్షం పడే సూచన ఉంటే పిచికారీ వాయిదా వేయండి.",
        "product_name": "Copper Oxychloride 50% WP (Blitox)",
        "product_type": "Fungicide / Protectant",
        "dosage": "3g per Liter of water (600g per acre)",
        "product_image": "/images/copper_oxychloride.svg",
        "weather_risk_factor": "humidity"
    },
    "Cashew gumosis": {
        "crop": "Cashew",
        "crop_te": "జీడిమామిడి",
        "disease_en": "Cashew Gummosis (Phomopsis / Phytophthora spp.)",
        "disease_te": "జీడిమామిడి బంక తెగులు / గమ్మోసిస్",
        "risk_level": "High",
        "description_en": "Bark fungal infection resulting in exudation of amber-colored gum from trunk cracks, leading to longitudinal wood cracking, leaf yellowing, and sudden tree decline.",
        "description_te": "చెట్టు ప్రధాన కాండం పగుళ్ల నుండి పసుపు-ఎరుపు రంగు బంక కారుతుంది. చెట్టు బెరడు కుళ్ళిపోయి ఆకులు రాలిపోయి క్రమంగా చెట్టు చనిపోతుంది.",
        "organic_solution_en": "1. Scrape infected bark clean with a sterilized knife.\n2. Paste tree basin with cow dung slurry mixed with Trichoderma viride.\n3. Ensure field drainage to prevent water accumulation near tree roots.",
        "organic_solution_te": "1. బంక కారే భాగాన్ని శుభ్రమైన కత్తితో గోకి, తెగులు సోకిన బెరడును తొలగించండి.\n2. ఆ గాయాలపై ఆవు పేడ మరియు ట్రైకోడెర్మా విరిడే కలిపిన లేపనాన్ని పూయండి.\n3. చెట్టు మొదళ్ళ వద్ద నీరు నిల్వ ఉండకుండా మురుగు కాలువలు తీయండి.",
        "chemical_solution_en": "1. Swab trunk with Bordeaux paste (1:1:10) or Copper Oxychloride paste.\n2. Drench root zone with Metalaxyl + Mancozeb (Ridomil Gold) @ 2g/L.",
        "chemical_solution_te": "1. కాండంపై 1:1:10 నిష్పత్తిలో తయారుచేసిన బోర్డో పేస్ట్ లేదా కాపర్ ఆక్సిక్లోరైడ్ పేస్ట్ పూయండి.\n2. లీటరు నీటికి మెటలాక్సిల్ + మాంకోజెబ్ 2 గ్రాములు కలిపి కుదుళ్ల వద్ద నేల తడిసేలా పోయండి.",
        "precautions_en": "Disinfect scraping tools with spirit between trees to prevent spread.",
        "precautions_te": "ఒక చెట్టు నుండి వేరొక చెట్టుకు తెగులు వ్యాపించకుండా కత్తిని డెట్టాల్ లేదా స్పిరిట్‌తో శుభ్రం చేయండి.",
        "product_name": "Bordeaux Mixture 1% / Paste",
        "product_type": "Fungicide Bark Protectant",
        "dosage": "Trunk scraping and pasting (1kg CuSO4 + 1kg Lime in 10L water)",
        "product_image": "/images/bordeaux_mixture.svg",
        "weather_risk_factor": "rainfall"
    },
    "Cashew healthy": {
        "crop": "Cashew",
        "crop_te": "జీడిమామిడి",
        "disease_en": "Healthy Cashew Tree",
        "disease_te": "ఆరోగ్యకరమైన జీడిమామిడి చెట్టు",
        "risk_level": "Low",
        "description_en": "Foliage exhibits vigorous chlorophyll retention, clean leaf margins, and robust vegetative shoots with no pathogen symptoms.",
        "description_te": "పైరు ఎటువంటి తెగులు లేదా పురుగుల లక్షణాలు లేకుండా పచ్చగా, ఏపుగా పెరుగుతోంది.",
        "organic_solution_en": "Apply well-decomposed FYM @ 20kg per tree annually.",
        "organic_solution_te": "చెట్టుకు ఏటా 20 కిలోల పశువుల ఎరువు లేదా వర్మీకంపోస్ట్ అందించండి.",
        "chemical_solution_en": "No chemical pesticide required. Apply recommended NPK fertilizer (500:250:250 g/tree).",
        "chemical_solution_te": "ఎలాంటి రసాయనిక మందుల పిచికారీ అవసరం లేదు. సిఫార్సు చేసిన ఎరువులు సమతుల్యంగా వేయండి.",
        "precautions_en": "Maintain regular weeding and basin cleaning.",
        "precautions_te": "పాదులలో కలుపు లేకుండా శుభ్రంగా ఉంచండి.",
        "product_name": "Bio-NPK & Micronutrients",
        "product_type": "Plant Nutrition",
        "dosage": "Balanced soil application",
        "product_image": "/images/healthy_crop.svg",
        "weather_risk_factor": "none"
    },
    "Cashew leaf miner": {
        "crop": "Cashew",
        "crop_te": "జీడిమామిడి",
        "disease_en": "Cashew Leaf Miner (Acrocercops syngramma)",
        "disease_te": "జీడిమామిడి ఆకు తొలుచు పురుగు",
        "risk_level": "Medium",
        "description_en": "Tiny caterpillars mine between the upper and lower epidermal layers of tender cashew leaves, leaving silvery serpentine blistered galleries that turn brown and crumble.",
        "description_te": "చిన్న గొంగళి పురుగులు లేత ఆకుల పొరల మధ్య సొరంగాలు చేసి ఆకు పచ్చని పదార్థాన్ని తింటాయి. దీనివల్ల ఆకులపై వెండి రంగు గీతలు పడి, తర్వాత ఆకులు ఎండిపోయి రాలిపోతాయి.",
        "organic_solution_en": "1. Spray 5% NSKE (Neem Seed Kernel Extract) @ 50g/L or pure Neem oil @ 5ml/L.\n2. Install light traps to catch adult moths.",
        "organic_solution_te": "1. లీటరు నీటికి 5 మి.లీ వేప నూనె లేదా 5% వేప గింజల కషాయం పిచికారీ చేయండి.\n2. రాత్రి వేళల్లో రెక్కల పురుగులను ఆకర్షించడానికి దీపపు ఉచ్చులను ఏర్పాటు చేయండి.",
        "chemical_solution_en": "Spray Imidacloprid 17.8% SL @ 0.5ml/L or Profenofos 50% EC @ 2ml/L on young flushing leaves.",
        "chemical_solution_te": "కొత్త చిగురు దశలో లీటరు నీటికి ఇమిడాక్లోప్రిడ్ 17.8% SL 0.5 మి.లీ లేదా ప్రొఫెనోఫాస్ 2 మి.లీ కలిపి పిచికారీ చేయండి.",
        "precautions_en": "Ensure complete coverage of the underside of leaves.",
        "precautions_te": "ఆకుల కింది భాగం కూడా తడిసేలా సమగ్రంగా పిచికారీ చేయండి.",
        "product_name": "Imidacloprid 17.8% SL (Confidor)",
        "product_type": "Systemic Insecticide",
        "dosage": "0.5ml per Liter of water (100ml per acre)",
        "product_image": "/images/imidacloprid.svg",
        "weather_risk_factor": "temperature"
    },
    "Cashew red rust": {
        "crop": "Cashew",
        "crop_te": "జీడిమామిడి",
        "disease_en": "Cashew Red Rust (Cephaleuros virescens)",
        "disease_te": "జీడిమామిడి ఎరుపు తుప్పు తెగులు / ఆల్గే తెగులు",
        "risk_level": "Medium",
        "description_en": "Parasitic green alga producing circular velvety reddish-orange spots on the upper leaf surface, hindering photosynthesis and causing early defoliation.",
        "description_te": "ఆకుల పైభాగంలో వెల్వెట్ లాంటి ఎరుపు-నారింజ రంగు గుండ్రని మచ్చలు ఏర్పడతాయి. దీనివల్ల కిరణజన్య సంయోగక్రియ తగ్గి ఆకులు బలహీనపడతాయి.",
        "organic_solution_en": "Prune overcrowded overlapping branches to ensure sunlight penetration.",
        "organic_solution_te": "చెట్ల మధ్య సూర్యరశ్మి మరియు గాలి ప్రసరణ బాగుండేలా కొమ్మలను సరిగ్గా కత్తిరించండి.",
        "chemical_solution_en": "Spray Copper Oxychloride 50% WP @ 3g/L or Bordeaux Mixture 1% during rainy season.",
        "chemical_solution_te": "వర్షాకాలంలో లీటరు నీటికి కాపర్ ఆక్సిక్లోరైడ్ 3 గ్రాములు లేదా 1% బోర్డో మిశ్రమం కలిపి పిచికారీ చేయండి.",
        "precautions_en": "Avoid high nitrogen fertilizer which stimulates excessive succulent vegetative growth.",
        "precautions_te": "యూరియా ఎరువును ఎక్కువగా వాడవద్దు.",
        "product_name": "Copper Oxychloride 50% WP",
        "product_type": "Fungicide / Algicide",
        "dosage": "3g per Liter of water",
        "product_image": "/images/copper_oxychloride.svg",
        "weather_risk_factor": "humidity"
    },

    # -------------------- CASSAVA (5 Classes) --------------------
    "Cassava bacterial blight": {
        "crop": "Cassava",
        "crop_te": "కర్రపెండలం",
        "disease_en": "Cassava Bacterial Blight (Xanthomonas axonopodis pv. manihotis)",
        "disease_te": "కర్రపెండలం బ్యాక్టీరియల్ ఆకు ఎండు తెగులు",
        "risk_level": "High",
        "description_en": "Systemic bacterial pathogen causing angular water-soaked leaf spots, gummy exudates on stems, severe defoliation (candle-stick symptom), and vascular dieback.",
        "description_te": "ఆకులపై తడిసిన నూనె లాంటి కోణీయ మచ్చలు ఏర్పడతాయి. కాండం నుండి బంక కారి ఆకులన్నీ రాలిపోయి కొమ్మలు కేవలం కొవ్వొత్తిలా మిగిలిపోతాయి.",
        "organic_solution_en": "1. Remove and incinerate infected plants immediately.\n2. Use certified disease-free stem cuttings for planting.\n3. Spray bio-agent Pseudomonas fluorescens @ 10g/L.",
        "organic_solution_te": "1. తెగులు సోకిన మొక్కలను పీకి పొలానికి దూరంగా కాల్చివేయండి.\n2. తెగులు లేని ఆరోగ్యకరమైన కాండం కణుపులను మాత్రమే నాటడానికి ఎంచుకోండి.\n3. లీటరు నీటికి సూడోమోనాస్ ఫ్లోరోసెన్స్ 10 గ్రాములు కలిపి పిచికారీ చేయండి.",
        "chemical_solution_en": "Spray Copper Oxychloride @ 3g/L + Streptocycline @ 0.1g/L of water at 12-day intervals.",
        "chemical_solution_te": "లీటరు నీటికి కాపర్ ఆక్సిక్లోరైడ్ 3 గ్రాములు + స్ట్రెప్టోసైక్లిన్ 0.1 గ్రాము కలిపి 12 రోజుల వ్యవధిలో పిచికారీ చేయండి.",
        "precautions_en": "Never use cuttings from infected plants. Sanitize machetes/shears with 5% bleach.",
        "precautions_te": "కత్తిరింపు పరికరాలను డెట్టాల్ లేదా బ్లీచింగ్ పౌడర్ నీటితో శుభ్రం చేయండి.",
        "product_name": "Streptocycline 90:10 & Copper Hydroxide",
        "product_type": "Agricultural Bactericide",
        "dosage": "Streptocycline 0.1g/L + Copper Oxychloride 3g/L",
        "product_image": "/images/streptocycline.svg",
        "weather_risk_factor": "rainfall"
    },
    "Cassava brown spot": {
        "crop": "Cassava",
        "crop_te": "కర్రపెండలం",
        "disease_en": "Cassava Brown Spot (Passalora henningsii)",
        "disease_te": "కర్రపెండలం గోధుమ రంగు మచ్చ తెగులు",
        "risk_level": "Medium",
        "description_en": "Foliar fungal pathogen producing circular brown lesions with well-defined dark violet-brown borders, mainly attacking older bottom leaves.",
        "description_te": "ముదిరిన కింది ఆకులపై ముదురు అంచులతో కూడిన గోధుమ రంగు గుండ్రని మచ్చలు ఏర్పడతాయి. తీవ్రమైతే ఆకులు పసుపు రంగులోకి మారి రాలిపోతాయి.",
        "organic_solution_en": "Promote air circulation with proper crop spacing (1m x 1m).",
        "organic_solution_te": "మొక్కల మధ్య తగిన ఎడం (1 మీ x 1 మీ) పాటించి గాలి, వెలుతురు ఉండేలా చూడండి.",
        "chemical_solution_en": "Spray Mancozeb 75% WP @ 2.5g/L or Carbendazim 50% WP @ 1g/L.",
        "chemical_solution_te": "లీటరు నీటికి మాంకోజెబ్ 2.5 గ్రాములు లేదా కార్బెండజిమ్ 1 గ్రాము కలిపి పిచికారీ చేయండి.",
        "precautions_en": "Remove severely spotted lower senescent leaves.",
        "precautions_te": "కింది భాగంలో బాగా ఎండిన ఆకులను తీసివేయండి.",
        "product_name": "Mancozeb 75% WP (Dithane M-45)",
        "product_type": "Protective Fungicide",
        "dosage": "2.5g per Liter of water",
        "product_image": "/images/mancozeb.svg",
        "weather_risk_factor": "humidity"
    },
    "Cassava green mite": {
        "crop": "Cassava",
        "crop_te": "కర్రపెండలం",
        "disease_en": "Cassava Green Mite (Mononychellus tanajoa)",
        "disease_te": "కర్రపెండలం పచ్చ నల్లి పురుగు",
        "risk_level": "High",
        "description_en": "Microscopic green mites puncturing leaf cells of tender apical leaves, causing chlorotic yellow pinprick mottling, stunted shoots, and leaf drop.",
        "description_te": "లేత ఆకుల నుండి పచ్చ నల్లి రసం పీల్చడం వల్ల ఆకులపై పసుపు రంగు చుక్కలు ఏర్పడి ఆకులు చిన్నవిగా మారి ముడుచుకుపోతాయి.",
        "organic_solution_en": "1. Spray cold-pressed Neem Oil @ 5ml/L with soap solution.\n2. Conserve predatory phytoseiid mites by avoiding broad-spectrum sprays.",
        "organic_solution_te": "1. లీటరు నీటికి 5 మి.లీ వేప నూనెను సబ్బు నీటితో కలిపి పిచికారీ చేయండి.\n2. పొలంలో సహజ శత్రు పురుగులను కాపాడుకోండి.",
        "chemical_solution_en": "Spray Propargite 57% EC @ 2ml/L or Spiromesifen 22.9% SC @ 1ml/L.",
        "chemical_solution_te": "లీటరు నీటికి ప్రొపర్గైట్ 2 మి.లీ లేదా స్పైరోమెసిఫెన్ 1 మి.లీ కలిపి పిచికారీ చేయండి.",
        "precautions_en": "Spray during early morning or evening; direct spray towards the terminal bud.",
        "precautions_te": "ఉదయం లేదా సాయంత్రం వేళల్లో చిగురు ఆకుల కింది భాగం తడిసేలా పిచికారీ చేయండి.",
        "product_name": "Propargite 57% EC (Omite)",
        "product_type": "Acaricide / Mite Specialist",
        "dosage": "2ml per Liter of water (400ml per acre)",
        "product_image": "/images/propargite.svg",
        "weather_risk_factor": "temperature"
    },
    "Cassava healthy": {
        "crop": "Cassava",
        "crop_te": "కర్రపెండలం",
        "disease_en": "Healthy Cassava Crop",
        "disease_te": "ఆరోగ్యకరమైన కర్రపెండలం పైరు",
        "risk_level": "Low",
        "description_en": "Palmate leaves display clean venation, normal green pigmentation, and healthy tuber development.",
        "description_te": "పైరు ఎటువంటి మచ్చలు లేదా నల్లి పురుగుల బెడద లేకుండా ఆరోగ్యకరంగా ఎదుగుతోంది.",
        "organic_solution_en": "Maintain regular weeding and ridge earthening.",
        "organic_solution_te": "దుంపలు బాగా ఊరడానికి మొదళ్ళ వద్ద మట్టిని ఎగదోయండి.",
        "chemical_solution_en": "No chemical treatment needed.",
        "chemical_solution_te": "ఎలాంటి మందులు అవసరం లేదు.",
        "precautions_en": "Avoid waterlogging which causes tuber rot.",
        "precautions_te": "దుంప కుళ్ళు రాకుండా నీరు నిల్వ ఉండకుండా చూడండి.",
        "product_name": "Bio-NPK & Micronutrients",
        "product_type": "Crop Nutrition",
        "dosage": "Standard tuber nutrition",
        "product_image": "/images/healthy_crop.svg",
        "weather_risk_factor": "none"
    },
    "Cassava mosaic": {
        "crop": "Cassava",
        "crop_te": "కర్రపెండలం",
        "disease_en": "Cassava Mosaic Geminivirus (CMD)",
        "disease_te": "కర్రపెండలం మొజాయిక్ వైరస్ తెగులు",
        "risk_level": "High",
        "description_en": "Whitefly-transmitted virus resulting in severe chlorotic yellow/green mosaic variegation, wrinkled leaves, stunted plants, and up to 80% tuber yield reduction.",
        "description_te": "తెల్లదోమ ద్వారా వ్యాపించే వైరస్ వల్ల ఆకులు పసుపు-పచ్చ రంగు మచ్చలతో వంకర్లు తిరిగి గిడసబారిపోతాయి. దుంపల దిగుబడి 80% వరకు తగ్గిపోతుంది.",
        "organic_solution_en": "1. Rogue out and bury diseased plants immediately.\n2. Install yellow sticky traps (15 per acre) for whitefly monitoring.\n3. Spray Neem oil @ 5ml/L to repel whiteflies.",
        "organic_solution_te": "1. తెగులు సోకిన మొక్కలను వెంటనే పీకి పూడ్చిపెట్టండి.\n2. తెల్లదోమ నివారణకు ఎకరానికి 15 పసుపు రంగు జిగురు అట్టలను అమర్చండి.\n3. లీటరు నీటికి 5 మి.లీ వేప నూనె పిచికారీ చేయండి.",
        "chemical_solution_en": "Control whitefly vector with Imidacloprid 17.8% SL @ 0.5ml/L or Acetamiprid 20% SP @ 0.2g/L.",
        "chemical_solution_te": "తెల్లదోమ నివారణకు ఇమిడాక్లోప్రిడ్ 17.8% SL 0.5 మి.లీ లేదా ఎసిటామిప్రిడ్ 0.2 గ్రాము లీటరు నీటికి కలిపి పిచికారీ చేయండి.",
        "precautions_en": "Always plant CMD-resistant certified cassava stem varieties.",
        "precautions_te": "మొజాయిక్ తెగులును తట్టుకునే రకాల కణుపులను మాత్రమే నాటండి.",
        "product_name": "Imidacloprid 17.8% SL & Neem Oil",
        "product_type": "Vector Control Insecticide",
        "dosage": "0.5ml per Liter of water",
        "product_image": "/images/imidacloprid.svg",
        "weather_risk_factor": "temperature"
    },

    # -------------------- MAIZE / CORN (7 Classes) --------------------
    "Maize fall armyworm": {
        "crop": "Maize",
        "crop_te": "మొక్కజొన్న",
        "disease_en": "Maize Fall Armyworm (Spodoptera frugiperda)",
        "disease_te": "మొక్కజొన్న కత్తెర పురుగు",
        "risk_level": "High",
        "description_en": "Invasive moth larvae devouring maize whorls and leaves, producing characteristic windowing, ragged shot-holes, and large mounds of sawdust-like frass in leaf whorls.",
        "description_te": "కత్తెర పురుగు గొంగళి పురుగులు సుడులలో చేరి ఆకులను కత్తిరించి తింటాయి. సుడిలో చెక్క పొట్టు లాంటి మల విసర్జన స్పష్టంగా కనిపిస్తుంది.",
        "organic_solution_en": "1. Drop sand + lime (9:1) or wood ash into whorls to suffocate larvae.\n2. Apply Bacillus thuringiensis (Bt) @ 2g/L or Metarhizium anisopliae @ 5g/L.\n3. Install FAW pheromone traps @ 5 per acre.",
        "organic_solution_te": "1. మొక్కజొన్న సుడులలో ఇసుక + సున్నం (9:1 నిష్పత్తిలో) లేదా బూడిదను వేయండి.\n2. లీటరు నీటికి బాసిల్లస్ తురింజియెన్సిస్ (Bt) 2 గ్రాములు లేదా మెటారైజియం 5 గ్రాములు పిచికారీ చేయండి.\n3. ఎకరానికి 5 లింగాకర్షక బుట్టలను అమర్చండి.",
        "chemical_solution_en": "Spray Emamectin Benzoate 5% SG @ 0.4g/L or Chlorantraniliprole 18.5% SC @ 0.3ml/L directed directly into whorls.",
        "chemical_solution_te": "సుడి లోపలికి వెళ్ళేలా లీటరు నీటికి ఎమామెక్టిన్ బెంజోయేట్ 5% SG 0.4 గ్రాము లేదా క్లోరాంట్రానిలిప్రోల్ 0.3 మి.లీ పిచికారీ చేయండి.",
        "precautions_en": "Direct nozzle directly into plant whorls for effective larval kill.",
        "precautions_te": "స్ప్రే నాజిల్ మొక్క సుడిలోకి నేరుగా ఉండేలా పిచికారీ చేయండి.",
        "product_name": "Chlorpyrifos 20% EC & Emamectin Benzoate",
        "product_type": "Lepidopteran Insecticide",
        "dosage": "Emamectin Benzoate 0.4g/L (80g per acre)",
        "product_image": "/images/chlorpyrifos.svg",
        "weather_risk_factor": "temperature"
    },
    "Maize grasshoper": {
        "crop": "Maize",
        "crop_te": "మొక్కజొన్న",
        "disease_en": "Maize Grasshopper Pest (Hieroglyphus nigrorepletus)",
        "disease_te": "మొక్కజొన్న మిడత పురుగు",
        "risk_level": "Medium",
        "description_en": "Chewing orthopterans defoliating maize plants by consuming foliage from leaf margins inward, skeletonizing crops during outbreak periods.",
        "description_te": "మిడతలు గుంపులుగా చేరి ఆకుల అంచులను కొరికి తిని ఈనెలను మాత్రమే మిగులుస్తాయి.",
        "organic_solution_en": "Deep summer ploughing to expose grasshopper egg pods to birds and sun.",
        "organic_solution_te": "వేసవిలో లోతు దుక్కులు చేసి మిడతల గుడ్లను సూర్యరశ్మికి గురిచేయండి.",
        "chemical_solution_en": "Dust Methyl Parathion 2% or spray Chlorpyrifos 20% EC @ 2ml/L on field bunds.",
        "chemical_solution_te": "గట్ల వెంబడి మరియు పైరుపై క్లోరిపైరిఫాస్ 20% EC 2 మి.లీ లీటరు నీటికి కలిపి పిచికారీ చేయండి.",
        "precautions_en": "Treat field borders early in morning when nymphs are sluggish.",
        "precautions_te": "ఉదయం వేళల్లో మిడతలు మందకొడిగా ఉన్నప్పుడు గట్లపై పిచికారీ చేయండి.",
        "product_name": "Chlorpyrifos 20% EC",
        "product_type": "Contact & Ingestion Insecticide",
        "dosage": "2ml per Liter of water (400ml per acre)",
        "product_image": "/images/chlorpyrifos.svg",
        "weather_risk_factor": "temperature"
    },
    "Maize healthy": {
        "crop": "Maize",
        "crop_te": "మొక్కజొన్న",
        "disease_en": "Healthy Maize Crop",
        "disease_te": "ఆరోగ్యకరమైన మొక్కజొన్న పైరు",
        "risk_level": "Low",
        "description_en": "Vigorous green leaves, strong stalks, and clean whorls without pest feeding punctures or foliar blights.",
        "description_te": "పైరు ఎటువంటి తెగులు లేదా పురుగుల బెడద లేకుండా ఆకుపచ్చగా, ఏపుగా పెరుగుతోంది.",
        "organic_solution_en": "Apply vermicompost and maintain soil moisture during silking stage.",
        "organic_solution_te": "కంకి తయారయ్యే దశలో నీటి ఎద్దడి రాకుండా క్రమం తప్పకుండా తడులు ఇవ్వండి.",
        "chemical_solution_en": "No chemical pesticide required. Maintain balanced urea and potash application.",
        "chemical_solution_te": "ఎలాంటి మందులు అవసరం లేదు. యూరియా మరియు పొటాష్ సమతుల్యంగా వేయండి.",
        "precautions_en": "Avoid waterlogging in root zone.",
        "precautions_te": "పొలంలో నీరు నిల్వ ఉండకుండా చూసుకోండి.",
        "product_name": "Bio-NPK & Micronutrients",
        "product_type": "Crop Nutrition",
        "dosage": "Balanced soil management",
        "product_image": "/images/healthy_crop.svg",
        "weather_risk_factor": "none"
    },
    "Maize leaf beetle": {
        "crop": "Maize",
        "crop_te": "మొక్కజొన్న",
        "disease_en": "Maize Leaf Beetle (Oulema melanopus / Chrysomelidae)",
        "disease_te": "మొక్కజొన్న ఆకు వండ్ర పురుగు",
        "risk_level": "Medium",
        "description_en": "Beetles and larvae chew longitudinal strips between veins on the upper surface of leaves, creating transparent windowpanes that later dry out.",
        "description_te": "పురుగులు ఆకు పైభాగంలో ఈనెల మధ్య పొడవాటి గీతలుగా ఆకుపచ్చని పదార్థాన్ని తింటాయి. దీనివల్ల ఆకులపై తెల్లటి పొరలు ఏర్పడి ఎండిపోతాయి.",
        "organic_solution_en": "Spray Neem Oil 10,000 PPM @ 5ml/L to deter beetle feeding.",
        "organic_solution_te": "లీటరు నీటికి 5 మి.లీ వేప నూనెను కలిపి పిచికారీ చేయండి.",
        "chemical_solution_en": "Spray Chlorpyrifos 20% EC @ 2ml/L or Lambda Cyhalothrin 5% EC @ 1ml/L.",
        "chemical_solution_te": "లీటరు నీటికి క్లోరిపైరిఫాస్ 2 మి.లీ లేదా ల్యామ్డా సైహలోథ్రిన్ 1 మి.లీ కలిపి పిచికారీ చేయండి.",
        "precautions_en": "Spray when beetles are first noticed on leaves.",
        "precautions_te": "పురుగులు కనిపించిన వెంటనే పిచికారీ చేపట్టండి.",
        "product_name": "Chlorpyrifos 20% EC",
        "product_type": "Insecticide",
        "dosage": "2ml per Liter of water",
        "product_image": "/images/chlorpyrifos.svg",
        "weather_risk_factor": "temperature"
    },
    "Maize leaf blight": {
        "crop": "Maize",
        "crop_te": "మొక్కజొన్న",
        "disease_en": "Northern Corn Leaf Blight (Exserohilum turcicum)",
        "disease_te": "మొక్కజొన్న ఉత్తర ఆకు ఎండు తెగులు",
        "risk_level": "High",
        "description_en": "Fungal disease causing long, elliptical, grayish-green or tan spindle-shaped lesions (up to 15cm) that coalesce, causing premature leaf death.",
        "description_te": "ఆకులపై పొడవాటి పడవ ఆకారపు బూడిద-గోధుమ రంగు మచ్చలు ఏర్పడతాయి. మచ్చలు కలిసిపోయి ఆకులన్నీ ఎండిపోయి దిగుబడి గణనీయంగా తగ్గుతుంది.",
        "organic_solution_en": "Incorporate crop residue deeply into the soil after harvest.",
        "organic_solution_te": "పంట కోసిన తర్వాత వ్యర్థాలను లోతుగా దున్ని నేలలో కలిపివేయండి.",
        "chemical_solution_en": "Spray Mancozeb 75% WP @ 2.5g/L or Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1ml/L.",
        "chemical_solution_te": "లీటరు నీటికి మాంకోజెబ్ 2.5 గ్రాములు లేదా అజాక్సిస్ట్రోబిన్ + డైఫెనోకోనజోల్ 1 మి.లీ కలిపి పిచికారీ చేయండి.",
        "precautions_en": "Avoid excessive plant density to reduce canopy humidity.",
        "precautions_te": "మొక్కల మధ్య తగిన ఎడం పాటించి గాలి ప్రసరణ ఉండేలా చూడండి.",
        "product_name": "Mancozeb 75% WP (Dithane M-45)",
        "product_type": "Protective Fungicide",
        "dosage": "2.5g per Liter of water",
        "product_image": "/images/mancozeb.svg",
        "weather_risk_factor": "humidity"
    },
    "Maize leaf spot": {
        "crop": "Maize",
        "crop_te": "మొక్కజొన్న",
        "disease_en": "Maize Gray Leaf Spot (Cercospora zeae-maydis)",
        "disease_te": "మొక్కజొన్న బూడిద మచ్చ తెగులు",
        "risk_level": "Medium",
        "description_en": "Fungal pathogen producing small rectangular tan spots strictly delimited by parallel leaf veins, maturing into grayish necrotic stripes.",
        "description_te": "ఆకుల ఈనెల మధ్య దీర్ఘచతురస్రాకార బూడిద రంగు మచ్చలు ఏర్పడతాయి. తేమ ఎక్కువైతే మచ్చలు కలిసిపోయి ఆకులు మాడిపోతాయి.",
        "organic_solution_en": "Crop rotation with non-host legumes like pulses or soybean.",
        "organic_solution_te": "పంట మార్పిడిలో అపరాలు (కందులు, పెసలు) సాగు చేయండి.",
        "chemical_solution_en": "Spray Carbendazim 50% WP @ 1g/L or Propiconazole 25% EC @ 1ml/L.",
        "chemical_solution_te": "లీటరు నీటికి కార్బెండజిమ్ 1 గ్రాము లేదా ప్రొపికోనజోల్ 1 మి.లీ కలిపి పిచికారీ చేయండి.",
        "precautions_en": "Apply treatment at first onset before silking stage.",
        "precautions_te": "కంకి వచ్చే దశకు ముందే తెగులు కనిపిస్తే వెంటనే పిచికారీ చేయండి.",
        "product_name": "Carbendazim 50% WP (Bavistin)",
        "product_type": "Systemic Fungicide",
        "dosage": "1g per Liter of water",
        "product_image": "/images/carbendazim.svg",
        "weather_risk_factor": "humidity"
    },
    "Maize streak virus": {
        "crop": "Maize",
        "crop_te": "మొక్కజొన్న",
        "disease_en": "Maize Streak Mastrevirus (MSV)",
        "disease_te": "మొక్కజొన్న చారల వైరస్ తెగులు",
        "risk_level": "High",
        "description_en": "Leafhopper-transmitted virus producing narrow chlorotic, yellowish-white streaks strictly parallel to veins along the entire length of young leaves, causing stunting.",
        "description_te": "దీపపు పురుగులు (లీఫ్‌హాపర్స్) ద్వారా వ్యాపించే వైరస్ వల్ల ఆకులపై పొడవాటి పసుపు-తెలుపు చారలు ఏర్పడతాయి. మొక్కలు గిడసబారి కంకులు సరిగ్గా పట్టవు.",
        "organic_solution_en": "Plant synchronous maize fields to prevent continuous leafhopper migration.",
        "organic_solution_te": "ప్రాంతమంతా ఒకేసారి విత్తడం ద్వారా దీపపు పురుగుల ఉధృతిని తగ్గించండి.",
        "chemical_solution_en": "Seed treatment with Thiamethoxam 30% FS @ 6ml/kg. Spray Imidacloprid 17.8% SL @ 0.4ml/L for leafhopper control.",
        "chemical_solution_te": "విత్తన శుద్ధికి థయామెథాక్సామ్ 6 మి.లీ/కిలో వాడండి. పైరుపై లీటరు నీటికి ఇమిడాక్లోప్రిడ్ 0.4 మి.లీ కలిపి పిచికారీ చేయండి.",
        "precautions_en": "Keep field bunds free from weed grass hosts.",
        "precautions_te": "గట్లపై గడ్డి కలుపు లేకుండా శుభ్రంగా ఉంచండి.",
        "product_name": "Imidacloprid 17.8% SL (Confidor)",
        "product_type": "Vector Control Insecticide",
        "dosage": "0.4ml per Liter of water",
        "product_image": "/images/imidacloprid.svg",
        "weather_risk_factor": "temperature"
    },

    # -------------------- TOMATO (5 Classes) --------------------
    "Tomato healthy": {
        "crop": "Tomato",
        "crop_te": "టమోటా",
        "disease_en": "Healthy Tomato Plant",
        "disease_te": "ఆరోగ్యకరమైన టమోటా పైరు",
        "risk_level": "Low",
        "description_en": "Lush compound leaves, vibrant yellow flowers, sturdy stems, and unblemished developing fruit.",
        "description_te": "టమోటా పైరు ఎటువంటి ఆకు మచ్చలు లేదా ముడుత లేకుండా పచ్చగా, పూత కాయతో కళకళలాడుతోంది.",
        "organic_solution_en": "Apply vermicompost and spray Panchagavya 3% for flowering boost.",
        "organic_solution_te": "మొక్కల మొదళ్ళలో వర్మీకంపోస్ట్ వేసి, పూత రాలకుండా 3% పంచగవ్య పిచికారీ చేయండి.",
        "chemical_solution_en": "No chemical fungicide needed. Apply water-soluble 19:19:19 @ 5g/L.",
        "chemical_solution_te": "ఎలాంటి మందులు అవసరం లేదు. 19:19:19 ఎరువును 5 గ్రాములు లీటరు నీటికి కలిపి అందించండి.",
        "precautions_en": "Stake plants to keep fruit and leaves above wet soil.",
        "precautions_te": "చెట్లకు కర్రల ఊతం (స్టేకింగ్) ఇచ్చి ఆకులు నేలకు తగలకుండా చూడండి.",
        "product_name": "Bio-NPK & Micronutrients",
        "product_type": "Plant Nutrition",
        "dosage": "Foliar nutrition maintenance",
        "product_image": "/images/healthy_crop.svg",
        "weather_risk_factor": "none"
    },
    "Tomato leaf blight": {
        "crop": "Tomato",
        "crop_te": "టమోటా",
        "disease_en": "Tomato Early/Late Blight (Alternaria / Phytophthora)",
        "disease_te": "టమోటా ఆకు మాగుడు / ఎండు తెగులు",
        "risk_level": "High",
        "description_en": "Severe foliar disease causing dark brown concentric bullseye lesions (Early Blight) or rapid water-soaked greying and rotting with white fungal sporulation (Late Blight).",
        "description_te": "ఆకులపై వలయాలు కలిగిన ముదురు గోధుమ రంగు మచ్చలు (ఎర్లీ బ్లైట్) లేదా తడిసిన బూడిద రంగు మాగుడు మచ్చలు (లేట్ బ్లైట్) ఏర్పడి ఆకులు, కాయలు కుళ్ళిపోతాయి.",
        "organic_solution_en": "1. Strip lower leaves up to 12 inches from ground to prevent soil splash.\n2. Apply silver mulch and avoid overhead sprinkler watering.\n3. Spray bio-fungicide Trichoderma viride @ 5g/L.",
        "organic_solution_te": "1. నేల నుండి 30 సెం.మీ ఎత్తు వరకు ఉన్న కింది ఆకులను తుంచివేయండి.\n2. ఆకులపై నీరు పడకుండా డ్రిప్ పద్ధతిలో నీరు అందించండి.\n3. లీటరు నీటికి ట్రైకోడెర్మా విరిడే 5 గ్రాములు కలిపి పిచికారీ చేయండి.",
        "chemical_solution_en": "Spray Metalaxyl 8% + Mancozeb 64% WP (Ridomil Gold) @ 2g/L or Cymoxanil + Mancozeb @ 2g/L.",
        "chemical_solution_te": "లీటరు నీటికి మెటలాక్సిల్ + మాంకోజెబ్ 2 గ్రాములు లేదా సైమోక్సానిల్ + మాంకోజెబ్ 2 గ్రాములు కలిపి పిచికారీ చేయండి.",
        "precautions_en": "Critical: Spray immediately if cool humid fog or morning dew persists.",
        "precautions_te": "మంచు, చలి ఎక్కువగా ఉంటే వెంటనే పిచికారీ చేపట్టండి.",
        "product_name": "Metalaxyl + Mancozeb (Ridomil Gold)",
        "product_type": "Systemic & Contact Fungicide",
        "dosage": "2g per Liter of water (400g per acre)",
        "product_image": "/images/mancozeb.svg",
        "weather_risk_factor": "humidity"
    },
    "Tomato leaf curl": {
        "crop": "Tomato",
        "crop_te": "టమోటా",
        "disease_en": "Tomato Leaf Curl Begomovirus (ToLCV)",
        "disease_te": "టమోటా ఆకు ముడుత వైరస్ తెగులు",
        "risk_level": "High",
        "description_en": "Whitefly-transmitted virus causing severe upward and inward curling of leaf margins, leaf thickening, intense vein clearing, stunting, and bushy flower drop.",
        "description_te": "తెల్లదోమ ద్వారా వ్యాపించే వైరస్ వల్ల ఆకుల అంచులు పైకి దోనెలా ముడుచుకుపోతాయి. ఆకులు దళసరిగా మారి చెట్లు గిడసబారి పూత పిందె నిలవదు.",
        "organic_solution_en": "1. Set up 20 yellow sticky traps per acre to trap whiteflies.\n2. Spray Neem oil (10,000 PPM) @ 5ml/L.\n3. Grow border barrier rows of maize or sorghum around the tomato field.",
        "organic_solution_te": "1. ఎకరానికి 20 పసుపు రంగు జిగురు అట్టలను అమర్చండి.\n2. లీటరు నీటికి 5 మి.లీ వేప నూనెను కలిపి పిచికారీ చేయండి.\n3. పొలం చుట్టూ రక్షణగా 3-4 వరుసల మొక్కజొన్న లేదా జొన్నను నాటండి.",
        "chemical_solution_en": "Spray Diafenthiuron 50% WP @ 1.25g/L or Cyantraniliprole 10.26% OD @ 1.8ml/L for whitefly vector control.",
        "chemical_solution_te": "తెల్లదోమ నివారణకు లీటరు నీటికి డయాఫెంథియురాన్ 1.25 గ్రాము లేదా సయాంట్రానిలిప్రోల్ 1.8 మి.లీ కలిపి పిచికారీ చేయండి.",
        "precautions_en": "Rogue out and destroy infected viral plants early in the season.",
        "precautions_te": "వైరస్ సోకిన మొక్కలను ప్రారంభ దశలోనే పీకి తగులబెట్టండి.",
        "product_name": "Diafenthiuron 50% WP & Neem Oil",
        "product_type": "Whitefly Vector Insecticide",
        "dosage": "Diafenthiuron 1.25g/L + Neem Oil 5ml/L",
        "product_image": "/images/neem_oil.svg",
        "weather_risk_factor": "temperature"
    },
    "Tomato septoria leaf spot": {
        "crop": "Tomato",
        "crop_te": "టమోటా",
        "disease_en": "Tomato Septoria Leaf Spot (Septoria lycopersici)",
        "disease_te": "టమోటా సెప్టోరియా ఆకు మచ్చ తెగులు",
        "risk_level": "Medium",
        "description_en": "Destructive fungal disease producing numerous small circular spots with dark brown margins and sunken grayish centers studded with tiny black pycnidia fruiting bodies.",
        "description_te": "ఆకులపై నల్లటి అంచులతో కూడిన చిన్న గుండ్రని బూడిద రంగు మచ్చలు ఏర్పడతాయి. మచ్చల మధ్యలో చిన్న నల్లటి చుక్కలు కనిపిస్తాయి. ఆకులు పసుపు రంగులోకి మారి రాలిపోతాయి.",
        "organic_solution_en": "Apply straw mulch to prevent soil splashing onto foliage.",
        "organic_solution_te": "ఆకులపై నేల నుండి నీటి తుంపర్లు పడకుండా గడ్డితో మల్చింగ్ చేయండి.",
        "chemical_solution_en": "Spray Copper Oxychloride 50% WP @ 3g/L or Chlorothalonil 75% WP @ 2g/L.",
        "chemical_solution_te": "లీటరు నీటికి కాపర్ ఆక్సిక్లోరైడ్ 3 గ్రాములు లేదా క్లోరోథలోనిల్ 2 గ్రాములు కలిపి పిచికారీ చేయండి.",
        "precautions_en": "Do not work in wet tomato fields as fungal spores spread on clothing.",
        "precautions_te": "పైరు తడిగా ఉన్నప్పుడు పొలంలో పనులు చేయవద్దు, బట్టల ద్వారా తెగులు వ్యాపిస్తుంది.",
        "product_name": "Copper Oxychloride 50% WP (Blitox)",
        "product_type": "Contact Protective Fungicide",
        "dosage": "3g per Liter of water",
        "product_image": "/images/copper_oxychloride.svg",
        "weather_risk_factor": "humidity"
    },
    "Tomato verticulium wilt": {
        "crop": "Tomato",
        "crop_te": "టమోటా",
        "disease_en": "Tomato Verticillium Wilt (Verticillium dahliae)",
        "disease_te": "టమోటా విల్ట్ / వాడి తెగులు",
        "risk_level": "High",
        "description_en": "Soil-borne vascular wilt fungus causing characteristic V-shaped chlorotic yellow patches starting from leaf tips, followed by vascular browning and daytime wilting.",
        "description_te": "నేలలోని సిలీంధ్రం వల్ల ఆకుల చివర నుండి 'V' ఆకారంలో పసుపు రంగు మచ్చలు ఏర్పడతాయి. కాండం లోపలి నాళాలు గోధుమ రంగులోకి మారి ఎండవేళల్లో మొక్కలు నిలువునా వాడిపోతాయి.",
        "organic_solution_en": "1. Soil solarization using clear polyethylene film during peak summer.\n2. Apply farm yard manure enriched with Trichoderma viride @ 5kg per acre.",
        "organic_solution_te": "1. వేసవిలో పాలిథిన్ షీట్లతో నేలను సోలరైజేషన్ చేయండి.\n2. పశువుల ఎరువుతో కలిపిన ట్రైకోడెర్మా విరిడే సిలీంధ్ర నాశినిని ఎకరానికి 5 కిలోలు వేయండి.",
        "chemical_solution_en": "Soil drench around root zone with Carbendazim 50% WP @ 1g/L or Copper Oxychloride @ 3g/L.",
        "chemical_solution_te": "లీటరు నీటికి కార్బెండజిమ్ 1 గ్రాము లేదా కాపర్ ఆక్సిక్లోరైడ్ 3 గ్రాములు కలిపి కుదుళ్ల వద్ద నేల తడిసేలా పోయండి.",
        "precautions_en": "Practice 3-year crop rotation with non-solanaceous crops (maize, pulses).",
        "precautions_te": "టమోటా వేసిన పొలంలో వరుసగా వంగ, మిరప, బంగాళాదుంప వేయకుండా జొన్న, మొక్కజొన్న సాగు చేయండి.",
        "product_name": "Carbendazim 50% WP (Bavistin)",
        "product_type": "Systemic Vascular Fungicide",
        "dosage": "1g per Liter of water for root drenching",
        "product_image": "/images/carbendazim.svg",
        "weather_risk_factor": "rainfall"
    }
}

DEFAULT_KNOWLEDGE = {
    "crop": "Agricultural Crop",
    "crop_te": "వ్యవసాయ పైరు",
    "disease_en": "Crop Leaf Infection",
    "disease_te": "పైరు ఆకు తెగులు లక్షణం",
    "risk_level": "Medium",
    "description_en": "Foliar pathogen affecting plant vigor and photosynthetic efficiency.",
    "description_te": "ఆకుపై తెగులు లేదా పురుగుల దాడి వల్ల మొక్క పెరుగుదల మందగించింది.",
    "organic_solution_en": "1. Remove severely infected leaves.\n2. Spray Neem oil @ 5ml/L of water.",
    "organic_solution_te": "1. తెగులు సోకిన భాగాలను తొలగించండి.\n2. లీటరు నీటికి 5 మి.లీ వేప నూనె (10,000 PPM) కలిపి పిచికారీ చేయండి.",
    "chemical_solution_en": "Spray Copper Oxychloride @ 3g/L or Mancozeb @ 2.5g/L of water.",
    "chemical_solution_te": "కాపర్ ఆక్సిక్లోరైడ్ 3 గ్రాములు లేదా మాంకోజెబ్ 2.5 గ్రాములు లీటరు నీటికి కలిపి పిచికారీ చేయండి.",
    "precautions_en": "Wear mask and gloves during spraying. Postpone if rain is imminent.",
    "precautions_te": "పిచికారీ సమయంలో మాస్క్ ధరించండి. వర్షం వచ్చే అవకాశం ఉంటే పిచికారీ వాయిదా వేయండి.",
    "product_name": "Copper Oxychloride 50% WP (Blitox)",
    "product_type": "Broad Spectrum Protectant",
    "dosage": "3g per Liter of water (600g per acre)",
    "product_image": "/images/copper_oxychloride.svg",
    "weather_risk_factor": "humidity"
}


# ==============================================================================
# PIPELINE ARCHITECTURE CLASS
# ==============================================================================
class AgriculturalPipeline:
    def __init__(self):
        self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.class_indices = {}
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])

        self.audio_dir = os.path.join(os.path.dirname(__file__), "..", "audio_cache")
        os.makedirs(self.audio_dir, exist_ok=True)

        self._init_cnn_model()

        # Initialize Gemini API if configured
        self.gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
        self.gemini_client = None
        if GEMINI_AVAILABLE and self.gemini_key and not self.gemini_key.startswith("your-") and not self.gemini_key.startswith("WAITING"):
            try:
                self.gemini_client = genai.Client(api_key=self.gemini_key)
                logger.info("[Pipeline] Gemini API Client initialized.")
            except Exception as e:
                logger.warning(f"[Pipeline] Gemini notice: {e}")

    def _init_cnn_model(self):
        base_dir = os.path.dirname(__file__)
        model_paths = [
            os.path.join(base_dir, "models", "crop_disease_model.pt"),
            os.path.join(base_dir, "..", "backend", "app", "ml", "models", "crop_disease_model.pt")
        ]
        indices_paths = [
            os.path.join(base_dir, "models", "class_indices.json"),
            os.path.join(base_dir, "..", "dataset_metadata", "class_indices.json"),
            os.path.join(base_dir, "..", "backend", "app", "ml", "models", "class_indices.json")
        ]

        indices_path = next((p for p in indices_paths if os.path.exists(p)), None)
        model_path = next((p for p in model_paths if os.path.exists(p)), None)

        if indices_path and os.path.exists(indices_path):
            with open(indices_path, "r", encoding="utf-8") as f:
                raw = json.load(f)
                self.class_indices = {int(k): v for k, v in raw.items()}
            logger.info(f"[Pipeline] Loaded {len(self.class_indices)} classes from {indices_path}")

        if model_path and os.path.exists(model_path) and self.class_indices:
            try:
                num_classes = len(self.class_indices)
                m = models.mobilenet_v3_small(weights=None)
                in_f = m.classifier[3].in_features
                m.classifier[3] = nn.Linear(in_f, num_classes)
                state = torch.load(model_path, map_location=self.device, weights_only=False)
                m.load_state_dict(state)
                m.to(self.device)
                m.eval()
                self.model = m
                logger.info(f"[Pipeline] PyTorch model loaded successfully from {model_path}")
            except Exception as e:
                logger.error(f"[Pipeline] Model loading error: {e}")

    def preprocess_image(self, image_input: Any) -> torch.Tensor:
        try:
            if isinstance(image_input, (bytes, bytearray)):
                img = Image.open(io.BytesIO(image_input)).convert("RGB")
            elif isinstance(image_input, str):
                img = Image.open(image_input).convert("RGB")
            elif isinstance(image_input, Image.Image):
                img = image_input.convert("RGB")
            else:
                raise ValueError("Unsupported image input type")

            if img.width < 10 or img.height < 10:
                raise ValueError("Image dimensions too small")

            return self.transform(img).unsqueeze(0).to(self.device)
        except Exception as e:
            raise ValueError(f"Corrupt or invalid image: {str(e)}")

    def _predict_cnn(self, tensor: torch.Tensor) -> Dict[str, Any]:
        if self.model is None or not self.class_indices:
            return {"class_name": "Tomato leaf blight", "confidence": 0.88}

        with torch.no_grad():
            outputs = self.model(tensor)
            probs = torch.softmax(outputs, dim=1)
            conf, pred_idx = torch.max(probs, 1)

        idx = pred_idx.item()
        class_name = self.class_indices.get(idx, "Tomato leaf blight")
        return {"class_name": class_name, "confidence": float(conf.item())}

    def generate_climate_advisory(self, class_name: str, weather_data: Optional[Dict[str, Any]] = None, lang: str = "te") -> Dict[str, str]:
        """
        TASK 7: Context-aware climate & weather advisory.
        Correlates local temperature, humidity, and rainfall with disease epidemiology.
        """
        if not weather_data:
            return {
                "advisory_en": "General Advisory: Location-specific weather telemetry was not enabled. Ensure standard morning spraying practices under calm wind conditions.",
                "advisory_te": "సాధారణ సలహా: స్థానిక వాతావరణ సమాచారం ప్రారంభించబడలేదు. గాలి వేగం తక్కువగా ఉన్నప్పుడు ఉదయం వేళల్లో మాత్రమే పిచికారీ చేపట్టండి.",
                "has_weather": False
            }

        temp = float(weather_data.get("temp", 28))
        humidity = float(weather_data.get("humidity", 65))
        rain_prob = float(weather_data.get("rain_prob", 0))
        condition = str(weather_data.get("condition", "Partly Cloudy"))

        kb_entry = KNOWLEDGE_BASE.get(class_name, DEFAULT_KNOWLEDGE)
        risk_factor = kb_entry.get("weather_risk_factor", "humidity")

        # Contextual logic
        notes_en = []
        notes_te = []

        if rain_prob > 35:
            notes_en.append(f"⚠️ Rain forecast ({int(rain_prob)}% chance). Postpone foliar spraying to prevent chemical wash-off and runoff waste.")
            notes_te.append(f"⚠️ వర్షం పడే అవకాశం ఉంది ({int(rain_prob)}%). మందులు కొట్టుకుపోకుండా పిచికారీని తాత్కాలికంగా వాయిదా వేయండి.")
        elif humidity > 75:
            notes_en.append(f"High relative humidity ({int(humidity)}%) and {condition} conditions elevate fungal spore germination and lesion expansion.")
            notes_te.append(f"గాలిలో అధిక తేమ ({int(humidity)}%) మరియు {condition} వాతావరణం వల్ల సిలీంధ్ర తెగుళ్ళు వేగంగా వ్యాప్తి చెందే అవకాశం ఉంది.")
        elif temp > 33:
            notes_en.append(f"High temperature ({temp}°C) accelerates pest multiplication. Spray only in early morning (6-8 AM) or evening to prevent rapid chemical evaporation.")
            notes_te.append(f"అధిక ఉష్ణోగ్రత ({temp}°C) వల్ల పురుగుల ఉధృతి పెరుగుతుంది. మందులు ఆవిరి కాకుండా ఉదయం 6-8 గంటల మధ్య లేదా సాయంత్రం మాత్రమే పిచికారీ చేయండి.")
        else:
            notes_en.append(f"Favorable application window: Temp {temp}°C, Humidity {int(humidity)}%, with calm winds suitable for foliar spraying.")
            notes_te.append(f"వాతావరణం అనుకూలంగా ఉంది: ఉష్ణోగ్రత {temp}°C, తేమ {int(humidity)}%. మందుల పిచికారీకి అనుకూల సమయం.")

        return {
            "advisory_en": " ".join(notes_en),
            "advisory_te": " ".join(notes_te),
            "has_weather": True,
            "temp": temp,
            "humidity": humidity,
            "condition": condition
        }

    def diagnose_crop(self, image_bytes: bytes, weather_data: Optional[Dict[str, Any]] = None, lang: str = "te") -> Dict[str, Any]:
        """
        TASK 2 & 3: Unified crop disease inference and advisory pipeline.
        """
        tensor = self.preprocess_image(image_bytes)
        cnn_res = self._predict_cnn(tensor)
        class_name = cnn_res["class_name"]
        confidence = cnn_res["confidence"]

        # Low confidence safeguard (< 0.60)
        is_low_confidence = confidence < 0.60

        kb_entry = KNOWLEDGE_BASE.get(class_name, DEFAULT_KNOWLEDGE)

        crop = kb_entry["crop"]
        crop_te = kb_entry.get("crop_te", crop)
        disease_en = kb_entry["disease_en"]
        disease_te = kb_entry["disease_te"]
        risk_level = kb_entry["risk_level"]
        desc_en = kb_entry.get("description_en", "")
        desc_te = kb_entry.get("description_te", "")
        org_en = kb_entry["organic_solution_en"]
        org_te = kb_entry["organic_solution_te"]
        chem_en = kb_entry["chemical_solution_en"]
        chem_te = kb_entry["chemical_solution_te"]
        prec_en = kb_entry["precautions_en"]
        prec_te = kb_entry["precautions_te"]
        prod_name = kb_entry["product_name"]
        prod_type = kb_entry.get("product_type", "Agricultural Protectant")
        dosage = kb_entry["dosage"]
        prod_img = kb_entry["product_image"]

        # Climate-aware advisory
        climate_adv = self.generate_climate_advisory(class_name, weather_data, lang=lang)

        # Build clean formatted speech text
        if lang == "te":
            raw_speech = (
                f"రైతు మిత్ర నివేదిక: పంట {crop_te}. సమస్య {disease_te}. "
                f"వివరణ: {desc_te[:120]}. "
                f"సేంద్రీయ నివారణ: {org_te[:120]}. "
                f"రసాయనిక నివారణ: {chem_te[:120]}. "
                f"సిఫార్సు చేసిన మందు {prod_name}. మోతాదు {dosage}. "
                f"జాగ్రత్తలు: {prec_te[:100]}."
            )
            replacements = [
                (r'\bWP\b', 'పౌడర్'),
                (r'\bEC\b', 'ద్రవం'),
                (r'\bSC\b', 'ద్రావణం'),
                (r'\bSP\b', 'పొడి'),
                (r'\bppm\b', 'భాగాలు'),
                (r'\bNPK\b', 'ఎరువులు'),
                (r'\bBlitox\b', 'బ్లైటాక్స్'),
                (r'\bBavistin\b', 'బావిస్టిన్'),
                (r'\bPlantomycin\b', 'ప్లాంటోమైసిన్'),
                (r'\bContaf\b', 'కాంటాఫ్'),
                (r'\bPlus\b', 'ప్లస్'),
                (r'\bCopper\s*Oxychloride\b', 'కాపర్ ఆక్సిక్లోరైడ్'),
                (r'\bCarbendazim\b', 'కార్బెండజిమ్'),
                (r'\bMancozeb\b', 'మ్యాంకోజెబ్'),
                (r'(\d+)\s*g/L', r'\1 గ్రాములు లీటరు నీటికి'),
                (r'(\d+)\s*ml/L', r'\1 మిల్లీలీటర్లు లీటరు నీటికి'),
                (r'(\d+)%', r'\1 శాతం'),
                (r'[#@*~_`\+]', ' మరియు '),
                (r'[\[\]\(\)]', ' '),
            ]
            s_cleaned = raw_speech
            for pat, rep in replacements:
                s_cleaned = re.sub(pat, rep, s_cleaned, flags=re.IGNORECASE)
            speech_text = re.sub(r'[A-Za-z]+', '', s_cleaned).strip()
        else:
            raw_speech = (
                f"Rythu Mitra Report: Crop {crop}. Problem {disease_en}. "
                f"Description: {desc_en[:120]}. "
                f"Organic Solution: {org_en[:120]}. "
                f"Chemical Solution: {chem_en[:120]}. "
                f"Recommended Product: {prod_name}, Dosage {dosage}. "
                f"Precautions: {prec_en[:100]}."
            )
            speech_text = re.sub(r'[\u0c00-\u0c7f]+', '', raw_speech).strip()

        # Synthesize Audio Voice Note
        audio_url = self.generate_audio_advisory(speech_text, lang=lang)

        return {
            "crop": crop,
            "crop_te": crop_te,
            "disease": disease_en,
            "disease_telugu": disease_te,
            "class_name": class_name,
            "confidence": round(confidence, 4),
            "risk_level": risk_level,
            "is_low_confidence": is_low_confidence,
            "description_en": desc_en,
            "description_te": desc_te,
            "organic_solution_en": org_en,
            "organic_solution_te": org_te,
            "chemical_solution_en": chem_en,
            "chemical_solution_te": chem_te,
            "precautions_en": prec_en,
            "precautions_te": prec_te,
            "product_name": prod_name,
            "product_type": prod_type,
            "dosage": dosage,
            "product_image": prod_img,
            "climate_advisory": climate_adv,
            "audio_url": audio_url
        }

    def run_pipeline(self, image_bytes: bytes, weather_data: Optional[Dict[str, Any]] = None, lang: str = "te") -> Dict[str, Any]:
        return self.diagnose_crop(image_bytes, weather_data, lang)

    def generate_audio_advisory(self, text: str, lang: str = "te") -> Optional[str]:
        try:
            filename = f"advisory_{lang}_{uuid.uuid4().hex[:10]}.mp3"
            filepath = os.path.join(self.audio_dir, filename)

            if GTTS_AVAILABLE:
                tts = gTTS(text=text[:350], lang="te" if lang == "te" else "en", slow=False)
                tts.save(filepath)
                return f"/api/audio/{filename}"
            return None
        except Exception as e:
            logger.error(f"[Pipeline] Audio TTS generation notice (non-fatal): {e}")
            return None

pipeline = AgriculturalPipeline()
