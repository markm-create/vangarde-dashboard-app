import React, { useState, useMemo, useEffect } from 'react';
import {ArrowLeft, Search, Download, FileText, ArrowUpDown, ArrowUp, ArrowDown, ClipboardCheck, X} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { ACCOUNT_MONITORING_AUDIT_SCRIPT_URL } from '../constants';

export const AccountMonitoringAuditView = ({ onBack, canExport }: { onBack: () => void, canExport: boolean }) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!ACCOUNT_MONITORING_AUDIT_SCRIPT_URL || ACCOUNT_MONITORING_AUDIT_SCRIPT_URL.trim() === '') {
           throw new Error("ACCOUNT_MONITORING_AUDIT_SCRIPT_URL is not configured.");
        }
        
        // Fetch data from Google Apps Script
        const response = await fetch(`${ACCOUNT_MONITORING_AUDIT_SCRIPT_URL}?action=getAuditLogs`);
        if (!response.ok) {
           throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success' && Array.isArray(result.data)) {
           // Enrich and map data
           const mappedData = result.data
             .filter((row: any[]) => {
               // Filter out empty rows and header rows (assuming Account Number is at index 1)
               if (!row || row.length < 5) return false;
               const accountNum = String(row[1] || '').trim().toLowerCase();
               if (accountNum === '' || accountNum.includes('account number') || accountNum === 'account') return false;
               return true;
             })
             .map((row: any[], index: number) => {
             // Skip header if it exists and we're parsing row 0, but script should handle that
             
             // Mapping based on guidelines:
             // A: Date Audited (0)
             // B: Account Number (1)
             // C: Collector Name (2)
             // D: Client Name (3)
             // E: Auditor Name (4)
             // F: Account Touch (5)
             // G: Account Status (6)
             // H: Business Type (7)
             // I: Phone Numbers (8)
             // J: Initial Notice (9)
             // K: Asset Affiliation (10)
             // L: Tax Assessor (11)
             // M: Contact Relatives (12)
             // N: Call All Phones (13)
             // O: Final Demand (14)
             // P: Third-Party Notice (15)
             // Q: Score (16)
             // R: Audit Comments (17)
             
             const rawScore = String(row[16] || 0).replace(/[^0-9]/g, '');
             const parsedScore = parseInt(rawScore, 10);
               
             const formatDate = (dateValue: any) => {
               if (!dateValue) return 'Unknown';
               try {
                 const date = new Date(dateValue);
                 if (isNaN(date.getTime())) return String(dateValue);
                 return date.toLocaleDateString('en-US', {
                   year: 'numeric',
                   month: 'short',
                   day: 'numeric'
                 });
               } catch (e) {
                 return String(dateValue);
               }
             };

             return {
               id: `audit-${index}`,
               rawDate: row[0],
               dateAudited: formatDate(row[0]),
               accountNumber: row[1] || 'Unknown',
               agentName: row[2] || 'Unknown',
               clientName: row[3] || 'Unknown',
               auditorName: row[4] || 'Unknown',
               comment: row[17] || '',
               score: isNaN(parsedScore) ? 0 : parsedScore,
               criteria: {
                 accountTouch: row[5] || 'None',
                 correctStatus: row[6] || 'No',
                 correctBusinessStatus: row[7] || 'No',
                 phoneNumbers: row[8] || 'No',
                 noticeRepSent: row[9] || 'No',
                 assetAffiliation: row[10] || 'No',
                 taxAssessor: row[11] || 'No',
                 contactRelatives: row[12] || 'No',
                 callAllPhones: row[13] || 'No',
                 finalDemand: row[14] || 'No',
                 requestThirdParty: row[15] || 'No',
               }
             };
           });
           setData(mappedData);
        } else {
           throw new Error(result.message || "Failed to fetch data");
        }
      } catch (err: any) {
        console.error("Error fetching audit logs:", err);
        setError(err.message || "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const [filterText, setFilterText] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'dateAudited', direction: 'desc' });
  const [selectedAudit, setSelectedAudit] = useState<any | null>(null);

  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  });
  const [selectedCollectorFilter, setSelectedCollectorFilter] = useState('All');

  const collectorOptions = useMemo(() => {
    const collectors = new Set<string>();
    data.forEach(item => {
      if (item.agentName && item.agentName !== 'Unknown') {
        collectors.add(item.agentName);
      }
    });
    return ['All', ...Array.from(collectors).sort()];
  }, [data]);

  const filteredData = useMemo(() => {
      let result = [...data];

      if (selectedCollectorFilter !== 'All') {
          result = result.filter(r => r.agentName === selectedCollectorFilter);
      }

      if (dateRange.start || dateRange.end) {
          result = result.filter(r => {
              if (!r.rawDate) return false;
              try {
                  const d = new Date(r.rawDate).getTime();
                  if (isNaN(d)) return false;
                  const start = dateRange.start ? new Date(dateRange.start).getTime() : -Infinity;
                  const end = dateRange.end ? new Date(dateRange.end).getTime() + 86400000 : Infinity;
                  return d >= start && d <= end;
              } catch (e) {
                  return false;
              }
          });
      }

      if (filterText) {
          const l = filterText.toLowerCase();
          result = result.filter(r => 
              r.accountNumber.toLowerCase().includes(l) || 
              r.agentName.toLowerCase().includes(l) || 
              r.auditorName.toLowerCase().includes(l)
          );
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
  }, [data, filterText, sortConfig, dateRange, selectedCollectorFilter]);

  const requestSort = (key: string) => {
      setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => sortConfig.key !== columnKey ? <ArrowUpDown size={12} className="ml-1 opacity-20 inline" /> : sortConfig.direction === 'asc' ? <ArrowUp size={12} className="ml-1 inline text-indigo-600" /> : <ArrowDown size={12} className="ml-1 inline text-indigo-600" />;

  const handleExport = () => {
    const headers = ["Date Audited", "Account Number", "Collector Name", "Auditor Name", "Score", "Audit Comment"];
    const rows = filteredData.map(r => [
      `"${r.dateAudited}"`, 
      `"${r.accountNumber}"`, 
      `"${r.agentName}"`, 
      `"${r.auditorName}"`, 
      r.score, 
      `"${r.comment}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Account_Monitoring_Audit.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPdf = () => {
    const element = document.getElementById('audit-report-content');
    if (element) {
      const opt = {
        margin:       10,
        filename:     `Audit_Report_${selectedAudit.accountNumber}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const }
      };
      html2pdf().set(opt).from(element).save();
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 h-screen flex flex-col items-center justify-center bg-app">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-text-muted font-medium">Loading Audit Logs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 h-screen flex flex-col items-center justify-center bg-app">
        <div className="bg-rose-50 text-rose-600 p-6 rounded-2xl max-w-md text-center border border-rose-100">
          <h3 className="font-bold mb-2">Failed to load data</h3>
          <p className="text-sm mb-4">{error}</p>
          <button onClick={onBack} className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-bold">Go Back</button>
        </div>
      </div>
    );
  }

  if (selectedAudit) {
    return (
      <div className="p-8 space-y-6 bg-app h-screen overflow-y-auto animate-in fade-in duration-500 font-sans">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <button onClick={() => setSelectedAudit(null)} className="flex items-center gap-2 px-4 py-2 bg-card border border-border-subtle rounded-xl text-text-muted hover:text-indigo-600 shadow-sm transition-all text-sm font-bold w-fit group">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back to List
          </button>
          <button onClick={handleDownloadPdf} className="flex items-center gap-2 px-6 py-2 bg-[#4f46e5] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#4338ca] shadow-lg active:scale-95 transition-all">
            <Download size={14} /> Download PDF
          </button>
        </div>

        <div id="audit-report-content" className="max-w-5xl mx-auto bg-card rounded-[2rem] border border-border-subtle shadow-sm overflow-hidden pb-6 mb-16">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 text-center">
            <h1 className="text-2xl font-black uppercase tracking-widest text-white">Agent Work Audit</h1>
            <p className="text-indigo-200 mt-1 font-medium text-xs">Detailed Account Monitoring & QA Report</p>
          </div>

          <div className="px-6 mt-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="bg-surface-50 p-3 border border-border-subtle rounded-xl flex flex-col justify-center">
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Account Number</span>
                  <span className="text-lg font-black text-indigo-600">{selectedAudit.accountNumber}</span>
                </div>
                <div className="bg-surface-50 p-3 border border-border-subtle rounded-xl flex flex-col justify-center lg:col-span-2">
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Collector Name</span>
                  <span className="text-base font-bold text-text-main">{selectedAudit.agentName}</span>
                </div>
                <div className="bg-surface-50 p-3 border border-border-subtle rounded-xl flex flex-col justify-center">
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Date Audited</span>
                  <span className="text-base font-bold text-text-main">{selectedAudit.dateAudited}</span>
                </div>
                <div className="bg-surface-50 p-3 border border-border-subtle rounded-xl flex flex-col justify-center">
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Client Name</span>
                  <span className="text-base font-bold text-text-main">{selectedAudit.clientName || 'N/A'}</span>
                </div>
                <div className="bg-surface-50 p-3 border border-border-subtle rounded-xl flex flex-col justify-center">
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Auditor</span>
                  <span className="text-base font-bold text-text-main">{selectedAudit.auditorName}</span>
                </div>
              </div>
              <div className="w-full md:w-40 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl flex flex-col items-center justify-center p-4 shrink-0">
                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Total Score</span>
                <span className={`text-5xl font-black ${selectedAudit.score >= 90 ? 'text-emerald-600' : selectedAudit.score >= 70 ? 'text-amber-500' : 'text-rose-500'}`}>
                  {selectedAudit.score}
                </span>
                <span className="text-xs font-bold text-indigo-600/70 dark:text-indigo-400/70 mt-1">/ 100</span>
              </div>
            </div>

            <div className="border border-border-subtle rounded-xl overflow-hidden bg-card shadow-sm mb-4">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-100/50">
                  <tr className="text-[9px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle">
                    <th className="px-3 py-2 w-8 text-center border-r border-border-subtle">#</th>
                    <th className="px-4 py-2 w-36 border-r border-border-subtle">Category</th>
                    <th className="px-4 py-2 border-r border-border-subtle">Question</th>
                    <th className="px-3 py-2 w-24 text-center border-r border-border-subtle">Achieved?</th>
                    <th className="px-3 py-2 w-16 text-center">Points</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-border-subtle">
                  {/* Row 1 */}
                  <tr className="hover:bg-surface-50 transition-colors">
                    <td className="px-3 py-2 text-center font-black text-text-muted border-r border-border-subtle bg-surface-50">1</td>
                    <td className="px-4 py-2 font-bold text-text-main border-r border-border-subtle bg-surface-50">Account Touch</td>
                    <td className="px-4 py-2 font-medium text-text-muted border-r border-border-subtle">How many times did the agent call the account within the 7-day requirement?</td>
                    <td className="px-3 py-2 border-r border-border-subtle text-center">
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded flex-1 w-full font-black text-[9px] uppercase shadow-sm ${selectedAudit.criteria.accountTouch === 'Twice' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : selectedAudit.criteria.accountTouch === 'Once' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>{selectedAudit.criteria.accountTouch}</span>
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-text-main">{selectedAudit.criteria.accountTouch === 'Twice' ? '10' : selectedAudit.criteria.accountTouch === 'Once' ? '5' : '0'}</td>
                  </tr>

                  {/* Row 2 - Structured with 2 sub criteria */}
                  <tr className="bg-surface-50/30">
                    <td rowSpan={2} className="px-3 py-2 text-center font-black text-text-muted border-r border-border-subtle align-top bg-surface-50">2</td>
                    <td className="px-4 py-2 font-bold text-text-main border-r border-border-subtle bg-surface-50 border-b border-border-subtle/50">Account Status</td>
                    <td className="px-4 py-2 font-medium text-text-muted border-r border-border-subtle border-b border-border-subtle/50">Is the account in the correct status?</td>
                    <td className="px-3 py-2 border-r border-border-subtle text-center border-b border-border-subtle/50">
                       <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded flex-1 w-full font-black text-[9px] uppercase shadow-sm ${selectedAudit.criteria.correctStatus === 'Yes' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : selectedAudit.criteria.correctStatus === 'N/A' ? 'bg-surface-100 text-text-muted border border-border-subtle' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>{selectedAudit.criteria.correctStatus}</span>
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-text-main border-b border-border-subtle/50">{(selectedAudit.criteria.correctStatus === 'Yes' || selectedAudit.criteria.correctStatus === 'N/A') ? '5' : '0'}</td>
                  </tr>
                  <tr className="bg-surface-50/30">
                    <td className="px-4 py-2 font-bold text-text-main border-r border-border-subtle bg-surface-50">Business Type</td>
                    <td className="px-4 py-2 font-medium text-text-muted border-r border-border-subtle">Does the account have the correct Business Status?</td>
                    <td className="px-3 py-2 border-r border-border-subtle text-center">
                       <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded flex-1 w-full font-black text-[9px] uppercase shadow-sm ${selectedAudit.criteria.correctBusinessStatus === 'Yes' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : selectedAudit.criteria.correctBusinessStatus === 'N/A' ? 'bg-surface-100 text-text-muted border border-border-subtle' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>{selectedAudit.criteria.correctBusinessStatus}</span>
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-text-main">{(selectedAudit.criteria.correctBusinessStatus === 'Yes' || selectedAudit.criteria.correctBusinessStatus === 'N/A') ? '5' : '0'}</td>
                  </tr>

                  {/* Rows 3-10 map */}
                  {[
                    { id: 3, cat: 'Phone Numbers', q: 'Are all phone numbers updated and marked properly?', a: selectedAudit.criteria.phoneNumbers },
                    { id: 4, cat: 'Initial Notice', q: 'Have the Notice of Proceedings and Letter of Representation been sent to the debtor?', a: selectedAudit.criteria.noticeRepSent },
                    { id: 5, cat: 'Asset Affiliation Inquiry', q: 'Did the agent send the Asset Affiliation Inquiry?', a: selectedAudit.criteria.assetAffiliation },
                    { id: 6, cat: 'Tax Assessor Inquiry', q: 'Did the agent send the Tax Assessor Inquiry?', a: selectedAudit.criteria.taxAssessor },
                    { id: 7, cat: 'Relative & Associate Inquiry', q: 'Did the agent call or contact the relatives or business associates?', a: selectedAudit.criteria.contactRelatives },
                    { id: 8, cat: 'Comprehensive Reachout', q: "Did the agent call all the debtor's possible phone numbers in the Media and IDI?", a: selectedAudit.criteria.callAllPhones },
                    { id: 9, cat: 'Final Demand', q: 'Did the agent send the Final Demand?', a: selectedAudit.criteria.finalDemand },
                    { id: 10, cat: 'Third-Party Notice', q: 'Did the agent request to send the third-party notices?', a: selectedAudit.criteria.requestThirdParty },
                  ].map(row => (
                    <tr key={row.id} className="hover:bg-surface-50 transition-colors">
                      <td className="px-3 py-2 text-center font-black text-text-muted border-r border-border-subtle bg-surface-50">{row.id}</td>
                      <td className="px-4 py-2 font-bold text-text-main border-r border-border-subtle bg-surface-50">{row.cat}</td>
                      <td className="px-4 py-2 font-medium text-text-muted border-r border-border-subtle">{row.q}</td>
                      <td className="px-3 py-2 border-r border-border-subtle text-center">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded flex-1 w-full font-black text-[9px] uppercase shadow-sm ${row.a === 'Yes' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : row.a === 'N/A' ? 'bg-surface-100 text-text-muted border border-border-subtle' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>{row.a}</span>
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-text-main">{(row.a === 'Yes' || row.a === 'N/A') ? '10' : '0'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-surface-50 p-4 border border-border-subtle rounded-xl flex flex-col shadow-sm mt-4">
              <span className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Audit Comments</span>
              <p className="text-xs font-bold text-text-main italic leading-relaxed">"{selectedAudit.comment}"</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-app h-screen max-h-screen flex flex-col animate-in fade-in duration-500 font-sans overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0">
          <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2.5 rounded-2xl bg-card border border-border-subtle text-text-muted hover:text-indigo-600 shadow-sm transition-all group">
                  <ArrowLeft size={20} className="group-hover:-translate-x-0.5" />
              </button>
              <div>
                  <h1 className="text-2xl font-black text-text-main uppercase tracking-tight">Account Monitoring Audit</h1>
                  <p className="text-text-muted font-bold text-[11px] tracking-[0.2em] mt-1 uppercase">Account Routine & Workflow QA</p>
              </div>
          </div>
          <div className="flex items-center gap-3">
              {canExport && (
                  <button onClick={handleExport} className="flex items-center justify-center gap-2 px-6 py-2 bg-[#4f46e5] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#4338ca] shadow-lg active:scale-95 transition-all">
                      <Download size={14} /> Export CSV
                  </button>
              )}
          </div>
      </div>

      <div className={`flex-1 bg-card rounded-[2rem] border border-border-subtle shadow-sm overflow-hidden flex flex-col min-h-0 transition-all duration-300`}>
          <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-card shrink-0">
              <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-surface-100 text-text-muted"><ClipboardCheck size={18} /></div>
                  <h2 className="text-sm font-black text-text-main uppercase tracking-widest">Audits List</h2>
              </div>
              <div className="flex gap-2">
                  <div className="flex items-center gap-2 bg-surface-100 border border-border-subtle rounded-xl px-3 py-1.5 shadow-sm">
                      <ClipboardCheck size={14} className="text-text-muted" />
                      <input 
                          type="date" 
                          value={dateRange.start} 
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                          className="bg-transparent border-none text-[10px] font-bold text-text-main focus:ring-0 p-0 w-24"
                      />
                      <span className="text-text-muted text-[10px] font-bold px-1">TO</span>
                      <input 
                          type="date" 
                          value={dateRange.end} 
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                          className="bg-transparent border-none text-[10px] font-bold text-text-main focus:ring-0 p-0 w-24"
                      />
                      <ClipboardCheck size={14} className="text-text-muted" />
                  </div>
                  <select
                      value={selectedCollectorFilter}
                      onChange={(e) => setSelectedCollectorFilter(e.target.value)}
                      className="px-4 py-2 bg-surface-100 border border-border-subtle rounded-xl text-[11px] font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                  >
                      {collectorOptions.map(opt => (
                          <option key={opt} value={opt}>{opt === 'All' ? 'All Collectors' : opt}</option>
                      ))}
                  </select>
                  <div className="relative group">
                      <Search size={14} className="absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input type="text" placeholder="Search accounts, agents..." value={filterText} onChange={(e) => setFilterText(e.target.value)} className="pl-9 pr-4 py-2 bg-surface-100 border border-border-subtle rounded-xl text-[11px] font-medium text-text-main w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                  </div>
              </div>
          </div>
          
          <div className="flex-1 overflow-auto scrollbar-thin">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="sticky top-0 z-20 bg-card">
                      <tr className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border-subtle bg-surface-100/50 backdrop-blur-sm">
                          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('dateAudited')}>Date Audited <SortIcon columnKey="dateAudited" /></th>
                          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('accountNumber')}>Account # <SortIcon columnKey="accountNumber" /></th>
                          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('agentName')}>Collector Name <SortIcon columnKey="agentName" /></th>
                          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('auditorName')}>Auditor <SortIcon columnKey="auditorName" /></th>
                          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors text-center" onClick={() => requestSort('score')}>Score <SortIcon columnKey="score" /></th>
                          <th className="px-6 py-5 cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => requestSort('comment')}>Audit Comment <SortIcon columnKey="comment" /></th>
                          <th className="px-6 py-5 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle text-[12px]">
                      {filteredData.length > 0 ? filteredData.map((row) => (
                          <tr key={row.id} className="hover:bg-surface-100 transition-colors group">
                              <td className="px-6 py-4 font-black text-text-main">{row.dateAudited}</td>
                              <td className="px-6 py-4 font-bold">
                                <span className="text-indigo-600 dark:text-indigo-400">{row.accountNumber}</span>
                              </td>
                              <td className="px-6 py-4 font-bold text-text-main">{row.agentName}</td>
                              <td className="px-6 py-4 text-text-muted">{row.auditorName}</td>
                              <td className="px-6 py-4 text-center">
                                <div className={`inline-flex items-center justify-center min-w-[36px] h-6 px-2 rounded-md font-black text-[10px] uppercase shadow-sm ${
                                  row.score >= 90 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                  row.score >= 70 ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                  'bg-rose-50 text-rose-600 border border-rose-100'
                                }`}>
                                  {row.score}
                                </div>
                              </td>
                              <td className="px-6 py-4 font-medium text-text-muted max-w-xs truncate" title={row.comment}>{row.comment}</td>
                              <td className="px-6 py-4 text-right">
                                  <button onClick={() => setSelectedAudit(row)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                                    View Detailed Audit
                                  </button>
                              </td>
                          </tr>
                      )) : (
                          <tr><td colSpan={7} className="px-6 py-20 text-center opacity-30"><FileText size={48} className="mx-auto mb-4" /><p className="text-sm font-black uppercase tracking-widest">No audits found</p></td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};
