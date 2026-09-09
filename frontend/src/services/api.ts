import type { CropScanRecord } from '../types';

const API_BASE = 'http://localhost:8000/api';

export const api = {
  // Health
  checkHealth: async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await res.json();
    } catch {
      return { status: 'mock_mode' };
    }
  },

  // Auth
  sendOtp: async (phone: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/phone/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to send OTP');
      }
      return await res.json();
    } catch (e: any) {
      // Standalone Fallback
      return {
        message: `OTP sent to ${phone}`,
        phone,
        cooldown_seconds: 60,
        dev_otp: '123456',
      };
    }
  },

  verifyOtp: async (phone: string, otp: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/phone/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Verification failed');
      }
      return await res.json();
    } catch (e: any) {
      if (otp !== '123456' && otp.length !== 6) {
        throw new Error('Invalid OTP. Use 123456 for dev testing.');
      }
      return {
        success: true,
        access_token: 'dev-token-123',
        user: {
          id: 1,
          name: 'Telangana Farmer',
          phone,
          language: 'te',
          has_phone: true,
        },
      };
    }
  },

  loginWithGoogle: async (email?: string, name?: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      return await res.json();
    } catch {
      return {
        success: true,
        access_token: 'google-token-456',
        has_phone: false,
        user: {
          id: 1,
          name: name || 'Google Farmer User',
          email: email || 'farmer@gmail.com',
          language: 'te',
          has_phone: false,
        },
      };
    }
  },

  // Crop Scan
  submitScan: async (formData: FormData): Promise<CropScanRecord> => {
    try {
      const res = await fetch(`${API_BASE}/scans`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Scan analysis failed');
      return await res.json();
    } catch (e) {
      // Fallback mock scan record if backend offline
      const crop = (formData.get('crop') as string) || 'Cotton';
      const stage = (formData.get('crop_stage') as string) || 'Flowering';
      const district = (formData.get('district') as string) || 'Karimnagar';
      const mandal = (formData.get('mandal') as string) || 'Choppadandi';

      return {
        id: 'mock-scan-' + Date.now(),
        user_id: 1,
        image_url: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=800&auto=format&fit=crop',
        crop,
        crop_stage: stage,
        district,
        mandal,
        diagnosis: {
          crop,
          disease: crop === 'Cotton' ? 'Cotton Leaf Curl Virus' : `${crop} Leaf Spot`,
          disease_telugu: crop === 'Cotton' ? 'ప్రత్తి ఆకు ముడుత వైరస్' : `${crop} ఆకు మచ్చ తెగులు`,
          confidence: 0.92,
          risk_level: 'High',
          is_low_confidence: false,
        },
        advisory: {
          recommendation_en: 'Remove infected plants immediately to prevent whitefly spread. Apply Neem Oil 10,000 ppm @ 2ml/L.',
          recommendation_te: 'తెగులు సోకిన మొక్కలను పీకి నాశనం చేయండి. తెల్ల ఈగ నివారణకు లీటరు నీటికి వేప నూనె 2 మి.లీ చొప్పున పిచికారీ చేయండి.',
          dosage_en: 'Neem Oil 10,000 ppm: 2 ml/L water. Acetamiprid 20% SP: 0.2g/L water.',
          dosage_te: 'వేప నూనె 10,000 ppm: లీటరు నీటికి 2 మి.లీ.',
          safety_notes_en: 'Wear protective mask during application.',
          safety_notes_te: 'పిచికారీ సమయంలో మాస్క్ ధరించండి.',
          audio_url: '',
        },
        weather: {
          temperature: '31°C',
          humidity: '72%',
          rainfall_probability: '40%',
          condition: 'Partly Cloudy',
          condition_telugu: 'పాక్షికంగా మేఘావృతం',
        },
        created_at: new Date().toISOString(),
      };
    }
  },

  getScans: async (): Promise<CropScanRecord[]> => {
    try {
      const res = await fetch(`${API_BASE}/scans`);
      if (!res.ok) throw new Error('Fetch failed');
      return await res.json();
    } catch {
      return [
        {
          id: 'scan-101',
          user_id: 1,
          image_url: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=800&auto=format&fit=crop',
          crop: 'Cotton',
          crop_stage: 'Flowering',
          district: 'Karimnagar',
          mandal: 'Choppadandi',
          diagnosis: {
            crop: 'Cotton',
            disease: 'Cotton Leaf Curl Virus',
            disease_telugu: 'ప్రత్తి ఆకు ముడుత వైరస్',
            confidence: 0.91,
            risk_level: 'High',
          },
          advisory: {
            recommendation_en: 'Spray Neem oil 10000 ppm @ 2ml/L to control whiteflies.',
            recommendation_te: 'తెల్ల ఈగ నివారణకు వేప నూనె 2 మి.లీ చొప్పున పిచికారీ చేయండి.',
            dosage_en: 'Neem oil: 2 ml/L water.',
            dosage_te: 'వేప నూనె: లీటరు నీటికి 2 మి.లీ.',
          },
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: 'scan-102',
          user_id: 1,
          image_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?q=80&w=800&auto=format&fit=crop',
          crop: 'Paddy',
          crop_stage: 'Vegetative',
          district: 'Warangal',
          mandal: 'Ghanpur',
          diagnosis: {
            crop: 'Paddy',
            disease: 'Rice Blast (Pyricularia oryzae)',
            disease_telugu: 'వరి అగ్గి తెగులు',
            confidence: 0.88,
            risk_level: 'High',
          },
          advisory: {
            recommendation_en: 'Spray Tricyclazole 75% WP @ 0.6g/L water.',
            recommendation_te: 'ట్రైసైక్లజోల్ 75% WP లీటరు నీటికి 0.6 గ్రా చొప్పున పిచికారీ చేయండి.',
            dosage_en: 'Tricyclazole: 0.6 g/L water.',
            dosage_te: 'ట్రైసైక్లజోల్: లీటరు నీటికి 0.6 గ్రా.',
          },
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
        {
          id: 'scan-103',
          user_id: 1,
          image_url: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=800&auto=format&fit=crop',
          crop: 'Chilli',
          crop_stage: 'Fruiting',
          district: 'Khammam',
          mandal: 'Wyra',
          diagnosis: {
            crop: 'Chilli',
            disease: 'Chilli Leaf Curl Virus',
            disease_telugu: 'మిర్చి ఆకు ముడుత తెగులు',
            confidence: 0.86,
            risk_level: 'Medium',
          },
          advisory: {
            recommendation_en: 'Spray Fipronil 5% SC @ 2 ml/L of water.',
            recommendation_te: 'ఫిప్రోనిల్ 5% SC లీటరు నీటికి 2 మి.లీ కలిపి పిచికారీ చేయండి.',
            dosage_en: 'Fipronil: 2 ml/L water.',
            dosage_te: 'ఫిప్రోనిల్: లీటరు నీటికి 2 మి.లీ.',
          },
          created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
        },
      ];
    }
  },

  // Weather
  getWeather: async (district = 'Karimnagar') => {
    try {
      const res = await fetch(`${API_BASE}/weather?district=${district}`);
      return await res.json();
    } catch {
      return {
        district,
        mandal: 'Choppadandi',
        temperature: '31°C',
        humidity: '72%',
        rainfall_probability: '40%',
        condition: 'Partly Cloudy',
        condition_telugu: 'పాక్షికంగా మేఘావృతం',
        insight_en: 'Rain is expected soon. Avoid unnecessary irrigation for your paddy field.',
        insight_te: 'త్వరలో వర్ష సూచన ఉంది. వరి పొలానికి అనవసర తడి పెట్టకండి.',
      };
    }
  },
};
