import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserMinus, 
  ArrowLeft, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download, 
  RefreshCw, 
  Loader2, 
  Calendar,
  User,
  Hash,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { TabType, UnactivatedAccount } from '../types';
import { UNACTIVATED_ACCOUNTS_SCRIPT_URL } from '../constants';

interface UnactivatedAccountsProps {
  onBack: (tab: TabType) => void;
}

type SortField = keyof UnactivatedAccount;
type SortOrder = 'asc' | 'desc';

const UnactivatedAccounts: React.FC<UnactivatedAccountsProps> = ({ onBack }) => {
  const [data, setData] = useState<UnactivatedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('lastWorkedDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchData = async (isManual = false) => {
    if (isManual) setIsSyncing(true);
    else setIsLoading(true);
    
    setError(null);
    try {
      const url = new URL(UNACTIVATED_ACCOUNTS_SCRIPT_URL);
      url.searchParams.set('t', Date.now().toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'follow'
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      if (result.status === 'success' && Array.isArray(result.records)) {
        setData(result.records);
      } else {
        throw new Error(result.message || 'The script returned an error or no records.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Connection to Google Sheets script failed. Please verify the deployment.');
      setData([]);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedData = useMemo(() => {
    return data
      .filter(item => 
        Object.values(item).some(val => 
          val.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
      .sort((a, b) => {
        const aVal = a[sortField].toString().toLowerCase();
        const bVal = b[sortField].toString().toLowerCase();
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [data, searchTerm, sortField, sortOrder]);

  const exportToCSV = () => {
    const headers = ['Last Worked Date', 'Case Number', 'Collector', 'Business Name', 'Creditor'];
    const rows = filteredAndSortedData.map(item => [
      item.lastWorkedDate,
      item.caseNumber,
      item.collectorUsername,
      item.businessName,
      item.creditorName
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `unactivated_accounts_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-app h-screen">
        <Loader2 size={48} className="text-indigo-500 animate-spin mb-4" />
        <p className="text-text-muted font-black text-xs uppercase tracking-widest">Loading Records...</p>
      </div>
    );
  }

  const Th = ({ field, label, icon: Icon }: { field: SortField, label: string, icon: any }) => (
      <th 
        className="pt-6 pb-4 px-4 font-black cursor-pointer group hover:text-indigo-500 transition-colors select-none"
        onClick={() => handleSort(field)}
      >
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-text-muted group-hover:text-indigo-400" />
        <span>{label}</span>
        <ArrowUpDown size={12} className={`ml-auto transition-opacity ${sortField === field ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`} />
      </div>
    </th>
  );

  return (
    <div className="p-8 bg-app h-screen flex flex-col animate-in fade-in duration-500 font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => onBack('home')}
            className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-border-subtle hover:bg-surface-100 transition-all text-text-muted hover:text-indigo-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-text-main tracking-tight uppercase flex items-center gap-3">
              Unactivated Accounts
              <span className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full text-[10px] tracking-widest border border-amber-100 dark:border-amber-800/50">
                {filteredAndSortedData.length} RECORDS
              </span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => exportToCSV()}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-border-subtle rounded-xl text-[11px] font-black uppercase tracking-widest text-text-muted hover:text-indigo-600 shadow-sm transition-all"
          >
            <Download size={14} /> Export CSV
          </button>
          <button 
            onClick={() => fetchData(true)}
            disabled={isSyncing}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Sync Data
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wide flex items-center gap-3 shadow-lg shadow-amber-500/5">
          <ShieldCheck size={16} /> {error}
        </div>
      )}

      {/* Filters Bar */}
      <div className="mb-6 flex gap-4 shrink-0">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="FILTER BY ACCOUNT, COLLECTOR, BUSINESS OR CREDITOR..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-border-subtle rounded-[1.25rem] pl-12 pr-6 py-4 text-xs font-black uppercase tracking-widest outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
          />
        </div>
        <button className="px-6 bg-white dark:bg-slate-800 border border-border-subtle rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest text-text-muted hover:text-indigo-600 flex items-center gap-2 shadow-sm transition-all">
          <Filter size={16} /> Advanced Filter
        </button>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 bg-card rounded-[2.5rem] border border-border-subtle shadow-sm flex flex-col overflow-hidden">
        <div className="overflow-auto scrollbar-thin scrollbar-thumb-border-subtle flex-1">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-card z-20">
              <tr className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-subtle bg-card/80 backdrop-blur-md">
                <Th field="lastWorkedDate" label="Last Worked" icon={Calendar} />
                <Th field="caseNumber" label="Case Number" icon={Hash} />
                <Th field="collectorUsername" label="Collector" icon={User} />
                <Th field="businessName" label="Business Name" icon={Building2} />
                <Th field="creditorName" label="Creditor Name" icon={ShieldCheck} />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredAndSortedData.map((item, idx) => (
                <tr key={idx} className="group hover:bg-surface-50 dark:hover:bg-slate-800/50 transition-all">
                  <td className="py-5 px-4 font-inter text-[13px] font-medium text-text-main">
                    <div className="flex flex-col">
                        <span className="font-bold text-text-main">{item.lastWorkedDate}</span>
                        <span className="text-[10px] text-text-muted uppercase font-black opacity-60">Archive Timestamp</span>
                    </div>
                  </td>
                  <td className="py-5 px-4">
                    <span className="px-3 py-1.5 bg-surface-100 rounded-lg text-[11px] font-black font-mono tracking-wider text-text-main border border-border-subtle/50 group-hover:border-indigo-200 transition-colors">
                        {item.caseNumber}
                    </span>
                  </td>
                  <td className="py-5 px-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-black text-[10px] uppercase">
                            {item.collectorUsername.charAt(0)}
                        </div>
                        <span className="text-[12px] font-bold text-text-main">{item.collectorUsername}</span>
                    </div>
                  </td>
                  <td className="py-5 px-4">
                    <div className="max-w-[200px]">
                        <p className="text-[13px] font-extrabold text-text-main truncate group-hover:text-clip group-hover:whitespace-normal leading-relaxed">{item.businessName}</p>
                    </div>
                  </td>
                  <td className="py-5 px-4">
                    <span className="text-[11px] font-black uppercase text-indigo-600/80 dark:text-indigo-400/80 tracking-widest">{item.creditorName}</span>
                  </td>
                </tr>
              ))}
              {filteredAndSortedData.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <UserMinus size={64} className="mb-4" />
                      <p className="text-sm font-black uppercase tracking-widest">No matching records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info */}
        <div className="p-4 bg-surface-50 dark:bg-slate-900/30 border-t border-border-subtle flex justify-between items-center shrink-0">
            <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">
                System Analytics • Unactivated Account Queue
            </p>
            <div className="flex items-center gap-4">
                <div className="h-1.5 w-24 bg-white dark:bg-slate-800 rounded-full border border-border-subtle relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-emerald-500 w-full animate-in slide-in-from-left duration-1000"></div>
                </div>
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Database Synced</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UnactivatedAccounts;
