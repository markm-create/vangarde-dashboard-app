import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  Download, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  Sparkles,
  Check,
  X,
  Clock,
  User,
  FileText,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Edit2,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppUser } from '../types';
import { GoogleGenAI } from "@google/genai";
import { sheetService } from '../services/sheetService';
import { useData } from '../DataContext';

interface RPCLog {
  id: string;
  date: string;
  collectorName: string;
  accountNumber: string;
  clientName: string;
  moneyPlanned: 'Yes' | 'No';
  caseUpdate: 'Collected' | 'Ghosted' | 'RTP';
  notes: string;
  createdAt: string;
}

interface RPCLogsDashboardProps {
  currentUser: AppUser;
}

interface FilterState {
  collector: string;
  client: string;
  moneyPlanned: string;
  caseUpdate: string;
}

const DEFAULT_CLIENTS = ['EBF-NEW', 'EBF-QS', 'Plumeria', 'RoadSync', 'Giggle'];
const CLIENTS_STORAGE_KEY = 'vg_rpc_clients';

const RPCLogsDashboard: React.FC<RPCLogsDashboardProps> = ({ currentUser }) => {
  const { rpcLogs, fetchRPCLogs, updateRPCLogsLocal } = useData();
  const { data: logs, isLoading } = rpcLogs;
  
  const [editingLog, setEditingLog] = useState<RPCLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });
  
  // Filter State
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    collector: '',
    client: '',
    moneyPlanned: '',
    caseUpdate: ''
  });
  
  // Client Dropdown State
  const [clients, setClients] = useState<string[]>(() => {
    const saved = localStorage.getItem(CLIENTS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_CLIENTS;
  });
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    accountNumber: '',
    clientName: '',
    moneyPlanned: 'No' as 'Yes' | 'No',
    caseUpdate: 'Ghosted' as 'Collected' | 'Ghosted' | 'RTP',
    notes: ''
  });
  const [isRefining, setIsRefining] = useState(false);

  // Persist clients
  useEffect(() => {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
  }, [clients]);

  const handleAddClient = () => {
    if (!newClientName.trim()) return;
    if (clients.includes(newClientName.trim())) {
      setNewClientName('');
      return;
    }
    setClients(prev => [...prev, newClientName.trim()].sort());
    setFormData(prev => ({ ...prev, clientName: newClientName.trim() }));
    setNewClientName('');
  };

  const handleDeleteClient = (clientToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${clientToDelete}" from the client list?`)) return;
    setClients(prev => prev.filter(c => c !== clientToDelete));
    if (formData.clientName === clientToDelete) {
      setFormData(prev => ({ ...prev, clientName: '' }));
    }
  };

  // Fetch data from Google Sheets
  const fetchLogs = useCallback(async (showLoading = true) => {
    if (!showLoading) setIsRefreshing(true);
    await fetchRPCLogs(!showLoading);
    setIsRefreshing(false);
  }, [fetchRPCLogs]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    let result = logs;

    // Role-based filtering
    if (currentUser.role === 'Collector') {
      result = result.filter(log => log.collectorName === currentUser.name);
    }

    // Date range filtering
    result = result.filter(log => {
      const logDate = log.date.split('T')[0];
      return logDate >= dateRange.start && logDate <= dateRange.end;
    });

    // Active Filters
    if (activeFilters.collector) {
      result = result.filter(log => log.collectorName === activeFilters.collector);
    }
    if (activeFilters.client) {
      result = result.filter(log => log.clientName === activeFilters.client);
    }
    if (activeFilters.moneyPlanned) {
      result = result.filter(log => log.moneyPlanned === activeFilters.moneyPlanned);
    }
    if (activeFilters.caseUpdate) {
      result = result.filter(log => log.caseUpdate === activeFilters.caseUpdate);
    }

    // Search filtering
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(log => 
        log.accountNumber.toLowerCase().includes(term) ||
        log.clientName.toLowerCase().includes(term) ||
        log.collectorName.toLowerCase().includes(term) ||
        log.notes.toLowerCase().includes(term)
      );
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs, currentUser, dateRange, searchTerm, activeFilters]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(date.getUTCDate()).padStart(2, '0');
      const yyyy = date.getUTCFullYear();
      
      return `${mm}/${dd}/${yyyy}`;
    } catch (e) {
      return dateStr;
    }
  };

  const uniqueCollectors = useMemo(() => {
    return Array.from(new Set(logs.map(l => l.collectorName))).sort();
  }, [logs]);

  const uniqueClients = useMemo(() => {
    return Array.from(new Set(logs.map(l => l.clientName))).sort();
  }, [logs]);

  const handleRefineNotes = async () => {
    if (!formData.notes.trim()) return;
    
    setIsRefining(true);
    try {
      const ai = new GoogleGenAI({ apiKey: (process.env.GEMINI_API_KEY as string) });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Refine the following RPC log note for a professional debt collection environment. Fix spelling, grammar, and polish the tone. Keep it concise.
        
        Note: "${formData.notes}"`,
      });
      
      if (response.text) {
        setFormData(prev => ({ ...prev, notes: response.text.trim() }));
      }
    } catch (error) {
      console.error("AI Refinement failed:", error);
    } finally {
      setIsRefining(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const logData: RPCLog = {
      id: editingLog ? editingLog.id : Math.random().toString(36).substr(2, 9),
      date: editingLog ? editingLog.date : new Date().toISOString().split('T')[0],
      collectorName: editingLog ? editingLog.collectorName : currentUser.name,
      accountNumber: formData.accountNumber,
      clientName: formData.clientName,
      moneyPlanned: formData.moneyPlanned,
      caseUpdate: formData.caseUpdate,
      notes: formData.notes,
      createdAt: editingLog ? editingLog.createdAt : new Date().toISOString()
    };
    
    try {
      let success = false;
      if (editingLog) {
        success = await sheetService.updateRPCLog(logData);
      } else {
        success = await sheetService.createRPCLog(logData);
      }

      if (success) {
        // Optimistic update
        let updatedLogs;
        if (editingLog) {
          updatedLogs = logs.map(l => l.id === logData.id ? logData : l);
        } else {
          updatedLogs = [logData, ...logs];
        }
        updateRPCLogsLocal(updatedLogs);
        
        setIsModalOpen(false);
        setEditingLog(null);
        setFormData({
          accountNumber: '',
          clientName: '',
          moneyPlanned: 'No',
          caseUpdate: 'Ghosted',
          notes: ''
        });
        // Re-fetch to ensure sync
        fetchLogs(false);
      }
    } catch (error) {
      console.error("Failed to save log:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (log: RPCLog) => {
    setEditingLog(log);
    setFormData({
      accountNumber: log.accountNumber,
      clientName: log.clientName,
      moneyPlanned: log.moneyPlanned,
      caseUpdate: log.caseUpdate,
      notes: log.notes
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this log entry?')) return;
    
    try {
      const success = await sheetService.deleteRPCLog(id);
      if (success) {
        updateRPCLogsLocal(logs.filter(l => l.id !== id));
        fetchLogs(false);
      }
    } catch (error) {
      console.error("Failed to delete log:", error);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-app min-h-screen animate-in fade-in duration-500 font-sans">
      {/* Header Row: Title and Total RPC */}
      <div className="flex justify-between items-start">
        <div className="shrink-0">
          <h1 className="text-2xl font-black text-text-main uppercase tracking-tight">RPC Logs</h1>
          <p className="text-text-muted font-bold text-[11px] tracking-[0.2em] mt-1 uppercase">Right Party Contact Records</p>
        </div>

        {/* Total RPC Stat mirrored to title */}
        <div className="bg-indigo-600 rounded-2xl px-6 py-3 flex items-center gap-4 text-white shadow-lg shadow-indigo-500/20">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Total RPCs</p>
            <h3 className="text-xl font-black">{filteredLogs.length}</h3>
          </div>
          <div className="p-2 bg-white/10 rounded-xl">
            <FileText size={18} />
          </div>
        </div>
      </div>

      {/* Controls Row: Search, Date, Filter, Log New */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
            <input 
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-card border border-border-subtle rounded-xl text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-2 bg-card border border-border-subtle rounded-xl px-3 py-2">
            <Calendar className="text-text-muted" size={14} />
            <div className="flex items-center gap-1.5">
              <input 
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-transparent text-[11px] font-bold text-text-main focus:outline-none w-[95px]"
              />
              <span className="text-text-muted text-[9px] font-black uppercase tracking-widest">to</span>
              <input 
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-transparent text-[11px] font-bold text-text-main focus:outline-none w-[95px]"
              />
            </div>
          </div>

          {/* Filter Button */}
          <div className="relative">
            <button 
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                Object.values(activeFilters).some(v => v !== '')
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                  : 'bg-card border-border-subtle text-text-muted hover:text-indigo-600'
              }`}
            >
              <Filter size={14} />
              Filter
              {Object.values(activeFilters).some(v => v !== '') && (
                <span className="ml-1 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[8px]">
                  {Object.values(activeFilters).filter(v => v !== '').length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {isFilterMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsFilterMenuOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 top-full mt-2 w-72 bg-card border border-border-subtle rounded-2xl shadow-xl z-20 p-5 space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-border-subtle pb-3">
                      <h3 className="text-[10px] font-black text-text-main uppercase tracking-widest">Advanced Filters</h3>
                      <button 
                        onClick={() => setActiveFilters({ collector: '', client: '', moneyPlanned: '', caseUpdate: '' })}
                        className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                      >
                        Reset All
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Collector</label>
                        <select 
                          value={activeFilters.collector}
                          onChange={(e) => setActiveFilters(prev => ({ ...prev, collector: e.target.value }))}
                          className="w-full px-3 py-2 bg-app border border-border-subtle rounded-xl text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="">All Collectors</option>
                          {uniqueCollectors.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Client</label>
                        <select 
                          value={activeFilters.client}
                          onChange={(e) => setActiveFilters(prev => ({ ...prev, client: e.target.value }))}
                          className="w-full px-3 py-2 bg-app border border-border-subtle rounded-xl text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="">All Clients</option>
                          {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Money</label>
                          <select 
                            value={activeFilters.moneyPlanned}
                            onChange={(e) => setActiveFilters(prev => ({ ...prev, moneyPlanned: e.target.value }))}
                            className="w-full px-3 py-2 bg-app border border-border-subtle rounded-xl text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            <option value="">All</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Status</label>
                          <select 
                            value={activeFilters.caseUpdate}
                            onChange={(e) => setActiveFilters(prev => ({ ...prev, caseUpdate: e.target.value }))}
                            className="w-full px-3 py-2 bg-app border border-border-subtle rounded-xl text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            <option value="">All</option>
                            <option value="Collected">Collected</option>
                            <option value="Ghosted">Ghosted</option>
                            <option value="RTP">RTP</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Refresh Button */}
          <button 
            onClick={() => fetchLogs(false)}
            disabled={isRefreshing || isLoading}
            className="p-2.5 bg-card border border-border-subtle rounded-xl text-text-muted hover:text-indigo-600 transition-all active:scale-95 disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
        >
          <Plus size={14} strokeWidth={3} />
          Log New
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-card rounded-[2.5rem] border border-border-subtle shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-50">
                <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Date</th>
                <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Collector</th>
                <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Account #</th>
                <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Client</th>
                <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Money Planned</th>
                <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Case Update</th>
                <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Notes</th>
                <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading && !rpcLogs.lastFetched ? (
                <tr>
                  <td colSpan={8} className="px-8 py-24">
                    <div className="flex flex-col items-center justify-center gap-4 w-full">
                      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-[12px] font-black uppercase tracking-[0.2em] text-text-muted animate-pulse">Loading logs from database...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="group hover:bg-surface-50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                          <Clock size={14} />
                        </div>
                        <span className="text-[13px] font-bold text-text-main">{formatDate(log.date)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-text-main">{log.collectorName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[13px] font-mono font-bold text-indigo-600">{log.accountNumber}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[13px] font-medium text-text-main">{log.clientName}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        log.moneyPlanned === 'Yes' 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' 
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30'
                      }`}>
                        {log.moneyPlanned}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          log.caseUpdate === 'Collected' ? 'bg-emerald-500' :
                          log.caseUpdate === 'RTP' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        <span className="text-[12px] font-bold text-text-main">{log.caseUpdate}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 max-w-md">
                      <p className="text-[13px] text-text-muted line-clamp-2 leading-relaxed">{log.notes}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(log)}
                          className="p-2 hover:bg-indigo-50 text-text-muted hover:text-indigo-600 rounded-lg transition-colors"
                          title="Edit Log"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(log.id)}
                          className="p-2 hover:bg-rose-50 text-text-muted hover:text-rose-600 rounded-lg transition-colors"
                          title="Delete Log"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-8 py-24">
                    <div className="flex flex-col items-center justify-center gap-4 opacity-20 w-full">
                      <FileText size={64} className="text-text-muted" />
                      <p className="text-[12px] font-black uppercase tracking-[0.2em]">No logs found for this period</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log New Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card w-full max-w-2xl rounded-[2.5rem] border border-border-subtle shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-border-subtle flex justify-between items-center bg-surface-50">
                <div>
                  <h2 className="text-xl font-black text-text-main uppercase tracking-tight">
                    {editingLog ? 'Edit RPC Log' : 'Log New RPC'}
                  </h2>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">
                    {editingLog ? `Editing entry for ${editingLog.accountNumber}` : 'Submit Right Party Contact Record'}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingLog(null);
                  }}
                  className="p-2 hover:bg-surface-200 rounded-xl transition-colors"
                >
                  <X size={20} className="text-text-muted" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Collector Name</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-surface-100 border border-border-subtle rounded-2xl opacity-70">
                      <User size={16} className="text-text-muted" />
                      <span className="text-[13px] font-bold text-text-main">{currentUser.name}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Account Number</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                      <input 
                        required
                        type="text"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                        placeholder="Enter account #"
                        className="w-full pl-12 pr-4 py-3 bg-app border border-border-subtle rounded-2xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Client Name</label>
                  <div className="relative">
                    <div className="relative">
                      <input 
                        required
                        type="text"
                        value={formData.clientName}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                        onFocus={() => setIsClientDropdownOpen(true)}
                        placeholder="Select or enter client name"
                        className="w-full px-4 py-3 bg-app border border-border-subtle rounded-2xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all pr-10"
                      />
                      <button 
                        type="button"
                        onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-indigo-600 transition-colors"
                      >
                        <ChevronDown size={18} className={`transition-transform duration-200 ${isClientDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {isClientDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-[60]" 
                            onClick={() => setIsClientDropdownOpen(false)}
                          />
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute left-0 right-0 top-full mt-2 bg-card border border-border-subtle rounded-2xl shadow-xl z-[70] overflow-hidden max-h-64 flex flex-col"
                          >
                            <div className="overflow-y-auto flex-1 scrollbar-thin">
                              {clients.length > 0 ? (
                                clients
                                  .filter(c => c.toLowerCase().includes(formData.clientName.toLowerCase()))
                                  .map((client) => (
                                    <div 
                                      key={client}
                                      onClick={() => {
                                        setFormData(prev => ({ ...prev, clientName: client }));
                                        setIsClientDropdownOpen(false);
                                      }}
                                      className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-100 cursor-pointer group transition-colors"
                                    >
                                      <span className="text-[13px] font-medium text-text-main">{client}</span>
                                      {currentUser.permissions.manageClients && (
                                        <button 
                                          onClick={(e) => handleDeleteClient(client, e)}
                                          className="p-1.5 text-text-muted hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-rose-50"
                                          title="Delete Client"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      )}
                                    </div>
                                  ))
                              ) : (
                                <div className="px-4 py-4 text-center text-text-muted text-[11px] font-bold uppercase tracking-widest opacity-50">
                                  No clients found
                                </div>
                              )}
                            </div>

                            {currentUser.permissions.manageClients && (
                              <div className="p-3 bg-surface-50 border-t border-border-subtle">
                                <div className="flex gap-2">
                                  <input 
                                    type="text"
                                    value={newClientName}
                                    onChange={(e) => setNewClientName(e.target.value)}
                                    placeholder="Add new client..."
                                    className="flex-1 px-3 py-1.5 bg-card border border-border-subtle rounded-xl text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddClient();
                                      }
                                    }}
                                  />
                                  <button 
                                    type="button"
                                    onClick={handleAddClient}
                                    disabled={!newClientName.trim()}
                                    className="p-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
                                  >
                                    <Plus size={16} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Money Planned</label>
                    <select 
                      value={formData.moneyPlanned}
                      onChange={(e) => setFormData(prev => ({ ...prev, moneyPlanned: e.target.value as 'Yes' | 'No' }))}
                      className="w-full px-4 py-3 bg-app border border-border-subtle rounded-2xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Case Update</label>
                    <select 
                      value={formData.caseUpdate}
                      onChange={(e) => setFormData(prev => ({ ...prev, caseUpdate: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-app border border-border-subtle rounded-2xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none"
                    >
                      <option value="Ghosted">Ghosted</option>
                      <option value="Collected">Collected</option>
                      <option value="RTP">RTP</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">RPC Log Notes</label>
                    <button 
                      type="button"
                      onClick={handleRefineNotes}
                      disabled={isRefining || !formData.notes.trim()}
                      className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 disabled:opacity-50 transition-all"
                    >
                      {isRefining ? (
                        <Clock size={12} className="animate-spin" />
                      ) : (
                        <Sparkles size={12} />
                      )}
                      AI Refine
                    </button>
                  </div>
                  <textarea 
                    required
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Enter detailed notes about the contact..."
                    rows={4}
                    className="w-full px-4 py-3 bg-app border border-border-subtle rounded-2xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingLog(null);
                    }}
                    className="flex-1 px-6 py-3 bg-surface-100 text-text-main rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-surface-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Clock size={14} className="animate-spin" />}
                    {isSubmitting ? 'Saving...' : 'Save Log Entry'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RPCLogsDashboard;
