import React from 'react';

export const ConsentList: React.FC = () => {
  const consents = [
    { bank: 'Itaú Unibanco', status: 'Active', expiry: '2024-12-10' },
    { bank: 'Nubank', status: 'Active', expiry: '2024-11-20' },
  ];
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">Active Connections</h3>
      {consents.map(c => (
        <div key={c.bank} className="flex items-center justify-between p-5 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center font-bold text-xl text-slate-300 shadow-inner">{c.bank[0]}</div>
            <div>
              <div className="font-bold text-slate-100">{c.bank}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">EXPIRES_{c.expiry.replace(/-/g, '_')}</div>
            </div>
          </div>
          <button className="text-red-400/80 text-xs font-bold hover:text-red-400 transition-colors px-3 py-1 rounded-lg hover:bg-red-500/10">Revoke</button>
        </div>
      ))}
      <button className="w-full py-6 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:border-cyan-500 hover:text-cyan-500 transition-all group">
        <span className="text-xl mr-2 group-hover:scale-125 inline-block transition-transform">+</span>
        Connect New Institution
      </button>
    </div>
  );
};