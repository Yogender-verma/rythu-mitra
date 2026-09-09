import React, { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SubscriptionsPage: React.FC = () => {
  const { language } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'PRO'>('PRO');
  const [showModal, setShowModal] = useState(false);

  const plans = [
    {
      id: 'FREE',
      name: 'Free Farmer',
      teluguName: 'ఉచిత రైతు ప్లాన్',
      badge: '🌱 Standard',
      price: '₹0',
      period: 'Forever',
      description: 'Ideal for small gardens and casual crop checks.',
      features: [
        'Up to 5 crop scans per month',
        'Basic disease & pest diagnosis',
        'Standard treatment guidance',
        'Text advisory in Telugu & English',
      ],
      isPopular: false,
      ctaText: 'Current Plan',
    },
    {
      id: 'PRO',
      name: 'Farmer Plus',
      teluguName: 'రైతు ప్లస్ ప్లాన్',
      badge: '🌿 Recommended',
      price: '₹99',
      period: 'per month',
      description: 'Complete digital companion for active smallholder farmers.',
      features: [
        'Unlimited crop scans',
        'High-precision AI disease diagnosis',
        '🔊 Full Telugu Voice Advisory playback',
        'Weather-aware irrigation & spray alerts',
        'Complete scan history storage',
        'Priority PJTSAU agricultural expert guidance',
      ],
      isPopular: true,
      ctaText: 'Upgrade to Farmer Plus',
    },
  ];

  const handleSubscribeClick = (planId: 'FREE' | 'PRO') => {
    setSelectedPlan(planId);
    setShowModal(true);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <span className="text-xs font-black uppercase tracking-wider text-forest-950 bg-emerald-200 px-3 py-1 rounded-full border border-emerald-300">
          Agricultural Plans
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-black text-telugu">
          {language === 'te' ? 'రైతు ప్లాన్‌లు & చందాలు' : 'RythuMitra Subscription Plans'}
        </h1>
        <p className="text-forest-950 font-black text-sm max-w-xl mx-auto text-telugu">
          మీ పంటలకు తగిన ప్లాన్‌ను ఎంచుకోండి. తెలుగు వాయిస్ సలహాలు మరియు అన్‌లిమిటెడ్ స్కాన్‌లు పొందండి.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-3xl p-8 flex flex-col justify-between transition-all relative ${
              plan.isPopular
                ? 'bg-emerald-500 text-black border-2 border-emerald-600 shadow-2xl'
                : 'bg-white text-black border-2 border-emerald-300 shadow-md'
            }`}
          >
            {plan.isPopular && (
              <div className="absolute -top-3.5 right-8 bg-black text-white text-xs font-black px-3 py-1 rounded-full shadow">
                MOST POPULAR
              </div>
            )}

            <div className="space-y-6">
              <div>
                <span className={`text-xs font-black px-3 py-1 rounded-full border ${
                  plan.isPopular ? 'bg-white text-black border-black' : 'bg-emerald-100 text-forest-950 border-emerald-300'
                }`}>
                  {plan.badge}
                </span>
                <h3 className="text-2xl font-black mt-3 text-telugu text-black">{plan.name}</h3>
                <span className="text-xs font-black opacity-90 text-telugu text-black">{plan.teluguName}</span>
              </div>

              <div className="flex items-baseline gap-1 text-black">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-xs font-black">/{plan.period}</span>
              </div>

              <p className="text-xs font-black leading-relaxed text-telugu text-black">
                {plan.description}
              </p>

              <div className="space-y-3 pt-4 border-t border-emerald-600/40">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs font-black text-black">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-black" />
                    <span className="text-telugu">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={() => handleSubscribeClick(plan.id as any)}
                className={`w-full py-4 rounded-2xl font-black text-sm transition-all shadow-md touch-target ${
                  plan.isPopular
                    ? 'bg-black text-white hover:bg-forest-950 hover:scale-105'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-black border border-emerald-600'
                }`}
              >
                {plan.ctaText}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Subscription Architecture Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full space-y-4 text-center border-2 border-emerald-400">
            <div className="w-12 h-12 bg-emerald-200 text-black rounded-2xl flex items-center justify-center mx-auto border border-emerald-300">
              <Sparkles className="w-6 h-6 text-black" />
            </div>

            <h3 className="text-xl font-black text-black">Subscription Gateway Ready</h3>
            
            <p className="text-xs text-forest-950 font-black leading-relaxed text-telugu">
              ఈ సిస్టమ్‌లో రేజర్‌పే / స్ట్రైప్ పేమెంట్ గేట్‌వే సులభంగా అనుసంధానం చేయడానికి ఆర్కిటెక్చర్ సిద్ధంగా ఉంది.
            </p>

            <div className="bg-emerald-50 p-4 rounded-2xl text-xs text-black font-black space-y-1 border border-emerald-300">
              <div>Selected Plan: <span className="font-black">{selectedPlan}</span></div>
              <div>Status: <span className="text-forest-950 font-black">Architecture Ready</span></div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-black py-3.5 rounded-2xl text-sm border border-emerald-600"
            >
              Close Confirmation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
