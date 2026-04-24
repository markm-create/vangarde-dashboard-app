/// <reference types="vite/client" />
import { RPC_SCRIPT_URL, REMINDERS_SCRIPT_URL, POSTDATES_SCRIPT_URL, EXECUTIVE_SCRIPT_URL, HOME_SCRIPT_URL, COLLECTOR_SCRIPT_URL, MIRROR_SCRIPT_URL, CALL_PERFORMANCE_SCRIPT_URL, FLAGGED_ACCOUNTS_SCRIPT_URL, NEW_IMPORTS_SCRIPT_URL, OVERDUE_PAYMENTS_SCRIPT_URL, INVENTORY_SCRIPT_URL, COLLECTOR_INVENTORY_SCRIPT_URL, INDIVIDUAL_COLLECTOR_SCRIPT_URL, ACCOUNT_CLOSURE_AUDIT_SCRIPT_URL, BILLING_AUDIT_SCRIPT_URL, AUDIT_SCORING_SCRIPT_URL, COLLECTOR_HOME_SCRIPT_URL, NEW_ASSIGNED_ACCOUNTS_SCRIPT_URL } from '../constants';

export const sheetService = {
  async getCollectorInventoryData(collectorName: string) {
    try {
      if (!COLLECTOR_INVENTORY_SCRIPT_URL || COLLECTOR_INVENTORY_SCRIPT_URL.includes('_X_')) return { data: [], lastUpdated: null };
      
      const url = new URL(COLLECTOR_INVENTORY_SCRIPT_URL);
      url.searchParams.set('action', 'getCollectorInventory');
      url.searchParams.set('collectorName', collectorName);
      url.searchParams.set('t', Date.now().toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store'
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch collector inventory data`);
      const result = await response.json();
      
      if (result.status === 'success' && Array.isArray(result.data)) {
        return { data: result.data, lastUpdated: Date.now() };
      }
      return { data: [], lastUpdated: null };
    } catch (error) {
      console.error('Error fetching collector inventory data:', error);
      return { data: [], lastUpdated: null };
    }
  },

  async getNewAssignedAccounts() {
    try {
      if (!NEW_ASSIGNED_ACCOUNTS_SCRIPT_URL) return { data: [], lastUpdated: null };
      
      const url = new URL(NEW_ASSIGNED_ACCOUNTS_SCRIPT_URL);
      url.searchParams.set('action', 'getNewAssignedAccounts');
      url.searchParams.set('t', Date.now().toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store'
      });
      
      if (!response.ok) throw new Error(`Sync Error: ${response.status}`);
      const result = await response.json();
      
      if (result.status === 'success') {
        return { data: result.data, lastUpdated: Date.now() };
      }
      return { data: [], lastUpdated: null };
    } catch (error) {
      console.error('Error fetching new assigned accounts:', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message === 'Failed to fetch' 
        ? 'Connection Blocked. Please check if the Google Script is deployed to "Anyone".' 
        : message);
    }
  },

  async getCollectorHomeData(collectorName: string) {
    try {
      if (!COLLECTOR_HOME_SCRIPT_URL) return { data: null, lastUpdated: null };
      
      const url = new URL(COLLECTOR_HOME_SCRIPT_URL);
      url.searchParams.set('action', 'getCollectorHomeData');
      url.searchParams.set('collectorName', collectorName);
      url.searchParams.set('t', Date.now().toString());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store'
      });
      
      if (!response.ok) throw new Error(`Sync Error: ${response.status}`);
      const result = await response.json();
      
      if (result.status === 'success') {
        return { data: result.data, lastUpdated: Date.now() };
      }
      return { data: null, lastUpdated: null };
    } catch (error) {
      console.error('Error fetching collector home data:', error);
      return { data: null, lastUpdated: null };
    }
  },

  async getAccountClosureAuditData() {
    try {
      if (!ACCOUNT_CLOSURE_AUDIT_SCRIPT_URL) return { data: [], lastUpdated: null };
      
      const urlWithParams = `${ACCOUNT_CLOSURE_AUDIT_SCRIPT_URL}${ACCOUNT_CLOSURE_AUDIT_SCRIPT_URL.includes('?') ? '&' : '?'}action=getAccountClosureAudit&t=${Date.now()}`;
      const response = await fetch(urlWithParams, {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store'
      });
      
      if (!response.ok) throw new Error(`Sync Error: ${response.status}`);
      
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response. The connection may be blocked or the URL may be incorrect.`);
      }
      
      return result.status === 'success' ? { data: result.data, lastUpdated: Date.now() } : { data: [], lastUpdated: null };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg === 'Failed to fetch') {
         console.warn('Account Closure Audit: Connection Blocked. Make sure it is deployed to "Anyone".');
      } else if (!msg.includes('Invalid JSON')) {
         console.error('Error fetching account closure audit:', error);
      }
      return { data: [], lastUpdated: null };
    }
  },

  async getFlaggedAccountsData() {
    try {
      if (!FLAGGED_ACCOUNTS_SCRIPT_URL || FLAGGED_ACCOUNTS_SCRIPT_URL.includes('_X_')) return { data: [], lastUpdated: null };
      
      const url = new URL(FLAGGED_ACCOUNTS_SCRIPT_URL);
      url.searchParams.set('t', Date.now().toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store'
      });
      
      if (!response.ok) throw new Error(`Sync Error: ${response.status}`);
      const result = await response.json();
      
      // Handle both {status: 'success', data: [...]} and raw {data: [...]} formats
      const actualData = result.data || (Array.isArray(result) ? result : []);
      
      return { 
        data: actualData, 
        lastUpdated: new Date().toISOString() 
      };
    } catch (error) {
      console.error('Error fetching flagged accounts:', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message === 'Failed to fetch' 
        ? 'Connection Blocked. Please check if the Google Script is deployed to "Anyone".' 
        : message);
    }
  },

  async getCallPerformanceData() {
    try {
      if (!CALL_PERFORMANCE_SCRIPT_URL || CALL_PERFORMANCE_SCRIPT_URL.includes('_X_')) return { data: [], lastUpdated: null };
      
      const url = new URL(CALL_PERFORMANCE_SCRIPT_URL);
      url.searchParams.set('t', Date.now().toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store'
      });
      
      if (!response.ok) throw new Error(`Sync Error: ${response.status}`);
      const result = await response.json();
      
      // Handle both {status: 'success', data: [...]} and raw {data: [...]} formats
      const actualData = result.data || (Array.isArray(result) ? result : []);
      
      return { 
        data: actualData, 
        lastUpdated: new Date().toISOString() 
      };
    } catch (error) {
      console.error('Error fetching call performance:', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message === 'Failed to fetch' 
        ? 'Connection Blocked. Please check if the Google Script is deployed to "Anyone".' 
        : message);
    }
  },

  async getMirrorData() {
    try {
      if (!MIRROR_SCRIPT_URL) return { data: [], lastUpdated: null };
      
      // Use a clean URL with timestamp to bypass any browser caching
      const timestamp = Date.now();
      const url = new URL(MIRROR_SCRIPT_URL);
      url.searchParams.set('t', timestamp.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'omit',
        // Removing explicit mode: 'cors' to let the browser handle defaults
        // which is often more reliable for Google Script redirects
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Handle both {status: 'success', data: [...]} and raw {data: [...]} formats
      const actualData = result.data || (Array.isArray(result) ? result : []);
      
      return { 
        data: actualData, 
        lastUpdated: new Date().toISOString() 
      };
    } catch (error) {
      console.error('Mirror Sync Error:', error);
      // Provide a more descriptive error for the UI
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message === 'Failed to fetch' 
        ? 'Connection Blocked. Please check if the Google Script is deployed to "Anyone".' 
        : message);
    }
  },

  async getIndividualCollectorsData() {
    try {
      if (!INDIVIDUAL_COLLECTOR_SCRIPT_URL) return { data: [], lastUpdated: null };
      
      const url = new URL(INDIVIDUAL_COLLECTOR_SCRIPT_URL);
      url.searchParams.set('t', Date.now().toString());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store'
      });
      
      if (!response.ok) throw new Error(`Sync Error: ${response.status}`);
      const result = await response.json();
      
      const actualData = Array.isArray(result) ? result : (result.data || []);
      
      return { 
        data: actualData, 
        lastUpdated: result.lastUpdated || new Date().toISOString() 
      };
    } catch (error) {
      console.warn('Warning: Could not fetch individual collectors data. Using fallback.', error);
      return { data: [], lastUpdated: null };
    }
  },

  async getCollectorPerformanceData() {
    try {
      if (!COLLECTOR_SCRIPT_URL) return { data: [], lastUpdated: null };
      
      const url = new URL(COLLECTOR_SCRIPT_URL);
      url.searchParams.set('t', Date.now().toString());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store'
      });
      
      if (!response.ok) throw new Error(`Sync Error: ${response.status}`);
      const result = await response.json();
      
      // Handle both {data: [...]} and raw array formats
      const actualData = Array.isArray(result) ? result : (result.data || []);
      
      return { 
        data: actualData, 
        lastUpdated: new Date().toISOString() 
      };
    } catch (error) {
      console.error('Error fetching collector performance:', error);
      throw error;
    }
  },

  async getRPCLogs() {
    try {
      const response = await fetch(RPC_SCRIPT_URL, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getRPCLogs' })
      });
      const result = await response.json();
      if (result.status === 'success') {
        return result.data;
      }
      throw new Error(result.message || 'Failed to fetch logs');
    } catch (error) {
      console.error('Error fetching RPC logs:', error);
      return [];
    }
  },

  async createRPCLog(payload: any) {
    try {
      const response = await fetch(RPC_SCRIPT_URL, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'createRPCLog', payload }),
      });
      const result = await response.json();
      return result.status === 'success';
    } catch (error) {
      console.error('Error creating RPC log:', error);
      return false;
    }
  },

  async updateRPCLog(payload: any) {
    try {
      const response = await fetch(RPC_SCRIPT_URL, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'updateRPCLog', payload }),
      });
      const result = await response.json();
      return result.status === 'success';
    } catch (error) {
      console.error('Error updating RPC log:', error);
      return false;
    }
  },

  async deleteRPCLog(id: string) {
    try {
      const response = await fetch(RPC_SCRIPT_URL, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteRPCLog', payload: { id } }),
      });
      const result = await response.json();
      return result.status === 'success';
    } catch (error) {
      console.error('Error deleting RPC log:', error);
      return false;
    }
  },

  async getReminders() {
    try {
      if (!REMINDERS_SCRIPT_URL) return [];
      const response = await fetch(REMINDERS_SCRIPT_URL, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getReminders' })
      });
      const result = await response.json();
      if (result.status === 'success') {
        return result.data;
      }
      throw new Error(result.message || 'Failed to fetch reminders');
    } catch (error) {
      console.error('Error fetching reminders:', error);
      return [];
    }
  },

  async createReminder(payload: any) {
    try {
      if (!REMINDERS_SCRIPT_URL) return false;
      const response = await fetch(REMINDERS_SCRIPT_URL, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'createReminder', payload }),
      });
      const result = await response.json();
      return result.status === 'success';
    } catch (error) {
      console.error('Error creating reminder:', error);
      return false;
    }
  },

  async updateReminder(payload: any) {
    try {
      if (!REMINDERS_SCRIPT_URL) return false;
      
      let response = await fetch(REMINDERS_SCRIPT_URL, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'updateReminder', payload }),
      });
      let result = await response.json();
      
      // Workaround for Google Sheets type coercion (string to number)
      if (result.status === 'error') {
        if (typeof payload.id === 'string' && !isNaN(Number(payload.id))) {
          response = await fetch(REMINDERS_SCRIPT_URL, {
            method: 'POST',
        credentials: 'omit',
        redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'updateReminder', payload: { ...payload, id: Number(payload.id) } }),
          });
          result = await response.json();
        } else if (typeof payload.id === 'number') {
          response = await fetch(REMINDERS_SCRIPT_URL, {
            method: 'POST',
        credentials: 'omit',
        redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'updateReminder', payload: { ...payload, id: String(payload.id) } }),
          });
          result = await response.json();
        }
      }
      
      return result.status === 'success';
    } catch (error) {
      console.error('Error updating reminder:', error);
      return false;
    }
  },

  async deleteReminder(id: string) {
    try {
      if (!REMINDERS_SCRIPT_URL) return false;
      
      let response = await fetch(REMINDERS_SCRIPT_URL, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteReminder', payload: { id } }),
      });
      let result = await response.json();
      
      // Workaround for Google Sheets type coercion (string to number)
      if (result.status === 'error') {
        if (typeof id === 'string' && !isNaN(Number(id))) {
          response = await fetch(REMINDERS_SCRIPT_URL, {
            method: 'POST',
        credentials: 'omit',
        redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'deleteReminder', payload: { id: Number(id) } }),
          });
          result = await response.json();
        } else if (typeof id === 'number') {
          response = await fetch(REMINDERS_SCRIPT_URL, {
            method: 'POST',
        credentials: 'omit',
        redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'deleteReminder', payload: { id: String(id) } }),
          });
          result = await response.json();
        }
      }
      
      return result.status === 'success';
    } catch (error) {
      console.error('Error deleting reminder:', error);
      return false;
    }
  },

  async getPostdatesData() {
    try {
      console.log('Fetching postdates from:', POSTDATES_SCRIPT_URL);
      const response = await fetch(POSTDATES_SCRIPT_URL, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getPostdatesData' })
      });
      const result = await response.json();
      console.log('Postdates response:', result);
      if (result.status === 'success') {
        return result.data;
      }
      throw new Error(result.message || 'Failed to fetch postdates data');
    } catch (error) {
      console.error('Error fetching postdates data:', error);
      return { scheduled: [], processed: [] };
    }
  },

  async getExecutiveData() {
    try {
      if (!EXECUTIVE_SCRIPT_URL) {
        throw new Error('Executive Script URL is not configured.');
      }

      console.log('Fetching executive data from:', EXECUTIVE_SCRIPT_URL);
      
      const timestamp = Date.now();
      const url = new URL(EXECUTIVE_SCRIPT_URL);
      url.searchParams.set('t', timestamp.toString());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error body');
        console.error('Executive fetch failed:', response.status, errorText);
        throw new Error(`Sync Error: ${response.status} - ${errorText.substring(0, 100)}`);
      }
      
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse executive response as JSON:', text);
        const snippet = text.substring(0, 100).replace(/<[^>]*>?/gm, '');
        throw new Error(`Sync Error: Database returned non-JSON response. (Snippet: ${snippet})`);
      }

      console.log('Executive data received:', result);
      
      if (result && result.error) {
        console.error('Script returned error:', result.error);
        throw new Error(`Database Error: ${result.error}`);
      }
      
      if (!result || typeof result !== 'object') {
        console.error('Invalid data format received:', result);
        throw new Error('Sync Error: Data format mismatch');
      }

      return result;
    } catch (error) {
      console.error('Error in getExecutiveData:', error);
      const message = error instanceof Error ? error.message : String(error);
      
      // Provide a more descriptive error for the UI
      if (message === 'Failed to fetch') {
        throw new Error('Connection Blocked. Please check if the Google Script is deployed to "Anyone" and you are not logged into multiple Google accounts.');
      }
      throw error;
    }
  },

  async getHomeData() {
    try {
      if (!HOME_SCRIPT_URL) {
        throw new Error('Home Script URL is not configured.');
      }

      console.log('Fetching home data from:', HOME_SCRIPT_URL);
      
      const timestamp = Date.now();
      const url = new URL(HOME_SCRIPT_URL);
      url.searchParams.set('action', 'getHomeData');
      url.searchParams.set('t', timestamp.toString());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error body');
        throw new Error(`Sync Error: ${response.status} - ${errorText.substring(0, 100)}`);
      }
      
      const result = await response.json();
      if (result && result.error) throw new Error(result.error);
      
      if (!result || !result.homeData) {
        throw new Error('Sync Error: No home data returned');
      }
      
      return result.homeData;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === 'Failed to fetch') {
        console.warn('Home Dashboard Data: Connection Blocked. Please check if the Google Script is deployed to "Anyone".');
        throw new Error('Connection Blocked. Please check if the Google Script is deployed to "Anyone" and you are not logged into multiple Google accounts.');
      } else {
        console.error('Error in getHomeData:', error);
      }
      throw error;
    }
  },

  async getImportsData() {
    try {
      if (!NEW_IMPORTS_SCRIPT_URL) return [];
      
      const url = new URL(NEW_IMPORTS_SCRIPT_URL);
      url.searchParams.set('action', 'getImports');
      url.searchParams.set('t', Date.now().toString());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store'
      });
      
      if (!response.ok) throw new Error('Failed to fetch import records');
      const result = await response.json();
      
      // Filter out empty rows that might come from the sheet
      const actualData = result.status === 'success' ? result.data : (Array.isArray(result) ? result : []);
      return actualData.filter((item: any) => item.accountNumber || item.clientName || item.businessName);
    } catch (error) {
      console.error('Error fetching imports:', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message === 'Failed to fetch' 
        ? 'Connection Blocked. Please check if the Google Script is deployed to "Anyone".' 
        : message);
    }
  },

  async getOverduePaymentsData() {
    try {
      const response = await fetch(OVERDUE_PAYMENTS_SCRIPT_URL, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getPayments' })
      });
      if (!response.ok) throw new Error('Failed to fetch overdue payments');
      const result = await response.json();
      return result.status === 'success' ? result.data : [];
    } catch (error) {
      console.error('Error fetching overdue payments:', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message === 'Failed to fetch' 
        ? 'Connection Blocked. Please check if the Google Script is deployed to "Anyone".' 
        : message);
    }
  },

  async getInventoryData() {
    try {
      if (!INVENTORY_SCRIPT_URL) return [];
      const url = new URL(INVENTORY_SCRIPT_URL);
      url.searchParams.set('action', 'getInventory');
      url.searchParams.set('t', Date.now().toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store'
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch inventory data`);
      const result = await response.json();
      
      // Handle both wrapped {status: 'success', data: []} and raw [] responses
      if (Array.isArray(result)) return result;
      if (result.status === 'success' && Array.isArray(result.data)) {
        return result.data;
      }
      if (result.data && Array.isArray(result.data)) return result.data;
      
      throw new Error(result.message || 'Failed to load inventory data');
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      const message = error instanceof Error ? error.message : String(error);
      if (message === 'Failed to fetch') {
        throw new Error('Connection Blocked. Please check if the Google Script is deployed to "Anyone".');
      }
      throw error;
    }
  },

  async getInventoryMetricsData() {
    try {
      if (!INVENTORY_SCRIPT_URL) return null;
      const url = new URL(INVENTORY_SCRIPT_URL);
      url.searchParams.set('action', 'getInventoryMetrics');
      url.searchParams.set('t', Date.now().toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store'
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch metrics`);
      const result = await response.json();
      
      if (result.status === 'success' && result.metrics) {
        return result.metrics;
      }
      if (result.metrics) return result.metrics;
      if (result.data && result.data.metrics) return result.data.metrics;
      
      // If the result itself looks like a metrics object (has active, ppa, etc)
      if (result.active || result.ppa || result.goingIn) return result;

      throw new Error(result.message || 'Failed to load metrics');
    } catch (error) {
      console.error('Error fetching inventory metrics:', error);
      const message = error instanceof Error ? error.message : String(error);
      if (message === 'Failed to fetch') {
        throw new Error('Connection Blocked. Please check if the Google Script is deployed to "Anyone".');
      }
      throw error;
    }
  },

  async getBillingAuditData() {
    try {
      if (!BILLING_AUDIT_SCRIPT_URL) return { data: [], lastUpdated: null };
      
      const urlWithParams = `${BILLING_AUDIT_SCRIPT_URL}${BILLING_AUDIT_SCRIPT_URL.includes('?') ? '&' : '?'}t=${Date.now()}`;
      const response = await fetch(urlWithParams, {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store'
      });
      
      if (!response.ok) throw new Error(`Sync Error: ${response.status}`);
      const result = await response.json();
      return result.status === 'success' ? { data: result.data, lastUpdated: Date.now() } : { data: [], lastUpdated: null };
    } catch (error) {
      console.error('Error fetching billing audit:', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message === 'Failed to fetch' 
        ? 'Connection Blocked. Please check if the Google Script is deployed to "Anyone".' 
        : message);
    }
  },

  async getAuditScoringData(collectorName: string) {
    try {
      if (!AUDIT_SCORING_SCRIPT_URL) return null;
      
      const url = new URL(AUDIT_SCORING_SCRIPT_URL);
      url.searchParams.set('action', 'getAuditScores');
      url.searchParams.set('collectorName', collectorName.trim());
      url.searchParams.set('t', Date.now().toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store'
      });
      
      if (!response.ok) throw new Error(`Sync Error: ${response.status}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching audit scoring:', error);
      return null;
    }
  }
};
