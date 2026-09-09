import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { MobileNav } from '../components/MobileNav';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F5F8F2] bg-farm-pattern flex flex-col md:flex-row text-black">
      {/* Desktop Agricultural Green Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* Desktop & Mobile Agricultural Green Header */}
        <Header />

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile Agricultural Green Bottom Navigation Bar */}
      <MobileNav />
    </div>
  );
};
