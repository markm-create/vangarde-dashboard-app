import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar,
  CalendarRange,
  Search,
  Filter,
  Download,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSearch,
  Maximize2,
  Minimize2,
  ClipboardList
} from 'lucide-react';
import { useData } from '../DataContext';

import { AppUser } from '../types';

interface Payment { accountId: string; owner: string; dateTime: string; amount: number; status: 'Scheduled' | 'Succeeded' | 'Declined' | 'Failed'; rawDate: Date; }
const OWNERS = ["Arianne Sanchez", "Sophia Smith", "Penelope Williams", "Mary Smith", "Kim Park", "Karen Justice", "Elizabeth Harris", "Chris Reed", "Chase Schaffer", "Charles Phillips"];

const generatePayments = (count: number, type: 'scheduled' | 'processed'): Payment[] => {
  return Array.from({ length: count }).map((_, i) => {
    const owner = OWNERS[i % OWNERS.length];
    const amount = 200 + (Math.floor(Math.random() * 800));
    const now = new Date(); const date = new Date(now);
    let status: Payment['status'];
    if (type === 'scheduled') { date.setDate(now.getDate() + 1 + (i % 14)); date.setHours(9 + (i % 8), 0, 0, 0); status = 'Scheduled'; } 
    else { date.setDate(now.getDate() - (i % 7)); date.setHours(9 + (i % 8), 30, 0, 0); status = i % 5 === 0 ? 'Failed' : 'Succeeded'; }
    return { accountId: `2026-${1000 + i}`, owner, dateTime: date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }), amount, status, rawDate: date };
  });
};

const PaymentTable: React.FC<{ 
  title: string; 
  data: Payment[]; 
  type: 'scheduled' | 'processed'; 
  canExport: boolean; 
  isLoading?: boolean;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}> = ({ title, data: initialData, type, canExport, isLoading, isMaximized, onToggleMaximize }) => {
  const [filterText, setFilterText] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [sortConfig, setSortConfig] = useState<{ key: keyof Payment; direction: 'asc' | 'desc' }>({ key: 'rawDate', direction: 'desc' });
  const filterRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) setIsFilterOpen(false);
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) setIsCalendarOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredData = useMemo(() => {
    let data = [...initialData];
    if (filterText) { const lower = filterText.toLowerCase(); data = data.filter(item => item.accountId.toLowerCase().includes(lower) || item.owner.toLowerCase().includes(lower) || item.amount.toString().includes(lower) || item.status.toLowerCase().includes(lower)); }
    if (ownerFilter !== 'All') data = data.filter(item => item.owner === ownerFilter);
    if (type === 'processed' && statusFilter !== 'All') {
      if (statusFilter === 'Failed') {
        data = data.filter(item => item.status === 'Failed' || item.status === 'Declined');
      } else {
        data = data.filter(item => item.status === statusFilter);
      }
    }
    if (dateFilter.start || dateFilter.end) {
      data = data.filter(item => {
        const itemDate = new Date(item.rawDate); itemDate.setHours(0, 0, 0, 0);
        if (dateFilter.start) { const [y, m, d] = dateFilter.start.split('-').map(Number); if (itemDate < new Date(y, m - 1, d)) return false; }
        if (dateFilter.end) { const [y, m, d] = dateFilter.end.split('-').map(Number); if (itemDate > new Date(y, m - 1, d)) return false; }
        return true;
      });
    } else if (type === 'processed') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      data = data.filter(item => {
        const itemDate = new Date(item.rawDate);
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
      });
    }
    data.sort((a, b) => {
      let aVal = sortConfig.key === 'dateTime' ? a.rawDate.getTime() : a[sortConfig.key];
      let bVal = sortConfig.key === 'dateTime' ? b.rawDate.getTime() : b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [initialData, filterText, ownerFilter, statusFilter, dateFilter, sortConfig, type]);

  const requestSort = (key: keyof Payment) => setSortConfig({ key, direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc' });
  const SortIcon = ({ columnKey }: { columnKey: keyof Payment }) => {
    if (sortConfig.key !== columnKey && !(columnKey === 'dateTime' && sortConfig.key === 'rawDate')) return <ArrowUpDown size={12} className="ml-1 opacity-20 inline" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="ml-1 inline text-indigo-600" /> : <ArrowDown size={12} className="ml-1 inline text-indigo-600" />;
  };

  const handleExport = () => {
    const headers = ["Account ID", "Owner", "Date Time", "Amount", "Status"];
    const rows = filteredData.map(r => [
      `"${r.accountId}"`,
      `"${r.owner}"`,
      `"${r.dateTime}"`,
      r.amount.toFixed(2),
      `"${r.status}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`bg-card rounded-2xl border border-border-subtle shadow-sm flex flex-col overflow-hidden h-full transition-all duration-300 ${isMaximized ? 'fixed inset-4 z-[100] shadow-2xl' : 'relative'}`}>
      <div className="p-4 border-b border-border-subtle flex flex-col gap-4 shrink-0">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-bold text-text-muted uppercase tracking-widest">{title}</h4>
          {onToggleMaximize && (
            <button 
              onClick={onToggleMaximize}
              className="p-1.5 rounded-lg hover:bg-surface-100 text-text-muted transition-colors"
              title={isMaximized ? "Minimize" : "Maximize"}
            >
              {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          )}
        </div>
        <div className="flex gap-2 items-center w-full">
           <div className="relative group flex-1">
             <Search size={14} className="absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 text-text-muted" />
             <input type="text" placeholder="Search..." value={filterText} onChange={(e) => setFilterText(e.target.value)} className="pl-9 pr-3 py-2 bg-surface-100 border border-border-subtle rounded-xl text-[11px] font-medium text-text-main w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
           </div>
           <div className="relative" ref={calendarRef}>
             <button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className={`p-2 rounded-xl border transition-colors ${isCalendarOpen || dateFilter.start || dateFilter.end ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 text-indigo-600' : 'bg-surface-100 border-border-subtle text-text-muted hover:bg-card'}`}><CalendarRange size={16} /></button>
             {isCalendarOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-card rounded-xl shadow-2xl border border-border-subtle p-4 z-50 animate-in fade-in zoom-in-95">
                    <div className="flex justify-between items-center mb-4"><h4 className="text-xs font-bold text-text-main uppercase tracking-wider">Date Range</h4><button onClick={() => setIsCalendarOpen(false)} className="text-text-muted"><X size={14} /></button></div>
                    <div className="space-y-3">
                        <div className="flex gap-2">
                           <div className="flex-1"><label className="block text-[10px] font-bold text-text-muted uppercase mb-1">From</label><input type="date" value={dateFilter.start} onChange={(e) => setDateFilter(p => ({ ...p, start: e.target.value }))} className="w-full text-[11px] p-2 rounded-lg border border-border-subtle bg-surface-100 text-text-main font-medium" /></div>
                           <div className="flex-1"><label className="block text-[10px] font-bold text-text-muted uppercase mb-1">To</label><input type="date" value={dateFilter.end} onChange={(e) => setDateFilter(p => ({ ...p, end: e.target.value }))} className="w-full text-[11px] p-2 rounded-lg border border-border-subtle bg-surface-100 text-text-main font-medium" /></div>
                        </div>
                    </div>
                </div>
             )}
           </div>
           {type === 'processed' && (
             <div className="relative" ref={filterRef}>
               <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`p-2 rounded-xl border transition-colors ${isFilterOpen || statusFilter !== 'All' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 text-indigo-600' : 'bg-surface-100 border-border-subtle text-text-muted hover:bg-card'}`}><Filter size={16} /></button>
               {isFilterOpen && (
                 <div className="absolute right-0 top-full mt-2 w-48 bg-card rounded-xl shadow-2xl border border-border-subtle p-4 z-50 animate-in fade-in zoom-in-95">
                   <div className="flex justify-between items-center mb-4"><h4 className="text-xs font-bold text-text-main uppercase tracking-wider">Status Filter</h4><button onClick={() => setIsFilterOpen(false)} className="text-text-muted"><X size={14} /></button></div>
                   <div className="space-y-1">
                     {['All', 'Succeeded', 'Failed'].map((status) => (
                       <button
                         key={status}
                         onClick={() => {
                           setStatusFilter(status);
                           setIsFilterOpen(false);
                         }}
                         className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-medium transition-colors ${statusFilter === status ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'text-text-muted hover:bg-surface-100'}`}
                       >
                         {status}
                       </button>
                     ))}
                   </div>
                 </div>
               )}
             </div>
           )}
           {canExport && (<button onClick={handleExport} className="p-2 rounded-xl bg-surface-100 text-text-muted border border-border-subtle hover:bg-card hover:text-indigo-600 transition-colors"><Download size={16} /></button>)}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-0 scrollbar-thin">
        <table className="w-full text-left text-[12px] relative">
          <thead className="sticky top-0 bg-card text-text-muted uppercase tracking-widest border-b border-border-subtle text-[10px] z-10 shadow-sm">
            <tr>
              <th className="px-6 py-4 font-bold bg-card cursor-pointer hover:bg-surface-100" onClick={() => requestSort('accountId')}>Account ID <SortIcon columnKey="accountId" /></th>
              <th className="px-6 py-4 font-bold bg-card cursor-pointer hover:bg-surface-100" onClick={() => requestSort('owner')}>Owner <SortIcon columnKey="owner" /></th>
              <th className="px-6 py-4 font-bold bg-card cursor-pointer hover:bg-surface-100" onClick={() => requestSort('dateTime')}>Date & Time <SortIcon columnKey="dateTime" /></th>
              <th className="px-6 py-4 text-right font-bold bg-card cursor-pointer hover:bg-surface-100" onClick={() => requestSort('amount')}>Amount <SortIcon columnKey="amount" /></th>
              {type === 'processed' && (<th className="px-6 py-4 text-right font-bold bg-card cursor-pointer hover:bg-surface-100" onClick={() => requestSort('status')}>Status <SortIcon columnKey="status" /></th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {isLoading && initialData.length === 0 ? (
              <tr>
                <td colSpan={type === 'processed' ? 5 : 4} className="px-6 py-20">
                  <div className="flex flex-col items-center justify-center text-text-muted w-full">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-[12px] font-black uppercase tracking-[0.2em] animate-pulse">Fetching records...</p>
                  </div>
                </td>
              </tr>
            ) : filteredData.length > 0 ? (filteredData.map((row, i) => (
                <tr key={i} className="hover:bg-surface-100 transition-colors">
                  <td className="px-6 py-4 text-indigo-600 dark:text-indigo-400 font-inter italic">{row.accountId}</td>
                  <td className="px-6 py-4 text-text-main font-normal">{row.owner}</td>
                  <td className="px-6 py-4 text-text-muted font-inter font-normal">{row.dateTime}</td>
                  <td className="px-6 py-4 text-right text-text-main font-inter font-normal">${row.amount.toFixed(2)}</td>
                  {type === 'processed' && (<td className="px-6 py-4 text-right"><span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${row.status === 'Succeeded' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-500'}`}>{row.status}</span></td>)}
                </tr>
              ))) : (<tr><td colSpan={type === 'processed' ? 5 : 4} className="px-6 py-20"><div className="flex flex-col items-center justify-center text-text-muted opacity-20 w-full"><FileSearch size={48} className="mb-3" /><p className="text-[12px] font-black uppercase tracking-[0.2em]">No records found</p></div></td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PostdatesView: React.FC<{ canManageDocuments: boolean, currentUser: AppUser, onNavigate?: (tab: any, subView?: any) => void }> = ({ canManageDocuments, currentUser, onNavigate }) => {
  const { postdates, fetchPostdates, individualCollectors, fetchIndividualCollectors } = useData();
  const [maximizedTable, setMaximizedTable] = useState<'scheduled' | 'processed' | null>(null);

  const isNameMatch = (name1: string, name2: string) => {
    if (!name1 || !name2) return false;
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    if (n1 === n2) return true;
    if (n1.includes(n2) || n2.includes(n1)) return true;
    const getWords = (s: string) => s.toLowerCase().split(/[\s,._-]+/).filter(w => w.length > 1);
    const w1 = getWords(name1);
    const w2 = getWords(name2);
    if (w1.length > 0 && w2.length > 0) {
      const allW1InW2 = w1.every(word => w2.some(w => w.includes(word) || word.includes(w)));
      const allW2InW1 = w2.every(word => w1.some(w => w.includes(word) || word.includes(w)));
      if (allW1InW2 || allW2InW1) return true;
    }
    return false;
  };

  useEffect(() => { 
    fetchPostdates();
    fetchIndividualCollectors();
    const interval = setInterval(() => {
      fetchPostdates(true);
      fetchIndividualCollectors(true);
    }, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, [fetchPostdates, fetchIndividualCollectors]);

  const { scheduled: rawScheduledData, processed: rawProcessedData, isLoading } = postdates;

  const isCollector = currentUser.role.toLowerCase() === 'collector';

  const scheduledData = useMemo(() => {
    if (isCollector) {
      return rawScheduledData.filter(p => p.owner.toLowerCase() === currentUser.name.toLowerCase());
    }
    return rawScheduledData;
  }, [rawScheduledData, isCollector, currentUser.name]);

  const processedData = useMemo(() => {
    if (isCollector) {
      return rawProcessedData.filter(p => p.owner.toLowerCase() === currentUser.name.toLowerCase());
    }
    return rawProcessedData;
  }, [rawProcessedData, isCollector, currentUser.name]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayStr = now.toDateString();

    // Filter processed data for current month
    const currentMonthProcessed = processedData.filter(p => {
      const d = new Date(p.rawDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const succeeded = currentMonthProcessed.filter(p => p.status === 'Succeeded');
    const declined = currentMonthProcessed.filter(p => p.status === 'Declined' || p.status === 'Failed');
    
    const totalSucceeded = succeeded.reduce((sum, p) => sum + p.amount, 0);
    const totalDeclined = declined.reduce((sum, p) => sum + p.amount, 0);
    
    // Today's stats
    const todaySucceeded = currentMonthProcessed
      .filter(p => p.status === 'Succeeded' && new Date(p.rawDate).toDateString() === todayStr)
      .reduce((sum, p) => sum + p.amount, 0);
    
    const todayDeclined = currentMonthProcessed
      .filter(p => (p.status === 'Declined' || p.status === 'Failed') && new Date(p.rawDate).toDateString() === todayStr)
      .reduce((sum, p) => sum + p.amount, 0);

    // Total Remaining: scheduled for the remainder of the active month
    const totalRemaining = scheduledData.filter(p => {
      const d = new Date(p.rawDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).reduce((sum, p) => sum + p.amount, 0);

    const totalAmountProcessed = totalSucceeded + totalDeclined;
    const successRate = totalAmountProcessed > 0 ? ((totalSucceeded / totalAmountProcessed) * 100).toFixed(1) : "0.0";
    const declineRate = totalAmountProcessed > 0 ? ((totalDeclined / totalAmountProcessed) * 100).toFixed(1) : "0.0";
    
    // Total Recovered: From Google Sheets
    let totalRecovered = postdates.totalRecovered || 0; 
    
    if (isCollector && individualCollectors.data) {
      const collectorData = individualCollectors.data.find((item: any) => isNameMatch(item.name, currentUser.name));
      if (collectorData && collectorData.postdates) {
        const recoveredVal = collectorData.postdates.recovered;
        totalRecovered = typeof recoveredVal === 'string' 
          ? parseFloat(recoveredVal.replace(/[$,]/g, '')) 
          : (Number(recoveredVal) || 0);
      }
    }

    const recoveryRate = totalDeclined > 0 ? ((totalRecovered / totalDeclined) * 100).toFixed(1) : "0.0";

    return {
      totalSucceeded,
      totalDeclined,
      totalRecovered,
      totalProcessed: totalAmountProcessed,
      totalSucceededPlusRecovered: totalSucceeded + totalRecovered,
      todaySucceeded,
      todayDeclined,
      totalRemaining,
      weeklyStart: postdates.weeklyStart || 0,
      monthlyStart: postdates.monthlyStart || 0,
      successRate,
      declineRate,
      recoveryRate
    };
  }, [processedData, scheduledData, postdates.totalRecovered, postdates.weeklyStart, postdates.monthlyStart, individualCollectors.data, isCollector, currentUser.name]);

  const MAIN_CARDS = [
    { l: "TOTAL SUCCEEDED", v: `$${stats.totalSucceeded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, r: `${stats.successRate}%`, theme: "emerald" }, 
    { l: "TOTAL DECLINED", v: `$${stats.totalDeclined.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, r: `${stats.declineRate}%`, theme: "rose" }, 
    { l: "TOTAL RECOVERED", v: `$${stats.totalRecovered.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, r: `${stats.recoveryRate}%`, theme: "blue" },
    { l: "SUCCEEDED + RECOVERED", v: `$${stats.totalSucceededPlusRecovered.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, theme: "teal" },
    { l: "TOTAL PROCESSED", v: `$${stats.totalProcessed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, theme: "purple" }
  ];
  
  const SECONDARY_CARDS = [
    { l: "TODAY'S SUCCEEDED", v: `$${stats.todaySucceeded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, c: "#10b981", icon: CheckCircle2 }, 
    { l: "TODAY'S DECLINED", v: `$${stats.todayDeclined.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, c: "#f43f5e", icon: XCircle }, 
    { l: "TOTAL REMAINING", v: `$${stats.totalRemaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, c: "#eab308", icon: Clock }, 
    { l: "WEEKLY START", v: `$${stats.weeklyStart.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, c: "#1e293b", icon: Calendar }, 
    { l: "MONTHLY START", v: `$${stats.monthlyStart.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, c: "#1e293b", icon: CalendarRange }
  ];

  return (
    <div className="p-8 bg-app h-screen max-h-screen flex flex-col animate-in fade-in duration-500 font-sans overflow-hidden">
      {maximizedTable && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] animate-in fade-in duration-300" onClick={() => setMaximizedTable(null)} />}
      
      <div className="shrink-0 mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-text-main uppercase tracking-wide">Post-Dates Dashboard</h1>
          <p className="text-text-muted font-semibold text-[11px] tracking-widest mt-1 uppercase">Payment Processing & Scheduling</p>
        </div>
        {onNavigate && (
          <button 
            onClick={() => onNavigate('audits', 'postdates')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2"
          >
            <ClipboardList size={16} />
            See Recovery Report
          </button>
        )}
      </div>
      <div className="shrink-0 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {MAIN_CARDS.map((m, i) => {
            const bgColors: any = { emerald: "#10b981", rose: "#f43f5e", blue: "#3b82f6", purple: "#a855f7", teal: "#14b8a6" };
            const blobColors: any = { emerald: "#059669", rose: "#e11d48", blue: "#2563eb", purple: "#9333ea", teal: "#0d9488" };
            const baseColor = bgColors[m.theme];
            const blobColor = blobColors[m.theme];

            return (
              <div key={i} className="relative rounded-[2rem] p-6 shadow-xl h-40 overflow-hidden flex flex-col justify-between group transition-all hover:scale-[1.02] duration-300" style={{ backgroundColor: baseColor }}>
                <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                  <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                    <path d="M0,140 C100,120 180,220 300,160 C380,120 450,160 500,140 L500,200 L0,200 Z" fill={blobColor} opacity="0.3" />
                    <path d="M-50,80 C50,40 150,120 250,80 C350,40 450,80 500,60 L500,180 C400,200 300,160 200,180 C100,200 0,160 -50,180 Z" fill="white" opacity="0.1" />
                    <circle cx="380" cy="40" r="100" fill="white" opacity="0.05" />
                    <circle cx="20" cy="180" r="60" fill={blobColor} opacity="0.2" />
                  </svg>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>

                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex justify-end items-start">
                    <p className="text-base font-black text-white font-inter opacity-90">
                      {m.r || '\u00A0'}
                    </p>
                  </div>
                  <div className="mt-2"><h3 className="text-4xl font-black font-inter tracking-tight text-white drop-shadow-sm">{m.v}</h3></div>
                  <div className="flex justify-between items-end mt-auto">
                    <p className="text-xs font-bold text-white/90 uppercase tracking-wider mb-1">{m.l}</p>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-white opacity-40 z-10 backdrop-blur-sm shadow-sm" />
                      <div className="w-8 h-8 rounded-full bg-white opacity-40 -ml-4 backdrop-blur-sm shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {!isCollector && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-8">
            {SECONDARY_CARDS.map((m, i) => (
              <div key={i} className="bg-card p-5 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-center h-28 relative overflow-hidden group transition-all hover:border-indigo-400/30">
                 <div className="relative z-10"><p className="text-[10px] font-bold text-text-muted mb-4 uppercase tracking-widest truncate">{m.l}</p><h3 className="text-3xl font-black font-inter tracking-tight leading-none mb-1" style={{ color: m.c === '#1e293b' ? 'var(--text-main)' : m.c }}>{m.v}</h3></div>
                 {m.icon && (<div className="absolute -bottom-4 -right-4 z-0 opacity-10 group-hover:opacity-15 transition-opacity transform group-hover:scale-110 duration-500" style={{ color: m.c === '#1e293b' ? 'var(--text-main)' : m.c }}><m.icon size={80} strokeWidth={1.5} /></div>)}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6 pb-2">
        <PaymentTable 
          title="SCHEDULED PAYMENTS" 
          data={scheduledData} 
          type="scheduled" 
          canExport={canManageDocuments} 
          isLoading={isLoading}
          isMaximized={maximizedTable === 'scheduled'}
          onToggleMaximize={() => setMaximizedTable(maximizedTable === 'scheduled' ? null : 'scheduled')}
        />
        <PaymentTable 
          title="PROCESSED PAYMENTS" 
          data={processedData} 
          type="processed" 
          canExport={canManageDocuments} 
          isLoading={isLoading}
          isMaximized={maximizedTable === 'processed'}
          onToggleMaximize={() => setMaximizedTable(maximizedTable === 'processed' ? null : 'processed')}
        />
      </div>
    </div>
  );
};

export default PostdatesView;