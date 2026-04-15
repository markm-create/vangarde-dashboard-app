import React from 'react';
import { 
  LayoutDashboard, 
  CircleDollarSign, 
  Users, 
  ChevronRight,
  ClipboardList,
  ChevronLeft,
  Search,
  LogOut,
  BarChart2,
  Monitor,
  Package,
  Settings,
  ChevronDown,
  Home,
  TrendingUp,
  FileText,
  AlertOctagon,
  Megaphone,
  ShieldAlert
} from 'lucide-react';
import { useData } from '../DataContext';
import { TabType, AppUser, Collector } from '../types';

interface SidebarProps {
  activeTab: TabType;
  selectedCollector: Collector | null;
  isCollectorListVisible: boolean;
  isCollapsed: boolean;
  currentUser: AppUser | null;
  onToggleCollapse: () => void;
  onResetToMainTab: (tab: TabType) => void;
  onCollectorClick: (collector: Collector) => void;
  onCollectorDeleted?: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  selectedCollector, 
  isCollectorListVisible,
  isCollapsed,
  currentUser,
  onToggleCollapse,
  onResetToMainTab, 
  onCollectorClick,
  onCollectorDeleted,
  onLogout
}) => {
  const { 
    collectors, 
    fetchCollectors,
    onboardingAudits,
    billingAudit,
    flaggedAccounts,
    fetchOnboardingAudits,
    fetchBillingAudit,
    fetchFlaggedAccounts
  } = useData();

  React.useEffect(() => {
    fetchCollectors();
    const interval = setInterval(() => {
      fetchCollectors(true);
    }, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, [fetchCollectors]);

  if (!currentUser) return null;

  const { permissions, role } = currentUser;

  React.useEffect(() => {
    if (permissions.viewAuditDashboard || role === 'Collector') {
      fetchOnboardingAudits();
      fetchBillingAudit();
      fetchFlaggedAccounts();
    }
  }, [permissions.viewAuditDashboard, role, fetchOnboardingAudits, fetchBillingAudit, fetchFlaggedAccounts]);

  const pendingAuditCount = React.useMemo(() => {
    const isNameMatch = (name1: string, name2: string) => {
      if (!name1 || !name2) return false;
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const n1 = normalize(name1);
      const n2 = normalize(name2);
      if (n1 === n2) return true;
      if (n1.includes(n2) || n2.includes(n1)) return true;
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

    const isCollector = role === 'Collector';

    const onboardingPending = (onboardingAudits?.data || [])
      .filter(a => {
        const agentMatch = isCollector ? isNameMatch(a.agentName || a.collectorName, currentUser.name) : true;
        const result = String(a.auditResult || '').trim().toLowerCase();
        const isAlert = result === 'failed' || result === 'pending';
        return agentMatch && isAlert;
      }).length;

    const billingPending = (billingAudit?.data || [])
      .filter(a => {
        const agentMatch = isCollector ? isNameMatch(a.agentName || a.collectorName, currentUser.name) : true;
        const ppaAction = String(a.ppaAction || '').trim();
        const isAlert = ['Update PPA', 'Delete PPA', 'Follow-Up PPA'].includes(ppaAction);
        return agentMatch && isAlert;
      }).length;
      
    const flaggedPending = (flaggedAccounts?.data || [])
      .filter(a => {
        const agentMatch = isCollector ? isNameMatch(a.agentName || a.collectorName, currentUser.name) : true;
        return agentMatch;
      }).length;
      
    return onboardingPending + billingPending + flaggedPending;
  }, [role, currentUser.name, onboardingAudits?.data, billingAudit?.data, flaggedAccounts?.data]);

  // Determine which collectors to show based on role and sheet data
  const allowedCollectors = React.useMemo(() => {
    if (!collectors.data || collectors.data.length === 0) return [];

    let filtered = [];

    // Admin/Manager/CEO see all collectors from the sheet
    if (role === 'Administrator' || role === 'Manager' || role === 'CEO' || role === 'Developer') {
      filtered = collectors.data;
    } else if (role === 'Collector') {
      // Collectors only see themselves (match by name)
      filtered = collectors.data.filter(c => 
        c.name.toLowerCase().trim() === currentUser.name.toLowerCase().trim()
      );
    } else {
      // Default: use permissions if available, otherwise empty
      filtered = collectors.data.filter(c => 
        permissions && (permissions.allowedCollectorIds || []).includes(c.id)
      );
    }

    // Filter out special handling accounts from the sidebar
    filtered = filtered.filter(c => {
      const name = c.name.toLowerCase().trim();
      return name !== 'unassigned' && 
             name !== 'house file' && 
             name !== 'kkarter - special handling' && 
             name !== 'kkoson - special handling';
    });

    return [...filtered].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [collectors.data, role, currentUser.name, permissions]);

  React.useEffect(() => {
    // Only enforce this check if we are viewing the individual collector dashboard
    if (activeTab !== 'individual' && activeTab !== 'individual-audits') {
      return;
    }

    if (selectedCollector && collectors.data && collectors.data.length > 0) {
      // Admins, Managers, CEOs, and Developers can view any collector (even historical ones not in the active list)
      if (role === 'Administrator' || role === 'Manager' || role === 'CEO' || role === 'Developer') {
        return;
      }

      const isStillAllowed = allowedCollectors.some(c => 
        c.id === selectedCollector.id || 
        c.name.toLowerCase().trim() === selectedCollector.name.toLowerCase().trim()
      );
      if (!isStillAllowed && onCollectorDeleted) {
        onCollectorDeleted();
      }
    }
  }, [selectedCollector, allowedCollectors, collectors.data, onCollectorDeleted, role, activeTab]);

  return (
    <aside 
      className={`bg-[#4f46e5] dark:bg-indigo-950 border-r border-indigo-600 dark:border-indigo-900 shadow-xl flex flex-col fixed h-full z-10 font-sans transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20 px-4 py-6' : 'w-[280px] p-8'
      }`}
    >
      <div className={`mb-6 flex-shrink-0 flex ${isCollapsed ? 'flex-col justify-center gap-4' : 'flex-row justify-between items-center'} transition-all duration-300`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : ''} transition-all duration-300 overflow-hidden`}>
             <h1 className={`font-extrabold text-white tracking-tight font-inter select-none ${isCollapsed ? 'text-xl' : 'text-xl'} drop-shadow-sm whitespace-nowrap`}>
              {isCollapsed ? 'VG' : 'VANGARDE GROUP'}
            </h1>
        </div>
        
        <button 
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg text-indigo-200 hover:bg-white/10 hover:text-white transition-colors focus:outline-none ${isCollapsed ? 'mx-auto' : ''}`}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="space-y-2 flex-grow flex flex-col min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-400/30 pr-1">
        <div className="space-y-3 mt-2">
          {/* 1. Home */}
          <NavItem 
            icon={Home} 
            label="Home" 
            isActive={activeTab === 'home'} 
            isCollapsed={isCollapsed}
            onClick={() => onResetToMainTab('home')} 
          />

          {/* 2. Executive */}
          {permissions.viewExecutive && (
            <NavItem 
              icon={LayoutDashboard} 
              label="Executive" 
              isActive={activeTab === 'executive'} 
              isCollapsed={isCollapsed}
              onClick={() => onResetToMainTab('executive')} 
            />
          )}
          
          {/* 2.5 KPI */}
          {permissions.viewKPI && (
            <NavItem 
              icon={BarChart2} 
              label="KPI" 
              isActive={activeTab === 'kpi'} 
              isCollapsed={isCollapsed}
              onClick={() => onResetToMainTab('kpi')} 
            />
          )}
          
          {/* 3. Postdates */}
          {permissions.viewPostdates && (
            <NavItem 
              icon={CircleDollarSign} 
              label="Postdates" 
              isActive={activeTab === 'postdates'} 
              isCollapsed={isCollapsed}
              onClick={() => onResetToMainTab('postdates')} 
            />
          )}

          {/* 4. Collector (Overview) & Collapsible List */}
          {permissions.viewCollectorDashboard && (
            <div className="space-y-1">
              <NavItem 
                icon={Users} 
                label="Collector" 
                isActive={activeTab === 'collector-overview' || activeTab === 'individual' || activeTab === 'individual-audits'} 
                isCollapsed={isCollapsed}
                onClick={() => onResetToMainTab('collector-overview')} 
                hasSubmenu={true}
                isSubmenuOpen={isCollectorListVisible}
              />
              
              {/* Nested Collector List */}
              {isCollectorListVisible && !isCollapsed && allowedCollectors.length > 0 && (
                <div className="ml-4 pl-4 border-l border-indigo-500/30 dark:border-indigo-800 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  {allowedCollectors.map((collector) => {
                    const isActive = activeTab === 'individual' && selectedCollector?.id === collector.id;
                    return (
                      <button
                        key={collector.id}
                        onClick={() => onCollectorClick(collector)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all group ${
                          isActive 
                          ? 'bg-white/10 text-white font-bold shadow-sm backdrop-blur-sm' 
                          : 'text-indigo-200 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span className="text-[13px] truncate text-left">{collector.name}</span>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-glow"></div>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 5. Mirror */}
          {permissions.viewMirror && (
            <NavItem 
              icon={Monitor} 
              label="Mirror" 
              isActive={activeTab === 'mirror'} 
              isCollapsed={isCollapsed}
              onClick={() => onResetToMainTab('mirror')} 
            />
          )}

          {/* 6. Projection */}
          {permissions.viewProjection && (
            <NavItem 
              icon={TrendingUp} 
              label="Projection" 
              isActive={activeTab === 'projection'} 
              isCollapsed={isCollapsed}
              onClick={() => onResetToMainTab('projection')} 
            />
          )}

          {/* 6.5 RPC Logs */}
          {permissions.viewRPCLogs && (
            <NavItem 
              icon={FileText} 
              label="RPC Logs" 
              isActive={activeTab === 'rpc-logs'} 
              isCollapsed={isCollapsed}
              onClick={() => onResetToMainTab('rpc-logs')} 
            />
          )}

          {/* 7. Audits */}
          {permissions.viewAuditDashboard && (
            <NavItem 
              icon={ClipboardList} 
              label="Audits" 
              isActive={activeTab === 'audits'} 
              isCollapsed={isCollapsed}
              alertCount={pendingAuditCount}
              onClick={() => onResetToMainTab('audits')} 
            />
          )}

          {/* 7.5 Recovery */}
          {permissions.viewRecovery && (
            <NavItem 
              icon={AlertOctagon} 
              label="Recovery" 
              isActive={activeTab === 'recovery'} 
              isCollapsed={isCollapsed}
              onClick={() => onResetToMainTab('recovery')} 
            />
          )}
          
          {/* 8. Inventory */}
          {permissions.viewInventory && (
            <NavItem 
              icon={Package} 
              label="Inventory" 
              isActive={activeTab === 'inventory' || activeTab === 'collector-breakdown' || activeTab === 'metric-breakdown'} 
              isCollapsed={isCollapsed}
              onClick={() => onResetToMainTab('inventory')} 
            />
          )}

          {/* 8.1 Collector Inventory */}
          {permissions.viewCollectorInventory && (
            <NavItem 
              icon={Package} 
              label="My Inventory" 
              isActive={activeTab === 'collector-inventory'} 
              isCollapsed={isCollapsed}
              onClick={() => onResetToMainTab('collector-inventory')} 
            />
          )}

          {/* 8.5 Campaign */}
          {permissions.viewCampaign && (
            <NavItem 
              icon={Megaphone} 
              label="Campaign" 
              isActive={activeTab === 'campaign'} 
              isCollapsed={isCollapsed}
              onClick={() => onResetToMainTab('campaign')} 
            />
          )}

          {/* 9. Settings */}
          {permissions.viewSettings && (
             <NavItem 
              icon={Settings} 
              label="Settings" 
              isActive={activeTab === 'settings'} 
              isCollapsed={isCollapsed}
              onClick={() => onResetToMainTab('settings')} 
            />
          )}
        </div>
        
      </nav>

      <div className={`pt-6 border-t border-indigo-500/30 dark:border-indigo-800 flex-shrink-0 transition-all duration-300`}>
        <div className={`flex items-center gap-2 ${isCollapsed ? 'flex-col' : 'px-2'}`}>
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#4f46e5] dark:text-indigo-950 font-bold text-sm shadow-lg flex-shrink-0">
            {currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          
          {!isCollapsed && (
            <div className="overflow-hidden flex-1">
              <p className="text-[14px] font-bold text-white leading-tight truncate">{currentUser.name}</p>
              <p className="text-[11px] text-indigo-200 font-medium mt-0.5 truncate">{currentUser.role}</p>
            </div>
          )}

          <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2 mt-2' : 'gap-1'}`}>
            <button 
               onClick={onLogout}
               className="p-2 rounded-xl text-indigo-200 hover:text-white hover:bg-indigo-800/50 transition-colors"
               title="Log Out"
            >
               <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

const NavItem: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
  hasSubmenu?: boolean;
  isSubmenuOpen?: boolean;
  alertCount?: number;
}> = ({ icon: Icon, label, isActive, isCollapsed, onClick, hasSubmenu, isSubmenuOpen, alertCount }) => {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center transition-all duration-200 group relative
        ${isCollapsed ? 'justify-center px-2 py-3' : 'gap-4 px-4 py-3'}
        ${isActive ? 'bg-white/20 text-white shadow-sm' : 'text-indigo-100 hover:bg-white/10 hover:text-white'}
        rounded-xl
      `}
      title={isCollapsed ? label : undefined}
    >
      <Icon 
        size={22} 
        strokeWidth={isActive ? 2.5 : 2} 
        className={`transition-colors ${isActive ? 'text-white' : 'text-indigo-200 group-hover:text-white'}`}
      />
      
      {!isCollapsed && (
        <>
          <span className={`text-[15px] font-medium whitespace-nowrap transition-opacity duration-200 flex-1 text-left ${isActive ? 'font-bold' : ''}`}>
            {label}
          </span>
          {alertCount !== undefined && alertCount > 0 && (
            <div className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              {alertCount}
            </div>
          )}
          {hasSubmenu && (
            <ChevronDown 
              size={16} 
              className={`transition-transform duration-200 text-indigo-300 ${isSubmenuOpen ? 'rotate-180 text-white' : ''}`} 
            />
          )}
        </>
      )}
      
      {isCollapsed && isActive && (
        <div className="absolute left-0 w-1 h-8 bg-white rounded-r-full"></div>
      )}
      {isCollapsed && alertCount !== undefined && alertCount > 0 && (
        <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#4f46e5]"></div>
      )}
    </button>
  );
};

export default Sidebar;