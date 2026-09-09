import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ScanLine, History, CreditCard, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const MobileNav: React.FC = () => {
  const { language } = useAuth();

  const navItems = [
    {
      name: language === 'te' ? 'హోమ్' : 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: language === 'te' ? 'స్కాన్' : 'Scan',
      path: '/scan',
      icon: ScanLine,
      isPrimary: true,
    },
    {
      name: language === 'te' ? 'హిస్టరీ' : 'History',
      path: '/history',
      icon: History,
    },
    {
      name: language === 'te' ? 'ప్లాన్‌లు' : 'Plans',
      path: '/subscriptions',
      icon: CreditCard,
    },
    {
      name: language === 'te' ? 'సెట్టింగ్స్' : 'Settings',
      path: '/settings',
      icon: Settings,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#2E7D32] text-black border-t-2 border-[#B7C9B3] px-2 py-2 z-50 shadow-2xl">
      <nav className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          if (item.isPrimary) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center -mt-6 p-4 rounded-full transition-all shadow-xl border-2 border-[#B7C9B3] ${
                    isActive
                      ? 'bg-[#C8E6C9] text-black ring-4 ring-[#A5D6A7] scale-105'
                      : 'bg-[#C8E6C9] text-black'
                  }`
                }
              >
                <Icon className="w-6 h-6 text-black" />
                <span className="sr-only">{item.name}</span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all touch-target ${
                  isActive ? 'bg-[#C8E6C9] text-black font-black shadow border border-[#B7C9B3]' : 'text-black hover:bg-[#43A047]'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5 text-black" />
              <span className="text-[10px] tracking-tight text-telugu font-black text-black">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
