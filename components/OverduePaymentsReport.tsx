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
  RefreshCw
} from 'lucide-react';
import { useData } from '../DataContext';

interface OverduePayment {
  id: string;
  planPmtDateDue: string;
  accountNumber: string;
  collectorName: string;
  clientName: string;
  accountStatus: string;
  currentBalanceDue: number;
  paymentPlanOverdue: number;
}

const OverduePaymentsReport: React.FC<{ onBack: () => void; canExport: boolean }> = ({ onBack, canExport }) => {
  const { overduePayments: overdueState, fetchOverduePayments } = useData();
  const [filterText, setFilterText] = useState('');
  
  const [sortConfig, setSortConfig] = useState<{ key: keyof OverduePayment; direction: 'asc' | 'desc' }>({
    key: 'planPmtDateDue',
    direction: 'desc'
  });

  const payments = useMemo(() => {
    if (!overdueState.data) return [];
    const rawData = overdueState.data as any[];
    const mappedData: OverduePayment[] = rawData.map((item, index) => ({
      id: item.id || `ovd-${index}`,
      planPmtDateDue: String(item.planPmtDateDue || ''),
      accountNumber: String(item.accountNumber || ''),
      collectorName: String(item.collectorName || ''),
      clientName: String(item.clientName || ''),
      accountStatus: String(item.accountStatus || ''),
      currentBalanceDue: Number(item.currentBalanceDue || 0),
      paymentPlanOverdue: Number(item.paymentPlanOverdue || 0)
    }));

    return mappedData.filter(item => {
      const account = item.accountNumber.trim();
      const collector = item.collectorName.trim();
      return account !== '' || collector !== '' || item.currentBalanceDue > 0;
    });
  }, [overdueState.data]);

  useEffect(() => {
    fetchOverduePayments();
    const interval = setInterval(() => {
      fetchOverduePayments(true);
    }, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, [fetchOverduePayments]);

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    const dateStr = String(dateValue);
    // Handle yyyy-MM-dd format specifically to avoid timezone shifts
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
    return dateStr;
  };

  const filteredData = useMemo(() => {
    let result = payments.filter(item => 
      Object.values(item).some(val => 
        val.toString().toLowerCase().includes(filterText.toLowerCase())
      )
    );
    result.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [payments, filterText, sortConfig]);

  const requestSort = (key: keyof OverduePayment) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof OverduePayment }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={12} className="ml-1 opacity-20 inline" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="ml-1 inline text-indigo-600" /> : <ArrowDown size={12} className="ml-1 inline text-indigo-600" />;
  };

  const handleExport = () => {
    const headers = ["Plan Pmt. Date Due", "Account Number", "Collector Name", "Client Name", "Account Status", "Current Balance Due", "Payment Plan Overdue"];
    const rows = filteredData.map(r => [ 
      `"${formatDate(r.planPmtDateDue)}"`, 
      `"${r.accountNumber}"`, 
      `"${r.collectorName}"`, 
      `"${r.clientName}"`, 
      `"${r.accountStatus}"`, 
      r.currentBalanceDue.toFixed(2),
      r.paymentPlanOverdue.toFixed(2)
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Overdue_Payments_Report.csv`);
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
            <h1 className="text-2xl font-black text-text-main uppercase tracking-tight">Overdue Payments Report</h1>
            <p className="text-text-muted font-bold text-[11px] tracking-[0.2em] mt-1 uppercase">Overdue Payment Tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchOverduePayments(true)}
            disabled={overdueState.isLoading}
            className="p-2.5 rounded-xl bg-card border border-border-subtle text-text-muted hover:text-indigo-600 shadow-sm transition-all disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={overdueState.isLoading ? 'animate-spin' : ''} />
          </button>
          {canExport && (
            <button onClick={handleExport} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 shadow-lg active:scale-95 transition-all">
              <Download size={14} /> Export CSV
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 bg-card rounded-[2rem] border border-border-subtle shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-surface-100 text-text-muted"><FileDown size={18} /></div>
            <h2 className="text-sm font-black text-text-main uppercase tracking-widest">Overdue Records</h2>
          </div>
          <div className="relative group">
            <Search size={14} className="absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input type="text" placeholder="Search records..." value={filterText} onChange={(e) => setFilterText(e.target.value)} className="pl-9 pr-4 py-2 bg-surface-100 border border-border-subtle rounded-xl text-[11px] font-medium text-text-main w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
          </div>
        </div>
        <div className="flex-1 overflow-auto scrollbar-thin">
          {overdueState.isLoading && !overdueState.lastFetched ? (
            <div className="flex flex-col items-center justify-center h-full text-text-muted">
              <Loader2 size={40} className="animate-spin mb-4 text-indigo-600" />
              <p className="text-xs font-black uppercase tracking-widest">Loading Records...</p>
            </div>
          ) : overdueState.error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-500 p-8 text-center">
              <p className="font-bold mb-4">{overdueState.error}</p>
              <button onClick={() => fetchOverduePayments(true)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">Retry Connection</button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 z-20 bg-card">
                <tr className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-subtle bg-surface-100/50 backdrop-blur-sm">
                  <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('planPmtDateDue')}>Plan Pmt. Date Due <SortIcon columnKey="planPmtDateDue" /></th>
                  <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('accountNumber')}>Account Number <SortIcon columnKey="accountNumber" /></th>
                  <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('collectorName')}>Collector Name <SortIcon columnKey="collectorName" /></th>
                  <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('clientName')}>Client Name <SortIcon columnKey="clientName" /></th>
                  <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('accountStatus')}>Account Status <SortIcon columnKey="accountStatus" /></th>
                  <th className="px-6 py-5 text-right cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('currentBalanceDue')}>Current Balance Due <SortIcon columnKey="currentBalanceDue" /></th>
                  <th className="px-6 py-5 text-right cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('paymentPlanOverdue')}>Payment Plan Overdue <SortIcon columnKey="paymentPlanOverdue" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-[12px]">
                {filteredData.length > 0 ? filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-100 transition-colors group">
                    <td className="px-6 py-4 font-bold text-text-main">{formatDate(row.planPmtDateDue)}</td>
                    <td className="px-6 py-4 font-black text-indigo-600">{row.accountNumber}</td>
                    <td className="px-6 py-4 text-text-muted">{row.collectorName}</td>
                    <td className="px-6 py-4 font-bold text-text-main">{row.clientName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        row.accountStatus.toLowerCase().includes('active') ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-100 text-text-muted'
                      }`}>
                        {row.accountStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-text-main">${row.currentBalanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right font-black text-rose-600">${row.paymentPlanOverdue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="px-6 py-20 text-center opacity-30"><FileSearch size={48} className="mx-auto mb-4" /><p className="text-sm font-black uppercase tracking-widest">No overdue records found</p></td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverduePaymentsReport;
