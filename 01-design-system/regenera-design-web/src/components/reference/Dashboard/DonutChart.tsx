
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';

interface ChartData {
    name: string;
    color: string; // Tailwind class like 'text-emerald-500'
    pct: number;
    amount: number;
    offset: number;
}

const DonutChart: React.FC = () => {
    const [activeSlice, setActiveSlice] = useState<number | null>(null);
    const [animated, setAnimated] = useState(false);

    const categories: ChartData[] = [
        { name: 'Lifestyle', color: 'text-emerald-500', pct: 40, offset: 0, amount: 2168 },
        { name: 'Essencial', color: 'text-primary', pct: 35, offset: 40, amount: 1897 },
        { name: 'Transporte', color: 'text-amber-500', pct: 25, offset: 75, amount: 1355 },
    ];
    const dashTotal = 100;

    useEffect(() => {
        const timer = setTimeout(() => setAnimated(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col items-center shadow-2xl relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="mb-6 z-10 relative w-64 h-64 flex items-center justify-center">
                <svg viewBox="0 0 40 40" className="w-full h-full transform -rotate-90 drop-shadow-xl">
                    {/* Track */}
                    <circle cx="20" cy="20" r="16" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                    
                    {/* Segments */}
                    {categories.map((cat, i) => (
                        <circle
                            key={i}
                            cx="20" cy="20" r="16"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth={activeSlice === i ? "4" : "3"}
                            strokeDasharray={`${animated ? cat.pct : 0} ${dashTotal}`}
                            strokeDashoffset={-cat.offset}
                            strokeLinecap="round"
                            className={`${cat.color} transition-all duration-1000 ease-out cursor-pointer hover:opacity-100 opacity-90`}
                            style={{ 
                                filter: activeSlice === i ? 'drop-shadow(0px 0px 6px currentColor)' : 'none',
                                transformOrigin: 'center',
                                transform: activeSlice === i ? 'scale(1.05) rotate(-90deg)' : 'scale(1) rotate(-90deg)',
                                transitionDelay: `${i * 200}ms`
                            }}
                            onClick={() => setActiveSlice(activeSlice === i ? null : i)}
                        />
                    ))}
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-1 opacity-70">
                        {activeSlice !== null ? categories[activeSlice].name : 'Total'}
                    </span>
                    <span className="text-3xl font-bold text-white tracking-tight animate-in fade-in zoom-in duration-300">
                        {activeSlice !== null 
                            ? `R$ ${categories[activeSlice].amount}` 
                            : 'R$ 5.420'}
                    </span>
                </div>
            </div>

            {/* Legend */}
            <div className="w-full grid grid-cols-3 gap-2">
                {categories.map((item, idx) => (
                    <button 
                        key={idx} 
                        className={`flex flex-col items-center p-3 rounded-2xl border transition-all duration-300 ${activeSlice === idx ? 'bg-white/10 border-white/20 scale-105 shadow-lg' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                        onClick={() => setActiveSlice(activeSlice === idx ? null : idx)}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.color.replace('text-', 'bg-')} mb-2 shadow-[0_0_8px_currentColor]`}></span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">{item.name}</span>
                        <span className="text-xs font-bold text-white mt-1">{item.pct}%</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DonutChart;
