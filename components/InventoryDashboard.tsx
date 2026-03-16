import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Download, 
  ChevronDown, 
  FileSpreadsheet,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  PlusSquare,
  LogOut,
  ShieldAlert,
  Layers,
  Loader2
} from 'lucide-react';
import { Collector } from '../types';
import { INVENTORY_SCRIPT_URL } from '../constants';

import { useData } from '../DataContext';

interface StatusBreakdown {
  status: string;
  count: number;
  balance: number;
}

interface CollectorInventory {
  id: string;
  name: string;
  totalCount: number;
  totalBalance: number;
  breakdown: StatusBreakdown[];
}

const processInventoryData = (data: any[]): CollectorInventory[] => {
  const collectorMap = new Map<string, CollectorInventory>();

  data.forEach(item => {
    // Skip header row if present
    if (item.internalCaseId === 'internal_case_id' || item.internalCaseId === 'Internal Case ID') return;

    // Skip completely empty rows (must have at least an ID, case number, or business name)
    if (!item.internalCaseId && !item.caseNumber && !item.businessName) return;

    const rawName = item.collectorName;
    const name = (rawName && String(rawName).trim() !== '') ? String(rawName).trim() : 'Unassigned';
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const balance = Number(item.balance) || 0;
    const status = item.accountStatus || 'Unknown';

    if (!collectorMap.has(id)) {
      collectorMap.set(id, {
        id,
        name,
        totalCount: 0,
        totalBalance: 0,
        breakdown: []
      });
    }

    const collector = collectorMap.get(id)!;
    collector.totalCount += 1;
    collector.totalBalance += balance;

    const existingStatus = collector.breakdown.find(b => b.status === status);
    if (existingStatus) {
      existingStatus.count += 1;
      existingStatus.balance += balance;
    } else {
      collector.breakdown.push({ status, count: 1, balance });
    }
  });

  // Sort breakdown by status alphabetically
  collectorMap.forEach(collector => {
    collector.breakdown.sort((a, b) => a.status.localeCompare(b.status));
  });

  return Array.from(collectorMap.values());
};

const InventoryDashboard: React.FC<{ 
  onCollectorBreakdownClick: (collector: Collector) => void;
  onMetricClick: (category: { id: string; title: string; sheetName: string }) => void;
}> = ({ onCollectorBreakdownClick, onMetricClick }) => {
  const { inventory, fetchInventory } = useData();
  const [filterText, setFilterText] = useState('');
  const [expandedCollectors, setExpandedCollectors] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'totalCount' | 'totalBalance'; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc'
  });

  useEffect(() => {
    fetchInventory();
    const interval = setInterval(() => {
      fetchInventory(true);
    }, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, [fetchInventory]);

  const inventoryData = useMemo(() => {
    if (!inventory.data || !Array.isArray(inventory.data)) return [];
    return processInventoryData(inventory.data);
  }, [inventory.data]);

  const metrics = useMemo(() => {
    if (!inventory.metrics) return {
      activeCount: 0, activeValue: 0,
      ppaCount: 0, ppaValue: 0,
      goingInCount: 0, goingInValue: 0,
      goingOutCount: 0, goingOutValue: 0
    };
    return {
      activeCount: Number(inventory.metrics.active?.count) || 0,
      activeValue: Number(inventory.metrics.active?.amount) || 0,
      ppaCount: Number(inventory.metrics.ppa?.count) || 0,
      ppaValue: Number(inventory.metrics.ppa?.amount) || 0,
      goingInCount: Number(inventory.metrics.goingIn?.count) || 0,
      goingInValue: Number(inventory.metrics.goingIn?.amount) || 0,
      goingOutCount: Number(inventory.metrics.goingOut?.count) || 0,
      goingOutValue: Number(inventory.metrics.goingOut?.amount) || 0,
    };
  }, [inventory.metrics]);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedCollectors);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedCollectors(next);
  };

  const filteredData = useMemo(() => {
    let result = inventoryData.filter(item => 
      item.name.toLowerCase().includes(filterText.toLowerCase())
    );
    result.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [inventoryData, filterText, sortConfig]);

  const requestSort = (key: 'name' | 'totalCount' | 'totalBalance') => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
  };

  const SortIcon = ({ col }: { col: 'name' | 'totalCount' | 'totalBalance' }) => {
    if (sortConfig.key !== col) return <ArrowUpDown size={12} className="ml-1 opacity-20 inline" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={12} className="ml-1 inline text-indigo-600" /> 
      : <ArrowDown size={12} className="ml-1 inline text-indigo-600" />;
  };

  const formatCurrency = (val: number) => 
    `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleExport = () => {
    const headers = ["Collector", "Total Accounts", "Total Inventory Balance", "Status Type", "Status Count", "Status Balance Due"];
    const rows: any[] = [];
    filteredData.forEach(row => {
      row.breakdown.forEach(item => {
        rows.push([ `"${row.name}"`, row.totalCount, row.totalBalance.toFixed(2), `"${item.status}"`, item.count, item.balance.toFixed(2) ]);
      });
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Account_Inventory_Report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-8 bg-app min-h-screen animate-in fade-in duration-500 font-sans pb-20 overflow-y-auto">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
          <div>
            <h1 className="text-2xl font-bold text-text-main uppercase tracking-wide">Account Inventory</h1>
            <p className="text-text-muted font-semibold text-[11px] tracking-widest mt-1 uppercase">Real-time Portfolio Distribution Breakdown</p>
          </div>
          <div className="flex gap-3 w-full xl:w-auto">
             <div className="relative flex-1 xl:w-80 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Search collector..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-card border border-border-subtle rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm dark:text-white"
                />
             </div>
             <button onClick={handleExport} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95">
                 <Download size={16} /> Export CSV
             </button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <DualMetricCard 
            label="Active Accounts" 
            value={formatCurrency(metrics.activeValue)} 
            count={metrics.activeCount} 
            sub="Total Portfolio" 
            color="indigo" 
            icon={Package} 
            onClick={() => onMetricClick({ id: 'active', title: 'Active Accounts', sheetName: 'Active' })}
          />
          <DualMetricCard 
            label="ACTIVE ACCOUNTS WITH PPA" 
            value={formatCurrency(metrics.ppaValue)} 
            count={metrics.ppaCount} 
            sub="Active PPA" 
            color="violet" 
            icon={Layers} 
            onClick={() => onMetricClick({ id: 'ppa', title: 'Active Accounts with PPA', sheetName: 'With PPA' })}
          />
          <DualMetricCard 
            label="Going In" 
            value={formatCurrency(metrics.goingInValue)} 
            count={metrics.goingInCount} 
            sub="New Placements" 
            color="emerald" 
            icon={PlusSquare} 
            onClick={() => onMetricClick({ id: 'going-in', title: 'Going In', sheetName: 'Going In' })}
          />
          <DualMetricCard 
            label="Going Out" 
            value={formatCurrency(metrics.goingOutValue)} 
            count={metrics.goingOutCount} 
            sub="Returns/Closures" 
            color="rose" 
            icon={LogOut} 
            onClick={() => onMetricClick({ id: 'going-out', title: 'Going Out', sheetName: 'Going Out' })}
          />
      </div>

      <div className="bg-card rounded-[2rem] border border-border-subtle shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border-subtle bg-surface-100 flex items-center gap-3">
             <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
               <FileSpreadsheet size={18} />
             </div>
             <h2 className="text-sm font-black text-text-main uppercase tracking-widest">Collector Portfolio Inventory</h2>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-subtle">
                    <th className="px-8 py-5 w-16"></th>
                    <th className="px-6 py-5 w-1/3 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => requestSort('name')}>
                       Collector Name <SortIcon col="name" />
                    </th>
                    <th className="px-6 py-5 w-1/3 text-center cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => requestSort('totalCount')}>
                       Number of Accounts <SortIcon col="totalCount" />
                    </th>
                    <th className="px-8 py-5 w-1/3 text-right cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => requestSort('totalBalance')}>
                       Total Value of Accounts <SortIcon col="totalBalance" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-[12px]">
                  {inventory.isLoading && !inventory.lastFetched ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
                        <p className="text-text-muted font-medium">Loading portfolio data...</p>
                      </td>
                    </tr>
                  ) : inventory.error ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ShieldAlert size={24} />
                        </div>
                        <p className="text-red-600 font-medium">{inventory.error}</p>
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-text-muted font-medium">
                        No collectors found matching your search.
                      </td>
                    </tr>
                  ) : filteredData.map((row) => {
                    const isExpanded = expandedCollectors.has(row.id);

                    return (
                      <React.Fragment key={row.id}>
                        <tr className={`group transition-colors ${isExpanded ? 'bg-indigo-50/10' : 'hover:bg-surface-100'}`}>
                          <td className="px-8 py-5">
                             <button onClick={() => toggleExpand(row.id)} className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-indigo-600 text-white rotate-180' : 'text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-800'}`}>
                               <ChevronDown size={16} />
                             </button>
                          </td>
                          <td className="px-6 py-5">
                             <button onClick={() => onCollectorBreakdownClick({ id: row.id, name: row.name, status: 'online', rank: 0 })} className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                  {row.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </div>
                                <span className="text-[13px] font-black text-text-main tracking-tight">{row.name}</span>
                             </button>
                          </td>
                          <td className="px-6 py-5 text-center">
                             <span className="font-black text-text-main text-[14px]">{row.totalCount}</span>
                          </td>
                          <td className="px-8 py-5 text-right">
                             <span className="font-black text-text-main text-[14px]">{formatCurrency(row.totalBalance)}</span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-surface-100 animate-in fade-in duration-300">
                             <td colSpan={4} className="px-8 py-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                   {row.breakdown.map((item, idx) => (
                                      <div key={idx} className="bg-card p-4 rounded-2xl border border-border-subtle shadow-sm flex flex-col gap-1">
                                         <p className="text-[9px] font-black text-text-muted uppercase tracking-widest truncate">{item.status}</p>
                                         <p className="text-sm font-black text-text-main">{formatCurrency(item.balance)}</p>
                                         <p className="text-[10px] font-bold text-indigo-500 uppercase">{item.count} Accounts</p>
                                      </div>
                                   ))}
                                </div>
                             </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
             </table>
          </div>
      </div>
    </div>
  );
};

const DualMetricCard = ({ label, value, count, sub, color, icon: Icon, onClick }: any) => {
    const c: any = {
      indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100',
      emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100',
      rose: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30 border-rose-100',
      violet: 'text-violet-600 bg-violet-50 dark:bg-violet-900/30 border-violet-100',
      amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 border-amber-100'
    };
    return (
        <div 
          onClick={onClick}
          className="bg-card p-6 rounded-[2rem] border border-border-subtle shadow-sm flex flex-col justify-between h-40 group hover:shadow-lg transition-all cursor-pointer hover:border-indigo-500/30"
        >
           <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1 group-hover:text-indigo-600 transition-colors">{label}</p>
                <h3 className="text-2xl font-black text-text-main tracking-tight font-inter">{value}</h3>
              </div>
              <div className={`p-2.5 rounded-xl ${c[color].split(' ')[0]} ${c[color].split(' ')[1]} group-hover:scale-110 transition-transform`}>
                 <Icon size={20} />
              </div>
           </div>
           <div className="flex items-center justify-between border-t border-border-subtle pt-3 mt-3">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-tight">{sub}</span>
              <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-lg border ${c[color]}`}>{count} Accounts</span>
           </div>
        </div>
    );
};

export default InventoryDashboard;