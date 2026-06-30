import React from 'react';

const AuthPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-cyan-500/30">
      <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-[2.5rem] p-12 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-2xl mx-auto mb-6 rotate-12 shadow-lg shadow-cyan-500/20 flex items-center justify-center text-3xl">R</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2">
            REGENERA
          </h1>
          <p className="text-slate-500 text-xs tracking-widest uppercase font-mono">Secure Neural Access</p>
        </div>
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-widest ml-1">Identity Tag</label>
            <input 
              type="text" 
              className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-700"
              placeholder="operator@regenera.bank"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-widest ml-1">Synaptic Key</label>
            <input 
              type="password" 
              className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-700"
              placeholder="••••••••••••"
            />
          </div>
          <button className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 py-5 rounded-2xl font-bold shadow-xl shadow-cyan-900/20 transition-all active:scale-[0.98] mt-4">
            Initialize Session
          </button>
        </form>
        <div className="mt-10 text-center flex flex-col gap-4">
          <button className="text-slate-500 text-xs hover:text-cyan-400 transition-colors">Neural Biometric Fallback</button>
          <div className="h-px bg-slate-800 w-1/4 mx-auto" />
          <p className="text-[10px] text-slate-600 font-mono uppercase">Node_Protocol: v7.0.0_TLS</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;