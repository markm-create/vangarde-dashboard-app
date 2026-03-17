import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Download, 
  FileDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSearch,
  Users
} from 'lucide-react';
import { useData } from '../DataContext';
import { AppUser } from '../types';

interface AssignedAccount {
  id: string;
  dateAssigned: string;
  accountNumber: string;
  assignedTo: string;
  businessName: string;
  clientName: string;
  balance: number;
  accountUrl?: string;
}

const NewAssignedAccounts: React.FC<{ onBack: () => void; currentUser: AppUser }> = ({ onBack, currentUser }) => {
  const { newAssignedAccounts, fetchNewAssignedAccounts } = useData();
  const [filterText, setFilterText] = useState('');
  
  const [sortConfig, setSortConfig] = useState<{ key: keyof AssignedAccount; direction: 'asc' | 'desc' }>({
    key: 'dateAssigned',
    direction: 'desc'
  });

  React.useEffect(() => {
    fetchNewAssignedAccounts();
  }, [fetchNewAssignedAccounts]);

  const accounts = useMemo(() => {
    if (!newAssignedAccounts.data) return [];
    
    // Filter by current collector
    return newAssignedAccounts.data
      .filter(item => String(item.assignedTo || '').toLowerCase() === currentUser.name.toLowerCase())
      .map((item: any) => ({
        id: item.id,
        dateAssigned: item.dateAssigned,
        accountNumber: item.accountNumber,
        assignedTo: item.assignedTo,
        businessName: item.businessName,
        clientName: item.clientName,
        balance: item.balance,
        accountUrl: item.accountUrl
      }));
  }, [newAssignedAccounts.data, currentUser.name]);

  const filteredData = useMemo(() => {
    let result = accounts.filter(item => 
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
  }, [accounts, filterText, sortConfig]);

  const requestSort = (key: keyof AssignedAccount) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof AssignedAccount }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={12} className="ml-1 opacity-20 inline" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="ml-1 inline text-blue-600" /> : <ArrowDown size={12} className="ml-1 inline text-blue-600" />;
  };

  const handleExport = () => {
    const headers = ["Date Assigned", "Account Number", "Assigned To", "Business Name", "Client Name", "Balance", "Account URL"];
    const rows = filteredData.map(r => [ 
      `"${r.dateAssigned}"`, 
      `"${r.accountNumber}"`, 
      `"${r.assignedTo}"`, 
      `"${r.businessName}"`, 
      `"${r.clientName}"`, 
      r.balance.toFixed(2),
      `"${r.accountUrl || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `New_Assigned_Accounts_${currentUser.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-8 bg-app h-screen max-h-screen flex flex-col animate-in fade-in duration-500 font-sans overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 rounded-2xl bg-card border border-border-subtle text-text-muted hover:text-blue-600 shadow-sm transition-all group">
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-text-main uppercase tracking-tight">New Assigned Accounts</h1>
            <p className="text-text-muted font-bold text-[11px] tracking-[0.2em] mt-1 uppercase">Collector Assignment Tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 shadow-lg active:scale-95 transition-all">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card rounded-[2rem] border border-border-subtle shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30"><Users size={18} /></div>
            <h2 className="text-sm font-black text-text-main uppercase tracking-widest">Assigned Records</h2>
          </div>
          <div className="relative group">
            <Search size={14} className="absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input type="text" placeholder="Search records..." value={filterText} onChange={(e) => setFilterText(e.target.value)} className="pl-9 pr-4 py-2 bg-surface-100 border border-border-subtle rounded-xl text-[11px] font-medium text-text-main w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>
        </div>
        <div className="flex-1 overflow-auto scrollbar-thin">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 z-20 bg-card">
              <tr className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-subtle bg-surface-100/50 backdrop-blur-sm">
                <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('dateAssigned')}>Date Assigned <SortIcon columnKey="dateAssigned" /></th>
                <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('accountNumber')}>Account # <SortIcon columnKey="accountNumber" /></th>
                <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('assignedTo')}>Assigned To <SortIcon columnKey="assignedTo" /></th>
                <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('businessName')}>Business Name <SortIcon columnKey="businessName" /></th>
                <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('clientName')}>Client Name <SortIcon columnKey="clientName" /></th>
                <th className="px-6 py-5 text-right cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('balance')}>Balance <SortIcon columnKey="balance" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-[12px]">
              {newAssignedAccounts.isLoading ? (
                <tr><td colSpan={6} className="px-6 py-20 text-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div><p className="text-sm font-black uppercase tracking-widest">Loading records...</p></td></tr>
              ) : filteredData.length > 0 ? filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-surface-100 transition-colors group">
                  <td className="px-6 py-4 font-bold text-text-main">{new Date(row.dateAssigned).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-black text-blue-600">
                    {row.accountUrl ? (
                      <a href={row.accountUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {row.accountNumber}
                      </a>
                    ) : (
                      row.accountNumber
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-text-main">{row.assignedTo}</td>
                  <td className="px-6 py-4 font-bold text-text-main">{row.businessName}</td>
                  <td className="px-6 py-4 font-bold text-text-main">{row.clientName}</td>
                  <td className="px-6 py-4 text-right font-black text-text-main">${row.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-6 py-20 text-center opacity-30"><FileSearch size={48} className="mx-auto mb-4" /><p className="text-sm font-black uppercase tracking-widest">No assigned accounts found</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NewAssignedAccounts;
