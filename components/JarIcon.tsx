import React from 'react';
import { Zap } from 'lucide-react';
import { CandyColor } from '../types';
import { EMOJI_MAP } from '../constants';

const JarIcon: React.FC<{ color: CandyColor, fillPercent: number, isFull: boolean }> = ({ color, fillPercent, isFull }) => {
  const colorHexMap: Record<CandyColor, string> = {
    red: '#f87171', blue: '#60a5fa', green: '#34d399', 
    yellow: '#facc15', purple: '#c084fc', orange: '#fb923c'
  };
  
  return (
    <div className={`relative w-full h-full flex items-center justify-center transition-transform ${isFull ? 'scale-110' : ''}`}>
       <svg viewBox="0 0 100 120" className="w-10 h-14 drop-shadow-md">
         <rect x="25" y="0" width="50" height="15" rx="2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
         <path d="M20 15 L80 15 L90 35 L90 110 Q90 120 80 120 L20 120 Q10 120 10 110 L10 35 Z" 
               fill="rgba(255,255,255,0.4)" stroke="#cbd5e1" strokeWidth="3" />
         <defs>
            <clipPath id={`clip-${color}`}>
               <path d="M20 15 L80 15 L90 35 L90 110 Q90 120 80 120 L20 120 Q10 120 10 110 L10 35 Z" />
            </clipPath>
         </defs>
         <rect x="0" y={120 - (105 * (fillPercent / 100))} width="100" height="120" 
               fill={colorHexMap[color]} clipPath={`url(#clip-${color})`} 
               className="transition-all duration-300 ease-out" />
         <path d="M80 40 L80 100" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
         {fillPercent > 20 && (
             <text x="50" y="80" fontSize="30" textAnchor="middle" fill="white" className="drop-shadow-sm opacity-90">
                {EMOJI_MAP[color]}
             </text>
         )}
       </svg>
       {isFull && (
           <div className="absolute top-0 right-0 bg-yellow-400 rounded-full p-1 animate-pulse border-2 border-white shadow-sm">
               <Zap size={10} className="text-yellow-800" fill="currentColor" />
           </div>
       )}
    </div>
  );
};

export default JarIcon;