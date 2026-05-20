import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Download, 
  FileDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSearch,
  Loader2,
  RefreshCw,
  ClipboardCheck
} from 'lucide-react';
import { useData } from '../DataContext';
import { BillingAudit } from '../types';
import LoadingScreen from './LoadingScreen';

const BillingAuditReport: React.FC<{ onBack: () => void; canExport: boolean }> = ({ onBack, canExport }) => {
  const { billingAudit: auditState, fetchBillingAudit } = useData();
  const [filterText, setFilterText] = useState('');
  
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  });
  const [selectedCollectorFilter, setSelectedCollectorFilter] = useState('All');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const [sortConfig, setSortConfig] = useState<{ key: keyof BillingAudit; direction: 'asc' | 'desc' }>({
    key: 'overdueDate',
    direction: 'desc'
  });

  useEffect(() => {
    fetchBillingAudit();
    const interval = setInterval(() => {
      fetchBillingAudit(true);
    }, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, [fetchBillingAudit]);

  const collectorOptions = useMemo(() => {
    const collectors = new Set<string>();
    (auditState.data as BillingAudit[] || []).forEach(item => {
      if (item.agentName && item.agentName !== 'Unknown' && item.agentName !== '') {
        collectors.add(item.agentName);
      }
    });
    return ['All', ...Array.from(collectors).sort()];
  }, [auditState.data]);

  const filteredData = useMemo(() => {
    let result = (auditState.data as BillingAudit[] || []);
    
    if (selectedCollectorFilter !== 'All') {
        result = result.filter(r => r.agentName === selectedCollectorFilter);
    }
    
    if (dateRange.start || dateRange.end) {
        result = result.filter(r => {
            if (!r.overdueDate) return false;
            try {
                const d = new Date(r.overdueDate).getTime();
                if (isNaN(d)) return false;
                const start = dateRange.start ? new Date(dateRange.start).getTime() : -Infinity;
                const end = dateRange.end ? new Date(dateRange.end).getTime() + 86400000 : Infinity;
                return d >= start && d <= end;
            } catch (e) {
                return false;
            }
        });
    }
    
    if (filterText) {
      result = result.filter(item => 
        Object.values(item).some(val => 
          val?.toString().toLowerCase().includes(filterText.toLowerCase())
        )
      );
    }
    
    result.sort((a, b) => {
      let aVal: any = a[sortConfig.key];
      let bVal: any = b[sortConfig.key];
      
      if (sortConfig.key === 'overdueDate') {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
          if (isNaN(aVal)) aVal = 0;
          if (isNaN(bVal)) bVal = 0;
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [auditState.data, filterText, sortConfig, dateRange, selectedCollectorFilter]);

  const billingStats = useMemo(() => {
    const stats = { noUpdate: 0, update: 0, delete: 0, followUp: 0 };
    (auditState.data as BillingAudit[] || []).forEach(a => {
      const action = String(a.ppaAction || '').trim();
      if (action === 'No Update Needed') stats.noUpdate++;
      else if (action === 'Update PPA') stats.update++;
      else if (action === 'Delete PPA') stats.delete++;
      else if (action === 'Follow-Up PPA') stats.followUp++;
    });
    return stats;
  }, [auditState.data]);

  const alertCount = useMemo(() => {
    return (auditState.data as BillingAudit[] || []).filter(a => 
      ['Update PPA', 'Delete PPA', 'Follow-Up PPA'].includes(String(a.ppaAction || '').trim())
    ).length;
  }, [auditState.data]);

  const requestSort = (key: keyof BillingAudit) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof BillingAudit }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={12} className="ml-1 opacity-20 inline" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="ml-1 inline text-indigo-600" /> : <ArrowDown size={12} className="ml-1 inline text-indigo-600" />;
  };

  const handleExport = () => {
    const headers = ["Account #", "Agent Name", "Client Name", "Account Status", "Agreement Amount", "Overdue Amount", "Overdue Date", "PPA Action", "Audit Comments", "Account URL"];
    const rows = filteredData.map(r => [ 
      `"${r.accountNumber}"`, 
      `"${r.agentName}"`, 
      `"${r.clientName}"`, 
      `"${r.status}"`, 
      r.agreementAmount.toFixed(2),
      r.overdueAmount.toFixed(2),
      `"${r.overdueDate}"`,
      `"${r.ppaAction}"`,
      `"${r.comments}"`,
      `"${r.accountUrl || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Billing_Audit_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-8 bg-app h-screen max-h-screen flex flex-col animate-in fade-in duration-500 font-sans overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 rounded-2xl bg-card border border-border-subtle text-text-muted hover:text-indigo-600 shadow-sm transition-all group">
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-text-main uppercase tracking-tight">Billing Audit Report</h1>
            <p className="text-text-muted font-bold text-[11px] tracking-[0.2em] mt-1 uppercase">Account Billing Verification</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`bg-card px-6 py-2 rounded-xl border flex flex-col items-end justify-center shadow-sm transition-colors duration-300 ${alertCount > 0 ? 'border-rose-100' : 'border-emerald-100'}`}>
            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Alert Count</span>
            <span className={`text-xl font-black leading-tight ${alertCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{alertCount}</span>
          </div>
          <button 
            onClick={() => fetchBillingAudit(true)}
            disabled={auditState.isLoading}
            className="p-2.5 rounded-xl bg-card border border-border-subtle text-text-muted hover:text-indigo-600 shadow-sm transition-all disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={auditState.isLoading ? 'animate-spin' : ''} />
          </button>
          {canExport && (
            <button onClick={handleExport} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 shadow-lg active:scale-95 transition-all">
              <Download size={14} /> Export CSV
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="bg-card p-6 rounded-[2rem] border border-border-subtle shadow-sm flex flex-col items-center justify-center text-center group transition-all hover:shadow-md">
          <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">No Update Needed</span>
          <span className="text-3xl font-black text-emerald-600">{billingStats.noUpdate}</span>
        </div>
        <div className="bg-card p-6 rounded-[2rem] border border-border-subtle shadow-sm flex flex-col items-center justify-center text-center group transition-all hover:shadow-md">
          <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">Update PPA</span>
          <span className="text-3xl font-black text-amber-500">{billingStats.update}</span>
        </div>
        <div className="bg-card p-6 rounded-[2rem] border border-border-subtle shadow-sm flex flex-col items-center justify-center text-center group transition-all hover:shadow-md">
          <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">Delete PPA</span>
          <span className="text-3xl font-black text-rose-600">{billingStats.delete}</span>
        </div>
        <div className="bg-card p-6 rounded-[2rem] border border-border-subtle shadow-sm flex flex-col items-center justify-center text-center group transition-all hover:shadow-md">
          <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">Follow-Up PPA</span>
          <span className="text-3xl font-black text-fuchsia-600">{billingStats.followUp}</span>
        </div>
      </div>

      <div className="flex-1 bg-card rounded-[2rem] border border-border-subtle shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-surface-100 text-text-muted"><ClipboardCheck size={18} /></div>
            <h2 className="text-sm font-black text-text-main uppercase tracking-widest">Audit Records</h2>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <button 
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 bg-surface-100 border border-border-subtle rounded-xl shadow-sm transition-all text-[11px] font-bold ${isCalendarOpen || (dateRange.start || dateRange.end) ? 'text-indigo-600 border-indigo-200 bg-indigo-50/50' : 'text-text-muted hover:text-indigo-600'}`}
              >
                <ClipboardCheck size={14} />
                {dateRange.start && dateRange.end ? `${dateRange.start} to ${dateRange.end}` : "Select Dates"}
              </button>
              {isCalendarOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border-subtle rounded-2xl shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 origin-top-right">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Filter By Date</p>
                    <button onClick={() => setDateRange({ start: '', end: '' })} className="text-[9px] font-black text-indigo-600 hover:text-rose-500 uppercase tracking-widest transition-colors">Reset</button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[9px] font-black text-text-muted uppercase mb-1 ml-1 text-left">From</p>
                        <input 
                            type="date" 
                            value={dateRange.start} 
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full bg-surface-100 border border-border-subtle rounded-xl text-[10px] font-bold text-text-main focus:ring-2 focus:ring-indigo-500/20 p-2"
                        />
                      </div>
                      <div>
                         <p className="text-[9px] font-black text-text-muted uppercase mb-1 ml-1 text-left">To</p>
                         <input 
                            type="date" 
                            value={dateRange.end} 
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full bg-surface-100 border border-border-subtle rounded-xl text-[10px] font-bold text-text-main focus:ring-2 focus:ring-indigo-500/20 p-2"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsCalendarOpen(false)}
                      className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-indigo-700 transition-colors"
                    >
                      Apply Filter
                    </button>
                  </div>
                </div>
              )}
            </div>
            <select
                value={selectedCollectorFilter}
                onChange={(e) => setSelectedCollectorFilter(e.target.value)}
                className="px-4 py-2 bg-surface-100 border border-border-subtle rounded-xl text-[11px] font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
            >
                {collectorOptions.map(opt => (
                    <option key={opt} value={opt}>{opt === 'All' ? 'All Collectors' : opt}</option>
                ))}
            </select>
            <div className="relative group">
              <Search size={14} className="absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type="text" placeholder="Search records..." value={filterText} onChange={(e) => setFilterText(e.target.value)} className="pl-9 pr-4 py-2 bg-surface-100 border border-border-subtle rounded-xl text-[11px] font-medium text-text-main w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto scrollbar-thin relative">
          {auditState.isLoading && !auditState.lastFetched && (
            <LoadingScreen message="Loading Billing Records..." isAbsolute />
          )}
          
          {auditState.error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-500 p-8 text-center">
              <p className="font-bold mb-4">{auditState.error}</p>
              <button onClick={() => fetchBillingAudit(true)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">Retry Connection</button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 z-20 bg-card">
                <tr className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-subtle bg-surface-100/50 backdrop-blur-sm">
                  <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('accountNumber')}>Account # <SortIcon columnKey="accountNumber" /></th>
                  <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('agentName')}>Agent Name <SortIcon columnKey="agentName" /></th>
                  <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('clientName')}>Client Name <SortIcon columnKey="clientName" /></th>
                  <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('status')}>Status <SortIcon columnKey="status" /></th>
                  <th className="px-6 py-5 text-right cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('agreementAmount')}>Agreement <SortIcon columnKey="agreementAmount" /></th>
                  <th className="px-6 py-5 text-right cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('overdueAmount')}>Overdue <SortIcon columnKey="overdueAmount" /></th>
                  <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('overdueDate')}>Overdue Date <SortIcon columnKey="overdueDate" /></th>
                  <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('ppaAction')}>PPA Action <SortIcon columnKey="ppaAction" /></th>
                  <th className="px-6 py-5">Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-[12px]">
                {filteredData.length > 0 ? filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-100 transition-colors group">
                    <td className="px-6 py-4 font-black text-indigo-600">
                      {row.accountUrl ? (
                        <a href={row.accountUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {row.accountNumber}
                        </a>
                      ) : (
                        row.accountNumber
                      )}
                    </td>
                    <td className="px-6 py-4 text-text-muted">{row.agentName}</td>
                    <td className="px-6 py-4 font-bold text-text-main">{row.clientName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        row.status.toLowerCase().includes('active') ? 'bg-emerald-100 text-emerald-700' : 
                        row.status.toLowerCase().includes('closed') ? 'bg-rose-100 text-rose-700' :
                        'bg-surface-100 text-text-muted'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-text-main">${row.agreementAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right font-black text-rose-600">${row.overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 font-bold text-text-main">{row.overdueDate}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        row.ppaAction === 'No Update Needed' ? 'bg-emerald-50 text-emerald-600' :
                        row.ppaAction === 'Update PPA' ? 'bg-amber-50 text-amber-500' :
                        row.ppaAction === 'Delete PPA' ? 'bg-rose-50 text-rose-600' :
                        row.ppaAction === 'Follow-Up PPA' ? 'bg-fuchsia-50 text-fuchsia-600' :
                        'bg-indigo-50 text-indigo-600'
                      }`}>
                        {row.ppaAction}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-muted max-w-xs truncate" title={row.comments}>{row.comments}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={9} className="px-6 py-20 text-center opacity-30"><FileSearch size={48} className="mx-auto mb-4" /><p className="text-sm font-black uppercase tracking-widest">No audit records found</p></td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingAuditReport;
