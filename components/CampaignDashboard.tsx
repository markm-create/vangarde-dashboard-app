import React from 'react';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  LayoutGrid,
  ArrowLeft
} from 'lucide-react';

interface CampaignDashboardProps {
  onBack?: () => void;
}

const CampaignDashboard: React.FC<CampaignDashboardProps> = ({ onBack }) => {
  return (
    <div className="p-8 space-y-8 bg-app h-screen animate-in fade-in duration-500 font-sans overflow-hidden flex flex-col">
      <div className="flex items-center gap-4 shrink-0">
        {onBack && (
          <button 
            onClick={onBack} 
            className="p-2.5 rounded-2xl bg-card border border-border-subtle text-text-muted hover:text-indigo-600 shadow-sm transition-all group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-black text-text-main uppercase tracking-tight">Campaign Dashboard</h1>
          <p className="text-text-muted font-bold text-[11px] tracking-[0.2em] mt-1 uppercase">SMS, Calls, and Emails Hub</p>
        </div>
      </div>

      <div className="flex-1 bg-card rounded-[2rem] border border-border-subtle shadow-sm p-12 flex flex-col items-center justify-center text-center">
        <div className="flex gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
            <MessageSquare size={32} />
          </div>
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
            <Phone size={32} />
          </div>
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
            <Mail size={32} />
          </div>
        </div>
        
        <div className="w-24 h-24 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center mb-6">
          <LayoutGrid size={48} />
        </div>
        
        <h2 className="text-2xl font-black text-text-main uppercase tracking-tight mb-4">Campaign Module Coming Soon</h2>
        <p className="text-text-muted max-w-md mx-auto font-medium">
          We are currently building a powerful campaign management system for SMS, automated calls, and email outreach. 
          This module will allow you to reach your accounts more effectively through multi-channel communication. 
          Check back soon for updates!
        </p>
      </div>
    </div>
  );
};

export default CampaignDashboard;
