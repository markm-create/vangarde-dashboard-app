
import React from 'react';
import { TrendingUp, TrendingDown, Target, Activity } from 'lucide-react';

const KPIDashboard: React.FC = () => {
  return (
    <div className="p-8 space-y-8 bg-[#f8fafc] min-h-screen animate-in fade-in duration-500 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-[#1e293b] uppercase tracking-wide">Key Performance Indicator</h1>
        <p className="text-slate-400 font-semibold text-[11px] tracking-widest mt-1">Operational Metrics Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-40">
           <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Collections</p>
               <h3 className="text-3xl font-black text-slate-800">$125,430</h3>
           </div>
           <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
              <TrendingUp size={16} /> <span>+12.5% vs Last Month</span>
           </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-40">
           <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">RPC Rate</p>
               <h3 className="text-3xl font-black text-slate-800">4.8%</h3>
           </div>
           <div className="flex items-center gap-2 text-rose-500 text-xs font-bold">
              <TrendingDown size={16} /> <span>-0.2% vs Target</span>
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-40">
           <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Conversion Rate</p>
               <h3 className="text-3xl font-black text-slate-800">18.2%</h3>
           </div>
           <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
              <Target size={16} /> <span>On Track</span>
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-40">
           <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Avg. Call Time</p>
               <h3 className="text-3xl font-black text-slate-800">2m 45s</h3>
           </div>
           <div className="flex items-center gap-2 text-blue-500 text-xs font-bold">
              <Activity size={16} /> <span>Optimal Range</span>
           </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-96 flex items-center justify-center text-slate-400">
          <p className="font-medium">Detailed KPI Charts Placeholder</p>
      </div>
    </div>
  );
};

export default KPIDashboard;
