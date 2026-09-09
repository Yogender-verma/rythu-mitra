import React from 'react';
import { Bell, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';

export const Header: React.FC = () => {
  const { user, language, setLanguage } = useAuth();

  return (
    <header className="bg-[#2E7D32] text-black border-b-2 border-[#B7C9B3] sticky top-0 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-md">
      {/* Mobile Logo View */}
      <div className="md:hidden">
        <Logo variant="green" size="sm" />
      </div>

      {/* Desktop Welcome Title */}
      <div className="hidden md:flex items-center gap-3">
        <span className="text-xl font-black text-black text-telugu">
          {language === 'te' ? `నమస్తే, ${user?.name || 'రైతు సోదరా'} 👋` : `Namaste, ${user?.name || 'Farmer'} 👋`}
        </span>
        <span className="text-xs px-3.5 py-1.5 rounded-full bg-[#C8E6C9] text-black font-black border-2 border-[#B7C9B3] shadow-sm">
          🌱 Telangana Farm Mode
        </span>
      </div>

      {/* Action Utilities */}
      <div className="flex items-center gap-3">
        {/* Language Switcher Button */}
        <button
          onClick={() => setLanguage(language === 'te' ? 'en' : 'te')}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#C8E6C9] hover:bg-[#A5D6A7] text-black border-2 border-[#B7C9B3] text-xs font-black transition-all touch-target shadow-sm"
        >
          <Globe className="w-4 h-4 text-black" />
          <span className="text-black font-black">{language === 'te' ? 'English' : 'తెలుగు'}</span>
        </button>

        {/* Notifications Icon Button */}
        <button
          title="Notifications"
          className="p-2.5 bg-[#C8E6C9] hover:bg-[#A5D6A7] text-black rounded-2xl border-2 border-[#B7C9B3] transition-colors relative touch-target shadow-sm flex items-center justify-center"
        >
          <Bell className="w-5 h-5 text-black" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#2E7D32] rounded-full animate-pulse border border-black"></span>
        </button>
      </div>
    </header>
  );
};
