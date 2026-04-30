import React from 'react';
import { ArrowLeft, CircleDollarSign } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
  AreaChart,
  Area,
  Legend
} from 'recharts';

const revenueData = [
  { name: 'Jan', Earning: 300, Expense: -150 },
  { name: 'Feb', Earning: 130, Expense: -80 },
  { name: 'Mar', Earning: 500, Expense: -250 },
  { name: 'Apr', Earning: 290, Expense: -120 },
  { name: 'May', Earning: 240, Expense: -230 },
  { name: 'Jun', Earning: 160, Expense: -50 },
  { name: 'Jul', Earning: 240, Expense: -80 },
  { name: 'Aug', Earning: 340, Expense: -100 },
];

const expenseData = [
  { name: 'Employee Salary', value: 350, fill: '#6366f1' },
  { name: 'Collector Commission', value: 200, fill: '#22c55e' },
  { name: 'Monthly Subscriptions', value: 150, fill: '#c084fc' },
  { name: 'Other Expenses', value: 100, fill: '#fbbf24' },
];

const annualReportData = [
  { name: 'Q1', Revenue: 150000, Expenses: 100000 },
  { name: 'Q2', Revenue: 180000, Expenses: 120000 },
  { name: 'Q3', Revenue: 210000, Expenses: 150000 },
  { name: 'Q4', Revenue: 190000, Expenses: 130000 },
];

const netIncomeCycleData = [
  { name: 'Jan', value: 32 },
  { name: 'Feb', value: 15 },
  { name: 'Mar', value: 28 },
  { name: 'Apr', value: 80 },
  { name: 'May', value: 49 },
  { name: 'Jun', value: 71 },
  { name: 'Jul', value: 20 },
  { name: 'Aug', value: 95 },
  { name: 'Sep', value: 48 },
  { name: 'Oct', value: 31 },
  { name: 'Nov', value: 82 },
  { name: 'Dec', value: 50 },
];

interface CompanyRevenueProps {
  onBack?: () => void;
}

const AtmCard = ({ 
  title, 
  amount, 
  percentage, 
  colorClasses 
}: { 
  title: string; 
  amount: string; 
  percentage: string; 
  colorClasses: string; 
}) => {
  return (
    <div className={`relative overflow-hidden rounded-3xl p-5 md:p-6 text-white shadow-xl ${colorClasses}`}>
      {/* Background Graphic/Wave */}
      <svg className="absolute bottom-0 left-0 w-full opacity-20" viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ height: '60%' }}>
        <path fill="currentColor" d="M0,160L48,170.7C96,181,192,203,288,208C384,213,480,203,576,176C672,149,768,107,864,117.3C960,128,1056,192,1152,197.3C1248,203,1344,149,1392,122.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>
      
      <div className="relative z-10 flex justify-between items-start mb-8">
        {/* Chip SVG */}
        <svg width="46" height="34" viewBox="0 0 46 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm scale-90 origin-top-left">
          <rect width="46" height="34" rx="6" fill="url(#chip-gradient)"/>
          <path d="M12 0V34M23 0V34M34 0V34" stroke="#B89400" strokeWidth="1" strokeOpacity="0.4"/>
          <path d="M0 11H46M0 23H46" stroke="#B89400" strokeWidth="1" strokeOpacity="0.4"/>
          <defs>
            <linearGradient id="chip-gradient" x1="0" y1="0" x2="46" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="1" stopColor="#EAB308" />
            </linearGradient>
          </defs>
        </svg>
        <span className="font-extrabold text-xl">{percentage}</span>
      </div>

      <div className="relative z-10 flex justify-between items-end">
        <div>
          <div className="text-3xl md:text-4xl font-black mb-1 drop-shadow-sm">{amount}</div>
          <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] opacity-90">{title}</div>
        </div>
        
        {/* Mastercard-style circles */}
        <div className="flex">
          <div className="w-8 h-8 rounded-full bg-white/30 mix-blend-overlay"></div>
          <div className="w-8 h-8 rounded-full bg-white/30 mix-blend-overlay -ml-3"></div>
        </div>
      </div>
    </div>
  );
};

export default function CompanyRevenue({ onBack }: CompanyRevenueProps) {
  return (
    <div className="p-8 space-y-8 bg-app h-screen animate-in fade-in duration-500 font-sans overflow-y-auto flex flex-col">
      <div className="flex items-center gap-4 shrink-0 mb-4">
        {onBack && (
          <button 
            onClick={onBack} 
            className="p-2.5 rounded-2xl bg-card border border-border-subtle text-text-muted hover:text-indigo-600 shadow-sm transition-all group focus:outline-none"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            <CircleDollarSign className="text-emerald-500" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-text-main uppercase tracking-tight">Company Revenue</h1>
            <p className="text-text-muted font-bold text-[11px] tracking-[0.2em] mt-1 uppercase">Financial Overview</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <AtmCard 
          title="Net Income" 
          amount="$0.00" 
          percentage="0.0%" 
          colorClasses="bg-gradient-to-br from-blue-500 to-blue-600" 
        />
        <AtmCard 
          title="Revenue" 
          amount="$0.00" 
          percentage="0.0%" 
          colorClasses="bg-gradient-to-br from-purple-500 to-purple-600" 
        />
        <AtmCard 
          title="Expenses" 
          amount="$0.00" 
          percentage="0.0%" 
          colorClasses="bg-gradient-to-br from-pink-500 to-pink-600" 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Revenue Report Chart */}
        <div className="bg-card rounded-3xl border border-border-subtle shadow-sm p-6 w-full flex flex-col">
          <div className="flex justify-between items-center mb-8 shrink-0">
            <h2 className="text-xl font-black text-text-main">Revenue Report</h2>
            <div className="flex items-center gap-4 text-[11px] font-extrabold uppercase tracking-widest text-text-muted">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                Earning
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                Expense
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 13, fill: '#9ca3af', fontWeight: 600 }} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 13, fill: '#9ca3af', fontWeight: 600 }}
                  tickFormatter={(val) => val === 0 ? '0' : val > 0 ? `${val}` : `${val}`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px 16px', fontWeight: 'bold' }}
                />
                <ReferenceLine y={0} stroke="var(--border-subtle)" strokeOpacity={0.5} />
                <Bar dataKey="Earning" fill="#6366f1" radius={[20, 20, 20, 20]} barSize={14} />
                <Bar dataKey="Expense" fill="#22c55e" radius={[20, 20, 20, 20]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-card rounded-3xl border border-border-subtle shadow-sm p-6 w-full flex flex-col">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h2 className="text-xl font-black text-text-main">Expenses Report</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-8 justify-center flex-1">
            <div className="w-[260px] h-[260px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    innerRadius={80}
                    outerRadius={120}
                    cornerRadius={10}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px 16px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {expenseData.map((entry, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: entry.fill }}></div>
                  <span className="text-sm font-bold text-text-main">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
        {/* Annual Report Chart */}
        <div className="bg-card rounded-3xl border border-border-subtle shadow-sm p-6 w-full flex flex-col">
          <div className="flex justify-between items-center mb-8 shrink-0">
            <h2 className="text-xl font-black text-text-main">Annual Report</h2>
            <div className="flex items-center gap-4 text-[11px] font-extrabold uppercase tracking-widest text-text-muted">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                Revenue
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                Expenses
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={annualReportData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 13, fill: '#9ca3af', fontWeight: 600 }} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 13, fill: '#9ca3af', fontWeight: 600 }}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px 16px', fontWeight: 'bold' }}
                  formatter={(val: number) => [`$${val.toLocaleString()}`, '']}
                />
                <Bar dataKey="Revenue" fill="#6366f1" radius={[8, 8, 8, 8]} barSize={20} />
                <Bar dataKey="Expenses" fill="#22c55e" radius={[8, 8, 8, 8]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Total Net Income Cycle */}
        <div className="bg-card rounded-3xl border border-border-subtle shadow-sm p-6 w-full flex flex-col">
          <div className="flex justify-between items-center mb-8 shrink-0">
            <h2 className="text-[13px] font-black text-text-main uppercase tracking-widest text-[#475569]">Monthly Cycle</h2>
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
              2026
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netIncomeCycleData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorNetIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 13, fill: '#0f172a', fontWeight: 800 }} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 13, fill: '#0f172a', fontWeight: 800 }}
                  tickFormatter={(val) => `$${val}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px 16px', fontWeight: 'bold' }}
                  formatter={(val: number) => [`$${val}k`, 'Net Income']}
                />
                <Area type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={4} fillOpacity={1} fill="url(#colorNetIncome)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
