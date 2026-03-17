import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Download, 
  FileDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CalendarDays,
  FileSearch,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useData } from '../DataContext';

interface NewImport {
  id: string;
  dateImported: string;
  clientClaimNumber: string;
  accountNumber: string;
  businessName: string;
  clientName: string;
  balance: number;
  accountUrl?: string;
}

const NewImportsReport: React.FC<{ onBack: () => void; canExport: boolean }> = ({ onBack, canExport }) => {
  const { imports: importsState, fetchImports } = useData();
  const [filterText, setFilterText] = useState('');
  
  const [sortConfig, setSortConfig] = useState<{ key: keyof NewImport; direction: 'asc' | 'desc' }>({
    key: 'dateImported',
    direction: 'desc'
  });

  const imports = useMemo(() => {
    if (!importsState.data) return [];
    const rawData = importsState.data as any[];
    const mappedData: NewImport[] = rawData.map((item, index) => ({
      id: item.id != null ? String(item.id) : index.toString(),
      dateImported: item.dateImported != null ? String(item.dateImported) : '',
      clientClaimNumber: item.clientClaimNumber != null ? String(item.clientClaimNumber) : '',
      accountNumber: item.accountNumber != null ? String(item.accountNumber) : '',
      businessName: item.businessName != null ? String(item.businessName) : '',
      clientName: item.clientName != null ? String(item.clientName) : '',
      balance: item.balance != null ? Number(item.balance) : 0,
      accountUrl: item.accountUrl
    }));

    return mappedData.filter(item => {
      const claim = item.clientClaimNumber.trim();
      const account = item.accountNumber.trim();
      return claim !== '' || account !== '' || item.balance > 0;
    });
  }, [importsState.data]);

  useEffect(() => {
    fetchImports();
  }, [fetchImports]);

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
    let result = imports.filter(item => 
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
  }, [imports, filterText, sortConfig]);

  const requestSort = (key: keyof NewImport) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof NewImport }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={12} className="ml-1 opacity-20 inline" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="ml-1 inline text-indigo-600" /> : <ArrowDown size={12} className="ml-1 inline text-indigo-600" />;
  };

  const handleExport = () => {
    const headers = ["Date Imported", "Client Claim Number", "Account Number", "Business Name", "Client Name", "Balance", "Account URL"];
    const rows = filteredData.map(r => [ 
      `"${formatDate(r.dateImported)}"`, 
      `"${r.clientClaimNumber}"`, 
      `"${r.accountNumber}"`, 
      `"${r.businessName}"`, 
      `"${r.clientName}"`, 
      r.balance.toFixed(2),
      `"${r.accountUrl || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `New_Imports_Report.csv`);
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
            <h1 className="text-2xl font-black text-text-main uppercase tracking-tight">New Imports Report</h1>
            <p className="text-text-muted font-bold text-[11px] tracking-[0.2em] mt-1 uppercase">Designated Import Tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchImports(true)}
            disabled={importsState.isLoading}
            className="p-2.5 rounded-xl bg-card border border-border-subtle text-text-muted hover:text-indigo-600 shadow-sm transition-all disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={importsState.isLoading ? 'animate-spin' : ''} />
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
            <h2 className="text-sm font-black text-text-main uppercase tracking-widest">Import Records</h2>
          </div>
          <div className="relative group">
            <Search size={14} className="absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input type="text" placeholder="Search records..." value={filterText} onChange={(e) => setFilterText(e.target.value)} className="pl-9 pr-4 py-2 bg-surface-100 border border-border-subtle rounded-xl text-[11px] font-medium text-text-main w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
          </div>
        </div>
        <div className="flex-1 overflow-auto scrollbar-thin">
          {importsState.isLoading && !importsState.lastFetched ? (
            <div className="flex flex-col items-center justify-center h-full text-text-muted">
              <Loader2 size={40} className="animate-spin mb-4 text-indigo-600" />
              <p className="text-xs font-black uppercase tracking-widest">Loading Records...</p>
            </div>
          ) : importsState.error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-500 p-8 text-center">
              <p className="font-bold mb-4">{importsState.error}</p>
              <button onClick={() => fetchImports(true)} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">Retry Connection</button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 z-20 bg-card">
                <tr className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-subtle bg-surface-100/50 backdrop-blur-sm">
                  <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('dateImported')}>Date Imported <SortIcon columnKey="dateImported" /></th>
                  <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('clientClaimNumber')}>Client Claim # <SortIcon columnKey="clientClaimNumber" /></th>
                  <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('accountNumber')}>Account # <SortIcon columnKey="accountNumber" /></th>
                  <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('businessName')}>Business Name <SortIcon columnKey="businessName" /></th>
                  <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('clientName')}>Client Name <SortIcon columnKey="clientName" /></th>
                  <th className="px-6 py-5 text-right cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('balance')}>Balance <SortIcon columnKey="balance" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-[12px]">
                {filteredData.length > 0 ? filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-100 transition-colors group">
                    <td className="px-6 py-4 font-bold text-text-main">{formatDate(row.dateImported)}</td>
                    <td className="px-6 py-4 text-text-muted">{row.clientClaimNumber}</td>
                    <td className="px-6 py-4 font-black text-indigo-600">
                      {row.accountUrl ? (
                        <a href={row.accountUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {row.accountNumber}
                        </a>
                      ) : (
                        row.accountNumber
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-text-main">{row.businessName}</td>
                    <td className="px-6 py-4 text-text-muted">{row.clientName}</td>
                    <td className="px-6 py-4 text-right font-black text-text-main">${row.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="px-6 py-20 text-center opacity-30"><FileSearch size={48} className="mx-auto mb-4" /><p className="text-sm font-black uppercase tracking-widest">No import records found</p></td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewImportsReport;
