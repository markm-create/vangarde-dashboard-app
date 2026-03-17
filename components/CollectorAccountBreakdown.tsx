import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Download } from 'lucide-react';
import { Collector } from '../types';
import { INVENTORY_SCRIPT_URL } from '../constants';

interface Account {
  internalCaseId: string;
  caseNumber: string;
  businessName: string;
  clientName: string;
  accountStatus: string;
  accountAge: number;
  balance: number;
  accountUrl?: string;
}

const CollectorAccountBreakdown: React.FC<{ collector: Collector; onBack: () => void }> = ({ collector, onBack }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleExportCSV = () => {
    if (accounts.length === 0) return;

    const headers = [
      'Internal Case ID',
      'Case Number',
      'Business Name',
      'Client Name',
      'Account Status',
      'Account Age',
      'Balance',
      'Account URL'
    ];

    const csvData = accounts.map(acc => [
      `"${acc.internalCaseId || ''}"`,
      `"${acc.caseNumber || ''}"`,
      `"${acc.businessName || ''}"`,
      `"${acc.clientName || ''}"`,
      `"${acc.accountStatus || ''}"`,
      acc.accountAge,
      acc.balance,
      `"${acc.accountUrl || ''}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${collector.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_inventory_breakdown.csv`);
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
        const response = await fetch(`${INVENTORY_SCRIPT_URL}?action=getInventory`);
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const result = await response.json();
        if (result.status === 'success') {
          const targetName = collector.name.toLowerCase().trim();
          const targetParts = targetName.split(' ').filter(Boolean);

          // Debugging: Log available collector names
          const availableNames = Array.from(new Set(result.data.map((i: any) => i.collectorName).filter(Boolean)));
          console.log('Available collector names in sheet:', availableNames);
          console.log('Looking for:', collector.name);

          // Filter by collector name with fuzzy matching
          const filtered = result.data
            .filter((item: any) => {
              // Skip header row
              if (item.internalCaseId === 'internal_case_id' || item.internalCaseId === 'Internal Case ID') return false;
              
              // Skip completely empty rows (must have at least an ID, case number, or business name)
              if (!item.internalCaseId && !item.caseNumber && !item.businessName) return false;

              const rawName = item.collectorName;
              const sheetName = (rawName && String(rawName).trim() !== '') ? String(rawName).toLowerCase().trim() : 'unassigned';
              
              // Exact match
              if (sheetName === targetName) return true;
              
              // Check if all parts of the name exist in the sheet name (handles "Last, First")
              if (targetParts.length > 0 && targetParts.every(part => sheetName.includes(part))) {
                return true;
              }

              // Check if the first name matches exactly and the last name initial matches
              // e.g., target: "Sophia Smith", sheet: "Sophia S." or "S. Sophia"
              const sheetParts = sheetName.split(/[\s,]+/).filter(Boolean);
              if (targetParts.length >= 2 && sheetParts.length >= 2) {
                const targetFirst = targetParts[0];
                const targetLast = targetParts[1];
                
                // Check if sheet has targetFirst and targetLast initial
                const hasFirst = sheetParts.includes(targetFirst);
                const hasLastInitial = sheetParts.some(p => p.startsWith(targetLast[0]));
                
                if (hasFirst && hasLastInitial) return true;

                // Check if sheet has targetLast and targetFirst initial (e.g., "M. Smith")
                const hasLast = sheetParts.includes(targetLast);
                const hasFirstInitial = sheetParts.some(p => p.startsWith(targetFirst[0]));
                
                if (hasLast && hasFirstInitial) return true;
              }
              
              // If the sheet name is just the first name (and it's unique enough)
              if (sheetParts.length === 1 && targetParts[0] === sheetParts[0]) {
                return true;
              }
              
              return false;
            })
            .map((item: any) => ({
              internalCaseId: item.internalCaseId || '-',
              caseNumber: item.caseNumber || '-',
              businessName: item.businessName || '-',
              clientName: item.clientName || '-',
              accountStatus: item.accountStatus || '-',
              accountAge: Number(item.accountAge) || 0,
              balance: Number(item.balance) || 0,
              accountUrl: item.accountUrl || null
            }));
            
          setAccounts(filtered);
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
  }, [collector.name]);

  return (
    <div className="p-8 space-y-8 bg-app min-h-screen animate-in fade-in duration-500 font-sans pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 rounded-2xl bg-card border border-border-subtle text-text-muted hover:text-indigo-600 shadow-sm transition-all group">
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-text-main uppercase tracking-tight">{collector.name} - Account Inventory</h1>
            <p className="text-text-muted font-bold text-[11px] tracking-[0.2em] mt-1 uppercase">Detailed account list</p>
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
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
        </div>
      ) : error ? (
        <div className="bg-rose-50 text-rose-600 p-6 rounded-2xl border border-rose-100 font-bold">
          Error: {error}
        </div>
      ) : (
        <div className="bg-card rounded-[2rem] border border-border-subtle shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-subtle">
                <th className="px-6 py-5">Internal Case ID</th>
                <th className="px-6 py-5">Case Number</th>
                <th className="px-6 py-5">Business Name</th>
                <th className="px-6 py-5">Client Name</th>
                <th className="px-6 py-5">Account Status</th>
                <th className="px-6 py-5">Account Age</th>
                <th className="px-6 py-5 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-[12px]">
              {accounts.length > 0 ? (
                accounts.map((acc, idx) => (
                  <tr key={idx} className="hover:bg-surface-100">
                    <td className="px-6 py-5 font-medium">{acc.internalCaseId}</td>
                    <td className="px-6 py-5 font-medium">
                      {acc.accountUrl ? (
                        <a 
                          href={acc.accountUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-indigo-600 hover:text-indigo-800 hover:underline transition-colors flex items-center gap-1"
                        >
                          {acc.caseNumber}
                        </a>
                      ) : (
                        acc.caseNumber
                      )}
                    </td>
                    <td className="px-6 py-5 font-medium">{acc.businessName}</td>
                    <td className="px-6 py-5 font-medium">{acc.clientName}</td>
                    <td className="px-6 py-5 font-medium">{acc.accountStatus}</td>
                    <td className="px-6 py-5 font-medium">{acc.accountAge} days</td>
                    <td className="px-6 py-5 font-black text-right">${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted font-medium">
                    No accounts found for {collector.name}.
                    <br />
                    <span className="text-[10px] mt-2 block opacity-70">
                      (Make sure the collector name in Column K of your Google Sheet matches "{collector.name}")
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CollectorAccountBreakdown;
