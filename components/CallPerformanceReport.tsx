import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Download, 
  Phone,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CalendarDays,
  FileSearch,
  Timer,
  PhoneCall,
  PhoneOutgoing,
  PhoneIncoming,
  PhoneMissed,
  Loader2,
  RefreshCw,
  Activity
} from 'lucide-react';
import { useData } from '../DataContext';

interface CallRecord {
  id: string;
  collectorName: string;
  prior: {
    outgoing: number;
    received: number;
    missed: number;
    totalCalls: number;
    completedCalls: number;
    avgCallTime: string;
    totalCallTime: string;
  };
  wtd: {
    outgoing: number;
    received: number;
    missed: number;
    totalCalls: number;
    completedCalls: number;
    avgCallTime: string;
    totalCallTime: string;
  };
  mtd: {
    outgoing: number;
    received: number;
    missed: number;
    totalCalls: number;
    completedCalls: number;
    avgCallTime: string;
    totalCallTime: string;
  };
}

type CoverageType = 'prior' | 'wtd' | 'mtd';

const CallPerformanceReport: React.FC<{ onBack: () => void; canExport: boolean }> = ({ onBack, canExport }) => {
  const { callPerformance, fetchCallPerformance } = useData();
  const [coverage, setCoverage] = useState<CoverageType>('prior');
  const [filterText, setFilterText] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'collectorName',
    direction: 'asc'
  });

  useEffect(() => {
    fetchCallPerformance();
  }, [fetchCallPerformance]);

  const displayData = useMemo(() => {
    if (!callPerformance.data) return [];
    
    return callPerformance.data.map((item: any) => ({
      id: item.id,
      collectorName: item.collectorName,
      ...item[coverage]
    }));
  }, [callPerformance.data, coverage]);

  const filteredData = useMemo(() => {
    let result = displayData.filter((item: any) => 
      item.collectorName.toLowerCase().includes(filterText.toLowerCase())
    );
    
    result.sort((a: any, b: any) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [displayData, filterText, sortConfig]);

  const requestSort = (key: string) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={12} className="ml-1 opacity-20 inline" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="ml-1 inline text-indigo-600" /> : <ArrowDown size={12} className="ml-1 inline text-indigo-600" />;
  };

  const handleExport = () => {
    const headers = ["Collector Name", "Outgoing", "Received", "Missed", "Total Calls", "Completed Calls", "Average Call Time", "Total Call Time"];
    const rows = filteredData.map((r: any) => [ `"${r.collectorName}"`, r.outgoing, r.received, r.missed, r.totalCalls, r.completedCalls, `"${r.avgCallTime}"`, `"${r.totalCallTime}"` ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Call_Performance_Report_${coverage.toUpperCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = useMemo(() => {
    const totalOutgoing = filteredData.reduce((s: number, r: any) => s + (r.outgoing || 0), 0);
    const totalReceived = filteredData.reduce((s: number, r: any) => s + (r.received || 0), 0);
    const totalMissed = filteredData.reduce((s: number, r: any) => s + (r.missed || 0), 0);
    const totalCalls = filteredData.reduce((s: number, r: any) => s + (r.totalCalls || 0), 0);
    return { totalOutgoing, totalReceived, totalMissed, totalCalls };
  }, [filteredData]);

  return (
    <div className="p-8 space-y-8 bg-app h-screen max-h-screen flex flex-col animate-in fade-in duration-500 font-sans overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 rounded-2xl bg-card border border-border-subtle text-text-muted hover:text-indigo-600 shadow-sm transition-all group">
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-text-main uppercase tracking-tight">Call Performance Report</h1>
              {callPerformance.isLoading && <Loader2 className="animate-spin text-indigo-600" size={20} />}
            </div>
            <p className="text-text-muted font-bold text-[11px] tracking-[0.2em] mt-1 uppercase">Collector Communication Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchCallPerformance(true)}
              disabled={callPerformance.isLoading}
              className="p-2.5 rounded-xl bg-card border border-border-subtle text-text-muted hover:text-indigo-600 transition-all disabled:opacity-50 shadow-sm"
              title="Sync Data"
            >
              <RefreshCw size={18} className={callPerformance.isLoading ? 'animate-spin' : ''} />
            </button>
            <div className="flex bg-card p-1 rounded-xl border border-border-subtle shadow-sm">
                {(['prior', 'wtd', 'mtd'] as CoverageType[]).map((type) => (
                    <button
                        key={type}
                        onClick={() => setCoverage(type)}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${coverage === type ? 'bg-indigo-600 text-white shadow-md' : 'text-text-muted hover:text-indigo-600'}`}
                    >
                        {type === 'prior' ? 'Prior Date' : type === 'wtd' ? 'Week to Date' : 'Month to Date'}
                    </button>
                ))}
            </div>
            {canExport && (
                <button onClick={handleExport} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 shadow-lg active:scale-95 transition-all">
                    <Download size={14} /> Export CSV
                </button>
            )}
        </div>
      </div>

      {callPerformance.error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 animate-in slide-in-from-top-2">
          <Activity size={16} />
          <span>Sync Error: {callPerformance.error}. Please ensure the Google Script is deployed to "Anyone".</span>
          <button onClick={() => fetchCallPerformance(true)} className="ml-auto underline">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
          <div className="bg-card p-6 rounded-[2rem] border border-border-subtle shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
              <div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Outgoing</p><p className="text-3xl font-black text-indigo-600">{stats.totalOutgoing}</p></div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform"><PhoneOutgoing size={24} /></div>
          </div>
          <div className="bg-card p-6 rounded-[2rem] border border-border-subtle shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
              <div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Received</p><p className="text-3xl font-black text-emerald-600">{stats.totalReceived}</p></div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform"><PhoneIncoming size={24} /></div>
          </div>
          <div className="bg-card p-6 rounded-[2rem] border border-border-subtle shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
              <div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Missed</p><p className="text-3xl font-black text-rose-600">{stats.totalMissed}</p></div>
              <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform"><PhoneMissed size={24} /></div>
          </div>
          <div className="bg-card p-6 rounded-[2rem] border border-border-subtle shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
              <div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Total Calls</p><p className="text-3xl font-black text-text-main">{stats.totalCalls}</p></div>
              <div className="p-3 bg-surface-100 text-text-muted rounded-2xl group-hover:scale-110 transition-transform"><PhoneCall size={24} /></div>
          </div>
      </div>

      <div className="flex-1 bg-card rounded-[2rem] border border-border-subtle shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-surface-100 text-text-muted"><Phone size={18} /></div>
            <h2 className="text-sm font-black text-text-main uppercase tracking-widest">Performance Breakdown</h2>
          </div>
          <div className="relative group">
            <Search size={14} className="absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input type="text" placeholder="Search collector..." value={filterText} onChange={(e) => setFilterText(e.target.value)} className="pl-9 pr-4 py-2 bg-surface-100 border border-border-subtle rounded-xl text-[11px] font-medium text-text-main w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
          </div>
        </div>
        <div className="flex-1 overflow-auto scrollbar-thin">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 z-20 bg-card">
              <tr className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-subtle bg-surface-100/50 backdrop-blur-sm">
                <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('collectorName')}>Collector Name <SortIcon columnKey="collectorName" /></th>
                <th className="px-6 py-5 text-center cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('outgoing')}>Outgoing <SortIcon columnKey="outgoing" /></th>
                <th className="px-6 py-5 text-center cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('received')}>Received <SortIcon columnKey="received" /></th>
                <th className="px-6 py-5 text-center cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('missed')}>Missed <SortIcon columnKey="missed" /></th>
                <th className="px-6 py-5 text-center cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('totalCalls')}>Total Calls <SortIcon columnKey="totalCalls" /></th>
                <th className="px-6 py-5 text-center cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('completedCalls')}>Completed <SortIcon columnKey="completedCalls" /></th>
                <th className="px-6 py-5 text-right cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('avgCallTime')}>Avg Time <SortIcon columnKey="avgCallTime" /></th>
                <th className="px-6 py-5 text-right cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('totalCallTime')}>Total Time <SortIcon columnKey="totalCallTime" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-[12px]">
              {filteredData.length > 0 ? filteredData.map((row: any) => (
                <tr key={row.id} className="hover:bg-surface-100 transition-colors group">
                  <td className="px-6 py-4 font-bold text-text-main">{row.collectorName}</td>
                  <td className="px-6 py-4 text-center font-black text-indigo-600">{row.outgoing}</td>
                  <td className="px-6 py-4 text-center font-black text-emerald-600">{row.received}</td>
                  <td className="px-6 py-4 text-center font-black text-rose-600">{row.missed}</td>
                  <td className="px-6 py-4 text-center font-black text-text-main">{row.totalCalls}</td>
                  <td className="px-6 py-4 text-center font-black text-text-muted">{row.completedCalls}</td>
                  <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                          <Timer size={12} className="text-indigo-400" />
                          <span className="font-black text-text-main">{row.avgCallTime}</span>
                      </div>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-text-main">{row.totalCallTime}</td>
                </tr>
              )) : (
                <tr><td colSpan={8} className="px-6 py-20 text-center opacity-30"><FileSearch size={48} className="mx-auto mb-4" /><p className="text-sm font-black uppercase tracking-widest">No performance records found</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CallPerformanceReport;
