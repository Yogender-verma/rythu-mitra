import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, History, Calendar, MapPin, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import type { CropScanRecord } from '../types';
import { useAuth } from '../context/AuthContext';

export const HistoryPage: React.FC = () => {
  const { language } = useAuth();
  const navigate = useNavigate();

  const [scans, setScans] = useState<CropScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('ALL');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await api.getScans();
        setScans(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredScans = scans.filter((scan) => {
    const matchesSearch =
      scan.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.diagnosis.disease.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (scan.diagnosis.disease_telugu && scan.diagnosis.disease_telugu.includes(searchQuery));

    const matchesCrop = selectedCropFilter === 'ALL' || scan.crop === selectedCropFilter;
    const matchesRisk = selectedRiskFilter === 'ALL' || scan.diagnosis.risk_level === selectedRiskFilter;

    return matchesSearch && matchesCrop && matchesRisk;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border-2 border-emerald-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-forest-950 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">Diagnosis Archive</span>
          <h1 className="text-2xl font-black text-black mt-1.5 text-telugu">
            {language === 'te' ? 'గత శోధనలు (Past Searches)' : 'Past Searches'}
          </h1>
        </div>

        <span className="text-xs font-black bg-emerald-200 text-black px-3.5 py-1.5 rounded-xl border border-emerald-300">
          Total Records: {scans.length}
        </span>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 md:p-6 rounded-3xl border-2 border-emerald-300 shadow-sm space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-black absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search previous scans (e.g. Cotton, Rice Blast, Leaf Curl)..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-emerald-300 focus:border-forest-800 outline-none text-sm font-black text-black touch-target bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-black text-black uppercase tracking-wider">
            <Filter className="w-4 h-4 text-forest-900" />
            <span>Filters:</span>
          </div>

          <select
            value={selectedCropFilter}
            onChange={(e) => setSelectedCropFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border-2 border-emerald-300 text-xs font-black text-black bg-emerald-50 outline-none touch-target"
          >
            <option value="ALL">All Crops</option>
            <option value="Cotton">Cotton (ప్రత్తి)</option>
            <option value="Paddy">Paddy (వరి)</option>
            <option value="Chilli">Chilli (మిర్చి)</option>
            <option value="Maize">Maize (మొక్కజొన్న)</option>
          </select>

          <select
            value={selectedRiskFilter}
            onChange={(e) => setSelectedRiskFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border-2 border-emerald-300 text-xs font-black text-black bg-emerald-50 outline-none touch-target"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="High">High Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low Risk</option>
          </select>
        </div>
      </div>

      {/* History Grid */}
      {loading ? (
        <div className="p-8 text-center text-black font-black">Loading history records...</div>
      ) : filteredScans.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border-2 border-emerald-300 text-center space-y-3">
          <History className="w-12 h-12 text-forest-900 mx-auto" />
          <h3 className="text-lg font-black text-black">No past search records found</h3>
          <p className="text-xs text-forest-950 font-black">Try adjusting your search query or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredScans.map((scan) => (
            <div
              key={scan.id}
              onClick={() => navigate(`/scan/${scan.id}`)}
              className="bg-white p-5 rounded-3xl border-2 border-emerald-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={scan.image_url}
                  alt={scan.crop}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-300 flex-shrink-0"
                />

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-black uppercase">{scan.crop}</span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${
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

                  <h3 className="text-sm font-black text-black truncate text-telugu">
                    {scan.diagnosis.disease_telugu || scan.diagnosis.disease}
                  </h3>

                  <div className="flex items-center gap-3 text-[11px] text-forest-950 font-black">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-forest-900" />
                      {new Date(scan.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-forest-900" />
                      {scan.district}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-9 h-9 rounded-full bg-emerald-100 text-black group-hover:bg-emerald-500 flex items-center justify-center transition-all flex-shrink-0 ml-2 border border-emerald-300">
                <ChevronRight className="w-5 h-5 text-black" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
