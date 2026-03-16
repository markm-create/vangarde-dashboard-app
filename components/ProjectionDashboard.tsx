import React, { useMemo, useState, useEffect } from 'react';
import { Target, Download, Users, Loader2 } from 'lucide-react';
import { useData } from '../DataContext';

interface WeeklyProjection { projection: number; collected: number; reached: number; }
interface AgentProjection { id: string; name: string; weeks: { w1: WeeklyProjection; w2: WeeklyProjection; w3: WeeklyProjection; w4: WeeklyProjection; }; totalProjection: number; totalCollected: number; totalReached: number; }

const SCRIPT_URL = import.meta.env.VITE_PROJECTION_SCRIPT_URL;

const ProjectionDashboard: React.FC = () => {
  const { collectors, fetchCollectors, projection, fetchProjection } = useData();
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    fetchCollectors();
    fetchProjection();
    const interval = setInterval(() => {
      fetchCollectors(true);
      fetchProjection(true);
    }, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, [fetchCollectors, fetchProjection]);

  const data = projection.data || [];
  const loading = projection.isLoading;
  const error = projection.error;

  useEffect(() => {
    if (!import.meta.env.VITE_PROJECTION_SCRIPT_URL) {
      setIsMock(true);
    } else {
      setIsMock(false);
    }
  }, []);

  const globalWeeklyTotals = useMemo(() => data.reduce((acc, curr) => {
    acc.w1.p += curr.weeks.w1.projection; acc.w1.c += curr.weeks.w1.collected; acc.w2.p += curr.weeks.w2.projection; acc.w2.c += curr.weeks.w2.collected; acc.w3.p += curr.weeks.w3.projection; acc.w3.c += curr.weeks.w3.collected; acc.w4.p += curr.weeks.w4.projection; acc.w4.c += curr.weeks.w4.collected; return acc;
  }, { w1: { p: 0, c: 0 }, w2: { p: 0, c: 0 }, w3: { p: 0, c: 0 }, w4: { p: 0, c: 0 } }), [data]);

  const weekRanges = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Find the first Wednesday of the current month
    let cycleStart = new Date(year, month, 1);
    while (cycleStart.getDay() !== 3) { cycleStart.setDate(cycleStart.getDate() + 1); }
    
    // If today is before the first Wednesday of this month, we belong to the previous month's cycle
    if (now < cycleStart) {
      const prevMonth = new Date(year, month - 1, 1);
      cycleStart = new Date(prevMonth);
      while (cycleStart.getDay() !== 3) { cycleStart.setDate(cycleStart.getDate() + 1); }
    } else {
      // Check if we have passed the 4th week of the current cycle
      const week4End = new Date(cycleStart);
      week4End.setDate(week4End.getDate() + 27); // Wednesday + 27 days = Tuesday 4 weeks later
      
      if (now > week4End) {
        let nextCycle = new Date(cycleStart);
        nextCycle.setDate(nextCycle.getDate() + 28); // The Wednesday after Week 4 ends
        if (now >= nextCycle) {
          cycleStart = nextCycle;
        }
      }
    }

    return [0, 1, 2, 3].map(i => {
      const s = new Date(cycleStart); s.setDate(s.getDate() + i * 7);
      const e = new Date(s); e.setDate(e.getDate() + 6);
      const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${fmt(s)} - ${fmt(e)}`;
    });
  }, []);

  const sortedData = useMemo(() => [...data].sort((a, b) => a.name.localeCompare(b.name)), [data]);
  const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const getReachedColor = (pct: number) => pct >= 100 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800' : pct >= 85 ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-800';

  const handleExport = () => {
    const headers = ["Agent", "W1 Proj", "W1 Coll", "W2 Proj", "W2 Coll", "W3 Proj", "W3 Coll", "W4 Proj", "W4 Coll", "Total Proj", "Total Coll", "Final Reach %"];
    const rows = sortedData.map(r => [
      `"${r.name}"`,
      r.weeks.w1.projection.toFixed(2),
      r.weeks.w1.collected.toFixed(2),
      r.weeks.w2.projection.toFixed(2),
      r.weeks.w2.collected.toFixed(2),
      r.weeks.w3.projection.toFixed(2),
      r.weeks.w3.collected.toFixed(2),
      r.weeks.w4.projection.toFixed(2),
      r.weeks.w4.collected.toFixed(2),
      r.totalProjection.toFixed(2),
      r.totalCollected.toFixed(2),
      r.totalReached.toFixed(2)
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Forecasting_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const WeeklySummaryCard = ({ weekNum, collected, projected, range }: { weekNum: number, collected: number, projected: number, range: string }) => {
    const pct = (collected / projected) * 100;
    return (
      <div className="bg-card p-6 rounded-2xl border border-border-subtle shadow-sm flex flex-col justify-between h-44 transition-all hover:shadow-md">
         <div className="flex-1">
             <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Week {weekNum} Goal</p>
                <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded uppercase tracking-tight">{range}</span>
             </div>
             <h3 className="text-3xl font-black text-text-main tracking-tight mb-4">{formatCurrency(projected)}</h3>
             <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col"><p className="text-[10px] font-bold text-text-muted uppercase tracking-tight">Collected</p><span className="text-lg font-black text-text-main font-inter">{formatCurrency(collected)}</span></div>
                <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-black ${getReachedColor(pct)} shrink-0`}><Target size={14} />{pct.toFixed(1)}%</div>
             </div>
         </div>
      </div>
    );
  };

  if (loading && !projection.lastFetched) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-app">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-sm font-bold text-text-muted uppercase tracking-widest animate-pulse">Loading Projection Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-app min-h-screen animate-in fade-in duration-500 font-sans pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-main uppercase tracking-wide">Collection Forecasting</h1>
            {isMock ? (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[9px] font-black uppercase tracking-widest">Mock Data</span>
            ) : (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[9px] font-black uppercase tracking-widest">Live Data</span>
            )}
          </div>
          <p className="text-text-muted font-semibold text-[11px] tracking-widest mt-1 uppercase">Targets & Realization</p>
          {error && <p className="text-rose-600 text-[10px] font-bold mt-2 uppercase tracking-tight">Connection Error: {error}</p>}
        </div>
        <button onClick={handleExport} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 shadow-lg active:scale-95 transition-all"><Download size={14} /> Export CSV</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <WeeklySummaryCard weekNum={1} range={weekRanges[0]} collected={globalWeeklyTotals.w1.c} projected={globalWeeklyTotals.w1.p} />
        <WeeklySummaryCard weekNum={2} range={weekRanges[1]} collected={globalWeeklyTotals.w2.c} projected={globalWeeklyTotals.w2.p} />
        <WeeklySummaryCard weekNum={3} range={weekRanges[2]} collected={globalWeeklyTotals.w3.c} projected={globalWeeklyTotals.w3.p} />
        <WeeklySummaryCard weekNum={4} range={weekRanges[3]} collected={globalWeeklyTotals.w4.c} projected={globalWeeklyTotals.w4.p} />
      </div>
      <div className="bg-card rounded-[2rem] border border-border-subtle shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-6 border-b border-border-subtle bg-surface-100 flex items-center gap-3"><div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl"><Users size={18} /></div><h2 className="text-sm font-black text-text-main uppercase tracking-widest">Collector Portfolio Projection</h2></div>
          <div className="overflow-x-auto scrollbar-thin">
             <table className="w-full text-left border-collapse min-w-[1300px]">
                <thead><tr className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-subtle bg-card">
                    <th className="px-10 py-6 sticky left-0 bg-card z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] text-xs">Agent Name</th>
                    {[1, 2, 3, 4].map((w, idx) => (<th key={w} className={`px-8 py-4 text-center border-l border-border-subtle min-w-[300px] ${w%2!==0?'bg-surface-100/50':''}`}>
                       <div className="flex flex-col items-center">
                          <span className="text-[13px] font-black text-text-main">Week {w}</span>
                          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded mt-1 uppercase tracking-tight">{weekRanges[idx]}</span>
                       </div>
                       <div className="flex gap-10 mt-3 justify-center font-black text-[9px]"><span className="w-16">PROJ</span><span className="w-16">COLL</span><span className="w-12">%</span></div>
                    </th>))}
                  </tr></thead>
                <tbody className="divide-y divide-border-subtle text-[12px]">
                  {sortedData.map((row) => (
                    <tr key={row.id} className="hover:bg-surface-100 transition-colors group">
                      <td className="px-10 py-5 sticky left-0 bg-card group-hover:bg-surface-100 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors"><div className="flex items-center gap-4"><div className="w-9 h-9 rounded-full bg-surface-100 text-text-muted flex items-center justify-center font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all text-[10px]">{row.name.split(' ').map(n => n[0]).join('').toUpperCase()}</div><span className="font-black text-text-main">{row.name}</span></div></td>
                      {[row.weeks.w1, row.weeks.w2, row.weeks.w3, row.weeks.w4].map((wk, i) => (
                        <td key={i} className="px-8 py-5 text-center border-l border-border-subtle font-inter"><div className="flex justify-center gap-10 font-bold"><span className="w-16 text-text-muted/60">{formatCurrency(wk.projection)}</span><span className="w-16 text-text-main">{formatCurrency(wk.collected)}</span><span className={`px-2 py-0.5 rounded text-[10px] w-12 border flex items-center justify-center ${getReachedColor(wk.reached)}`}>{wk.reached.toFixed(1)}%</span></div></td>
                      ))}
                    </tr>))}
                </tbody>
             </table>
          </div>
      </div>
    </div>
  );
};
export default ProjectionDashboard;