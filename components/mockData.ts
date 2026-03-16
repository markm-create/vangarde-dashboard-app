import { COLLECTORS } from '../constants';

export interface BaseAudit {
  id: string;
  accountNumber: string;
  accountUrl?: string;
  agentName: string;
  dateAudited: string;
  auditResult: string;
  auditScore: number;
  auditComments: string;
  auditFindings?: string;
  [key: string]: any;
}

export interface OnboardingAudit extends BaseAudit {
  clientName: string;
  accountStatus: string;
  dateImported: string;
  dateActivated: string;
}

export interface PostdatesAudit extends BaseAudit {
  paymentAmount: number;
  transactionDate: string;
  paymentStatus: 'Recovered' | 'Ongoing Recovery' | 'No Follow-up' | 'Broken Promise' | 'Rescheduled' | 'Cancelled PPA';
  recoveryDate?: string;
}

export interface BillingAudit extends BaseAudit {
  clientName: string;
  accountStatus: string;
  agreementAmount: number;
  overdueAmount: number;
  overdueDate: string;
  ppaAction: 'No Update Needed' | 'Update PPA' | 'Delete PPA' | 'Follow-Up PPA';
}

export interface AeeRtpAudit extends BaseAudit {
  clientName: string;
  accountStatus: 'All Efforts Exhausted' | 'Refusal to Pay';
  balanceDue: number;
  accountAge: number;
  accountType: 'Comm' | 'Non-Comm';
  outcome: 'Keep - Reworkable' | 'Client Return - AEE' | 'Client Return - RTP' | 'Pending Bankruptcy';
}

export interface AccountMonitoringAudit extends BaseAudit {
  accountStatus: string;
  daysSinceLastNote: number;
  nextContactDate: string;
  clientName: string;
  auditorName: string;
}

export interface CallMonitoringAudit extends BaseAudit {
  callDateTime: string;
  callDuration: string;
  debtorPhone: string;
  auditorName: string;
  callType: 'Inbound' | 'Outbound';
  scriptAdherence: string;
}

export interface SevenEightDayAudit extends BaseAudit {
  lastWorkedDate: string;
  daysInactive: number;
  clientName: string;
  status: string;
  debtorName: string;
  balanceDue: number;
  accountAge: number;
}

export interface RpcAudit extends BaseAudit {
  callDate: string;
  phoneNumber: string;
  rpcType: 'Debtor' | '3rd Party' | 'Wrong Number';
  isCompliant: boolean;
  paymentAmount: number;
  caseUpdate: 'Collected' | 'Ghosted' | 'RTP';
}

const CLIENT_LIST = ["Everest Business Funding", "Plumeria Accord Holdings LLC", "RoadSync", "Giggle Finance"];
const DEBTOR_NAMES = ["Acme Corp", "Globex Corporation", "Soylent Corp", "Initech", "Umbrella Corp", "Vehement Capital Partners", "Massive Dynamic", "Hooli", "Pied Piper", "Stark Industries"];

export const generateOnboardingAudits = (count: number): OnboardingAudit[] => {
  return Array.from({ length: count }, (_, i) => {
    const agent = COLLECTORS[i % COLLECTORS.length];
    const seed = i * 997; 
    const r = (Math.sin(seed) + 1) / 2;
    const dayAssigned = 1 + (i % 28);
    const dayAudited = Math.min(dayAssigned + 2, 30);
    
    let result = "Passed";
    if (r > 0.85) result = "Failed";
    else if (r > 0.70) result = "Pending";

    return {
      id: `ONB-${i}`,
      accountNumber: `2025-${8000 + i}`,
      agentName: agent.name,
      clientName: CLIENT_LIST[i % CLIENT_LIST.length],
      accountStatus: "Open",
      dateImported: `Oct ${dayAssigned}, 2024`,
      dateActivated: `Oct ${dayAssigned + 1}, 2024`,
      dateAudited: `Oct ${dayAudited}, 2024`,
      auditResult: result,
      auditComments: result === "Failed" ? "Critical failure in docs." : (result === "Pending" ? "Awaiting further verification." : "Docs verified. Compliant."),
      auditScore: result === "Failed" ? 0 : (result === "Pending" ? 50 : 100)
    };
  });
};

export const generatePostdatesAudits = (count: number): PostdatesAudit[] => {
  const statuses: PostdatesAudit['paymentStatus'][] = ['Recovered', 'Ongoing Recovery', 'No Follow-up', 'Broken Promise', 'Rescheduled', 'Cancelled PPA'];
  return Array.from({ length: count }, (_, i) => {
    const agent = COLLECTORS[i % COLLECTORS.length];
    const r = (Math.sin(i * 541) + 1) / 2;
    const status = statuses[Math.floor(r * statuses.length)];
    const day = 1 + (i % 20);
    const hour = 9 + (i % 8);
    const minute = (i % 12) * 5;
    const timeStr = `${hour}:${minute < 10 ? '0' + minute : minute} ${hour >= 12 ? 'PM' : 'AM'}`;
    return {
      id: `PD-${i}`,
      transactionDate: `Oct ${day}, 2024 ${timeStr}`,
      accountNumber: `2025-${9000 + i}`,
      agentName: agent.name,
      paymentAmount: 150 + Math.floor(r * 500),
      paymentStatus: status,
      recoveryDate: status === 'Recovered' ? `Oct ${day + 2}, 2024` : undefined,
      dateAudited: `Oct ${day + 3}, 2024`,
      auditResult: r > 0.85 ? "Failed" : "Passed",
      auditScore: r > 0.85 ? 0 : 100,
      auditComments: "Action verified.",
      auditFindings: r > 0.85 ? "Missing follow-up note." : "Process followed correctly."
    };
  });
};

export const generateBillingAudits = (count: number): BillingAudit[] => {
  const actions: BillingAudit['ppaAction'][] = ["No Update Needed", "Update PPA", "Delete PPA", "Follow-Up PPA"];
  return Array.from({ length: count }, (_, i) => {
    const agent = COLLECTORS[i % COLLECTORS.length];
    const r = (Math.sin(i * 337) + 1) / 2;
    const day = 1 + (i % 25);
    return {
      id: `BILL-${i}`,
      accountNumber: `2025-${7000 + i}`,
      agentName: agent.name,
      clientName: CLIENT_LIST[i % CLIENT_LIST.length],
      accountStatus: "Active",
      agreementAmount: 500 + Math.floor(r * 2000),
      overdueAmount: r > 0.7 ? 200 + Math.floor(r * 500) : 0,
      overdueDate: `Oct ${day - 2}, 2024`,
      ppaAction: actions[Math.floor(r * actions.length)],
      dateAudited: `Oct ${day}, 2024`,
      auditResult: r > 0.85 ? "Failed" : "Passed",
      auditScore: r > 0.85 ? 50 : 100,
      auditComments: "Billing verified.",
      auditFindings: r > 0.85 ? "PPA amount mismatch." : "Agreement matches PPA terms."
    };
  });
};

export const generateAeeRtpAudits = (count: number): AeeRtpAudit[] => {
  const outcomes: AeeRtpAudit['outcome'][] = ['Keep - Reworkable', 'Client Return - AEE', 'Client Return - RTP', 'Pending Bankruptcy'];
  return Array.from({ length: count }, (_, i) => {
    const agent = COLLECTORS[i % COLLECTORS.length];
    const r = (Math.sin(i * 127) + 1) / 2;
    const outcome = outcomes[Math.floor(r * outcomes.length)];
    return {
      id: `AR-${i}`,
      accountNumber: `2025-${6000 + i}`,
      agentName: agent.name,
      accountStatus: outcome === 'Client Return - RTP' ? 'Refusal to Pay' : 'All Efforts Exhausted',
      clientName: CLIENT_LIST[i % CLIENT_LIST.length],
      accountType: r > 0.5 ? 'Comm' : 'Non-Comm',
      balanceDue: 1000 + Math.floor(r * 9000),
      accountAge: 120 + Math.floor(r * 300),
      outcome: outcome,
      dateAudited: `Oct ${1 + (i % 28)}, 2024`,
      auditResult: outcome.split(' - ')[0],
      auditScore: outcome.includes('Keep') ? 50 : 100,
      auditComments: "Status verified.",
      auditFindings: r > 0.8 ? "Missing final demand letter scan." : "All closure protocols met."
    };
  });
};

export const generateAccountMonitoringAudits = (count: number): AccountMonitoringAudit[] => {
  return Array.from({ length: count }, (_, i) => {
    const agent = COLLECTORS[i % COLLECTORS.length];
    const r = (Math.sin(i * 719) + 1) / 2;
    return {
      id: `AM-${i}`,
      accountNumber: `2025-${5000 + i}`,
      agentName: agent.name,
      clientName: CLIENT_LIST[i % CLIENT_LIST.length],
      auditorName: "Quality Team",
      accountStatus: "Open",
      daysSinceLastNote: Math.floor(r * 15),
      nextContactDate: `Oct ${15 + (i % 15)}, 2024`,
      dateAudited: `Oct ${1 + (i % 28)}, 2024`,
      auditResult: r > 0.85 ? "Failed" : "Passed",
      auditScore: r > 0.85 ? 40 : 100,
      auditComments: "Monitoring review."
    };
  });
};

export const generateCallMonitoringAudits = (count: number): CallMonitoringAudit[] => {
  return Array.from({ length: count }, (_, i) => {
    const agent = COLLECTORS[i % COLLECTORS.length];
    const r = (Math.sin(i * 433) + 1) / 2;
    return {
      id: `CM-${i}`,
      accountNumber: `2025-${4000 + i}`,
      agentName: agent.name,
      callType: i % 2 === 0 ? "Outbound" : "Inbound",
      callDuration: "3m 45s",
      scriptAdherence: r > 0.9 ? "No" : "Yes",
      debtorPhone: "(555) 123-4567",
      auditorName: "QA Specialist",
      callDateTime: `Oct ${1 + (i % 28)}, 2024 10:00 AM`,
      dateAudited: `Oct ${1 + (i % 28)}, 2024`,
      auditResult: r > 0.9 ? "Failed" : "Passed",
      auditScore: r > 0.9 ? 40 : 100,
      auditComments: "Call review completed."
    };
  });
};

export const generateSevenEightDayAudits = (count: number): SevenEightDayAudit[] => {
  return Array.from({ length: count }, (_, i) => {
    const agent = COLLECTORS[i % COLLECTORS.length];
    return {
      id: `SED-${i}`,
      accountNumber: `2025-${3000 + i}`,
      agentName: agent.name,
      debtorName: DEBTOR_NAMES[i % DEBTOR_NAMES.length],
      clientName: CLIENT_LIST[i % CLIENT_LIST.length],
      status: "Open",
      lastWorkedDate: `Oct ${Math.max(1, 31 - (4 + (i % 10)))}, 2024`,
      daysInactive: 4 + (i % 10),
      balanceDue: 1500 + Math.floor(Math.random() * 5000),
      accountAge: 30 + (i % 100),
      dateAudited: "Oct 30, 2024",
      auditResult: "Failed",
      auditScore: 0,
      auditComments: "Inactive for 4+ days."
    };
  });
};

export const generateRpcAudits = (count: number): RpcAudit[] => {
  return Array.from({ length: count }, (_, i) => {
    const agent = COLLECTORS[i % COLLECTORS.length];
    const r = (Math.sin(i * 821) + 1) / 2;
    const isCollected = r > 0.7;
    const day = 1 + (i % 28);
    
    // Use current month/year for some data to ensure default view has content
    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'short' });
    const currentYear = now.getFullYear();
    
    const dateStr = i < count / 2 
      ? `${currentMonth} ${day}, ${currentYear}`
      : `Feb ${day}, 2026`;

    return {
      id: `RPC-${i}`,
      accountNumber: `2025-${2000 + i}`,
      agentName: agent.name,
      callDate: dateStr,
      phoneNumber: "(555) 000-0000",
      rpcType: r > 0.8 ? '3rd Party' : (r > 0.6 ? 'Wrong Number' : 'Debtor'),
      isCompliant: r > 0.1,
      paymentAmount: isCollected ? 500 + Math.floor(r * 2000) : 0,
      caseUpdate: isCollected ? 'Collected' : (r > 0.4 ? 'Ghosted' : 'RTP'),
      dateAudited: dateStr,
      auditResult: r > 0.1 ? "Passed" : "Failed",
      auditScore: r > 0.1 ? 100 : 0,
      auditComments: r > 0.1 ? "Compliant contact." : "Non-compliant disclosure."
    };
  });
};