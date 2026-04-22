import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  RefreshCw, 
  Loader2, 
  FileText, 
  Send, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Search,
  Download,
  Filter
} from 'lucide-react';
import { INITIAL_CAMPAIGN_SCRIPT_URL } from '../constants';

interface CampaignData {
  dateSent: string;
  accountNumber: string;
  businessName: string;
  creditorName: string;
  accountStatus: string;
  debtorEmail: string;
  campaignStatus: string;
  debtorResponse: string;
}

interface InitialCampaignViewProps {
  onBack: () => void;
}

const InitialCampaignView: React.FC<InitialCampaignViewProps> = ({ onBack }) => {
  const [data, setData] = useState<CampaignData[]>(() => {
    const cached = localStorage.getItem('vg_initialCampaignData');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(() => !localStorage.getItem('vg_initialCampaignData'));
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const [monthFilter, setMonthFilter] = useState(currentMonth);
  const [specificDate, setSpecificDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [creditorFilter, setCreditorFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = async (force = false, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const url = new URL(INITIAL_CAMPAIGN_SCRIPT_URL);
      url.searchParams.set('t', Date.now().toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`Sync Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result && result.error) {
        throw new Error(`Database Error: ${result.error}`);
      }

      if (Array.isArray(result)) {
        setData(result);
        localStorage.setItem('vg_initialCampaignData', JSON.stringify(result));
      } else {
        console.error('Unexpected data format:', result);
        throw new Error('Sync Error: Data format mismatch (Expected Array)');
      }
    } catch (err) {
      console.error('Sync Error:', err);
      // Only set error if we don't have cached data to show
      if (data.length === 0) {
        const message = err instanceof Error ? err.message : 'Failed to fetch campaign data';
        setError(message === 'Failed to fetch' 
          ? 'Connection Blocked. Please ensure the Google Script is deployed to "Anyone".' 
          : message);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(false, data.length > 0);
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const dateFilteredData = useMemo(() => {
    if (specificDate) {
      return data.filter(d => {
        if (!d.dateSent) return false;
        try {
          const date = new Date(d.dateSent);
          const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          return formatted === specificDate;
        } catch (e) {
          return false;
        }
      });
    }

    if (!monthFilter) return data;
    
    return data.filter(d => {
      if (!d.dateSent) return false;
      const parts = d.dateSent.split('/');
      if (parts.length === 3) {
        const [month, day, year] = parts;
        const formattedDate = `${year}-${month.padStart(2, '0')}`;
        return formattedDate === monthFilter;
      }
      try {
        const date = new Date(d.dateSent);
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return formattedDate === monthFilter;
      } catch (e) {
        return false;
      }
    });
  }, [data, monthFilter, specificDate]);

  const uniqueCreditors = useMemo(() => {
    const creditors = new Set<string>();
    data.forEach(d => {
      const name = String(d.creditorName || '').trim();
      creditors.add(name || 'Unassigned');
    });
    return Array.from(creditors).sort();
  }, [data]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    data.forEach(d => {
      const status = String(d.campaignStatus || '').trim();
      if (status) statuses.add(status);
    });
    return Array.from(statuses).sort();
  }, [data]);

  const stats = useMemo(() => {
    const total = dateFilteredData.length;
    if (total === 0) return { total: 0, sent: 0, replied: 0, bounced: 0, invalid: 0, sentCount: 0, repliedCount: 0, bouncedCount: 0, invalidCount: 0 };

    const sent = dateFilteredData.filter(d => d.campaignStatus?.toLowerCase().includes('sent')).length;
    const replied = dateFilteredData.filter(d => d.campaignStatus?.toLowerCase().includes('replied')).length;
    const bounced = dateFilteredData.filter(d => d.campaignStatus?.toLowerCase().includes('bounced')).length;
    const invalid = dateFilteredData.filter(d => d.campaignStatus?.toLowerCase().includes('invalid')).length;

    return {
      total,
      sent: (sent / total) * 100,
      replied: (replied / total) * 100,
      bounced: (bounced / total) * 100,
      invalid: (invalid / total) * 100,
      sentCount: sent,
      repliedCount: replied,
      bouncedCount: bounced,
      invalidCount: invalid
    };
  }, [dateFilteredData]);

  const filteredData = useMemo(() => {
    return dateFilteredData.filter(d => {
      const matchesSearch = d.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            d.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            d.debtorEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || String(d.campaignStatus || '').trim() === statusFilter;
      const matchesCreditor = creditorFilter === 'All' || (String(d.creditorName || '').trim() || 'Unassigned') === creditorFilter;
      
      return matchesSearch && matchesStatus && matchesCreditor;
    });
  }, [dateFilteredData, searchTerm, statusFilter, creditorFilter]);

  const handleExport = () => {
    const headers = ['Date Sent', 'Account Number', 'Business Name', 'Creditor Name', 'Account Status', 'Debtor Email', 'Campaign Status', 'Debtor Response'];
    const csvContent = [
      headers.join(','),
      ...data.map(d => [
        `"${d.dateSent}"`,
        `"${d.accountNumber}"`,
        `"${d.businessName}"`,
        `"${d.creditorName}"`,
        `"${d.accountStatus}"`,
        `"${d.debtorEmail}"`,
        `"${d.campaignStatus}"`,
        `"${d.debtorResponse}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `initial_campaign_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-8 bg-app h-screen animate-in fade-in duration-500 font-sans overflow-hidden flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2.5 rounded-2xl bg-card border border-border-subtle text-text-muted hover:text-indigo-600 shadow-sm transition-all group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-text-main uppercase tracking-tight">Initial Campaign</h1>
            <p className="text-text-muted font-bold text-[11px] tracking-[0.2em] mt-1 uppercase">Notice of Proceedings & LOR</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchData(true)}
            disabled={loading}
            className="p-2.5 rounded-xl bg-card border border-border-subtle text-text-muted hover:text-indigo-600 shadow-sm transition-all group disabled:opacity-50"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 shadow-lg active:scale-95 transition-all"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 shrink-0">
        <StatBox 
          label="Total Campaign" 
          value={stats.total} 
          icon={FileText} 
          color="indigo" 
        />
        <StatBox 
          label="Sent" 
          value={`${stats.sent.toFixed(1)}%`} 
          subValue={`${stats.sentCount} Accounts`}
          icon={Send} 
          color="blue" 
        />
        <StatBox 
          label="Replied" 
          value={`${stats.replied.toFixed(1)}%`} 
          subValue={`${stats.repliedCount} Responses`}
          icon={MessageSquare} 
          color="emerald" 
        />
        <StatBox 
          label="Bounced" 
          value={`${stats.bounced.toFixed(1)}%`} 
          subValue={`${stats.bouncedCount} Failed`}
          icon={XCircle} 
          color="orange" 
        />
        <StatBox 
          label="Invalid" 
          value={`${stats.invalid.toFixed(1)}%`} 
          subValue={`${stats.invalidCount} Bad Data`}
          icon={AlertCircle} 
          color="rose" 
        />
      </div>

      {/* Table Section */}
      <div className="flex-1 bg-card rounded-[2rem] border border-border-subtle shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-surface-50/50">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="text"
              placeholder="Search accounts, businesses, or emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-app border border-border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
            />
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <input
              type="date"
              value={specificDate}
              onChange={(e) => setSpecificDate(e.target.value)}
              className="px-4 py-2 bg-app border border-border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-text-main h-10 w-40"
            />

            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full border-2 transition-all font-black text-[10px] uppercase tracking-widest ${
                  showFilters || statusFilter !== 'All' || creditorFilter !== 'All'
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                    : 'border-indigo-200 text-indigo-400 hover:border-indigo-600 hover:text-indigo-600'
                }`}
              >
                <Filter size={14} className={showFilters ? 'animate-pulse' : ''} />
                Advanced Filter
              </button>

              {showFilters && (
                <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-border-subtle z-50 p-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className="space-y-6">
                    <div>
                      <span className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Status</span>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      >
                        <option value="All">All Statuses</option>
                        {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <span className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Creditor</span>
                      <select
                        value={creditorFilter}
                        onChange={(e) => setCreditorFilter(e.target.value)}
                        className="w-full px-4 py-3 bg-surface-50 border border-border-subtle rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      >
                        <option value="All">All Creditors</option>
                        {uniqueCreditors.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        setStatusFilter('All');
                        setCreditorFilter('All');
                        setSpecificDate('');
                        setShowFilters(false);
                      }}
                      className="w-full py-2 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 rounded-lg transition-colors border border-rose-100"
                    >
                      Reset All Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto scrollbar-thin">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-indigo-600" size={40} />
              <p className="text-text-muted font-black text-xs uppercase tracking-widest">Syncing Campaign Data...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-lg font-black text-text-main uppercase tracking-tight">Sync Failed</h3>
              <p className="text-text-muted max-w-sm font-medium">{error}</p>
              <button 
                onClick={() => fetchData(true)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all"
              >
                Retry Sync
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-surface-50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle">Date Sent</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle">Account #</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle">Business Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle">Creditor</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle">Email</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle">Campaign</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle">Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-surface-100 text-text-muted flex items-center justify-center">
                          <Search size={32} />
                        </div>
                        <p className="text-text-muted font-black text-xs uppercase tracking-widest">
                          {searchTerm ? "No matching records found" : "No placement data"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-surface-50/50 transition-colors group">
                      <td className="px-6 py-4 text-xs font-bold text-text-main whitespace-nowrap">{formatDate(row.dateSent)}</td>
                      <td className="px-6 py-4 text-xs font-mono font-bold text-indigo-600">{row.accountNumber}</td>
                      <td className="px-6 py-4 text-xs font-black text-text-main uppercase tracking-tight">{row.businessName}</td>
                      <td className="px-6 py-4 text-xs font-bold text-text-muted">{String(row.creditorName || '').trim() || 'Unassigned'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                          row.accountStatus?.toLowerCase().includes('active') ? 'bg-emerald-50 text-emerald-600' :
                          row.accountStatus?.toLowerCase().includes('closed') ? 'bg-rose-50 text-rose-600' :
                          'bg-surface-100 text-text-muted'
                        }`}>
                          {row.accountStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-text-muted">{row.debtorEmail}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {row.campaignStatus?.toLowerCase().includes('sent') ? <Send size={14} className="text-blue-500" /> :
                           row.campaignStatus?.toLowerCase().includes('replied') ? <MessageSquare size={14} className="text-emerald-500" /> :
                           row.campaignStatus?.toLowerCase().includes('bounced') ? <XCircle size={14} className="text-orange-500" /> :
                           row.campaignStatus?.toLowerCase().includes('invalid') ? <AlertCircle size={14} className="text-rose-500" /> :
                           <AlertCircle size={14} className="text-text-muted" />}
                          <span className="text-xs font-bold text-text-main">{row.campaignStatus}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs truncate text-xs font-medium text-text-muted italic" title={row.debtorResponse}>
                          {row.debtorResponse || '-'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-4 border-t border-border-subtle bg-surface-50/30 flex justify-end">
          <div className="text-[10px] font-black text-text-muted uppercase tracking-widest px-4 py-1.5 bg-white border border-border-subtle rounded-lg shadow-sm">
            Showing {filteredData.length} Records
          </div>
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, subValue, icon: Icon, color }: any) => {
  const colors: any = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100'
  };

  return (
    <div className={`bg-card border ${colors[color].split(' ')[2]} rounded-3xl p-6 shadow-sm flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-2xl ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]} flex items-center justify-center shrink-0`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-text-main tracking-tight">{value}</p>
        {subValue && <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-0.5">{subValue}</p>}
      </div>
    </div>
  );
};

export default InitialCampaignView;
