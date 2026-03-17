import { Collector, AppPermissions, AppUser } from './types';

const getValidUrl = (envUrl: string | undefined | boolean, fallbackUrl: string): string => {
  if (typeof envUrl === 'string') {
    const trimmed = envUrl.trim();
    if (trimmed.startsWith('http')) {
      return trimmed;
    }
  }
  return fallbackUrl;
};

export const RPC_SCRIPT_URL = getValidUrl(import.meta.env.VITE_RPC_LOGS_SCRIPT_URL, "https://script.google.com/macros/s/AKfycbxdx_fYfnH1C5fXfeJU00ccjoQXLp1W4Wn3SqKJJbHcpgW46V9rl85BA2RPw9LeGfLGQg/exec");
export const REMINDERS_SCRIPT_URL = getValidUrl(import.meta.env.VITE_REMINDERS_SCRIPT_URL, "https://script.google.com/macros/s/AKfycbxdwxYx9SgqSu8_IJceIZO28ohsyo92clegGIL_a-qjFvbHnPhCOeu-AHsotF-1PCaF/exec");
export const POSTDATES_SCRIPT_URL = getValidUrl(import.meta.env.VITE_POSTDATES_SCRIPT_URL, "https://script.google.com/macros/s/AKfycbw1KZjg2vsOzroiYt6wgCg1y93yJK58MUkaZ6Aj8svMWvRNYzS40VKdNQhedsP-62DP/exec");
export const USER_SCRIPT_URL = getValidUrl(import.meta.env.VITE_USER_LOGIN_SCRIPT_URL, "https://script.google.com/macros/s/AKfycbxT86FxniOBtG3kMZvugCSThMApwSnmXeUOtCSNmzfX7G1SLuQ9PjetGUy8IAaHsUP-2w/exec");
export const PROJECTION_SCRIPT_URL = getValidUrl(import.meta.env.VITE_PROJECTION_SCRIPT_URL, "https://script.google.com/macros/s/AKfycbyH8AGvP_vYcVXh_-JTYrfFFUg2-wPqHUf7VlDRKruRmkFPiECM-zkST-RLCejB8djh/exec");
export const DECLINE_RECOVERY_SCRIPT_URL = getValidUrl(import.meta.env.VITE_DECLINE_RECOVERY_SCRIPT_URL, "https://script.google.com/macros/s/AKfycbyqpiFO_lGT41RMQWzXJp1kU5ZOFDjzfB51rbIhe5uqZOigrQlATR4asqwaZ6aIleSYXg/exec");

// Executive Dashboard Script URL (Isolated from other services)
// Forcing the new URL to bypass any stale environment variables
export const EXECUTIVE_SCRIPT_URL = getValidUrl(import.meta.env.VITE_EXECUTIVE_SCRIPT_URL, "https://script.google.com/macros/s/AKfycbyiZuQII5LaQm69YzZ25blOVQU7ki1Pqbl_CkUWTf5j8R9oMReGlNntP0vymAeDRhrQJA/exec");

// Home Dashboard Script URL (Isolated from Executive)
export const HOME_SCRIPT_URL = getValidUrl(import.meta.env.VITE_HOME_SCRIPT_URL, "https://script.google.com/macros/s/AKfycbzItlApZGUH_5sp27xauWfzKfrO0DwmuS_PHCQfmYMRBoUVt2KCXyJefVjseXoei3eW/exec");

// Collector Performance Script URL
export const COLLECTOR_SCRIPT_URL: string = getValidUrl(import.meta.env.VITE_COLLECTOR_SCRIPT_URL, "https://script.google.com/macros/s/AKfycbztWl_oMqMewV2Pa4AHrUcxcI6QwEXLj4-myvoh6cKSXL5o_5Xp6XdPT1yxq-FUAFak8A/exec"); 

// Mirror Dashboard Script URL
export const MIRROR_SCRIPT_URL: string = getValidUrl(import.meta.env.VITE_MIRROR_SCRIPT_URL, "https://script.google.com/macros/s/AKfycbxSgWvPkZ1jwtgyirMdA9BB7FbefIRDrl0qPfctICoYho5xUCVUBVT07k3pjuMMO-YV8w/exec");

// Call Performance Script URL
export const CALL_PERFORMANCE_SCRIPT_URL: string = getValidUrl(import.meta.env.VITE_CALL_PERFORMANCE_SCRIPT_URL, "https://script.google.com/macros/s/AKfycbz4fW8c9mXuOR_n54z3yctPJJeDpOgbxT_k0ZdNzUHuur_U36vVIDJyWElEpR0m5ssNUw/exec");

// New Imports Script URL
export const NEW_IMPORTS_SCRIPT_URL: string = getValidUrl(import.meta.env.VITE_NEW_IMPORTS_SCRIPT_URL, "https://script.google.com/macros/s/AKfycbzSbw-BkOIOjcH0aYfmm9VuQlWs31tawoAOCxRdFSgBrl1ZmAtnOBOGlmu72wU2zJit/exec");

// Overdue Payments Script URL
export const OVERDUE_PAYMENTS_SCRIPT_URL: string = getValidUrl(import.meta.env.VITE_OVERDUE_PAYMENTS_SCRIPT_URL, "https://script.google.com/macros/s/AKfycbwlQQdBpbrjopy3t_V-6_TR5ZUJmkIEis-pSQR9aXY_RH3AKxGRJ_Rs9_7m9jvN2AOodg/exec");

// Flagged Accounts Script URL
export const FLAGGED_ACCOUNTS_SCRIPT_URL: string = getValidUrl(import.meta.env.VITE_FLAGGED_ACCOUNTS_SCRIPT_URL, "https://script.google.com/macros/s/AKfycbwpokhNgAqQYtUbFahqgzaVqkV8v01kefgNR8N-YviIbN58ZGOmA1XLPr42BjLKIUti/exec");

// Individual Collector Dashboard Script URL
export const INDIVIDUAL_COLLECTOR_SCRIPT_URL: string = getValidUrl(import.meta.env.VITE_INDIVIDUAL_COLLECTOR_SCRIPT_URL, "https://script.google.com/macros/s/AKfycbxhqTDXus5QKO93d1rrXVQf7K9S8Y3EFH9wv-UkK-vNgRE2IMGSxeufEk6ftbQSJpYL/exec");

// New Assigned Accounts Script URL
export const NEW_ASSIGNED_ACCOUNTS_SCRIPT_URL: string = getValidUrl(import.meta.env.VITE_NEW_ASSIGNED_ACCOUNTS_SCRIPT_URL, "https://script.google.com/macros/s/AKfycbyEZlZ-SF04ZLWV3Gbl2mL9JH1Ikb9a7X8HqKYYXPlbrxBdmI0EbOGPD-7sPeOsOLU4/exec");

// Collector Home Page Script URL
export const COLLECTOR_HOME_SCRIPT_URL: string = getValidUrl(import.meta.env.VITE_COLLECTOR_HOME_SCRIPT_URL, "https://script.google.com/macros/s/AKfycbxYiHl5bEpVL8D67jFfHI4rcbdIOSamHFtqsR8tZ4AfKyE8ri_HGIM7WZUhKdrzlEfB3w/exec");

// Inventory Script URL
export const INVENTORY_SCRIPT_URL: string = getValidUrl(import.meta.env.VITE_INVENTORY_SCRIPT_URL, "https://script.google.com/macros/s/AKfycbxXhkebI88ismWX4nSGPmF7mDFzLTRsi1URr13sHXxsB3n0qfGetwwro6HGf0xbj5cePQ/exec");

// Onboarding Account Audit Report Script URL
export const ONBOARDING_AUDIT_SCRIPT_URL: string = getValidUrl(import.meta.env.VITE_ONBOARDING_AUDIT_SCRIPT_URL, "https://script.google.com/macros/s/AKfycbzifIxZFboKWxdXaIcabFQ_7WkccWAij9F2LwccNWyQrkqFw_Cs688uf_RisvXVNFwbCw/exec");

// Account Closure Audit Script URL
export const ACCOUNT_CLOSURE_AUDIT_SCRIPT_URL: string = getValidUrl(import.meta.env.VITE_ACCOUNT_CLOSURE_AUDIT_URL, "https://script.google.com/macros/s/AKfycbzle7UUrdcDp5vw1_XUQuYjNQM2GYS_vGhHI2R47KhT-IO9Qy9_BSRrJp7a8Odd4bVLlw/exec");

// Billing Audit Script URL
export const BILLING_AUDIT_SCRIPT_URL: string = getValidUrl(import.meta.env.VITE_BILLING_AUDIT_SCRIPT_URL, "https://script.google.com/macros/s/AKfycbxjOoPRA0WoS45ehHUpJu_HR_ZJsYVGI5Wk85UuAgMkZAWrX4d09rKD_8kQlCskYZ9fVA/exec");

// Audit Scoring Script URL
export const AUDIT_SCORING_SCRIPT_URL: string = getValidUrl(import.meta.env.VITE_AUDIT_SCORING_SCRIPT_URL, "https://script.google.com/macros/s/AKfycbzuCY3PXXVshOhB2aKrPbaTx7khR_8Zha3aPlCuAeRP_2OaQjLgvjMGl0kZwIEpjFqGIg/exec");


export const COLLECTORS: Collector[] = [
  { id: 'c8', name: 'Arianne Sanchez', status: 'online', rank: 10 },
  { id: 'c9', name: 'Charles Phillips', status: 'offline', rank: 11 },
  { id: 'c7', name: 'Chris Reed', status: 'online', rank: 7 },
  { id: 'c14', name: 'Christoper Peterson', status: 'offline', rank: 8 },
  { id: 'c6', name: 'Elizabeth Harris', status: 'offline', rank: 6 },
  { id: 'c5', name: 'Karen Justice', status: 'online', rank: 5 },
  { id: 'c4', name: 'Kim Park', status: 'offline', rank: 4 },
  { id: 'c3', name: 'Mary Smith', status: 'online', rank: 3 },
  { id: 'c2', name: 'Penelope Williams', status: 'offline', rank: 2 },
  { id: 'c15', name: 'Rachel Adler', status: 'online', rank: 12 },
  { id: 'c13', name: 'Samantha Jocelyn', status: 'online', rank: 9 },
  { id: 'c1', name: 'Sophia Smith', status: 'online', rank: 1 }
];

export const DEFAULT_PERMISSIONS: AppPermissions = {
  viewExecutive: false,
  viewPostdates: false,
  viewProjection: false,
  viewMirror: false,
  viewRPCLogs: false,
  viewCollectorDashboard: false,
  viewCollectorHome: false,
  viewAuditDashboard: false,
  viewInventory: false,
  viewCampaign: false,
  viewSettings: false,
  viewOverduePayments: false,
  viewBillingAudit: false,
  manageRPCLogs: false,
  manageClients: false,
  manageUsers: false,
  managePermissions: false,
  manageDocuments: false,
  sendReport: false,
  addTasks: false,
  addProjects: false,
  allowedCollectorIds: []
};

export const CONFIG = {
  STORAGE_KEY: "vg_app_users",
  THEME_KEY: "vg_theme_preference",
  SESSION_KEY: "vg_active_session"
};

/**
 * Returns default permissions based on the user's role.
 */
export const getDefaultPermissionsForRole = (role: AppUser['role'], email: string = ''): AppPermissions => {
  // Special Case: Developer (Mark Mojica)
  if (role === 'Developer' || email.toLowerCase() === 'mark.mojica@vangardegroup.com') {
    return {
      viewExecutive: true,
      viewPostdates: true,
      viewProjection: true,
      viewMirror: true,
      viewRPCLogs: true,
      viewCollectorDashboard: true,
      viewCollectorHome: false,
      viewAuditDashboard: true,
      viewInventory: true,
      viewCampaign: true,
      viewSettings: true,
      viewOverduePayments: true,
      viewBillingAudit: true,
      manageRPCLogs: true,
      manageClients: true,
      manageUsers: true,
      managePermissions: true,
      manageDocuments: true,
      sendReport: true,
      addTasks: true,
      addProjects: true,
      allowedCollectorIds: COLLECTORS.map(c => c.id)
    };
  }

  // Administrator / Management / CEO
  // Open access to the entire dashboard except the Identity & access tab in the settings page
  if (role === 'Administrator' || role === 'Manager' || role === 'CEO') {
    return {
      viewExecutive: true,
      viewPostdates: true,
      viewProjection: true,
      viewMirror: true,
      viewRPCLogs: true,
      viewCollectorDashboard: true,
      viewCollectorHome: false,
      viewAuditDashboard: true,
      viewInventory: true,
      viewCampaign: true,
      viewSettings: true,
      viewOverduePayments: true,
      viewBillingAudit: true,
      manageRPCLogs: true,
      manageClients: true,
      manageUsers: false, 
      managePermissions: false, 
      manageDocuments: true,
      sendReport: true,
      addTasks: true,
      addProjects: true,
      allowedCollectorIds: COLLECTORS.map(c => c.id)
    };
  }

  // Collector
  // Limited access only to home, postdates, collector main, mirror, rpc logs, and general tab in settings page
  if (role === 'Collector') {
    return {
      ...DEFAULT_PERMISSIONS,
      viewPostdates: true,
      viewMirror: true,
      viewRPCLogs: true,
      viewCollectorDashboard: true,
      viewCollectorHome: true,
      viewSettings: true,
      manageRPCLogs: true,
      allowedCollectorIds: [] // Usually restricted to self, but defaults empty for now
    };
  }

  // Default for Viewers or fallback
  return { ...DEFAULT_PERMISSIONS, viewExecutive: true };
};