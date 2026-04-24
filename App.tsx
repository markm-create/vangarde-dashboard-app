import React, { useState, useEffect } from 'react';
import { ArrowLeft, LayoutGrid } from 'lucide-react';
import { Collector, TabType, AppUser } from './types';
import Sidebar from './components/Sidebar';
import HomeDashboard from './components/HomeDashboard';
import ExecutiveOverview from './components/ExecutiveOverview';
import KPIDashboard from './components/KPIDashboard';
import PostdatesView from './components/PostdatesView';
import CollectorPerformance from './components/CollectorPerformance';
import IndividualCollectorDashboard from './components/IndividualCollectorDashboard';
import AuditDashboard from './components/AuditDashboard';
import IndividualAuditLogs from './components/IndividualAuditLogs';
import ProjectionDashboard from './components/ProjectionDashboard';
import MirrorDashboard from './components/MirrorDashboard';
import InventoryDashboard from './components/InventoryDashboard';
import CampaignDashboard from './components/CampaignDashboard';
import RPCLogsDashboard from './components/RPCLogsDashboard';
import UserSettings from './components/UserSettings';
import MonthlyCollectionsHistory from './components/MonthlyCollectionsHistory';
import NewImportsReport from './components/NewImportsReport';
import CallPerformanceReport from './components/CallPerformanceReport';
import OverduePaymentsReport from './components/OverduePaymentsReport';
import BillingAuditReport from './components/BillingAuditReport';
import CollectorAccountBreakdown from './components/CollectorAccountBreakdown';
import MetricAccountBreakdown from './components/MetricAccountBreakdown';
import CollectorHome from './components/CollectorHome/CollectorHome';
import NewAssignedAccounts from './components/NewAssignedAccounts';
import CollectorInventory from './components/CollectorInventory';
import UnactivatedAccounts from './components/UnactivatedAccounts';
import Login from './Login';
import { DataPreloader } from './components/DataPreloader';
import { getDefaultPermissionsForRole, USER_SCRIPT_URL, CONFIG, COLLECTORS } from './constants';

const parseCloudPermissions = (settings: any, role: string, email: string) => {
  if (!settings) return getDefaultPermissionsForRole(role as any, email);
  if (typeof settings === 'object' && settings !== null) return settings;
  if (typeof settings === 'string' && settings.trim().startsWith('{')) {
    try {
      return JSON.parse(settings);
    } catch (e) {
      console.error("Failed to parse cloud settings", e);
    }
  }
  return getDefaultPermissionsForRole(role as any, email);
};

const getUserFromStorage = (identifier: string): AppUser | null => {
  try {
    const storedUsers = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (storedUsers) {
      const users: AppUser[] = JSON.parse(storedUsers);
      const normalized = identifier.trim().toLowerCase();
      return users.find(u => 
        u.email.trim().toLowerCase() === normalized || 
        (u.username && u.username.trim().toLowerCase() === normalized)
      ) || null;
    }
  } catch (e) {
    console.error("Failed to retrieve user", e);
  }
  return null;
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(CONFIG.THEME_KEY);
    return saved === 'dark';
  });
  
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const savedSession = localStorage.getItem(CONFIG.SESSION_KEY);
    if (savedSession) {
      try {
        return JSON.parse(savedSession);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedCollector, setSelectedCollector] = useState<Collector | null>(null);
  const [selectedMetricCategory, setSelectedMetricCategory] = useState<{ id: string; title: string; sheetName: string } | null>(null);
  const [auditInitialView, setAuditInitialView] = useState<any>('overview');
  const [campaignInitialView, setCampaignInitialView] = useState<any>('menu');
  const [flaggedAgent, setFlaggedAgent] = useState<string | null>(null);
  const [isCollectorListVisible, setIsCollectorListVisible] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Initialize history state
    if (!window.history.state) {
      window.history.replaceState({ tab: activeTab, auditView: auditInitialView, agent: flaggedAgent }, '', '');
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state) {
        if (state.tab) setActiveTab(state.tab);
        if (state.auditView) {
          if (state.tab === 'campaign') {
            setCampaignInitialView(state.auditView);
          } else {
            setAuditInitialView(state.auditView);
          }
        }
        if (state.agent !== undefined) setFlaggedAgent(state.agent);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

    // Sync users from cloud on initial load
    useEffect(() => {
      const syncUsers = async (retryCount = 0) => {
        setIsSyncing(true);
        try {
          // Use a more robust fetch approach for Google Scripts
          const response = await fetch(USER_SCRIPT_URL, {
            method: 'POST',
            credentials: 'omit',
            redirect: 'follow',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: JSON.stringify({ action: 'getUsers' })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          if (result.status === 'success' && Array.isArray(result.users)) {
            // Ensure all users have permissions
            const validatedUsers = result.users.map((u: any) => ({
              ...u,
              permissions: parseCloudPermissions(u.permissions || u.settings, u.role, u.email)
            }));
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(validatedUsers));
            // Trigger update event for other components
            window.dispatchEvent(new Event('vg_user_update'));
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          if (msg === 'Failed to fetch') {
            console.warn("User Sync: Connection Blocked. Please check Google Script deployment permissions.");
          } else {
            console.error("Failed to sync users from cloud:", error);
          }
          // Simple retry logic for network blips
          if (retryCount < 2) {
            setTimeout(() => syncUsers(retryCount + 1), 2000);
          }
        } finally {
          setIsSyncing(false);
        }
      };
      syncUsers();
    }, []);

  // Sync dark mode class to HTML element for CSS variable stability
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(CONFIG.THEME_KEY, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const handleUserUpdate = () => {
      if (currentUser) {
        const freshUser = getUserFromStorage(currentUser.email);
        if (freshUser) {
          if (JSON.stringify(freshUser.permissions) !== JSON.stringify(currentUser.permissions)) {
            setCurrentUser(freshUser);
            localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(freshUser));
          }
        }
      }
    };
    window.addEventListener('vg_user_update', handleUserUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === CONFIG.STORAGE_KEY) handleUserUpdate();
    });
    return () => {
      window.removeEventListener('vg_user_update', handleUserUpdate);
      window.removeEventListener('storage', handleUserUpdate);
    };
  }, [currentUser]);

  const handleLogin = async (username: string, password?: string, isBypass?: boolean) => {
    setLoginError(null);

    if (isBypass) {
      const devUser: AppUser = {
        email: 'mark.mojica@vangardegroup.com',
        name: 'Mark Mojica',
        username: 'developer',
        role: 'Developer',
        lastLogin: new Date().toISOString(),
        permissions: getDefaultPermissionsForRole('Developer', 'mark.mojica@vangardegroup.com')
      };
      setCurrentUser(devUser);
      localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(devUser));
      return;
    }

    // Verify against cloud database
    try {
      const response = await fetch(USER_SCRIPT_URL, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify({ 
          action: 'verifyLogin', 
          username: username.trim(), 
          password: password || '' 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'success' && result.user) {
        const cloudUser = result.user;
        // Ensure permissions are present
        const permissions = parseCloudPermissions(cloudUser.permissions || cloudUser.settings, cloudUser.role, cloudUser.email);
        
        const updatedUser: AppUser = { 
          ...cloudUser, 
          permissions,
          lastLogin: new Date().toISOString() 
        };
        
        setCurrentUser(updatedUser);
        localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(updatedUser));
        
        // Also update local storage cache
        const storedUsers = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (storedUsers) {
          const users: AppUser[] = JSON.parse(storedUsers);
          const index = users.findIndex(u => u.email.toLowerCase() === cloudUser.email.toLowerCase());
          if (index !== -1) {
            users[index] = updatedUser;
          } else {
            users.push(updatedUser);
          }
          localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(users));
        }
      } else {
        setLoginError(result.message || "Invalid username or password. Please contact your administrator.");
      }
    } catch (error) {
      console.error("Login verification failed", error);
      // Fallback to local storage if cloud is down
      const user = getUserFromStorage(username);
      if (user && user.password === password) {
        const updatedUser = { ...user, lastLogin: new Date().toISOString() };
        setCurrentUser(updatedUser);
        localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(updatedUser));
      } else {
        setLoginError("Network Error: Could not connect to the database. Please check your internet.");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(CONFIG.SESSION_KEY);
    setCurrentUser(null);
    setActiveTab('home');
  };

  const handleCollectorClick = (collector: Collector) => {
    setSelectedCollector(collector);
    setActiveTab('individual');
    setIsCollectorListVisible(true);
  };

  const handleCollectorBreakdownClick = (collector: Collector) => {
    setSelectedCollector(collector);
    setActiveTab('collector-breakdown');
  };

  const handleMetricClick = (category: { id: string; title: string; sheetName: string }) => {
    setSelectedMetricCategory(category);
    setActiveTab('metric-breakdown');
  };

  const resetToMainTab = (tab: TabType, subView?: any, agent?: string) => {
    const newState = { tab, auditView: subView || 'overview', agent: agent || null };
    const currentState = window.history.state;
    
    // Only push if it's a real navigation change
    const isSameTab = currentState && currentState.tab === tab;
    const isSameView = currentState && currentState.auditView === newState.auditView;
    const isSameAgent = currentState && currentState.agent === newState.agent;

    if (!isSameTab || !isSameView || !isSameAgent) {
      window.history.pushState(newState, '', '');
    }

    if (tab === 'collector-overview') {
      if (activeTab === 'collector-overview' || activeTab === 'individual' || activeTab === 'individual-audits') {
        setActiveTab('collector-overview');
        setSelectedCollector(null);
        setIsCollectorListVisible(prev => !prev);
      } else {
        setActiveTab(tab);
        setSelectedCollector(null);
        setIsCollectorListVisible(true);
      }
    } else if (tab === 'audits') {
      setAuditInitialView(subView || 'overview');
      setFlaggedAgent(agent || null);
      setSelectedCollector(null);
      setActiveTab(tab);
      setIsCollectorListVisible(false);
    } else if (tab === 'campaign') {
      setCampaignInitialView(subView || 'menu');
      setSelectedCollector(null);
      setActiveTab(tab);
      setIsCollectorListVisible(false);
    } else if (tab === 'individual' || tab === 'individual-audits' || tab === 'collector-breakdown') {
      setActiveTab(tab);
    } else {
      setSelectedCollector(null);
      setActiveTab(tab);
      setIsCollectorListVisible(false);
    }
  };

  const handleCollectorDeleted = React.useCallback(() => {
    setSelectedCollector(null);
    setActiveTab('home');
  }, []);

  const renderContent = () => {
    if (!currentUser) return null;

    switch (activeTab) {
      case 'home':
        if (currentUser.role === 'Collector' && currentUser.permissions.viewCollectorHome) {
          return <CollectorHome currentUser={currentUser} onNavigate={resetToMainTab} />;
        }
        return <HomeDashboard onNavigate={resetToMainTab} currentUser={currentUser} />;
      case 'executive':
        return <ExecutiveOverview />;
      case 'kpi':
        return <KPIDashboard />;
      case 'postdates':
        return <PostdatesView canManageDocuments={currentUser.permissions.manageDocuments} currentUser={currentUser} onNavigate={resetToMainTab} />;
      case 'projection':
        return <ProjectionDashboard />;
      case 'mirror':
        return <MirrorDashboard currentUser={currentUser} />;
      case 'rpc-logs':
        return <RPCLogsDashboard currentUser={currentUser} />;
      case 'collector-overview':
        return <CollectorPerformance currentUser={currentUser} />;
      case 'audits':
        if (currentUser.role === 'Collector') {
          const matchedCollector = COLLECTORS.find(c => c.name.toLowerCase() === currentUser.name.toLowerCase());
          if (matchedCollector) {
            return (
              <IndividualAuditLogs 
                collector={matchedCollector} 
                onBack={() => resetToMainTab('home')} 
                canManageDocuments={currentUser.permissions.manageDocuments}
                canSendReport={currentUser.permissions.sendReport}
              />
            );
          }
          return <div className="p-8 text-slate-400">Collector profile not found.</div>;
        }
        return (
          <AuditDashboard 
            canManageDocuments={currentUser.permissions.manageDocuments} 
            initialView={auditInitialView} 
            onNavigate={resetToMainTab}
            selectedAgent={flaggedAgent}
            currentUser={currentUser}
          />
        );
      case 'recovery':
        return (
          <AuditDashboard 
            canManageDocuments={currentUser.permissions.manageDocuments} 
            initialView="postdates"
            onNavigate={resetToMainTab}
            currentUser={currentUser}
          />
        );
      case 'inventory':
        return <InventoryDashboard onCollectorBreakdownClick={handleCollectorBreakdownClick} onMetricClick={handleMetricClick} />;
      case 'campaign':
        return <CampaignDashboard initialView={campaignInitialView} onBack={() => resetToMainTab('home')} />;
      case 'collector-inventory':
        return <CollectorInventory currentUser={currentUser} onBack={() => resetToMainTab('home')} />;
      case 'new-imports':
        return <NewImportsReport onBack={() => resetToMainTab('home')} canExport={currentUser.permissions.manageDocuments} />;
      case 'new-assigned':
        return <NewAssignedAccounts onBack={() => resetToMainTab('home')} currentUser={currentUser} />;
      case 'call-performance':
        return <CallPerformanceReport onBack={() => resetToMainTab('home')} canExport={currentUser.permissions.manageDocuments} />;
      case 'overdue-payments':
        return <OverduePaymentsReport onBack={() => resetToMainTab('home')} canExport={currentUser.permissions.manageDocuments} />;
      case 'unactivated-accounts':
        return <UnactivatedAccounts onBack={() => resetToMainTab('home')} />;
      case 'reports':
        return (
          <div className="p-8 space-y-8 bg-app h-screen animate-in fade-in duration-500 font-sans overflow-hidden flex flex-col">
            <div className="flex items-center gap-4 shrink-0">
              <button onClick={() => resetToMainTab('home')} className="p-2.5 rounded-2xl bg-card border border-border-subtle text-text-muted hover:text-indigo-600 shadow-sm transition-all group">
                <ArrowLeft size={20} className="group-hover:-translate-x-0.5" />
              </button>
              <div>
                <h1 className="text-2xl font-black text-text-main uppercase tracking-tight">All Reports</h1>
                <p className="text-text-muted font-bold text-[11px] tracking-[0.2em] mt-1 uppercase">Future Scalability Hub</p>
              </div>
            </div>
            <div className="flex-1 bg-card rounded-[2rem] border border-border-subtle shadow-sm p-12 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center mb-6">
                <LayoutGrid size={48} />
              </div>
              <h2 className="text-2xl font-black text-text-main uppercase tracking-tight mb-4">More Reports Coming Soon</h2>
              <p className="text-text-muted max-w-md mx-auto font-medium">We are currently developing additional reporting modules to provide deeper insights into your collection performance. Check back soon for updates!</p>
            </div>
          </div>
        );
      case 'settings':
        return <UserSettings isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} currentUser={currentUser} />;
      case 'collections-history':
        return <MonthlyCollectionsHistory onBack={() => resetToMainTab('home')} currentUser={currentUser} />;
      case 'collector-breakdown':
        if (selectedCollector) {
          return (
            <CollectorAccountBreakdown 
              collector={selectedCollector} 
              onBack={() => resetToMainTab('inventory')} 
            />
          );
        }
        return <div className="p-8 text-slate-400">Please select a collector.</div>;
      case 'metric-breakdown':
        if (selectedMetricCategory) {
          return (
            <MetricAccountBreakdown 
              category={selectedMetricCategory} 
              onBack={() => resetToMainTab('inventory')} 
            />
          );
        }
        return <div className="p-8 text-slate-400">Please select a metric category.</div>;
      case 'individual':
        if (selectedCollector) {
          return (
            <IndividualCollectorDashboard 
              key={selectedCollector.id}
              collector={selectedCollector} 
              onViewAudits={() => resetToMainTab('audits')} 
              onCollectorDeleted={handleCollectorDeleted}
            />
          );
        }
        return <div className="p-8 text-slate-400">Please select a collector from the sidebar.</div>;
      default:
        return <div className="p-8 text-slate-400">Page not found</div>;
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="flex min-h-screen font-sans bg-app text-text-main transition-colors duration-300">
      <DataPreloader currentUser={currentUser} />
      <Sidebar 
        activeTab={activeTab} 
        selectedCollector={selectedCollector} 
        isCollectorListVisible={isCollectorListVisible}
        isCollapsed={isSidebarCollapsed}
        currentUser={currentUser}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onResetToMainTab={resetToMainTab}
        onCollectorClick={handleCollectorClick}
        onCollectorDeleted={handleCollectorDeleted}
        onLogout={handleLogout}
      />

      <main 
        className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'ml-20' : 'ml-[280px]'
        }`}
      >
        {renderContent()}
      </main>
    </div>
  );
}