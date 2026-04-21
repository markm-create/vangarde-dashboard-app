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
  Smartphone
} from 'lucide-react';
import { SMS_CAMPAIGN_SCRIPT_URL } from '../constants';

interface SmsCampaignData {
  dateSent: string;
  accountNumber: string;
  debtorName: string;
  debtorSurname: string;
  phoneNumber: string;
  campaignStatus: string;
  accountAssignment: string;
  debtorReply: string;
}

interface SmsCampaignViewProps {
  onBack: () => void;
}

const SmsCampaignView: React.FC<SmsCampaignViewProps> = ({ onBack }) => {
  const [data, setData] = useState<SmsCampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const [monthFilter, setMonthFilter] = useState(currentMonth);
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(SMS_CAMPAIGN_SCRIPT_URL);
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
      } else {
        console.error('Unexpected data format:', result);
        throw new Error('Sync Error: Data format mismatch (Expected Array)');
      }
    } catch (err) {
      console.error('Sync Error:', err);
      const message = err instanceof Error ? err.message : 'Failed to fetch SMS campaign data';
      setError(message === 'Failed to fetch' 
        ? 'Connection Blocked. Please ensure the Google Script is deployed to "Anyone" and you are not logged into multiple Google accounts.' 
        : message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const dateFilteredData = useMemo(() => {
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
  }, [data, monthFilter]);

  const stats = useMemo(() => {
    const total = dateFilteredData.length;
    if (total === 0) return { total: 0, sent: 0, replied: 0, failed: 0, sentCount: 0, repliedCount: 0, failedCount: 0 };

    const sent = dateFilteredData.filter(d => d.campaignStatus?.toLowerCase().includes('sent') || d.campaignStatus?.toLowerCase().includes('delivered')).length;
    const replied = dateFilteredData.filter(d => d.campaignStatus?.toLowerCase().includes('replied')).length;
    const failed = dateFilteredData.filter(d => d.campaignStatus?.toLowerCase().includes('failed') || d.campaignStatus?.toLowerCase().includes('bounced') || d.campaignStatus?.toLowerCase().includes('invalid')).length;

    return {
      total,
      sent: (sent / total) * 100,
      replied: (replied / total) * 100,
      failed: (failed / total) * 100,
      sentCount: sent,
      repliedCount: replied,
      failedCount: failed,
    };
  }, [dateFilteredData]);

  const filteredData = useMemo(() => {
    return dateFilteredData.filter(d => {
      const searchTarget = `${d.debtorName || ''} ${d.debtorSurname || ''}`.toLowerCase();
      const matchesSearch = searchTarget.includes(searchTerm.toLowerCase()) ||
                            d.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            d.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || d.campaignStatus?.toLowerCase().includes(statusFilter.toLowerCase());
      
      return matchesSearch && matchesStatus;
    });
  }, [dateFilteredData, searchTerm, statusFilter]);

  const handleExport = () => {
    const headers = ['Date Sent', 'Account Number', 'Debtor Name', 'Debtor Surname', 'Phone Number', 'Campaign Status', 'Account Assignment', 'Debtor Reply'];
    const csvContent = [
      headers.join(','),
      ...data.map(d => [
        `"${d.dateSent}"`,
        `"${d.accountNumber}"`,
        `"${d.debtorName}"`,
        `"${d.debtorSurname}"`,
        `"${d.phoneNumber}"`,
        `"${d.campaignStatus}"`,
        `"${d.accountAssignment}"`,
        `"${d.debtorReply}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sms_campaign_report_${new Date().toISOString().split('T')[0]}.csv`);
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
            className="p-2.5 rounded-2xl bg-card border border-border-subtle text-text-muted hover:text-emerald-600 shadow-sm transition-all group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-text-main uppercase tracking-tight">Follow-up SMS</h1>
            <p className="text-text-muted font-bold text-[11px] tracking-[0.2em] mt-1 uppercase">Automated Text Outreach</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchData(true)}
            disabled={loading}
            className="p-2.5 rounded-xl bg-card border border-border-subtle text-text-muted hover:text-emerald-600 shadow-sm transition-all group disabled:opacity-50"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 shadow-lg active:scale-95 transition-all"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
        <StatBox 
          label="Total Follow-up SMS" 
          value={stats.total} 
          icon={Smartphone} 
          color="emerald" 
        />
        <StatBox 
          label="Delivered" 
          value={`${stats.sent.toFixed(1)}%`} 
          subValue={`${stats.sentCount} Accounts`}
          icon={CheckCircle2} 
          color="blue" 
        />
        <StatBox 
          label="Replied" 
          value={`${stats.replied.toFixed(1)}%`} 
          subValue={`${stats.repliedCount} Responses`}
          icon={MessageSquare} 
          color="indigo" 
        />
        <StatBox 
          label="Failed" 
          value={`${stats.failed.toFixed(1)}%`} 
          subValue={`${stats.failedCount} Bad Numbers`}
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
              placeholder="Search accounts, names, or phones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-app border border-border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
            />
          </div>
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-app border border-border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-text-main"
            >
              <option value="All">All Statuses</option>
              <option value="Sent">Sent / Delivered</option>
              <option value="Replied">Replied</option>
              <option value="Failed">Failed / Bounced / Invalid</option>
            </select>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-4 py-2.5 bg-app border border-border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-text-main"
            />
            <div className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-2">
              Showing {filteredData.length} of {dateFilteredData.length} Records
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto scrollbar-thin">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-emerald-600" size={40} />
              <p className="text-text-muted font-black text-xs uppercase tracking-widest">Syncing SMS Data...</p>
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
                className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all"
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
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle">Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle">Phone Number</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle">Campaign Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle">Account Assignment</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle">Debtor Reply</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-surface-100 text-text-muted flex items-center justify-center">
                          <Search size={32} />
                        </div>
                        <p className="text-text-muted font-black text-xs uppercase tracking-widest">
                          {searchTerm ? "No matching records found" : "No SMS placement data here yet"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-surface-50/50 transition-colors group">
                      <td className="px-6 py-4 text-xs font-bold text-text-main whitespace-nowrap">{row.dateSent}</td>
                      <td className="px-6 py-4 text-xs font-mono font-bold text-emerald-600">{row.accountNumber}</td>
                      <td className="px-6 py-4 text-xs font-black text-text-main uppercase tracking-tight">{row.debtorName} {row.debtorSurname}</td>
                      <td className="px-6 py-4 text-xs font-medium text-text-muted">{row.phoneNumber}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {row.campaignStatus?.toLowerCase().includes('sent') || row.campaignStatus?.toLowerCase().includes('delivered') ? <CheckCircle2 size={14} className="text-blue-500" /> :
                           row.campaignStatus?.toLowerCase().includes('replied') ? <MessageSquare size={14} className="text-emerald-500" /> :
                           row.campaignStatus?.toLowerCase().includes('failed') || row.campaignStatus?.toLowerCase().includes('bounced') || row.campaignStatus?.toLowerCase().includes('invalid') ? <XCircle size={14} className="text-rose-500" /> :
                           <AlertCircle size={14} className="text-text-muted" />}
                          <span className="text-xs font-bold text-text-main">{row.campaignStatus}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-surface-100 text-text-muted">
                          {row.accountAssignment || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs truncate text-xs font-medium text-text-muted italic" title={row.debtorReply}>
                          {row.debtorReply || '-'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
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

export default SmsCampaignView;
