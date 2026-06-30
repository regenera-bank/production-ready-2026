
import React from 'react';

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ 
  data, 
  size = 200, 
  strokeWidth = 20 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  let currentOffset = 0;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        
        {/* Data Segments */}
        {data.map((item, index) => {
          const strokeDasharray = `${(item.value / total) * circumference} ${circumference}`;
          const strokeDashoffset = -currentOffset;
          
          currentOffset += (item.value / total) * circumference;
          
          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      
      {/* Center Label (Optional, could be passed as children) */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total</span>
        <span className="text-xl font-light">R$ {total.toLocaleString('pt-BR')}</span>
      </div>
    </div>
  );
};
