import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Download, 
  Plus,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  PhoneForwarded,
  Calendar,
  Minimize2,
  Maximize2,
  Loader2,
  RefreshCcw
} from 'lucide-react';
import { AppUser } from '../types';

interface DispositionDashboardProps {
  onBack?: () => void;
  currentUser?: AppUser;
}

interface RawDisposition {
  date: string;
  description: string;
  count: number;
  collector: string;
}

interface CollectorSummary {
  name: string;
  total: number;
  dispositions: { type: string; count: number }[];
}

const DispositionDashboard: React.FC<DispositionDashboardProps> = ({ onBack, currentUser }) => {
  const [filterText, setFilterText] = useState('');
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [rawData, setRawData] = useState<RawDisposition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const getInitialDates = () => {
    const today = new Date();
    const start = new Date(today);
    const end = new Date(today);
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (today.getDay() === 1) { // Monday
      start.setDate(today.getDate() - 3); // Friday
      end.setDate(today.getDate() - 1); // Sunday
    } else {
      start.setDate(today.getDate() - 1); // Yesterday
      end.setDate(today.getDate() - 1); // Yesterday
    }
    return { start, end };
  };

  const [dateRange, setDateRange] = useState(getInitialDates());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDateForInput = (d: Date) => {
    const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return t.toISOString().split('T')[0];
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [year, month, day] = e.target.value.split('-').map(Number);
    const newDate = new Date();
    newDate.setFullYear(year, month - 1, day);
    newDate.setHours(0, 0, 0, 0);
    setDateRange(prev => ({ ...prev, start: newDate }));
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [year, month, day] = e.target.value.split('-').map(Number);
    const newDate = new Date();
    newDate.setFullYear(year, month - 1, day);
    newDate.setHours(23, 59, 59, 999);
    setDateRange(prev => ({ ...prev, end: newDate }));
  };

  const fetchData = async () => {
    const scriptUrl = import.meta.env.VITE_CALL_DISPOSITION_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwqyINOeJnJrtmTxHC6FpFZe-037X39Lk7Cplz4Ljj9ak_lJohkzsk7TnhJ5ZHrfe5e/exec';
    if (!scriptUrl) {
      setError('Script URL not configured');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(scriptUrl);
      const rawRes: RawDisposition[] = await response.json();
      setRawData(rawRes);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Error fetching dispositions:', err);
      setError('Failed to load data from sheet. Please check the Web App URL.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRawData = useMemo(() => {
    const startT = dateRange.start.getTime();
    const endT = dateRange.end.getTime();

    return rawData.filter(row => {
      const rDate = new Date(row.date);
      if (isNaN(rDate.getTime())) return false; 
      
      const rTime = rDate.getTime();
      return rTime >= startT && rTime <= endT;
    });
  }, [rawData, dateRange]);

  const stats = useMemo(() => {
    let totalDispositions = 0;
    let totalRpc = 0;
    let totalTpc = 0;
    let totalPayments = 0;

    const rpcTypes = [
      'talked to pg', 
      'rpc - paid in full', 
      'rpc - dispute', 
      'rpc - settle in full', 
      'secured payment', 
      'promise to pay', 
      'talked to debt cons.', 
      'talked to atty'
    ];
    const tpcTypes = ['talked to 3rd party'];
    const paymentTypes = ['rpc - paid in full', 'rpc - settle in full', 'secured payment'];

    filteredRawData.forEach(row => {
      totalDispositions += row.count;
      const descLower = row.description.toLowerCase();
      
      if (rpcTypes.includes(descLower)) {
        totalRpc += row.count;
      }
      if (tpcTypes.includes(descLower)) {
        totalTpc += row.count;
      }
      if (paymentTypes.includes(descLower)) {
        totalPayments += row.count;
      }
    });

    const conversion = totalRpc > 0 ? (totalPayments / totalRpc).toFixed(2) : "0.00";

    return [
      { label: 'Total Call Disposition', value: totalDispositions.toLocaleString(), icon: PhoneForwarded, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
      { label: 'Total Right-Party Contact', value: totalRpc.toLocaleString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
      { label: 'Total Third-Party Contact', value: totalTpc.toLocaleString(), icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' },
      { label: 'RPC → Payment Conversion', value: conversion, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    ];
  }, [filteredRawData]);

  const data = useMemo(() => {
    const groupedData = filteredRawData.reduce((acc, curr) => {
      if (!acc[curr.collector]) {
        acc[curr.collector] = { name: curr.collector, total: 0, dispositionsMap: {} };
      }
      
      acc[curr.collector].total += curr.count;
      if (!acc[curr.collector].dispositionsMap[curr.description]) {
        acc[curr.collector].dispositionsMap[curr.description] = 0;
      }
      acc[curr.collector].dispositionsMap[curr.description] += curr.count;
      
      return acc;
    }, {} as Record<string, { name: string, total: number, dispositionsMap: Record<string, number> }>);

    return Object.values(groupedData).map((collector: any) => ({
      name: collector.name,
      total: collector.total,
      dispositions: Object.entries(collector.dispositionsMap as Record<string, number>).map(([type, count]) => ({
        type,
        count
      })).sort((a, b) => b.count - a.count)
    })).sort((a, b) => b.total - a.total);
  }, [filteredRawData]);

  const filteredSummaries = data.filter(s => 
    s.name.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 bg-[#f8fafc] dark:bg-slate-950 min-h-screen animate-in fade-in duration-500 font-sans pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h1 className="text-2xl font-black text-[#1e293b] dark:text-slate-100 uppercase tracking-tight">Call Disposition Summary</h1>
          </div>
          <p className="text-slate-400 dark:text-slate-500 font-bold text-[11px] tracking-[0.2em] uppercase">Collector Activity & Outcome Volume</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#4f46e5] transition-colors" />
            <input 
              type="text" 
              placeholder="Search collector..." 
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:border-[#4f46e5]/50 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all w-64 shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsAllExpanded(!isAllExpanded)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 shadow-sm border ${
              isAllExpanded 
              ? 'bg-white dark:bg-slate-900 text-[#4f46e5] border-[#4f46e5]/20' 
              : 'bg-[#4f46e5] text-white border-transparent'
            }`}
          >
            {isAllExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            {isAllExpanded ? 'Minimize All' : 'Expand All'}
          </button>
          <button 
            onClick={fetchData}
            disabled={isLoading}
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-[#4f46e5] shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all ${
                showDatePicker 
                  ? 'bg-[#4f46e5]/10 text-[#4f46e5] border-[#4f46e5]/20' 
                  : 'bg-white dark:bg-slate-900 text-slate-400 hover:text-[#4f46e5]'
              }`}
            >
              <Calendar size={18} />
            </button>

            {showDatePicker && (
              <div className="absolute top-full right-0 mt-2 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl z-50 min-w-[300px] animate-in fade-in slide-in-from-top-2">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4">Date Range</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Start Date</label>
                    <input 
                      type="date"
                      value={formatDateForInput(dateRange.start)}
                      onChange={handleStartDateChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[#4f46e5]/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">End Date</label>
                    <input 
                      type="date"
                      value={formatDateForInput(dateRange.end)}
                      onChange={handleEndDateChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[#4f46e5]/50 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-[#4f46e5] shadow-sm transition-all">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Summary Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-40 min-h-[400px]">
          <div className="relative">
            <Loader2 size={64} className="text-[#4f46e5] animate-spin mb-6" />
            <div className="absolute inset-0 bg-[#4f46e5]/10 blur-xl rounded-full scale-150 animate-pulse"></div>
          </div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-2">Syncing Data</h2>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Retrieving logs from Google Sheets...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-rose-200 dark:border-rose-900/30">
          <AlertCircle size={48} className="text-rose-500 mb-4" />
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight mb-2">Configuration Required</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 text-center max-w-md">{error}</p>
          <button 
            onClick={fetchData}
            className="px-8 py-3 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 dark:shadow-none"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                <div className={`w-12 h-12 flex items-center justify-center rounded-2xl mb-4 ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 duration-300`}>
                  <stat.icon size={24} />
                </div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                <h4 className="text-3xl font-black text-slate-800 dark:text-slate-100">{stat.value}</h4>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredSummaries.map((collector, idx) => {
            return (
              <div key={idx} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col group">
                {/* Collector Header - Color varies by isAllExpanded */}
                <div className={`p-6 border-b transition-colors ${
                  isAllExpanded 
                    ? 'border-[#4f46e5]/20 bg-[#4f46e5] dark:bg-indigo-950'
                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 group-hover:border-[#4f46e5]/20'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-base font-black uppercase tracking-tight transition-colors ${
                      isAllExpanded 
                        ? 'text-white' 
                        : 'text-slate-800 dark:text-slate-100 group-hover:text-[#4f46e5]'
                    }`}>{collector.name}</h3>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors ${
                      isAllExpanded 
                        ? 'bg-white/20 backdrop-blur-md' 
                        : 'bg-slate-50 dark:bg-slate-800 group-hover:bg-[#4f46e5]/10'
                    }`}>
                      <PhoneForwarded size={12} className={isAllExpanded ? 'text-white' : 'text-slate-400 group-hover:text-[#4f46e5]'} />
                      <span className={`text-[10px] font-black transition-colors ${
                        isAllExpanded ? 'text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-[#4f46e5]'
                      }`}>{collector.total} TOTAL</span>
                    </div>
                  </div>
                  <p className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${
                    isAllExpanded ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'
                  }`}>Active Collector Summary</p>
                </div>

                {/* Disposition List - Retained White Background */}
                {isAllExpanded && (
                  <div className="flex-1 p-6 space-y-3 bg-white dark:bg-slate-900 animate-in slide-in-from-top-2 duration-300">
                    {collector.dispositions.map((disp, dIdx) => (
                      <div key={dIdx} className="flex items-center justify-between group/item">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 group-hover/item:bg-[#4f46e5] transition-colors"></div>
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">{disp.type}</span>
                        </div>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-transparent group-hover/item:border-indigo-200 dark:group-hover/item:border-[#4f46e5]/40 transition-all">
                          {disp.count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </div>
      )}

      {/* Footer Info */}
      {filteredSummaries.length === 0 && !isLoading && !error && (
        <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
          <AlertCircle size={48} className="text-slate-200 dark:text-slate-800 mb-4" />
          <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">No collectors matched your search</p>
        </div>
      )}
      

    </div>
  );
};

export default DispositionDashboard;
