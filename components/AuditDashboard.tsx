import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ClipboardCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Download, 
  ArrowLeft, 
  CreditCard, 
  FileText, 
  Ban, 
  Phone, 
  CalendarX, 
  UserCheck, 
  FileSearch,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  TrendingUp,
  CalendarDays,
  DollarSign,
  ListFilter,
  ArrowDownWideNarrow,
  Check,
  Users,
  Target,
  FileBarChart,
  LayoutGrid,
  LayoutList,
  Boxes,
  RotateCcw,
  XCircle,
  Coins,
  Maximize2,
  Minimize2,
  RefreshCw,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { generateOnboardingAudits, generatePostdatesAudits, generateBillingAudits, generateAeeRtpAudits, generateAccountMonitoringAudits, generateCallMonitoringAudits, generateSevenEightDayAudits, generateRpcAudits, BaseAudit, SevenEightDayAudit } from './mockData';
import { useData } from '../DataContext';
import BillingAuditReport from './BillingAuditReport';

type AuditViewType = 'overview' | 'onboarding' | 'postdates' | 'billing' | 'aee_rtp' | 'account_monitoring' | 'call_monitoring' | 'seven_eight_days' | 'rpc' | 'individual_flagged' | 'individual_onboarding';

const getBusinessDaysCount = (startDateStr: string): number => {
  const start = new Date(startDateStr);
  const end = new Date();
  if (isNaN(start.getTime())) return 0;
  
  let count = 0;
  let cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const normalizedEnd = new Date(end);
  normalizedEnd.setHours(0, 0, 0, 0);

  while (cur < normalizedEnd) {
    cur.setDate(cur.getDate() + 1);
    const dayOfWeek = cur.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
  }
  return count;
};

const formatCurrency = (val: number) => 
  `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatLongDate = (dateStr: string) => {
  if (!dateStr || dateStr === '-') return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

const AuditDashboard: React.FC<{ 
  canManageDocuments: boolean, 
  initialView?: AuditViewType,
  onNavigate?: (tab: any, subView?: any, agent?: string) => void,
  selectedAgent?: string | null,
  currentUser?: any
}> = ({ canManageDocuments, initialView, onNavigate, selectedAgent: propSelectedAgent, currentUser }) => {
  const [activeView, setActiveView] = useState<AuditViewType>(initialView || 'overview');
  const { 
    flaggedAccounts, 
    fetchFlaggedAccounts, 
    onboardingAudits, 
    fetchOnboardingAudits,
    declineRecovery,
    fetchDeclineRecovery,
    accountClosureAudit,
    fetchAccountClosureAudit
  } = useData();
  
  useEffect(() => {
    if (initialView) {
      setActiveView(initialView);
    }
  }, [initialView]);

  useEffect(() => {
    if (activeView === 'seven_eight_days' || activeView === 'individual_flagged') {
      fetchFlaggedAccounts();
      const interval = setInterval(() => {
        fetchFlaggedAccounts(true);
      }, 60000); // Poll every 60 seconds
      return () => clearInterval(interval);
    }
    if (activeView === 'onboarding') {
      fetchOnboardingAudits();
    }
    if (activeView === 'postdates') {
      fetchDeclineRecovery();
    }
    if (activeView === 'aee_rtp') {
      fetchAccountClosureAudit();
    }
  }, [activeView, fetchFlaggedAccounts, fetchOnboardingAudits, fetchDeclineRecovery, fetchAccountClosureAudit]);

  const onboardingData = useMemo(() => onboardingAudits.data, [onboardingAudits.data]);
  const postdatesData = useMemo(() => {
    const records = declineRecovery.data?.records || [];
    if (currentUser?.role === 'Collector') {
      return records.filter((r: any) => r.collectorName?.toLowerCase().trim() === currentUser.name?.toLowerCase().trim());
    }
    return records;
  }, [declineRecovery.data, currentUser]);
  const postdatesSummary = useMemo(() => {
    if (!postdatesData || postdatesData.length === 0) {
      return {
        declinedPostdates: { amount: 0, count: 0 },
        recovered: { amount: 0, count: 0 },
        unrecoverable: { amount: 0, count: 0 },
        remaining: { amount: 0, count: 0 },
        rescheduled: { amount: 0, count: 0 },
        ongoing: { amount: 0, count: 0 },
        needFollowUp: { amount: 0, count: 0 },
        brokenPromise: { amount: 0, count: 0 }
      };
    }

    const summary = {
      declinedPostdates: { amount: 0, count: 0 },
      recovered: { amount: 0, count: 0 },
      unrecoverable: { amount: 0, count: 0 },
      remaining: { amount: 0, count: 0 },
      rescheduled: { amount: 0, count: 0 },
      ongoing: { amount: 0, count: 0 },
      needFollowUp: { amount: 0, count: 0 },
      brokenPromise: { amount: 0, count: 0 }
    };

    postdatesData.forEach((r: any) => {
      summary.declinedPostdates.count++;
      summary.declinedPostdates.amount += r.amount || 0;

      const status = (r.status || "").toLowerCase();
      
      if (status === "recovered") {
        summary.recovered.count++;
        summary.recovered.amount += r.amount || 0;
      } else if (status === "unrecoverable" || status === "cancelled ppa") {
        summary.unrecoverable.count++;
        summary.unrecoverable.amount += r.amount || 0;
      } else {
        summary.remaining.count++;
        summary.remaining.amount += r.amount || 0;
        
        if (status === "rescheduled") {
          summary.rescheduled.count++;
          summary.rescheduled.amount += r.amount || 0;
        } else if (status === "ongoing recovery" || status === "ongoing") {
          summary.ongoing.count++;
          summary.ongoing.amount += r.amount || 0;
        } else if (status === "need follow-up" || status === "no follow-up") {
          summary.needFollowUp.count++;
          summary.needFollowUp.amount += r.amount || 0;
        } else if (status === "broken promise") {
          summary.brokenPromise.count++;
          summary.brokenPromise.amount += r.amount || 0;
        }
      }
    });

    return summary;
  }, [postdatesData]);
  const billingData = useMemo(() => generateBillingAudits(200), []);
  const aeeRtpData = useMemo(() => accountClosureAudit.data, [accountClosureAudit.data]);
  const accountMonitoringData = useMemo(() => generateAccountMonitoringAudits(100), []);
  const callMonitoringData = useMemo(() => generateCallMonitoringAudits(50), []);
  const sevenEightDayData = useMemo(() => flaggedAccounts.data.length > 0 ? flaggedAccounts.data : generateSevenEightDayAudits(150), [flaggedAccounts.data]);
  const rpcData = useMemo(() => generateRpcAudits(50), []);

  if (activeView === 'overview') {
    return (
      <div className="p-8 space-y-8 bg-app min-h-screen animate-in fade-in duration-500 font-sans">
        <div><h1 className="text-2xl font-bold text-text-main uppercase tracking-wide">Quality Assurance</h1><p className="text-text-muted font-semibold text-[11px] tracking-widest mt-1">Audit Control Center</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AuditCard title="Onboarding Account Audit" subtext="Compliance Check" icon={ClipboardCheck} color="indigo" onClick={() => onNavigate ? onNavigate('audits', 'onboarding') : setActiveView('onboarding')} />
          <AuditCard title="Decline Recovery Audit" subtext="Post-dates Protocol" icon={CreditCard} color="pink" onClick={() => onNavigate ? onNavigate('audits', 'postdates') : setActiveView('postdates')} />
          <AuditCard title="Billing Audit" subtext="PPA Terms Audit" icon={FileText} color="emerald" onClick={() => onNavigate ? onNavigate('audits', 'billing') : setActiveView('billing')} />
          <AuditCard title="Account Closure Audit" subtext="AEE & RTP Verification" icon={Ban} color="amber" onClick={() => onNavigate ? onNavigate('audits', 'aee_rtp') : setActiveView('aee_rtp')} />
          <AuditCard title="Account Monitoring Audit" subtext="Account Routine" icon={Search} color="cyan" onClick={() => onNavigate ? onNavigate('audits', 'account_monitoring') : setActiveView('account_monitoring')} />
          <AuditCard title="Call Monitoring Audit" subtext="Call Monitoring" icon={Phone} color="violet" onClick={() => onNavigate ? onNavigate('audits', 'call_monitoring') : setActiveView('call_monitoring')} />
          <AuditCard title="Flagged Accounts Report" subtext="4-day unworked accounts" icon={CalendarX} color="orange" onClick={() => onNavigate ? onNavigate('audits', 'seven_eight_days') : setActiveView('seven_eight_days')} />
          <AuditCard title="RPC Audit" subtext="Right Party Contact" icon={UserCheck} color="teal" onClick={() => onNavigate ? onNavigate('audits', 'rpc') : setActiveView('rpc')} />
        </div>
      </div>
    );
  }

  if (activeView === 'seven_eight_days') {
      return (
          <StagnantAccountReport 
            data={sevenEightDayData} 
            isLoading={flaggedAccounts.isLoading}
            onRefresh={() => fetchFlaggedAccounts(true)}
            onBack={() => onNavigate ? window.history.back() : setActiveView('overview')} 
            onSelectAgent={(agent) => {
              if (onNavigate) {
                onNavigate('audits', 'individual_flagged', agent);
              } else {
                setActiveView('individual_flagged');
              }
            }}
            canExport={canManageDocuments} 
          />
      );
  }

  if (activeView === 'individual_flagged' && propSelectedAgent) {
    const agentData = sevenEightDayData.filter(d => 
      String(d.agentName || d.collectorName || '').trim().toLowerCase() === propSelectedAgent.toLowerCase().trim()
    );
    return (
      <StagnantAccountReport 
        data={agentData} 
        isLoading={flaggedAccounts.isLoading}
        onRefresh={() => fetchFlaggedAccounts(true)}
        title={`${propSelectedAgent}'s Flagged Accounts`}
        onBack={() => onNavigate ? window.history.back() : setActiveView('seven_eight_days')} 
        canExport={canManageDocuments} 
      />
    );
  }

  if (activeView === 'individual_onboarding' && propSelectedAgent) {
    const agentData = onboardingData.filter(d => {
      const agent = String(d.agentName || d.collectorName || '').trim().toLowerCase();
      return agent === propSelectedAgent.toLowerCase().trim();
    });
    return (
      <GenericAuditTable 
        title={`${propSelectedAgent}'s Onboarding Account Audit`} 
        data={agentData} 
        viewType="onboarding" 
        onBack={() => onNavigate ? window.history.back() : setActiveView('overview')} 
        canExport={canManageDocuments} 
        isLoading={onboardingAudits.isLoading} 
        onRefresh={() => fetchOnboardingAudits(true)} 
      />
    );
  }

  if (activeView === 'billing') {
    return (
      <BillingAuditReport 
        onBack={() => onNavigate ? window.history.back() : setActiveView('overview')} 
        canExport={canManageDocuments} 
      />
    );
  }

  let config: any = { data: [], title: "", icon: ClipboardCheck, color: "#6366f1", summaryData: null };
  switch(activeView) {
    case 'onboarding': config = { data: onboardingData, title: "Onboarding Account Audit", icon: ClipboardCheck, color: "#6366f1" }; break;
    case 'postdates': config = { data: postdatesData, title: "Decline Recovery Audit", icon: CreditCard, color: "#f472b6", summaryData: postdatesSummary }; break;
    case 'billing': config = { data: billingData, title: "Billing Audit", icon: FileText, color: "#10b981" }; break;
    case 'aee_rtp': config = { data: aeeRtpData, title: "Account Closure Audit", icon: Ban, color: "#fbbf24" }; break;
    case 'account_monitoring': config = { data: accountMonitoringData, title: "Account Monitoring Audit", icon: Search, color: "#06b6d4" }; break;
    case 'call_monitoring': config = { data: callMonitoringData, title: "Call Monitoring Audit", icon: Phone, color: "#8b5cf6" }; break;
    case 'rpc': config = { data: rpcData, title: "RPC Audit", icon: UserCheck, color: "#14b8a6" }; break;
  }

  const isLoading = activeView === 'onboarding' ? onboardingAudits.isLoading : (activeView === 'postdates' ? declineRecovery.isLoading : (activeView === 'aee_rtp' ? accountClosureAudit.isLoading : false));
  const onRefresh = activeView === 'onboarding' ? () => fetchOnboardingAudits(true) : (activeView === 'postdates' ? () => fetchDeclineRecovery(true) : (activeView === 'aee_rtp' ? () => fetchAccountClosureAudit(true) : undefined));

  return (<GenericAuditTable title={config.title} data={config.data} summaryData={config.summaryData} viewType={activeView} onBack={() => onNavigate ? window.history.back() : setActiveView('overview')} canExport={canManageDocuments} isLoading={isLoading} onRefresh={onRefresh} />);
};

const AuditCard = ({ title, subtext, icon: Icon, color, onClick }: any) => {
  const c: any = { indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600', pink: 'bg-pink-50 dark:bg-pink-900/30 text-pink-600', emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600', amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600', cyan: 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600', violet: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600', orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600', teal: 'bg-teal-50 dark:bg-teal-900/30 text-teal-600' };
  return (
    <div onClick={onClick} className="bg-card p-6 rounded-2xl border border-border-subtle shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group relative overflow-hidden h-40">
      <div className={`absolute top-0 right-0 w-24 h-24 ${c[color].split(' ')[0]} rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`} />
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div><div className={`p-2.5 rounded-xl inline-block ${c[color]}`}><Icon size={24} /></div><h3 className="text-lg font-bold text-text-main mb-0.5 mt-3">{title}</h3><p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{subtext}</p></div>
      </div>
    </div>
  );
};

const StagnantAccountReport = ({ 
    data, 
    onBack, 
    canExport, 
    onSelectAgent, 
    title,
    isLoading,
    onRefresh
}: { 
    data: SevenEightDayAudit[], 
    onBack: () => void, 
    canExport: boolean, 
    onSelectAgent?: (agent: string) => void, 
    title?: string,
    isLoading?: boolean,
    onRefresh?: () => void
}) => {
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [filterText, setFilterText] = useState('');
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState({ key: 'lastWorkedDate', direction: 'desc' });
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const sortMenuRef = useRef<HTMLDivElement>(null);
    const filterMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) setIsSortMenuOpen(false);
            if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) setIsFilterMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredData = useMemo(() => {
        let result = [...data];
        if (filterText) {
            const l = filterText.toLowerCase();
            result = result.filter(r => 
                r.accountNumber.toLowerCase().includes(l) || 
                r.debtorName.toLowerCase().includes(l) || 
                r.agentName.toLowerCase().includes(l) ||
                r.clientName.toLowerCase().includes(l) ||
                r.status.toLowerCase().includes(l)
            );
        }
        if (statusFilter.length > 0) {
            result = result.filter(r => statusFilter.includes(r.status));
        }
        result.sort((a: any, b: any) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];
            if (String(sortConfig.key).toLowerCase().includes('date')) {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            }
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return result;
    }, [data, filterText, sortConfig, statusFilter]);

    const statsPerCollector = useMemo(() => {
        const counts: Record<string, number> = {};
        data.forEach(d => counts[d.agentName] = (counts[d.agentName] || 0) + 1);
        return Object.entries(counts).sort((a,b) => b[1] - a[1]);
    }, [data]);

    const statsPerStatus = useMemo(() => {
        const counts: Record<string, number> = {};
        data.forEach(d => {
           const s = d.status || 'Unknown';
           counts[s] = (counts[s] || 0) + 1;
        });
        return Object.entries(counts).sort((a,b) => b[1] - a[1]);
    }, [data]);

    const handleExport = () => {
        const headers = ["Account #", "Debtor Full Name", "Client Full Name", "Current Claim Status", "Collector Username", "Current Balance Due", "Account Age", "Last Worked Date", "Business Days Since Worked"];
        const rows = filteredData.map(r => {
            const bizDays = getBusinessDaysCount(r.lastWorkedDate);
            return [ `"${r.accountNumber}"`, `"${r.debtorName}"`, `"${r.clientName}"`, `"${r.status}"`, `"${r.agentName}"`, r.balanceDue.toFixed(2), r.accountAge, `"${r.lastWorkedDate}"`, bizDays ];
        });
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `Flagged_Accounts_Report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const requestSort = (key: string) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
    };

    const SortIcon = ({ columnKey }: { columnKey: string }) => sortConfig.key !== columnKey ? <ArrowUpDown size={12} className="ml-1 opacity-20 inline" /> : sortConfig.direction === 'asc' ? <ArrowUp size={12} className="ml-1 inline text-indigo-600" /> : <ArrowDown size={12} className="ml-1 inline text-indigo-600" />;

    return (
        <div className="p-8 space-y-8 bg-app h-screen max-h-screen flex flex-col animate-in fade-in duration-500 font-sans overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2.5 rounded-2xl bg-card border border-border-subtle text-text-muted hover:text-indigo-600 shadow-sm transition-all group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-0.5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-text-main uppercase tracking-tight">{title || "Flagged Accounts Report"}</h1>
                        <p className="text-text-muted font-bold text-[11px] tracking-[0.2em] mt-1 uppercase">4-day unworked accounts</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-card p-1 rounded-2xl border border-border-subtle shadow-sm mr-2">
                        <button 
                            onClick={() => setViewMode('list')} 
                            className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-text-muted hover:text-indigo-600'}`}
                            title="List View"
                        >
                            <LayoutList size={20} />
                        </button>
                        <button 
                            onClick={() => setViewMode('grid')} 
                            className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg' : 'text-text-muted hover:text-indigo-600'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={20} />
                        </button>
                    </div>
                    {onRefresh && (
                        <button 
                            onClick={onRefresh} 
                            disabled={isLoading}
                            className={`p-2.5 rounded-2xl bg-card border border-border-subtle text-text-muted hover:text-indigo-600 shadow-sm transition-all ${isLoading ? 'opacity-50' : 'active:scale-95'}`}
                            title="Sync Data"
                        >
                            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    )}
                    {canExport && (
                        <button onClick={handleExport} className="flex items-center justify-center gap-2 px-6 py-2 bg-[#4f46e5] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#4338ca] shadow-lg active:scale-95 transition-all">
                            <Download size={14} /> Export CSV
                        </button>
                    )}
                </div>
            </div>

            {viewMode === 'list' && (
                <div className={`grid grid-cols-1 ${onSelectAgent ? 'lg:grid-cols-2' : ''} gap-8 shrink-0`}>
                    {onSelectAgent && (
                        <div className="bg-card p-10 rounded-[2.5rem] border border-border-subtle shadow-sm flex flex-col h-[280px]">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
                                        <Users size={20} strokeWidth={2.5} />
                                    </div>
                                    <h3 className="text-[13px] font-black text-indigo-950 dark:text-indigo-100 uppercase tracking-[0.15em]">Accounts Per Collector</h3>
                                </div>
                                <span className="text-3xl font-black text-indigo-600 font-inter">{data.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto scrollbar-thin pr-4 space-y-3">
                                {statsPerCollector.map(([name, count]) => (
                                    <div key={name} className="flex justify-between items-center group">
                                        <button 
                                          onClick={() => onSelectAgent?.(name)}
                                          className={`text-[14px] font-medium text-text-main tracking-tight transition-colors ${onSelectAgent ? 'hover:text-indigo-600 cursor-pointer' : ''}`}
                                        >
                                          {name}
                                        </button>
                                        <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[11px] font-black min-w-[32px] text-center shadow-sm">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-card p-10 rounded-[2.5rem] border border-border-subtle shadow-sm flex flex-col h-[280px]">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-xl">
                                    <LayoutGrid size={20} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-[13px] font-black text-indigo-950 dark:text-indigo-100 uppercase tracking-[0.15em]">Accounts Per Status</h3>
                            </div>
                            <span className="text-3xl font-black text-rose-500 font-inter">{data.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto scrollbar-thin pr-4 space-y-3">
                            {statsPerStatus.map(([status, count]) => (
                                <div key={status} className="flex justify-between items-center group">
                                    <span className="text-[14px] font-medium text-text-main tracking-tight group-hover:text-rose-500 transition-colors">{status}</span>
                                    <span className="bg-rose-500 text-white px-3 py-1 rounded-lg text-[11px] font-black min-w-[32px] text-center shadow-sm">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className={`flex-1 bg-card rounded-[2rem] border border-border-subtle shadow-sm overflow-hidden flex flex-col min-h-0 transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-[100] m-0 rounded-none' : ''}`}>
                <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-card shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-surface-100 text-text-muted"><CalendarDays size={18} /></div>
                        <h2 className="text-sm font-black text-text-main uppercase tracking-widest">Breakdown</h2>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative group">
                            <Search size={14} className="absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input type="text" placeholder="Search..." value={filterText} onChange={(e) => setFilterText(e.target.value)} className="pl-9 pr-4 py-2 bg-surface-100 border border-border-subtle rounded-xl text-[11px] font-medium text-text-main w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                        </div>
                        <div className="relative" ref={filterMenuRef}>
                            <button onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className={`p-2 rounded-xl border border-border-subtle transition-colors flex items-center gap-2 ${isFilterMenuOpen || statusFilter.length > 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-surface-100 text-text-muted hover:text-indigo-600'}`}>
                                <ListFilter size={18} />
                                {statusFilter.length > 0 && (
                                    <span className="flex items-center justify-center w-4 h-4 bg-indigo-600 text-white text-[9px] font-black rounded-full shadow-sm animate-in zoom-in duration-200">
                                        {statusFilter.length}
                                    </span>
                                )}
                            </button>
                            {isFilterMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border-subtle rounded-2xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 origin-top-right">
                                    <div className="flex justify-between items-center px-3 py-2 border-b border-border-subtle mb-1">
                                        <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Filter Status</p>
                                        {statusFilter.length > 0 && <button onClick={() => setStatusFilter([])} className="text-[9px] font-black text-indigo-600 hover:text-rose-500 uppercase tracking-widest transition-colors">Reset</button>}
                                    </div>
                                    <div className="max-h-60 overflow-y-auto scrollbar-thin">
                                        {['Broken Promise', 'HOT', 'Good Faith Payment', 'Open', 'Legal Review'].map(opt => (
                                            <button 
                                                key={opt} 
                                                onClick={() => setStatusFilter(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt])}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold transition-colors ${statusFilter.includes(opt) ? 'bg-indigo-600 text-white shadow-md' : 'text-text-main hover:bg-indigo-50 hover:text-indigo-600'}`}
                                            >
                                                <span className="truncate">{opt}</span>
                                                {statusFilter.includes(opt) && <Check size={12} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={() => setIsFullScreen(!isFullScreen)} 
                            className="p-2 rounded-xl border border-border-subtle bg-surface-100 text-text-muted hover:text-indigo-600 transition-colors"
                            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                        >
                            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>
                    </div>
                </div>
                {viewMode === 'list' ? (
                    <div className="flex-1 overflow-auto scrollbar-thin">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead className="sticky top-0 z-20 bg-card">
                                <tr className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-subtle bg-surface-100/50 backdrop-blur-sm">
                                    <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('accountNumber')}>Account # <SortIcon columnKey="accountNumber" /></th>
                                    <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('debtorName')}>Debtor Full Name <SortIcon columnKey="debtorName" /></th>
                                    <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('clientName')}>Client Full Name <SortIcon columnKey="clientName" /></th>
                                    <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('status')}>Claim Status <SortIcon columnKey="status" /></th>
                                    {onSelectAgent && <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('agentName')}>Collector <SortIcon columnKey="agentName" /></th>}
                                    <th className="px-6 py-5 text-right cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('balanceDue')}>Balance Due <SortIcon columnKey="balanceDue" /></th>
                                    <th className="px-6 py-5 text-center cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('accountAge')}>Age <SortIcon columnKey="accountAge" /></th>
                                    <th className="px-6 py-5 text-right cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('lastWorkedDate')}>Last Worked <SortIcon columnKey="lastWorkedDate" /></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle text-[12px]">
                                {filteredData.length > 0 ? filteredData.map((row) => (
                                    <tr key={row.id} className="hover:bg-surface-100 transition-colors group">
                                        <td className="px-6 py-4 font-black">
                                            {row.accountUrl ? (
                                                <a href={row.accountUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline hover:text-indigo-800 transition-colors">
                                                    {row.accountNumber}
                                                </a>
                                            ) : (
                                                <span className="text-indigo-600 dark:text-indigo-400">{row.accountNumber}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-text-main">{row.debtorName}</td>
                                        <td className="px-6 py-4 text-text-muted">{row.clientName}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase bg-white dark:bg-slate-800 border border-border-subtle text-text-muted shadow-sm">{row.status}</span>
                                        </td>
                                        {onSelectAgent && (
                                          <td className="px-6 py-4">
                                            <button 
                                              onClick={() => onSelectAgent?.(row.agentName)}
                                              className={`font-bold text-text-main transition-colors ${onSelectAgent ? 'hover:text-indigo-600 cursor-pointer' : ''}`}
                                            >
                                              {row.agentName}
                                            </button>
                                          </td>
                                        )}
                                        <td className="px-6 py-4 text-right font-black text-text-main font-inter">{formatCurrency(row.balanceDue)}</td>
                                        <td className="px-6 py-4 text-center font-inter text-text-muted font-medium">{row.accountAge}d</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="font-black text-text-main">
                                                    {row.lastWorkedDate ? new Date(row.lastWorkedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                                                </span>
                                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-tighter mt-0.5">
                                                    {getBusinessDaysCount(row.lastWorkedDate)}d ago
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={8} className="px-6 py-20 text-center opacity-30"><FileSearch size={48} className="mx-auto mb-4" /><p className="text-sm font-black uppercase tracking-widest">No stagnant records found</p></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto scrollbar-thin p-8 bg-surface-50/30">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                            <div className="bg-card p-6 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Total Flagged</p>
                                    <p className="text-3xl font-black text-text-main">{data.length}</p>
                                </div>
                                <div className="p-3 bg-rose-50 text-rose-500 rounded-xl"><AlertTriangle size={24} /></div>
                            </div>
                            <div className="bg-card p-6 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Active Collectors</p>
                                    <p className="text-3xl font-black text-text-main">{statsPerCollector.length}</p>
                                </div>
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Users size={24} /></div>
                            </div>
                            <div className="bg-card p-6 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Critical Risk</p>
                                    <p className="text-3xl font-black text-rose-500">{statsPerCollector.filter(([_, count]) => count > 60).length}</p>
                                </div>
                                <div className="p-3 bg-rose-50 text-rose-500 rounded-xl"><TrendingUp size={24} /></div>
                            </div>
                            <div className="bg-card p-6 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Avg. Days Inactive</p>
                                    <p className="text-3xl font-black text-text-main">{(data.reduce((sum, d) => sum + d.daysInactive, 0) / (data.length || 1)).toFixed(1)}</p>
                                </div>
                                <div className="p-3 bg-slate-50 text-slate-500 rounded-xl"><Clock size={24} /></div>
                            </div>
                        </div>

                        {onSelectAgent ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {statsPerCollector.map(([name, count]) => {
                                const status = count > 60 ? 'CRITICAL' : count > 30 ? 'WATCH' : 'OK';
                                const statusColor = status === 'CRITICAL' ? 'bg-rose-500 text-white' : status === 'WATCH' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white';
                                const borderTopColor = status === 'CRITICAL' ? 'border-t-rose-500' : status === 'WATCH' ? 'border-t-amber-500' : 'border-t-emerald-500';
                                
                                return (
                                    <button 
                                        key={name}
                                        onClick={() => onSelectAgent?.(name)}
                                        className={`bg-card p-8 rounded-3xl border border-border-subtle border-t-4 ${borderTopColor} shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-start text-left group relative overflow-hidden`}
                                    >
                                        <div className="flex justify-between items-start w-full mb-6">
                                            <h4 className="text-lg font-black text-text-main uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{name}</h4>
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest ${statusColor} shadow-sm`}>{status}</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className={`text-5xl font-black font-inter ${status === 'CRITICAL' ? 'text-rose-500' : status === 'WATCH' ? 'text-amber-500' : 'text-emerald-500'}`}>{count}</span>
                                            <span className="text-[11px] font-black text-text-muted uppercase tracking-widest">Flagged</span>
                                        </div>
                                        <div className="mt-6 w-full h-1.5 bg-surface-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${status === 'CRITICAL' ? 'bg-rose-500' : status === 'WATCH' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${Math.min(100, (count / 100) * 100)}%` }}
                                            />
                                        </div>
                                        <div className="absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronRight size={20} className="text-text-muted" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredData.map((row) => (
                                <div 
                                    key={row.id}
                                    className="bg-card p-6 rounded-3xl border border-border-subtle shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Account #</span>
                                            {row.accountUrl ? (
                                                <a href={row.accountUrl} target="_blank" rel="noopener noreferrer" className="text-lg font-black text-text-main hover:text-indigo-600 transition-colors">
                                                    {row.accountNumber}
                                                </a>
                                            ) : (
                                                <span className="text-lg font-black text-text-main">{row.accountNumber}</span>
                                            )}
                                        </div>
                                        <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase bg-surface-100 border border-border-subtle text-text-muted shadow-sm">{row.status}</span>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-0.5">Debtor</p>
                                            <p className="text-sm font-bold text-text-main truncate">{row.debtorName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-0.5">Client</p>
                                            <p className="text-xs font-medium text-text-muted truncate">{row.clientName}</p>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-border-subtle grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-0.5">Balance</p>
                                            <p className="text-sm font-black text-text-main font-inter">{formatCurrency(row.balanceDue)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-0.5">Inactive</p>
                                            <p className="text-sm font-black text-rose-500 font-inter">{getBusinessDaysCount(row.lastWorkedDate)}d</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={12} className="text-text-muted" />
                                            <span className="text-[10px] font-bold text-text-muted">Last: {row.lastWorkedDate}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Target size={12} className="text-text-muted" />
                                            <span className="text-[10px] font-bold text-text-muted">Age: {row.accountAge}d</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            </div>
        </div>
    );
};

const GenericAuditTable = ({ title, data: rawData, summaryData, viewType, onBack, canExport, isLoading, onRefresh }: any) => {
  const [filterText, setFilterText] = useState('');
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'}>(() => {
    if (viewType === 'onboarding') return { key: 'auditResult', direction: 'asc' };
    if (viewType === 'postdates') return { key: 'transactionDate', direction: 'desc' };
    if (viewType === 'rpc') return { key: 'callDate', direction: 'desc' };
    return { key: 'dateAudited', direction: 'desc' };
  });

  useEffect(() => {
    if (viewType === 'onboarding') setSortConfig({ key: 'auditResult', direction: 'asc' });
    else if (viewType === 'postdates') setSortConfig({ key: 'transactionDate', direction: 'desc' });
    else if (viewType === 'rpc') setSortConfig({ key: 'callDate', direction: 'desc' });
    else setSortConfig({ key: 'dateAudited', direction: 'desc' });
  }, [viewType]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  });
  
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) setIsFilterMenuOpen(false);
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) setIsSortMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredData = useMemo(() => {
    let data = [...rawData];
    
    // Date range filtering
    if ((dateRange.start || dateRange.end) && String(viewType).toLowerCase() !== 'onboarding') {
      data = data.filter(i => {
        let dateVal = i.dateAudit || i.dateAudited || i.transactionDate || i.callDate;
        if (!dateVal) return true;
        if (typeof dateVal === 'string') {
            dateVal = dateVal.replace(/\s+[l|]\s+/g, ' ');
        }
        const d = new Date(dateVal).getTime();
        if (isNaN(d)) return true;
        const start = dateRange.start ? new Date(dateRange.start).getTime() : -Infinity;
        const end = dateRange.end ? new Date(dateRange.end).getTime() + 86400000 : Infinity; // +1 day to include the end date
        return d >= start && d <= end;
      });
    }

    if (filterText) { 
      const l = filterText.toLowerCase(); 
      data = data.filter(i => Object.values(i).some(v => String(v).toLowerCase().includes(l))); 
    }
    if (statusFilter.length > 0) {
      const lowerFilters = statusFilter.map(f => f.toLowerCase());
      data = data.filter(i => {
        if (viewType === 'onboarding') return lowerFilters.includes(String(i.auditResult || '').trim().toLowerCase());
        if (viewType === 'postdates') return lowerFilters.includes(String(i.status || i.paymentStatus || '').trim().toLowerCase());
        if (viewType === 'billing') return lowerFilters.includes(String(i.ppaAction || '').trim().toLowerCase());
        if (viewType === 'aee_rtp') return lowerFilters.includes(String(i.outcome || '').trim().toLowerCase());
        if (viewType === 'rpc') return lowerFilters.includes(String(i.caseUpdate || '').trim().toLowerCase()) || lowerFilters.includes(String(i.rpcType || '').trim().toLowerCase());
        return true;
      });
    }
    data.sort((a, b) => { 
      let aV = a[sortConfig.key]; 
      let bV = b[sortConfig.key];

      if (sortConfig.key === 'auditResult') {
        const order: Record<string, number> = { 'failed': 1, 'pending': 2, 'passed': 3 };
        const aOrder = order[String(aV || '').trim().toLowerCase()] || 4;
        const bOrder = order[String(bV || '').trim().toLowerCase()] || 4;
        
        if (aOrder < bOrder) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aOrder > bOrder) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }

      if (String(sortConfig.key).toLowerCase().includes('date')) {
          if (typeof aV === 'string') aV = aV.replace(/\s+[l|]\s+/g, ' ');
          if (typeof bV === 'string') bV = bV.replace(/\s+[l|]\s+/g, ' ');
          aV = new Date(aV).getTime();
          bV = new Date(bV).getTime();
          if (isNaN(aV)) aV = 0;
          if (isNaN(bV)) bV = 0;
      }
      if (aV < bV) return sortConfig.direction === 'asc' ? -1 : 1; 
      if (aV > bV) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [rawData, filterText, sortConfig, statusFilter, viewType, dateRange]);

  const stats = useMemo(() => {
      if (viewType === 'rpc') {
          const totalRpc = filteredData.length;
          const totalPayment = filteredData.reduce((sum: number, item: any) => sum + (item.paymentAmount || 0), 0);
          const conversionRate = totalRpc > 0 ? ((filteredData.filter((i: any) => i.caseUpdate === 'Collected').length / totalRpc) * 100).toFixed(1) : "0.0";
          
          return {
              totalRpc,
              totalPayment,
              conversionRate
          };
      }
      if (viewType === 'postdates') {
          if (summaryData) {
              return {
                  declinedCount: summaryData.declinedPostdates?.count || 0,
                  declinedAmount: summaryData.declinedPostdates?.amount || 0,
                  recoveredCount: summaryData.recovered?.count || 0,
                  recoveredAmount: summaryData.recovered?.amount || 0,
                  remainingCount: summaryData.remaining?.count || 0,
                  remainingAmount: summaryData.remaining?.amount || 0,
                  unrecoverableCount: summaryData.unrecoverable?.count || 0,
                  unrecoverableAmount: summaryData.unrecoverable?.amount || 0,
                  subFields: {
                      rescheduled: summaryData.rescheduled?.count || 0,
                      ongoing: summaryData.ongoing?.count || 0,
                      followUp: summaryData.needFollowUp?.count || 0,
                      broken: summaryData.brokenPromise?.count || 0,
                  }
              };
          }

          const declinedItems = rawData;
          const recoveredItems = rawData.filter((i:any) => (i.status || i.paymentStatus) === 'Recovered');
          const remainingItems = rawData.filter((i:any) => ['Rescheduled', 'Ongoing Recovery', 'Ongoing', 'No Follow-up', 'Need Follow-up', 'Broken Promise'].includes(i.status || i.paymentStatus));
          const unrecoverableItems = rawData.filter((i:any) => ['Cancelled PPA', 'Unrecoverable'].includes(i.status || i.paymentStatus));

          return {
              declinedCount: declinedItems.length,
              declinedAmount: declinedItems.reduce((s:number, i:any) => s + (i.amount || i.paymentAmount || 0), 0),
              recoveredCount: recoveredItems.length,
              recoveredAmount: recoveredItems.reduce((s:number, i:any) => s + (i.amount || i.paymentAmount || 0), 0),
              remainingCount: remainingItems.length,
              remainingAmount: remainingItems.reduce((s:number, i:any) => s + (i.amount || i.paymentAmount || 0), 0),
              unrecoverableCount: unrecoverableItems.length,
              unrecoverableAmount: unrecoverableItems.reduce((s:number, i:any) => s + (i.amount || i.paymentAmount || 0), 0),
              subFields: {
                  rescheduled: remainingItems.filter((i:any) => (i.status || i.paymentStatus) === 'Rescheduled').length,
                  ongoing: remainingItems.filter((i:any) => ['Ongoing Recovery', 'Ongoing'].includes(i.status || i.paymentStatus)).length,
                  followUp: remainingItems.filter((i:any) => ['No Follow-up', 'Need Follow-up'].includes(i.status || i.paymentStatus)).length,
                  broken: remainingItems.filter((i:any) => (i.status || i.paymentStatus) === 'Broken Promise').length,
              }
          };
      }
      if (viewType === 'billing') {
          return {
              noUpdate: rawData.filter((i:any) => i.ppaAction === 'No Update Needed').length,
              update: rawData.filter((i:any) => i.ppaAction === 'Update PPA').length,
              delete: rawData.filter((i:any) => i.ppaAction === 'Delete PPA').length,
          };
      }
      if (viewType === 'aee_rtp') {
          return {
              keep: rawData.filter((i:any) => String(i.auditResult || i.outcome || '').includes('Keep')).length,
              aee: rawData.filter((i:any) => String(i.auditResult || i.outcome || '').includes('AEE')).length,
              rtp: rawData.filter((i:any) => String(i.auditResult || i.outcome || '').includes('RTP')).length,
              bankrupt: rawData.filter((i:any) => String(i.auditResult || i.outcome || '').includes('Bankruptcy')).length,
          };
      }
      const total = rawData.length; 
      const passed = rawData.filter((d:any) => String(d.auditResult || '').trim().toLowerCase() === 'passed').length; 
      const failed = rawData.filter((d:any) => String(d.auditResult || '').trim().toLowerCase() === 'failed').length;
      const pending = rawData.filter((d:any) => String(d.auditResult || '').trim().toLowerCase() === 'pending').length;
      return { total, passed, failed, pending, rate: total > 0 ? ((passed / total) * 100).toFixed(0) : "0" };
  }, [rawData, viewType, filteredData, summaryData]);

  const requestSort = (key: string) => {
      setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => sortConfig.key !== columnKey ? <ArrowUpDown size={12} className="ml-1 opacity-20 inline" /> : sortConfig.direction === 'asc' ? <ArrowUp size={12} className="ml-1 inline text-indigo-600" /> : <ArrowDown size={12} className="ml-1 inline text-indigo-600" />;

  const handleExport = () => {
    let headers: string[] = [];
    let rows: any[] = [];

    if (viewType === 'onboarding') {
      headers = ["Account #", "Collector Name", "Date Assigned", "Date Activated", "Date Audit", "Result", "Comments"];
      rows = filteredData.map(r => [ `"${r.accountNumber}"`, `"${r.collectorName}"`, `"${r.dateAssigned}"`, `"${r.dateActivated}"`, `"${r.dateAudit}"`, `"${r.auditResult}"`, `"${r.comments?.replace(/"/g, '""') || ''}"` ]);
    } else if (viewType === 'postdates') {
      headers = ["Transaction Date", "Account #", "Agent Name", "Amount", "Status", "Recovery Date", "Findings"];
      rows = filteredData.map(r => [ `"${r.transactionDate}"`, `"${r.accountNumber}"`, `"${r.collectorName || r.agentName}"`, (r.amount || r.paymentAmount || 0).toFixed(2), `"${r.status || r.paymentStatus}"`, `"${r.recoveryDate || '-'}"`, `"${r.auditComments || r.auditFindings || ''}"` ]);
    } else if (viewType === 'billing') {
      headers = ["Account #", "Agent Name", "Client Name", "Account Status", "Agreement Amount", "Overdue Amount", "Overdue Date", "PPA Action", "Findings"];
      rows = filteredData.map(r => [ `"${r.accountNumber}"`, `"${r.agentName}"`, `"${r.clientName}"`, `"${r.accountStatus}"`, r.agreementAmount.toFixed(2), r.overdueAmount.toFixed(2), `"${r.overdueDate}"`, `"${r.ppaAction}"`, `"${r.auditFindings || ''}"` ]);
    } else if (viewType === 'aee_rtp') {
      headers = ["Account #", "Collector Name", "Claim Status", "Client Full Name", "Account Type", "Current Balance Due", "Account Age", "Audit Result", "Findings"];
      rows = filteredData.map(r => [ 
        `"${r.accountNumber}"`, 
        `"${r.collectorName || r.agentName}"`, 
        `"${r.claimStatus || r.accountStatus}"`, 
        `"${r.clientName}"`, 
        `"${r.accountType}"`, 
        (Number(r.balance || r.balanceDue) || 0).toFixed(2), 
        r.age || r.accountAge, 
        `"${r.auditResult || r.outcome}"`, 
        `"${r.auditComments || r.auditFindings || ''}"` 
      ]);
    } else {
      headers = ["Account #", "Agent Name", "Date Audited", "Result", "Comments"];
      rows = filteredData.map(r => [ `"${r.accountNumber}"`, `"${r.agentName}"`, `"${r.dateAudited}"`, `"${r.auditResult}"`, `"${r.auditComments.replace(/"/g, '""')}"` ]);
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_Log.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSortOptions = () => {
    switch(viewType) {
        case 'onboarding': return [{label: 'Account #', key: 'accountNumber'}, {label: 'Collector Name', key: 'collectorName'}, {label: 'Date Assigned', key: 'dateAssigned'}, {label: 'Date Activated', key: 'dateActivated'}, {label: 'Date Audit', key: 'dateAudit'}, {label: 'Result', key: 'auditResult'}];
        case 'postdates': return [{label: 'Date', key: 'transactionDate'}, {label: 'Account #', key: 'accountNumber'}, {label: 'Agent', key: 'collectorName'}, {label: 'Amount', key: 'amount'}, {label: 'Status', key: 'status'}, {label: 'Recovery Date', key: 'recoveryDate'}];
        case 'billing': return [{label: 'Account #', key: 'accountNumber'}, {label: 'Agent', key: 'agentName'}, {label: 'Client', key: 'clientName'}, {label: 'Account Status', key: 'accountStatus'}, {label: 'Agreement', key: 'agreementAmount'}, {label: 'Overdue Amount', key: 'overdueAmount'}, {label: 'Overdue Date', key: 'overdueDate'}, {label: 'PPA Action', key: 'ppaAction'}];
        case 'aee_rtp': return [{label: 'Account #', key: 'accountNumber'}, {label: 'Collector', key: 'collectorName'}, {label: 'Claim Status', key: 'claimStatus'}, {label: 'Client Name', key: 'clientName'}, {label: 'Type', key: 'accountType'}, {label: 'Balance', key: 'balance'}, {label: 'Age', key: 'age'}, {label: 'Audit Result', key: 'auditResult'}];
        default: return [{label: 'Account #', key: 'accountNumber'}, {label: 'Agent', key: 'agentName'}, {label: 'Date Audited', key: 'dateAudited'}, {label: 'Result', key: 'auditResult'}];
    }
  };

  const getFilterOptions = () => {
    switch(viewType) {
        case 'onboarding': return ['Passed', 'Failed', 'Pending'];
        case 'postdates': return ['Recovered', 'Ongoing', 'Need Follow-up', 'Broken Promise', 'Rescheduled', 'Unrecoverable'];
        case 'billing': return ['No Update Needed', 'Update PPA', 'Delete PPA', 'Follow-Up PPA'];
        case 'aee_rtp': return ['Keep - Reworkable', 'Client Return - AEE', 'Client Return - RTP', 'Pending Bankruptcy'];
        case 'rpc': return ['Collected', 'Ghosted', 'RTP', 'Debtor', '3rd Party', 'Wrong Number'];
        default: return [];
    }
  };

  const toggleFilter = (opt: string) => {
    setStatusFilter(prev => 
      prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]
    );
  };

  const renderTableHeaders = () => {
    if (viewType === 'onboarding') {
      return (
        <tr className="text-[10px] font-black text-text-muted uppercase border-b border-border-subtle bg-surface-100/50">
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('accountNumber')}>Account # <SortIcon columnKey="accountNumber" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('collectorName')}>Collector <SortIcon columnKey="collectorName" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('dateAssigned')}>Assigned <SortIcon columnKey="dateAssigned" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('dateActivated')}>Activated <SortIcon columnKey="dateActivated" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('dateAudit')}>Audited <SortIcon columnKey="dateAudit" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('auditResult')}>Result <SortIcon columnKey="auditResult" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('comments')}>Comments <SortIcon columnKey="comments" /></th>
        </tr>
      );
    }
    if (viewType === 'postdates') {
      return (
        <tr className="text-[10px] font-black text-text-muted uppercase border-b border-border-subtle bg-surface-100/50">
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('transactionDate')}>Transaction Date & Time <SortIcon columnKey="transactionDate" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('accountNumber')}>Account # <SortIcon columnKey="accountNumber" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('collectorName')}>Agent Name <SortIcon columnKey="collectorName" /></th>
          <th className="px-6 py-5 text-right cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('amount')}>Amount <SortIcon columnKey="amount" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('status')}>Status <SortIcon columnKey="status" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('recoveryDate')}>Recovery Date <SortIcon columnKey="recoveryDate" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('auditComments')}>Findings <SortIcon columnKey="auditComments" /></th>
        </tr>
      );
    }
    if (viewType === 'billing') {
      return (
        <tr className="text-[10px] font-black text-text-muted uppercase border-b border-border-subtle bg-surface-100/50">
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('accountNumber')}>Account # <SortIcon columnKey="accountNumber" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('agentName')}>Agent Name <SortIcon columnKey="agentName" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('clientName')}>Client Name <SortIcon columnKey="clientName" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('accountStatus')}>Account Status <SortIcon columnKey="accountStatus" /></th>
          <th className="px-6 py-5 text-right cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('agreementAmount')}>Agreement <SortIcon columnKey="agreementAmount" /></th>
          <th className="px-6 py-5 text-right cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('overdueAmount')}>Overdue <SortIcon columnKey="overdueAmount" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('overdueDate')}>Overdue Date <SortIcon columnKey="overdueDate" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('ppaAction')}>PPA Action <SortIcon columnKey="ppaAction" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('auditFindings')}>Findings <SortIcon columnKey="auditFindings" /></th>
        </tr>
      );
    }
    if (viewType === 'aee_rtp') {
      return (
        <tr className="text-[10px] font-black text-text-muted uppercase border-b border-border-subtle bg-surface-100/50">
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('accountNumber')}>Account # <SortIcon columnKey="accountNumber" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('collectorName')}>Collector <SortIcon columnKey="collectorName" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('claimStatus')}>Claim Status <SortIcon columnKey="claimStatus" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('clientName')}>Client Name <SortIcon columnKey="clientName" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('accountType')}>Type <SortIcon columnKey="accountType" /></th>
          <th className="px-6 py-5 text-right cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('balance')}>Balance <SortIcon columnKey="balance" /></th>
          <th className="px-6 py-5 text-center cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('age')}>Age <SortIcon columnKey="age" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('auditResult')}>Audit Result <SortIcon columnKey="auditResult" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('auditComments')}>Findings <SortIcon columnKey="auditComments" /></th>
        </tr>
      );
    }
    if (viewType === 'rpc') {
      return (
        <tr className="text-[10px] font-black text-text-muted uppercase border-b border-border-subtle bg-surface-100/50">
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('accountNumber')}>Account # <SortIcon columnKey="accountNumber" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('agentName')}>Agent <SortIcon columnKey="agentName" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('callDate')}>Call Date <SortIcon columnKey="callDate" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('rpcType')}>RPC Type <SortIcon columnKey="rpcType" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('caseUpdate')}>Case Update <SortIcon columnKey="caseUpdate" /></th>
          <th className="px-6 py-5 text-right cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('paymentAmount')}>Payment <SortIcon columnKey="paymentAmount" /></th>
          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('auditResult')}>Result <SortIcon columnKey="auditResult" /></th>
        </tr>
      );
    }
    return (
      <tr className="text-[10px] font-black text-text-muted uppercase border-b border-border-subtle bg-surface-100/50">
        <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('accountNumber')}>Account # <SortIcon columnKey="accountNumber" /></th>
        <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('agentName')}>Agent <SortIcon columnKey="agentName" /></th>
        <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('dateAudited')}>Date Audited <SortIcon columnKey="dateAudited" /></th>
        <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('auditResult')}>Result <SortIcon columnKey="auditResult" /></th>
        <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('auditComments')}>Comments <SortIcon columnKey="auditComments" /></th>
      </tr>
    );
  };

  const renderTableRows = (row: any, i: number) => {
    if (viewType === 'onboarding') {
      return (
        <tr key={i} className="hover:bg-surface-100 transition-colors">
          <td className="px-6 py-4 font-black text-indigo-600">
            {row.accountUrl ? (
              <a href={row.accountUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {row.accountNumber}
              </a>
            ) : (
              row.accountNumber
            )}
          </td>
          <td className="px-6 py-4 font-bold text-text-main">{row.collectorName}</td>
          <td className="px-6 py-4 text-text-muted">{formatLongDate(row.dateAssigned)}</td>
          <td className="px-6 py-4 text-text-muted">{formatLongDate(row.dateActivated)}</td>
          <td className="px-6 py-4 text-text-muted">{formatLongDate(row.dateAudit)}</td>
          <td className="px-6 py-4">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${String(row.auditResult || '').trim().toLowerCase() === 'passed' ? 'bg-emerald-50 text-emerald-600' : (String(row.auditResult || '').trim().toLowerCase() === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600')}`}>{row.auditResult}</span>
          </td>
          <td className="px-6 py-4 text-text-muted italic truncate max-w-xs" title={row.comments}>{row.comments || '-'}</td>
        </tr>
      );
    }
    if (viewType === 'postdates') {
      const statusColors: any = {
        'Recovered': 'bg-emerald-50 text-emerald-600',
        'Ongoing Recovery': 'bg-orange-50 text-orange-600',
        'No Follow-up': 'bg-rose-50 text-rose-600',
        'Broken Promise': 'bg-purple-50 text-purple-600',
        'Rescheduled': 'bg-amber-50 text-amber-600',
        'Cancelled PPA': 'bg-slate-200 text-slate-800'
      };

      return (
        <tr key={i} className="hover:bg-surface-100 transition-colors">
          <td className="px-6 py-4 text-text-muted font-inter">{row.transactionDate}</td>
          <td className="px-6 py-4 font-black text-indigo-600">
            {row.accountUrl ? (
              <a href={row.accountUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {row.accountNumber}
              </a>
            ) : (
              row.accountNumber
            )}
          </td>
          <td className="px-6 py-4 font-bold text-text-main">{row.collectorName || row.agentName}</td>
          <td className="px-6 py-4 text-right font-inter font-bold">${(row.amount || row.paymentAmount || 0).toFixed(2)}</td>
          <td className="px-6 py-4">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${statusColors[row.status || row.paymentStatus] || 'bg-surface-100 text-text-muted'}`}>
                {row.status || row.paymentStatus}
            </span>
          </td>
          <td className="px-6 py-4 text-text-muted">{row.recoveryDate || '-'}</td>
          <td className="px-6 py-4 text-text-muted italic truncate max-w-xs">{row.auditComments || row.auditFindings}</td>
        </tr>
      );
    }
    if (viewType === 'billing') {
      return (
        <tr key={i} className="hover:bg-surface-100 transition-colors">
          <td className="px-6 py-4 font-black text-indigo-600">
            {row.accountUrl ? (
              <a href={row.accountUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {row.accountNumber}
              </a>
            ) : (
              row.accountNumber
            )}
          </td>
          <td className="px-6 py-4 font-bold text-text-main">{row.agentName}</td>
          <td className="px-6 py-4 text-text-muted">{row.clientName}</td>
          <td className="px-6 py-4">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-surface-100 text-text-muted">{row.accountStatus}</span>
          </td>
          <td className="px-6 py-4 text-right font-inter font-bold">${row.agreementAmount.toFixed(2)}</td>
          <td className="px-6 py-4 text-right font-inter font-bold text-rose-500">${row.overdueAmount.toFixed(2)}</td>
          <td className="px-6 py-4 text-text-muted">{row.overdueDate}</td>
          <td className="px-6 py-4">
             <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
               row.ppaAction === 'No Update Needed' ? 'text-emerald-600' : 
               row.ppaAction === 'Update PPA' ? 'text-amber-500' :
               row.ppaAction === 'Delete PPA' ? 'text-rose-600' :
               row.ppaAction === 'Follow-Up PPA' ? 'text-fuchsia-600' :
               'text-indigo-600'
             }`}>{row.ppaAction}</span>
          </td>
          <td className="px-6 py-4 text-text-muted italic truncate max-w-xs">{row.auditFindings}</td>
        </tr>
      );
    }
    if (viewType === 'aee_rtp') {
      return (
        <tr key={i} className="hover:bg-surface-100 transition-colors">
          <td className="px-6 py-4 font-black text-indigo-600">
            {row.accountUrl ? (
              <a href={row.accountUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {row.accountNumber}
              </a>
            ) : (
              row.accountNumber
            )}
          </td>
          <td className="px-6 py-4 font-bold text-text-main">{row.collectorName || row.agentName}</td>
          <td className="px-6 py-4">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-surface-100 text-text-muted">{row.claimStatus || row.accountStatus}</span>
          </td>
          <td className="px-6 py-4 text-text-muted">{row.clientName}</td>
          <td className="px-6 py-4 text-center">
            <span className="text-[10px] font-black text-text-muted opacity-60">{row.accountType}</span>
          </td>
          <td className="px-6 py-4 text-right font-inter font-bold">${(Number(row.balance || row.balanceDue) || 0).toFixed(2)}</td>
          <td className="px-6 py-4 text-center text-text-muted">{row.age || row.accountAge}d</td>
          <td className="px-6 py-4">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${String(row.auditResult || row.outcome || '').includes('Return') ? 'text-rose-600' : 'text-indigo-600'}`}>{row.auditResult || row.outcome}</span>
          </td>
          <td className="px-6 py-4 text-text-muted italic truncate max-w-xs" title={row.auditComments || row.auditFindings}>{row.auditComments || row.auditFindings || '-'}</td>
        </tr>
      );
    }
    if (viewType === 'rpc') {
      return (
        <tr key={i} className="hover:bg-surface-100 transition-colors">
          <td className="px-6 py-4 font-black text-indigo-600">
            {row.accountUrl ? (
              <a href={row.accountUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {row.accountNumber}
              </a>
            ) : (
              row.accountNumber
            )}
          </td>
          <td className="px-6 py-4 font-bold text-text-main">{row.agentName}</td>
          <td className="px-6 py-4 text-text-muted">{row.callDate}</td>
          <td className="px-6 py-4 text-text-muted">{row.rpcType}</td>
          <td className="px-6 py-4">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${row.caseUpdate === 'Collected' ? 'bg-emerald-50 text-emerald-600' : (row.caseUpdate === 'RTP' ? 'bg-rose-50 text-rose-600' : 'bg-surface-100 text-text-muted')}`}>{row.caseUpdate}</span>
          </td>
          <td className="px-6 py-4 text-right font-inter font-bold text-emerald-600">{row.paymentAmount > 0 ? formatCurrency(row.paymentAmount) : '-'}</td>
          <td className="px-6 py-4">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.auditResult === 'Passed' ? 'bg-emerald-50 text-emerald-600' : (row.auditResult === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600')}`}>{row.auditResult}</span>
          </td>
        </tr>
      );
    }
    return (
      <tr key={i} className="hover:bg-surface-100 transition-colors">
        <td className="px-6 py-4 font-black text-indigo-600">
          {row.accountUrl ? (
            <a href={row.accountUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {row.accountNumber}
            </a>
          ) : (
            row.accountNumber
          )}
        </td>
        <td className="px-6 py-4 font-bold text-text-main">{row.agentName}</td>
        <td className="px-6 py-4 text-text-muted">{row.dateAudited}</td>
        <td className="px-6 py-4">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.auditResult === 'Passed' ? 'bg-emerald-50 text-emerald-600' : (row.auditResult === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600')}`}>{row.auditResult}</span>
        </td>
        <td className="px-6 py-4 text-text-muted italic truncate max-w-xs">{row.auditComments}</td>
      </tr>
    );
  };

  const renderStats = () => {
      if (viewType === 'rpc') {
          return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                  <div className="bg-card p-6 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between transition-all hover:shadow-md group">
                      <div>
                          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Total RPC</p>
                          <p className="text-3xl font-black text-text-main">{stats.totalRpc}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
                          <FileText size={24} />
                      </div>
                  </div>
                  <div className="bg-card p-6 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between transition-all hover:shadow-md group">
                      <div>
                          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Total Payment</p>
                          <p className="text-3xl font-black text-emerald-600">{formatCurrency(stats.totalPayment)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
                          <DollarSign size={24} />
                      </div>
                  </div>
                  <div className="bg-card p-6 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between transition-all hover:shadow-md group">
                      <div>
                          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Conversion Rate</p>
                          <p className="text-3xl font-black text-amber-600">{stats.conversionRate}%</p>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
                          <TrendingUp size={24} />
                      </div>
                  </div>
              </div>
          );
      }
      if (viewType === 'onboarding') {
          return (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 shrink-0">
                <div className="bg-card p-5 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between transition-all hover:shadow-md"><div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Total</p><p className="text-3xl font-black text-text-main">{stats.total}</p></div><FileSearch size={24} className="text-text-muted opacity-30" /></div>
                <div className="bg-card p-5 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between transition-all hover:shadow-md"><div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Passed</p><p className="text-3xl font-black text-emerald-500">{stats.passed}</p></div><CheckCircle2 size={24} className="text-emerald-500 opacity-30" /></div>
                <div className="bg-card p-5 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between transition-all hover:shadow-md"><div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Failed</p><p className="text-3xl font-black text-rose-500">{stats.failed}</p></div><AlertTriangle size={24} className="text-rose-500 opacity-30" /></div>
                <div className="bg-card p-5 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between transition-all hover:shadow-md"><div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Pending</p><p className="text-3xl font-black text-amber-500">{stats.pending}</p></div><Clock size={24} className="text-amber-500 opacity-30" /></div>
                <div className="bg-card p-5 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between transition-all hover:shadow-md"><div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Rate</p><p className="text-3xl font-black text-indigo-500">{stats.rate}%</p></div><TrendingUp size={24} className="text-indigo-500 opacity-30" /></div>
              </div>
          );
      }
      if (viewType === 'postdates') {
          return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0 h-auto">
                  <DualStatCard label="Declined Postdates" val={formatCurrency(stats.declinedAmount)} count={stats.declinedCount} icon={AlertTriangle} color="rose" />
                  <DualStatCard label="Recovered" val={formatCurrency(stats.recoveredAmount)} count={stats.recoveredCount} icon={CheckCircle2} color="emerald" />
                  <DualStatCard label="Unrecoverable" val={formatCurrency(stats.unrecoverableAmount)} count={stats.unrecoverableCount} icon={Ban} color="slate" />
                  <div className="bg-card p-6 rounded-[2rem] border border-border-subtle shadow-sm flex flex-col justify-between transition-all hover:shadow-md relative overflow-hidden group min-h-[140px]">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Remaining</p>
                            <p className="text-xl font-inter font-black text-amber-500">{formatCurrency(stats.remainingAmount)}</p>
                            <p className="text-[9px] font-bold text-text-muted uppercase">{stats.remainingCount} Transactions</p>
                        </div>
                        <Clock size={24} className="text-amber-500 opacity-30 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2 border-t border-border-subtle">
                         <div className="flex justify-between items-center text-[9px] font-bold text-text-muted"><span>Rescheduled:</span> <span className="text-amber-600">{stats.subFields.rescheduled}</span></div>
                         <div className="flex justify-between items-center text-[9px] font-bold text-text-muted"><span>Ongoing:</span> <span className="text-amber-600">{stats.subFields.ongoing}</span></div>
                         <div className="flex justify-between items-center text-[9px] font-bold text-text-muted"><span>Need Follow-up:</span> <span className="text-amber-600">{stats.subFields.followUp}</span></div>
                         <div className="flex justify-between items-center text-[9px] font-bold text-text-muted"><span>Broken Promise:</span> <span className="text-amber-600">{stats.subFields.broken}</span></div>
                      </div>
                  </div>
              </div>
          );
      }
      if (viewType === 'billing') {
          return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                  <StatCard label="No Update Needed" val={stats.noUpdate} icon={CheckCircle2} color="emerald" />
                  <StatCard label="Update PPA" val={stats.update} icon={RotateCcw} color="amber" />
                  <StatCard label="Delete PPA" val={stats.delete} icon={Ban} color="rose" />
              </div>
          );
      }
      if (viewType === 'aee_rtp') {
          return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
                  <StatCard label="Keep - Reworkable" val={stats.keep} icon={RotateCcw} color="indigo" />
                  <StatCard label="Client Return - AEE" val={stats.aee} icon={Ban} color="amber" />
                  <StatCard label="Client Return - RTP" val={stats.rtp} icon={XCircle} color="rose" />
                  <StatCard label="Pending Bankruptcy" val={stats.bankrupt} icon={FileBarChart} color="slate" />
              </div>
          );
      }
      return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
            <div className="bg-card p-5 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between transition-all hover:shadow-md"><div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Total</p><p className="text-3xl font-black text-text-main">{stats.total}</p></div><FileSearch size={24} className="text-text-muted opacity-30" /></div>
            <div className="bg-card p-5 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between transition-all hover:shadow-md"><div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Passed</p><p className="text-3xl font-black text-emerald-500">{stats.passed}</p></div><CheckCircle2 size={24} className="text-emerald-500 opacity-30" /></div>
            <div className="bg-card p-5 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between transition-all hover:shadow-md"><div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Failed</p><p className="text-3xl font-black text-rose-500">{stats.failed}</p></div><AlertTriangle size={24} className="text-rose-500 opacity-30" /></div>
            <div className="bg-card p-5 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between transition-all hover:shadow-md"><div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Rate</p><p className="text-3xl font-black text-indigo-500">{stats.rate}%</p></div><TrendingUp size={24} className="text-indigo-500 opacity-30" /></div>
          </div>
  );
};

  return (
    <div className="p-8 space-y-8 bg-app h-screen max-h-screen flex flex-col animate-in fade-in duration-500 font-sans overflow-hidden">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2.5 rounded-2xl bg-card border border-border-subtle text-text-muted hover:text-indigo-600 shadow-sm transition-all group">
              <ArrowLeft size={20} className="group-hover:-translate-x-0.5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-text-main uppercase tracking-tight">{title}</h1>
              <p className="text-text-muted font-bold text-[11px] tracking-[0.2em] mt-1 uppercase">Detailed Quality Analysis</p>
            </div>
          </div>
          {canExport && (
            <button onClick={handleExport} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 shadow-lg active:scale-95 transition-all">
                <Download size={14} /> Download CSV
            </button>
          )}
       </div>

       {renderStats()}

       <div className="flex-1 bg-card rounded-[2rem] border border-border-subtle shadow-sm overflow-hidden flex flex-col min-h-0">
          <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-card shrink-0">
             <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-surface-100 text-text-muted">
                    <ClipboardCheck size={18} />
                </div>
                <h2 className="text-sm font-black text-text-main uppercase tracking-widest">Audit Records</h2>
             </div>
              <div className="flex flex-wrap items-center gap-2">
                {String(viewType).toLowerCase() !== 'onboarding' && (
                  <div className="flex items-center gap-2 bg-surface-100 border border-border-subtle rounded-xl px-3 py-1.5 shadow-sm">
                      <CalendarDays size={14} className="text-text-muted" />
                      <input 
                          type="date" 
                          value={dateRange.start} 
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                          className="bg-transparent border-none text-[10px] font-bold text-text-main focus:ring-0 p-0 w-24"
                      />
                      <span className="text-text-muted text-[10px] font-bold">to</span>
                      <input 
                          type="date" 
                          value={dateRange.end} 
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                          className="bg-transparent border-none text-[10px] font-bold text-text-main focus:ring-0 p-0 w-24"
                      />
                  </div>
                )}
                
                {onRefresh && (
                    <button 
                        onClick={onRefresh} 
                        disabled={isLoading}
                        className={`p-2 rounded-xl border border-border-subtle transition-all ${isLoading ? 'bg-surface-100 opacity-50' : 'bg-surface-100 text-text-muted hover:text-indigo-600 active:scale-95'}`}
                        title="Sync Data"
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                )}
                
                <div className="relative group">
                    <Search size={14} className="absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input type="text" placeholder="Search accounts..." value={filterText} onChange={(e) => setFilterText(e.target.value)} className="pl-9 pr-4 py-2 bg-surface-100 border border-border-subtle rounded-xl text-[11px] font-medium text-text-main w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                </div>
                
                <div className="relative" ref={filterMenuRef}>
                    <button onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className={`p-2 rounded-xl border border-border-subtle transition-colors flex items-center gap-2 ${isFilterMenuOpen || statusFilter.length > 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-surface-100 text-text-muted hover:text-indigo-600'}`}>
                        <ListFilter size={18} />
                        {statusFilter.length > 0 && (
                            <span className="flex items-center justify-center w-4 h-4 bg-indigo-600 text-white text-[9px] font-black rounded-full shadow-sm animate-in zoom-in duration-200">
                                {statusFilter.length}
                            </span>
                        )}
                    </button>
                    {isFilterMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border-subtle rounded-2xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 origin-top-right">
                            <div className="flex justify-between items-center px-3 py-2 border-b border-border-subtle mb-1">
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Filter Records</p>
                                {statusFilter.length > 0 && <button onClick={() => setStatusFilter([])} className="text-[9px] font-black text-indigo-600 hover:text-rose-500 uppercase tracking-widest transition-colors">Reset</button>}
                            </div>
                            <div className="max-h-60 overflow-y-auto scrollbar-thin">
                                {getFilterOptions().map(opt => (
                                    <button 
                                        key={opt} 
                                        onClick={() => toggleFilter(opt)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold transition-colors ${statusFilter.includes(opt) ? 'bg-indigo-600 text-white shadow-md' : 'text-text-main hover:bg-indigo-50 hover:text-indigo-600'}`}
                                    >
                                        <span className="truncate">{opt}</span>
                                        {statusFilter.includes(opt) && <Check size={12} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative" ref={sortMenuRef}>
                    <button onClick={() => setIsSortMenuOpen(!isSortMenuOpen)} className={`p-2 rounded-xl border border-border-subtle transition-colors flex items-center gap-2 ${isSortMenuOpen ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-surface-100 text-text-muted hover:text-indigo-600'}`}>
                        <ArrowDownWideNarrow size={18} />
                    </button>
                    {isSortMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border-subtle rounded-2xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 origin-top-right">
                            <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] px-3 py-2 border-b border-border-subtle mb-1">Sort By Field</p>
                            {getSortOptions().map(opt => (
                                <button 
                                    key={opt.key} 
                                    onClick={() => { requestSort(opt.key); setIsSortMenuOpen(false); }}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold transition-colors ${sortConfig.key === opt.key ? 'bg-indigo-50 text-indigo-600' : 'text-text-main hover:bg-indigo-50'}`}
                                >
                                    {opt.label}
                                    {sortConfig.key === opt.key && (
                                        sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
             </div>
          </div>
          <div className="overflow-auto scrollbar-thin flex-1">
             <table className="w-full text-left border-collapse whitespace-nowrap">
               <thead className="sticky top-0 z-10 bg-card">
                 {renderTableHeaders()}
               </thead>
               <tbody className="divide-y divide-border-subtle text-[12px]">
                 {filteredData.length > 0 ? filteredData.map((row, i) => renderTableRows(row, i)) : (
                   <tr><td colSpan={10} className="px-6 py-20 text-center opacity-30"><FileSearch size={48} className="mx-auto mb-4" /><p className="text-sm font-black uppercase tracking-widest">No audit matches found</p></td></tr>
                 )}
               </tbody>
             </table>
          </div>
       </div>
    </div>
  );
};

const StatCard = ({ label, val, icon: Icon, color }: { label: string, val: any, icon: any, color: string }) => {
    const colors: Record<string, string> = {
        emerald: 'text-emerald-500',
        rose: 'text-rose-500',
        amber: 'text-amber-500',
        indigo: 'text-indigo-600',
        slate: 'text-slate-500',
    };
    return (
        <div className="bg-card p-6 rounded-[2rem] border border-border-subtle shadow-sm flex items-center justify-between transition-all hover:shadow-md relative overflow-hidden group min-h-[100px]">
            <div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{label}</p>
                <p className={`text-3xl font-black ${colors[color] || 'text-text-main'}`}>{val}</p>
            </div>
            <Icon size={24} className={`${colors[color] || 'text-text-muted'} opacity-30 group-hover:scale-110 transition-transform`} />
        </div>
    );
};

const DualStatCard = ({ label, val, count, icon: Icon, color }: { label: string, val: any, count: number, icon: any, color: string }) => {
    const colors: Record<string, string> = {
        emerald: 'text-emerald-500',
        rose: 'text-rose-500',
        amber: 'text-amber-500',
        indigo: 'text-indigo-600',
        slate: 'text-slate-500',
    };
    return (
        <div className="bg-card p-6 rounded-[2rem] border border-border-subtle shadow-sm flex flex-col justify-between transition-all hover:shadow-md relative overflow-hidden group min-h-[100px]">
            <div className="flex justify-between items-start">
              <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{label}</p>
                  <p className={`text-2xl font-inter font-black ${colors[color] || 'text-text-main'}`}>{val}</p>
                  <p className="text-[9px] font-bold text-text-muted mt-1 uppercase">{count} Transactions</p>
              </div>
              <Icon size={24} className={`${colors[color] || 'text-text-muted'} opacity-30 group-hover:scale-110 transition-transform`} />
            </div>
        </div>
    );
};

export default AuditDashboard;