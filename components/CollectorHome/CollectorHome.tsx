import React, { useState, useEffect } from 'react';
import { AppUser, TabType } from '../../types';
import { Calendar, ChevronDown, ChevronUp, Edit2, Trash2, ArrowRight, CreditCard, Users, DollarSign, Phone, Loader2 } from 'lucide-react';
import { useData } from '../../DataContext';
import { sheetService } from '../../services/sheetService';

interface CollectorHomeProps {
  currentUser: AppUser;
  onNavigate: (tab: TabType, subView?: any) => void;
}

const CollectorHome: React.FC<CollectorHomeProps> = ({ currentUser, onNavigate }) => {
  const { 
    home, fetchHome, 
    postdates, fetchPostdates,
    flaggedAccounts, fetchFlaggedAccounts,
    billingAudit, fetchBillingAudit,
    onboardingAudits, fetchOnboardingAudits,
    individualCollectors, fetchIndividualCollectors,
    collectorHome, fetchCollectorHome,
    reminders: remindersData, fetchReminders, updateRemindersLocal
  } = useData();
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [newReminder, setNewReminder] = useState('');
  const [newReminderDate, setNewReminderDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingReminder, setEditingReminder] = useState<string | null>(null);
  const [editReminderText, setEditReminderText] = useState('');
  const [editReminderDate, setEditReminderDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  useEffect(() => {
    fetchHome();
    fetchPostdates();
    fetchFlaggedAccounts();
    fetchBillingAudit();
    fetchOnboardingAudits();
    fetchIndividualCollectors();
    fetchReminders();
    if (currentUser?.name) {
      fetchCollectorHome(currentUser.name);
    }
  }, [fetchHome, fetchPostdates, fetchFlaggedAccounts, fetchBillingAudit, fetchOnboardingAudits, fetchIndividualCollectors, fetchCollectorHome, fetchReminders, currentUser?.name]);

  // Filter reminders for current user only
  const myReminders = (remindersData.data || []).filter(r => 
    String(r.collectorName || '').toLowerCase() === currentUser.name.toLowerCase()
  );

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminder.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    const id = `rem_${Date.now()}`;
    const payload = {
      id,
      collectorName: currentUser.name,
      text: newReminder,
      date: newReminderDate || new Date().toISOString().split('T')[0]
    };

    const success = await sheetService.createReminder(payload);
    if (success) {
      updateRemindersLocal([...remindersData.data, { ...payload, loggedDate: new Date().toISOString() }]);
      setNewReminder('');
      setNewReminderDate(new Date().toISOString().split('T')[0]);
    }
    setIsSubmitting(false);
  };

  const handleDeleteReminder = async (id: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const success = await sheetService.deleteReminder(id);
    if (success) {
      updateRemindersLocal(remindersData.data.filter(r => r.id !== id));
    }
    setIsSubmitting(false);
  };

  const handleEditReminder = (id: string, text: string, date: string) => {
    setEditingReminder(id);
    setEditReminderText(text);
    setEditReminderDate(date);
  };

  const handleSaveReminder = async (id: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const payload = {
      id,
      collectorName: currentUser.name,
      text: editReminderText,
      date: editReminderDate
    };

    const success = await sheetService.updateReminder(payload);
    if (success) {
      updateRemindersLocal(remindersData.data.map(r => r.id === id ? { ...r, text: editReminderText, date: editReminderDate } : r));
      setEditingReminder(null);
    }
    setIsSubmitting(false);
  };

  // Real data for collection history (last 7 days only for highlights)
  const collectionHistory = (home.data?.checkCollections || [])
    .filter(c => {
      const isCollector = c.collector === currentUser.name;
      const itemDate = new Date(c.date);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return isCollector && itemDate >= sevenDaysAgo;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map(c => ({
      caseNumber: c.accountNumber,
      amount: c.amount,
      date: c.date
    }));

  const collectorData = collectorHome.data || {
    todaySucceeded: 0,
    todayDeclined: 0,
    streak: [0, 0, 0, 0, 0, 0, 0],
    newAccounts: 0,
    accountsWorked: 0,
    amountCollected: 0,
    outboundCalls: 0
  };

  const stats = {
    todaySucceeded: collectorData.todaySucceeded,
    todayDeclined: collectorData.todayDeclined,
    newAccounts: collectorData.newAccounts,
    accountsWorked: collectorData.accountsWorked,
    amountCollected: collectorData.amountCollected,
    outboundCalls: collectorData.outboundCalls
  };

  const totalProcessed = stats.todaySucceeded + stats.todayDeclined;
  const succeededPercent = totalProcessed > 0 ? (stats.todaySucceeded / totalProcessed) * 100 : 0;
  const declinedPercent = totalProcessed > 0 ? (stats.todayDeclined / totalProcessed) * 100 : 0;

  const activeStreak = collectorData.streak.filter(amount => amount >= 100).length;
  const streakDays = collectorData.streak.map(amount => amount >= 100);

  // Announcement logic
  const myFlaggedCount = (flaggedAccounts.data || []).filter(a => 
    String(a.agentName || a.collectorName || '').trim().toLowerCase() === currentUser.name.toLowerCase().trim()
  ).length;

  const myBillingCount = (billingAudit.data || []).filter(a => 
    String(a.agentName || a.collectorName || '').trim().toLowerCase() === currentUser.name.toLowerCase().trim()
  ).length;

  const myOnboardingCount = (onboardingAudits.data || []).filter(a => {
    const agent = String(a.agentName || a.collectorName || '').trim().toLowerCase();
    const result = String(a.auditResult || '').trim().toLowerCase();
    return agent === currentUser.name.toLowerCase().trim() && (result === 'failed' || result === 'pending');
  }).length;

  const hasAnnouncements = myFlaggedCount > 0 || myBillingCount > 0 || myOnboardingCount > 0 || stats.newAccounts > 0;

  return (
    <div className="p-8 bg-app h-screen max-h-screen flex flex-col animate-in fade-in duration-500 font-sans overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-thin pr-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full">
          
          {/* Left Column (Main Content) - Now Larger (3/4) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Top Banner */}
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl flex flex-col p-8 gap-4 shrink-0 h-52">
              <div className="absolute inset-0 bg-gradient-to-br from-[#818cf8] via-[#6366f1] to-[#4f46e5]"></div>
              <div className="absolute inset-0"><svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 400"><path d="M0,400 L0,250 C150,220 300,100 450,250 C600,400 750,150 1000,200 L1000,400 Z" fill="#a5b4fc" fillOpacity="0.3" /><path d="M0,400 L0,350 C250,350 400,200 600,300 C750,380 850,250 1000,300 L1000,400 Z" fill="#6366f1" fillOpacity="0.5" /></svg></div>
              
              <div className="relative z-10 text-white flex items-center justify-between h-full">
                <div>
                  <h1 className="text-4xl font-black mb-2 tracking-tight">Hello, {currentUser.name.split(' ')[0]}!</h1>
                  <p className="text-indigo-50 font-bold text-lg opacity-90">Fuel your progress!</p>
                  <p className="text-indigo-100 font-bold text-sm opacity-80">See your latest stats at a glance</p>
                </div>

                {/* Streak Chart (Inside Banner) */}
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 flex flex-col gap-4 border border-white/20 min-w-[240px]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                      </svg>
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Active Streak</div>
                      <div className="text-2xl font-black leading-none">{activeStreak} <span className="text-xs font-bold">Days</span></div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 justify-between">
                    {streakDays.map((active, i) => (
                      <div 
                        key={i} 
                        className={`flex-1 h-8 rounded-full ${active ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]' : 'bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.5)]'}`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ATM Card Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Succeeded Card */}
              <div className="relative h-48 rounded-[2rem] overflow-hidden shadow-xl group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#10b981] via-[#059669] to-[#047857]"></div>
                {/* Wave patterns */}
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 400">
                    <path d="M0,400 L0,250 C150,220 300,100 450,250 C600,400 750,150 1000,200 L1000,400 Z" fill="white" />
                  </svg>
                </div>
                <div className="relative z-10 p-8 h-full flex flex-col justify-between text-white">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-10 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-lg shadow-inner relative overflow-hidden">
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0.5 opacity-30">
                        {Array.from({ length: 9 }).map((_, i) => <div key={i} className="border border-black/20"></div>)}
                      </div>
                    </div>
                    <span className="text-xl font-black opacity-80">{succeededPercent.toFixed(1)}%</span>
                  </div>
                  <div>
                    <div className="text-4xl font-black mb-1">
                      {formatCurrency(stats.todaySucceeded)}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest opacity-80">Today's Succeeded</div>
                  </div>
                  {/* Mastercard-like logo */}
                  <div className="absolute bottom-8 right-8 flex">
                    <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm"></div>
                    <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm -ml-4"></div>
                  </div>
                </div>
              </div>

              {/* Declined Card */}
              <div className="relative h-48 rounded-[2rem] overflow-hidden shadow-xl group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#f43f5e] via-[#e11d48] to-[#be123c]"></div>
                {/* Wave patterns */}
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 400">
                    <path d="M0,400 L0,250 C150,220 300,100 450,250 C600,400 750,150 1000,200 L1000,400 Z" fill="white" />
                  </svg>
                </div>
                <div className="relative z-10 p-8 h-full flex flex-col justify-between text-white">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-10 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-lg shadow-inner relative overflow-hidden">
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0.5 opacity-30">
                        {Array.from({ length: 9 }).map((_, i) => <div key={i} className="border border-black/20"></div>)}
                      </div>
                    </div>
                    <span className="text-xl font-black opacity-80">{declinedPercent.toFixed(1)}%</span>
                  </div>
                  <div>
                    <div className="text-4xl font-black mb-1">
                      {formatCurrency(stats.todayDeclined)}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest opacity-80">Today's Declined</div>
                  </div>
                  {/* Mastercard-like logo */}
                  <div className="absolute bottom-8 right-8 flex">
                    <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm"></div>
                    <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm -ml-4"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Stats Grid - The "Old Box Field Layout" */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card rounded-[2rem] p-6 border border-border-subtle shadow-sm flex flex-col justify-center relative overflow-hidden group">
                <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 relative z-10">New Accounts</div>
                <div className="flex items-end justify-between relative z-10">
                  <div className="text-2xl font-black text-blue-600">{stats.newAccounts}</div>
                  <button 
                    onClick={() => onNavigate('new-assigned')}
                    className="p-2 rounded-xl bg-blue-50 text-blue-600 opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-100"
                    title="View New Accounts"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
                <Users size={64} className="absolute -right-4 -bottom-4 text-blue-600 opacity-5" />
              </div>
              <div className="bg-card rounded-[2rem] p-6 border border-border-subtle shadow-sm flex flex-col justify-center relative overflow-hidden">
                <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 relative z-10">Accounts Worked</div>
                <div className="text-2xl font-black text-yellow-600 relative z-10">{stats.accountsWorked}</div>
                <Edit2 size={64} className="absolute -right-4 -bottom-4 text-yellow-600 opacity-5" />
              </div>
              <div className="bg-card rounded-[2rem] p-6 border border-border-subtle shadow-sm flex flex-col justify-center relative overflow-hidden">
                <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 relative z-10">Amount Collected</div>
                <div className="text-2xl font-black text-rose-600 relative z-10">{formatCurrency(stats.amountCollected)}</div>
                <DollarSign size={64} className="absolute -right-4 -bottom-4 text-rose-600 opacity-5" />
              </div>
              <div className="bg-card rounded-[2rem] p-6 border border-border-subtle shadow-sm flex flex-col justify-center relative overflow-hidden">
                <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 relative z-10">Outbound Call</div>
                <div className="text-2xl font-black text-emerald-600 relative z-10">{stats.outboundCalls}</div>
                <Phone size={64} className="absolute -right-4 -bottom-4 text-emerald-600 opacity-5" />
              </div>
            </div>

            {/* Announcements */}
            <div className="bg-card rounded-[2rem] p-8 border border-border-subtle shadow-sm flex-1 min-h-[200px]">
              <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6">Announcements</h3>
              <div className="text-text-muted text-base space-y-4">
                {hasAnnouncements ? (
                  <>
                    <p className="font-medium text-text-main">You have audit account compliance updates:</p>
                    <ul className="space-y-2">
                      {myFlaggedCount > 0 && (
                        <li className="flex items-center justify-between gap-3 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-800/30">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                            <span className="text-sm">You have <span className="font-black text-rose-600">{myFlaggedCount}</span> {myFlaggedCount === 1 ? 'account' : 'accounts'} for flagged accounts report.</span>
                          </div>
                          <button 
                            onClick={() => onNavigate('audits', 'individual_flagged', currentUser.name)}
                            className="px-4 py-1.5 bg-rose-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center gap-2 shrink-0"
                          >
                            View Report
                            <ArrowRight size={12} />
                          </button>
                        </li>
                      )}
                      {myBillingCount > 0 && (
                        <li className="flex items-center justify-between gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/30">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                            <span className="text-sm">You have <span className="font-black text-amber-600">{myBillingCount}</span> {myBillingCount === 1 ? 'account' : 'accounts'} for billing audit.</span>
                          </div>
                          <button 
                            onClick={() => onNavigate('audits', 'billing')}
                            className="px-4 py-1.5 bg-amber-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-700 transition-all flex items-center gap-2 shrink-0"
                          >
                            View Audit
                            <ArrowRight size={12} />
                          </button>
                        </li>
                      )}
                      {myOnboardingCount > 0 && (
                        <li className="flex items-center justify-between gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-100 dark:border-orange-800/30">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            <span className="text-sm">You have <span className="font-black text-orange-600">{myOnboardingCount}</span> {myOnboardingCount === 1 ? 'account' : 'accounts'} for onboarding account audit.</span>
                          </div>
                          <button 
                            onClick={() => onNavigate('audits', 'individual_onboarding', currentUser.name)}
                            className="px-4 py-1.5 bg-orange-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-orange-700 transition-all flex items-center gap-2 shrink-0"
                          >
                            Check Accounts
                            <ArrowRight size={12} />
                          </button>
                        </li>
                      )}
                      {stats.newAccounts > 0 && (
                        <li className="flex items-center justify-between gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-sm">You have <span className="font-black text-blue-600">{stats.newAccounts}</span> new accounts assigned to you.</span>
                          </div>
                          <button 
                            onClick={() => onNavigate('new-assigned')}
                            className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shrink-0"
                          >
                            View Accounts
                            <ArrowRight size={12} />
                          </button>
                        </li>
                      )}
                    </ul>
                  </>
                ) : (
                  <p>You have no announcements today.</p>
                )}
              </div>
            </div>
            
          </div>

          {/* Right Column (Sidebar) - Now Smaller (1/4) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Date / Calendar */}
            <div className="bg-card rounded-[2rem] border border-border-subtle shadow-sm overflow-hidden shrink-0">
              <div 
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-surface-100 transition-colors"
                onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                  <span className="text-sm font-bold text-text-main">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                {isCalendarExpanded ? <ChevronUp size={20} className="text-text-muted" /> : <ChevronDown size={20} className="text-text-muted" />}
              </div>
              
              {isCalendarExpanded && (
                <div className="p-6 border-t border-border-subtle bg-surface-50 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-7 gap-1 text-center mb-4">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <div key={`${day}-${i}`} className="text-[10px] font-black text-text-muted uppercase">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 31 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`aspect-square flex items-center justify-center text-xs rounded-lg font-bold
                          ${i + 1 === today.getDate() 
                            ? 'bg-indigo-600 text-white shadow-lg' 
                            : 'text-text-main hover:bg-surface-200 cursor-pointer'}`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reminders */}
            <div className="bg-card rounded-[2rem] p-6 border border-border-subtle shadow-sm flex flex-col h-[400px] shrink-0">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-text-main uppercase tracking-widest">Reminders</h3>
                  {remindersData.isLoading && <Loader2 size={12} className="animate-spin text-indigo-500" />}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 mb-6 scrollbar-thin pr-2">
                {myReminders.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(reminder => (
                  <div key={reminder.id} className="flex flex-col gap-2 p-4 bg-surface-50 rounded-2xl border border-border-subtle group hover:border-indigo-500/30 transition-colors">
                    {editingReminder === reminder.id ? (
                      <div className="flex flex-col gap-3">
                        <input 
                          type="text" 
                          value={editReminderText}
                          onChange={(e) => setEditReminderText(e.target.value)}
                          className="w-full bg-card border border-border-subtle rounded-xl px-4 py-2 text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          autoFocus
                          disabled={isSubmitting}
                        />
                        <div className="flex gap-2">
                          <input 
                            type="date" 
                            value={editReminderDate}
                            onChange={(e) => setEditReminderDate(e.target.value)}
                            className="flex-1 bg-card border border-border-subtle rounded-xl px-4 py-2 text-[10px] text-text-main focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            disabled={isSubmitting}
                          />
                          <button 
                            onClick={() => handleSaveReminder(reminder.id)} 
                            disabled={isSubmitting}
                            className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold disabled:opacity-50"
                          >
                            {isSubmitting ? '...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-text-main font-bold flex-1 leading-tight">{reminder.text}</p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleEditReminder(reminder.id, reminder.text, reminder.date)} 
                              disabled={isSubmitting}
                              className="p-1 text-text-muted hover:text-indigo-600 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button 
                              onClick={() => handleDeleteReminder(reminder.id)} 
                              disabled={isSubmitting}
                              className="p-1 text-text-muted hover:text-rose-600 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 w-fit px-2 py-1 rounded-lg">
                          <Calendar size={8} />
                          {new Date(reminder.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {myReminders.length === 0 && !remindersData.isLoading && (
                  <div className="text-center text-text-muted text-xs py-8 italic">No reminders.</div>
                )}
              </div>

              <form onSubmit={handleAddReminder} className="mt-auto flex flex-col gap-2">
                <input 
                  type="text" 
                  placeholder="New reminder..." 
                  value={newReminder}
                  onChange={(e) => setNewReminder(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-surface-100 border border-border-subtle rounded-xl px-4 py-2 text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <div className="flex gap-2">
                  <input 
                    type="date" 
                    value={newReminderDate}
                    onChange={(e) => setNewReminderDate(e.target.value)}
                    disabled={isSubmitting}
                    className="flex-1 bg-surface-100 border border-border-subtle rounded-xl px-4 py-2 text-[10px] text-text-main focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  </button>
                </div>
              </form>
            </div>

            {/* Collection History */}
            <div className="bg-card rounded-[2rem] p-6 border border-border-subtle shadow-sm flex flex-col flex-1 min-h-0">
              <h3 className="text-xs font-black text-text-main uppercase tracking-widest mb-6">Recent Collections</h3>
              
              <div className="space-y-3 overflow-y-auto pr-2 scrollbar-thin flex-1 mb-6">
                {collectionHistory.map((item, i) => (
                  <div key={i} className="flex flex-col gap-1 p-3 bg-surface-50 rounded-2xl border border-border-subtle">
                    <div className="flex justify-between items-center">
                      <div className="text-xs font-bold text-text-main">{item.caseNumber}</div>
                      <div className="text-xs font-black text-emerald-600">${item.amount.toLocaleString()}</div>
                    </div>
                    <div className="text-[10px] text-text-muted">{item.date}</div>
                  </div>
                ))}
                {collectionHistory.length === 0 && (
                  <div className="text-center text-text-muted text-[10px] py-8 italic">No recent collections.</div>
                )}
              </div>

              <button 
                onClick={() => onNavigate('collections-history')}
                className="w-full py-3 bg-indigo-50 text-indigo-600 font-black rounded-xl hover:bg-indigo-100 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
              >
                Full History
                <ArrowRight size={14} />
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectorHome;
