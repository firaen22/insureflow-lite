import React from 'react';
import { TRANSLATIONS } from '../constants';
import { Client, PolicyData, PaymentMode } from '../types';
import { Users, FileText, DollarSign, ArrowUpRight, Cake, Bell, AlertCircle, Gift, Clock } from 'lucide-react';
import { RemindersView } from './RemindersView';
import { Card3D } from './ui/Card3D';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardViewProps {
  t: typeof TRANSLATIONS['en']['dashboard'];
  remindersT: typeof TRANSLATIONS['en']['reminders'];
  clients: Client[];
  policies: PolicyData[];
  onUploadRenewal: () => void;
  reminderDays: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ t, remindersT, clients, policies, onUploadRenewal, reminderDays }) => {

  const upcomingBirthdays = clients.filter(client => {
    const today = new Date();
    const bday = new Date(client.birthday);
    const nextBirthday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    const diffTime = nextBirthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 45;
  }).sort((a, b) => {
    const today = new Date();
    const getNextBday = (dateStr: string) => {
      const d = new Date(dateStr);
      const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
      if (next < today) next.setFullYear(today.getFullYear() + 1);
      return next;
    };
    return getNextBday(a.birthday).getTime() - getNextBday(b.birthday).getTime();
  });

  const getNextPremiumDate = (anniversary: string, mode: PaymentMode): Date => {
    const today = new Date();
    const [day, month] = anniversary.split('/').map(Number);
    let baseDate = new Date(today.getFullYear(), month - 1, day);
    if (mode === 'Yearly') {
      if (baseDate < today) baseDate.setFullYear(today.getFullYear() + 1);
      return baseDate;
    }
    const interval = mode === 'Half-Yearly' ? 6 : mode === 'Quarterly' ? 3 : 1;
    let nextDate = new Date(baseDate);
    while (nextDate < today) {
      nextDate.setMonth(nextDate.getMonth() + interval);
    }
    return nextDate;
  };

  const duePolicies = policies.map(p => ({
    ...p,
    nextDueDate: getNextPremiumDate(p.policyAnniversaryDate, p.paymentMode)
  })).filter(p => {
    const today = new Date();
    const diffTime = p.nextDueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 60;
  }).sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());

  const totalPremiumHKD = policies.filter(p => p.status === 'Active').reduce((sum, p) => {
    let amount = p.premiumAmount || 0;
    if (p.currency === 'USD') amount = amount * 7.8;
    return sum + amount;
  }, 0);

  const totalByCurrency = policies.reduce((acc, p) => {
    const c = p.currency || 'HKD';
    acc[c] = (acc[c] || 0) + p.premiumAmount;
    return acc;
  }, {} as Record<string, number>);

  const activePoliciesCount = policies.filter(p => p.status === 'Active').length;

  const policyDistribution = policies.reduce((acc, p) => {
    const type = p.type || 'Other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(policyDistribution).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value);

  const COLORS = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{t.title}</h1>
          <p className="text-slate-500 dark:text-slate-500 dark:text-slate-400 mt-2 font-medium">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <div className="h-1 w-12 bg-brand-600 dark:bg-white rounded-full shadow-[0_0_15px_rgba(14,165,233,0.3)] dark:shadow-[0_0_15px_white]" />
          <div className="h-1 w-4 bg-slate-200 dark:bg-white/20 rounded-full" />
        </div>
      </div>

      {/* Stats Cards in 3D */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card3D className="h-full">
          <div className="flex flex-col h-full p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="p-3 bg-white dark:bg-slate-100 dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-inner">
                <Users className="w-6 h-6 text-brand-600 dark:text-slate-900 dark:text-white" />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  +12.5%
                </span>
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{t.totalClients}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black text-slate-900 dark:text-white">{clients.length}</h3>
              <span className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm font-medium">Active</span>
            </div>
          </div>
        </Card3D>

        <Card3D className="h-full">
          <div className="flex flex-col h-full p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="p-3 bg-slate-100 dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/10 shadow-inner">
                <FileText className="w-6 h-6 text-slate-900 dark:text-white" />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-900 dark:text-white/40 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-full">
                  LIFETIME
                </span>
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{t.activePolicies}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black text-slate-900 dark:text-white">{activePoliciesCount}</h3>
              <span className="text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm font-medium">Policies</span>
            </div>
          </div>
        </Card3D>

        <Card3D className="h-full">
          <div className="flex flex-col h-full p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 bg-slate-100 dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/10 shadow-inner">
                <DollarSign className="w-6 h-6 text-slate-900 dark:text-white" />
              </div>
              <span className="text-[10px] font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full uppercase">
                {t.monthly}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{t.premiumRevenue}</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              HKD ${(totalPremiumHKD / 1000).toFixed(1)}k
            </h3>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-100 dark:border-white/5 flex flex-wrap gap-3">
              {Object.entries(totalByCurrency).map(([c, v]) => (
                <div key={c} className="flex flex-col">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500 font-bold">{c}</span>
                  <span className="text-slate-800 dark:text-slate-900 dark:text-white text-xs font-black">${(v / 1000).toFixed(1)}k</span>
                </div>
              ))}
            </div>
          </div>
        </Card3D>
      </div>

      <div className="pt-4">
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md border border-slate-100 dark:border-white/5 rounded-3xl p-1 shadow-sm dark:shadow-2xl overflow-hidden">
          <div className="bg-slate-100 dark:bg-slate-900/50 rounded-[22px] p-6">
            <RemindersView
              t={remindersT}
              policies={policies}
              clients={clients}
              onUploadRenewal={onUploadRenewal}
              reminderDays={reminderDays}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {(() => {
            const staleClients = clients.filter(c => {
              if (!c.lastContact) return true;
              const lastDate = new Date(c.lastContact);
              const diff = (new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
              return diff > 90;
            }).sort((a, b) => new Date(a.lastContact || 0).getTime() - new Date(b.lastContact || 0).getTime());

            if (staleClients.length === 0) return null;

            return (
              <div className="bg-white dark:bg-white dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-slate-200 dark:border-white/10 rounded-2xl p-5 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-700 shadow-sm dark:shadow-none">
                <div className="p-3 bg-slate-100 dark:bg-white/10 rounded-xl text-brand-600 dark:text-slate-900 dark:text-white shadow-inner">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-slate-900 dark:text-white font-black text-sm tracking-wide">ACTION REQUIRED: STALE CONTACTS</h3>
                  <p className="text-slate-500 dark:text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">
                    {staleClients.length} clients haven't been contacted in over 90 days.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {staleClients.slice(0, 5).map(c => (
                      <span key={c.id} className="bg-slate-100 dark:bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-200 dark:border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 dark:text-slate-600 dark:text-slate-300">
                        {c.name} • {Math.ceil((new Date().getTime() - new Date(c.lastContact).getTime()) / (1000 * 60 * 60 * 24))}d
                      </span>
                    ))}
                    {staleClients.length > 5 && <span className="text-[10px] text-slate-500 font-bold self-center">+{staleClients.length - 5} MORE</span>}
                  </div>
                </div>
              </div>
            );
          })()}

          <Card3D depth={20} className="w-full">
            <div className="flex flex-col h-full p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  {t.premiumsDue.toUpperCase()}
                </h3>
                {duePolicies.length > 0 && (
                  <span className="text-[10px] font-black bg-red-500/20 text-red-400 px-3 py-1 rounded-full border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    {duePolicies.length} URGENT
                  </span>
                )}
              </div>
              <div className="space-y-4">
                {duePolicies.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {duePolicies.map(policy => (
                      <div key={policy.id} className="group relative p-4 bg-slate-50 dark:bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-slate-100 dark:border-white/5 hover:border-brand-200 dark:hover:border-slate-300 dark:border-white/20 transition-all duration-300">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{policy.holderName}</p>
                            <p className="text-[10px] text-slate-500 font-bold mt-0.5">{policy.planName.toUpperCase()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-900 dark:text-white">
                              ${policy.premiumAmount.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold">{policy.currency || 'HKD'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-100 dark:border-white/5">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 dark:text-slate-400 bg-white dark:bg-white dark:bg-white/5 px-2 py-0.5 rounded uppercase tracking-tighter border border-slate-200 dark:border-transparent">{policy.paymentMode}</span>
                          <span className="text-[10px] font-black text-red-500 dark:text-red-400 ml-auto">DUE {policy.nextDueDate.toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-500 font-bold tracking-widest text-xs">{t.noPremiums.toUpperCase()}</p>
                  </div>
                )}
              </div>
            </div>
          </Card3D>

          <div className="bg-white dark:bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-100 dark:border-white/5 overflow-hidden shadow-sm dark:shadow-sm dark:shadow-2xl">
            <div className="p-6 border-b border-slate-100 dark:border-slate-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-widest">{t.recentUpdates.toUpperCase()}</h3>
              <div className="h-1 w-8 bg-brand-500 dark:bg-slate-200 dark:bg-white/20 rounded-full" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-500 font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-100 dark:border-white/5">
                    <th className="px-6 py-4">{t.table.holder}</th>
                    <th className="px-6 py-4">{t.table.type}</th>
                    <th className="px-6 py-4">{t.table.anniversary}</th>
                    <th className="px-6 py-4 text-right">{t.table.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-200 dark:divide-white/5">
                  {policies.slice(0, 8).map((policy) => (
                    <tr key={policy.id} className="hover:bg-slate-50 dark:hover:bg-white dark:bg-white/[0.03] transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-black text-slate-900 dark:text-white group-hover:translate-x-1 transition-transform">{policy.holderName}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{policy.policyNumber}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-500 dark:text-slate-500 dark:text-slate-400 font-bold">{policy.type}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-500 dark:text-slate-400 font-medium">{policy.policyAnniversaryDate}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${policy.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                          policy.status === 'Pending' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                            'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                          }`}>
                          {policy.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <Card3D depth={15} className="w-full">
            <div className="p-8 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-widest">{t.policyDist.toUpperCase()}</h3>
                <div className="h-1 w-8 bg-brand-500 dark:bg-white/20 rounded-full" />
              </div>

              <div className="h-[240px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'Medical' ? '#0ea5e9' : entry.name === 'Critical Illness' ? '#ef4444' : entry.name === 'Life' ? '#6366f1' : COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-3 rounded-xl shadow-2xl">
                              <p className="text-xs font-black dark:text-white mb-1">{payload[0].name}</p>
                              <p className="text-sm font-bold text-brand-600 dark:text-brand-400">
                                {payload[0].value} {payload[0].value === 1 ? 'Policy' : 'Policies'}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {((payload[0].value / policies.length) * 100).toFixed(1)}% of total
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Total</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{policies.length}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-6">
                {chartData.slice(0, 6).map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.name === 'Medical' ? '#0ea5e9' : entry.name === 'Critical Illness' ? '#ef4444' : entry.name === 'Life' ? '#6366f1' : COLORS[index % COLORS.length] }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-slate-800 dark:text-white/90 truncate uppercase tracking-tighter">{entry.name}</p>
                      <p className="text-[9px] text-slate-500 font-bold">{entry.value} • {((entry.value / policies.length) * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card3D>

          <Card3D depth={30} className="h-full min-h-[500px]">
            <div className="flex flex-col h-full p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <Gift className="w-5 h-5 text-brand-600 dark:text-slate-900 dark:text-white" />
                  {t.birthdays.toUpperCase()}
                </h3>
                <span className="text-[10px] font-black bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-900 dark:text-white px-3 py-1 rounded-full border border-slate-200 dark:border-slate-300 dark:border-white/20">
                  {upcomingBirthdays.length}
                </span>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {upcomingBirthdays.length > 0 ? upcomingBirthdays.map(client => {
                  const age = new Date().getFullYear() - new Date(client.birthday).getFullYear();
                  return (
                    <div key={client.id} className="group p-4 bg-slate-50 dark:bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-slate-100 dark:border-white/5 hover:border-brand-200 dark:hover:border-slate-300 dark:border-white/20 transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-200 dark:from-white/20 to-slate-100 dark:to-white/5 flex items-center justify-center text-slate-900 dark:text-white font-black text-lg border border-slate-200 dark:border-slate-200 dark:border-white/10 shadow-inner">
                          {client.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-slate-900 dark:text-white">{client.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-0.5">
                            Turning {age} • {new Date(client.birthday).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <button className="w-full mt-4 py-2 text-[10px] font-black uppercase tracking-widest text-white dark:text-slate-800 bg-brand-600 dark:bg-white rounded-xl hover:bg-brand-700 dark:hover:bg-slate-200 transition-all active:scale-95 shadow-sm">
                        {t.sendWish}
                      </button>
                    </div>
                  );
                }) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-12">
                    <p className="text-xs font-black tracking-[0.2em]">{t.noBirthdays.toUpperCase()}</p>
                  </div>
                )}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5">
                <button className="w-full py-4 text-[10px] font-black uppercase tracking-[.25em] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-white dark:bg-white/5 transition-all">
                  {t.viewCalendar}
                </button>
              </div>
            </div>
          </Card3D>
        </div>
      </div>
    </div>
  );
};