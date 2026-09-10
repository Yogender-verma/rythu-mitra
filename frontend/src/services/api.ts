import type { CropScanRecord } from '../types';

const API_BASE = 'http://localhost:8000/api';
const FLASK_BASE = 'http://localhost:5000/api';

let currentAuthToken: string | null = null;

const getAuthHeaders = (extraHeaders: Record<string, string> = {}) => {
  const headers: Record<string, string> = { ...extraHeaders };
  if (currentAuthToken) {
    headers['Authorization'] = `Bearer ${currentAuthToken}`;
  }
  return headers;
};

export const api = {
  setAuthToken: (token: string | null) => {
    currentAuthToken = token;
  },

  sendOtp: async (phone: string) => {
    try {
      const res = await fetch(`${FLASK_BASE}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error_te || data.error || 'Failed to send OTP');
      }
      return data;
    } catch (e: any) {
      throw new Error(e.message || 'OTP dispatch failed');
    }
  },

  verifyOtp: async (phone: string, otp: string, language: string = 'te', name?: string) => {
    try {
      const res = await fetch(`${FLASK_BASE}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, language, name })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error_te || data.error || 'OTP verification failed');
      }
      return data;
    } catch (e: any) {
      throw new Error(e.message || 'OTP verification failed');
    }
  },

  checkHealth: async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await res.json();
    } catch {
      return { status: 'mock_mode' };
    }
  },

  syncFirebaseUser: async (token: string, nameOverride?: string) => {
    try {
      let url = `${API_BASE}/auth/sync`;
      if (nameOverride) {
        url += `?name_override=${encodeURIComponent(nameOverride)}`;
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to sync user with backend');
      }
      return await res.json();
    } catch (e: any) {
      console.warn('Backend sync warning:', e);
      return { success: false, error: e.message };
    }
  },

  linkPhoneToProfile: async (token: string, phone: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/link-phone`, {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }),
        body: JSON.stringify({ phone })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to link phone');
      }
      return await res.json();
    } catch (e: any) {
      console.warn('Backend link phone warning:', e);
      return { success: false, error: e.message };
    }
  },

  getCurrentUser: async (token?: string) => {
    try {
      const headers = token 
        ? { 'Authorization': `Bearer ${token}` }
        : getAuthHeaders();

      const res = await fetch(`${API_BASE}/user/me`, { headers });
      if (!res.ok) throw new Error('Failed to fetch profile');
      return await res.json();
    } catch (e: any) {
      console.warn('Fetch profile warning:', e);
      return null;
    }
  },

  // Crop Scan API
  submitScan: async (formData: FormData): Promise<CropScanRecord> => {
    const res = await fetch(`${API_BASE}/scans`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Scan analysis failed' }));
      throw new Error(err.detail || 'Scan analysis failed. Please check image format and server connection.');
    }
    return await res.json();
  },

  getScans: async (): Promise<CropScanRecord[]> => {
    try {
      const res = await fetch(`${API_BASE}/scans/history?user_id=1`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Fetch history failed');
      const data = await res.json();
      return data.history || [];
    } catch (err) {
      console.warn('History fetch fallback:', err);
      return [];
    }
  },

  // Real Open-Meteo & Nominatim Live Weather API
  getLiveWeather: async (lat?: number, lon?: number, district = 'Karimnagar') => {
    try {
      let url = `${API_BASE}/weather`;
      if (lat !== undefined && lon !== undefined) {
        url += `?lat=${lat}&lon=${lon}`;
      } else {
        url += `?district=${encodeURIComponent(district)}`;
      }
      const res = await fetch(url, { headers: getAuthHeaders() });
      return await res.json();
    } catch (err) {
      console.warn('Weather fetch warning:', err);
      return {
        is_weather_available: false,
        location_name: 'Live weather unavailable',
        temperature: 'N/A',
        humidity: 'N/A',
        condition: 'Live weather unavailable',
        condition_telugu: 'లైవ్ వాతావరణ సమాచారం అందుబాటులో లేదు'
      };
    }
  },

  getWeather: async (district = 'Karimnagar') => {
    return api.getLiveWeather(undefined, undefined, district);
  },

  shareScanToWhatsApp: async (payload: { phone: string; scan_id?: string; message: string; image_url?: string }) => {
    try {
      const res = await fetch(`${FLASK_BASE}/scans/share-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err) {
      console.warn('Flask WhatsApp dispatch notice:', err);
      return { success: true, local_only: true };
    }
  },

  getSettingsPhone: async (): Promise<string> => {
    try {
      const res = await fetch(`${FLASK_BASE}/settings/phone`);
      if (res.ok) {
        const data = await res.json();
        if (data.phone) {
          localStorage.setItem('rythumitra_settings_phone', data.phone);
          return data.phone;
        }
      }
    } catch (e) {
      console.warn('Get settings phone notice:', e);
    }
    return localStorage.getItem('rythumitra_settings_phone') || '+917013224596';
  },

  saveSettingsPhone: async (phone: string): Promise<boolean> => {
    try {
      localStorage.setItem('rythumitra_settings_phone', phone);
      const res = await fetch(`${FLASK_BASE}/settings/phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      return res.ok;
    } catch (e) {
      console.warn('Save settings phone notice:', e);
      return false;
    }
  },
};
