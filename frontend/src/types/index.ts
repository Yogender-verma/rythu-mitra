export type SupportedCrop = 'Cotton' | 'Paddy' | 'Chilli' | 'Maize';

export type CropStage = 'Seedling' | 'Vegetative' | 'Flowering' | 'Fruiting' | 'Harvest';

export type RiskLevel = 'High' | 'Medium' | 'Low' | 'Unknown';

export interface User {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  language: 'te' | 'en';
  profile_photo?: string;
  has_phone: boolean;
}

export interface Diagnosis {
  crop: string;
  disease: string;
  disease_telugu?: string;
  confidence: number;
  risk_level: RiskLevel;
  is_low_confidence?: boolean;
}

export interface Advisory {
  recommendation_en: string;
  recommendation_te: string;
  dosage_en: string;
  dosage_te: string;
  safety_notes_en?: string;
  safety_notes_te?: string;
  audio_url?: string;
}

export interface WeatherData {
  temperature: string;
  humidity: string;
  rainfall_probability: string;
  condition: string;
  condition_telugu?: string;
  insight_en?: string;
  insight_te?: string;
}

export interface CropScanRecord {
  id: string;
  user_id: number;
  image_url: string;
  crop: string;
  crop_stage: string;
  district: string;
  mandal: string;
  diagnosis: Diagnosis;
  advisory: Advisory;
  weather?: WeatherData;
  created_at: string;
}

export interface SubscriptionPlan {
  id: 'FREE' | 'PRO';
  name: string;
  name_telugu: string;
  price: string;
  period: string;
  features: string[];
  is_popular?: boolean;
}
