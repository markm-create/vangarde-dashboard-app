import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ChevronDown, 
  X,
  TrendingUp,
  ArrowRight,
  Activity,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useData } from '../DataContext';
import { EXECUTIVE_SCRIPT_URL } from '../constants';

const ExecutiveOverview: React.FC = () => {
  const { executive, fetchExecutive } = useData();

  useEffect(() => {
    fetchExecutive();
    const interval = setInterval(() => {
      fetchExecutive(true);
    }, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, [fetchExecutive]);

  const getESTTime = () => new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const isPast11AM = (date: Date) => date.getHours() >= 11;
  const getSnappedWednesday = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    const day = d.getDay();
    let diff = day >= 3 ? (day - 3) : (day + 4);
    const wed = new Date(d);
    wed.setDate(d.getDate() - diff);
    return wed;
  };
  const formatISO = (date: Date) => date.toISOString().split('T')[0];
  const getCycleRangeText = (wedDateStr: string) => {
    const wed = new Date(wedDateStr + "T12:00:00");
    const tue = new Date(wed); tue.setDate(wed.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(wed)} - ${fmt(tue)}`;
  };

  const [currentCycleStart, setCurrentCycleStart] = useState<string>(() => {
    const now = getESTTime();
    let snapped = getSnappedWednesday(formatISO(now));
    return formatISO(snapped);
  });

  const [priorCycleStart, setPriorCycleStart] = useState<string>(() => {
    const current = new Date(currentCycleStart + "T12:00:00");
    const prior = new Date(current); prior.setDate(current.getDate() - 7);
    return formatISO(prior);
  });

  const [monthlyPeriod, setMonthlyPeriod] = useState<string>(() => {
    const est = getESTTime();
    return est.toISOString().slice(0, 7);
  });

  const [yearlyComp, setYearlyComp] = useState(() => {
    const est = getESTTime();
    const currentYear = est.getFullYear();
    return { year1: currentYear.toString(), year2: (currentYear - 1).toString() };
  });

  const [hoveredWeekly, setHoveredWeekly] = useState<number | null>(null);
  const [hoveredYearly, setHoveredYearly] = useState<number | null>(null);
  const [hoveredMonthly, setHoveredMonthly] = useState<number | null>(null);

  const COLORS = { PRIMARY: "#6366f1", SECONDARY: "#818cf8", MINT: "#34d399", MONTHLY_TREND: "#5c6b9f" };
  const formatFullCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);
  const mapY = (val: number, max: number = 100) => 95 - (val / max) * 90; 
  const mapX = (val: number) => 2 + (val / 100) * 96; 
  const getPathThroughPoints = (pts: {x: number, y: number}[], maxVal: number = 100) => {
    if (pts.length === 0) return "";
    if (pts.length === 1) {
      const mapped = [mapX(pts[0].x), mapY(pts[0].y, maxVal)];
      return `M ${mapped[0]},${mapped[1]} L ${mapped[0]},${mapped[1]}`;
    }
    const mapped = pts.map(p => [mapX(p.x), mapY(p.y, maxVal)]);
    let d = `M ${mapped[0][0]},${mapped[0][1]}`;
    for (let i = 0; i < mapped.length - 1; i++) {
      const p0 = i > 0 ? mapped[i - 1] : mapped[i];
      const p1 = mapped[i];
      const p2 = mapped[i + 1];
      const p3 = i < mapped.length - 2 ? mapped[i + 2] : mapped[i + 1];
      const tension = 0.2;
      
      const cp1x = p1[0] + (p2[0] - p0[0]) * tension;
      // Clamp to baseline (95) and top (5)
      const cp1y = Math.min(95, Math.max(5, p1[1] + (p2[1] - p0[1]) * tension));
      const cp2x = p2[0] - (p3[0] - p1[0]) * tension;
      const cp2y = Math.min(95, Math.max(5, p2[1] - (p3[1] - p1[1]) * tension));
      
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
    }
    return d;
  };

  const safeFormat = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    // If it's already a short date or doesn't look like YYYY-MM-DD, return as is
    if (dateStr.length < 10 && !dateStr.includes('-')) return dateStr;
    
    const d = new Date(dateStr + "T12:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  };

  const weeklyData = useMemo(() => {
    const colors = ["#5B6892", "#C186FE", "#828DFF", "#97C8FF", "#80E1C1"];

    if (executive.data?.weeklyTrends) {
      const { current, prior } = executive.data.weeklyTrends;
      
      return current.map((item, i) => {
        const formattedLabel = safeFormat(item.day);
        const priItem = prior[i];
        const priFormatted = priItem ? safeFormat(priItem.day) : '';

        return {
          label: formattedLabel,
          curDate: formattedLabel,
          priDate: priFormatted,
          current: parseFloat(item.value?.toString() || "0"),
          prior: parseFloat(priItem?.value?.toString() || "0"),
          color: colors[i % colors.length]
        };
      });
    }

    // Fallback/Initial mock logic if no data
    const curStart = new Date(currentCycleStart + "T12:00:00");
    const priStart = new Date(priorCycleStart + "T12:00:00");
    const offsets = [0, 1, 2, 5, 6]; 
    return offsets.map((offset, i) => {
      const dCur = new Date(curStart); dCur.setDate(curStart.getDate() + offset);
      const dPri = new Date(priStart); dPri.setDate(priStart.getDate() + offset);
      const seedCur = dCur.getDate() + dCur.getMonth(); const seedPri = dPri.getDate() + dPri.getMonth();
      const formattedLabel = dCur.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      return { 
        label: formattedLabel, 
        curDate: formattedLabel, 
        priDate: dPri.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }), 
        current: 12000 + (Math.sin(seedCur) * 8000), 
        prior: 15000 + (Math.cos(seedPri) * 5000), 
        color: colors[i % colors.length] 
      };
    });
  }, [currentCycleStart, priorCycleStart, executive.data]);

  const monthlyData = useMemo(() => {
    if (executive.data?.monthlyCycle) {
      // Filter by selected monthlyPeriod (YYYY-MM)
      return executive.data.monthlyCycle
        .filter(d => d.date.startsWith(monthlyPeriod))
        .map(d => ({
          day: d.date.split('-').pop() || d.date,
          formattedDate: safeFormat(d.date),
          val: parseFloat(d.amount.toString()) || 0
        }));
    }

    const [year, month] = monthlyPeriod.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const days = []; while (date.getMonth() === month - 1) { if (date.getDay() !== 0 && date.getDay() !== 6) days.push(new Date(date)); date.setDate(date.getDate() + 1); }
    return days.map((d, i) => ({ 
      day: d.getDate().toString(), 
      formattedDate: d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
      val: 9000 + (Math.sin((d.getDate() * (i + 1)) / 4) * 7000) 
    }));
  }, [monthlyPeriod, executive.data]);

  const monthlyMax = useMemo(() => {
    const vals = monthlyData.map(d => d.val);
    return Math.max(1000, ...vals) * 1.2;
  }, [monthlyData]);

  const monthlyPts = monthlyData.map((d, i) => ({ x: monthlyData.length > 1 ? (i / (monthlyData.length - 1)) * 100 : 50, y: (d.val / monthlyMax) * 100 }));
  const yearlyMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  
  const yearlyChartData = useMemo(() => {
    const rawData = yearlyMonths.map((m, i) => {
      if (executive.data?.yearlyCycle) {
        const monthNum = (i + 1);
        const monthName = m.toUpperCase();
        
        const findVal = (year: string) => {
          const entry = executive.data?.yearlyCycle.find(d => {
            // Handle both new {year, month, amount} and old {period, amount} formats
            const y = (d.year || d.period || "").toString().toUpperCase();
            const mon = (d.month || d.period || "").toString().toUpperCase();
            
            // Extremely robust matching for various formats
            const hasYear = y.includes(year);
            const hasMonth = mon.includes(monthName) || 
                             mon.includes(`-${monthNum.toString().padStart(2, '0')}`) ||
                             mon.includes(` ${monthNum} `) ||
                             mon.includes(`/${monthNum}/`) ||
                             mon.includes(`/${monthNum.toString().padStart(2, '0')}/`);
            
            return hasYear && hasMonth;
          });
          return parseFloat(entry?.amount?.toString() || "0");
        };

        return { v1: findVal(yearlyComp.year1), v2: findVal(yearlyComp.year2), x: (i / (yearlyMonths.length - 1)) * 100 };
      } else {
        const s1 = parseInt(yearlyComp.year1) + i; const s2 = parseInt(yearlyComp.year2) + i;
        return { v1: 250000 + (Math.sin(s1) * 120000), v2: 180000 + (Math.cos(s2) * 90000), x: (i / (yearlyMonths.length - 1)) * 100 };
      }
    });

    const maxVal = Math.max(1000, ...rawData.flatMap(d => [d.v1, d.v2])) * 1.2;

    return rawData.map(d => ({
      ...d,
      y1: (d.v1 / maxVal) * 100,
      y2: (d.v2 / maxVal) * 100,
      maxVal
    }));
  }, [yearlyComp, yearlyMonths, executive.data]);

  const kpis = useMemo(() => {
    if (executive.data?.coreKpis) {
      const { priorDate, wtd, mtd } = executive.data.coreKpis;
      
      const formatVal = (v: any) => parseFloat(v?.toString() || "0");
      const calcPct = (col: any, tar: any) => {
        const c = formatVal(col);
        const t = formatVal(tar);
        return t > 0 ? Math.round((c / t) * 100) : 0;
      };

      return [
        { 
          label: "Prior Date Collected", 
          val: formatFullCurrency(formatVal(priorDate.collected)), 
          target: formatFullCurrency(formatVal(priorDate.target)), 
          pct: calcPct(priorDate.collected, priorDate.target), 
          color: COLORS.MINT 
        },
        { 
          label: "Week to Date Collected", 
          val: formatFullCurrency(formatVal(wtd.collected)), 
          target: formatFullCurrency(formatVal(wtd.target)), 
          pct: calcPct(wtd.collected, wtd.target), 
          color: COLORS.PRIMARY 
        },
        { 
          label: "Month to Date Collected", 
          val: formatFullCurrency(formatVal(mtd.collected)), 
          target: formatFullCurrency(formatVal(mtd.target)), 
          pct: calcPct(mtd.collected, mtd.target), 
          color: COLORS.SECONDARY 
        },
      ];
    }

    return [
      { label: "Prior Date Collected", val: "$1,671.78", target: "$26,666.67", pct: 6, color: COLORS.MINT },
      { label: "Week to Date Collected", val: "$16,722.80", target: "$140,000.00", pct: 12, color: COLORS.PRIMARY },
      { label: "Month to Date Collected", val: "$23,105.80", target: "$560,000.00", pct: 4, color: COLORS.SECONDARY },
    ];
  }, [executive.data]);

  const clientData = useMemo(() => {
    if (executive.data?.clientPerformance) {
      return executive.data.clientPerformance.map((c, i) => ({
        name: c.clientName,
        prior: formatFullCurrency(parseFloat(c.priorDateCollected.toString()) || 0),
        wtd: formatFullCurrency(parseFloat(c.wtdCollected.toString()) || 0),
        mtd: formatFullCurrency(parseFloat(c.mtdCollected.toString()) || 0),
        targetAmount: formatFullCurrency(parseFloat(c.mtdTarget.toString()) || 0),
        percent: Math.round(parseFloat(c.percentReached) || 0),
        color: i % 2 === 0 ? COLORS.PRIMARY : COLORS.MINT
      }));
    }

    return [
      { name: "Everest Business Funding", prior: "$921.78", wtd: "$15,204.34", mtd: "$20,587.34", targetAmount: "$450,000.00", percent: 5, color: COLORS.PRIMARY },
      { name: "Plumeria Accord Holdings LLC", prior: "$500.00", wtd: "$1,268.46", mtd: "$2,268.46", targetAmount: "$300,000.00", percent: 1, color: COLORS.MINT },
      { name: "RoadSync", prior: "$0.00", wtd: "$0.00", mtd: "$0.00", targetAmount: "$200,000.00", percent: 0, color: COLORS.PRIMARY },
      { name: "Giggle Finance", prior: "$0.00", wtd: "$0.00", mtd: "$0.00", targetAmount: "$150,000.00", percent: 0, color: COLORS.PRIMARY },
    ];
  }, [executive.data]);

  const agencyTotal = executive.data?.coreKpis?.agency 
    ? formatFullCurrency(parseFloat(executive.data.coreKpis.agency.toString()) || 0) 
    : "$0.00";
  const clientTotal = executive.data?.coreKpis?.client 
    ? formatFullCurrency(parseFloat(executive.data.coreKpis.client.toString()) || 0) 
    : "$0.00";

  const isDataEmpty = executive.data && 
    parseFloat(executive.data.coreKpis.priorDate.collected.toString()) === 0 && 
    parseFloat(executive.data.coreKpis.wtd.collected.toString()) === 0 &&
    parseFloat(executive.data.coreKpis.mtd.collected.toString()) === 0;

  if (executive.isLoading && !executive.data) {
    return (
      <div className="p-8 bg-app h-screen flex flex-col items-center justify-center animate-in fade-in duration-500">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-500" size={48} />
          <p className="text-text-muted font-black text-xs uppercase tracking-[0.2em]">Syncing Executive Data...</p>
        </div>
      </div>
    );
  }

  // If no data and not loading, show a message
  const hasData = executive.data && executive.data.coreKpis;

  if (executive.error) {
    return (
      <div className="p-8 bg-app h-screen flex flex-col items-center justify-center animate-in fade-in duration-500">
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-8 rounded-3xl max-w-md text-center shadow-xl">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600 dark:text-rose-400">
            <X size={32} />
          </div>
          <h2 className="text-xl font-bold text-text-main mb-2 uppercase tracking-tight">Sync Failed</h2>
          <p className="text-text-muted text-sm mb-6 leading-relaxed">
            We couldn't connect to the Google Sheets database. This is often caused by browser security settings or multiple Google accounts being logged in.
          </p>
          <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl mb-6 text-[10px] font-mono text-rose-600 dark:text-rose-400 break-all">
            <div className="mb-2 font-black border-b border-rose-200 dark:border-rose-800 pb-1 uppercase">Error Details:</div>
            {executive.error}
            <div className="mt-4 mb-2 font-black border-b border-rose-200 dark:border-rose-800 pb-1 uppercase">Script URL:</div>
            {EXECUTIVE_SCRIPT_URL}
          </div>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => fetchExecutive(true)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase text-[11px] tracking-widest transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              Retry Sync
            </button>
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
              Try opening in an Incognito window
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasData && !executive.isLoading) {
    return (
      <div className="p-8 bg-app h-screen flex flex-col items-center justify-center animate-in fade-in duration-500">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-8 rounded-3xl max-w-md text-center shadow-xl">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600 dark:text-indigo-400">
            <Activity size={32} />
          </div>
          <h2 className="text-xl font-bold text-text-main mb-2 uppercase tracking-tight">No Data Found</h2>
          <p className="text-text-muted text-sm mb-6 leading-relaxed">
            The database is connected, but no data was returned. Please check your Google Sheets to ensure the cells are populated and the sheet names match exactly.
          </p>
          <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl mb-6 text-[10px] font-mono text-indigo-600 dark:text-indigo-400 text-left">
            <div className="mb-1 font-black uppercase">Expected Sheets:</div>
            • Client (G3, F3)<br/>
            • Agent (C3, F3, I3)<br/>
            • Target (B2, C25, D2)<br/>
            • WTD (B3, D3, F3, H3, J3, M3, O3, Q3, S3, U3)<br/>
            • MTD (Col AY, AZ)<br/>
            • YTD (Col A, C)
          </div>
          <button 
            onClick={() => fetchExecutive(true)}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase text-[11px] tracking-widest transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            Check Again
          </button>
        </div>
      </div>
    );
  }

  const headerTitleClass = "text-[11px] font-black uppercase tracking-[0.15em] text-text-muted";
  const metricValueClass = "text-3xl font-black tracking-tight leading-none mb-2 font-inter text-text-main";
  const tooltipClass = "bg-slate-900 dark:bg-black text-white px-3 py-2 rounded-xl z-[100] shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200 pointer-events-none";
  const filterInputClass = "bg-card border border-border-subtle rounded-lg px-2.5 py-1.5 text-[10px] font-black text-text-main uppercase outline-none focus:border-indigo-400 transition-all cursor-pointer shadow-sm hover:bg-surface-100 w-full";

  return (
    <div className="p-8 bg-app h-screen max-h-screen flex flex-col animate-in fade-in duration-500 font-sans overflow-hidden">
      <div className="mb-8 shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-main uppercase tracking-wide">Executive Overview</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-text-muted font-semibold text-[11px] tracking-widest uppercase">Agency Performance & Revenue Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isDataEmpty && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
              Data is Zero - Check Sheets
            </div>
          )}
          {executive.isLoading && (
            <div className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-widest">
              <Loader2 className="animate-spin" size={14} />
              Syncing Data...
            </div>
          )}
          <button 
            onClick={() => fetchExecutive(true)}
            disabled={executive.isLoading}
            className="p-2 rounded-xl bg-surface-100 border border-border-subtle text-text-muted hover:text-indigo-500 hover:border-indigo-200 transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={executive.isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.3fr_1.3fr_1.5fr_1.5fr_1.5fr] gap-6 shrink-0 mb-8">
        <div className="bg-gradient-to-br from-[#818cf8] via-[#6366f1] to-[#4f46e5] p-6 rounded-2xl shadow-lg flex flex-col justify-center text-white overflow-hidden relative h-36">
          <div className="absolute inset-0 overflow-hidden pointer-events-none text-white/10"><svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none"><path d="M-20,200 C50,180 120,50 220,100 C320,150 380,40 420,60 L420,200 Z" fill="currentColor" /><path d="M0,200 C150,220 200,100 350,120 C420,130 450,80 500,100 L500,200 L0,200 Z" fill="currentColor" /></svg></div>
          <div className="relative z-10">
            <p className="text-[11px] font-black uppercase tracking-[0.15em] mb-2 text-white/90">Agency</p>
            <h3 className="text-3xl font-black tracking-tight leading-none font-inter text-white">{agencyTotal}</h3>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-lg flex flex-col justify-center text-white overflow-hidden relative h-36">
          <div className="absolute inset-0 overflow-hidden pointer-events-none text-white/10"><svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none"><path d="M-20,200 C50,180 120,50 220,100 C320,150 380,40 420,60 L420,200 Z" fill="currentColor" /><path d="M0,200 C150,220 200,100 350,120 C420,130 450,80 500,100 L500,200 L0,200 Z" fill="currentColor" /></svg></div>
          <div className="relative z-10">
            <p className="text-[11px] font-black uppercase tracking-[0.15em] mb-2 text-white/90">Client</p>
            <h3 className="text-3xl font-black tracking-tight leading-none font-inter text-white">{clientTotal}</h3>
          </div>
        </div>

        {kpis.map((kpi, i) => (
          <div key={i} className="bg-card p-6 rounded-2xl shadow-sm border border-border-subtle flex justify-between items-center transition-all hover:shadow-md h-36">
            <div className="flex flex-col">
              <p className={`${headerTitleClass} mb-2 whitespace-nowrap`}>{kpi.label}</p>
              <h3 className={metricValueClass}>{kpi.val}</h3>
              <p className="text-[10px] font-bold text-text-muted mt-1 uppercase tracking-wider">Target: <span className="font-inter font-normal">{kpi.target}</span></p>
            </div>
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="var(--border-subtle)" strokeWidth="8" />
                <circle cx="40" cy="40" r="32" fill="none" stroke={kpi.color} strokeWidth="8" strokeDasharray={201.06} strokeDashoffset={201.06 * (1 - kpi.pct / 100)} strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <span className="absolute text-xs font-black text-text-main">{kpi.pct}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-2 gap-8 pb-8">
        <div className="bg-card p-6 rounded-[1.5rem] shadow-sm border border-border-subtle flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-4 shrink-0"><h3 className={headerTitleClass}>Client Performance</h3></div>
          <div className="flex-1 overflow-auto scrollbar-none">
            <table className="w-full text-left">
              <thead><tr className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-subtle sticky top-0 bg-card z-10"><th className="pb-3"></th><th className="pb-3 text-center">Prior</th><th className="pb-3 text-center">WTD</th><th className="pb-3 text-center">MTD</th><th className="pb-3 text-center">Goal</th><th className="pb-3 text-right">Progress</th></tr></thead>
              <tbody className="divide-y divide-border-subtle">{clientData.map((client, i) => (<tr key={i} className="group hover:bg-surface-100 transition-colors"><td className="py-4 flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: client.color }}></div><span className="text-[12px] font-bold text-text-main font-inter truncate">{client.name}</span></td><td className="py-4 text-center text-[12px] font-bold text-text-muted font-inter">{client.prior}</td><td className="py-4 text-center text-[12px] font-bold text-text-muted font-inter">{client.wtd}</td><td className="py-4 text-center text-[12px] font-bold text-text-muted font-inter">{client.mtd}</td><td className="py-4 text-center text-[12px] font-bold text-text-muted font-inter">{client.targetAmount}</td><td className="py-4 text-right"><div className="flex items-center justify-end gap-3"><span className="text-[9px] font-black text-text-muted">{client.percent}%</span><div className="w-24 h-2.5 bg-surface-100 rounded-full overflow-hidden shrink-0"><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${client.percent}%`, backgroundColor: client.color }}></div></div></div></td></tr>))}</tbody>
            </table>
          </div>
        </div>

        <div className="bg-card p-6 rounded-[1.5rem] shadow-sm border border-border-subtle flex flex-col relative overflow-visible">
          <div className="flex justify-between items-start mb-6 shrink-0"><h3 className={headerTitleClass}>Weekly Cycle</h3>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end gap-1.5">
                 <div className="flex items-center gap-3"><span className="text-[8px] font-black text-text-muted uppercase tracking-[0.1em]">Prior</span><span className="text-[10px] font-black text-text-muted bg-surface-100 px-2.5 py-1 rounded-full border border-border-subtle">{getCycleRangeText(priorCycleStart)}</span></div>
                 <div className="flex items-center gap-3"><span className="text-[8px] font-black text-text-muted uppercase tracking-[0.1em]">Current</span><span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">{getCycleRangeText(currentCycleStart)}</span></div>
              </div>
            </div>
          </div>
          <div className="relative flex-1 flex gap-4 min-h-0 overflow-visible">
            <div className="flex flex-col justify-between text-[10px] font-bold text-text-muted/40 w-10 text-right pr-2 shrink-0 pb-6">
              {[1, 0.75, 0.5, 0.25, 0].map(p => {
                const max = Math.max(1000, ...weeklyData.flatMap(d => [d.current, d.prior]));
                const val = (max * p) / 1000;
                return <span key={p}>${val >= 1 ? Math.round(val) : val.toFixed(1)}k</span>
              })}
            </div>
            <div className="flex-1 flex flex-col min-h-0 overflow-visible">
              <div className="flex-1 relative border-l border-b border-border-subtle overflow-visible">
                <div className="absolute inset-0 flex items-end justify-between px-4 overflow-visible">
                  {weeklyData.map((b, i) => {
                    const max = Math.max(1000, ...weeklyData.flatMap(d => [d.current, d.prior]));
                    const ch = Math.min(85, (b.current / max) * 100); const ph = Math.min(85, (b.prior / max) * 100);
                    return (
                      <div key={i} className="flex-1 h-full flex flex-col items-center justify-end group cursor-pointer relative overflow-visible" onMouseEnter={() => setHoveredWeekly(i)} onMouseLeave={() => setHoveredWeekly(null)}>
                        {hoveredWeekly === i && (
                          <div className={`absolute left-1/2 -translate-x-1/2 min-w-[200px] text-center ${tooltipClass}`} style={{ top: `${100 - Math.max(ch, ph)}%`, transform: 'translate(-50%, -115%)' }}>
                             <div className="flex justify-between text-[10px] font-black mb-2 border-b border-white/10 pb-1"><span className="text-white/40 uppercase">DATE</span><span style={{ color: b.color }}>{b.label}</span></div>
                             <div className="flex justify-between text-xs font-black mb-1"><span className="text-white/60 mr-4">{b.priDate}</span><span>{formatFullCurrency(b.prior)}</span></div>
                             <div className="flex justify-between text-xs font-black"><span className="text-white/60 mr-4">{b.curDate}</span><span>{formatFullCurrency(b.current)}</span></div>
                          </div>
                        )}
                        <div className="flex items-end gap-2 h-full"><div className="w-10 rounded-t-md opacity-20" style={{ height: `${ph}%`, backgroundColor: b.color }}></div><div className="w-10 rounded-t-md" style={{ height: `${ch}%`, backgroundColor: b.color }}></div></div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-between pt-2 px-4 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.2em] shrink-0">{weeklyData.map((b, i) => <span key={`${b.label}-${i}`} className="flex-1 text-center">{b.label}</span>)}</div>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-[1.5rem] shadow-sm border border-border-subtle flex flex-col relative overflow-visible">
          <div className="flex justify-between items-center mb-6 shrink-0"><h3 className={headerTitleClass}>Monthly Cycle</h3><input type="month" value={monthlyPeriod} onChange={(e) => setMonthlyPeriod(e.target.value)} className="bg-surface-100 border border-border-subtle rounded-lg px-2.5 py-1.5 text-[10px] font-black text-text-muted uppercase outline-none" /></div>
          <div className="relative flex-1 flex gap-4 min-h-0 overflow-visible">
             <div className="flex flex-col justify-between text-[10px] font-bold text-text-muted/40 w-10 text-right pr-2 shrink-0 pb-6">
               {[1, 0.75, 0.5, 0.25, 0].map(p => <span key={p}>${Math.round((monthlyMax * p) / 1000)}k</span>)}
             </div>
             <div className="flex-1 flex flex-col min-h-0 overflow-visible">
                <div className="flex-1 relative border-l border-b border-border-subtle overflow-visible">
                  <svg className="absolute inset-0 w-full h-full block overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="areaFit" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COLORS.MONTHLY_TREND} stopOpacity="0.55" /><stop offset="100%" stopColor={COLORS.MONTHLY_TREND} stopOpacity="0" /></linearGradient></defs><path d={`${getPathThroughPoints(monthlyPts, 100)} L ${mapX(100)},95 L ${mapX(0)},95 Z`} fill="url(#areaFit)" /><path d={getPathThroughPoints(monthlyPts, 100)} fill="none" stroke={COLORS.MONTHLY_TREND} strokeWidth="3.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" /></svg>
                  <div className="absolute inset-0 flex overflow-visible">{monthlyData.map((d, i) => (<div key={i} className="flex-1 h-full cursor-pointer hover:bg-surface-100/5 relative" onMouseEnter={() => setHoveredMonthly(i)} onMouseLeave={() => setHoveredMonthly(null)}>{hoveredMonthly === i && (<div className={`absolute left-1/2 -translate-x-1/2 min-w-[150px] text-center ${tooltipClass}`} style={{ top: `${mapY((d.val/monthlyMax)*100)}%`, transform: 'translate(-50%, -120%)' }}><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">DATE: {d.formattedDate}</p><p className="text-sm font-black font-inter">{formatFullCurrency(d.val)}</p></div>)}</div>))}</div>
                </div>
                <div className="flex justify-between pt-2 px-0 text-[9px] font-black text-text-muted/40 shrink-0">{monthlyData.map((d, i) => (<span key={i} className="flex-1 text-center">{d.day}</span>))}</div>
             </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-[1.5rem] shadow-sm border border-border-subtle flex flex-col relative overflow-visible">
          <div className="flex justify-between items-center mb-6 shrink-0"><h3 className={headerTitleClass}>Yearly Cycle</h3><div className="flex items-center gap-2.5"><select value={yearlyComp.year1} onChange={(e) => setYearlyComp(p => ({ ...p, year1: e.target.value }))} className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-lg px-2.5 py-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 outline-none">{["2027","2026","2025","2024","2023","2022"].map(y => <option key={y} value={y}>{y}</option>)}</select><span className="text-[9px] font-black text-text-muted">VS</span><select value={yearlyComp.year2} onChange={(e) => setYearlyComp(p => ({ ...p, year2: e.target.value }))} className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-lg px-2.5 py-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 outline-none">{["2027","2026","2025","2024","2023","2022"].map(y => <option key={y} value={y}>{y}</option>)}</select></div></div>
          <div className="relative flex-1 flex gap-4 min-h-0 overflow-visible">
             <div className="flex flex-col justify-between text-[10px] font-bold text-text-muted/40 w-10 text-right pr-2 shrink-0 pb-6">
               {[1, 0.75, 0.5, 0.25, 0].map(p => <span key={p}>${Math.round((yearlyChartData[0]?.maxVal * p) / 1000)}k</span>)}
             </div>
             <div className="flex-1 flex flex-col min-h-0 overflow-visible relative">
                <div className="flex-1 relative border-l border-b border-border-subtle overflow-visible">
                  <svg className="absolute inset-0 w-full h-full block overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none"><path d={getPathThroughPoints(yearlyChartData.map(d => ({ x: d.x, y: d.y2 })), 100)} fill="none" stroke="#34d399" strokeWidth="3.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round"/><path d={getPathThroughPoints(yearlyChartData.map(d => ({ x: d.x, y: d.y1 })), 100)} fill="none" stroke="#6366f1" strokeWidth="3.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round"/></svg>
                  {yearlyChartData.map((p, i) => (<React.Fragment key={i}><div className="absolute w-3 h-3 rounded-full bg-emerald-400 shadow-md border-[2px] border-card pointer-events-none" style={{ left: `${mapX(p.x)}%`, top: `${mapY(p.y2, 100)}%`, transform: 'translate(-50%, -50%)' }}/><div className="absolute w-3 h-3 rounded-full bg-[#6366f1] shadow-md border-[2px] border-card cursor-pointer hover:scale-150 transition-transform" onMouseEnter={() => setHoveredYearly(i)} onMouseLeave={() => setHoveredYearly(null)} style={{ left: `${mapX(p.x)}%`, top: `${mapY(p.y1, 100)}%`, transform: 'translate(-50%, -50%)' }}/></React.Fragment>))}
                  {hoveredYearly !== null && (<div className={`absolute text-center min-w-[200px] ${tooltipClass}`} style={{ left: `${mapX(yearlyChartData[hoveredYearly].x)}%`, top: `${mapY(yearlyChartData[hoveredYearly].y1, 100)}%`, transform: 'translate(-50%, -125%)' }}><p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">{yearlyMonths[hoveredYearly]} SUMMARY</p><div className="flex justify-between text-xs font-black mb-1"><span className="text-white/60 mr-4">{yearlyComp.year1}</span><span>{formatFullCurrency(yearlyChartData[hoveredYearly].v1)}</span></div><div className="flex justify-between text-xs font-black"><span className="text-white/60 mr-4">{yearlyComp.year2}</span><span>{formatFullCurrency(yearlyChartData[hoveredYearly].v2)}</span></div></div>)}
                </div>
                <div className="flex justify-between pt-2 px-0 shrink-0">{yearlyMonths.map(m => (<span key={m} className="flex-1 text-center text-[9px] font-black text-text-muted/40 uppercase">{m.slice(0,3)}</span>))}</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveOverview;