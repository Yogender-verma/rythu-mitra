export type SupportedCrop = 'Cotton' | 'Paddy' | 'Chilli' | 'Maize';

export type CropStage = 'Seedling' | 'Vegetative' | 'Flowering' | 'Fruiting/Grain filling' | 'Harvest/Maturity';

export type RiskLevel = 'High' | 'Medium' | 'Low' | 'Unknown';

export interface User {
  id: number;
  firebase_uid?: string;
  name: string;
  email?: string;
  phone?: string;
  district?: string;
  mandal?: string;
  village?: string;
  preferred_crop?: string;
  voice_speed?: string;
  auth_provider?: string;
  language: 'te' | 'en';
  profile_photo?: string;
  has_phone: boolean;
}

export interface Diagnosis {
  crop: string;
  disease_en: string;
  disease_te: string;
  disease?: string;
  disease_telugu?: string;
  confidence: number;
  risk_level: RiskLevel;
  is_healthy?: boolean;
  is_low_confidence?: boolean;
}

export interface Advisory {
  is_healthy?: boolean;
  is_low_confidence?: boolean;
  disease_en: string;
  disease_te: string;
  risk_level: RiskLevel;
  season_en?: string;
  season_te?: string;
  why_en?: string;
  why_te?: string;
  actions_en?: string;
  actions_te?: string;
  recommendation_en?: string;
  recommendation_te?: string;
  dosage_en?: string;
  dosage_te?: string;
  safety_notes_en?: string;
  safety_notes_te?: string;
  medicine_name_en?: string;
  medicine_name_te?: string;
  medicine_image?: string;
  medicine_type_en?: string;
  medicine_type_te?: string;
  product_name?: string;
  product_image?: string;
  weather_summary_en?: string;
  weather_summary_te?: string;
  audio_text_en?: string;
  audio_text_te?: string;
  audio_url?: string;
  audio_url_te?: string;
  audio_url_en?: string;
}

export interface WeatherData {
  is_weather_available?: boolean;
  location_name?: string;
  temperature: string;
  humidity: string;
  rainfall_probability?: string;
  condition: string;
  condition_telugu?: string;
  weather_code?: number;
  insight_en?: string;
  insight_te?: string;
}

export interface CropScanRecord {
  scan_id?: string;
  id?: string;
  user_id?: number;
  image_url?: string;
  crop: string;
  crop_stage?: string | null;
  district?: string;
  mandal?: string;
  diagnosis: Diagnosis;
  advisory: Advisory;
  weather?: WeatherData;
  audio_url?: string;
  audio_url_te?: string;
  audio_url_en?: string;
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
