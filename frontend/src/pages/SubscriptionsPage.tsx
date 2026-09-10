import React, { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SubscriptionsPage: React.FC = () => {
  const { language } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'PRO'>('PRO');
  const [showModal, setShowModal] = useState(false);

  const t = {
    te: {
      badge: 'రైతు సబ్స్క్రిప్షన్ ప్లాన్‌లు',
      title: 'రైతు ప్లాన్‌లు & చందాలు',
      desc: 'మీ పంటలకు తగిన ప్లాన్‌ను ఎంచుకోండి. అపరిమిత స్కాన్‌లు మరియు నిపుణుల సలహాలు పొందండి.',
      mostPopular: 'అత్యంత ప్రజాదరణ పొందినది',
      modalTitle: 'చెల్లింపు గేట్‌వే సిద్ధంగా ఉంది',
      modalDesc: 'ఈ సిస్టమ్‌లో రేజర్‌పే / UPI పేమెంట్ గేట్‌వే సులభంగా అనుసంధానం చేయడానికి ఆర్కిటెక్చర్ సిద్ధంగా ఉంది.',
      selectedPlanLabel: 'ఎంచుకున్న ప్లాన్:',
      statusLabel: 'స్థితి:',
      statusReady: 'ఆర్కిటెక్చర్ సిద్ధం',
      closeBtn: 'మూసివేయండి',
      plans: [
        {
          id: 'FREE',
          name: 'ఉచిత రైతు ప్లాన్',
          badge: '🌱 ప్రాథమికం',
          price: '₹0',
          period: 'శాశ్వతం',
          description: 'చిన్న తోటలు మరియు సాధారణ తనిఖీలకు అనుకూలం.',
          features: [
            'నెలకు 5 ఉచిత పంట స్కాన్‌లు',
            'ప్రాథమిక వ్యాధి & పురుగు గుర్తింపు',
            'ప్రామాణిక చికిత్సా మార్గదర్శకాలు',
            'తెలుగు & ఆంగ్లంలో వ్రాతపూర్వక సలహాలు'
          ],
          isPopular: false,
          ctaText: 'ప్రస్తుత ప్లాన్'
        },
        {
          id: 'PRO',
          name: 'రైతు ప్లస్ ప్లాన్',
          badge: '🌿 సిఫార్సు చేయబడింది',
          price: '₹99',
          period: 'నెలకు',
          description: 'చురుకైన వ్యవసాయదారుల కోసం పూర్తి డిజిటల్ సహాయకుడు.',
          features: [
            'అపరిమిత పంట స్కాన్‌లు',
            'అత్యాధునిక ఏఐ ఖచ్చితత్వ నిర్ధారణ',
            '🔊 పూర్తి తెలుగు వాయిస్ ఆడియో సలహాలు',
            'వాతావరణ ఆధారిత నీటి యాజమాన్య సూచనలు',
            'పూర్తి స్కాన్ రికార్డుల నిల్వ',
            'PJTSAU విశ్వవిద్యాలయ ప్రామాణిక మార్గదర్శకాలు'
          ],
          isPopular: true,
          ctaText: 'రైతు ప్లస్‌కు అప్‌గ్రేడ్ అవ్వండి'
        }
      ]
    },
    en: {
      badge: 'Agricultural Subscription Plans',
      title: 'RythuMitra Subscription Plans',
      desc: 'Choose the right plan for your farm. Get unlimited crop scans and verified agricultural advisories.',
      mostPopular: 'MOST POPULAR',
      modalTitle: 'Subscription Gateway Ready',
      modalDesc: 'Payment architecture is configured and ready for Razorpay / UPI gateway integration.',
      selectedPlanLabel: 'Selected Plan:',
      statusLabel: 'Status:',
      statusReady: 'Architecture Ready',
      closeBtn: 'Close Confirmation',
      plans: [
        {
          id: 'FREE',
          name: 'Free Farmer Plan',
          badge: '🌱 Basic',
          price: '₹0',
          period: 'Forever',
          description: 'Ideal for small gardens and occasional crop checks.',
          features: [
            'Up to 5 crop scans per month',
            'Basic disease & pest diagnosis',
            'Standard treatment guidance',
            'Text advisory in Telugu & English'
          ],
          isPopular: false,
          ctaText: 'Current Plan'
        },
        {
          id: 'PRO',
          name: 'Farmer Plus Plan',
          badge: '🌿 Recommended',
          price: '₹99',
          period: 'per month',
          description: 'Complete digital companion for active smallholder farmers.',
          features: [
            'Unlimited crop scans',
            'High-precision AI disease diagnosis',
            '🔊 Full Telugu voice advisory playback',
            'Weather-aware irrigation & spray alerts',
            'Complete scan history storage',
            'Priority PJTSAU agricultural expert guidance'
          ],
          isPopular: true,
          ctaText: 'Upgrade to Farmer Plus'
        }
      ]
    }
  }[language];

  const handleSubscribeClick = (planId: 'FREE' | 'PRO') => {
    setSelectedPlan(planId);
    setShowModal(true);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto text-black">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <span className="text-xs font-black uppercase tracking-wider text-[#1B5E20] bg-[#C8E6C9] px-3.5 py-1 rounded-full border border-[#B7C9B3]">
          {t.badge}
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-black text-telugu">
          {t.title}
        </h1>
        <p className="text-gray-800 font-bold text-sm max-w-xl mx-auto text-telugu">
          {t.desc}
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {t.plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-3xl p-8 flex flex-col justify-between transition-all relative ${
              plan.isPopular
                ? 'bg-[#C8E6C9] text-black border-2 border-[#1B5E20] shadow-2xl'
                : 'bg-white text-black border-2 border-[#B7C9B3] shadow-md'
            }`}
          >
            {plan.isPopular && (
              <div className="absolute -top-3.5 right-8 bg-[#1B5E20] text-white text-xs font-black px-3.5 py-1 rounded-full shadow">
                {t.mostPopular}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <span className={`text-xs font-black px-3 py-1 rounded-full border ${
                  plan.isPopular ? 'bg-white text-[#1B5E20] border-[#1B5E20]' : 'bg-[#F5F8F2] text-black border-[#B7C9B3]'
                }`}>
                  {plan.badge}
                </span>
                <h3 className="text-2xl font-black mt-3 text-telugu text-black">{plan.name}</h3>
              </div>

              <div className="flex items-baseline gap-1 text-black">
                <span className="text-4xl font-black text-[#1B5E20]">{plan.price}</span>
                <span className="text-xs font-black text-gray-700">/{plan.period}</span>
              </div>

              <p className="text-xs font-black leading-relaxed text-telugu text-black">
                {plan.description}
              </p>

              <div className="space-y-3 pt-4 border-t border-[#B7C9B3]">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs font-black text-black">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#1B5E20]" />
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
                    ? 'bg-[#2E7D32] hover:bg-[#1B5E20] text-white hover:scale-105 border border-[#1B5E20]'
                    : 'bg-[#F5F8F2] hover:bg-[#E8F5E9] text-black border-2 border-[#B7C9B3]'
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
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full space-y-4 text-center border-2 border-[#B7C9B3]">
            <div className="w-12 h-12 bg-[#C8E6C9] text-[#1B5E20] rounded-2xl flex items-center justify-center mx-auto border border-[#B7C9B3]">
              <Sparkles className="w-6 h-6 text-[#1B5E20]" />
            </div>

            <h3 className="text-xl font-black text-black">{t.modalTitle}</h3>
            
            <p className="text-xs text-gray-800 font-black leading-relaxed text-telugu">
              {t.modalDesc}
            </p>

            <div className="bg-[#F5F8F2] p-4 rounded-2xl text-xs text-black font-black space-y-1.5 border border-[#B7C9B3]">
              <div>{t.selectedPlanLabel} <span className="font-black text-[#1B5E20]">{selectedPlan}</span></div>
              <div>{t.statusLabel} <span className="text-[#1B5E20] font-black">{t.statusReady}</span></div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black py-3.5 rounded-2xl text-sm border border-[#1B5E20]"
            >
              {t.closeBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
