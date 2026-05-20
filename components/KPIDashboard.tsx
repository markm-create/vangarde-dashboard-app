
import React, { useState, useMemo, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, Activity, DollarSign, BarChart2, Calendar, PieChart, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { COLLECTORS, KPI_SCRIPT_URL } from '../constants';
import { useData } from '../DataContext';
import LoadingScreen from './LoadingScreen';

type TabType = 'collection' | 'performance' | 'postdates' | 'charts';
type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;

const formatCurrency = (val: any) => {
  if (val === null || val === undefined || val === '') return '$0.00';
  const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g, "")) : Number(val);
  if (isNaN(num)) return val;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
};

const formatPercentage = (val: any) => {
  if (val === null || val === undefined || val === '') return '0%';
  if (typeof val === 'string' && val.includes('%')) return val;
  const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g, "")) : Number(val);
  if (isNaN(num)) return val;
  return `${num.toFixed(2)}%`;
};

const formatDuration = (val: any) => {
  if (!val) return '0:00:00';
  if (typeof val === 'string' && val.includes(':')) return val;
  const num = Number(val);
  if (!isNaN(num)) {
    const h = Math.floor(num / 3600);
    const m = Math.floor((num % 3600) / 60);
    const s = Math.floor(num % 60);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return val;
};

const formatNumber = (val: any) => {
  if (val === null || val === undefined || val === '') return '0';
  const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g, "")) : Number(val);
  if (isNaN(num)) return val;
  return new Intl.NumberFormat('en-US').format(num);
};

const getVarianceColor = (val: any) => {
  if (val === null || val === undefined || val === '') return 'text-slate-600 dark:text-slate-400';
  const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g, "")) : Number(val);
  if (isNaN(num)) return 'text-slate-600 dark:text-slate-400';
  
  if (num >= 90) return 'text-emerald-600 dark:text-emerald-400';
  if (num >= 75) return 'text-yellow-600 dark:text-yellow-400';
  if (num >= 50) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

const KPIDashboard: React.FC = () => {
  const { kpi, fetchKpi } = useData();
  const [activeTab, setActiveTab] = useState<TabType>('collection');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [collectionTimeframe, setCollectionTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [performanceTimeframe, setPerformanceTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) {
      return <ArrowUpDown size={12} className="inline ml-1 text-slate-300 dark:text-slate-600" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={12} className="inline ml-1 text-indigo-500" />
    ) : (
      <ArrowDown size={12} className="inline ml-1 text-indigo-500" />
    );
  };

  const tabs = [
    { id: 'collection', label: 'Collection', icon: DollarSign },
    { id: 'performance', label: 'Performance', icon: BarChart2 },
    { id: 'postdates', label: 'Postdates', icon: Calendar },
    { id: 'charts', label: 'Charts', icon: PieChart },
  ] as const;

  // Mock data generator for collectors
  const getMockData = (collectorName: string) => {
    return {
      collectorName,
      collection: {
        daily: { collected: 0, target: 0, variance: 0 },
        weekly: { collected: 0, target: 0, variance: 0 },
        monthly: { collected: 0, target: 0, variance: 0 },
        payments: { count: 0, average: 0 }
      },
      performance: {
        overview: { assigned: 0, inactivated: 0 },
        daily: { worked: 0, outbound: 0, inbound: 0, missed: 0, duration: 0 },
        weekly: { worked: 0, outbound: 0, inbound: 0, missed: 0, duration: 0 },
        monthly: { worked: 0, outbound: 0, inbound: 0, missed: 0, duration: 0 }
      },
      postdates: {
        daily: { succeeded: 0, declined: 0, processed: 0 },
        weekly: { succeeded: 0, declined: 0, recovered: 0, processed: 0 },
        monthly: { succeeded: 0, declined: 0, recovered: 0, processed: 0 },
        remaining: { monthly: 0, nextWeek: 0 }
      }
    };
  };

  useEffect(() => {
    fetchKpi();
  }, [fetchKpi]);

  const normalizedData = useMemo(() => {
    const raw = (kpi.data.length > 0 && !kpi.isLoading) ? kpi.data : COLLECTORS.map(c => getMockData(c.name));
    
    const parseVal = (val: any, isDuration = false) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        if (isDuration && val.includes(':')) {
          const parts = val.split(':').map(Number);
          if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        const num = parseFloat(val.replace(/[^0-9.-]+/g, ""));
        return isNaN(num) ? 0 : num;
      }
      return 0;
    };

    return raw.map((d: any) => ({
      ...d,
      _parsed: {
        collection: {
          daily: { 
            collected: parseVal(d.collection?.daily?.collected), 
            target: parseVal(d.collection?.daily?.target), 
            variance: parseVal(d.collection?.daily?.variance) 
          },
          weekly: { 
            collected: parseVal(d.collection?.weekly?.collected), 
            target: parseVal(d.collection?.weekly?.target), 
            variance: parseVal(d.collection?.weekly?.variance) 
          },
          monthly: { 
            collected: parseVal(d.collection?.monthly?.collected), 
            target: parseVal(d.collection?.monthly?.target), 
            variance: parseVal(d.collection?.monthly?.variance) 
          },
          payments: { 
            count: parseVal(d.collection?.payments?.count), 
            average: parseVal(d.collection?.payments?.average) 
          }
        },
        performance: {
          overview: { 
            assigned: parseVal(d.performance?.overview?.assigned), 
            inactivated: parseVal(d.performance?.overview?.inactivated) 
          },
          daily: { 
            worked: parseVal(d.performance?.daily?.worked), 
            outbound: parseVal(d.performance?.daily?.outbound), 
            inbound: parseVal(d.performance?.daily?.inbound), 
            missed: parseVal(d.performance?.daily?.missed), 
            duration: parseVal(d.performance?.daily?.duration, true) 
          },
          weekly: { 
            worked: parseVal(d.performance?.weekly?.worked), 
            outbound: parseVal(d.performance?.weekly?.outbound), 
            inbound: parseVal(d.performance?.weekly?.inbound), 
            missed: parseVal(d.performance?.weekly?.missed), 
            duration: parseVal(d.performance?.weekly?.duration, true) 
          },
          monthly: { 
            worked: parseVal(d.performance?.monthly?.worked), 
            outbound: parseVal(d.performance?.monthly?.outbound), 
            inbound: parseVal(d.performance?.monthly?.inbound), 
            missed: parseVal(d.performance?.monthly?.missed), 
            duration: parseVal(d.performance?.monthly?.duration, true) 
          }
        },
        postdates: {
          daily: {
            succeeded: parseVal(d.postdates?.daily?.succeeded),
            declined: parseVal(d.postdates?.daily?.declined),
            processed: parseVal(d.postdates?.daily?.processed)
          },
          weekly: {
            succeeded: parseVal(d.postdates?.weekly?.succeeded),
            declined: parseVal(d.postdates?.weekly?.declined),
            recovered: parseVal(d.postdates?.weekly?.recovered),
            processed: parseVal(d.postdates?.weekly?.processed)
          },
          monthly: {
            succeeded: parseVal(d.postdates?.monthly?.succeeded),
            declined: parseVal(d.postdates?.monthly?.declined),
            recovered: parseVal(d.postdates?.monthly?.recovered),
            processed: parseVal(d.postdates?.monthly?.processed)
          },
          remaining: {
            monthly: parseVal(d.postdates?.remaining?.monthly),
            nextWeek: parseVal(d.postdates?.remaining?.nextWeek)
          }
        }
      }
    }));
  }, [kpi.data, kpi.isLoading]);

  const sortedData = useMemo(() => {
    let sorted = [...normalizedData];
    
    if (sortConfig) {
      sorted.sort((a, b) => {
        const keys = sortConfig.key.split('.');
        
        // If sorting directly on original nested object, map it to our _parsed object for numeric sorting
        let valA = a;
        let valB = b;
        
        let parsedA = a._parsed;
        let parsedB = b._parsed;

        let useParsed = true;

        for (const key of keys) {
          if (valA && key in valA && valA[key] !== undefined && !['collection', 'performance', 'postdates'].includes(keys[0])) {
             valA = valA[key];
             valB = valB[key];
             useParsed = false;
          } else if (useParsed && parsedA && key in parsedA) {
             parsedA = parsedA[key];
             parsedB = parsedB[key];
          }
        }
        
        if (useParsed && keys.length > 1) {
           valA = parsedA;
           valB = parsedB;
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          // Fallback string manipulation just in case we didn't map it properly to _parsed
          const numA = parseFloat(valA.replace(/[^0-9.-]+/g, ""));
          const numB = parseFloat(valB.replace(/[^0-9.-]+/g, ""));
          if (!isNaN(numA) && !isNaN(numB)) {
            valA = numA;
            valB = numB;
          }
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Pin special accounts to the bottom
    const regularStats: any[] = [];
    const bottomStats: any[] = [];

    sorted.forEach(agent => {
      const name = agent.collectorName?.toLowerCase() || '';
      if (name === 'unassigned' || name === 'house file' || name === 'kkarter - special handling' || name === 'kkoson - special handling') {
        bottomStats.push(agent);
      } else {
        regularStats.push(agent);
      }
    });

    // Sort bottom stats so they are consistently ordered
    bottomStats.sort((a, b) => (a.collectorName || '').localeCompare(b.collectorName || ''));

    return [...regularStats, ...bottomStats];
  }, [normalizedData, sortConfig]);

  const collectionSummary = useMemo(() => {
    let daily = 0, weekly = 0, monthly = 0, payments = 0, totalAverage = 0;
    normalizedData.forEach((d: any) => {
      daily += d._parsed.collection.daily.collected;
      weekly += d._parsed.collection.weekly.collected;
      monthly += d._parsed.collection.monthly.collected;
      payments += d._parsed.collection.payments.count;
    });
    totalAverage = payments > 0 ? monthly / payments : 0;
    return { daily, weekly, monthly, payments, totalAverage };
  }, [normalizedData]);

  const performanceSummary = useMemo(() => {
    let worked = 0, outbound = 0, inbound = 0, missed = 0, duration = 0;
    normalizedData.forEach((d: any) => {
      const pData = d._parsed.performance.monthly;
      worked += pData.worked;
      outbound += pData.outbound;
      inbound += pData.inbound;
      missed += pData.missed;
      duration += pData.duration;
    });
    return { worked, outbound, inbound, missed, duration };
  }, [normalizedData]);

  const postdatesSummary = useMemo(() => {
    let succeeded = 0, declined = 0, recovered = 0, processed = 0, remainingMonthly = 0, nextWeek = 0;
    normalizedData.forEach((d: any) => {
      const pData = d._parsed.postdates.monthly;
      const rData = d._parsed.postdates.remaining;
      succeeded += pData.succeeded;
      declined += pData.declined;
      recovered += pData.recovered;
      processed += pData.processed;
      remainingMonthly += rData.monthly;
      nextWeek += rData.nextWeek;
    });
    return { succeeded, declined, recovered, processed, remainingMonthly, nextWeek };
  }, [normalizedData]);

  const SummaryCard = ({ label, value, icon: Icon, colorClass }: any) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{value}</p>
      </div>
    </div>
  );

  const collectionChartData = useMemo(() => {
    return normalizedData.map((d: any) => {
      const periodData = d._parsed.collection[collectionTimeframe];
      return {
        name: d.collectorName.split(' ')[0], // Use first name for brevity on axis
        fullName: d.collectorName,
        collected: periodData.collected,
        target: periodData.target,
      };
    });
  }, [normalizedData, collectionTimeframe]);

  const performanceChartData = useMemo(() => {
    return normalizedData.map((d: any) => {
      const periodData = d._parsed.performance[performanceTimeframe];
      return {
        name: d.collectorName.split(' ')[0],
        fullName: d.collectorName,
        worked: periodData.worked,
        outbound: periodData.outbound,
        inbound: periodData.inbound,
        missed: periodData.missed,
        duration: periodData.duration / 60, // convert seconds to minutes for chart
      };
    });
  }, [normalizedData, performanceTimeframe]);

  const TimeframeToggle = ({ value, onChange }: { value: string, onChange: (v: any) => void }) => (
    <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
      {['daily', 'weekly', 'monthly'].map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${value === t ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
          {t}
        </button>
      ))}
    </div>
  );

  return (
    <div className="p-8 space-y-8 bg-[#f8fafc] dark:bg-slate-900 min-h-screen animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] dark:text-white uppercase tracking-wide">Key Performance Indicator</h1>
          <p className="text-slate-400 font-semibold text-[11px] tracking-widest mt-1">Operational Metrics Overview</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center h-11">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 h-full rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'collection' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <SummaryCard label="Daily Collected" value={formatCurrency(collectionSummary.daily)} icon={DollarSign} colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
          <SummaryCard label="Weekly Collected" value={formatCurrency(collectionSummary.weekly)} icon={DollarSign} colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
          <SummaryCard label="Monthly Collected" value={formatCurrency(collectionSummary.monthly)} icon={DollarSign} colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" />
          <SummaryCard label="Total Payments" value={formatNumber(collectionSummary.payments)} icon={Activity} colorClass="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
          <SummaryCard label="Average Payment" value={formatCurrency(collectionSummary.totalAverage)} icon={Target} colorClass="bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" />
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <SummaryCard label="Accounts Worked" value={formatNumber(performanceSummary.worked)} icon={Target} colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
          <SummaryCard label="Outbound Calls" value={formatNumber(performanceSummary.outbound)} icon={TrendingUp} colorClass="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
          <SummaryCard label="Inbound Calls" value={formatNumber(performanceSummary.inbound)} icon={TrendingDown} colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
          <SummaryCard label="Missed Calls" value={formatNumber(performanceSummary.missed)} icon={Activity} colorClass="bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" />
          <SummaryCard label="Call Duration" value={formatDuration(performanceSummary.duration)} icon={BarChart2} colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" />
        </div>
      )}

      {activeTab === 'postdates' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <SummaryCard label="Succeeded" value={formatCurrency(postdatesSummary.succeeded)} icon={DollarSign} colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
          <SummaryCard label="Declined" value={formatCurrency(postdatesSummary.declined)} icon={TrendingDown} colorClass="bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" />
          <SummaryCard label="Recovered" value={formatCurrency(postdatesSummary.recovered)} icon={TrendingUp} colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
          <SummaryCard label="Processed" value={formatCurrency(postdatesSummary.processed)} icon={Activity} colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" />
          <SummaryCard label="Monthly Remaining" value={formatCurrency(postdatesSummary.remainingMonthly)} icon={Calendar} colorClass="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
          <SummaryCard label="Next Week" value={formatCurrency(postdatesSummary.nextWeek)} icon={Calendar} colorClass="bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400" />
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto relative min-h-[400px]">
          {kpi.isLoading && kpi.data.length === 0 && <LoadingScreen message="Loading KPI data..." isAbsolute />}
          
          {kpi.error && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white dark:bg-slate-800">
              <div className="flex flex-col items-center gap-3 text-red-500">
                <p className="text-sm font-medium">{kpi.error}</p>
                <button onClick={() => fetchKpi(true)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-800 dark:text-white">
                  Retry
                </button>
              </div>
            </div>
          )}

          {activeTab === 'collection' && (
            <div className="min-w-max animate-in fade-in duration-300">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-50 dark:bg-slate-800/50 z-10 border-r border-slate-200 dark:border-slate-700">Collector</th>
                    <th colSpan={3} className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center border-r border-slate-200 dark:border-slate-700">Daily Collection</th>
                    <th colSpan={3} className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center border-r border-slate-200 dark:border-slate-700">Weekly Collection</th>
                    <th colSpan={3} className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center border-r border-slate-200 dark:border-slate-700">Monthly Collection</th>
                    <th colSpan={2} className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Payments</th>
                  </tr>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3 sticky left-0 bg-slate-50 dark:bg-slate-800/50 z-10 border-r border-slate-200 dark:border-slate-700 min-w-[150px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('collectorName')}>
                      Collector <SortIcon columnKey="collectorName" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 min-w-[90px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('collection.daily.collected')}>
                      Collected <SortIcon columnKey="collection.daily.collected" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 min-w-[90px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('collection.daily.target')}>
                      Target <SortIcon columnKey="collection.daily.target" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 min-w-[90px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('collection.daily.variance')}>
                      Variance <SortIcon columnKey="collection.daily.variance" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 min-w-[90px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('collection.weekly.collected')}>
                      Collected <SortIcon columnKey="collection.weekly.collected" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 min-w-[90px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('collection.weekly.target')}>
                      Target <SortIcon columnKey="collection.weekly.target" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 min-w-[90px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('collection.weekly.variance')}>
                      Variance <SortIcon columnKey="collection.weekly.variance" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 min-w-[90px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('collection.monthly.collected')}>
                      Collected <SortIcon columnKey="collection.monthly.collected" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 min-w-[90px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('collection.monthly.target')}>
                      Target <SortIcon columnKey="collection.monthly.target" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 min-w-[90px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('collection.monthly.variance')}>
                      Variance <SortIcon columnKey="collection.monthly.variance" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 w-24 min-w-[6rem] whitespace-normal leading-tight text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('collection.payments.count')}>
                      No. of Payments <SortIcon columnKey="collection.payments.count" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 w-24 min-w-[6rem] whitespace-normal leading-tight text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('collection.payments.average')}>
                      Average Payment <SortIcon columnKey="collection.payments.average" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {sortedData.map((data, index) => {
                    return (
                      <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="p-4 text-sm font-bold text-slate-800 dark:text-white sticky left-0 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 z-10 border-r border-slate-100 dark:border-slate-700 whitespace-nowrap">
                          {data.collectorName}
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatCurrency(data.collection.daily.collected)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatCurrency(data.collection.daily.target)}</td>
                        <td className={`p-4 text-sm font-medium border-r border-slate-100 dark:border-slate-700 ${getVarianceColor(data.collection.daily.variance)}`}>{formatPercentage(data.collection.daily.variance)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatCurrency(data.collection.weekly.collected)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatCurrency(data.collection.weekly.target)}</td>
                        <td className={`p-4 text-sm font-medium border-r border-slate-100 dark:border-slate-700 ${getVarianceColor(data.collection.weekly.variance)}`}>{formatPercentage(data.collection.weekly.variance)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatCurrency(data.collection.monthly.collected)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatCurrency(data.collection.monthly.target)}</td>
                        <td className={`p-4 text-sm font-medium border-r border-slate-100 dark:border-slate-700 ${getVarianceColor(data.collection.monthly.variance)}`}>{formatPercentage(data.collection.monthly.variance)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300 text-center">{formatNumber(data.collection.payments.count)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300 text-center">{formatCurrency(data.collection.payments.average)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === 'performance' && (
            <div className="min-w-max animate-in fade-in duration-300">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-50 dark:bg-slate-800/50 z-10 border-r border-slate-200 dark:border-slate-700">Collector</th>
                    <th colSpan={2} className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center border-r border-slate-200 dark:border-slate-700">Overview</th>
                    <th colSpan={5} className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center border-r border-slate-200 dark:border-slate-700">Daily Performance</th>
                    <th colSpan={5} className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center border-r border-slate-200 dark:border-slate-700">Weekly Performance</th>
                    <th colSpan={5} className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Monthly Performance</th>
                  </tr>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3 sticky left-0 bg-slate-50 dark:bg-slate-800/50 z-10 border-r border-slate-200 dark:border-slate-700 min-w-[150px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('collectorName')}>
                      Collector <SortIcon columnKey="collectorName" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('performance.overview.assigned')}>
                      Assigned Accounts <SortIcon columnKey="performance.overview.assigned" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('performance.overview.inactivated')}>
                      Inactivated <SortIcon columnKey="performance.overview.inactivated" />
                    </th>
                    
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('performance.daily.worked')}>
                      Accounts Worked <SortIcon columnKey="performance.daily.worked" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('performance.daily.outbound')}>
                      Outbound Call <SortIcon columnKey="performance.daily.outbound" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('performance.daily.inbound')}>
                      Inbound Call <SortIcon columnKey="performance.daily.inbound" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('performance.daily.missed')}>
                      Missed Call <SortIcon columnKey="performance.daily.missed" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('performance.daily.duration')}>
                      Call Duration <SortIcon columnKey="performance.daily.duration" />
                    </th>
                    
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('performance.weekly.worked')}>
                      Accounts Worked <SortIcon columnKey="performance.weekly.worked" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('performance.weekly.outbound')}>
                      Outbound Call <SortIcon columnKey="performance.weekly.outbound" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('performance.weekly.inbound')}>
                      Inbound Call <SortIcon columnKey="performance.weekly.inbound" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('performance.weekly.missed')}>
                      Missed Call <SortIcon columnKey="performance.weekly.missed" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('performance.weekly.duration')}>
                      Call Duration <SortIcon columnKey="performance.weekly.duration" />
                    </th>
                    
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('performance.monthly.worked')}>
                      Accounts Worked <SortIcon columnKey="performance.monthly.worked" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('performance.monthly.outbound')}>
                      Outbound Call <SortIcon columnKey="performance.monthly.outbound" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('performance.monthly.inbound')}>
                      Inbound Call <SortIcon columnKey="performance.monthly.inbound" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('performance.monthly.missed')}>
                      Missed Call <SortIcon columnKey="performance.monthly.missed" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('performance.monthly.duration')}>
                      Call Duration <SortIcon columnKey="performance.monthly.duration" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {sortedData.map((data, index) => {
                    return (
                      <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="p-4 text-sm font-bold text-slate-800 dark:text-white sticky left-0 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 z-10 border-r border-slate-100 dark:border-slate-700 whitespace-nowrap">
                          {data.collectorName}
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatNumber(data.performance.overview.assigned)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700">{formatNumber(data.performance.overview.inactivated)}</td>
                        
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatNumber(data.performance.daily.worked)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatNumber(data.performance.daily.outbound)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatNumber(data.performance.daily.inbound)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatNumber(data.performance.daily.missed)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700">{formatDuration(data.performance.daily.duration)}</td>
                        
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatNumber(data.performance.weekly.worked)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatNumber(data.performance.weekly.outbound)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatNumber(data.performance.weekly.inbound)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatNumber(data.performance.weekly.missed)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700">{formatDuration(data.performance.weekly.duration)}</td>
                        
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatNumber(data.performance.monthly.worked)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatNumber(data.performance.monthly.outbound)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatNumber(data.performance.monthly.inbound)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatNumber(data.performance.monthly.missed)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatDuration(data.performance.monthly.duration)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === 'postdates' && (
            <div className="min-w-max animate-in fade-in duration-300">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-50 dark:bg-slate-800/50 z-10 border-r border-slate-200 dark:border-slate-700">Collector</th>
                    <th colSpan={3} className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center border-r border-slate-200 dark:border-slate-700">Daily Postdates</th>
                    <th colSpan={4} className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center border-r border-slate-200 dark:border-slate-700">Weekly Postdates</th>
                    <th colSpan={4} className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center border-r border-slate-200 dark:border-slate-700">Monthly Postdates</th>
                    <th colSpan={2} className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Remaining Postdates</th>
                  </tr>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3 sticky left-0 bg-slate-50 dark:bg-slate-800/50 z-10 border-r border-slate-200 dark:border-slate-700 min-w-[150px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('collectorName')}>
                      Collector <SortIcon columnKey="collectorName" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 min-w-[80px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('postdates.daily.succeeded')}>
                      Succeeded <SortIcon columnKey="postdates.daily.succeeded" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 min-w-[80px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('postdates.daily.declined')}>
                      Declined <SortIcon columnKey="postdates.daily.declined" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 min-w-[90px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('postdates.daily.processed')}>
                      Total Processed <SortIcon columnKey="postdates.daily.processed" />
                    </th>
                    
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 min-w-[80px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('postdates.weekly.succeeded')}>
                      Succeeded <SortIcon columnKey="postdates.weekly.succeeded" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 min-w-[80px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('postdates.weekly.declined')}>
                      Declined <SortIcon columnKey="postdates.weekly.declined" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 min-w-[80px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('postdates.weekly.recovered')}>
                      Recovered <SortIcon columnKey="postdates.weekly.recovered" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 min-w-[90px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('postdates.weekly.processed')}>
                      Total Processed <SortIcon columnKey="postdates.weekly.processed" />
                    </th>
                    
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 min-w-[80px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('postdates.monthly.succeeded')}>
                      Succeeded <SortIcon columnKey="postdates.monthly.succeeded" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 min-w-[80px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('postdates.monthly.declined')}>
                      Declined <SortIcon columnKey="postdates.monthly.declined" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 min-w-[80px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('postdates.monthly.recovered')}>
                      Recovered <SortIcon columnKey="postdates.monthly.recovered" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 min-w-[90px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('postdates.monthly.processed')}>
                      Total Processed <SortIcon columnKey="postdates.monthly.processed" />
                    </th>
                    
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 min-w-[110px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('postdates.remaining.monthly')}>
                      Monthly Remaining <SortIcon columnKey="postdates.remaining.monthly" />
                    </th>
                    <th className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 min-w-[110px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('postdates.remaining.nextWeek')}>
                      Next Week Postdates <SortIcon columnKey="postdates.remaining.nextWeek" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {sortedData.map((data, index) => {
                    return (
                      <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="p-4 text-sm font-bold text-slate-800 dark:text-white sticky left-0 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 z-10 border-r border-slate-100 dark:border-slate-700 whitespace-nowrap">
                          {data.collectorName}
                        </td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatCurrency(data.postdates.daily.succeeded)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatCurrency(data.postdates.daily.declined)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700">{formatCurrency(data.postdates.daily.processed)}</td>
                        
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatCurrency(data.postdates.weekly.succeeded)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatCurrency(data.postdates.weekly.declined)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatCurrency(data.postdates.weekly.recovered)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700">{formatCurrency(data.postdates.weekly.processed)}</td>
                        
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatCurrency(data.postdates.monthly.succeeded)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatCurrency(data.postdates.monthly.declined)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatCurrency(data.postdates.monthly.recovered)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700">{formatCurrency(data.postdates.monthly.processed)}</td>
                        
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatCurrency(data.postdates.remaining.monthly)}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatCurrency(data.postdates.remaining.nextWeek)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === 'charts' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Collection Chart */}
              <div className="p-6 h-[500px] w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col">
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Collector Collection Comparison</h3>
                  <TimeframeToggle value={collectionTimeframe} onChange={setCollectionTimeframe} />
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={collectionChartData}
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
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                        formatter={(value: number, name: string) => [formatCurrency(value), name]}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="target" name="Target" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={40} />
                      <Bar dataKey="collected" name="Collected" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Performance Chart */}
              <div className="p-6 h-[500px] w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col">
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Collector Activity Metrics</h3>
                  <TimeframeToggle value={performanceTimeframe} onChange={setPerformanceTimeframe} />
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={performanceChartData}
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
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
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
      </div>
    </div>
  );
};

export default KPIDashboard;
