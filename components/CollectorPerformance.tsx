import React, { useState, useMemo, useEffect } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Crown, Trophy, Medal, Download, Loader2, RefreshCw } from 'lucide-react';
import { useData } from '../DataContext';

import { AppUser } from '../types';

interface CollectorData { rank: number; name: string; prior_worked: number; prior_rpc: number; prior_calls: number; prior_collected: number; wtd_worked: number; wtd_rpc: number; wtd_calls: number; wtd_collected: number; mtd_worked: number; mtd_rpc: number; mtd_calls: number; mtd_collected: number; [key: string]: string | number; }

interface CollectorPerformanceProps {
  currentUser: AppUser;
}

const CollectorPerformance: React.FC<CollectorPerformanceProps> = ({ currentUser }) => {
  const { collectors, fetchCollectors } = useData();
  const [sortConfig, setSortConfig] = useState<{ key: keyof CollectorData; direction: 'asc' | 'desc' }>({ key: 'mtd_collected', direction: 'desc' });
  const THEME_MINT = "#74dcb6"; const THEME_DARK_BLUE = "#5c6b9f"; const THEME_LIGHT_BLUE = "#93c5fd";

  useEffect(() => {
    fetchCollectors();
    const interval = setInterval(() => {
      fetchCollectors(true);
    }, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, [fetchCollectors]);

  const rawData: CollectorData[] = useMemo(() => {
    if (collectors.data && collectors.data.length > 0) {
      const parseNum = (val: any) => {
        if (typeof val === 'number') return val;
        const cleaned = String(val || '0').replace(/[$,]/g, '');
        return parseFloat(cleaned) || 0;
      };
      return collectors.data.map((row, index) => ({
        rank: index + 1,
        name: row.name,
        prior_worked: parseNum(row.prior_worked),
        prior_rpc: parseNum(row.prior_rpc),
        prior_calls: parseNum(row.prior_calls),
        prior_collected: parseNum(row.prior_collected),
        wtd_worked: parseNum(row.wtd_worked),
        wtd_rpc: parseNum(row.wtd_rpc),
        wtd_calls: parseNum(row.wtd_calls),
        wtd_collected: parseNum(row.wtd_collected),
        mtd_worked: parseNum(row.mtd_worked),
        mtd_rpc: parseNum(row.mtd_rpc),
        mtd_calls: parseNum(row.mtd_calls),
        mtd_collected: parseNum(row.mtd_collected),
      }));
    }
    
    return [];
  }, [collectors.data]);

  const sortedData = useMemo(() => {
    const items = [...rawData];
    items.sort((a, b) => {
      const aV = a[sortConfig.key]; const bV = b[sortConfig.key];
      if (aV < bV) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aV > bV) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [rawData, sortConfig]);

  const activeMetric = useMemo(() => {
    const metrics = ['prior_worked', 'prior_rpc', 'prior_calls', 'prior_collected', 'wtd_worked', 'wtd_rpc', 'wtd_calls', 'wtd_collected', 'mtd_worked', 'mtd_rpc', 'mtd_calls', 'mtd_collected'];
    return metrics.includes(sortConfig.key as string) ? sortConfig.key as keyof CollectorData : 'mtd_collected';
  }, [sortConfig.key]);

  const podiumData = useMemo(() => [...rawData].sort((a, b) => (b[activeMetric] as number) - (a[activeMetric] as number)), [rawData, activeMetric]);
  const SortIcon = ({ columnKey }: { columnKey: keyof CollectorData }) => sortConfig.key !== columnKey ? <ArrowUpDown size={10} className="ml-1 opacity-20 inline" /> : sortConfig.direction === 'asc' ? <ArrowUp size={10} className="ml-1 inline text-indigo-600" /> : <ArrowDown size={10} className="ml-1 inline text-indigo-600" />;
  const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const isCollector = currentUser.role.toLowerCase() === 'collector';
  const visibleMetrics = isCollector ? ['collected'] : ['worked', 'rpc', 'calls', 'collected'];
  const colSpanCount = visibleMetrics.length;

  const getMetricDisplay = (row: CollectorData) => {
    const val = row[activeMetric] as number;
    return { label: (activeMetric as string).replace(/_/g, ' ').toUpperCase(), value: (activeMetric as string).includes('collected') ? formatCurrency(val) : val.toLocaleString() };
  };

  const handleExport = () => {
    const headers = isCollector 
      ? [
          "Rank", "Name", 
          "Prior Collected",
          "WTD Collected",
          "MTD Collected"
        ]
      : [
          "Rank", "Name", 
          "Prior Worked", "Prior RPC", "Prior Calls", "Prior Collected",
          "WTD Worked", "WTD RPC", "WTD Calls", "WTD Collected",
          "MTD Worked", "MTD RPC", "MTD Calls", "MTD Collected"
        ];
    const rows = sortedData.map(r => isCollector 
      ? [
          r.rank, `"${r.name}"`,
          r.prior_collected.toFixed(2),
          r.wtd_collected.toFixed(2),
          r.mtd_collected.toFixed(2)
        ]
      : [
          r.rank, `"${r.name}"`,
          r.prior_worked, r.prior_rpc, r.prior_calls, r.prior_collected.toFixed(2),
          r.wtd_worked, r.wtd_rpc, r.wtd_calls, r.wtd_collected.toFixed(2),
          r.mtd_worked, r.mtd_rpc, r.mtd_calls, r.mtd_collected.toFixed(2)
        ]
    );
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Collector_Rankings.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [t1, t2, t3] = [podiumData[0], podiumData[1], podiumData[2]];

  return (
    <div className="p-8 space-y-8 bg-app h-screen max-h-screen flex flex-col animate-in fade-in duration-500 font-sans overflow-hidden">
      <div className="shrink-0 flex flex-col items-center">
        <div className="flex justify-between items-center w-full mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-text-main uppercase tracking-wide">Collector Rankings</h1>
              {collectors.isLoading && <Loader2 className="animate-spin text-indigo-500" size={20} />}
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => fetchCollectors(true)}
                disabled={collectors.isLoading}
                className="p-2.5 rounded-xl bg-surface-100 border border-border-subtle text-text-muted hover:text-indigo-500 hover:border-indigo-200 transition-all disabled:opacity-50"
              >
                <RefreshCw size={18} className={collectors.isLoading ? 'animate-spin' : ''} />
              </button>
              <button onClick={handleExport} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 shadow-lg active:scale-95 transition-all">
                  <Download size={14} /> Export CSV
              </button>
            </div>
        </div>
        <div className="flex items-end justify-center gap-4 w-full max-w-4xl h-[300px] mb-4">
          {t2 && (<div className="flex flex-col items-center w-1/3 animate-in slide-in-from-bottom-8 duration-700">
              <div className="relative mb-3 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-4 border-slate-300 shadow-lg bg-card flex items-center justify-center text-xl font-black text-slate-500 mb-2 overflow-hidden">{t2.name.split(' ').map(n => n[0]).join('').toUpperCase()}</div>
                <div className="absolute -top-3 bg-surface-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full p-1.5 shadow-sm border border-slate-300 dark:border-slate-700 flex items-center justify-center"><Medal size={14} /></div>
                <p className="font-black text-text-main text-sm">{t2.name}</p>
                <div className="bg-surface-100 px-3 py-1.5 rounded-full mt-1 border border-border-subtle flex flex-col items-center text-center">
                  <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{getMetricDisplay(t2).label}</p>
                  <p className="text-sm font-black text-text-main">{getMetricDisplay(t2).value}</p>
                </div>
              </div>
              <div className="w-full h-36 bg-gradient-to-t from-slate-300 dark:from-slate-800 via-slate-200 dark:via-slate-700 to-transparent rounded-t-xl shadow-lg border-x border-t border-white/10 relative overflow-hidden"><div className="absolute bottom-4 w-full text-center text-5xl font-black text-slate-500/20 select-none">2</div></div>
            </div>)}
          {t1 && (<div className="flex flex-col items-center w-1/3 z-10 -mx-2 animate-in slide-in-from-bottom-12 duration-700">
              <div className="relative mb-3 flex flex-col items-center transform scale-110">
                <Crown size={28} className="text-amber-500 fill-amber-500 mb-1 animate-bounce duration-[3000ms]" />
                <div className="w-20 h-20 rounded-full border-4 border-amber-300 shadow-xl bg-card flex items-center justify-center text-2xl font-black text-amber-600 mb-2 overflow-hidden ring-4 ring-card">{t1.name.split(' ').map(n => n[0]).join('').toUpperCase()}</div>
                <p className="font-black text-text-main text-sm">{t1.name}</p>
                <div className="bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-full mt-1 border border-amber-200 dark:border-amber-800 flex flex-col items-center text-center">
                  <p className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">{getMetricDisplay(t1).label}</p>
                  <p className="text-sm font-black text-amber-700 dark:text-amber-300">{getMetricDisplay(t1).value}</p>
                </div>
              </div>
              <div className="w-full h-44 bg-gradient-to-t from-amber-300 dark:from-amber-900/80 via-amber-100 dark:via-amber-800/40 to-transparent rounded-t-xl shadow-2xl border-x border-t border-white/20 relative overflow-hidden"><div className="absolute bottom-4 w-full text-center text-6xl font-black text-amber-600/20 select-none">1</div></div>
            </div>)}
          {t3 && (<div className="flex flex-col items-center w-1/3 animate-in slide-in-from-bottom-4 duration-700">
              <div className="relative mb-3 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-4 border-orange-300 shadow-lg bg-card flex items-center justify-center text-xl font-black text-orange-600 mb-2 overflow-hidden">{t3.name.split(' ').map(n => n[0]).join('').toUpperCase()}</div>
                <div className="absolute -top-3 bg-orange-100 dark:bg-orange-950 text-orange-600 rounded-full p-1.5 shadow-sm border border-orange-200 dark:border-orange-800/50 flex items-center justify-center"><Medal size={14} /></div>
                <p className="font-black text-text-main text-sm">{t3.name}</p>
                <div className="bg-orange-100 dark:bg-orange-900/30 px-3 py-1.5 rounded-full mt-1 border border-orange-200 dark:border-amber-800 flex flex-col items-center text-center">
                  <p className="text-[9px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest">{getMetricDisplay(t3).label}</p>
                  <p className="text-sm font-black text-orange-800 dark:text-orange-300">{getMetricDisplay(t3).value}</p>
                </div>
              </div>
              <div className="w-full h-28 bg-gradient-to-t from-orange-300 dark:from-orange-900/80 via-orange-100 dark:via-orange-800/40 to-transparent rounded-t-xl shadow-lg border-x border-t border-white/10 relative overflow-hidden"><div className="absolute bottom-4 w-full text-center text-5xl font-black text-orange-800/10 select-none">3</div></div>
            </div>)}
        </div>
      </div>

      <div className="flex-1 bg-card rounded-xl border border-border-subtle shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="overflow-auto scrollbar-thin flex-1">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-10 bg-card shadow-sm"><tr className="text-[11px] font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle">
                <th className="px-6 py-4 border-r border-border-subtle">RANK</th><th className="px-6 py-4 border-r border-border-subtle cursor-pointer hover:bg-surface-100" onClick={() => setSortConfig({ key: 'name', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>AGENT NAME <SortIcon columnKey="name" /></th>
                <th colSpan={colSpanCount} className="text-center px-4 py-4 border-r border-border-subtle" style={{ color: THEME_MINT, backgroundColor: `${THEME_MINT}10` }}>PRIOR PERFORMANCE</th>
                <th colSpan={colSpanCount} className="text-center px-4 py-4 border-r border-border-subtle" style={{ color: THEME_DARK_BLUE, backgroundColor: `${THEME_DARK_BLUE}10` }}>WEEK PERFORMANCE</th>
                <th colSpan={colSpanCount} className="text-center px-4 py-4" style={{ color: THEME_LIGHT_BLUE, backgroundColor: `${THEME_LIGHT_BLUE}10` }}>MONTH PERFORMANCE</th>
              </tr>
              <tr className="text-[10px] font-bold border-b border-border-subtle text-text-muted bg-surface-100"><th className="px-6 py-2" /><th className="px-6 py-2" />
                {visibleMetrics.map(m => (<th key={`prior_${m}`} className="px-2 py-2 text-center cursor-pointer hover:bg-card transition-colors uppercase" onClick={() => setSortConfig({ key: `prior_${m}` as any, direction: 'desc' })}>{m.slice(0,4)}</th>))}
                {visibleMetrics.map(m => (<th key={`wtd_${m}`} className="px-2 py-2 text-center cursor-pointer hover:bg-card transition-colors uppercase" onClick={() => setSortConfig({ key: `wtd_${m}` as any, direction: 'desc' })}>{m.slice(0,4)}</th>))}
                {visibleMetrics.map(m => (<th key={`mtd_${m}`} className="px-2 py-2 text-center cursor-pointer hover:bg-card transition-colors uppercase" onClick={() => setSortConfig({ key: `mtd_${m}` as any, direction: 'desc' })}>{m.slice(0,4)}</th>))}
              </tr></thead>
            <tbody className="divide-y divide-border-subtle text-[13px]">
              {sortedData.map((row, i) => (
                <tr key={i} className="hover:bg-surface-100 transition-colors">
                  <td className="px-6 py-4 font-bold text-text-muted text-center font-inter">{i + 1}</td><td className="px-6 py-4 font-normal text-text-main">{row.name}</td>
                  {!isCollector && <><td className="px-2 py-4 text-text-muted text-center">{row.prior_worked}</td><td className="px-2 py-4 text-text-muted text-center">{row.prior_rpc}</td><td className="px-2 py-4 text-text-muted text-center">{row.prior_calls}</td></>}
                  <td className="px-2 py-4 font-bold text-center" style={{ color: THEME_MINT }}>{formatCurrency(row.prior_collected)}</td>
                  {!isCollector && <><td className="px-2 py-4 text-text-muted text-center">{row.wtd_worked}</td><td className="px-2 py-4 text-text-muted text-center">{row.wtd_rpc}</td><td className="px-2 py-4 text-text-muted text-center">{row.wtd_calls}</td></>}
                  <td className="px-2 py-4 font-bold text-center" style={{ color: THEME_DARK_BLUE }}>{formatCurrency(row.wtd_collected)}</td>
                  {!isCollector && <><td className="px-2 py-4 text-text-muted text-center">{row.mtd_worked}</td><td className="px-2 py-4 text-text-muted text-center">{row.mtd_rpc}</td><td className="px-2 py-4 text-text-muted text-center">{row.mtd_calls}</td></>}
                  <td className="px-2 py-4 font-bold text-center" style={{ color: THEME_LIGHT_BLUE }}>{formatCurrency(row.mtd_collected)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default CollectorPerformance;