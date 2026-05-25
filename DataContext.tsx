import React, { createContext, useContext, useState, useCallback } from 'react';
import { sheetService } from './services/sheetService';
import { ExecutiveData, HomeData, Collector, AuditScoringData, Payment, RPCLog, Reminder, AgentProjection } from './types';
import { PROJECTION_SCRIPT_URL, ONBOARDING_AUDIT_SCRIPT_URL, ACCOUNT_CLOSURE_AUDIT_SCRIPT_URL, DECLINE_RECOVERY_SCRIPT_URL, KPI_SCRIPT_URL, RPC_AUDIT_SCRIPT_URL, ACCOUNT_MONITORING_AUDIT_SCRIPT_URL } from './constants';

interface DataContextType {
  postdates: {
    scheduled: Payment[];
    processed: Payment[];
    summary: {
      totalSucceeded: number;
      totalDeclined: number;
      totalRecovered: number;
      totalSucceededAndRecovered: number;
      totalProcessed: number;
      todaySucceeded: number;
      todayDeclined: number;
      totalRemaining: number;
      weeklyStart: number;
      monthlyStart: number;
    };
    isLoading: boolean;
    lastFetched: number | null;
  };
  rpcLogs: {
    data: RPCLog[];
    isLoading: boolean;
    lastFetched: number | null;
  };
  reminders: {
    data: Reminder[];
    isLoading: boolean;
    lastFetched: number | null;
  };
  executive: {
    data: ExecutiveData | null;
    isLoading: boolean;
    lastFetched: number | null;
    error: string | null;
  };
  home: {
    data: HomeData | null;
    isLoading: boolean;
    lastFetched: number | null;
    error: string | null;
  };
  collectors: {
    data: any[];
    isLoading: boolean;
    lastFetched: number | null;
    error: string | null;
  };
  mirror: {
    data: any[];
    isLoading: boolean;
    lastFetched: number | null;
    error: string | null;
  };
  callPerformance: {
    data: any[];
    isLoading: boolean;
    lastFetched: number | null;
    error: string | null;
  };
  flaggedAccounts: {
    data: any[];
    isLoading: boolean;
    lastFetched: number | null;
    error: string | null;
  };
  imports: {
    data: any[];
    isLoading: boolean;
    lastFetched: number | null;
    error: string | null;
  };
  overduePayments: {
    data: any[];
    isLoading: boolean;
    lastFetched: number | null;
    error: string | null;
  };
  inventory: {
    data: any[];
    metrics: any;
    isLoading: boolean;
    lastFetched: number | null;
    error: string | null;
  };
  projection: {
    data: any[];
    isLoading: boolean;
    lastFetched: number | null;
    error: string | null;
  };
  individualCollectors: {
    data: any[];
    isLoading: boolean;
    lastFetched: number | null;
    error: string | null;
  };
  onboardingAudits: {
    data: any[];
    isLoading: boolean;
    lastFetched: number | null;
    error: string | null;
  };
  accountClosureAudit: {
    data: any[];
    isLoading: boolean;
    lastFetched: number | null;
    error: string | null;
  };
  rpcAudits: {
    data: any[];
    isLoading: boolean;
    lastFetched: number | null;
    error: string | null;
  };
  declineRecovery: {
    data: any | null;
    isLoading: boolean;
    lastFetched: number | null;
    error: string | null;
  };
  billingAudit: {
    data: any[];
    isLoading: boolean;
    lastFetched: number | null;
    error: string | null;
  };
  accountMonitoringAudit: {
    data: any[];
    isLoading: boolean;
    lastFetched: number | null;
    error: string | null;
  };
  auditScoring: {
    data: AuditScoringData | null;
    isLoading: boolean;
    lastFetched: number | null;
    error: string | null;
  };
  collectorHome: {
    data: any | null;
    isLoading: boolean;
    lastFetched: number | null;
    error: string | null;
  };
  newAssignedAccounts: {
    data: any[];
    isLoading: boolean;
    lastFetched: number | null;
    error: string | null;
  };
  collectorInventory: {
    data: any[];
    isLoading: boolean;
    lastFetched: number | null;
    error: string | null;
  };
  kpi: {
    data: any[];
    isLoading: boolean;
    lastFetched: number | null;
    error: string | null;
  };
  fetchPostdates: (force?: boolean) => Promise<void>;
  fetchRPCLogs: (force?: boolean) => Promise<void>;
  fetchReminders: (force?: boolean) => Promise<void>;
  fetchExecutive: (force?: boolean) => Promise<void>;
  fetchHome: (force?: boolean) => Promise<void>;
  fetchCollectors: (force?: boolean) => Promise<void>;
  fetchMirror: (force?: boolean) => Promise<void>;
  fetchCallPerformance: (force?: boolean) => Promise<void>;
  fetchFlaggedAccounts: (force?: boolean) => Promise<void>;
  fetchImports: (force?: boolean) => Promise<void>;
  fetchOverduePayments: (force?: boolean) => Promise<void>;
  fetchInventory: (force?: boolean) => Promise<void>;
  fetchProjection: (force?: boolean) => Promise<void>;
  fetchIndividualCollectors: (force?: boolean) => Promise<void>;
  fetchOnboardingAudits: (force?: boolean) => Promise<void>;
  fetchAccountClosureAudit: (force?: boolean) => Promise<void>;
  fetchRpcAudits: (force?: boolean) => Promise<void>;
  fetchDeclineRecovery: (force?: boolean) => Promise<void>;
  fetchBillingAudit: (force?: boolean) => Promise<void>;
  fetchAccountMonitoringAudit: (force?: boolean) => Promise<void>;
  fetchAuditScoring: (collectorName: string, force?: boolean) => Promise<void>;
  fetchCollectorHome: (collectorName: string, force?: boolean) => Promise<void>;
  fetchNewAssignedAccounts: (force?: boolean) => Promise<void>;
  fetchCollectorInventory: (collectorName: string, force?: boolean) => Promise<void>;
  updateProjectionLocal: (data: AgentProjection[]) => void;
  updateRPCLogsLocal: (logs: RPCLog[]) => void;
  updateRemindersLocal: (reminders: Reminder[]) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [postdates, setPostdates] = useState<DataContextType['postdates']>({
    scheduled: [],
    processed: [],
    summary: {
      totalSucceeded: 0,
      totalDeclined: 0,
      totalRecovered: 0,
      totalSucceededAndRecovered: 0,
      totalProcessed: 0,
      todaySucceeded: 0,
      todayDeclined: 0,
      totalRemaining: 0,
      weeklyStart: 0,
      monthlyStart: 0
    },
    isLoading: false,
    lastFetched: null,
  });

  const [rpcLogs, setRpcLogs] = useState<DataContextType['rpcLogs']>({
    data: [],
    isLoading: false,
    lastFetched: null,
  });

  const [reminders, setReminders] = useState<DataContextType['reminders']>({
    data: [],
    isLoading: false,
    lastFetched: null,
  });

  const [executive, setExecutive] = useState<DataContextType['executive']>({
    data: null,
    isLoading: false,
    lastFetched: null,
    error: null,
  });

  const [home, setHome] = useState<DataContextType['home']>({
    data: null,
    isLoading: false,
    lastFetched: null,
    error: null,
  });

  const [collectors, setCollectors] = useState<DataContextType['collectors']>({
    data: [],
    isLoading: false,
    lastFetched: null,
    error: null,
  });

  const [mirror, setMirror] = useState<DataContextType['mirror']>({
    data: [],
    isLoading: false,
    lastFetched: null,
    error: null,
  });

  const [callPerformance, setCallPerformance] = useState<DataContextType['callPerformance']>({
    data: [],
    isLoading: false,
    lastFetched: null,
    error: null,
  });

  const [flaggedAccounts, setFlaggedAccounts] = useState<DataContextType['flaggedAccounts']>({
    data: [],
    isLoading: false,
    lastFetched: null,
    error: null,
  });
  
  const [imports, setImports] = useState<DataContextType['imports']>({
    data: [],
    isLoading: false,
    lastFetched: null,
    error: null,
  });

  const [overduePayments, setOverduePayments] = useState<DataContextType['overduePayments']>({
    data: [],
    isLoading: false,
    lastFetched: null,
    error: null,
  });

  const [inventory, setInventory] = useState<DataContextType['inventory']>({
    data: [],
    metrics: null,
    isLoading: false,
    lastFetched: null,
    error: null,
  });

  const [projection, setProjection] = useState<DataContextType['projection']>({
    data: [],
    isLoading: false,
    lastFetched: null,
    error: null,
  });

  const [individualCollectors, setIndividualCollectors] = useState<DataContextType['individualCollectors']>({
    data: [],
    isLoading: false,
    lastFetched: null,
    error: null,
  });

  const [onboardingAudits, setOnboardingAudits] = useState<DataContextType['onboardingAudits']>({
    data: [],
    isLoading: false,
    lastFetched: null,
    error: null,
  });

  const [accountClosureAudit, setAccountClosureAudit] = useState<DataContextType['accountClosureAudit']>({
    data: [],
    isLoading: false,
    lastFetched: null,
    error: null,
  });

  const [rpcAudits, setRpcAudits] = useState<DataContextType['rpcAudits']>({
    data: [],
    isLoading: false,
    lastFetched: null,
    error: null,
  });

  const [declineRecovery, setDeclineRecovery] = useState<DataContextType['declineRecovery']>({
    data: null,
    isLoading: false,
    lastFetched: null,
    error: null,
  });

  const [billingAudit, setBillingAudit] = useState<DataContextType['billingAudit']>({
    data: [],
    isLoading: false,
    lastFetched: null,
    error: null,
  });

  const [accountMonitoringAudit, setAccountMonitoringAudit] = useState<DataContextType['accountMonitoringAudit']>({
    data: [],
    isLoading: false,
    lastFetched: null,
    error: null,
  });

  const [auditScoring, setAuditScoring] = useState<DataContextType['auditScoring']>({
    data: null,
    isLoading: false,
    lastFetched: null,
    error: null,
  });

  const [collectorHome, setCollectorHome] = useState<DataContextType['collectorHome']>({
    data: null,
    isLoading: false,
    lastFetched: null,
    error: null,
  });

  const [newAssignedAccounts, setNewAssignedAccounts] = useState<DataContextType['newAssignedAccounts']>({
    data: [],
    isLoading: false,
    lastFetched: null,
    error: null,
  });

  const [collectorInventory, setCollectorInventory] = useState<DataContextType['collectorInventory']>({
    data: [],
    isLoading: false,
    lastFetched: null,
    error: null,
  });

  const [kpi, setKpi] = useState<DataContextType['kpi']>({
    data: [],
    isLoading: false,
    lastFetched: null,
    error: null,
  });

  const fetchPostdates = useCallback(async (force = false) => {
    if (!force && postdates.lastFetched && Date.now() - postdates.lastFetched < 300000) { // 5 min cache
      return;
    }

    setPostdates(prev => ({ ...prev, isLoading: true }));
    try {
      const data = await sheetService.getPostdatesData();
      console.log('POSTDATES DATA:', data);
      
      const mapPayment = (p: any): Payment => {
        const date = p.dateTime ? new Date(p.dateTime) : new Date();
        return {
          ...p,
          amount: Number(p.amount) || 0,
          rawDate: isNaN(date.getTime()) ? new Date() : date,
          dateTime: isNaN(date.getTime()) 
            ? 'Invalid Date' 
            : date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        };
      };

      setPostdates({
        scheduled: (data.scheduled || []).filter((p: any) => p.owner || p.accountId || p.amount).map(mapPayment),
        processed: (data.processed || []).filter((p: any) => p.owner || p.accountId || p.amount).map(mapPayment),
        summary: {
          totalSucceeded: data.summary?.totalSucceeded || 0,
          totalDeclined: data.summary?.totalDeclined || 0,
          totalRecovered: data.summary?.totalRecovered || 0,
          totalSucceededAndRecovered: data.summary?.totalSucceededAndRecovered || 0,
          totalProcessed: data.summary?.totalProcessed || 0,
          todaySucceeded: data.summary?.todaySucceeded || 0,
          todayDeclined: data.summary?.todayDeclined || 0,
          totalRemaining: data.summary?.totalRemaining || 0,
          weeklyStart: data.summary?.weeklyStart || 0,
          monthlyStart: data.summary?.monthlyStart || 0
        },
        isLoading: false,
        lastFetched: Date.now(),
      });
    } catch (error) {
      console.error('Error fetching postdates:', error);
      setPostdates(prev => ({ ...prev, isLoading: false }));
    }
  }, [postdates.lastFetched]);

  const fetchRPCLogs = useCallback(async (force = false) => {
    if (!force && rpcLogs.lastFetched && Date.now() - rpcLogs.lastFetched < 300000) {
      return;
    }

    setRpcLogs(prev => ({ ...prev, isLoading: true }));
    try {
      const data = await sheetService.getRPCLogs();
      setRpcLogs({
        data,
        isLoading: false,
        lastFetched: Date.now(),
      });
    } catch (error) {
      console.error('Error fetching RPC logs:', error);
      setRpcLogs(prev => ({ ...prev, isLoading: false }));
    }
  }, [rpcLogs.lastFetched]);

  const fetchReminders = useCallback(async (force = false) => {
    if (!force && reminders.lastFetched && Date.now() - reminders.lastFetched < 300000) {
      return;
    }

    setReminders(prev => ({ ...prev, isLoading: true }));
    try {
      const data = await sheetService.getReminders();
      setReminders({
        data,
        isLoading: false,
        lastFetched: Date.now(),
      });
    } catch (error) {
      console.error('Error fetching reminders:', error);
      setReminders(prev => ({ ...prev, isLoading: false }));
    }
  }, [reminders.lastFetched]);

  const fetchExecutive = useCallback(async (force = false) => {
    if (!force && executive.lastFetched && Date.now() - executive.lastFetched < 300000) {
      return;
    }

    setExecutive(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await sheetService.getExecutiveData();
      setExecutive({
        data,
        isLoading: false,
        lastFetched: Date.now(),
        error: null,
      });
    } catch (error) {
      console.error('Error fetching executive data:', error);
      setExecutive(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: (error as Error).message || 'Failed to sync data' 
      }));
    }
  }, [executive.lastFetched]);

  const fetchHome = useCallback(async (force = false) => {
    if (!force && home.lastFetched && Date.now() - home.lastFetched < 300000) {
      return;
    }

    setHome(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const rawData = await sheetService.getHomeData();
      
      // Filter out header rows if they leaked through
      const data = {
        ...rawData,
        checkCollections: (rawData.checkCollections || []).filter((c: any) => {
          const coll = String(c.collector || '').toLowerCase();
          return coll && !coll.includes('collector') && !coll.includes('name');
        })
      };

      setHome({
        data,
        isLoading: false,
        lastFetched: Date.now(),
        error: null,
      });
    } catch (error) {
      const errMsg = (error as Error).message || 'Failed to sync data';
      if (!errMsg.includes('Connection Blocked')) {
         console.error('Error fetching home data:', error);
      }
      setHome(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errMsg 
      }));
    }
  }, [home.lastFetched]);

  const fetchCollectors = useCallback(async (force = false) => {
    if (!force && collectors.lastFetched && Date.now() - collectors.lastFetched < 300000) {
      return;
    }

    setCollectors(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await sheetService.getCollectorPerformanceData();
      
      // Transform raw sheet data into Collector objects, filtering out headers
      const dynamicCollectors: Collector[] = (result.data || [])
        .filter((item: any) => {
          const name = String(item.name || '').toLowerCase();
          return name && !name.includes('name') && !name.includes('collector') && name !== 'unknown collector';
        })
        .map((item: any, index: number) => {
          const name = item.name || 'Unknown Collector';
          const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          return {
            ...item, // Include all other fields like prior_worked, wtd_collected, etc.
            id: id,
            name: name,
            status: 'online', // Default to online for active collectors in sheet
            rank: index + 1
          };
        });

      setCollectors({
        data: dynamicCollectors,
        isLoading: false,
        lastFetched: Date.now(),
        error: null,
      });
    } catch (error) {
      console.error('Error fetching collector data:', error);
      setCollectors(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: (error as Error).message || 'Failed to sync data' 
      }));
    }
  }, [collectors.lastFetched]);

  const fetchMirror = useCallback(async (force = false) => {
    if (!force && mirror.lastFetched && Date.now() - mirror.lastFetched < 300000) {
      return;
    }

    setMirror(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await sheetService.getMirrorData();
      
      // Filter out header rows
      const filteredMirror = (result.data || []).filter((item: any) => {
        const name = String(item.name || '').toLowerCase();
        return name && !name.includes('name') && !name.includes('collector');
      });

      setMirror({
        data: filteredMirror,
        isLoading: false,
        lastFetched: Date.now(),
        error: null,
      });
    } catch (error) {
      console.error('Error fetching mirror data:', error);
      setMirror(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: (error as Error).message || 'Failed to sync data' 
      }));
    }
  }, [mirror.lastFetched]);

  const fetchCallPerformance = useCallback(async (force = false) => {
    if (!force && callPerformance.lastFetched && Date.now() - callPerformance.lastFetched < 300000) {
      return;
    }

    setCallPerformance(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await sheetService.getCallPerformanceData();
      setCallPerformance({
        data: result.data || [],
        isLoading: false,
        lastFetched: Date.now(),
        error: null,
      });
    } catch (error) {
      console.error('Error fetching call performance data:', error);
      setCallPerformance(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: (error as Error).message || 'Failed to sync data' 
      }));
    }
  }, [callPerformance.lastFetched]);

  const fetchFlaggedAccounts = useCallback(async (force = false) => {
    if (!force && flaggedAccounts.lastFetched && Date.now() - flaggedAccounts.lastFetched < 300000) {
      return;
    }

    setFlaggedAccounts(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await sheetService.getFlaggedAccountsData();
      setFlaggedAccounts({
        data: result.data || [],
        isLoading: false,
        lastFetched: Date.now(),
        error: null,
      });
    } catch (error) {
      console.error('Error fetching flagged accounts data:', error);
      setFlaggedAccounts(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: (error as Error).message || 'Failed to sync data' 
      }));
    }
  }, [flaggedAccounts.lastFetched]);

  const fetchImports = useCallback(async (force = false) => {
    if (!force && imports.lastFetched && Date.now() - imports.lastFetched < 300000) {
      return;
    }

    setImports(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await sheetService.getImportsData();
      setImports({
        data,
        isLoading: false,
        lastFetched: Date.now(),
        error: null,
      });
    } catch (error) {
      console.error('Error fetching imports:', error);
      setImports(prev => ({ ...prev, isLoading: false, error: (error as Error).message }));
    }
  }, [imports.lastFetched]);

  const fetchOverduePayments = useCallback(async (force = false) => {
    if (!force && overduePayments.lastFetched && Date.now() - overduePayments.lastFetched < 300000) {
      return;
    }

    setOverduePayments(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await sheetService.getOverduePaymentsData();
      setOverduePayments({
        data,
        isLoading: false,
        lastFetched: Date.now(),
        error: null,
      });
    } catch (error) {
      console.error('Error fetching overdue payments:', error);
      setOverduePayments(prev => ({ ...prev, isLoading: false, error: (error as Error).message }));
    }
  }, [overduePayments.lastFetched]);

  const fetchInventory = useCallback(async (force = false) => {
    if (!force && inventory.lastFetched && Date.now() - inventory.lastFetched < 300000) {
      return;
    }

    setInventory(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const [data, metrics] = await Promise.all([
        sheetService.getInventoryData(),
        sheetService.getInventoryMetricsData()
      ]);
      setInventory({
        data,
        metrics,
        isLoading: false,
        lastFetched: Date.now(),
        error: null,
      });
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setInventory(prev => ({ ...prev, isLoading: false, error: (error as Error).message }));
    }
  }, [inventory.lastFetched]);

  const fetchProjection = useCallback(async (force = false) => {
    if (!force && projection.lastFetched && Date.now() - projection.lastFetched < 300000) {
      return;
    }

    setProjection(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await sheetService.getProjectionData();
      
      if (Array.isArray(result) && result.length > 0) {
        const mapped = result.map((item: any, i: number) => {
          const getWeek = (w: any) => ({
            projection: Number(w?.projection) || 0,
            collected: Number(w?.collected) || 0,
            reached: (Number(w?.collected) / (Number(w?.projection) || 1)) * 100
          });

          const w1 = getWeek(item.weeks?.w1);
          const w2 = getWeek(item.weeks?.w2);
          const w3 = getWeek(item.weeks?.w3);
          const w4 = getWeek(item.weeks?.w4);
          
          const tp = w1.projection + w2.projection + w3.projection + w4.projection;
          const tc = w1.collected + w2.collected + w3.collected + w4.collected;
          
          return {
            id: item.id || `agent-${i}`,
            name: item.name || `Collector ${i + 1}`,
            weeks: { w1, w2, w3, w4 },
            totalProjection: tp,
            totalCollected: tc,
            totalReached: tp > 0 ? (tc / tp) * 100 : 0
          };
        });
        setProjection({
          data: mapped,
          isLoading: false,
          lastFetched: Date.now(),
          error: null,
        });
      } else if (Array.isArray(result) && result.length === 0) {
        // Only treat as error if we expected live data
        const SCRIPT_URL = PROJECTION_SCRIPT_URL;
        if (!SCRIPT_URL || SCRIPT_URL.includes('PLACEHOLDER')) {
          // Mock data fallback if URL is empty/placeholder
          const activeCollectors = collectors.data || [];
          const mock = activeCollectors.map((c: any, i: number) => {
            const seed = i + 5; const bp = 15000 + (seed % 5) * 2000;
            const generateWeek = (idx: number) => { const proj = bp + (Math.sin(idx + seed) * 1000); const perfMult = 0.7 + (Math.random() * 0.45); const coll = proj * perfMult; return { projection: proj, collected: coll, reached: (coll / proj) * 100 }; };
            const w1 = generateWeek(1); const w2 = generateWeek(2); const w3 = generateWeek(3); const w4 = generateWeek(4);
            const tp = w1.projection + w2.projection + w3.projection + w4.projection; const tc = w1.collected + w2.collected + w3.collected + w4.collected;
            return { id: c.id, name: c.name, weeks: { w1, w2, w3, w4 }, totalProjection: tp, totalCollected: tc, totalReached: (tc / tp) * 100 };
          });
          setProjection({
            data: mock,
            isLoading: false,
            lastFetched: Date.now(),
            error: null,
          });
        } else {
          setProjection({
            data: [],
            isLoading: false,
            lastFetched: Date.now(),
            error: "Empty projection database. Please ensure data exists in the 'Projections' sheet.",
          });
        }
      } else {
        throw new Error("Received an unexpected data format.");
      }
    } catch (error) {
      console.error('Error fetching projection data:', error);
      setProjection(prev => ({ ...prev, isLoading: false, error: (error as Error).message }));
    }
  }, [projection.lastFetched, collectors.data]);

  const fetchIndividualCollectors = useCallback(async (force = false) => {
    if (!force && individualCollectors.lastFetched && Date.now() - individualCollectors.lastFetched < 300000) {
      return;
    }

    setIndividualCollectors(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await sheetService.getIndividualCollectorsData();
      setIndividualCollectors({
        data: result.data,
        isLoading: false,
        lastFetched: Date.now(),
        error: null,
      });
    } catch (error) {
      console.warn('Warning: Could not fetch individual collectors.', error);
      setIndividualCollectors(prev => ({ ...prev, isLoading: false, error: (error as Error).message }));
    }
  }, [individualCollectors.lastFetched]);

  const fetchOnboardingAudits = useCallback(async (force = false) => {
    if (!force && onboardingAudits.lastFetched && Date.now() - onboardingAudits.lastFetched < 300000) {
      return;
    }

    setOnboardingAudits(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const SCRIPT_URL = ONBOARDING_AUDIT_SCRIPT_URL;
      
      const response = await fetch(SCRIPT_URL);
      if (!response.ok) {
        console.warn(`Server responded with status ${response.status} for onboarding audits. Using fallback.`);
        setOnboardingAudits(prev => ({ ...prev, isLoading: false, data: [] }));
        return;
      }
      
      const result = await response.json();
      if (result.status === 'error') {
        console.warn(`Error from onboarding audits script: ${result.message}`);
        setOnboardingAudits(prev => ({ ...prev, isLoading: false, data: [] }));
        return;
      }

      // Filter out the first two rows if they are headers
      const rawData = result.data || [];
      const filteredData = rawData.filter((item: any) => {
        const accNum = String(item.accountNumber || '').toLowerCase();
        const agent = String(item.agentName || item.collectorName || '').toLowerCase();
        // Skip if it looks like a header row
        if (accNum.includes('account') && accNum.includes('number')) return false;
        if (agent.includes('collector') || agent.includes('agent')) return false;
        if (!accNum && !agent) return false; // Skip empty rows
        return true;
      });

      setOnboardingAudits({
        data: filteredData,
        isLoading: false,
        lastFetched: Date.now(),
        error: null,
      });
    } catch (error) {
      console.warn('Warning: Could not fetch onboarding audits.', error);
      setOnboardingAudits(prev => ({ ...prev, isLoading: false, error: (error as Error).message }));
    }
  }, [onboardingAudits.lastFetched]);

  const fetchAccountClosureAudit = useCallback(async (force = false) => {
    if (!force && accountClosureAudit.lastFetched && Date.now() - accountClosureAudit.lastFetched < 300000) {
      return;
    }

    setAccountClosureAudit(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const SCRIPT_URL = import.meta.env.VITE_ACCOUNT_CLOSURE_AUDIT_URL || ACCOUNT_CLOSURE_AUDIT_SCRIPT_URL;
      
      const response = await fetch(`${SCRIPT_URL}?action=getAccountClosureAudit`);
      if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
      
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: The connection may be blocked or URL is incorrect.`);
      }
      if (result.status === 'error') throw new Error(result.message);

      // Filter out header rows
      const rawData = result.data || [];
      const filteredData = rawData.filter((item: any) => {
        const accNum = String(item.accountNumber || '').toLowerCase();
        const agent = String(item.collectorName || item.agentName || '').toLowerCase();
        // Skip if it looks like a header row
        if (accNum.includes('account') && accNum.includes('number')) return false;
        if (agent.includes('collector') || agent.includes('agent')) return false;
        if (!accNum && !agent) return false; // Skip empty rows
        return true;
      });

      setAccountClosureAudit({
        data: filteredData,
        isLoading: false,
        lastFetched: Date.now(),
        error: null,
      });
    } catch (error) {
      const errMsg = (error as Error).message || 'Failed to sync data';
      if (errMsg === 'Failed to fetch') {
         console.warn('Account Closure Audit: Connection Blocked. Please check Google Script deployment permissions.');
      } else if (!errMsg.includes('Invalid JSON response')) {
         console.error('Error fetching account closure audit:', error);
      }
      setAccountClosureAudit(prev => ({ ...prev, isLoading: false, error: errMsg }));
    }
  }, [accountClosureAudit.lastFetched]);

  const fetchRpcAudits = useCallback(async (force = false) => {
    if (!force && rpcAudits.lastFetched && Date.now() - rpcAudits.lastFetched < 300000) {
      return;
    }

    setRpcAudits(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const SCRIPT_URL = import.meta.env.VITE_RPC_AUDIT_SCRIPT_URL || RPC_AUDIT_SCRIPT_URL;
      
      if (!SCRIPT_URL) {
        throw new Error('RPC Audit URL not provided');
      }

      const response = await fetch(`${SCRIPT_URL}?action=getRpcAudits`);
      if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
      
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: The connection may be blocked or URL is incorrect.`);
      }
      if (result.status === 'error') throw new Error(result.message);

      const rawData = result.data || [];
      const filteredData = rawData.filter((item: any) => {
        const accNum = String(item.accountNumber || '').toLowerCase();
        const agent = String(item.collectorName || item.agentName || '').toLowerCase();
        if (accNum.includes('account') && accNum.includes('number')) return false;
        if (agent.includes('collector') || agent.includes('agent')) return false;
        if (!accNum && !agent) return false;
        return true;
      });

      setRpcAudits({
        data: filteredData,
        isLoading: false,
        lastFetched: Date.now(),
        error: null,
      });
    } catch (error) {
      let errMsg = 'Failed to fetch RPC audits';
      if (error instanceof Error) {
        errMsg = error.message;
      }
      if (errMsg.includes('Unexpected token')) {
         errMsg = 'Authentication error. The Google Apps Script needs to be set to execute as "Me" and access "Anyone".';
      } else if (!errMsg.includes('Invalid JSON response')) {
         console.error('Error fetching RPC audits:', error);
      }
      setRpcAudits(prev => ({ ...prev, isLoading: false, error: errMsg }));
    }
  }, [rpcAudits.lastFetched]);

  const fetchDeclineRecovery = useCallback(async (force = false) => {
    if (!force && declineRecovery.lastFetched && Date.now() - declineRecovery.lastFetched < 300000) {
      return;
    }

    setDeclineRecovery(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const SCRIPT_URL = import.meta.env.VITE_DECLINE_RECOVERY_SCRIPT_URL || DECLINE_RECOVERY_SCRIPT_URL;
      
      const response = await fetch(SCRIPT_URL);
      if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
      
      const result = await response.json();
      if (result.status === 'error') throw new Error(result.message);

      setDeclineRecovery({
        data: result.data || null,
        isLoading: false,
        lastFetched: Date.now(),
        error: null,
      });
    } catch (error) {
      console.error('Error fetching decline recovery data:', error);
      setDeclineRecovery(prev => ({ ...prev, isLoading: false, error: (error as Error).message }));
    }
  }, [declineRecovery.lastFetched]);

  const fetchBillingAudit = useCallback(async (force = false) => {
    if (!force && billingAudit.lastFetched && Date.now() - billingAudit.lastFetched < 300000) {
      return;
    }

    setBillingAudit(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await sheetService.getBillingAuditData();
      setBillingAudit({
        data: result.data || [],
        isLoading: false,
        lastFetched: Date.now(),
        error: null,
      });
    } catch (error) {
      console.error('Error fetching billing audit data:', error);
      setBillingAudit(prev => ({ ...prev, isLoading: false, error: (error as Error).message }));
    }
  }, [billingAudit.lastFetched]);

  const fetchAccountMonitoringAudit = useCallback(async (force = false) => {
    if (!force && accountMonitoringAudit.lastFetched && Date.now() - accountMonitoringAudit.lastFetched < 300000) {
      return;
    }
    
    setAccountMonitoringAudit(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const scriptUrl = ACCOUNT_MONITORING_AUDIT_SCRIPT_URL;
      
      if (!scriptUrl) {
         throw new Error("ACCOUNT_MONITORING_AUDIT_SCRIPT_URL is not configured.");
      }

      const response = await fetch(`${scriptUrl}?action=getAuditLogs`);
      if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.status === 'success' && Array.isArray(result.data)) {
         const mappedData = result.data
           .filter((row: any[]) => {
             if (!row || row.length < 5) return false;
             const accountNum = String(row[1] || '').trim().toLowerCase();
             if (accountNum === '' || accountNum.includes('account number') || accountNum === 'account') return false;
             return true;
           })
           .map((row: any[], index: number) => {
             const rawScore = String(row[16] || 0).replace(/[^0-9]/g, '');
             const parsedScore = parseInt(rawScore, 10);
               
             const formatDate = (dateValue: any) => {
               if (!dateValue) return 'Unknown';
               try {
                 const date = new Date(dateValue);
                 if (isNaN(date.getTime())) return String(dateValue);
                 return date.toLocaleDateString('en-US', {
                   year: 'numeric', month: 'short', day: 'numeric'
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
           
         setAccountMonitoringAudit({
           data: mappedData,
           isLoading: false,
           lastFetched: Date.now(),
           error: null
         });
      } else {
         throw new Error(result.message || "Failed to fetch data");
      }
    } catch (error) {
      console.error('Error fetching account monitoring audit data:', error);
      setAccountMonitoringAudit(prev => ({ ...prev, isLoading: false, error: (error as Error).message }));
    }
  }, [accountMonitoringAudit.lastFetched]);

  const [lastScoredCollector, setLastScoredCollector] = useState<string | null>(null);

  const fetchAuditScoring = useCallback(async (collectorName: string, force = false) => {
    const isSameCollector = lastScoredCollector === collectorName;
    if (!force && isSameCollector && auditScoring.lastFetched && Date.now() - auditScoring.lastFetched < 300000) {
      return;
    }

    setAuditScoring(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await sheetService.getAuditScoringData(collectorName);
      if (result && result.status === 'success') {
        setAuditScoring({
          data: result.data,
          isLoading: false,
          lastFetched: Date.now(),
          error: null,
        });
        setLastScoredCollector(collectorName);
      } else {
        throw new Error(result?.message || 'Failed to fetch audit scores');
      }
    } catch (error) {
      console.error('Error fetching audit scoring data:', error);
      setAuditScoring(prev => ({ ...prev, isLoading: false, error: (error as Error).message }));
    }
  }, [auditScoring.lastFetched, lastScoredCollector]);

  const fetchCollectorHome = useCallback(async (collectorName: string, force = false) => {
    if (!force && collectorHome.lastFetched && Date.now() - collectorHome.lastFetched < 300000) {
      return;
    }

    setCollectorHome(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await sheetService.getCollectorHomeData(collectorName);
      setCollectorHome({
        data: result.data,
        isLoading: false,
        lastFetched: Date.now(),
        error: null,
      });
    } catch (error) {
      console.error('Error fetching collector home data:', error);
      setCollectorHome(prev => ({ ...prev, isLoading: false, error: (error as Error).message }));
    }
  }, [collectorHome.lastFetched]);

  const fetchNewAssignedAccounts = useCallback(async (force = false) => {
    if (!force && newAssignedAccounts.lastFetched && Date.now() - newAssignedAccounts.lastFetched < 300000) return;
    setNewAssignedAccounts(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await sheetService.getNewAssignedAccounts();
      setNewAssignedAccounts({
        data: result.data,
        isLoading: false,
        lastFetched: Date.now(),
        error: null
      });
    } catch (error) {
      console.error('Error fetching new assigned accounts:', error);
      setNewAssignedAccounts(prev => ({ ...prev, isLoading: false, error: (error as Error).message }));
    }
  }, [newAssignedAccounts.lastFetched]);

  const fetchKpi = useCallback(async (force = false) => {
    if (!force && kpi.lastFetched && Date.now() - kpi.lastFetched < 300000) return;
    
    const scriptUrl = KPI_SCRIPT_URL;
    if (!scriptUrl) return;

    setKpi(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch(scriptUrl);
      if (!response.ok) throw new Error('Failed to fetch KPI data');
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setKpi({
        data: Array.isArray(data) ? data : [],
        isLoading: false,
        lastFetched: Date.now(),
        error: null
      });
    } catch (error) {
      console.error('Error fetching KPI data:', error);
      setKpi(prev => ({ ...prev, isLoading: false, error: (error as Error).message }));
    }
  }, [kpi.lastFetched]);

  const fetchCollectorInventory = useCallback(async (collectorName: string, force = false) => {
    if (!force && collectorInventory.lastFetched && Date.now() - collectorInventory.lastFetched < 300000) return;
    setCollectorInventory(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await sheetService.getCollectorInventoryData(collectorName);
      setCollectorInventory({
        data: result.data,
        isLoading: false,
        lastFetched: Date.now(),
        error: null
      });
    } catch (error) {
      console.error('Error fetching collector inventory:', error);
      setCollectorInventory(prev => ({ ...prev, isLoading: false, error: (error as Error).message }));
    }
  }, [collectorInventory.lastFetched]);

  const updateRPCLogsLocal = useCallback((logs: RPCLog[]) => {
    setRpcLogs(prev => ({
      ...prev,
      data: logs,
      lastFetched: Date.now() // Update timestamp to prevent immediate re-fetch
    }));
  }, []);

  const updateProjectionLocal = useCallback((data: AgentProjection[]) => {
    setProjection(prev => ({
      ...prev,
      data,
      lastFetched: Date.now()
    }));
  }, []);

  const updateRemindersLocal = useCallback((reminders: Reminder[]) => {
    setReminders(prev => ({
      ...prev,
      data: reminders,
      lastFetched: Date.now()
    }));
  }, []);

  return (
    <DataContext.Provider value={{ 
      postdates, 
      rpcLogs, 
      reminders,
      executive,
      home,
      collectors,
      mirror,
      callPerformance,
      flaggedAccounts,
      imports,
      overduePayments,
      inventory,
      projection,
      individualCollectors,
      onboardingAudits,
      accountClosureAudit,
      rpcAudits,
      declineRecovery,
      billingAudit,
      accountMonitoringAudit,
      auditScoring,
      collectorHome,
      newAssignedAccounts,
      collectorInventory,
      kpi,
      fetchKpi,
      fetchPostdates, 
      fetchRPCLogs,
      fetchReminders,
      fetchExecutive,
      fetchHome,
      fetchCollectors,
      fetchMirror,
      fetchCallPerformance,
      fetchFlaggedAccounts,
      fetchImports,
      fetchOverduePayments,
      fetchInventory,
      fetchProjection,
      fetchIndividualCollectors,
      fetchOnboardingAudits,
      fetchAccountClosureAudit,
      fetchRpcAudits,
      fetchDeclineRecovery,
      fetchBillingAudit,
      fetchAccountMonitoringAudit,
      fetchAuditScoring,
      fetchCollectorHome,
      fetchNewAssignedAccounts,
      fetchCollectorInventory,
      updateProjectionLocal,
      updateRPCLogsLocal,
      updateRemindersLocal
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
