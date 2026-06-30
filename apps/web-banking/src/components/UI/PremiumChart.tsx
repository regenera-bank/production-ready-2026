
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState } from 'react';

interface PremiumChartProps {
    data: number[];
    color?: string; // Hex color
    height?: number;
    label?: string;
}

const PremiumChart: React.FC<PremiumChartProps> = ({ data, color = '#34d399', height = 100, label }) => {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setAnimate(true), 200);
        return () => clearTimeout(timer);
    }, []);

    const series = data.length === 1 ? [data[0], data[0]] : data;

    const max = Math.max(...series);
    const min = Math.min(...series);
    const range = max - min || 1;
    
    const width = 300;
    const padding = 5;

    const points = series.map((val, i) => {
        const x = (i / (series.length - 1)) * (width - padding * 2) + padding;
        const y = height - ((val - min) / range) * (height - padding * 2) - padding;
        return `${x},${y}`;
    }).join(' ');

    const strokePath = `M ${points}`;
    const fillPath = `M ${points} L ${width - padding},${height} L ${padding},${height} Z`;

    // Calculate length for dasharray animation if needed, or just use css clip
    
    return (
        <div className="w-full relative group cursor-crosshair">
            {label && (
                <div className="absolute top-0 left-2 text-[10px] uppercase tracking-widest text-gray-500 font-bold z-10">
                    {label}
                </div>
            )}
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <clipPath id={`clip-${color.replace('#', '')}`}>
                         <rect x="0" y="0" width={animate ? width : 0} height={height} className="transition-all duration-[1500ms] ease-out" />
                    </clipPath>
                </defs>
                
                <g clipPath={`url(#clip-${color.replace('#', '')})`}>
                    {/* Area Fill */}
                    <path d={fillPath} fill={`url(#gradient-${color.replace('#', '')})`} className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Stroke Line */}
                    <path 
                        d={strokePath} 
                        fill="none" 
                        stroke={color} 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        filter="url(#glow)"
                        className="drop-shadow-lg"
                    />
                </g>

                {/* Data Points (Visible on Hover) */}
                {data.map((_, i) => {
                     const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
                     const y = height - ((data[i] - min) / range) * (height - padding * 2) - padding;
                     return (
                        <circle 
                            key={i} 
                            cx={x} 
                            cy={y} 
                            r="3" 
                            fill="white" 
                            className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${animate ? '' : 'hidden'}`}
                            style={{ transitionDelay: `${i * 50}ms` }}
                        />
                     )
                })}
            </svg>
        </div>
    );
};

export default PremiumChart;