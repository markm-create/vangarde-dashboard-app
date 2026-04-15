import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutGrid, 
  List, 
  Clock, 
  Timer, 
  Wallet, 
  UserPlus, 
  Activity,
  Download,
  ArrowDownWideNarrow,
  Loader2,
  RefreshCw,
  PieChart
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useData } from '../DataContext';

import { AppUser } from '../types';
import { CONFIG } from '../constants';

type ViewMode = 'grid' | 'list' | 'charts';
type TimeSlot = '10:00 AM' | '12:00 PM' | '2:00 PM' | '4:00 PM' | '6:00 PM';
type SortKey = 'name' | 'currentAssigned' | 'accountsWorked' | 'outboundCalls' | 'inboundCalls' | 'completedCalls' | 'collected' | 'missedCalls';

interface AgentMirrorStats { 
  name: string; 
  currentAssigned: number; 
  accountsWorked: number; 
  outboundCalls: number; 
  inboundCalls: number; 
  completedCalls: number; 
  missedCalls: number;
  callDuration: string; 
  collected: number; 
}

interface MirrorDashboardProps {
  currentUser: AppUser;
}

const MirrorDashboard: React.FC<MirrorDashboardProps> = ({ currentUser }) => {
  const { mirror, fetchMirror, collectors, fetchCollectors } = useData();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(CONFIG.MIRROR_VIEW_KEY);
    return (saved as ViewMode) || 'grid';
  });
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('12:00 PM');
  const [sortKey, setSortKey] = useState<SortKey>('name');

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem(CONFIG.MIRROR_VIEW_KEY);
      if (saved) setViewMode(saved as ViewMode);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(CONFIG.MIRROR_VIEW_KEY, mode);
  };

  useEffect(() => {
    fetchMirror();
    fetchCollectors();
    const interval = setInterval(() => {
      fetchMirror(true);
      fetchCollectors(true);
    }, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, [fetchMirror, fetchCollectors]);

  const mirrorData = useMemo(() => {
    if (mirror.data && mirror.data.length > 0) {
      const slots: Record<TimeSlot, AgentMirrorStats[]> = {
        '10:00 AM': [],
        '12:00 PM': [],
        '2:00 PM': [],
        '4:00 PM': [],
        '6:00 PM': []
      };

      mirror.data.forEach(agent => {
        const cleanNum = (val: any) => {
          if (typeof val === 'number') return val;
          if (typeof val === 'string') {
            const cleaned = val.replace(/[$,]/g, '');
            return parseFloat(cleaned) || 0;
          }
          return 0;
        };

        const name = agent.name || 'Unknown Agent';

        const timeSlots: TimeSlot[] = ['10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM'];
        
        timeSlots.forEach(slot => {
          const slotData = agent[slot] || {};
          const assigned = cleanNum(slotData.assigned);
          
          slots[slot].push({
            name,
            currentAssigned: assigned,
            accountsWorked: cleanNum(slotData.worked),
            outboundCalls: cleanNum(slotData.outbound),
            inboundCalls: cleanNum(slotData.inbound),
            completedCalls: cleanNum(slotData.outbound) + cleanNum(slotData.inbound),
            missedCalls: cleanNum(slotData.missed),
            callDuration: String(slotData.duration || "0:00:00"),
            collected: cleanNum(slotData.collected)
          });
        });
      });

      return slots;
    }

    const generateStats = (slot: TimeSlot): AgentMirrorStats[] => {
      const mults: Record<TimeSlot, number> = {
        '10:00 AM': 0.2,
        '12:00 PM': 0.4,
        '2:00 PM': 0.6,
        '4:00 PM': 0.8,
        '6:00 PM': 1.0
      };
      const mult = mults[slot];
      const activeCollectors = collectors.data || [];
      return activeCollectors.map((collector, i) => {
        const seed = i + 1; 
        const baseAssigned = 45 + (seed % 10); 
        const worked = Math.floor(baseAssigned * 0.8 * mult); 
        const outCalls = Math.floor(seed * 12 * mult) + 5; 
        const inCalls = Math.floor(seed * 4 * mult) + 2;
        const missed = Math.floor((outCalls + inCalls) * 0.15 * mult);
        return { 
          name: collector.name, 
          currentAssigned: baseAssigned, 
          accountsWorked: worked, 
          outboundCalls: outCalls, 
          inboundCalls: inCalls, 
          completedCalls: Math.floor((outCalls + inCalls) * 0.75), 
          missedCalls: missed,
          callDuration: `${Math.floor(2 * mult * seed)}h ${Math.floor(15 * mult)}m`, 
          collected: Math.floor(worked * 125 * mult) 
        };
      });
    };
    return { 
      '10:00 AM': generateStats('10:00 AM'), 
      '12:00 PM': generateStats('12:00 PM'), 
      '2:00 PM': generateStats('2:00 PM'), 
      '4:00 PM': generateStats('4:00 PM'), 
      '6:00 PM': generateStats('6:00 PM') 
    };
  }, [mirror.data, collectors.data]);

  const currentStats = useMemo(() => {
    let stats = [...mirrorData[timeSlot]];
    
    // Filter for collector role
    if (currentUser.role.toLowerCase() === 'collector') {
      stats = stats.filter(agent => {
        const name = agent.name.toLowerCase();
        return name === currentUser.name.toLowerCase() || 
               name === 'unassigned' || 
               name === 'house file' ||
               name === 'kkarter - special handling' ||
               name === 'kkoson - special handling';
      });
    }
    
    stats.sort((a, b) => sortKey === 'name' ? a.name.localeCompare(b.name) : (b[sortKey] as number) - (a[sortKey] as number));

    // Move special accounts to the bottom
    const regularStats: AgentMirrorStats[] = [];
    const bottomStats: AgentMirrorStats[] = [];

    stats.forEach(agent => {
      const name = agent.name.toLowerCase();
      if (name === 'unassigned' || name === 'house file' || name === 'kkarter - special handling' || name === 'kkoson - special handling') {
        bottomStats.push(agent);
      } else {
        regularStats.push(agent);
      }
    });

    // Sort bottom stats so they are consistently ordered
    bottomStats.sort((a, b) => a.name.localeCompare(b.name));

    return [...regularStats, ...bottomStats];
  }, [mirrorData, timeSlot, sortKey, currentUser]);

  const formatCurrency = (val: number | string) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[$,]/g, '')) || 0;
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDuration = (val: string) => {
    if (!val) return "0:00:00";
    // If it's a full date string from Google (e.g. "Sat Dec 30 1899 00:14:41...")
    if (val.includes('1899') || val.includes('GMT')) {
      const parts = val.split(' ');
      // Usually the time is the 5th element (index 4)
      const timePart = parts.find(p => p.includes(':') && p.split(':').length >= 2);
      return timePart || val;
    }
    return val;
  };

  const parseDurationToMinutes = (durationStr: string) => {
    const formatted = formatDuration(durationStr);
    if (!formatted) return 0;
    
    // Handle format like "1h 30m"
    if (formatted.includes('h') || formatted.includes('m')) {
      let mins = 0;
      const hMatch = formatted.match(/(\d+)h/);
      if (hMatch) mins += parseInt(hMatch[1]) * 60;
      const mMatch = formatted.match(/(\d+)m/);
      if (mMatch) mins += parseInt(mMatch[1]);
      return mins;
    }
    
    // Handle format like "0:00:00" or "00:00"
    const parts = formatted.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 60 + parts[1] + parts[2] / 60;
    } else if (parts.length === 2) {
      return parts[0] + parts[1] / 60;
    }
    return 0;
  };

  const chartData = useMemo(() => {
    return currentStats.map(agent => ({
      name: agent.name,
      collected: agent.collected,
      worked: agent.accountsWorked,
      outbound: agent.outboundCalls,
      inbound: agent.inboundCalls,
      missed: agent.missedCalls,
      duration: parseDurationToMinutes(agent.callDuration)
    }));
  }, [currentStats]);

  return (
    <div className="p-8 space-y-8 bg-app min-h-screen animate-in fade-in duration-500 font-sans pb-24">
      {mirror.error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 animate-in slide-in-from-top-2">
          <Activity size={16} />
          <span>Sync Error: {mirror.error}. Please ensure the Google Script is deployed to "Anyone".</span>
          <button onClick={() => fetchMirror(true)} className="ml-auto underline">Retry</button>
        </div>
      )}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-text-main uppercase tracking-wide">Performance Mirror</h1>
            {mirror.isLoading && <Loader2 className="animate-spin text-indigo-500" size={20} />}
          </div>
          <p className="text-text-muted font-semibold text-[11px] tracking-widest mt-1 uppercase">Real-time Snapshots</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => fetchMirror(true)}
            disabled={mirror.isLoading}
            className="p-2.5 rounded-xl bg-card border border-border-subtle text-text-muted hover:text-indigo-500 hover:border-indigo-200 transition-all disabled:opacity-50 shadow-sm"
          >
            <RefreshCw size={18} className={mirror.isLoading ? 'animate-spin' : ''} />
          </button>
          <div className="bg-card p-1 rounded-xl shadow-sm border border-border-subtle flex items-center h-11">
            <div className="px-3 text-text-muted"><ArrowDownWideNarrow size={18} /></div>
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="bg-transparent border-none text-[11px] font-black uppercase tracking-wider text-text-main focus:ring-0 outline-none pr-8 cursor-pointer">
              {[{ label: 'Name (A-Z)', value: 'name' }, { label: 'Collected (High)', value: 'collected' }, { label: 'Worked (High)', value: 'accountsWorked' }].map(opt => (
                <option key={opt.value} value={opt.value} className="bg-card text-text-main">
                  Sort By {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="bg-card p-1 rounded-xl shadow-sm border border-border-subtle flex items-center h-11">
            {(['10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM'] as TimeSlot[]).map((slot) => (
              <button key={slot} onClick={() => setTimeSlot(slot)} className={`px-4 h-full rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${timeSlot === slot ? 'bg-indigo-600 text-white shadow-md' : 'text-text-muted hover:text-indigo-600'}`}>{slot}</button>
            ))}
          </div>
          <div className="bg-card p-1 rounded-xl shadow-sm border border-border-subtle flex items-center h-11">
            <button onClick={() => handleViewModeChange('grid')} className={`p-2 h-full rounded-lg transition-all flex items-center px-3 ${viewMode === 'grid' ? 'bg-surface-100 text-indigo-600 shadow-inner' : 'text-text-muted hover:text-text-main'}`}><LayoutGrid size={20} /></button>
            <button onClick={() => handleViewModeChange('list')} className={`p-2 h-full rounded-lg transition-all flex items-center px-3 ${viewMode === 'list' ? 'bg-surface-100 text-indigo-600 shadow-inner' : 'text-text-muted hover:text-text-main'}`}><List size={20} /></button>
            <button onClick={() => handleViewModeChange('charts')} className={`p-2 h-full rounded-lg transition-all flex items-center px-3 ${viewMode === 'charts' ? 'bg-surface-100 text-indigo-600 shadow-inner' : 'text-text-muted hover:text-text-main'}`}><PieChart size={20} /></button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentStats.map((agent, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border-subtle shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden flex flex-col h-full animate-in zoom-in-95">
               <div className="p-6 border-b border-border-subtle bg-surface-100/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-lg group-hover:scale-110 transition-transform">{agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}</div>
                    <div><h3 className="text-lg font-black text-text-main tracking-tight leading-tight">{agent.name}</h3></div>
                  </div>
               </div>
               <div className="p-5 flex-1 grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-2 gap-4"><StatItem label="Assigned" val={agent.currentAssigned} icon={UserPlus} color="indigo" /><StatItem label="Worked" val={agent.accountsWorked} icon={Activity} color="amber" /></div>
                  <StatItem label="Collected" val={formatCurrency(agent.collected)} icon={Wallet} color="emerald" />
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border-subtle"><MiniStat label="Out" val={agent.outboundCalls} /><MiniStat label="In" val={agent.inboundCalls} /><MiniStat label="Missed" val={agent.missedCalls} /></div>
               </div>
               <div className="px-5 py-3 bg-surface-100 flex justify-between items-center"><div className="flex items-center gap-2 text-text-muted"><Timer size={14} /><span className="text-[11px] font-bold font-inter">{formatDuration(agent.callDuration)}</span></div><div className="text-indigo-600 dark:text-indigo-400 font-black text-xs">{Math.floor((agent.accountsWorked / agent.currentAssigned) * 100)}% <span className="text-[9px] text-text-muted uppercase">Coverage</span></div></div>
            </div>
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-card rounded-2xl border border-border-subtle shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle bg-surface-100 dark:bg-slate-800/50">
                  <th className="px-6 py-4">Agent Name</th>
                  <th className="px-4 py-4 text-center">Assigned</th>
                  <th className="px-4 py-4 text-center">Worked</th>
                  <th className="px-4 py-4 text-center border-l border-border-subtle/50">Outbound</th>
                  <th className="px-4 py-4 text-center">Inbound</th>
                  <th className="px-4 py-4 text-center border-r border-border-subtle/50">Missed</th>
                  <th className="px-4 py-4 text-center">Duration</th>
                  <th className="px-6 py-4 text-right">Collected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-[13px]">
                {currentStats.map((agent, i) => (
                  <tr key={i} className="hover:bg-surface-100 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4 font-bold text-text-main flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-100 dark:bg-slate-800 text-text-muted flex items-center justify-center font-bold text-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">{agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}</div>
                      {agent.name}
                    </td>
                    <td className="px-4 py-4 text-center font-inter text-text-muted">{agent.currentAssigned}</td>
                    <td className="px-4 py-4 text-center font-bold text-amber-600 font-inter">{agent.accountsWorked}</td>
                    <td className="px-4 py-4 text-center font-inter text-indigo-600/70 border-l border-border-subtle/30 bg-indigo-50/10 dark:bg-indigo-900/20">{agent.outboundCalls}</td>
                    <td className="px-4 py-4 text-center font-inter text-emerald-600/70 bg-emerald-50/10 dark:bg-emerald-900/20">{agent.inboundCalls}</td>
                    <td className="px-4 py-4 text-center font-inter text-rose-500/70 border-r border-border-subtle/30 bg-rose-50/10 dark:bg-rose-900/20">{agent.missedCalls}</td>
                    <td className="px-4 py-4 text-center font-inter text-text-muted text-xs">{formatDuration(agent.callDuration)}</td>
                    <td className="px-6 py-4 text-right font-black text-emerald-600 font-inter">{formatCurrency(agent.collected)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Collection Chart */}
          <div className="p-6 h-[500px] w-full bg-card rounded-2xl border border-border-subtle shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-lg font-bold text-text-main">Collector Collection Comparison</h3>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `$${value >= 1000 ? value / 1000 + 'k' : value}`}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ color: '#1e293b', fontWeight: 'bold', marginBottom: '8px' }}
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="collected" name="Collected" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="p-6 h-[500px] w-full bg-card rounded-2xl border border-border-subtle shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-lg font-bold text-text-main">Collector Activity Metrics</h3>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    yAxisId="left" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dx={-10}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dx={10}
                    tickFormatter={(val) => `${val}m`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ color: '#1e293b', fontWeight: 'bold', marginBottom: '8px' }}
                    formatter={(value: number, name: string) => name === 'Call Duration (mins)' ? [`${value.toFixed(1)} mins`, name] : [value, name]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar yAxisId="left" dataKey="worked" name="Accounts Worked" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar yAxisId="left" dataKey="outbound" name="Outbound Calls" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar yAxisId="left" dataKey="inbound" name="Inbound Calls" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar yAxisId="left" dataKey="missed" name="Missed Calls" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar yAxisId="right" dataKey="duration" name="Call Duration (mins)" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatItem = ({ label, val, icon: Icon, color }: { label: string, val: any, icon: any, color: string }) => {
  const colors: Record<string, string> = { indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30", amber: "text-amber-600 bg-amber-50 dark:bg-amber-900/30", emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" };
  return (
    <div className="flex flex-col gap-1 p-2">
       <div className="flex items-center gap-2"><div className={`p-1 rounded-md ${colors[color] || 'bg-surface-100'}`}><Icon size={12} /></div><span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{label}</span></div>
       <p className="text-lg font-black text-text-main tracking-tight ml-1">{val}</p>
    </div>
  );
};

const MiniStat = ({ label, val }: { label: string, val: number }) => (<div className="text-center"><p className="text-[13px] font-black text-text-main leading-none">{val}</p><p className="text-[8px] font-bold text-text-muted uppercase mt-0.5">{label}</p></div>);
export default MirrorDashboard;