import React, { useEffect, useRef } from 'react';
import { useData } from '../DataContext';
import { AppUser } from '../types';

export const DataPreloader: React.FC<{ currentUser: AppUser }> = ({ currentUser }) => {
  const {
    fetchHome,
    fetchPostdates,
    fetchImports,
    fetchFlaggedAccounts,
    fetchCallPerformance,
    fetchOverduePayments,
    fetchOnboardingAudits,
    fetchExecutive,
    fetchInventory,
    fetchProjection,
    fetchIndividualCollectors,
    fetchKpi,
    fetchRPCLogs,
    fetchReminders,
    fetchCollectors,
    fetchMirror,
    fetchAccountClosureAudit,
    fetchDeclineRecovery,
    fetchBillingAudit,
    fetchNewAssignedAccounts
  } = useData();

  const mounted = useRef(false);

  useEffect(() => {
    // Only preload if a user is logged in
    if (!currentUser || mounted.current) return;
    mounted.current = true;

    // Use a staggered approach to avoid maxing out concurrent connections limits
    // on Google Apps Script APIs (~30 concurrent executions per user limit)
    const staggerFetches = async () => {
      // HomeDashboard already triggers Home, Postdates, Imports, Flagged Accounts, 
      // Call Performance, Overdue, and Onboarding Audits immediately on mount.
      // So we wait a short duration to let those complete and write to cache.
      
      // Group 1: Priority Core Data that HomeDashboard does NOT fetch
      Promise.all([
        fetchExecutive(),
        fetchInventory()
      ]).catch(e => console.error(e));

      await new Promise(r => setTimeout(r, 1500));

      // Group 2: Financial & Audit (Non-HomeDashboard ones)
      Promise.all([
        fetchAccountClosureAudit(),
        fetchDeclineRecovery(),
        fetchBillingAudit()
      ]).catch(e => console.error(e));

      await new Promise(r => setTimeout(r, 1500));
      
      // Group 3: Collector Specific Data & Others
      Promise.all([
        fetchProjection(),
        fetchIndividualCollectors(),
        fetchKpi(),
        fetchRPCLogs(),
        fetchReminders()
      ]).catch(e => console.error(e));

      await new Promise(r => setTimeout(r, 1500));

      // Group 4: Final Miscellaneous
      Promise.all([
        fetchCollectors(),
        fetchMirror(),
        fetchNewAssignedAccounts()
      ]).catch(e => console.error(e));

      // We wait until the very end (after defaults have likely finished their first 5m cache) 
      // just to safely trigger any backups, safely skipping via internal cache if they are fresh.
      await new Promise(r => setTimeout(r, 3000));
      Promise.all([
        fetchHome(),
        fetchPostdates(),
        fetchImports(),
        fetchFlaggedAccounts(),
        fetchCallPerformance(),
        fetchOverduePayments(),
        fetchOnboardingAudits()
      ]).catch(e => console.error(e));
    };

    staggerFetches();
  }, [currentUser]);

  return null;
};
