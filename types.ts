// Types for the application
export interface Collector {
  id: string;
  name: string;
  status: 'online' | 'offline';
  rank: number;
  [key: string]: any;
}

export type TabType = 'home' | 'revenue' | 'executive' | 'kpi' | 'postdates' | 'projection' | 'mirror' | 'rpc-logs' | 'collector-overview' | 'individual' | 'audits' | 'individual-audits' | 'inventory' | 'campaign' | 'settings' | 'collections-history' | 'new-imports' | 'new-assigned' | 'call-performance' | 'reports' | 'overdue-payments' | 'collector-breakdown' | 'metric-breakdown' | 'collector-inventory' | 'recovery' | 'unactivated-accounts';

export interface AppPermissions {
  // Page Views
  viewRevenue: boolean;
  viewExecutive: boolean;
  viewKPI: boolean;
  viewPostdates: boolean;
  viewProjection: boolean;
  viewMirror: boolean;
  viewRPCLogs: boolean;
  viewCollectorDashboard: boolean; // Overview
  viewCollectorHome: boolean;
  viewAuditDashboard: boolean;
  viewInventory: boolean;
  viewCollectorInventory: boolean;
  viewCampaign: boolean;
  viewSettings: boolean;
  viewOverduePayments: boolean;
  viewBillingAudit: boolean;
  viewRecovery: boolean;
  
  // Settings Tabs (Sub-permissions)
  manageUsers: boolean;
  managePermissions: boolean;
  
  // Actions
  manageRPCLogs: boolean;
  manageClients: boolean;
  manageDocuments: boolean; // download/upload
  sendReport: boolean;
  addTasks: boolean;
  addProjects: boolean;

  // Specific Access
  allowedCollectorIds: string[]; // Array of collector IDs this user can view
}

export interface AppUser {
  email: string;
  name: string;
  username?: string;
  password?: string;
  role: 'Developer' | 'Administrator' | 'Manager' | 'CEO' | 'Collector' | 'Viewer';
  lastLogin: string;
  permissions: AppPermissions;
}

export interface ExecutiveData {
  coreKpis: {
    agency: string;
    client: string;
    priorDate: { collected: number | string; target: number | string };
    wtd: { collected: number | string; target: number | string };
    mtd: { collected: number | string; target: number | string };
  };
  clientPerformance: Array<{
    clientName: string;
    priorDateCollected: number | string;
    wtdCollected: number | string;
    mtdCollected: number | string;
    mtdTarget: number | string;
    percentReached: string;
  }>;
  weeklyTrends: {
    current: Array<{ day: string; value: number | string }>;
    prior: Array<{ day: string; value: number | string }>;
  };
  monthlyCycle: Array<{ date: string; amount: number | string }>;
  yearlyCycle: Array<{ period: string; amount: number | string }>;
  lastUpdated: string;
  version?: string;
}

export interface HomeData {
  checkCollections: Array<{
    date: string;
    accountNumber: string;
    collector: string;
    clientName: string;
    amount: number;
  }>;
  dailyMetrics: {
    successRate: number;
    declinedRate: number;
    processedPostdates: number;
    processedCount: number;
    newImports?: number;
    flaggedAccounts?: number;
    avgCallTime?: string;
    conversion?: number;
    overdueAmount?: number;
    overdueCount?: number;
  };
  yesterdayHeroes: Array<{
    name: string;
    amount: number;
    avatar: string;
  }>;
  collectionHighlights: Array<{
    label: string;
    value: number;
    color: string;
    amount: number;
  }>;
  topCollectors?: Array<{
    rank: number;
    name: string;
    accounts: number;
    worked: number;
    rpc: number;
    collected: number;
    initial: string;
    color: string;
  }>;
  lastUpdated: string;
  version?: string;
}

export interface DeclineRecoverySummary {
  declinedPostdates: { amount: number; count: number };
  recovered: { amount: number; count: number };
  unrecoverable: { amount: number; count: number };
  remaining: { amount: number; count: number };
  rescheduled: { amount: number; count: number };
  ongoing: { amount: number; count: number };
  needFollowUp: { amount: number; count: number };
  brokenPromise: { amount: number; count: number };
}

export interface DeclineRecoveryRecord {
  transactionDate: string;
  accountNumber: string;
  collectorName: string;
  amount: number;
  status: string;
  recoveryDate: string;
  auditComments: string;
}

export interface DeclineRecoveryData {
  summary: DeclineRecoverySummary;
  records: DeclineRecoveryRecord[];
}

export interface AccountClosureAudit {
  accountNumber: string;
  collectorName: string;
  claimStatus: string;
  clientName: string;
  accountType: string;
  balance: number;
  age: string;
  auditResult: string;
  auditComments: string;
}

export interface BillingAudit {
  id: number;
  accountNumber: string;
  agentName: string;
  clientName: string;
  status: string;
  agreementAmount: number;
  overdueAmount: number;
  overdueDate: string;
  ppaAction: string;
  comments: string;
}

export interface AuditScore {
  collector: string;
  week1: number;
  week2: number;
  week3: number;
  week4: number;
  overall: number;
}

export interface AuditScoringData {
  accountAudit: AuditScore | null;
  callAudit: AuditScore | null;
}

export interface CollectorHomeData {
  collectorName: string;
  todaySucceeded: number;
  todayDeclined: number;
  streak: number[];
  newAccounts: number;
  accountsWorked: number;
  amountCollected: number;
  outboundCalls: number;
  lastUpdated: string;
}

export interface UnactivatedAccount {
  lastWorkedDate: string;
  caseNumber: string;
  collectorUsername: string;
  businessName: string;
  creditorName: string;
}

export interface UnactivatedAccountsData {
  records: UnactivatedAccount[];
  lastUpdated: string;
}

