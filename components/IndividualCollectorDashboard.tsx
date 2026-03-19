
import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Clock, 
  Activity, 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  CheckCheck,
  ShieldAlert,
  Bell,
  Users,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Collector } from '../types';
import { useData } from '../DataContext';

const IndividualCollectorDashboard: React.FC<{ collector: Collector; onViewAudits: () => void; onCollectorDeleted?: () => void; }> = ({ collector, onViewAudits, onCollectorDeleted }) => {
  const [activeWeeklyIndex, setActiveWeeklyIndex] = useState<number | null>(null);
  const [activeMonthlyIndex, setActiveMonthlyIndex] = useState<number | null>(null);
  const { 
    individualCollectors, 
    fetchIndividualCollectors, 
    flaggedAccounts, 
    fetchFlaggedAccounts, 
    onboardingAudits, 
    fetchOnboardingAudits, 
    billingAudit, 
    fetchBillingAudit,
    fetchAuditScoring,
    auditScoring
  } = useData();
  
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

  const [dbData, setDbData] = useState<any>(() => {
    if (individualCollectors.data && individualCollectors.data.length > 0) {
      return individualCollectors.data.find((item: any) => isNameMatch(item.name, collector.name)) || null;
    }
    return null;
  });
  
  const [isMock, setIsMock] = useState(() => {
    if (individualCollectors.data && individualCollectors.data.length > 0) {
      const found = individualCollectors.data.find((item: any) => isNameMatch(item.name, collector.name));
      return !found;
    }
    return false;
  });
  
  const PALETTE = { 
    PURPLE: "#818cf8", 
    ORANGE: "#ea580c", 
    BLUE_KPI: "#60A5FA", 
    YELLOW_KPI: "#FACC15",
    TREND_LINE: "#5c6b9f" 
  };

  useEffect(() => {
    fetchIndividualCollectors();
    fetchFlaggedAccounts();
    fetchOnboardingAudits();
    fetchBillingAudit();
    fetchAuditScoring(collector.name);
    
    // Removed automatic polling to prevent Google Apps Script rate limits (CORS errors)
    // Users can manually refresh using the Refresh button
  }, [fetchIndividualCollectors, fetchFlaggedAccounts, fetchOnboardingAudits, fetchBillingAudit, fetchAuditScoring, collector.name]);

  useEffect(() => {
    if (individualCollectors.isLoading && !individualCollectors.data.length) {
      return;
    }

    if (individualCollectors.error) {
      console.warn("Fetch Warning Details:", individualCollectors.error);
      setIsMock(true);
      return;
    }

    const dataArray = individualCollectors.data || [];
    if (dataArray.length === 0 && !individualCollectors.isLoading) {
      console.warn("No collector data returned from database.");
      setIsMock(true);
      return;
    }

    if (dataArray.length > 0) {
      const collectorData = dataArray.find((item: any) => isNameMatch(item.name, collector.name));
      
      if (collectorData) {
        setDbData(collectorData);
        setIsMock(false);
      } else {
        console.warn(`Collector "${collector.name}" not found in database.`);
        setIsMock(true);
      }
    }
  }, [individualCollectors.data, individualCollectors.isLoading, individualCollectors.error, collector.name]);

  const loading = individualCollectors.isLoading && !dbData;
  const error = individualCollectors.error && !dbData ? individualCollectors.error : (isMock && !dbData ? `Collector "${collector.name}" not found in the database. Please check Column B in the "Summary" sheet.` : null);

  const tooltipClass = "bg-slate-900/95 dark:bg-black/95 text-white px-4 py-3 rounded-xl z-[100] shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200 pointer-events-none backdrop-blur-md";

  const formatCurrency = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val.replace(/[$,]/g, '')) : val;
    if (isNaN(num)) return "$0.00";
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const pendingAuditCount = useMemo(() => {
    const onboardingPending = (onboardingAudits.data || [])
      .filter(a => {
        const agentMatch = isNameMatch(a.agentName || a.collectorName, collector.name);
        const result = String(a.auditResult || '').trim().toLowerCase();
        const isAlert = result === 'failed' || result === 'pending';
        return agentMatch && isAlert;
      }).length;

    const billingPending = (billingAudit.data || [])
      .filter(a => {
        const agentMatch = isNameMatch(a.agentName || a.collectorName, collector.name);
        const ppaAction = String(a.ppaAction || '').trim();
        const isAlert = ['Update PPA', 'Delete PPA', 'Follow-Up PPA'].includes(ppaAction);
        return agentMatch && isAlert;
      }).length;
      
    const flaggedPending = (flaggedAccounts.data || [])
      .filter(a => {
        const agentMatch = isNameMatch(a.agentName || a.collectorName, collector.name);
        return agentMatch;
      }).length;
      
    return onboardingPending + billingPending + flaggedPending;
  }, [collector.name, onboardingAudits.data, billingAudit.data, flaggedAccounts.data]);

  const assignedAccounts = useMemo(() => {
    if (dbData?.accounts?.assigned !== undefined) {
      const val = dbData.accounts.assigned;
      const num = typeof val === 'string' ? parseFloat(String(val).replace(/[$,]/g, '')) : val;
      return isNaN(num) ? "0" : num.toLocaleString();
    }
    const hash = collector.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (800 + (hash % 600)).toLocaleString();
  }, [collector.name, dbData]);

  const inactivatedAccounts = useMemo(() => {
    if (dbData?.accounts?.inactivated !== undefined) {
      const val = dbData.accounts.inactivated;
      const num = typeof val === 'string' ? parseFloat(String(val).replace(/[$,]/g, '')) : val;
      return isNaN(num) ? "0" : num.toLocaleString();
    }
    const hash = collector.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (20 + (hash % 100)).toLocaleString();
  }, [collector.name, dbData]);

  const kpiData = useMemo(() => {
    if (dbData?.kpis) {
      const { prior, wtd, mtd } = dbData.kpis;
      const getPct = (coll: any, target: any) => {
        const c = typeof coll === 'string' ? parseFloat(coll.replace(/[$,]/g, '')) : coll;
        const t = typeof target === 'string' ? parseFloat(target.replace(/[$,]/g, '')) : target;
        return t > 0 ? Math.round((c / t) * 100) : 0;
      };
      return [
        { label: "Prior Date Collected", val: formatCurrency(prior.collected), target: formatCurrency(prior.target), pct: getPct(prior.collected, prior.target), color: PALETTE.BLUE_KPI },
        { label: "Week to Date Collected", val: formatCurrency(wtd.collected), target: formatCurrency(wtd.target), pct: getPct(wtd.collected, wtd.target), color: PALETTE.PURPLE },
        { label: "Month to Date Collected", val: formatCurrency(mtd.collected), target: formatCurrency(mtd.target), pct: getPct(mtd.collected, mtd.target), color: PALETTE.YELLOW_KPI },
      ];
    }
    return [
      { label: "Prior Date Collected", val: "$2,450.00", target: "$3,000.00", pct: 82, color: PALETTE.BLUE_KPI },
      { label: "Week to Date Collected", val: "$12,450.00", target: "$15,000.00", pct: 83, color: PALETTE.PURPLE },
      { label: "Month to Date Collected", val: "$48,200.00", target: "$80,000.00", pct: 60, color: PALETTE.YELLOW_KPI },
    ];
  }, [dbData]);

  const postdatesData = useMemo(() => {
    if (dbData?.postdates) {
      const { succeeded, declined, recovered, remaining, succeededTrans, declinedTrans, recoveredTrans, remainingTrans, totalPayments, averagePayment } = dbData.postdates;
      
      // Use database values if available, otherwise fallback to calculation
      const finalTotalPayments = totalPayments !== undefined ? totalPayments : 
        (parseInt(succeededTrans) || 0) + (parseInt(declinedTrans) || 0) + (parseInt(recoveredTrans) || 0) + (parseInt(remainingTrans) || 0);
      
      let finalAveragePayment = averagePayment;
      if (finalAveragePayment === undefined) {
        const totalValue = (parseFloat(String(succeeded).replace(/[$,]/g, '')) || 0) + 
                           (parseFloat(String(declined).replace(/[$,]/g, '')) || 0) + 
                           (parseFloat(String(recovered).replace(/[$,]/g, '')) || 0) + 
                           (parseFloat(String(remaining).replace(/[$,]/g, '')) || 0);
        finalAveragePayment = finalTotalPayments > 0 ? totalValue / finalTotalPayments : 0;
      }

      return [
        { label: "Total Number of Payments", value: finalTotalPayments.toLocaleString(), count: "", color: "#818cf8", icon: Activity, isMetric: true },
        { label: "Total Average Payment", value: formatCurrency(finalAveragePayment), count: "", color: "#818cf8", icon: Activity, isMetric: true },
        { label: "Total Succeeded", value: formatCurrency(succeeded), count: succeededTrans || "0", color: "#34d399", icon: CheckCircle2 },
        { label: "Total Declined", value: formatCurrency(declined), count: declinedTrans || "0", color: "#f43f5e", icon: XCircle }, 
        { label: "Total Recovered", value: formatCurrency(recovered), count: recoveredTrans || "0", color: "#60A5FA", icon: RotateCcw },
        { label: "Remaining", value: formatCurrency(remaining), count: remainingTrans || "0", color: "#FACC15", icon: Clock },
      ];
    }
    return [
      { label: "Total Number of Payments", value: "180", count: "", color: "#818cf8", icon: Activity, isMetric: true },
      { label: "Total Average Payment", value: "$525.00", count: "", color: "#818cf8", icon: Activity, isMetric: true },
      { label: "Total Succeeded", value: "$12,450.00", count: "42", color: "#34d399", icon: CheckCircle2 },
      { label: "Total Declined", value: "$3,200.00", count: "8", color: "#f43f5e", icon: XCircle }, 
      { label: "Total Recovered", value: "$1,850.00", count: "5", color: "#60A5FA", icon: RotateCcw },
      { label: "Remaining", value: "$77,000.00", count: "125", color: "#FACC15", icon: Clock },
    ];
  }, [dbData]);

  const callStats = useMemo(() => {
    if (dbData?.performance) {
      const { daily, weekly, monthly } = dbData.performance;
      const fmt = (val: any) => {
        const num = typeof val === 'string' ? parseFloat(String(val).replace(/[$,]/g, '')) : val;
        return isNaN(num) ? "0" : num.toLocaleString();
      };
      return [
        { label: "Accounts Worked", daily: fmt(daily.worked), weekly: fmt(weekly.worked), monthly: fmt(monthly.worked), icon: Users },
        { label: "RPC Count", daily: fmt(daily.rpc), weekly: fmt(weekly.rpc), monthly: fmt(monthly.rpc), icon: Phone },
        { label: "Completed", daily: fmt(daily.completed), weekly: fmt(weekly.completed), monthly: fmt(monthly.completed), icon: CheckCheck },
        { label: "Inbound", daily: fmt(daily.inbound), weekly: fmt(weekly.inbound), monthly: fmt(monthly.inbound), icon: PhoneIncoming },
        { label: "Outbound", daily: fmt(daily.outbound), weekly: fmt(weekly.outbound), monthly: fmt(monthly.outbound), icon: PhoneOutgoing },
      ];
    }
    return [
      { label: "Accounts Worked", daily: "38", weekly: "185", monthly: "740", icon: Users },
      { label: "RPC Count", daily: "12", weekly: "58", monthly: "245", icon: Phone },
      { label: "Completed", daily: "45", weekly: "210", monthly: "890", icon: CheckCheck },
      { label: "Inbound", daily: "15", weekly: "65", monthly: "280", icon: PhoneIncoming },
      { label: "Outbound", daily: "30", weekly: "145", monthly: "610", icon: PhoneOutgoing },
    ];
  }, [dbData]);

  const weeklyChartData = useMemo(() => {
    if (dbData?.weeklyCycle) {
      const { current, prior } = dbData.weeklyCycle;
      const parse = (v: any) => {
        const n = typeof v === 'string' ? parseFloat(v.replace(/[$,]/g, '')) : v;
        return isNaN(n) ? 0 : n;
      };
      return [
        { label: 'WED', d: parse(current.wed), l: parse(prior.wed), curDate: 'Current', priDate: 'Prior' },
        { label: 'THU', d: parse(current.thu), l: parse(prior.thu), curDate: 'Current', priDate: 'Prior' },
        { label: 'FRI', d: parse(current.fri), l: parse(prior.fri), curDate: 'Current', priDate: 'Prior' },
        { label: 'MON', d: parse(current.mon), l: parse(prior.mon), curDate: 'Current', priDate: 'Prior' },
        { label: 'TUE', d: parse(current.tue), l: parse(prior.tue), curDate: 'Current', priDate: 'Prior' }
      ];
    }
    return [
      { label: 'WED', d: 10500, l: 8200, curDate: 'Feb 25', priDate: 'Feb 18' }, 
      { label: 'THU', d: 16800, l: 14200, curDate: 'Feb 26', priDate: 'Feb 19' }, 
      { label: 'FRI', d: 13000, l: 12500, curDate: 'Feb 27', priDate: 'Feb 20' }, 
      { label: 'MON', d: 19400, l: 17000, curDate: 'Mar 2', priDate: 'Feb 23' }, 
      { label: 'TUE', d: 23500, l: 21800, curDate: 'Mar 3', priDate: 'Feb 24' }
    ];
  }, [dbData]);

  const maxWeeklyValue = useMemo(() => {
    const vals = weeklyChartData.flatMap(d => [Number(d.d), Number(d.l)]);
    const actualMax = Math.max(...vals);
    const baseMax = Math.max(actualMax, 2000); // Default to 2k if data is lower
    
    // Intelligent rounding for a "zoomed-in" feel
    if (baseMax <= 2000) return 2000;
    if (baseMax <= 5000) return Math.ceil(baseMax / 500) * 500;
    if (baseMax <= 10000) return Math.ceil(baseMax / 1000) * 1000;
    if (baseMax <= 50000) return Math.ceil(baseMax / 5000) * 5000;
    return Math.ceil(baseMax / 10000) * 10000;
  }, [weeklyChartData]);

  const weeklyYAxis = useMemo(() => {
    const steps = 5;
    return Array.from({ length: steps + 1 }, (_, i) => (maxWeeklyValue / steps) * (steps - i));
  }, [maxWeeklyValue]);

  const monthlyChartData = useMemo(() => {
    console.log("DEBUG: dbData.monthlyCycle:", dbData?.monthlyCycle);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    // Attempt to derive the month from the data, default to March if not available
    const dataMonth = dbData?.monthlyCycle?.[0]?.month;
    const displayMonth = dataMonth ? monthNames[dataMonth - 1] : "Mar";

    if (dbData?.monthlyCycle && Array.isArray(dbData.monthlyCycle) && dbData.monthlyCycle.length > 0) {
      return dbData.monthlyCycle.map((item: any) => {
        const dayNum = parseInt(item.day);
        const dayStr = !isNaN(dayNum) ? String(dayNum).padStart(2, '0') : item.day;
        const monthStr = "Mar"; // Force to Mar
        return {
          day: item.day,
          formattedDate: !isNaN(dayNum) ? `${monthStr} ${dayStr}` : item.day,
          val: typeof item.val === 'string' ? parseFloat(item.val.replace(/[$,]/g, '')) : (Number(item.val) || 0)
        };
      });
    }
    // Fallback to mock data if no DB data
    return Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const dayStr = String(day).padStart(2, '0');
      return {
        day: day,
        formattedDate: `${displayMonth} ${dayStr}`,
        val: Math.max(2, Math.min(24, (Math.sin((i / 29) * Math.PI * 2) * 8 + 14) + Math.sin((i / 29) * 10) * 2))
      };
    });
  }, [dbData]);

  const maxMonthlyValue = useMemo(() => {
    const vals = monthlyChartData.map(d => d.val);
    const max = Math.max(...vals, 1);
    // Round up to a nice number
    if (max <= 1000) return Math.ceil(max / 100) * 100;
    if (max <= 5000) return Math.ceil(max / 500) * 500;
    return Math.ceil(max / 1000) * 1000;
  }, [monthlyChartData]);

  const monthlyYAxis = useMemo(() => {
    const steps = 5;
    return Array.from({ length: steps + 1 }, (_, i) => (maxMonthlyValue / steps) * (steps - i));
  }, [maxMonthlyValue]);
  
  const generateSmoothPath = (pts: number[][]) => {
    if (pts.length < 2) return ""; 
    let d = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i]; 
      const p1 = pts[i]; 
      const p2 = pts[i + 1]; 
      const p3 = i < pts.length - 2 ? pts[i + 2] : pts[i + 1];
      const tension = 0.2; 
      
      const cp1x = p1[0] + (p2[0] - p0[0]) * tension; 
      const cp1y = Math.min(100, Math.max(0, p1[1] + (p2[1] - p0[1]) * tension)); 
      const cp2x = p2[0] - (p3[0] - p1[0]) * tension; 
      const cp2y = Math.min(100, Math.max(0, p2[1] - (p3[1] - p1[1]) * tension));
      
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
    }
    return d;
  };
  const monthlyPath = generateSmoothPath(monthlyChartData.map((d, i) => {
    const x = monthlyChartData.length > 1 ? (i / (monthlyChartData.length - 1)) * 100 : 50;
    const y = 100 - (d.val / maxMonthlyValue * 100);
    return [x, y];
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-app">
        <div className="flex flex-col items-center gap-6 max-w-md text-center px-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-text-muted font-black uppercase tracking-widest text-[10px]">Loading Collector Data...</p>
        </div>
      </div>
    );
  }

  if (error && !dbData) {
    return (
      <div className="flex items-center justify-center h-screen bg-app">
        <div className="flex flex-col items-center gap-6 max-w-md text-center px-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <p className="text-red-500 font-black uppercase tracking-widest text-[10px]">Sync Error</p>
            <p className="text-sm text-text-muted font-medium">{error}</p>
          </div>
          <button 
            onClick={() => fetchIndividualCollectors(true)}
            className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            Retry Sync
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 lg:space-y-6 animate-in fade-in duration-500 bg-app min-h-screen font-sans overflow-y-auto scrollbar-thin max-w-[1440px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-text-main tracking-tight uppercase">{collector.name}</h1>
            {isMock && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[9px] font-black uppercase tracking-widest">Mock Data</span>
            )}
          </div>
          <p className="text-text-muted font-semibold text-[11px] tracking-widest mt-1 uppercase">Portfolio Performance View</p>
          {error && (
            <div className="mt-2 p-3 bg-rose-50 border border-rose-100 rounded-xl flex flex-col gap-1">
              <div className="flex items-center gap-2 text-rose-600">
                <ShieldAlert size={16} />
                <p className="text-[11px] font-black uppercase tracking-tight">Database Error</p>
              </div>
              <p className="text-rose-500 text-[10px] font-medium leading-relaxed">{error}</p>
              <button 
                onClick={() => fetchIndividualCollectors(true)}
                className="mt-2 self-start px-3 py-1 bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-rose-700 transition-colors flex items-center gap-2"
              >
                <RotateCcw size={10} />
                Retry Connection
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={onViewAudits} 
            className={`relative flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] shadow-xl transition-all duration-300 group
              ${pendingAuditCount > 0 
                ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/20 shadow-rose-500/30 overflow-hidden' 
                : 'bg-card border border-border-subtle text-text-muted hover:border-border-subtle hover:text-text-main'
              }
            `}
          >
            {pendingAuditCount > 0 ? (
              <>
                <div className="absolute top-0 left-0 w-full h-1 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                <Bell size={16} className="animate-bounce" />
                <span>{pendingAuditCount} Audit Alerts</span>
                <div className="bg-white/20 px-2 py-0.5 rounded-lg ml-2 group-hover:bg-white/30 transition-colors uppercase">
                  Action Required
                </div>
              </>
            ) : (
              <>
                <ShieldAlert size={16} />
                <span>Audit Logs</span>
              </>
            )}
          </button>
          <button 
            onClick={() => fetchIndividualCollectors(true)}
            disabled={individualCollectors.isLoading}
            className="p-3 rounded-2xl bg-surface-100 border border-border-subtle text-text-muted hover:text-indigo-500 hover:border-indigo-200 transition-all disabled:opacity-50 shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={individualCollectors.isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {kpiData.map((m, i) => {
          const s = 64; const c = 32; const r = 28; const w = 5; const circ = 2 * Math.PI * r; const off = circ - (circ * m.pct) / 100;
          return (
            <div key={i} className="bg-card p-6 rounded-2xl border border-border-subtle shadow-sm flex justify-between items-center relative overflow-hidden h-36 group hover:shadow-lg transition-all">
              <div className="z-10 relative flex flex-col justify-center h-full flex-1 min-w-0 pr-2">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">{m.label}</p>
                <h3 className="text-3xl font-black font-inter text-text-main mb-4 tracking-tight truncate">{m.val}</h3>
                <p className="text-[10px] font-black text-text-muted tracking-widest uppercase">Target: <span className="font-inter text-text-main">{m.target}</span></p>
              </div>
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${s} ${s}`}>
                  <circle cx={c} cy={c} r={r} stroke="var(--border-subtle)" strokeWidth={w} fill="transparent" />
                  <circle cx={c} cy={c} r={r} stroke={m.color} strokeWidth={w} fill="transparent" strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
                <span className="absolute text-lg font-black font-inter text-text-main">{m.pct}%</span>
              </div>
            </div>
          );
        })}
        <div className="p-6 rounded-2xl flex flex-col justify-center relative overflow-hidden h-36 bg-gradient-to-br from-[#818cf8] via-[#6366f1] to-[#4f46e5] shadow-lg group hover:scale-[1.02] transition-transform">
          {/* Executive Wave background sync */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none text-white/10">
            <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
              <path d="M-20,200 C50,180 120,50 220,100 C320,150 380,40 420,60 L420,200 Z" fill="currentColor" />
              <path d="M0,200 C150,220 200,100 350,120 C420,130 450,80 500,100 L500,200 L0,200 Z" fill="currentColor" />
            </svg>
          </div>
          <div className="relative z-10 grid grid-cols-2 h-full items-center text-white divide-x divide-white/20">
            <div className="pr-4">
              <p className="text-[10px] font-black opacity-80 uppercase tracking-widest mb-2">Assigned Accounts</p>
              <h3 className="text-3xl font-black font-inter tracking-tight text-white">{assignedAccounts}</h3>
            </div>
            <div className="pl-4">
              <p className="text-[10px] font-black opacity-80 uppercase tracking-widest mb-2">Inactivated Accounts</p>
              <h3 className="text-3xl font-black font-inter tracking-tight text-white">{inactivatedAccounts}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-card rounded-2xl border border-border-subtle shadow-sm p-4 lg:p-6 flex flex-col">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl"><Activity size={18} /></div>
              <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Performance Analytics</h4>
           </div>
           <table className="w-full text-left border-collapse">
              <thead className="border-b border-border-subtle">
                <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">
                  <th className="py-4 w-[40%]">Metric</th>
                  <th className="py-4 text-center">Daily</th>
                  <th className="py-4 text-center">Weekly</th>
                  <th className="py-4 text-center">Monthly</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {callStats.map((r, i) => (
                  <tr key={i} className="hover:bg-surface-100/50 transition-colors group">
                    <td className="py-4 flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-surface-100 text-text-muted group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                        <r.icon size={14} />
                      </div>
                      <span className="text-[11px] font-bold text-text-main truncate uppercase tracking-tight">
                        {r.label}
                      </span>
                    </td>
                    <td className="py-4 text-center text-text-main font-inter font-bold text-[11px]">{r.daily}</td>
                    <td className="py-4 text-center text-text-main font-inter font-bold text-[11px]">{r.weekly}</td>
                    <td className="py-4 text-center text-text-main font-inter font-bold text-[11px]">{r.monthly}</td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
           {postdatesData.map((item, i) => (<div key={i} className={`bg-card px-4 py-4 rounded-2xl border border-border-subtle shadow-sm group relative overflow-hidden flex flex-col justify-center transition-all hover:shadow-md ${item.isMetric ? 'col-span-1 sm:col-span-1' : ''}`}>
               <div className="relative z-10">
                 <div className="flex justify-between items-start mb-1">
                   <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.15em]">{item.label}</p>
                   {!item.isMetric && (
                     <div className="bg-surface-100 px-2 py-1 rounded-lg flex items-center gap-1 border border-border-subtle shadow-inner">
                       <span className="text-[10px] font-black text-text-main leading-none">{item.count}</span>
                       <span className="text-[7px] font-black text-text-muted uppercase tracking-tighter leading-none">Trans</span>
                     </div>
                   )}
                 </div>
                 <h3 className="text-2xl font-black font-inter text-text-main tracking-tight" style={{ color: item.color }}>{item.value}</h3>
               </div>
               <div className="absolute -bottom-4 -right-4 z-0 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500" style={{ color: item.color }}><item.icon size={80} strokeWidth={1.5} /></div>
           </div>))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 pb-8">
          <div className="bg-card p-4 lg:p-8 rounded-[2rem] border border-border-subtle shadow-sm">
            <div className="flex justify-between items-center mb-8"><p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Weekly Collection Cycle</p><div className="flex gap-4 text-[9px] font-black uppercase tracking-[0.15em] text-text-muted"><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PALETTE.PURPLE }} /> Current</span><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PALETTE.ORANGE }} /> Prior</span></div></div>
            <div className="h-72 w-full flex">
              <div className="flex flex-col justify-between text-[10px] font-bold text-text-muted/40 mr-4 pb-10 text-right w-8">
                {weeklyYAxis.map(v => <span key={v}>{v >= 1000 ? `${v/1000}k` : v}</span>)}
              </div>
              <div className="flex-1 relative border-b border-border-subtle pb-10">
                <div className="absolute inset-0 flex items-end justify-between px-4 pb-10">
                  {weeklyChartData.map((item, idx) => {
                    const curH = (item.d / maxWeeklyValue) * 100;
                    const priH = (item.l / maxWeeklyValue) * 100;
                return (
                  <div key={idx} className="h-full flex gap-3 items-end group w-full justify-center cursor-pointer relative" onMouseEnter={() => setActiveWeeklyIndex(idx)} onMouseLeave={() => setActiveWeeklyIndex(null)}>
                        {activeWeeklyIndex === idx && (
                          <div className={`absolute left-1/2 -translate-x-1/2 min-w-[200px] text-center ${tooltipClass}`} style={{ top: `${100 - Math.max(curH, priH)}%`, transform: 'translate(-50%, -115%)' }}>
                             <div className="flex justify-between text-[10px] font-black mb-2 border-b border-white/10 pb-1 uppercase tracking-widest"><span className="text-white/40">WEEKDAY</span><span style={{ color: PALETTE.PURPLE }}>{item.label}</span></div>
                             <div className="flex justify-between text-xs font-black mb-1"><span className="text-white/60 mr-4">{item.priDate}</span><span>{formatCurrency(item.l)}</span></div>
                             <div className="flex justify-between text-xs font-black"><span className="text-white/60 mr-4">{item.curDate}</span><span>{formatCurrency(item.d)}</span></div>
                          </div>
                        )}
                        {/* Current Bar - Gradient + Reverse Transparency (Lighter on Hover) */}
                        <div className="w-[40%] max-w-[55px] h-full bg-surface-100 rounded-t-md flex items-end transition-all opacity-90 group-hover:opacity-40">
                          <div className="w-full rounded-t-sm relative transition-all duration-500 ease-out bg-gradient-to-t from-indigo-600 to-indigo-400/20" style={{ height: `${curH}%` }} />
                        </div>
                        {/* Prior Bar - Gradient + Reverse Transparency (Lighter on Hover) */}
                        <div className="w-[40%] max-w-[55px] h-full bg-surface-100 rounded-t-md flex items-end transition-all opacity-90 group-hover:opacity-40">
                          <div className="w-full rounded-t-sm relative transition-all duration-500 ease-out bg-gradient-to-t from-[#ea580c] to-[#f97316]/20" style={{ height: `${priH}%` }} />
                        </div>
                        
                        {/* Day Label */}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-text-muted uppercase tracking-widest">
                          {item.label}
                        </div>
                  </div>
                )})}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-card p-4 lg:p-8 rounded-[2rem] border border-border-subtle shadow-sm">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-8">Monthly Collection Cycle</p>
            <div className="flex h-72 w-full">
              <div className="flex flex-col justify-between text-[10px] font-bold text-text-muted/40 mr-4 pb-10 text-right w-8">
                {monthlyYAxis.map(v => <span key={v}>{v >= 1000 ? `${v/1000}k` : v}</span>)}
              </div>
               <div className="relative flex-1"><div className="absolute inset-0 pb-10 flex flex-col justify-between pointer-events-none">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="w-full h-px bg-surface-100" />))}</div>
                  <div className="absolute inset-0 pb-10 z-20 flex">{monthlyChartData.map((d, i) => (
                    <div key={i} className="flex-1 h-full flex items-end justify-center cursor-pointer group relative" onMouseEnter={() => setActiveMonthlyIndex(i)} onMouseLeave={() => setActiveMonthlyIndex(null)}>
                         <div className={`w-full h-full hover:bg-indigo-500/5 transition-colors ${activeMonthlyIndex === i ? 'bg-indigo-500/10' : ''}`} />
                         {activeMonthlyIndex === i && (
                           <div className={`absolute left-1/2 -translate-x-1/2 min-w-[150px] text-center ${tooltipClass}`} style={{ bottom: `${(d.val / maxMonthlyValue) * 100}%`, transform: 'translate(-50%, -120%)' }}>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">DATE: {d.formattedDate}</p>
                             <p className="text-sm font-black font-inter leading-none">{formatCurrency(d.val)}</p>
                           </div>
                         )}
                         {activeMonthlyIndex === i && <div className="absolute w-3 h-3 bg-white border-2 border-indigo-400 rounded-full z-30 shadow-sm" style={{ bottom: `${(d.val / maxMonthlyValue) * 100}%`, marginBottom: '-6px' }} />}
                    </div>
                  ))}</div>
                  <svg viewBox="0 0 100 100" className="w-full h-full pb-10 relative z-10 overflow-visible" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="mGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={PALETTE.TREND_LINE} stopOpacity="0.55" />
                        <stop offset="100%" stopColor={PALETTE.TREND_LINE} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={`${monthlyPath} V 100 H 0 Z`} fill="url(#mGrad)" />
                    <path d={monthlyPath} fill="none" stroke={PALETTE.TREND_LINE} strokeWidth="4" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="absolute bottom-0 w-full flex justify-between text-[9px] font-black text-text-muted/30 px-1">{monthlyChartData.filter((_, i) => i % 2 === 0).map(d => (
                       <span key={d.day} className="flex-1 text-center">{d.day}</span>
                     ))}</div>
               </div></div>
          </div>
      </div>
    </div>
  );
};

export default IndividualCollectorDashboard;
