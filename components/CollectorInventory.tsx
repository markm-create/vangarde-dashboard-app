import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Download, 
  FileSpreadsheet,
  Loader2,
  ArrowLeft,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ListFilter,
  RefreshCw
} from 'lucide-react';
import { AppUser } from '../types';
import { useData } from '../DataContext';

const CollectorInventory: React.FC<{ 
  currentUser: AppUser;
  onBack: () => void;
}> = ({ currentUser, onBack }) => {
  const { collectorInventory, fetchCollectorInventory } = useData();
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isSyncing, setIsSyncing] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'accountAge',
    direction: 'asc'
  });

  useEffect(() => {
    // Only fetch on mount if we don't have data yet
    if (!collectorInventory.lastFetched) {
      fetchCollectorInventory(currentUser.name);
    }
    
    // Background sync every 2 minutes instead of 1, and don't force if not needed
    const interval = setInterval(() => {
      fetchCollectorInventory(currentUser.name);
    }, 120000);
    
    return () => clearInterval(interval);
  }, [fetchCollectorInventory, currentUser.name, collectorInventory.lastFetched]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await fetchCollectorInventory(currentUser.name, true);
    } finally {
      setIsSyncing(false);
    }
  };

  const myInventoryRaw = useMemo(() => {
    if (!collectorInventory.data || !Array.isArray(collectorInventory.data)) return [];

    return collectorInventory.data.filter(item => {
      const collectorName = String(item.collectorName || '').trim().toLowerCase();
      return collectorName === currentUser.name.trim().toLowerCase();
    });
  }, [collectorInventory.data, currentUser.name]);

  const statuses = useMemo(() => {
    const set = new Set<string>(['All']);
    myInventoryRaw.forEach(item => {
      if (item.claimStatus) set.add(item.claimStatus);
    });
    return Array.from(set);
  }, [myInventoryRaw]);

  const filteredAndSortedData = useMemo(() => {
    let data = [...myInventoryRaw];

    // Filter by text
    if (filterText) {
      data = data.filter(item => 
        String(item.caseNumber).toLowerCase().includes(filterText.toLowerCase()) ||
        String(item.businessName).toLowerCase().includes(filterText.toLowerCase()) ||
        String(item.claimStatus).toLowerCase().includes(filterText.toLowerCase()) ||
        String(item.clientName || '').toLowerCase().includes(filterText.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'All') {
      data = data.filter(item => item.claimStatus === statusFilter);
    }

    // Sort
    data.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle numeric fields
      if (sortConfig.key === 'balance' || sortConfig.key === 'accountAge') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [myInventoryRaw, filterText, statusFilter, sortConfig]);

  const formatCurrency = (val: number) => 
    `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleExport = () => {
    const headers = ["Case Number", "Business Name", "Status", "Client Name", "Balance Due", "Age", "Last Worked"];
    const rows = filteredAndSortedData.map(item => [
      `"${item.caseNumber}"`,
      `"${item.businessName}"`,
      `"${item.claimStatus}"`,
      `"${item.clientName || 'N/A'}"`,
      item.balance,
      item.accountAge,
      item.lastWorkedDate ? new Date(item.lastWorkedDate).toLocaleDateString() : 'N/A'
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentUser.name.replace(/\s+/g, '_')}_Inventory_Report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const requestSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortConfig.key !== col) return <ArrowUpDown size={12} className="ml-1 opacity-20 inline" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={12} className="ml-1 inline text-indigo-600" /> 
      : <ArrowDown size={12} className="ml-1 inline text-indigo-600" />;
  };

  return (
    <div className="p-8 space-y-8 bg-app min-h-screen animate-in fade-in duration-500 font-sans pb-20 overflow-y-auto">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-card border border-border-subtle text-text-muted hover:text-indigo-600 shadow-sm transition-all group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-0.5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-text-main uppercase tracking-wide">My Account Inventory</h1>
              <p className="text-text-muted font-semibold text-[11px] tracking-widest mt-1 uppercase">Personal Portfolio Distribution</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 w-full xl:w-auto">
             <div className="relative flex-1 xl:w-80 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Search accounts..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-card border border-border-subtle rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm dark:text-white"
                />
             </div>
             
             <div className="flex items-center gap-2 bg-card border border-border-subtle rounded-2xl px-3 py-1.5 shadow-sm">
                <Filter size={16} className="text-text-muted" />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold uppercase tracking-widest focus:outline-none cursor-pointer text-text-main dark:bg-slate-800"
                >
                  {statuses.map(s => <option key={s} value={s} className="dark:bg-slate-800">{s}</option>)}
                </select>
             </div>

             <div className="flex items-center gap-2 bg-card border border-border-subtle rounded-2xl px-3 py-1.5 shadow-sm">
                <ListFilter size={16} className="text-text-muted" />
                <select 
                  value={sortConfig.key}
                  onChange={(e) => requestSort(e.target.value)}
                  className="bg-transparent text-xs font-bold uppercase tracking-widest focus:outline-none cursor-pointer text-text-main dark:bg-slate-800"
                >
                  <option value="accountAge" className="dark:bg-slate-800">Sort by Age</option>
                  <option value="balance" className="dark:bg-slate-800">Sort by Balance</option>
                  <option value="businessName" className="dark:bg-slate-800">Sort by Name</option>
                  <option value="claimStatus" className="dark:bg-slate-800">Sort by Status</option>
                  <option value="clientName" className="dark:bg-slate-800">Sort by Client</option>
                </select>
             </div>

             <div className="flex gap-2">
                <button 
                  onClick={handleManualSync}
                  disabled={isSyncing || (collectorInventory.isLoading && !collectorInventory.lastFetched)}
                  className="flex items-center justify-center p-2.5 bg-card border border-border-subtle text-text-muted rounded-2xl hover:text-indigo-600 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                  title="Sync Data"
                >
                  <RefreshCw size={18} className={`${isSyncing || (collectorInventory.isLoading && !collectorInventory.lastFetched) ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={handleExport} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95">
                    <Download size={16} /> Export CSV
                </button>
             </div>
          </div>
      </div>

      <div className="bg-card rounded-[2rem] border border-border-subtle shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border-subtle bg-surface-100 flex items-center gap-3">
             <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
               <FileSpreadsheet size={18} />
             </div>
             <h2 className="text-sm font-black text-text-main uppercase tracking-widest">Account Breakdown</h2>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-subtle">
                    <th className="px-8 py-5 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => requestSort('caseNumber')}>
                      Case Number <SortIcon col="caseNumber" />
                    </th>
                    <th className="px-6 py-5 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => requestSort('businessName')}>
                      Business Name <SortIcon col="businessName" />
                    </th>
                    <th className="px-6 py-5 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => requestSort('claimStatus')}>
                      Status <SortIcon col="claimStatus" />
                    </th>
                    <th className="px-6 py-5 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => requestSort('clientName')}>
                      Client Name <SortIcon col="clientName" />
                    </th>
                    <th className="px-6 py-5 text-right cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => requestSort('balance')}>
                      Balance <SortIcon col="balance" />
                    </th>
                    <th className="px-6 py-5 text-center cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => requestSort('accountAge')}>
                      Age <SortIcon col="accountAge" />
                    </th>
                    <th className="px-8 py-5 text-right cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => requestSort('lastWorkedDate')}>
                      Last Worked <SortIcon col="lastWorkedDate" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-[12px]">
                  {collectorInventory.isLoading && !collectorInventory.lastFetched ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
                        <p className="text-text-muted font-medium">Loading inventory...</p>
                      </td>
                    </tr>
                  ) : filteredAndSortedData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-text-muted font-medium">
                        No inventory data found.
                      </td>
                    </tr>
                  ) : filteredAndSortedData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-surface-100 transition-colors">
                      <td className="px-8 py-5">
                        {item.caseLink ? (
                          <a 
                            href={item.caseLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline font-black text-[13px]"
                          >
                            {item.caseNumber}
                          </a>
                        ) : (
                          <span className="text-[13px] font-black text-text-main tracking-tight">{item.caseNumber}</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-bold text-text-main">{item.businessName}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          item.claimStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                          item.claimStatus === 'Closed' ? 'bg-slate-100 text-slate-600' :
                          'bg-indigo-100 text-indigo-700'
                        }`}>
                          {item.claimStatus}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-bold text-text-main">{item.clientName || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-5 text-right font-black text-text-main">
                        {formatCurrency(Number(item.balance) || 0)}
                      </td>
                      <td className="px-6 py-5 text-center font-medium text-text-muted">
                        {item.accountAge}
                      </td>
                      <td className="px-8 py-5 text-right font-medium text-text-muted">
                        {item.lastWorkedDate ? new Date(item.lastWorkedDate).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
      </div>
    </div>
  );
};

export default CollectorInventory;
