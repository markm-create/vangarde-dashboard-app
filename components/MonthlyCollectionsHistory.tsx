import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Search, 
  X, 
  Users,
  Download,
  CalendarDays,
  ChevronRight,
  Zap,
  Loader2
} from 'lucide-react';
import { useData } from '../DataContext';

import { AppUser } from '../types';

interface MonthlyCollectionsHistoryProps {
  onBack: () => void;
  currentUser?: AppUser;
}

const MonthlyCollectionsHistory: React.FC<MonthlyCollectionsHistoryProps> = ({ onBack, currentUser }) => {
  const { home, fetchHome } = useData();
  const [filterText, setFilterText] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const today = new Date();
  const initialStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const initialEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const formatDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [dateRange, setDateRange] = useState({
    start: formatDate(initialStart),
    end: formatDate(initialEnd)
  });

  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHome(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const collectorSummaries = useMemo(() => {
    if (!home.data) return [];
    
    const [yearS, monthS, dayS] = dateRange.start.split('-').map(Number);
    const start = new Date(yearS, monthS - 1, dayS, 0, 0, 0, 0);
    
    const [yearE, monthE, dayE] = dateRange.end.split('-').map(Number);
    const end = new Date(yearE, monthE - 1, dayE, 23, 59, 59, 999);
    
    let result = home.data.checkCollections.map(item => {
      let itemDate = new Date(item.date);
      
      // If it's an ISO string (e.g., "2026-03-06T00:00:00.000Z"), extract YYYY-MM-DD to avoid timezone shifts
      if (typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(item.date)) {
        const [y, m, d] = item.date.substring(0, 10).split('-').map(Number);
        itemDate = new Date(y, m - 1, d);
      } else if (typeof item.date === 'number' && item.date > 20000 && item.date < 100000) {
        // Handle Excel serial dates (days since Dec 30, 1899)
        itemDate = new Date((item.date - 25569) * 86400 * 1000);
        // Adjust for local timezone offset so the date doesn't shift
        itemDate = new Date(itemDate.getTime() + itemDate.getTimezoneOffset() * 60000);
      }
      
      let parsedAmount = 0;
      if (typeof item.amount === 'number') {
        parsedAmount = item.amount;
      } else if (typeof item.amount === 'string') {
        parsedAmount = Number(item.amount.replace(/[^0-9.-]+/g, "")) || 0;
      }
      
      return {
        date: isNaN(itemDate.getTime()) ? 'Invalid Date' : itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        name: item.collector || 'Unknown',
        accountNumber: item.accountNumber || 'N/A',
        clientName: item.clientName || 'N/A',
        amount: parsedAmount,
        rawDate: isNaN(itemDate.getTime()) ? new Date(0) : itemDate
      };
    });

    // Filter by date range
    result = result.filter(r => r.rawDate >= start && r.rawDate <= end);

    // Filter by collector if the user is a Collector
    if (currentUser && currentUser.role === 'Collector') {
      result = result.filter(r => r.name === currentUser.name);
    }

    if (filterText) {
      const lower = filterText.toLowerCase();
      result = result.filter(r => 
        r.name.toLowerCase().includes(lower) || 
        r.date.toLowerCase().includes(lower) ||
        r.accountNumber.toLowerCase().includes(lower) ||
        r.clientName.toLowerCase().includes(lower)
      );
    }
    
    return result.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
  }, [home.data, dateRange, filterText, currentUser]);

  const totalCollectedInRange = useMemo(() => collectorSummaries.reduce((sum, curr) => sum + curr.amount, 0), [collectorSummaries]);

  const handleDateChange = (type: 'start' | 'end', val: string) => {
    setDateRange(p => ({ ...p, [type]: val }));
  };

  const handleExport = () => {
    const headers = ["Date", "Account Number", "Collector", "Client Name", "Amount"];
    const rows = collectorSummaries.map(r => [
      `"${r.date}"`,
      `"${r.accountNumber}"`,
      `"${r.name}"`,
      `"${r.clientName}"`,
      r.amount.toFixed(2)
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Collections_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const parseLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  return (
    <div className="h-screen bg-app flex flex-col font-sans overflow-hidden">
      <div className="p-8 pb-4 space-y-8 flex-shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2.5 rounded-2xl bg-card border border-border-subtle text-text-muted hover:text-indigo-600 shadow-sm transition-all group">
              <ArrowLeft size={20} className="group-hover:-translate-x-1" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-text-main uppercase tracking-tight">Collections History</h1>
              <p className="text-text-muted font-bold text-[11px] tracking-widest mt-1 uppercase">Daily Performance Breakdown</p>
            </div>
          </div>
          <div className="relative bg-gradient-to-br from-[#818cf8] via-[#6366f1] to-[#4f46e5] px-6 py-3 rounded-2xl shadow-lg flex flex-col items-end overflow-hidden transition-all duration-500">
              <div className="relative z-10 flex flex-col items-end text-white">
                  <span className="text-[9px] font-black text-white/80 uppercase tracking-widest mb-0.5">Total Collected in Range</span>
                  <span className="text-2xl font-black font-inter">{formatCurrency(totalCollectedInRange)}</span>
              </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search by name, account, client..." value={filterText} onChange={(e) => setFilterText(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-card border border-border-subtle rounded-[1.5rem] text-[13px] font-medium text-text-main focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" />
           </div>
           <div className="flex gap-3 w-full md:w-auto">
              <div className="relative">
                  <button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all ${isCalendarOpen ? 'bg-indigo-600 text-white' : 'bg-card border-border-subtle text-text-muted'}`}>
                      <Calendar size={16} /> {parseLocalDate(dateRange.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {parseLocalDate(dateRange.end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </button>
                  {isCalendarOpen && (
                    <div className="absolute right-0 top-full mt-3 w-72 bg-card rounded-2xl shadow-2xl border border-border-subtle p-6 z-[60] animate-in fade-in zoom-in-95 origin-top-right">
                       <div className="space-y-4">
                          <div>
                             <label className="text-[9px] font-black text-text-muted uppercase">From</label>
                             <input type="date" value={dateRange.start} onChange={(e) => handleDateChange('start', e.target.value)} className="w-full p-2.5 bg-surface-100 border border-border-subtle rounded-xl text-xs font-bold text-text-main" />
                          </div>
                          <div>
                             <label className="text-[9px] font-black text-text-muted uppercase">To</label>
                             <input type="date" value={dateRange.end} onChange={(e) => handleDateChange('end', e.target.value)} className="w-full p-2.5 bg-surface-100 border border-border-subtle rounded-xl text-xs font-bold text-text-main" />
                          </div>
                       </div>
                    </div>
                  )}
              </div>
              <button onClick={handleExport} className="flex items-center gap-2.5 px-7 py-3 bg-indigo-600 text-white rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"><Download size={16} /> EXPORT CSV</button>
           </div>
        </div>
      </div>
      <div className="flex-1 px-8 pb-8 min-h-0">
        <div className="h-full bg-card rounded-[2rem] border border-border-subtle shadow-sm overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto scrollbar-thin">
               {home.isLoading && !home.lastFetched ? (
                 <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                    <p className="text-text-muted font-black uppercase tracking-widest">Syncing Records...</p>
                 </div>
               ) : (
                <table className="w-full text-left border-collapse min-w-[1000px]">
                   <thead className="sticky top-0 z-20 bg-card">
                     <tr className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-subtle">
                       <th className="px-8 py-6">Date</th>
                       <th className="px-8 py-6">Account Number</th>
                       <th className="px-8 py-6">Collector</th>
                       <th className="px-8 py-6">Client Name</th>
                       <th className="px-10 py-6 text-right">Amount</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-border-subtle text-[13px]">
                     {collectorSummaries.length > 0 ? collectorSummaries.map((row, idx) => (
                       <tr key={idx} className="hover:bg-surface-100 transition-colors group">
                          <td className="px-8 py-5 font-bold text-text-muted font-inter"><div className="flex items-center gap-2.5"><CalendarDays size={14} /><span className="text-text-main">{row.date}</span></div></td>
                          <td className="px-8 py-5 font-bold text-indigo-600 font-inter italic">{row.accountNumber}</td>
                          <td className="px-8 py-5"><div className="flex items-center gap-4"><div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black bg-surface-100 text-text-muted">{row.name.split(' ').map(n => n[0]).join('').toUpperCase()}</div><span className="font-black text-text-main">{row.name}</span></div></td>
                          <td className="px-8 py-5 text-text-muted font-medium">{row.clientName}</td>
                          <td className="px-10 py-5 text-right font-black text-base text-emerald-500"><div className="flex items-center justify-end gap-2">{formatCurrency(row.amount)}<ChevronRight size={14} className="text-text-muted opacity-20" /></div></td>
                       </tr>
                     )) : <tr><td colSpan={5} className="px-8 py-20 text-center opacity-20"><Users size={48} className="mx-auto mb-4" /><p className="text-sm font-black uppercase tracking-widest">No data available</p></td></tr>}
                   </tbody>
                </table>
               )}
            </div>
        </div>
      </div>
    </div>
  );
};


export default MonthlyCollectionsHistory;