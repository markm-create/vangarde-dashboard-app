import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, ShieldAlert, Download } from 'lucide-react';
import { INVENTORY_SCRIPT_URL } from '../constants';

interface Account {
  internalCaseId: string;
  caseNumber: string;
  collectorName: string;
  businessName: string;
  clientName: string;
  accountStatus: string;
  accountAge: number;
  balance: number;
}

interface MetricCategory {
  id: string;
  title: string;
  sheetName: string;
}

const MetricAccountBreakdown: React.FC<{ category: MetricCategory; onBack: () => void }> = ({ category, onBack }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleExportCSV = () => {
    if (accounts.length === 0) return;

    const headers = [
      'Internal Case ID',
      'Case Number',
      'Collector',
      'Business Name',
      'Client Name',
      'Account Status',
      'Account Age',
      'Balance'
    ];

    const csvData = accounts.map(acc => [
      `"${acc.internalCaseId || ''}"`,
      `"${acc.caseNumber || ''}"`,
      `"${acc.collectorName || 'Unassigned'}"`,
      `"${acc.businessName || ''}"`,
      `"${acc.clientName || ''}"`,
      `"${acc.accountStatus || ''}"`,
      acc.accountAge,
      acc.balance
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${category.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_inventory_breakdown.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const fetchAccounts = async () => {
      if (accounts.length === 0) setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${INVENTORY_SCRIPT_URL}?action=getMetricAccounts&sheetName=${encodeURIComponent(category.sheetName)}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const result = await response.json();
        if (result.status === 'success') {
          setAccounts(result.data || []);
        } else {
          throw new Error(result.message || 'Failed to load data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
    const interval = setInterval(() => {
      fetchAccounts();
    }, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, [category.sheetName]);

  return (
    <div className="p-8 space-y-8 bg-app min-h-screen animate-in fade-in duration-500 font-sans pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 rounded-2xl bg-card border border-border-subtle text-text-muted hover:text-indigo-600 shadow-sm transition-all group">
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-text-main uppercase tracking-tight">{category.title} - Account Inventory</h1>
            <p className="text-text-muted font-bold text-[11px] tracking-[0.2em] mt-1 uppercase">Detailed account list from {category.sheetName}</p>
          </div>
        </div>
        
        <button 
          onClick={handleExportCSV}
          disabled={accounts.length === 0 || loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
          <p className="text-text-muted font-medium">Loading accounts...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 text-rose-600 p-6 rounded-2xl border border-rose-100 font-bold flex items-center gap-3">
          <ShieldAlert size={24} />
          Error: {error}
        </div>
      ) : (
        <div className="bg-card rounded-[2rem] border border-border-subtle shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-subtle">
                  <th className="px-6 py-5 whitespace-nowrap">Internal Case ID</th>
                  <th className="px-6 py-5 whitespace-nowrap">Case Number</th>
                  <th className="px-6 py-5 whitespace-nowrap">Collector</th>
                  <th className="px-6 py-5 whitespace-nowrap">Business Name</th>
                  <th className="px-6 py-5 whitespace-nowrap">Client Name</th>
                  <th className="px-6 py-5 whitespace-nowrap">Account Status</th>
                  <th className="px-6 py-5 whitespace-nowrap">Account Age</th>
                  <th className="px-6 py-5 whitespace-nowrap text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-[12px]">
                {accounts.length > 0 ? (
                  accounts.map((acc, idx) => (
                    <tr key={idx} className="hover:bg-surface-100 transition-colors">
                      <td className="px-6 py-5 font-medium">{acc.internalCaseId || '-'}</td>
                      <td className="px-6 py-5 font-medium">{acc.caseNumber || '-'}</td>
                      <td className="px-6 py-5 font-medium">{acc.collectorName || 'Unassigned'}</td>
                      <td className="px-6 py-5 font-medium">{acc.businessName || '-'}</td>
                      <td className="px-6 py-5 font-medium">{acc.clientName || '-'}</td>
                      <td className="px-6 py-5 font-medium">
                        <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                          {acc.accountStatus || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-medium">{acc.accountAge} days</td>
                      <td className="px-6 py-5 font-black text-right">${(Number(acc.balance) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-text-muted font-medium">
                      No accounts found in this category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricAccountBreakdown;
