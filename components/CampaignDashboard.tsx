import React, { useState } from 'react';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  LayoutGrid,
  ArrowLeft,
  FileText,
  ChevronRight,
  Megaphone,
  Bell,
  Send
} from 'lucide-react';
import InitialCampaignView from './InitialCampaignView';
import SmsCampaignView from './SmsCampaignView';

interface CampaignDashboardProps {
  onBack?: () => void;
  initialView?: CampaignView;
}

type CampaignView = 'menu' | 'initial' | 'sms';

const CampaignDashboard: React.FC<CampaignDashboardProps> = ({ onBack, initialView = 'menu' }) => {
  const [view, setView] = useState<CampaignView>(initialView);

  // Update view when initialView changes
  React.useEffect(() => {
    setView(initialView);
  }, [initialView]);


  const campaigns = [
    {
      id: 'initial',
      title: 'Initial Campaign',
      subtitle: 'Notice of Proceedings & LOR',
      icon: FileText,
      color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
      borderColor: 'border-indigo-100 dark:border-indigo-800',
      iconBg: 'bg-indigo-100 dark:bg-indigo-800/50'
    },
    {
      id: 'sms',
      title: 'Follow-up SMS',
      subtitle: 'Automated Text Outreach',
      icon: MessageSquare,
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
      borderColor: 'border-emerald-100 dark:border-emerald-800',
      iconBg: 'bg-emerald-100 dark:bg-emerald-800/50'
    }
  ];

  if (view === 'initial') {
    return (
      <InitialCampaignView 
        onBack={() => setView('menu')} 
      />
    );
  }

  if (view === 'sms') {
    return (
      <SmsCampaignView 
        onBack={() => setView('menu')} 
      />
    );
  }

  return (
    <div className="p-8 space-y-8 bg-app h-screen animate-in fade-in duration-500 font-sans overflow-hidden flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack} 
              className="p-2.5 rounded-2xl bg-card border border-border-subtle text-text-muted hover:text-indigo-600 shadow-sm transition-all group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-0.5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-black text-text-main uppercase tracking-tight">Campaign Center</h1>
            <p className="text-text-muted font-bold text-[11px] tracking-[0.2em] mt-1 uppercase">Select a campaign type to manage</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
          <Megaphone size={16} className="text-indigo-600 dark:text-indigo-400" />
          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">2 Active Channels</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.map((campaign) => (
          <button
            key={campaign.id}
            onClick={() => setView(campaign.id as CampaignView)}
            className={`group relative bg-card border ${campaign.borderColor} rounded-[2rem] p-8 text-left transition-all hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] overflow-hidden`}
          >
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${campaign.color} opacity-10 rounded-bl-[4rem] transition-transform group-hover:scale-110`} />
            
            <div className="relative z-10">
              <div className={`w-14 h-14 rounded-2xl ${campaign.iconBg} ${campaign.color.split(' ')[1]} flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                <campaign.icon size={28} />
              </div>
              
              <h3 className="text-xl font-black text-text-main uppercase tracking-tight mb-1">{campaign.title}</h3>
              <p className="text-indigo-600 dark:text-indigo-400 font-bold text-[11px] uppercase tracking-widest mb-8">{campaign.subtitle}</p>
              
              <div className="flex items-center gap-2 text-text-main font-black text-[10px] uppercase tracking-[0.2em] group-hover:gap-3 transition-all">
                Enter Dashboard <ChevronRight size={14} className="text-indigo-600" />
              </div>
            </div>
          </button>
        ))}

        {/* Placeholder for future campaigns */}
        <div className="bg-surface-100/50 dark:bg-white/5 border-2 border-dashed border-border-subtle rounded-[2rem] p-8 flex flex-col items-center justify-center text-center opacity-60">
          <div className="w-12 h-12 rounded-full bg-surface-200 dark:bg-white/10 text-text-muted flex items-center justify-center mb-4">
            <LayoutGrid size={24} />
          </div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Future Campaigns</p>
          <p className="text-[11px] text-text-muted mt-2 font-medium">Email, Voice, and Social integrations coming soon</p>
        </div>
      </div>

    </div>
  );
};

export default CampaignDashboard;
