import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Download,
  Send, 
  ShieldAlert,
  ClipboardList,
  Target,
  PhoneForwarded,
  Clock,
  FileSearch,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  ListFilter,
  ArrowDownWideNarrow,
  Check,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Collector } from '../types';
import { useData } from '../DataContext';

type ViewMode = 'overview' | 'breakdown-onboarding' | 'breakdown-flagged' | 'breakdown-billing';

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

/**
 * Roulette-Style Segmented Gauge
 */
const HalfGauge = ({ percent, color, size = 185 }: { percent: number, color: string, size?: number }) => {
  const colorSchemes: Record<string, string[]> = {
    indigo: ['#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1'],
    emerald: ['#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981'],
    'dark-indigo': ['#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4338ca'],
    'dark-emerald': ['#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669']
  };

  const shades = colorSchemes[color] || colorSchemes.indigo;
  const pointerRotation = (percent / 100) * 180 - 90;

  return (
    <div className="relative flex flex-col items-center justify-center select-none group/gauge">
      <svg
        width={size}
        height={size / 2 + 25}
        viewBox="0 -8 100 65"
        className="overflow-visible"
      >
        {[0, 1, 2, 3, 4].map((i) => {
          const startAngle = (i * 36 - 180) * (Math.PI / 180);
          const endAngle = ((i + 1) * 36 - 180) * (Math.PI / 180);
          const innerRadius = 34;
          const outerRadius = 48;
          
          const x1 = 50 + outerRadius * Math.cos(startAngle);
          const y1 = 50 + outerRadius * Math.sin(startAngle);
          const x2 = 50 + outerRadius * Math.cos(endAngle);
          const y2 = 50 + outerRadius * Math.sin(endAngle);
          const x3 = 50 + innerRadius * Math.cos(endAngle);
          const y3 = 50 + innerRadius * Math.sin(endAngle);
          const x4 = 50 + innerRadius * Math.cos(startAngle);
          const y4 = 50 + innerRadius * Math.sin(startAngle);

          const d = `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 0 0 ${x4} ${y4} Z`;

          return (
            <path
              key={i}
              d={d}
              fill={shades[i]}
              className="transition-all duration-700 hover:brightness-95"
            />
          );
        })}

        <g 
          transform={`rotate(${pointerRotation}, 50, 50)`} 
          className="transition-transform duration-1000 ease-out"
        >
          <path
            d="M 47.5,-2 L 50,8 L 52.5,-2 Z"
            fill="currentColor"
            className="text-slate-800 dark:text-slate-100"
            stroke="currentColor"
            strokeWidth="0.2"
          />
        </g>
      </svg>
      
      <div className="absolute top-[52%] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center bg-card px-4 py-2 rounded-full ring-2 ring-card shadow-sm border border-border-subtle/50">
        <div className="flex items-baseline gap-0.5">
          <span className="text-3xl font-black font-inter text-text-main leading-none tracking-tight">
            {percent}
          </span>
          <span className="text-xs font-bold text-text-muted opacity-60">%</span>
        </div>
      </div>
    </div>
  );
};

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

const IndividualAuditLogs: React.FC<{ 
  collector: Collector; 
  onBack: () => void; 
  canManageDocuments: boolean; 
  canSendReport: boolean; 
}> = ({ collector, onBack, canManageDocuments, canSendReport }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [filterText, setFilterText] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'accountNumber', direction: 'desc' });
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const { 
    onboardingAudits, 
    fetchOnboardingAudits, 
    flaggedAccounts, 
    fetchFlaggedAccounts, 
    billingAudit, 
    fetchBillingAudit,
    auditScoring,
    fetchAuditScoring
  } = useData();
  
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOnboardingAudits();
    fetchFlaggedAccounts();
    fetchBillingAudit();
    fetchAuditScoring(collector.name);
  }, [fetchOnboardingAudits, fetchFlaggedAccounts, fetchBillingAudit, fetchAuditScoring, collector.name]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        if (sortRef.current && !sortRef.current.contains(e.target as Node)) setIsSortOpen(false);
        if (filterRef.current && !filterRef.current.contains(e.target as Node)) setIsFilterOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isNameMatch = (name1: string, name2: string) => {
    if (!name1 || !name2) return false;
    
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    if (n1 === n2) return true;
    if (n1.includes(n2) || n2.includes(n1)) return true;
    
    // Split into words and check if all words of one are in the other
    const getWords = (s: string) => s.toLowerCase().split(/[\s,._-]+/).filter(w => w.length > 1);
    const w1 = getWords(name1);
    const w2 = getWords(name2);
    
    if (w1.length > 0 && w2.length > 0) {
      const allW1InW2 = w1.every(word => w2.some(w => w.includes(word) || word.includes(w)));
      const allW2InW1 = w2.every(word => w1.some(w => w.includes(word) || word.includes(w)));
      if (allW1InW2 || allW2InW1) return true;
    }
    
    return false;
  };

  const onboardingData = useMemo(() => 
    onboardingAudits.data
      .filter(a => isNameMatch(a.collectorName || a.agentName, collector.name)), 
    [onboardingAudits.data, collector.name]
  );
  
  const stagnantData = useMemo(() => 
    flaggedAccounts.data
      .filter(a => isNameMatch(a.agentName || a.collectorName, collector.name)), 
    [flaggedAccounts.data, collector.name]
  );

  const billingData = useMemo(() => 
    billingAudit.data
      .filter(a => isNameMatch(a.agentName || a.collectorName, collector.name)), 
    [billingAudit.data, collector.name]
  );

  const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const filteredData = useMemo(() => {
    let data = [];
    if (viewMode === 'breakdown-onboarding') {
      data = onboardingData.filter(a => String(a.auditResult || '').trim().toLowerCase() === 'failed');
    }
    else if (viewMode === 'breakdown-billing') data = [...billingData];
    else data = [...stagnantData];
    
    if (filterText) {
      const l = filterText.toLowerCase();
      data = data.filter((i: any) => 
        (i.accountNumber && i.accountNumber.toLowerCase().includes(l)) || 
        (i.clientName && i.clientName.toLowerCase().includes(l)) ||
        (i.debtorName && i.debtorName.toLowerCase().includes(l)) ||
        (i.status && i.status.toLowerCase().includes(l)) ||
        (i.claimStatus && i.claimStatus.toLowerCase().includes(l)) ||
        (i.agentName && i.agentName.toLowerCase().includes(l))
      );
    }

    if (statusFilter.length > 0) {
        const lowerFilters = statusFilter.map(f => f.toLowerCase());
        if (viewMode === 'breakdown-onboarding' || viewMode === 'breakdown-billing') {
          data = data.filter((i: any) => lowerFilters.includes(String(i.auditResult || i.status || '').trim().toLowerCase()));
        }
        if (viewMode === 'breakdown-flagged') {
          data = data.filter((i: any) => lowerFilters.includes(String(i.status || '').trim().toLowerCase()));
        }
    }

    data.sort((a: any, b: any) => {
      let aV = a[sortConfig.key];
      let bV = b[sortConfig.key];
      if (String(sortConfig.key).toLowerCase().includes('date')) {
        aV = new Date(aV).getTime();
        bV = new Date(bV).getTime();
      }
      if (aV < bV) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aV > bV) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [viewMode, onboardingData, billingData, stagnantData, filterText, sortConfig, statusFilter]);

  const handleExport = () => {
    const isOb = viewMode === 'breakdown-onboarding';
    const isBilling = viewMode === 'breakdown-billing';
    let headers: string[] = [];
    let rows: any[][] = [];

    if (isOb || isBilling) {
      if (isBilling) {
        headers = ["Account #", "Agent Name", "Client Name", "Status", "Agreement Amount", "Overdue Amount", "Overdue Date", "PPA Action", "Comments"];
        rows = filteredData.map((r: any) => [
          `"${r.accountNumber}"`, 
          `"${r.agentName}"`, 
          `"${r.clientName}"`, 
          `"${r.status}"`,
          r.agreementAmount || 0,
          r.overdueAmount || 0,
          `"${r.overdueDate}"`, 
          `"${r.ppaAction || ''}"`,
          `"${r.comments?.replace(/"/g, '""') || ''}"`
        ]);
      } else {
        headers = ["Account #", "Collector Name", "Client Name", "Type", "Balance", "Age", "Result", "Comments"];
        rows = filteredData.map((r: any) => [
          `"${r.accountNumber}"`, 
          `"${r.collectorName || r.agentName}"`, 
          `"${r.clientName}"`, 
          `"${r.accountType || ''}"`,
          r.balance || 0,
          r.age || 0,
          `"${r.auditResult}"`, 
          `"${r.auditComments || r.comments?.replace(/"/g, '""') || ''}"`
        ]);
      }
    } else {
      headers = ["Account #", "Debtor Full Name", "Client Full Name", "Current Claim Status", "Collector Username", "Current Balance Due", "Account Age", "Last Worked Date", "Business Days Since Worked"];
      rows = filteredData.map((r: any) => [
        `"${r.accountNumber}"`, `"${r.debtorName}"`, `"${r.clientName}"`, `"${r.status}"`, `"${r.agentName}"`, r.balanceDue.toFixed(2), r.accountAge, `"${r.lastWorkedDate}"`, getBusinessDaysCount(r.lastWorkedDate)
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${viewMode}_${collector.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const requestSort = (key: string) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => 
    sortConfig.key !== columnKey ? <ArrowUpDown size={12} className="ml-1 opacity-20 inline" /> : 
    sortConfig.direction === 'asc' ? <ArrowUp size={12} className="ml-1 inline text-indigo-600" /> : 
    <ArrowDown size={12} className="ml-1 inline text-indigo-600" />;

  const getSortOptions = () => {
      if (viewMode === 'breakdown-onboarding') {
        return [
          {label:'Account #', key:'accountNumber'}, 
          {label:'Client', key:'clientName'},
          {label:'Type', key:'accountType'},
          {label:'Balance', key:'balance'},
          {label:'Age', key:'age'},
          {label:'Result', key:'auditResult'}
        ];
      }
      if (viewMode === 'breakdown-billing') {
        return [
          {label:'Account #', key:'accountNumber'}, 
          {label:'Client', key:'clientName'},
          {label:'Status', key:'status'},
          {label:'Agreement', key:'agreementAmount'},
          {label:'Overdue', key:'overdueAmount'},
          {label:'Date', key:'overdueDate'}
        ];
      }
      return [{label:'Account #', key:'accountNumber'}, {label:'Debtor', key:'debtorName'}, {label:'Client', key:'clientName'}, {label:'Status', key:'status'}, {label:'Collector', key:'agentName'}, {label:'Balance', key:'balanceDue'}, {label:'Age', key:'accountAge'}, {label:'Last Worked', key:'lastWorkedDate'}];
  }

  const getFilterOptions = () => {
      if (viewMode === 'breakdown-onboarding') return ['Failed'];
      if (viewMode === 'breakdown-billing') return ['Active', 'Overdue', 'Broken'];
      return ['Open', 'Assigned', 'Legal Review'];
  }

  const toggleFilter = (opt: string) => {
    setStatusFilter(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);
  }

  const alertCount = useMemo(() => {
    if (viewMode === 'breakdown-onboarding') return onboardingData.filter(a => String(a.auditResult || '').trim().toLowerCase() !== 'passed').length;
    if (viewMode === 'breakdown-billing') return billingData.filter(a => ['Update PPA', 'Delete PPA', 'Follow-Up PPA'].includes(String(a.ppaAction || '').trim())).length;
    return stagnantData.length;
  }, [viewMode, onboardingData, billingData, stagnantData]);

  if (viewMode === 'overview') {
    return (
      <div className="p-8 space-y-10 bg-app min-h-screen animate-in fade-in duration-500 font-sans pb-24">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2.5 rounded-2xl bg-card border border-border-subtle text-text-muted hover:text-indigo-600 shadow-sm transition-all group">
              <ArrowLeft size={20} className="group-hover:-translate-x-1" />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-text-main tracking-tight uppercase">{collector.name}</h1>
              <p className="text-text-muted font-black text-[10px] tracking-[0.2em] mt-1 uppercase">Audit Intelligence Dashboard</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => fetchAuditScoring(collector.name, true)}
              disabled={auditScoring.isLoading}
              className="p-2.5 rounded-2xl bg-card border border-border-subtle text-text-muted hover:text-indigo-600 shadow-sm transition-all group disabled:opacity-50"
              title="Refresh Audit Scores"
            >
              <RefreshCw size={20} className={`${auditScoring.isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            </button>
            {canSendReport && (
              <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all">
                <Send size={14} /> Send Report
              </button>
            )}
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600"><ShieldAlert size={18} /></div>
            <h2 className="text-xs font-black text-text-main uppercase tracking-widest">Action & Alert Layer</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AlertCard 
              title="Onboarding Account Audit" 
              count={onboardingData.filter(a => String(a.auditResult || '').trim().toLowerCase() !== 'passed').length}
              description="The New Account Friction Analysis"
              icon={ClipboardList}
              onView={() => { setViewMode('breakdown-onboarding'); setFilterText(''); setStatusFilter([]); setSortConfig({ key: 'accountNumber', direction: 'desc' }); }}
            />
            <AlertCard 
              title="Billing Audit" 
              count={billingData.filter(a => ['Update PPA', 'Delete PPA', 'Follow-Up PPA'].includes(String(a.ppaAction || '').trim())).length}
              description="Payment Agreement & Billing Verification"
              icon={CheckCircle2}
              onView={() => { setViewMode('breakdown-billing'); setFilterText(''); setStatusFilter([]); setSortConfig({ key: 'overdueDate', direction: 'desc' }); }}
            />
            <AlertCard 
              title="Flagged Accounts Report" 
              count={stagnantData.length}
              description="4-day unworked accounts"
              icon={Clock}
              onView={() => { setViewMode('breakdown-flagged'); setFilterText(''); setStatusFilter([]); setSortConfig({ key: 'lastWorkedDate', direction: 'desc' }); }}
            />
          </div>
        </section>

        <section className="space-y-4 relative">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"><Target size={18} /></div>
            <h2 className="text-xs font-black text-text-main uppercase tracking-widest">Account Audit Scoring</h2>
          </div>
          {auditScoring.isLoading && (
            <div className="absolute inset-0 z-10 bg-app/40 backdrop-blur-[1px] flex items-center justify-center rounded-[2rem]">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Fetching Scores...</span>
              </div>
            </div>
          )}
          {auditScoring.error && (
            <div className="absolute inset-0 z-10 bg-rose-50/90 dark:bg-rose-900/20 backdrop-blur-[1px] flex items-center justify-center rounded-[2rem] border border-rose-200 dark:border-rose-800">
              <div className="flex flex-col items-center gap-2 px-6 text-center">
                <AlertCircle className="w-6 h-6 text-rose-600" />
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{auditScoring.error}</span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <ScoreCard week="W1" range="Week 1 Score" score={auditScoring.data?.accountAudit?.week1 || 0} color="indigo" />
            <ScoreCard week="W2" range="Week 2 Score" score={auditScoring.data?.accountAudit?.week2 || 0} color="indigo" />
            <ScoreCard week="W3" range="Week 3 Score" score={auditScoring.data?.accountAudit?.week3 || 0} color="indigo" />
            <ScoreCard week="W4" range="Week 4 Score" score={auditScoring.data?.accountAudit?.week4 || 0} color="indigo" />
            <ScoreCard week="AGGREGATE" range="Monthly Overall" score={auditScoring.data?.accountAudit?.overall || 0} color="dark-indigo" isMain />
          </div>
        </section>

        <section className="space-y-4 relative">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"><PhoneForwarded size={18} /></div>
            <h2 className="text-xs font-black text-text-main uppercase tracking-widest">Call Audit Scoring</h2>
          </div>
          {auditScoring.isLoading && (
            <div className="absolute inset-0 z-10 bg-app/40 backdrop-blur-[1px] flex items-center justify-center rounded-[2rem]">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Fetching Scores...</span>
              </div>
            </div>
          )}
          {auditScoring.error && (
            <div className="absolute inset-0 z-10 bg-rose-50/90 dark:bg-rose-900/20 backdrop-blur-[1px] flex items-center justify-center rounded-[2rem] border border-rose-200 dark:border-rose-800">
              <div className="flex flex-col items-center gap-2 px-6 text-center">
                <AlertCircle className="w-6 h-6 text-rose-600" />
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{auditScoring.error}</span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <ScoreCard week="W1" range="Week 1 Score" score={auditScoring.data?.callAudit?.week1 || 0} color="emerald" />
            <ScoreCard week="W2" range="Week 2 Score" score={auditScoring.data?.callAudit?.week2 || 0} color="emerald" />
            <ScoreCard week="W3" range="Week 3 Score" score={auditScoring.data?.callAudit?.week3 || 0} color="emerald" />
            <ScoreCard week="W4" range="Week 4 Score" score={auditScoring.data?.callAudit?.week4 || 0} color="emerald" />
            <ScoreCard week="QUALITY" range="Monthly Call Score" score={auditScoring.data?.callAudit?.overall || 0} color="dark-emerald" isMain />
          </div>
        </section>
      </div>
    );
  }

  const isOnboarding = viewMode === 'breakdown-onboarding';
  const isBilling = viewMode === 'breakdown-billing';
  
  const hasAlertsInView = alertCount > 0;

  return (
    <div className="p-8 space-y-8 bg-app h-screen max-h-screen flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 font-sans overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0">
            <div className="flex items-center gap-4">
                <button onClick={() => setViewMode('overview')} className="p-2.5 rounded-2xl bg-card border border-border-subtle text-text-muted hover:text-indigo-600 shadow-sm transition-all group">
                    <ChevronLeft size={20} className="group-hover:-translate-x-1" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-text-main uppercase tracking-tight">
                        {isOnboarding ? 'Onboarding Account Audit' : isBilling ? 'Billing Audit' : 'Flagged Accounts Report'} Breakdown
                    </h1>
                    <p className="text-text-muted font-bold text-[10px] tracking-[0.2em] mt-1 uppercase italic">
                        Viewing itemized logs for {collector.name}
                    </p>
                </div>
            </div>
            <div className="flex gap-3">
                <div className={`bg-card px-6 py-2.5 rounded-xl border flex flex-col items-end justify-center shadow-sm transition-colors duration-300 ${hasAlertsInView ? 'border-rose-100' : 'border-emerald-100'}`}>
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">
                        {hasAlertsInView ? 'Alert Count' : 'System Status'}
                    </span>
                    <span className={`text-xl font-black leading-tight ${hasAlertsInView ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {hasAlertsInView ? alertCount : 'Clean'}
                    </span>
                </div>
                {canManageDocuments && (
                    <button onClick={handleExport} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 shadow-lg active:scale-95 transition-all">
                        <Download size={14} /> Download CSV
                    </button>
                )}
            </div>
        </div>

        <div className="flex-1 bg-card rounded-[2rem] border border-border-subtle shadow-sm overflow-hidden flex flex-col min-h-0">
            <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-card shrink-0">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${hasAlertsInView ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                        {isOnboarding || viewMode === 'breakdown-closure' ? <ClipboardList size={18} /> : (hasAlertsInView ? <CalendarDays size={18} /> : <CheckCircle2 size={18} />)}
                    </div>
                    <h2 className="text-xs font-black text-text-main uppercase tracking-widest">Itemized Audit Records</h2>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => {
                          if (isOnboarding) fetchOnboardingAudits(true);
                          else if (viewMode === 'breakdown-billing') fetchBillingAudit(true);
                          else fetchFlaggedAccounts(true);
                        }} 
                        disabled={isOnboarding ? onboardingAudits.isLoading : viewMode === 'breakdown-billing' ? billingAudit.isLoading : flaggedAccounts.isLoading}
                        className={`p-2 rounded-xl border border-border-subtle transition-all ${(isOnboarding ? onboardingAudits.isLoading : viewMode === 'breakdown-billing' ? billingAudit.isLoading : flaggedAccounts.isLoading) ? 'bg-surface-100 opacity-50' : 'bg-surface-100 text-text-muted hover:text-indigo-600 active:scale-95'}`}
                        title="Sync Data"
                    >
                        <RefreshCw size={18} className={(isOnboarding ? onboardingAudits.isLoading : viewMode === 'breakdown-billing' ? billingAudit.isLoading : flaggedAccounts.isLoading) ? 'animate-spin' : ''} />
                    </button>
                    <div className="relative group">
                        <Search size={14} className="absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input 
                            type="text" 
                            placeholder="Search records..." 
                            value={filterText} 
                            onChange={(e) => setFilterText(e.target.value)} 
                            className="pl-9 pr-4 py-2 bg-surface-100 border border-border-subtle rounded-xl text-[11px] font-medium text-text-main w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" 
                        />
                    </div>
                    
                    <div className="relative" ref={filterRef}>
                        <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`p-2 rounded-xl border border-border-subtle transition-colors flex items-center gap-2 ${isFilterOpen || statusFilter.length > 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-surface-100 text-text-muted hover:text-indigo-600'}`}>
                            <ListFilter size={18} />
                            {statusFilter.length > 0 && (
                                <span className="flex items-center justify-center w-4 h-4 bg-indigo-600 text-white text-[9px] font-black rounded-full shadow-sm animate-in zoom-in duration-200">
                                    {statusFilter.length}
                                </span>
                            )}
                        </button>
                        {isFilterOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border-subtle rounded-2xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 origin-top-right">
                                <div className="flex justify-between items-center px-3 py-2 border-b border-border-subtle mb-1">
                                    <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">Filter Results</p>
                                    {statusFilter.length > 0 && <button onClick={() => setStatusFilter([])} className="text-[9px] font-black text-indigo-600 hover:text-rose-500 uppercase tracking-widest transition-colors">Reset</button>}
                                </div>
                                <div className="max-h-60 overflow-y-auto scrollbar-thin">
                                    {getFilterOptions().map(opt => (
                                        <button 
                                            key={opt} 
                                            onClick={() => toggleFilter(opt)}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold transition-colors ${statusFilter.includes(opt) ? 'bg-indigo-600 text-white shadow-md' : 'text-text-main hover:bg-indigo-50 hover:text-indigo-600'}`}
                                        >
                                            {opt}
                                            {statusFilter.includes(opt) && <Check size={12} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative" ref={sortRef}>
                        <button onClick={() => setIsSortOpen(!isSortOpen)} className={`p-2 rounded-xl border border-border-subtle transition-colors flex items-center gap-2 ${isSortOpen ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-surface-100 text-text-muted hover:text-indigo-600'}`}>
                            <ArrowDownWideNarrow size={18} />
                        </button>
                        {isSortOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border-subtle rounded-2xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 origin-top-right">
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] px-3 py-2 border-b border-border-subtle mb-1">Sort By Field</p>
                                {getSortOptions().map(opt => (
                                    <button 
                                        key={opt.key} 
                                        onClick={() => { requestSort(opt.key); setIsSortOpen(false); }}
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

            <div className="overflow-x-auto scrollbar-thin flex-1">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="bg-surface-100/50 sticky top-0 z-10">
                        {isOnboarding ? (
                            <tr className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-subtle">
                                <th className="px-8 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('accountNumber')}>Account # <SortIcon columnKey="accountNumber" /></th>
                                <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('collectorName')}>Collector <SortIcon columnKey="collectorName" /></th>
                                <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('dateAssigned')}>Assigned <SortIcon columnKey="dateAssigned" /></th>
                                <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('dateActivated')}>Activated <SortIcon columnKey="dateActivated" /></th>
                                <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('dateAudit')}>Audited <SortIcon columnKey="dateAudit" /></th>
                                <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('auditResult')}>Result <SortIcon columnKey="auditResult" /></th>
                                <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('comments')}>Comments <SortIcon columnKey="comments" /></th>
                            </tr>
                        ) : viewMode === 'breakdown-billing' ? (
                            <tr className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-subtle">
                                <th className="px-8 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('accountNumber')}>Account # <SortIcon columnKey="accountNumber" /></th>
                                <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('clientName')}>Client Name <SortIcon columnKey="clientName" /></th>
                                <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('status')}>Status <SortIcon columnKey="status" /></th>
                                <th className="px-6 py-5 text-right cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('agreementAmount')}>Agreement <SortIcon columnKey="agreementAmount" /></th>
                                <th className="px-6 py-5 text-right cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('overdueAmount')}>Overdue <SortIcon columnKey="overdueAmount" /></th>
                                <th className="px-6 py-5 text-center cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('overdueDate')}>Overdue Date <SortIcon columnKey="overdueDate" /></th>
                                <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('ppaAction')}>PPA Action <SortIcon columnKey="ppaAction" /></th>
                                <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('comments')}>Comments <SortIcon columnKey="comments" /></th>
                            </tr>
                        ) : (
                            <tr className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-subtle">
                                <th className="px-8 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('accountNumber')}>Account # <SortIcon columnKey="accountNumber" /></th>
                                <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('debtorName')}>Debtor Full Name <SortIcon columnKey="debtorName" /></th>
                                <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('clientName')}>Client Full Name <SortIcon columnKey="clientName" /></th>
                                <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('status')}>Claim Status <SortIcon columnKey="status" /></th>
                                <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('agentName')}>Collector <SortIcon columnKey="agentName" /></th>
                                <th className="px-6 py-5 text-right cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('balanceDue')}>Balance Due <SortIcon columnKey="balanceDue" /></th>
                                <th className="px-6 py-5 text-center cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('accountAge')}>Age <SortIcon columnKey="accountAge" /></th>
                                <th className="px-6 py-5 text-right cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('lastWorkedDate')}>Last Worked <SortIcon columnKey="lastWorkedDate" /></th>
                            </tr>
                        )}
                    </thead>
                    <tbody className="divide-y divide-border-subtle text-[12px]">
                        {filteredData.length > 0 ? filteredData.map((row: any) => (
                            <tr key={row.id || row.accountNumber} className="hover:bg-surface-100 transition-colors group">
                                <td className="px-8 py-4 font-black text-indigo-600 dark:text-indigo-400">{row.accountNumber}</td>
                                {isOnboarding ? (
                                    <>
                                        <td className="px-6 py-4 font-bold text-text-main">{row.collectorName || row.agentName || '-'}</td>
                                        <td className="px-6 py-4 text-text-muted">{formatLongDate(row.dateAssigned)}</td>
                                        <td className="px-6 py-4 text-text-muted">{formatLongDate(row.dateActivated)}</td>
                                        <td className="px-6 py-4 text-text-muted">{formatLongDate(row.dateAudit)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${String(row.auditResult || '').trim().toLowerCase() === 'passed' ? 'bg-emerald-50 text-emerald-600' : (String(row.auditResult || '').trim().toLowerCase() === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600')}`}>
                                                {row.auditResult || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-text-muted italic max-w-xs truncate" title={row.comments}>{row.comments || '-'}</td>
                                    </>
                                ) : viewMode === 'breakdown-billing' ? (
                                    <>
                                        <td className="px-6 py-4 text-text-muted">{row.clientName || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase border ${
                                                String(row.status || '').trim().toLowerCase() === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                String(row.status || '').trim().toLowerCase() === 'overdue' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                                'bg-rose-50 dark:bg-rose-900/30 text-rose-600 border border-rose-100 dark:border-rose-800'
                                            }`}>
                                                {row.status || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-text-main">{formatCurrency(row.agreementAmount || 0)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-rose-500">{formatCurrency(row.overdueAmount || 0)}</td>
                                        <td className="px-6 py-4 text-center text-text-muted">{row.overdueDate || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                                row.ppaAction === 'No Update Needed' ? 'text-emerald-600' : 
                                                row.ppaAction === 'Update PPA' ? 'text-amber-500' :
                                                row.ppaAction === 'Delete PPA' ? 'text-rose-600' :
                                                row.ppaAction === 'Follow-Up PPA' ? 'text-fuchsia-600' :
                                                'text-indigo-600'
                                            }`}>
                                                {row.ppaAction || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-text-muted italic max-w-xs truncate" title={row.comments}>{row.comments || '-'}</td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-6 py-4 font-bold text-text-main">{row.debtorName}</td>
                                        <td className="px-6 py-4 text-text-muted">{row.clientName}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase bg-white dark:bg-slate-800 border border-border-subtle text-text-muted shadow-sm">{row.status}</span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-text-main italic">{row.agentName}</td>
                                        <td className="px-6 py-4 text-right font-black text-text-main font-inter">{formatCurrency(row.balanceDue)}</td>
                                        <td className="px-6 py-4 text-center text-text-muted font-inter">{row.accountAge}d</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="font-black text-text-main">{row.lastWorkedDate}</span>
                                                <span className="text-[10px] font-black text-rose-500 uppercase mt-0.5">
                                                    {getBusinessDaysCount(row.lastWorkedDate)}d ago
                                                </span>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={isOnboarding ? 7 : 8} className="px-8 py-20 text-center opacity-30">
                                    <FileSearch size={48} className="mx-auto mb-4" />
                                    <p className="text-sm font-black uppercase tracking-widest">No pending alerts found</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

const AlertCard = ({ title, count, description, icon: Icon, onView }: any) => {
    const hasAlerts = count > 0;
    return (
        <div className={`bg-card p-6 rounded-[2rem] border transition-all duration-300 shadow-sm flex flex-col justify-between min-h-[160px] group ${hasAlerts ? 'border-rose-100 dark:border-rose-900/30' : 'border-emerald-100 dark:border-emerald-900/30'}`}>
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                    <h3 className="text-[13px] font-black text-text-main uppercase tracking-tight">{title}</h3>
                    <p className="text-[10px] text-text-muted font-bold leading-tight max-w-[200px]">{description}</p>
                </div>
                <div className={`p-2.5 rounded-xl transition-all ${hasAlerts ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-500' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500'}`}>
                    <Icon size={20} />
                </div>
            </div>
            <div className="flex items-end justify-between mt-4">
                <div className="flex flex-col">
                    <span className={`text-3xl font-black font-inter leading-none ${hasAlerts ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {count}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest mt-2 ${hasAlerts ? 'text-rose-500/60 animate-pulse' : 'text-emerald-500/60'}`}>
                      {hasAlerts ? 'Action Required' : 'Queue Cleared'}
                    </span>
                </div>
                <button 
                  onClick={onView} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    hasAlerts ? 'bg-rose-600 text-white shadow-lg shadow-rose-200 dark:shadow-none hover:bg-rose-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                    View Details <ChevronRight size={14} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
};

const ScoreCard = ({ week, range, score, color, isMain }: { week: string, range: string, score: number, color: string, isMain?: boolean }) => {
    return (
        <div className={`bg-card p-6 rounded-[2rem] border border-border-subtle flex flex-col items-center justify-center text-center shadow-sm transition-all hover:shadow-md ${isMain ? 'ring-2 ring-offset-2 ring-offset-app ring-indigo-500/20 bg-surface-100/30 border-indigo-200' : ''}`}>
            <div className="mb-4">
                <span className="text-[11px] font-black text-text-main uppercase tracking-[0.2em] block">{week}</span>
                <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest">{range}</span>
            </div>
            
            <HalfGauge percent={score} color={color} size={185} />
            
            {isMain && (
                <div className="mt-3">
                    <span className="text-[9px] font-black text-indigo-600/60 uppercase tracking-widest italic">Weighted Analytics</span>
                </div>
            )}
        </div>
    );
};

export default IndividualAuditLogs;