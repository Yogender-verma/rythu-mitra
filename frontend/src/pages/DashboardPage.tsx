import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, CloudSun, Leaf, History, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { CropScanRecord, WeatherData } from '../types';

export const DashboardPage: React.FC = () => {
  const { user, language } = useAuth();
  const navigate = useNavigate();

  const [scans, setScans] = useState<CropScanRecord[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [scansData, weatherData] = await Promise.all([
          api.getScans(),
          api.getWeather('Karimnagar'),
        ]);
        setScans(scansData);
        setWeather(weatherData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalScans = scans.length;
  const healthyCrops = scans.filter((s) => s.diagnosis.risk_level === 'Low').length;
  const problemsDetected = scans.filter((s) => s.diagnosis.risk_level === 'High' || s.diagnosis.risk_level === 'Medium').length;
  const recentScan = scans[0];

  return (
    <div className="space-y-6">
      {/* Top Green & White Banner Hero */}
      <div className="bg-emerald-50 border-2 border-emerald-400 rounded-3xl p-6 md:p-8 text-black shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-15 pointer-events-none flex items-center pr-8">
          <Leaf className="w-64 h-64 text-forest-900" />
        </div>

        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-200 text-forest-950 border border-emerald-400 text-xs font-black">
            <Sparkles className="w-4 h-4 text-forest-900" />
            <span>Digital Farm Assistant • తెలంగాణ</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-black text-telugu">
            {language === 'te' ? `నమస్తే, ${user?.name || 'రైతు సోదరా'} 👋` : `Namaste, ${user?.name || 'Farmer'} 👋`}
          </h1>

          <p className="text-forest-950 text-sm md:text-base font-extrabold text-telugu">
            {language === 'te'
              ? 'మీ పంటల ఆరోగ్యాన్ని కాపాడుకోవడానికి మరియు సకాలంలో సలహాలు పొందడానికి స్కాన్ చేయండి.'
              : "Let's keep your crops healthy with instant AI diagnosis & Telugu advisories."}
          </p>

          <div className="pt-2">
            <Link
              to="/scan"
              className="inline-flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-black px-7 py-3.5 rounded-2xl shadow-lg transition-all hover:scale-105 touch-target text-base border border-emerald-600"
            >
              <Camera className="w-5 h-5 text-black" />
              <span className="text-telugu">{language === 'te' ? 'పంటను స్కాన్ చేయండి' : 'Scan a Crop'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid - Clean White with Emerald Borders */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scans */}
        <div className="bg-white p-5 rounded-3xl border-2 border-emerald-300 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-forest-950 font-black block text-telugu">
              {language === 'te' ? 'మొత్తం స్కాన్‌లు' : 'Total Scans'}
            </span>
            <span className="text-2xl md:text-3xl font-black text-black mt-1 block">
              {totalScans}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-forest-950 flex items-center justify-center text-xl font-bold border border-emerald-300">
            🌿
          </div>
        </div>

        {/* Healthy Crops */}
        <div className="bg-white p-5 rounded-3xl border-2 border-emerald-300 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-forest-950 font-black block text-telugu">
              {language === 'te' ? 'ఆరోగ్యకరమైనవి' : 'Healthy Crops'}
            </span>
            <span className="text-2xl md:text-3xl font-black text-forest-950 mt-1 block">
              {healthyCrops}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-forest-950 flex items-center justify-center text-xl font-bold border border-emerald-300">
            🌱
          </div>
        </div>

        {/* Problems Detected */}
        <div className="bg-white p-5 rounded-3xl border-2 border-emerald-300 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-forest-950 font-black block text-telugu">
              {language === 'te' ? 'గుర్తించిన సమస్యలు' : 'Problems Detected'}
            </span>
            <span className="text-2xl md:text-3xl font-black text-amber-950 mt-1 block">
              {problemsDetected}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-950 flex items-center justify-center text-xl font-bold border border-amber-300">
            ⚠️
          </div>
        </div>

        {/* Recent Scan Status */}
        <div className="bg-white p-5 rounded-3xl border-2 border-emerald-300 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-forest-950 font-black block text-telugu">
              {language === 'te' ? 'ఇటీవలి స్కాన్' : 'Recent Scan'}
            </span>
            <span className="text-sm font-black text-black mt-1 block truncate max-w-[110px]">
              {recentScan ? recentScan.crop : 'No Scans'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-black flex items-center justify-center text-xl font-bold border border-emerald-200">
            📷
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Quick Scan CTA & Weather Insight */}
        <div className="lg:col-span-7 space-y-6">

          {/* Quick Scan Big Card - Green & White */}
          <div className="bg-emerald-500 text-black rounded-3xl p-6 md:p-8 shadow-lg space-y-4 border-2 border-emerald-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border-2 border-emerald-600 shadow">
                  <Camera className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-black text-telugu">Quick Crop Scan</h3>
                  <p className="text-xs font-black text-forest-950">Instant AI diagnosis from leaf photo</p>
                </div>
              </div>
            </div>

            <p className="text-sm font-black text-black leading-relaxed text-telugu">
              ప్రత్తి, వరి, మిర్చి మరియు మొక్కజొన్న పంటల ఫోటోను నేరుగా కెమెరా లేదా గ్యాలరీ ద్వారా అప్‌లోడ్ చేయండి.
            </p>

            <button
              onClick={() => navigate('/scan')}
              className="w-full bg-black text-white hover:bg-forest-950 font-black py-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 touch-target text-base"
            >
              <span className="text-white">Take or Upload Crop Photo</span>
              <ArrowRight className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Crop Health Insight Banner */}
          {weather && (
            <div className="bg-white border-2 border-amber-400 rounded-3xl p-6 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-black font-black text-sm">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span className="text-telugu">Crop Health Insight (వాతావరణ ఆధారిత సలహా)</span>
                </div>
                <span className="text-[10px] bg-amber-200 text-black px-2.5 py-0.5 rounded-full font-black border border-amber-400">
                  Advisory Engine
                </span>
              </div>

              <p className="text-black text-base font-black text-telugu leading-relaxed">
                "{language === 'te' ? weather.insight_te : weather.insight_en}"
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Weather Today & Recent Searches */}
        <div className="lg:col-span-5 space-y-6">

          {/* Weather Today Card */}
          <div className="bg-white p-6 rounded-3xl border-2 border-emerald-300 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudSun className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-black text-sm text-telugu">
                  Weather Today (నేటి వాతావరణం)
                </h3>
              </div>
              <span className="text-xs text-forest-950 font-black bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300">
                Karimnagar, TS
              </span>
            </div>

            {weather ? (
              <div className="grid grid-cols-3 gap-3 text-center pt-2">
                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] text-forest-950 font-black block uppercase">Temp</span>
                  <span className="text-lg font-black text-black mt-0.5 block">{weather.temperature}</span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] text-forest-950 font-black block uppercase">Humidity</span>
                  <span className="text-lg font-black text-black mt-0.5 block">{weather.humidity}</span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] text-forest-950 font-black block uppercase">Rain %</span>
                  <span className="text-lg font-black text-black mt-0.5 block">{weather.rainfall_probability}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-black font-black">Loading weather...</div>
            )}
          </div>

          {/* Recent Searches */}
          <div className="bg-white p-6 rounded-3xl border-2 border-emerald-300 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-forest-900" />
                <h3 className="font-black text-black text-sm text-telugu">
                  Recent Searches (ఇటీవలి హిస్టరీ)
                </h3>
              </div>
              <Link to="/history" className="text-xs font-black text-forest-900 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {scans.slice(0, 3).map((scan) => (
                <div
                  key={scan.id}
                  onClick={() => navigate(`/scan/${scan.id}`)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-200"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={scan.image_url}
                      alt={scan.crop}
                      className="w-12 h-12 rounded-xl object-cover border border-emerald-300"
                    />
                    <div>
                      <span className="text-xs font-black text-black block">{scan.crop}</span>
                      <span className="text-xs text-forest-950 font-extrabold text-telugu block line-clamp-1">
                        {scan.diagnosis.disease_telugu || scan.diagnosis.disease}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-black ${
                      scan.diagnosis.risk_level === 'High'
                        ? 'bg-red-200 text-red-950 border border-red-300'
                        : scan.diagnosis.risk_level === 'Medium'
                        ? 'bg-amber-200 text-amber-950 border border-amber-300'
                        : 'bg-emerald-200 text-forest-950 border border-emerald-300'
                    }`}
                  >
                    {scan.diagnosis.risk_level}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
