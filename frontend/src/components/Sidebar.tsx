import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ScanLine, History, CreditCard, Settings, LogOut } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout, language, setLanguage } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    {
      name: language === 'te' ? 'డాష్‌బోర్డ్' : 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: language === 'te' ? 'పంట స్కాన్' : 'Crop Scan',
      path: '/scan',
      icon: ScanLine,
    },
    {
      name: language === 'te' ? 'గత శోధనలు' : 'Past Searches',
      path: '/history',
      icon: History,
    },
    {
      name: language === 'te' ? 'చందాలు & ప్లాన్‌లు' : 'Subscriptions',
      path: '/subscriptions',
      icon: CreditCard,
    },
    {
      name: language === 'te' ? 'సెట్టింగ్‌లు' : 'Settings',
      path: '/settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-[#2E7D32] text-black flex flex-col justify-between hidden md:flex border-r-2 border-[#B7C9B3] shadow-2xl min-h-screen sticky top-0 z-50">
      <div>
        {/* Brand Header - Agricultural Green Background with Black Logo */}
        <div className="p-5 border-b-2 border-[#B7C9B3] bg-[#2E7D32]">
          <Logo variant="green" size="md" />
        </div>

        {/* Navigation Items - Black Text & Black Icons */}
        <nav className="p-4 space-y-2 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-black transition-all text-sm touch-target ${
                    isActive
                      ? 'bg-[#C8E6C9] text-black shadow-md border-2 border-[#B7C9B3] ring-2 ring-[#A5D6A7]'
                      : 'text-black hover:bg-[#43A047] hover:text-black font-black'
                  }`
                }
              >
                <Icon className="w-5 h-5 text-black flex-shrink-0" />
                <span className="text-telugu tracking-wide text-black font-black">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Language Toggle - Agricultural Green with Black Text */}
      <div className="p-4 border-t-2 border-[#B7C9B3] bg-[#2E7D32] space-y-3">
        {/* Language Switcher */}
        <div className="flex items-center justify-between bg-[#C8E6C9] p-1.5 rounded-2xl border-2 border-[#B7C9B3]">
          <button
            onClick={() => setLanguage('te')}
            className={`flex-1 py-2 px-2 text-xs rounded-xl font-black transition-all text-center ${
              language === 'te' ? 'bg-[#2E7D32] text-white shadow-md' : 'text-black hover:bg-[#A5D6A7]'
            }`}
          >
            తెలుగు
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`flex-1 py-2 px-2 text-xs rounded-xl font-black transition-all text-center ${
              language === 'en' ? 'bg-[#2E7D32] text-white shadow-md' : 'text-black hover:bg-[#A5D6A7]'
            }`}
          >
            English
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#C8E6C9] border-2 border-[#B7C9B3] text-black">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={user?.profile_photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=200&auto=format&fit=crop'}
              alt="Farmer Profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-[#2E7D32]"
            />
            <div className="flex flex-col truncate">
              <span className="text-xs font-black text-black truncate">
                {user?.name || (language === 'te' ? 'రైతు సోదరుడు' : 'Telangana Farmer')}
              </span>
              <span className="text-[10px] text-black font-extrabold truncate">
                {user?.phone || user?.email || (language === 'te' ? '+91 తెలంగాణ రైతు' : '+91 Telangana Farmer')}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            title={language === 'te' ? 'లాగౌట్' : 'Logout'}
            className="p-2 text-black hover:bg-[#A5D6A7] hover:text-red-700 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>
    </aside>
  );
};
