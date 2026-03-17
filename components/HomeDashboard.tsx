import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowRight, 
  Trophy, 
  MoreHorizontal, 
  CreditCard, 
  Users, 
  Activity, 
  Phone, 
  Wallet, 
  XCircle, 
  CheckCircle2, 
  Calendar, 
  FileDown, 
  AlertOctagon, 
  Timer, 
  Target,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { TabType, AppUser } from '../types';
import { useData } from '../DataContext';

interface HomeDashboardProps {
  onNavigate: (tab: TabType, subView?: any) => void;
  currentUser: AppUser;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ onNavigate, currentUser }) => {
  const { 
    home, fetchHome, 
    postdates, fetchPostdates,
    imports, fetchImports,
    flaggedAccounts, fetchFlaggedAccounts,
    callPerformance, fetchCallPerformance,
    overduePayments, fetchOverduePayments
  } = useData();
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    fetchHome();
    fetchPostdates();
    fetchImports();
    fetchFlaggedAccounts();
    fetchCallPerformance();
    fetchOverduePayments();
    
    const interval = setInterval(() => {
      fetchHome(true);
      fetchPostdates(true);
      fetchImports(true);
      fetchFlaggedAccounts(true);
      fetchCallPerformance(true);
      fetchOverduePayments(true);
    }, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, [fetchHome, fetchPostdates, fetchImports, fetchFlaggedAccounts, fetchCallPerformance, fetchOverduePayments]);

  const stats = useMemo(() => {
    // Prefer data from home.data.dailyMetrics as it uses specific spreadsheet cells (M4, N4, O3)
    if (home.data?.dailyMetrics) {
      const dm = home.data.dailyMetrics;
      return {
        declineRate: { val: (dm.declinedRate || 0).toFixed(1), change: 0, isIncrease: false },
        successRate: { val: (dm.successRate || 0).toFixed(1), change: 0, isIncrease: true },
        processed: { val: dm.processedPostdates || 0, count: dm.processedCount || 0, change: 0, isIncrease: true },
      };
    }

    let succeeded = 0;
    let declined = 0;
    let total = 0;
    let succeededAmount = 0;

    const todayStr = new Date().toDateString();

    if (postdates.processed && postdates.processed.length > 0) {
      postdates.processed.forEach((p: any) => {
        if (p.rawDate && new Date(p.rawDate).toDateString() === todayStr) {
          total++;
          if (p.status === 'Succeeded') {
            succeeded++;
            succeededAmount += (p.amount || 0);
          } else if (p.status === 'Failed' || p.status === 'Declined') {
            declined++;
          }
        }
      });
    }

    const successRate = total > 0 ? (succeeded / total) * 100 : 0;
    const declineRate = total > 0 ? (declined / total) * 100 : 0;

    return {
      declineRate: { val: declineRate.toFixed(1), change: 0, isIncrease: false },
      successRate: { val: successRate.toFixed(1), change: 0, isIncrease: true },
      processed: { val: succeededAmount, count: succeeded, change: 0, isIncrease: true },
    };
  }, [postdates.processed, home.data]);

  const opsMetrics = useMemo(() => {
    // 1. New Imports
    const validImports = imports.data?.filter((i: any) => {
      if (!i.accountNumber || i.accountNumber === 'N/A') return false;
      return String(i.accountNumber).trim() !== '';
    }) || [];
    const totalImports = validImports.length;
    let lastImportDate = "N/A";
    if (validImports.length > 0) {
      const dates = validImports
        .map((i: any) => i.dateImported)
        .filter((d: any) => d && d !== 'N/A' && d !== '')
        .sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime());
      
      if (dates.length > 0) {
        const d = new Date(dates[0]);
        lastImportDate = `Last Import: ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
    }

    // 2. Flagged Accounts
    const totalFlagged = flaggedAccounts.data?.length || 0;

    // 3. Avg Call Time
    let avgCallTimeStr = "0m 0s";
    if (callPerformance.data && callPerformance.data.length > 0) {
      let totalSeconds = 0;
      let count = 0;
      callPerformance.data.forEach((item: any) => {
        const timeStr = item.mtd?.avgCallTime || "0m 0s";
        const match = timeStr.match(/(\d+)m\s+(\d+)s/);
        if (match) {
          const m = parseInt(match[1]);
          const s = parseInt(match[2]);
          totalSeconds += (m * 60 + s);
          count++;
        }
      });
      if (count > 0) {
        const avgSeconds = Math.round(totalSeconds / count);
        const m = Math.floor(avgSeconds / 60);
        const s = avgSeconds % 60;
        avgCallTimeStr = `${m}m ${s}s`;
      }
    }

    // 4. Overdue Payments
    let totalOverdueAmount = 0;
    let overdueCount = 0;
    if (overduePayments.data && overduePayments.data.length > 0) {
      overduePayments.data.forEach((item: any) => {
        // Filter out N/A, blanks, or invalid account numbers
        if (item.accountNumber && item.accountNumber !== 'N/A' && item.accountNumber.trim() !== '') {
          totalOverdueAmount += Number(item.paymentPlanOverdue || 0);
          overdueCount++;
        }
      });
    }

    return {
      imports: { count: totalImports, sub: lastImportDate },
      stagnant: { count: totalFlagged, label: "Accounts flagged" },
      callTime: { val: avgCallTimeStr },
      overdue: { 
        amount: totalOverdueAmount, 
        count: overdueCount 
      }
    };
  }, [imports.data, flaggedAccounts.data, callPerformance.data, overduePayments.data]);

  const heroes = home.data?.yesterdayHeroes || [];
  const topCollectors = home.data?.topCollectors || [];

  const displayCollectors = topCollectors.length > 0 
    ? (topCollectors.length >= 3 ? [topCollectors[1], topCollectors[0], topCollectors[2]] : topCollectors)
    : [];

  const pieData = home.data?.collectionHighlights || [];

  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  const calendarData = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const remainingDays = daysInMonth - today.getDate();
    return { year, monthName: today.toLocaleString('default', { month: 'long' }), daysInMonth, firstDay, remainingDays };
  }, [today]);

  const daysArray = Array.from({ length: calendarData.daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: calendarData.firstDay }, (_, i) => i);

  let cumulativePercent = 0;
  const pieSlices = pieData.map((slice, index) => {
    const startX = Math.cos(2 * Math.PI * cumulativePercent);
    const startY = Math.sin(2 * Math.PI * cumulativePercent);
    cumulativePercent += slice.value / 100;
    const endX = Math.cos(2 * Math.PI * cumulativePercent);
    const endY = Math.sin(2 * Math.PI * cumulativePercent);
    const largeArcFlag = slice.value > 50 ? 1 : 0;
    const pathData = [`M 0 0`, `L ${startX} ${startY}`, `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, `Z`].join(' ');
    return { ...slice, pathData, index };
  });

  const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (home.isLoading && !home.data) {
    return (
      <div className="p-8 bg-app h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-text-muted font-black uppercase tracking-widest">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-app h-screen flex flex-col animate-in fade-in duration-500 font-sans overflow-hidden">
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-8 overflow-hidden">
        <div className="xl:col-span-3 flex flex-col gap-8 overflow-y-auto scrollbar-none pb-8 pr-1">
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl flex items-center h-52 shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#818cf8] via-[#6366f1] to-[#4f46e5]"></div>
                <div className="absolute inset-0"><svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 400"><path d="M0,400 L0,250 C150,220 300,100 450,250 C600,400 750,150 1000,200 L1000,400 Z" fill="#a5b4fc" fillOpacity="0.3" /><path d="M0,400 L0,350 C250,350 400,200 600,300 C750,380 850,250 1000,300 L1000,400 Z" fill="#6366f1" fillOpacity="0.5" /></svg></div>
                <div className="relative z-10 pl-12 text-white flex flex-col justify-center h-full">
                    <h1 className="text-4xl font-black mb-2 tracking-tight">Hello {currentUser.name.split(' ')[0]}!</h1>
                    <p className="text-indigo-50 font-bold text-lg mb-6 opacity-90">Let's get the collection cycle started!</p>
                    <div className="flex gap-4">
                        <button onClick={() => onNavigate('collections-history')} className="bg-white text-indigo-600 px-8 py-3 rounded-full text-sm font-black uppercase tracking-widest shadow-xl hover:bg-indigo-50 hover:scale-105 transition-all flex items-center gap-3 w-fit">Check Collections <ArrowRight size={18} strokeWidth={3} /></button>
                        <button onClick={() => onNavigate('reports')} className="bg-indigo-400/20 backdrop-blur-md text-white border border-white/30 px-8 py-3 rounded-full text-sm font-black uppercase tracking-widest shadow-xl hover:bg-white/10 hover:scale-105 transition-all flex items-center gap-3 w-fit">View More Reports <LayoutGrid size={18} strokeWidth={3} /></button>
                        <button onClick={() => { fetchHome(true); fetchPostdates(true); }} className="bg-indigo-400/20 backdrop-blur-md text-white border border-white/30 px-8 py-3 rounded-full text-sm font-black uppercase tracking-widest shadow-xl hover:bg-white/10 hover:scale-105 transition-all flex items-center gap-3 w-fit" disabled={home.isLoading || postdates.isLoading}>
                            <RefreshCw size={18} strokeWidth={3} className={home.isLoading || postdates.isLoading ? "animate-spin" : ""} />
                            {home.isLoading || postdates.isLoading ? "Syncing..." : "Sync Data"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 shrink-0">
                <StatCard label="Success Rate" val={`${stats.successRate.val}%`} change={stats.successRate.change} isIncrease={stats.successRate.isIncrease} theme="emerald" icon={CheckCircle2} />
                <StatCard label="Decline Rate" val={`${stats.declineRate.val}%`} change={stats.declineRate.change} isIncrease={stats.declineRate.isIncrease} theme="rose" icon={ArrowDown} />
                <StatCard label="Processed Post-dates" val={formatCurrency(stats.processed.val)} change={stats.processed.change} isIncrease={stats.processed.isIncrease} theme="blue" icon={CreditCard} subVal={`${stats.processed.count} Trans`} />
            </div>

            <div className="shrink-0 flex flex-col pt-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end pb-2">
                    {displayCollectors.map((collector, i) => (
                       <div key={i} className={`relative bg-card rounded-[2rem] shadow-sm flex flex-col items-center text-center w-full transition-all group h-full border ${collector.rank === 1 ? 'z-10 shadow-indigo-100 dark:shadow-none border-transparent' : 'border-border-subtle'}`}>
                            <div className={`absolute -top-10 w-20 h-20 rounded-full ${collector.color} text-white flex items-center justify-center text-2xl font-black shadow-xl ring-8 ring-card group-hover:scale-110 transition-transform`}>{collector.initial}</div>
                            <div className="pt-12 pb-5 px-8 w-full flex flex-col h-full justify-between min-h-[250px]">
                                <div><h4 className="text-xl font-black text-text-main truncate mb-0.5">{collector.name}</h4><p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] mb-3">Rank #{collector.rank}</p></div>
                                <div className="grid grid-cols-3 gap-2 border-t border-border-subtle pt-3 mb-3">
                                    <div className="flex flex-col"><span className="text-lg font-black text-text-main">{collector.accounts}</span><span className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">Work</span></div>
                                    <div className="flex flex-col border-l border-border-subtle"><span className="text-lg font-black text-text-main">{collector.worked}</span><span className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">RPC</span></div>
                                    <div className="flex flex-col border-l border-border-subtle"><span className="text-lg font-black text-text-main">{collector.rpc}</span><span className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">Calls</span></div>
                                </div>
                                <div className={`rounded-2xl py-4 ${collector.rank === 1 ? 'bg-indigo-600 shadow-lg' : 'bg-surface-100'}`}>
                                    <span className={`block text-xl font-black leading-none ${collector.rank === 1 ? 'text-white' : 'text-indigo-600'}`}>{formatCurrency(collector.collected)}</span>
                                    <span className={`text-[9px] font-black uppercase tracking-widest mt-1.5 ${collector.rank === 1 ? 'text-indigo-200/80' : 'text-text-muted'}`}>Total Collected</span>
                                </div>
                            </div>
                       </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-4 gap-8 shrink-0 p-1">
                <OpsCard 
                    label="New Imports" 
                    val={opsMetrics.imports.count} 
                    sub={opsMetrics.imports.sub} 
                    color="indigo" 
                    icon={FileDown} 
                    onClick={currentUser.role !== 'Collector' ? () => onNavigate('new-imports') : undefined} 
                />
                <OpsCard 
                    label="Flagged accounts" 
                    val={opsMetrics.stagnant.count} 
                    sub={opsMetrics.stagnant.label} 
                    color="rose" 
                    icon={AlertOctagon} 
                    onClick={currentUser.permissions.viewAuditDashboard ? () => onNavigate('audits', 'seven_eight_days') : undefined} 
                />
                <OpsCard 
                    label="Avg Call Time" 
                    val={opsMetrics.callTime.val} 
                    sub="Avg Duration" 
                    color="amber" 
                    icon={Timer} 
                    onClick={currentUser.role !== 'Collector' ? () => onNavigate('call-performance') : undefined} 
                />
                <OpsCard 
                    label="Overdue Payments" 
                    val={formatCurrency(opsMetrics.overdue.amount)} 
                    sub={`${opsMetrics.overdue.count} Accounts`} 
                    color="rose" 
                    icon={AlertOctagon} 
                    onClick={() => onNavigate('overdue-payments')} 
                />
            </div>
        </div>

        <div className="xl:col-span-1 flex flex-col gap-8 overflow-y-auto scrollbar-none pb-8">
            <div className={`shrink-0 transition-all duration-300 ${isCalendarExpanded ? 'mb-4' : 'mb-0'}`}>
                <button onClick={() => setIsCalendarExpanded(!isCalendarExpanded)} className={`w-full bg-card rounded-[1.5rem] border border-border-subtle flex flex-col items-center justify-center shadow-sm transition-all overflow-hidden ${isCalendarExpanded ? 'p-6' : 'h-14'}`}>
                    <div className="flex items-center justify-between w-full px-4">{!isCalendarExpanded ? (<><Calendar size={20} className="text-indigo-500 mr-3 shrink-0"/><span className="text-xs font-black text-text-main uppercase tracking-widest truncate flex-1 text-left">{dateString}</span></>) : (<div className="flex-1"></div>)}{isCalendarExpanded ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted ml-2" />}</div>
                    {isCalendarExpanded && (
                      <div className="mt-2 w-full animate-in fade-in slide-in-from-top-4 duration-300">
                         <div className="flex justify-between items-center mb-4"><span className="text-sm font-black text-text-main uppercase tracking-tight">{calendarData.monthName} {calendarData.year}</span></div>
                         <div className="grid grid-cols-7 gap-1 text-center mb-2">{['S','M','T','W','T','F','S'].map((d, i) => (<span key={i} className="text-[10px] font-black text-text-muted uppercase">{d}</span>))}</div>
                         <div className="grid grid-cols-7 gap-1 text-center">{blanks.map(i => <div key={`b-${i}`} className="h-8"></div>)}{daysArray.map(day => {
                               const isToday = day === today.getDate();
                               const isPast = day < today.getDate();
                               return (<div key={day} className={`h-8 flex items-center justify-center rounded-lg text-xs font-black transition-colors ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : isPast ? 'text-slate-200 dark:text-slate-700' : 'text-text-main hover:bg-surface-100'}`}>{day}</div>);
                            })}</div>
                         <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-center justify-between">
                            <div className="flex flex-col"><span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Collecting Days</span><span className="text-xl font-black text-indigo-700 dark:text-indigo-300 leading-none">{calendarData.remainingDays} Left</span></div>
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm"><Timer size={18} /></div>
                         </div>
                      </div>
                    )}
                </button>
            </div>

            <div className="bg-card rounded-[2rem] p-8 border border-border-subtle h-[24rem] shrink-0 flex flex-col shadow-sm">
                <h3 className="font-black text-xl text-text-main mb-6 uppercase tracking-tight shrink-0">
                    Yesterday's {heroes.length === 1 ? 'Hero' : 'Heroes'}
                </h3>
                <div className="space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border-subtle flex-1">
                    {heroes.map((hero, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-surface-100 rounded-2xl border border-border-subtle hover:border-indigo-400/30 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shadow-sm">{hero.avatar}</div>
                                <span className="font-bold text-text-main text-[15px]">{hero.name}</span>
                            </div>
                            <span className="font-black text-emerald-600 text-base font-inter">{formatCurrency(hero.amount)}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-card rounded-[2rem] p-8 border border-border-subtle flex-1 flex flex-col min-h-0 shadow-sm relative">
                <div className="flex justify-between items-center mb-6 shrink-0"><h3 className="font-black text-xl text-text-main uppercase tracking-tight">Highlights</h3><MoreHorizontal size={24} className="text-text-muted cursor-pointer hover:text-indigo-500 transition-colors" /></div>
                <div className="flex-1 flex items-center justify-center relative min-h-0">
                   <div className="w-full h-full max-w-[400px] max-h-[400px] relative">
                       <svg viewBox="-1.05 -1.05 2.1 2.1" className="w-full h-full transform -rotate-90">
                           {pieSlices.map((slice) => (
                               <path key={slice.index} d={slice.pathData} fill={slice.color} stroke="var(--bg-card)" strokeWidth="0.02" className={`cursor-pointer transition-all hover:opacity-80 origin-center ${activePieIndex === slice.index ? 'scale-105' : 'hover:scale-105'}`} onClick={() => setActivePieIndex(activePieIndex === slice.index ? null : slice.index)} />
                           ))}
                       </svg>
                       {activePieIndex !== null && (
                           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                               <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-2xl text-center z-10 animate-in zoom-in-95 backdrop-blur-md bg-opacity-95 border border-white/10 max-w-[80%]">
                                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{pieData[activePieIndex].label}</p>
                                   <p className="text-2xl font-black leading-tight mb-1">{formatCurrency(pieData[activePieIndex].amount)}</p>
                                   <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wide">{pieData[activePieIndex].value}% Impact</p>
                               </div>
                           </div>
                       )}
                   </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, val, change, isIncrease, theme, icon: Icon, subVal }: any) => {
    const bgColors: any = { emerald: "#10b981", rose: "#f43f5e", blue: "#3b82f6", indigo: "#4f46e5" };
    const blobColors: any = { emerald: "#059669", rose: "#e11d48", blue: "#2563eb", indigo: "#4338ca" };
    const baseColor = bgColors[theme] || bgColors.indigo;
    const blobColor = blobColors[theme] || blobColors.indigo;
    return (
        <div className="relative rounded-[2rem] p-6 shadow-xl h-36 overflow-hidden flex flex-col justify-between group" style={{ backgroundColor: baseColor }}>
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none"><svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none"><path d="M0,140 C100,120 180,220 300,160 C380,120 450,160 500,140 L500,200 L0,200 Z" fill={blobColor} opacity="0.3" /><path d="M-50,80 C50,40 150,120 250,80 C350,40 450,80 500,60 L500,180 C400,200 300,160 200,180 C100,200 0,160 -50,180 Z" fill="white" opacity="0.1" /><circle cx="380" cy="40" r="100" fill="white" opacity="0.05" /><circle cx="20" cy="180" r="60" fill={blobColor} opacity="0.2" /></svg></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
            <div className="relative z-10 flex justify-between items-start"><p className="text-[11px] font-black text-white/95 uppercase tracking-widest drop-shadow-sm">{label}</p><div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white shadow-inner flex items-center justify-center border border-white/10 transition-transform group-hover:scale-110"><Icon size={20} strokeWidth={3} /></div></div>
            <div className="relative z-10 flex flex-col items-start">
                <div className="text-[38px] font-black text-white leading-none tracking-tight mb-2 drop-shadow-md">{val}</div>
            </div>
            {subVal && (<div className="absolute bottom-6 right-8 z-10"><span className="text-[10px] font-black text-white/90 uppercase tracking-widest drop-shadow-md">{subVal}</span></div>)}
        </div>
    );
};

const OpsCard = ({ label, val, sub, color, icon: Icon, onClick }: any) => {
    const colorMap: any = { indigo: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400", rose: "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400", amber: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400", emerald: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" };
    const btnColor: any = { indigo: "bg-indigo-600 hover:bg-indigo-700", rose: "bg-rose-600 hover:bg-rose-700", amber: "bg-amber-600 hover:bg-amber-700", emerald: "bg-emerald-600 hover:bg-emerald-700" };
    const textColor: any = { indigo: "text-indigo-600", rose: "text-rose-600", amber: "text-amber-600", emerald: "text-emerald-600" };
  return (
    <div className="bg-card rounded-[1.5rem] p-6 shadow-sm border border-border-subtle flex flex-col justify-center gap-2 group hover:shadow-md transition-all cursor-default min-h-[160px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${colorMap[color]} group-hover:scale-110 transition-transform`}><Icon size={18} /></div>
            <span className="text-[11px] font-black text-text-muted uppercase tracking-widest truncate">{label}</span>
        </div>
        {onClick && (
            <button onClick={onClick} className={`p-1.5 rounded-lg text-white shadow-sm transition-all active:scale-90 ${btnColor[color]}`}>
                <ArrowRight size={14} strokeWidth={3} />
            </button>
        )}
      </div>
      <div className="text-3xl font-black text-text-main leading-none tracking-tight">{val}</div>
      <div className={`text-[11px] font-black truncate leading-none mt-1 uppercase tracking-wider ${textColor[color]}`}>{sub}</div>
    </div>
  );
};

export default HomeDashboard;