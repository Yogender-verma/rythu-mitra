import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, History, Calendar, MapPin, ArrowRight } from 'lucide-react';
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

  const t = {
    te: {
      badge: 'రోగనిర్ధారణ ఆర్కైవ్',
      title: 'గత శోధనలు',
      totalRecords: (count: number) => `మొత్తం రికార్డులు: ${count}`,
      searchPlaceholder: 'గత స్కాన్‌లను వెతకండి (ఉదా: ప్రత్తి, వరి, ఆకు ముడుత, అగ్గి తెగులు)...',
      filtersLabel: 'ఫిల్టర్లు:',
      allCrops: 'అన్ని పంటలు',
      allRisks: 'అన్ని రిస్క్ స్థాయిలు',
      riskHigh: 'తీవ్ర ప్రమాదం',
      riskMedium: 'మధ్యస్థ ప్రమాదం',
      riskLow: 'ఆరోగ్యకరం',
      riskNormal: 'సాధారణం',
      loading: 'శోధనల చరిత్ర లోడ్ అవుతోంది...',
      noRecordsTitle: 'ఎలాంటి గత రికార్డులు కనుగొనబడలేదు',
      noRecordsDesc: 'మీ శోధన పదం లేదా ఫిల్టర్‌లను మార్చి ప్రయత్నించండి.',
      recent: 'ఇటీవల',
      crops: {
        Cotton: 'ప్రత్తి',
        Paddy: 'వరి',
        Chilli: 'మిర్చి',
        Maize: 'మొక్కజొన్న'
      }
    },
    en: {
      badge: 'Diagnosis Archive',
      title: 'Past Searches',
      totalRecords: (count: number) => `Total Records: ${count}`,
      searchPlaceholder: 'Search previous scans (e.g. Cotton, Rice Blast, Leaf Curl)...',
      filtersLabel: 'Filters:',
      allCrops: 'All Crops',
      allRisks: 'All Risk Levels',
      riskHigh: 'High Risk',
      riskMedium: 'Medium Risk',
      riskLow: 'Low Risk',
      riskNormal: 'Normal',
      loading: 'Loading history records...',
      noRecordsTitle: 'No past search records found',
      noRecordsDesc: 'Try adjusting your search query or filters.',
      recent: 'Recent',
      crops: {
        Cotton: 'Cotton',
        Paddy: 'Paddy',
        Chilli: 'Chilli',
        Maize: 'Maize'
      }
    }
  }[language];

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

  const getCropDisplayName = (cropName: string) => {
    return t.crops[cropName as keyof typeof t.crops] || cropName;
  };

  const filteredScans = scans.filter((scan) => {
    const diseaseName = scan.diagnosis?.disease_te || scan.diagnosis?.disease_en || scan.diagnosis?.disease || '';
    const matchesSearch =
      scan.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
      diseaseName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCrop = selectedCropFilter === 'ALL' || scan.crop === selectedCropFilter;
    const matchesRisk = selectedRiskFilter === 'ALL' || scan.diagnosis?.risk_level === selectedRiskFilter;

    return matchesSearch && matchesCrop && matchesRisk;
  });

  return (
    <div className="space-y-6 text-black">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border-2 border-[#B7C9B3] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#1B5E20] bg-[#C8E6C9] px-3 py-1 rounded-full border border-[#B7C9B3]">
            {t.badge}
          </span>
          <h1 className="text-2xl font-black text-black mt-1.5 text-telugu">
            {t.title}
          </h1>
        </div>

        <span className="text-xs font-black bg-[#C8E6C9] text-black px-3.5 py-1.5 rounded-xl border border-[#B7C9B3]">
          {t.totalRecords(scans.length)}
        </span>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 md:p-6 rounded-3xl border-2 border-[#B7C9B3] shadow-sm space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-black absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-[#B7C9B3] focus:border-[#2E7D32] outline-none text-sm font-black text-black touch-target bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-black text-black uppercase tracking-wider">
            <Filter className="w-4 h-4 text-[#1B5E20]" />
            <span>{t.filtersLabel}</span>
          </div>

          <select
            value={selectedCropFilter}
            onChange={(e) => setSelectedCropFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border-2 border-[#B7C9B3] text-xs font-black text-black bg-[#F5F8F2] outline-none touch-target"
          >
            <option value="ALL">{t.allCrops}</option>
            <option value="Cotton">{t.crops.Cotton}</option>
            <option value="Paddy">{t.crops.Paddy}</option>
            <option value="Chilli">{t.crops.Chilli}</option>
            <option value="Maize">{t.crops.Maize}</option>
          </select>

          <select
            value={selectedRiskFilter}
            onChange={(e) => setSelectedRiskFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border-2 border-[#B7C9B3] text-xs font-black text-black bg-[#F5F8F2] outline-none touch-target"
          >
            <option value="ALL">{t.allRisks}</option>
            <option value="High">{t.riskHigh}</option>
            <option value="Medium">{t.riskMedium}</option>
            <option value="Low">{t.riskLow}</option>
          </select>
        </div>
      </div>

      {/* History Grid */}
      {loading ? (
        <div className="p-8 text-center text-black font-black">{t.loading}</div>
      ) : filteredScans.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border-2 border-[#B7C9B3] text-center space-y-3">
          <History className="w-12 h-12 text-[#1B5E20] mx-auto" />
          <h3 className="text-lg font-black text-black">{t.noRecordsTitle}</h3>
          <p className="text-xs text-black font-black">{t.noRecordsDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredScans.map((scan) => {
            const scanId = scan.id || scan.scan_id;
            const diseaseName = language === 'en'
              ? (scan.diagnosis?.disease_en || scan.diagnosis?.disease)
              : (scan.diagnosis?.disease_te || scan.diagnosis?.disease_telugu || scan.diagnosis?.disease);

            return (
              <div
                key={scanId}
                onClick={() => scanId && navigate(`/history/${scanId}`)}
                className="bg-white p-5 rounded-3xl border-2 border-[#B7C9B3] hover:border-[#2E7D32] shadow-sm flex items-center justify-between cursor-pointer transition-all hover:shadow-md group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={scan.image_url || 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=300'}
                    alt={scan.crop}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#B7C9B3] flex-shrink-0"
                  />

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-black uppercase">
                        {getCropDisplayName(scan.crop)}
                      </span>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${
                          scan.diagnosis?.risk_level === 'High'
                            ? 'bg-red-200 text-red-950 border border-red-300'
                            : scan.diagnosis?.risk_level === 'Medium'
                            ? 'bg-amber-200 text-amber-950 border border-amber-300'
                            : 'bg-[#C8E6C9] text-black border border-[#B7C9B3]'
                        }`}
                      >
                        {scan.diagnosis?.risk_level === 'High'
                          ? t.riskHigh
                          : scan.diagnosis?.risk_level === 'Medium'
                          ? t.riskMedium
                          : scan.diagnosis?.risk_level === 'Low'
                          ? t.riskLow
                          : t.riskNormal}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-black truncate text-telugu">
                      {diseaseName}
                    </h3>

                    {(scan.advisory?.medicine_name_en || scan.advisory?.product_name) && (
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-[#1B5E20] bg-[#E8F5E9] px-2 py-0.5 rounded-lg border border-[#B7C9B3] w-fit">
                        <span>💊</span>
                        <span className="truncate max-w-[180px]">
                          {language === 'en' 
                            ? (scan.advisory.medicine_name_en || scan.advisory.product_name)
                            : (scan.advisory.medicine_name_te || scan.advisory.medicine_name_en || scan.advisory.product_name)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-black font-black">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#1B5E20]" />
                        {scan.created_at ? new Date(scan.created_at).toLocaleDateString() : t.recent}
                      </span>
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#1B5E20]" />
                        {scan.district || (language === 'te' ? 'తెలంగాణ' : 'Telangana')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-[#F5F8F2] group-hover:bg-[#C8E6C9] text-black transition-colors ml-2 flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-black" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
