import React, { useMemo, useState, useEffect } from 'react';
import { Target, Download, Users, Loader2, Edit2, Save, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../DataContext';
import { PROJECTION_SCRIPT_URL } from '../constants';
import { AppUser, AgentProjection } from '../types';
import { sheetService } from '../services/sheetService';

const SCRIPT_URL = import.meta.env.VITE_PROJECTION_SCRIPT_URL || PROJECTION_SCRIPT_URL;

const ProjectionDashboard: React.FC<{ currentUser: AppUser }> = ({ currentUser }) => {
  const { collectors, fetchCollectors, projection, fetchProjection, updateProjectionLocal } = useData();
  const [isMock, setIsMock] = useState(false);

  // Edit State
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState<Record<string, number>>({});

  const handleEditWeek = (week: number) => {
    setEditingWeek(week);
    const initialData: Record<string, number> = {};
    const weekKey = `w${week}` as 'w1' | 'w2' | 'w3' | 'w4';
    const sortedD = [...(projection.data || [])].sort((a, b) => a.name.localeCompare(b.name));
    sortedD.forEach(agent => {
      initialData[agent.id] = agent.weeks[weekKey].projection || 0;
    });
    setEditFormData(initialData);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWeek === null) return;
    setIsSubmitting(true);

    const weekKey = `w${editingWeek}` as 'w1' | 'w2' | 'w3' | 'w4';
    const updates = Object.keys(editFormData).map(agentId => {
      const agent = projection.data?.find(a => a.id === agentId);
      if (!agent) return null;
      if (editFormData[agentId] === agent.weeks[weekKey].projection) return null;
      
      return {
        agentId: agent.id,
        agentName: agent.name,
        projections: {
          [weekKey]: editFormData[agentId]
        }
      };
    }).filter(Boolean);

    // Optimistic update
    const newData = projection.data?.map(agent => {
      if (editFormData[agent.id] !== undefined) {
         const newProj = editFormData[agent.id];
         const updatedWeeks = {
           ...agent.weeks,
           [weekKey]: { ...agent.weeks[weekKey], projection: newProj }
         };
         const totalProjection = updatedWeeks.w1.projection + updatedWeeks.w2.projection + updatedWeeks.w3.projection + updatedWeeks.w4.projection;
         const totalReached = totalProjection > 0 ? (agent.totalCollected / totalProjection) * 100 : 0;
         return {
           ...agent,
           weeks: updatedWeeks,
           totalProjection,
           totalReached
         };
      }
      return agent;
    }) || [];
    
    updateProjectionLocal(newData);
    setIsEditModalOpen(false);
    setEditingWeek(null);
    setIsSubmitting(false);

    if (updates.length > 0) {
      // Background process for Google Sheets update
      (async () => {
        try {
          const success = await sheetService.updateProjection(updates);
          if (success) {
            fetchProjection(true); // Background refresh
          } else {
            console.error("Failed to update projections remotely.");
          }
        } catch (error) {
          console.error('Error updating projection remotely:', error);
        }
      })();
    }
  };

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
    if (!import.meta.env.VITE_PROJECTION_SCRIPT_URL && (!PROJECTION_SCRIPT_URL || PROJECTION_SCRIPT_URL.includes('PLACEHOLDER'))) {
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
                       <div className="flex flex-col items-center relative">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-black text-text-main">Week {w}</span>
                            {currentUser.permissions.editProjections && (
                              <button 
                                onClick={() => handleEditWeek(w)}
                                className="p-1.5 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors absolute -right-2 top-0"
                                title="Edit Projections for this Week"
                              >
                                <Edit2 size={14} />
                              </button>
                            )}
                          </div>
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

      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card w-full max-w-xl rounded-[2.5rem] border border-border-subtle shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-border-subtle flex justify-between items-center bg-surface-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                    {editingWeek && `W${editingWeek}`}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-text-main uppercase tracking-tight">Set Weekly Targets</h2>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">
                      Updating projections for Week {editingWeek} ({editingWeek ? weekRanges[editingWeek-1] : ''})
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-3 hover:bg-surface-200 rounded-2xl transition-colors">
                  <X size={20} className="text-text-muted" />
                </button>
              </div>
              
              <form onSubmit={handleSaveEdit} className="flex flex-col max-h-[80vh]">
                <div className="p-8 space-y-4 overflow-y-auto scrollbar-thin max-h-[500px]">
                  {sortedData.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between gap-6 p-4 rounded-2xl border border-border-subtle bg-surface-50 hover:bg-surface-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px]">
                          {agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <span className="font-bold text-sm text-text-main">{agent.name}</span>
                      </div>
                      <div className="relative group w-48">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-bold group-focus-within:text-indigo-600 transition-colors">$</div>
                        <input 
                          type="number"
                          value={editFormData[agent.id] ?? 0}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, [agent.id]: parseFloat(e.target.value) || 0 }))}
                          className="w-full pl-8 pr-4 py-3 bg-card border border-border-subtle rounded-xl text-[13px] font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all text-right"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-8 border-t border-border-subtle bg-surface-50 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-8 py-4 bg-white text-text-main border border-border-subtle rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-surface-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                    {isSubmitting ? 'Saving...' : 'Update All Targets'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default ProjectionDashboard;