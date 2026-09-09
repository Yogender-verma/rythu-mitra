import React from 'react';
import { Sprout } from 'lucide-react';

interface LogoProps {
  variant?: 'light' | 'dark' | 'green';
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ size = 'md' }) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center gap-2.5 font-black tracking-tight">
      <div className="rounded-xl p-2 flex items-center justify-center bg-[#C8E6C9] text-black border-2 border-[#B7C9B3] shadow">
        <Sprout className={`${iconSizes[size]} text-black`} />
      </div>
      <div className="flex flex-col">
        <span className={`${textSizes[size]} text-black font-black flex items-center gap-1.5 leading-none`}>
          RythuMitra <span className="text-black text-xs px-1.5 py-0.5 rounded bg-[#C8E6C9] font-black border border-[#B7C9B3]">AI</span>
        </span>
        <span className="text-[10px] tracking-wider uppercase font-black text-black text-telugu mt-0.5">
          రైతు మిత్ర AI • తెలంగాణ
        </span>
      </div>
    </div>
  );
};
