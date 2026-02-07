import React from 'react';
import { TRANSLATIONS } from '../constants';
import { Client, PolicyData, PaymentMode } from '../types';
import { Users, FileText, DollarSign, ArrowUpRight, Cake, Bell, AlertCircle } from 'lucide-react';

interface DashboardViewProps {
  t: typeof TRANSLATIONS['en']['dashboard'];
  clients: Client[];
  policies: PolicyData[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ t, clients, policies }) => {

  // Logic to filter upcoming birthdays (Real-time logic)
  const upcomingBirthdays = clients.filter(client => {
    const today = new Date();
    const bday = new Date(client.birthday);

    // Create a birthday date object for the current year
    const nextBirthday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());

    // If birthday has already passed this year, look at next year
    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }

    // Check if birthday is within the next 45 days
    const diffTime = nextBirthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= 0 && diffDays <= 45;
  }).sort((a, b) => {
    // Sort logic to handle year crossover
    const today = new Date();
    const getNextBday = (dateStr: string) => {
      const d = new Date(dateStr);
      const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
      if (next < today) next.setFullYear(today.getFullYear() + 1);
      return next;
    };
    return getNextBday(a.birthday).getTime() - getNextBday(b.birthday).getTime();
  });

  // Calculate next premium date based on anniversary and mode
  const getNextPremiumDate = (anniversary: string, mode: PaymentMode): Date => {
    const today = new Date();
    const [day, month] = anniversary.split('/').map(Number);

    // Anniversary for current year
    let baseDate = new Date(today.getFullYear(), month - 1, day);

    // If payment is Yearly, just check anniversary
    if (mode === 'Yearly') {
      if (baseDate < today) baseDate.setFullYear(today.getFullYear() + 1);
      return baseDate;
    }

    // For other modes, generate all potential dates for the year and find next one
    const interval = mode === 'Half-Yearly' ? 6 : mode === 'Quarterly' ? 3 : 1;

    let candidateDate = new Date(today.getFullYear(), month - 1, day);
    // Backtrack to start of year or ensure we cover cycles correctly relative to anniversary
    // Simple approach: Start from anniversary this year, if past, add interval until future

    // Reset to anniversary of THIS year
    candidateDate = new Date(today.getFullYear(), month - 1, day);

    // If anniversary is future, it's a candidate. If past, add months.
    // But we need to support cycles that wrap year.
    // Let's just project 12 months forward from anniversary and pick closest.

    let nextDate = new Date(candidateDate);
    // If original anniversary is in past, start adding intervals
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
    return diffDays >= 0 && diffDays <= 60; // Next 60 days
  }).sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());

  // Calculate stats
  const totalPremium = policies.reduce((sum, p) => sum + p.premiumAmount, 0);
  const activePoliciesCount = policies.filter(p => p.status === 'Active').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">{t.title}</h1>
        <p className="text-slate-500 text-sm">{t.subtitle}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-brand-600" />
            </div>
            <span className="text-xs font-medium text-green-600 flex items-center bg-green-50 px-2 py-1 rounded-full">
              +12% <ArrowUpRight className="w-3 h-3 ml-1" />
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">{t.totalClients}</p>
          <h3 className="text-2xl font-bold text-slate-800">{clients.length}</h3>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-xs font-medium text-green-600 flex items-center bg-green-50 px-2 py-1 rounded-full">
              +5% <ArrowUpRight className="w-3 h-3 ml-1" />
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">{t.activePolicies}</p>
          <h3 className="text-2xl font-bold text-slate-800">{activePoliciesCount}</h3>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-slate-500">
              {t.monthly}
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">{t.premiumRevenue}</p>
          <h3 className="text-2xl font-bold text-slate-800">${(totalPremium / 1000).toFixed(1)}k</h3>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Bell className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              {t.attentionNeeded}
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">{t.reminders}</p>
          <h3 className="text-2xl font-bold text-slate-800">{upcomingBirthdays.length + duePolicies.length}</h3>
        </div>
      </div>

      {/* Reminders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Premium Reminders */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-96">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              {t.premiumsDue}
            </h3>
            <span className="text-xs font-semibold bg-red-50 text-red-600 px-2 py-1 rounded-full">
              {duePolicies.length}
            </span>
          </div>
          <div className="p-4 overflow-y-auto flex-1 space-y-3">
            {duePolicies.length > 0 ? duePolicies.map(policy => (
              <div key={policy.id} className="flex items-start p-3 bg-slate-50 rounded-lg border border-slate-100 transition-colors hover:bg-slate-100">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{policy.holderName}</p>
                  <p className="text-xs text-slate-500">{policy.planName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">{policy.paymentMode}</span>
                    <span className="text-xs font-medium text-red-600">Due {policy.nextDueDate.toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">${policy.premiumAmount}</p>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <p>{t.noPremiums}</p>
              </div>
            )}
          </div>
        </div>

        {/* Birthday Reminders */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-96">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Cake className="w-5 h-5 text-brand-500" />
              {t.birthdays}
            </h3>
            <span className="text-xs font-semibold bg-brand-50 text-brand-600 px-2 py-1 rounded-full">
              {upcomingBirthdays.length}
            </span>
          </div>
          <div className="p-4 overflow-y-auto flex-1 space-y-3">
            {upcomingBirthdays.length > 0 ? upcomingBirthdays.map(client => {
              const age = new Date().getFullYear() - new Date(client.birthday).getFullYear();

              return (
                <div key={client.id} className="flex items-center p-3 bg-slate-50 rounded-lg border border-slate-100 transition-colors hover:bg-slate-100">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold mr-3">
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{client.name}</p>
                    <p className="text-xs text-slate-500">Turning {age} on {new Date(client.birthday).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <button className="text-xs bg-white border border-brand-200 text-brand-600 px-3 py-1.5 rounded-md hover:bg-brand-50 font-medium transition-colors">
                    {t.sendWish}
                  </button>
                </div>
              );
            }) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <p>{t.noBirthdays}</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Recent Policies Table (Simple) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">{t.recentUpdates}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">{t.table.policyNo}</th>
                <th className="px-6 py-3">{t.table.holder}</th>
                <th className="px-6 py-3">{t.table.type}</th>
                <th className="px-6 py-3">{t.table.anniversary}</th>
                <th className="px-6 py-3">{t.table.mode}</th>
                <th className="px-6 py-3">{t.table.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {policies.map((policy) => (
                <tr key={policy.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{policy.policyNumber}</td>
                  <td className="px-6 py-4 text-slate-600">{policy.holderName}</td>
                  <td className="px-6 py-4 text-slate-600">{policy.type}</td>
                  <td className="px-6 py-4 text-slate-600">{policy.policyAnniversaryDate}</td>
                  <td className="px-6 py-4 text-slate-600">{policy.paymentMode}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${policy.status === 'Active' ? 'bg-green-100 text-green-800' :
                      policy.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
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
  );
};