import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { api } from '../services/api';
import type { CropScanRecord } from '../types';

export const ScanDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [scan, setScan] = useState<CropScanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTelugu, setShowTelugu] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    const fetchScan = async () => {
      setLoading(true);
      try {
        const scans = await api.getScans();
        const found = scans.find((s) => s.id === id);
        if (found) {
          setScan(found);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchScan();
  }, [id]);

  const handlePlayAudio = () => {
    if (scan?.advisory.recommendation_te) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(scan.advisory.recommendation_te);
        utterance.lang = 'te-IN';
        setIsPlayingAudio(true);
        utterance.onend = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading scan record...</div>;
  }

  if (!scan) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">Scan record not found</h2>
        <button
          onClick={() => navigate('/history')}
          className="px-4 py-2 bg-forest-700 text-white rounded-xl font-bold"
        >
          Back to History
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <button
        onClick={() => navigate('/history')}
        className="flex items-center gap-2 text-forest-800 font-bold text-sm hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to History</span>
      </button>

      {/* Main Details Card */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-forest-100 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Historical Crop Diagnosis</span>
            <h1 className="text-2xl font-extrabold text-forest-950 text-telugu">
              {scan.diagnosis.disease_telugu || scan.diagnosis.disease}
            </h1>
            <span className="text-xs text-slate-500">{scan.diagnosis.disease}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-forest-100 text-forest-800 px-3 py-1 rounded-full font-bold text-xs">
              Confidence: {Math.round(scan.diagnosis.confidence * 100)}%
            </span>
            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-bold text-xs">
              Risk: {scan.diagnosis.risk_level}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-5">
            <img
              src={scan.image_url}
              alt="Crop"
              className="w-full h-56 object-cover rounded-2xl border border-forest-200"
            />
          </div>

          <div className="md:col-span-7 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-forest-50 p-3 rounded-xl">
                <span className="text-slate-500 font-semibold block">Crop</span>
                <span className="font-bold text-forest-950 text-sm">{scan.crop}</span>
              </div>
              <div className="bg-forest-50 p-3 rounded-xl">
                <span className="text-slate-500 font-semibold block">Stage</span>
                <span className="font-bold text-forest-950 text-sm">{scan.crop_stage}</span>
              </div>
              <div className="bg-forest-50 p-3 rounded-xl">
                <span className="text-slate-500 font-semibold block">District</span>
                <span className="font-bold text-forest-950 text-sm">{scan.district}</span>
              </div>
              <div className="bg-forest-50 p-3 rounded-xl">
                <span className="text-slate-500 font-semibold block">Date</span>
                <span className="font-bold text-forest-950 text-sm">{new Date(scan.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advisory Banner */}
      <div className="bg-forest-900 text-white p-6 md:p-8 rounded-3xl space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-forest-800 pb-4">
          <h3 className="text-xl font-bold text-telugu">నివారణ సలహా (Advisory)</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTelugu(!showTelugu)}
              className="px-3 py-1.5 rounded-lg bg-forest-800 text-xs font-bold"
            >
              {showTelugu ? 'Show English' : 'Show Telugu'}
            </button>
            <button
              onClick={handlePlayAudio}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                isPlayingAudio ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500 text-forest-950'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>🔊 Listen</span>
            </button>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-telugu text-forest-100">
          {showTelugu ? scan.advisory.recommendation_te : scan.advisory.recommendation_en}
        </p>
      </div>
    </div>
  );
};
