from typing import Dict, Any

class AdvisoryEngine:
    """
    Contextual Advisory Rule & Knowledge Engine for RythuMitra AI.
    
    Uses pre-verified agricultural recommendations from Telangana Agricultural University (PJTSAU)
    guidelines based on crop, disease, crop stage, and weather snapshot.
    """

    KNOWLEDGE_BASE = {
        "Cotton": {
            "Cotton Leaf Curl Virus": {
                "recommendation_en": "Remove infected plants immediately to stop spread. Spray Neem Oil (10,000 ppm) @ 2 ml/L of water to control whitefly vector.",
                "recommendation_te": "తెగులు సోకిన మొక్కలను పీకి నాశనం చేయండి. తెల్ల ఈగ నివారణకు లీటరు నీటికి వేప నూనె 2 మి.లీ చొప్పున పిచికారీ చేయండి.",
                "dosage_en": "Neem Oil 10,000 ppm: 2 ml per liter water. Acetamiprid 20% SP: 0.2g per liter water if whiteflies are severe.",
                "dosage_te": "వేప నూనె 10,000 ppm: లీటరు నీటికి 2 మి.లీ. తీవ్రత ఎక్కువ ఉంటే ఎసిటామిప్రిడ్ 20% SP: లీటరు నీటికి 0.2 గ్రాములు.",
                "safety_notes_en": "Wear protective mask while spraying. Spray in early morning or evening hours. Avoid spraying during heavy wind.",
                "safety_notes_te": "పిచికారీ సమయంలో మాస్క్ ధరించండి. ఉదయం లేదా సాయంత్రం వేళల్లోనే పిచికారీ చేయండి."
            },
            "Bacterial Leaf Blight": {
                "recommendation_en": "Spray Copper Oxychloride 3g + Streptocycline 0.1g per liter of water. Avoid over-irrigation during rainy weather.",
                "recommendation_te": "కాపర్ ఆక్సిక్లోరైడ్ 3 గ్రా + స్ట్రెప్టోసైక్లిన్ 0.1 గ్రా లీటరు నీటికి కలిపి పిచికారీ చేయండి. వర్షాల వేళ నీరు నిల్వ ఉండకుండా చూడండి.",
                "dosage_en": "Copper Oxychloride: 3g/L water, Streptocycline: 100mg/L water.",
                "dosage_te": "కాపర్ ఆక్సిక్లోరైడ్: లీటరు నీటికి 3 గ్రా, స్ట్రెప్టోసైక్లిన్: లీటరు నీటికి 100 మి.గ్రా.",
                "safety_notes_en": "Ensure proper drainage in the field to prevent root suffocation.",
                "safety_notes_te": "పొలంలో నీరు త్వరగా ఇంకిపోయేలా మురుగు కాలువలు ఏర్పాటు చేయండి."
            },
            "Healthy Cotton Crop": {
                "recommendation_en": "Your crop is healthy! Maintain regular weed control and balanced NPK fertilizer application according to crop stage.",
                "recommendation_te": "మీ ప్రత్తి పైరు ఆరోగ్యంగా ఉంది! సమతుల్య ఎరువులను అందిస్తూ, కలుపు నివారణ చర్యలు చేపట్టండి.",
                "dosage_en": "Apply Urea @ 25 kg/acre split dose during flowering stage.",
                "dosage_te": "పూత దశలో ఎకరాకు 25 కేజీల యూరియాను అందించండి.",
                "safety_notes_en": "Inspect leaves weekly for early signs of pests.",
                "safety_notes_te": "వారానికి ఒకసారి ఆకుల వెనుక భాగాన్ని పరిశీలించండి."
            }
        },
        "Paddy": {
            "Rice Blast (Pyricularia oryzae)": {
                "recommendation_en": "Tricyclazole 75% WP @ 0.6g/L water. Reduce excess Nitrogenous fertilizer application.",
                "recommendation_te": "ట్రైసైక్లజోల్ 75% డబ్ల్యూ.పి. లీటరు నీటికి 0.6 గ్రా చొప్పున పిచికారీ చేయండి. నత్రజని (యూరియా) ఎరువు వాడకం తగ్గించండి.",
                "dosage_en": "Tricyclazole 75 WP: 120g per acre in 200 Liters of water.",
                "dosage_te": "ట్రైసైక్లజోల్ 75 WP: ఎకరాకు 120 గ్రాములు 200 లీటర్ల నీటిలో కలిపి.",
                "safety_notes_en": "Keep water level low in paddy fields during spray treatment.",
                "safety_notes_te": "పిచికారీ సమయంలో మడిలో నీటి మట్టాన్ని తక్కువగా ఉంచండి."
            },
            "Sheath Blight": {
                "recommendation_en": "Spray Hexaconazole 5% EC @ 2 ml/L water directed towards lower leaf sheaths.",
                "recommendation_te": "హెక్సాకొనజోల్ 5% ఈసీ లీటరు నీటికి 2 మి.లీ చొప్పున మొక్క మొదళ్ళ పై పడేలా పిచికారీ చేయండి.",
                "dosage_en": "Hexaconazole 5% EC: 400 ml per acre in 200L water.",
                "dosage_te": "హెక్సాకొనజోల్ 5% ఈసీ: ఎకరాకు 400 మి.లీ 200 లీటర్ల నీటిలో.",
                "safety_notes_en": "Avoid dense cropping spacing to enable sunlight airflow.",
                "safety_notes_te": "మొక్కల మధ్య సరైన గాలి, వెలుతురు ప్రసరించేలా చూడండి."
            },
            "Healthy Paddy Crop": {
                "recommendation_en": "Paddy is in vibrant health! Maintain 2-5 cm water depth during tillering and flowering stage.",
                "recommendation_te": "మీ వరి పైరు చాలా ఆరోగ్యంగా ఉంది! పిలకలు తొడిగే దశలో 2-5 సెం.మీ నీటి మట్టం నిర్వహించండి.",
                "dosage_en": "Potash application @ 15 kg/acre during panicle initiation.",
                "dosage_te": "చిరుపొట్ట దశలో ఎకరాకు 15 కేజీల పొటాష్ ఎరువు వేయండి.",
                "safety_notes_en": "Monitor for stem borer egg masses.",
                "safety_notes_te": "తొలుచు పురుగు గుడ్ల సముదాయాలను గమనించి ఏరివేయండి."
            }
        },
        "Chilli": {
            "Chilli Leaf Curl Virus (Thrips / Mites)": {
                "recommendation_en": "Spray Fipronil 5% SC @ 2 ml/L or Diafenthiuron 50% WP @ 1g/L of water. Install blue/yellow sticky traps.",
                "recommendation_te": "ఫిప్రోనిల్ 5% SC లీటరు నీటికి 2 మి.లీ లేదా డయాఫెంథియురాన్ 50% WP 1 గ్రా నీటిలో కలిపి పిచికారీ చేయండి. పసుపు, నీలి రంగు జిగురు కార్డులు ఏర్పాటు చేయండి.",
                "dosage_en": "Fipronil 5% SC: 400 ml/acre or Diafenthiuron: 250g/acre.",
                "dosage_te": "ఫిప్రోనిల్ 5% SC: ఎకరాకు 400 మి.లీ లేదా డయాఫెంథియురాన్: ఎకరాకు 250 గ్రా.",
                "safety_notes_en": "Do not mix multiple systemic insecticides simultaneously.",
                "safety_notes_te": "ఒకేసారి ఎక్కువ రకాల మందులను కలపవద్దు."
            },
            "Anthracnose / Fruit Rot": {
                "recommendation_en": "Spray Azoxystrobin 23% SC @ 1 ml/L or Mancozeb 75% WP @ 2.5g/L of water.",
                "recommendation_te": "అజాక్సీస్ట్రోబిన్ 23% SC లీటరు నీటికి 1 మి.లీ లేదా మ్యాంకోజెబ్ 75% WP 2.5 గ్రా నీటిలో కలిపి పిచికారీ చేయండి.",
                "dosage_en": "Azoxystrobin: 200 ml/acre in 200L water.",
                "dosage_te": "అజాక్సీస్ట్రోబిన్: ఎకరాకు 200 మి.లీ 200 లీటర్ల నీటిలో.",
                "safety_notes_en": "Pick affected rotting fruits and destroy them away from field.",
                "safety_notes_te": "కుళ్ళిన కాయలను ఏరివేసి పొలానికి దూరంగా తగలేయండి."
            },
            "Healthy Chilli Crop": {
                "recommendation_en": "Chilli plants are thriving. Ensure soil moisture balance and micronutrient spray (Formula 4) @ 5g/L.",
                "recommendation_te": "మిర్చి పైరు ఆరోగ్యంగా ఉంది. నేల తేమను కాపాడుతూ సూక్ష్మపోషకాల పిచికారీ చేయండి.",
                "dosage_en": "Micronutrient mixture: 5g per liter water.",
                "dosage_te": "సూక్ష్మపోషకాల మిశ్రమం: లీటరు నీటికి 5 గ్రాములు.",
                "safety_notes_en": "Prevent waterlogging near roots.",
                "safety_notes_te": "వేర్ల వద్ద నీరు నిల్వ ఉండకుండా జాగ్రత్తపడండి."
            }
        },
        "Maize": {
            "Turcicum Leaf Blight": {
                "recommendation_en": "Spray Mancozeb 75% WP @ 2.5g/L water at first appearance of long elliptical spots on lower leaves.",
                "recommendation_te": "ఆకులపై ఎండిన మచ్చలు కనిపించగానే మ్యాంకోజెబ్ 75% WP లీటరు నీటికి 2.5 గ్రా చొప్పున పిచికారీ చేయండి.",
                "dosage_en": "Mancozeb 75% WP: 500g per acre in 200L water.",
                "dosage_te": "మ్యాంకోజెబ్ 75% WP: ఎకరాకు 500 గ్రాములు 200 లీటర్ల నీటిలో.",
                "safety_notes_en": "Repeat spray after 10-12 days if wet weather continues.",
                "safety_notes_te": "వర్షాలు కొనసాగితే 10-12 రోజుల తర్వాత మళ్ళీ పిచికారీ చేయండి."
            },
            "Fall Armyworm Damage": {
                "recommendation_en": "Apply Emamectin Benzoate 5% SG @ 0.4g/L of water into crop whorls.",
                "recommendation_te": "ఎమామెక్టిన్ బెంజోయేట్ 5% SG లీటరు నీటికి 0.4 గ్రా చొప్పున సుడిలో పడేలా పిచికారీ చేయండి.",
                "dosage_en": "Emamectin Benzoate 5% SG: 80g per acre.",
                "dosage_te": "ఎమామెక్టిన్ బెంజోయేట్ 5% SG: ఎకరాకు 80 గ్రాములు.",
                "safety_notes_en": "Target nozzle directly into the central whorl of maize plants.",
                "safety_notes_te": "పిచికారీ నాజిల్ నేరుగా మొక్క సుడిలోకి ఉండేలా చూడండి."
            },
            "Healthy Maize Crop": {
                "recommendation_en": "Maize crop is healthy and growing strongly. Apply top dressing Nitrogen during kneehigh stage.",
                "recommendation_te": "మొక్కజొన్న పంట ఆరోగ్యంగా ఎదుగుతోంది. మోకాలు ఎత్తు దశలో నత్రజని ఎరువులు వేయండి.",
                "dosage_en": "Urea @ 35 kg/acre during vegetative stage.",
                "dosage_te": "ఎకరాకు 35 కేజీల యూరియా అందించండి.",
                "safety_notes_en": "Ensure sufficient moisture during cob formation stage.",
                "safety_notes_te": "కంకి తొడిగే దశలో తగినంత తేమ ఉండేలా చూడండి."
            }
        }
    }

    @classmethod
    def get_advisory(
        cls,
        crop: str,
        disease: str,
        crop_stage: str,
        weather_condition: str,
        risk_level: str
    ) -> Dict[str, str]:
        crop_key = crop.capitalize() if crop else "Cotton"
        crop_data = cls.KNOWLEDGE_BASE.get(crop_key, cls.KNOWLEDGE_BASE["Cotton"])
        
        # Match disease or fallback to healthy
        advice = crop_data.get(disease, None)
        if not advice:
            # Fallback matching
            for k, v in crop_data.items():
                if disease.lower() in k.lower() or k.lower() in disease.lower():
                    advice = v
                    break
        if not advice:
            advice = crop_data.get(
                "Healthy " + crop_key + " Crop",
                list(crop_data.values())[0]
            )

        # Weather contextual note addition
        weather_note_en = ""
        weather_note_te = ""
        if "rain" in weather_condition.lower() or "cloud" in weather_condition.lower():
            weather_note_en = f" 🌦️ Weather Warning ({weather_condition}): Rain is expected soon in your area. Postpone liquid sprays until rain stops to avoid chemical wash-off."
            weather_note_te = f" 🌦️ వాతావరణ సమాచారం ({weather_condition}): మీ ప్రాంతంలో వర్షం కురిసే అవకాశం ఉంది. మందుల పిచికారీని వర్షం తగ్గాకే చేపట్టండి."
        elif "hot" in weather_condition.lower() or "sunny" in weather_condition.lower():
            weather_note_en = f" ☀️ Weather Note: High temperature ({weather_condition}). Ensure light irrigation in evening hours to prevent moisture stress during {crop_stage} stage."
            weather_note_te = f" ☀️ వాతావరణ గమనిక: ఎండ తీవ్రత ఎక్కువగా ఉంది ({weather_condition}). {crop_stage} దశలో మొక్క నీటి ఎద్దడికి గురికాకుండా సాయంత్రం తడి అందించండి."

        return {
            "recommendation_en": advice["recommendation_en"] + weather_note_en,
            "recommendation_te": advice["recommendation_te"] + weather_note_te,
            "dosage_en": advice["dosage_en"],
            "dosage_te": advice["dosage_te"],
            "safety_notes_en": advice["safety_notes_en"],
            "safety_notes_te": advice["safety_notes_te"]
        }
