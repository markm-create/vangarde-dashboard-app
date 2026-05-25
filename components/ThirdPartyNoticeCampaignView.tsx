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
  Filter,
  Eye,
  X,
  CreditCard
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { THIRD_PARTY_CAMPAIGN_SCRIPT_URL } from '../constants';

interface CampaignData {
  dateSent: string;
  accountNumber: string;
  businessName: string;
  creditorName: string;
  accountStatus: string;
  debtorEmail: string;
  campaignStatus: string;
  debtorPaidReturn: string;
  paidAmount: string;
  thirdPartyResponse: string;
  debtorResponse: string;
}

interface ThirdPartyNoticeCampaignViewProps {
  onBack: () => void;
}

const ThirdPartyNoticeCampaignView: React.FC<ThirdPartyNoticeCampaignViewProps> = ({ onBack }) => {
  const [data, setData] = useState<CampaignData[]>(() => {
    const cached = localStorage.getItem('vg_thirdPartyCampaignData');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(() => !localStorage.getItem('vg_thirdPartyCampaignData'));
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const getInitialDates = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of the month
    return {
      start: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
      end: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
    };
  };

  const initialDates = getInitialDates();
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
  const [statusFilter, setStatusFilter] = useState('All');
  const [creditorFilter, setCreditorFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CampaignData | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyModalTitle, setReplyModalTitle] = useState('');
  const [replyModalContent, setReplyModalContent] = useState('');

  const fetchData = async (force = false, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      if (!THIRD_PARTY_CAMPAIGN_SCRIPT_URL) {
        throw new Error('Backend Error: Please check the Google Script setup for missing THIRD_PARTY_CAMPAIGN_SCRIPT_URL.');
      }
      const url = new URL(THIRD_PARTY_CAMPAIGN_SCRIPT_URL);
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

      let dataArray = null;
      if (Array.isArray(result)) {
        dataArray = result;
      } else if (result && Array.isArray(result.data)) {
        dataArray = result.data;
      }

      if (dataArray) {
        setData(dataArray);
        localStorage.setItem('vg_thirdPartyCampaignData', JSON.stringify(dataArray));
      } else {
        console.error('Unexpected data format:', result);
        throw new Error('Sync Error: Data format mismatch (Expected Array or {data: Array})');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch campaign data';
      if (message.includes('THIRD_PARTY_CAMPAIGN_SCRIPT_URL is not defined')) {
        console.warn('Third Party Campaign: The Google Script is missing the required THIRD_PARTY_CAMPAIGN_SCRIPT_URL variable. Please configure it in the script.');
      } else if (message === 'Failed to fetch') {
        console.warn('Third Party Campaign: Connection Blocked. Please ensure the Google Script is deployed to "Anyone".');
      } else {
        console.error('Third Party Campaign Sync Error:', err);
      }
      
      // Only set error if we don't have cached data to show
      if (data.length === 0) {
        setError(message === 'Failed to fetch' 
          ? 'Connection Blocked. Please ensure the Google Script is deployed to "Anyone".' 
          : message.includes('THIRD_PARTY_CAMPAIGN_SCRIPT_URL') ? 'Backend Error: Please check the Google Script setup for missing THIRD_PARTY_CAMPAIGN_SCRIPT_URL.' : message);
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
    if (!startDate && !endDate) return data;

    return data.filter(d => {
      const dateStr = String(d.dateSent || '');
      if (!dateStr || dateStr === '-') return false;
      
      let itemDateStr = '';
      
      // Try to parse mm/dd/yyyy format exactly
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const [month, day, year] = parts;
        itemDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else {
        // Fallback
        try {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            itemDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          } else {
            return false;
          }
        } catch (e) {
          return false;
        }
      }

      const isAfterStart = !startDate || itemDateStr >= startDate;
      const isBeforeEnd = !endDate || itemDateStr <= endDate;
      
      return isAfterStart && isBeforeEnd;
    });
  }, [data, startDate, endDate]);

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
    if (total === 0) return { total: 0, sent: 0, replied: 0, bounced: 0, invalid: 0, sentCount: 0, repliedCount: 0, bouncedCount: 0, invalidCount: 0, paidCount: 0, paidRate: 0 };

    const sent = dateFilteredData.filter(d => {
      const status = String(d.campaignStatus || '').toLowerCase();
      return status.includes('sent') || status.includes('delivered');
    }).length;
    const replied = dateFilteredData.filter(d => String(d.campaignStatus || '').toLowerCase().includes('replied')).length;
    const bounced = dateFilteredData.filter(d => String(d.campaignStatus || '').toLowerCase().includes('bounced')).length;
    const invalid = dateFilteredData.filter(d => String(d.campaignStatus || '').toLowerCase().includes('invalid')).length;

    const paidCount = dateFilteredData.filter(d => {
      const val = String(d.debtorPaidReturn || '').trim();
      return val !== '' && val !== '-' && val.toLowerCase() !== 'no' && val.toLowerCase() !== 'false' && val !== '0' && val !== '$0.00' && val !== '0.00';
    }).length;

    return {
      total,
      sent: (sent / total) * 100,
      replied: (replied / total) * 100,
      bounced: (bounced / total) * 100,
      invalid: (invalid / total) * 100,
      sentCount: sent,
      repliedCount: replied,
      bouncedCount: bounced,
      invalidCount: invalid,
      paidCount,
      paidRate: (paidCount / total) * 100
    };
  }, [dateFilteredData]);

  const filteredData = useMemo(() => {
    return dateFilteredData.filter(d => {
      const bizName = String(d.businessName || '').toLowerCase();
      const acctNum = String(d.accountNumber || '').toLowerCase();
      const email = String(d.debtorEmail || '').toLowerCase();
      
      const matchesSearch = bizName.includes(searchTerm.toLowerCase()) ||
                            acctNum.includes(searchTerm.toLowerCase()) ||
                            email.includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || String(d.campaignStatus || '').trim() === statusFilter;
      const matchesCreditor = creditorFilter === 'All' || (String(d.creditorName || '').trim() || 'Unassigned') === creditorFilter;
      
      return matchesSearch && matchesStatus && matchesCreditor;
    });
  }, [dateFilteredData, searchTerm, statusFilter, creditorFilter]);

  const handleExport = () => {
    const headers = ['Date Sent', 'Account #', 'Client Name', 'Third Party Entity', 'Letter Type', 'Sent Via', 'Email Status', 'Debtor Paid Return', 'Paid Amount', 'Third-Party Response', 'Debtor Response'];
    const csvContent = [
      headers.join(','),
      ...data.map(d => [
        `"${d.dateSent}"`,
        `"${d.accountNumber}"`,
        `"${d.creditorName}"`,
        `"${d.businessName}"`,
        `"${d.accountStatus}"`,
        `"${d.debtorEmail}"`,
        `"${d.campaignStatus}"`,
        `"${d.debtorPaidReturn || '-'}"`,
        `"${d.paidAmount || '-'}"`,
        `"${d.thirdPartyResponse || '-'}"`,
        `"${d.debtorResponse || '-'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `third_party_campaign_report_${new Date().toISOString().split('T')[0]}.csv`);
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
            <h1 className="text-2xl font-black text-text-main uppercase tracking-tight">Third Party Notice</h1>
            <p className="text-text-muted font-bold text-[11px] tracking-[0.2em] mt-1 uppercase">Letter Campaigns to Third Parties</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 shrink-0">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="md:col-span-1 bg-card rounded-[2rem] border border-border-subtle shadow-sm p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="w-full flex justify-between items-start mb-2 z-10">
            <div>
              <h3 className="text-xs font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                <CreditCard size={14} className="text-emerald-500" />
                Payment Return
              </h3>
              <p className="text-[10px] text-text-muted font-bold mt-1 max-w-[150px]">Debtors who paid after notice</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-text-main font-inter">{stats.paidRate.toFixed(1)}%</span>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{stats.paidCount} out of {stats.total}</p>
            </div>
          </div>
          
          <div className="w-full h-[180px] z-10">
            {stats.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Paid', value: stats.paidCount },
                      { name: 'Unpaid', value: stats.total - stats.paidCount }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#e2e8f0" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', padding: '8px 12px', fontSize: '12px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#0f172a' }}
                    formatter={(value: number) => [value, 'Accounts']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-text-muted font-bold text-xs uppercase tracking-widest">
                    No Data
                </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[2rem] border border-indigo-400/50 shadow-lg p-8 flex flex-col justify-center text-white relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <CheckCircle2 size={250} />
          </div>
          <h3 className="text-2xl font-black mb-3 tracking-tight z-10 uppercase">Campaign Performance</h3>
          <p className="text-indigo-100 font-medium max-w-lg z-10 text-sm leading-relaxed">
            Out of <strong className="text-white">{stats.total}</strong> total notices sent, <strong className="text-white">{stats.repliedCount}</strong> resulted in direct communication and <strong className="text-white">{stats.paidCount}</strong> led to successful payments. This represents a <strong className="text-emerald-300">{stats.paidRate.toFixed(1)}% conversion rate</strong> on third-party interventions.
          </p>
        </div>
      </div>

      {/* Table Section */}
      {showBreakdown ? (
      <div className="fixed inset-0 z-50 flex flex-col bg-app/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="flex-1 absolute inset-4 bg-card rounded-2xl border border-border-subtle shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
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
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 bg-app border border-border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-text-main h-10 w-36"
              />
              <span className="text-text-muted font-black text-[10px] uppercase">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 bg-app border border-border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-text-main h-10 w-36"
              />
            </div>

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
                        const initial = getInitialDates();
                        setStatusFilter('All');
                        setCreditorFilter('All');
                        setStartDate(initial.start);
                        setEndDate(initial.end);
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

            <button
              onClick={() => setShowBreakdown(false)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-border-subtle bg-surface-100 hover:bg-surface-200 text-text-muted hover:text-text-main transition-all font-black text-[10px] uppercase tracking-widest"
            >
              <X size={14} />
              Close
            </button>
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
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle">Client Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle">Third Party Entity</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle">Email Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle text-center">Debtor Paid Return</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle text-center whitespace-nowrap">Paid Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle text-center">Third-Party...</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle text-center">Debtor Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-16 text-center">
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
                      <td className="px-6 py-4 text-xs font-bold text-text-muted">{String(row.creditorName || '').trim() || 'Unassigned'}</td>
                      <td className="px-6 py-4 text-xs font-black text-text-main uppercase tracking-tight">{row.businessName}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {(String(row.campaignStatus || '').toLowerCase().includes('sent') || String(row.campaignStatus || '').toLowerCase().includes('delivered')) ? <Send size={14} className="text-blue-500" /> :
                           String(row.campaignStatus || '').toLowerCase().includes('replied') ? <MessageSquare size={14} className="text-emerald-500" /> :
                           String(row.campaignStatus || '').toLowerCase().includes('bounced') ? <XCircle size={14} className="text-orange-500" /> :
                           String(row.campaignStatus || '').toLowerCase().includes('invalid') ? <AlertCircle size={14} className="text-rose-500" /> :
                           <AlertCircle size={14} className="text-text-muted" />}
                          <span className="text-xs font-bold text-text-main">{row.campaignStatus}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                          String(row.debtorPaidReturn || '').toLowerCase().includes('yes') ? 'bg-emerald-50 text-emerald-600' :
                          String(row.debtorPaidReturn || '').toLowerCase().includes('no') ? 'bg-rose-50 text-rose-600' :
                          'bg-surface-100 text-text-muted'
                        }`}>
                          {row.debtorPaidReturn || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-xs font-bold text-text-main">
                        {row.paidAmount || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.thirdPartyResponse && row.thirdPartyResponse !== '' && row.thirdPartyResponse !== '-' ? (
                          <button
                            onClick={() => {
                              setReplyModalTitle('Third-Party Response');
                              setReplyModalContent(row.thirdPartyResponse);
                              setReplyModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                          >
                            <Eye size={12} /> View Reply
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-text-muted italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.debtorResponse && row.debtorResponse !== '' && row.debtorResponse !== '-' ? (
                          <button
                            onClick={() => {
                              setReplyModalTitle('Debtor Response');
                              setReplyModalContent(row.debtorResponse);
                              setReplyModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                          >
                            <Eye size={12} /> View Reply
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-text-muted italic">-</span>
                        )}
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
      ) : (
        <div className="flex justify-center mt-12 mb-8">
          <button 
            onClick={() => setShowBreakdown(true)}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-3"
          >
            <Download size={18} className="rotate-180" />
            View Third Party Notice Campaign Breakdown
          </button>
        </div>
      )}

      {/* Reply Modal */}
      {replyModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-app/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border-subtle shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-surface-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <MessageSquare size={18} />
                </div>
                <h3 className="text-sm font-black text-text-main uppercase tracking-widest">{replyModalTitle}</h3>
              </div>
              <button 
                onClick={() => setReplyModalOpen(false)}
                className="p-2 rounded-full hover:bg-surface-100 text-text-muted transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="bg-surface-50 border border-border-subtle rounded-2xl p-6 shadow-inner">
                <p className="text-sm font-medium text-text-main leading-relaxed whitespace-pre-wrap">
                  {replyModalContent}
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-border-subtle bg-surface-50 flex justify-end">
              <button
                onClick={() => setReplyModalOpen(false)}
                className="px-6 py-2.5 bg-card hover:bg-surface-100 border border-border-subtle text-text-main rounded-xl text-[10px] font-black uppercase tracking-widest text-center transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-app/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-2xl rounded-3xl border border-border-subtle shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 object-contain">
            <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-surface-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-text-main uppercase tracking-widest">Campaign Details</h3>
                  <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase mt-0.5">Account: {selectedRecord.accountNumber}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="p-2 rounded-full hover:bg-surface-100 text-text-muted transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] bg-surface-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 border-b border-border-subtle pb-2">Account Information</h4>
                    <div className="space-y-3">
                      <div>
                         <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1">Client Name</p>
                         <p className="text-xs font-bold text-text-main">{String(selectedRecord.creditorName || '').trim() || 'Unassigned'}</p>
                      </div>
                      <div>
                         <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1">Third Party Entity</p>
                         <p className="text-xs font-black text-text-main uppercase">{selectedRecord.businessName}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 border-b border-border-subtle pb-2">Communication</h4>
                    <div className="space-y-3">
                      <div>
                         <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1">Date Sent</p>
                         <p className="text-xs font-bold text-text-main uppercase">{formatDate(selectedRecord.dateSent)}</p>
                      </div>
                      <div>
                         <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1">Sent Via</p>
                         <p className="text-xs font-bold text-text-main">{selectedRecord.debtorEmail || '-'}</p>
                      </div>
                      <div>
                         <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1">Delivery Status</p>
                         <p className="text-xs font-bold text-text-main uppercase">{selectedRecord.campaignStatus || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 flex flex-col h-full">
                  <div>
                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 border-b border-border-subtle pb-2">Campaign Outcome</h4>
                    <div className="space-y-3">
                       <div>
                         <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1">Letter Type</p>
                         <p className="text-xs font-bold text-text-main uppercase">{selectedRecord.accountStatus || '-'}</p>
                      </div>
                      <div>
                         <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1">Debtor Paid Return</p>
                          <span className={`inline-block px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest mt-1 ${
                            String(selectedRecord.debtorPaidReturn || '').toLowerCase().includes('yes') ? 'bg-emerald-50 text-emerald-600' :
                            String(selectedRecord.debtorPaidReturn || '').toLowerCase().includes('no') ? 'bg-rose-50 text-rose-600' :
                            'bg-surface-100 text-text-muted'
                          }`}>
                            {selectedRecord.debtorPaidReturn || '-'}
                          </span>
                      </div>
                      <div>
                         <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1">Paid Amount</p>
                         <p className="text-xs font-bold text-text-main uppercase">{selectedRecord.paidAmount || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col gap-4">
                    <div className="bg-white border border-border-subtle rounded-2xl p-4 flex-1">
                      <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-2">Third-Party Response</p>
                      <p className="text-xs font-medium text-text-main leading-relaxed whitespace-pre-wrap">
                        {selectedRecord.thirdPartyResponse && selectedRecord.thirdPartyResponse !== '-' ? selectedRecord.thirdPartyResponse : <span className="italic text-text-muted">No response recorded</span>}
                      </p>
                    </div>
                    <div className="bg-white border border-border-subtle rounded-2xl p-4 flex-1">
                      <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-2">Debtor Response</p>
                      <p className="text-xs font-medium text-text-main leading-relaxed whitespace-pre-wrap">
                        {selectedRecord.debtorResponse && selectedRecord.debtorResponse !== '-' ? selectedRecord.debtorResponse : <span className="italic text-text-muted">No response recorded</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border-subtle bg-surface-50 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-6 py-2.5 bg-card hover:bg-surface-100 border border-border-subtle text-text-main rounded-xl text-[10px] font-bold uppercase tracking-widest text-center transition-all"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
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

export default ThirdPartyNoticeCampaignView;
