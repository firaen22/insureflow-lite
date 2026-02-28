import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { PolicyData, Client, AppView } from '../types';
import { Bell, Calendar, UploadCloud, Mail, Phone, ExternalLink, AlertCircle, Clock } from 'lucide-react';

interface RemindersViewProps {
  t: typeof TRANSLATIONS['en']['reminders'];
  policies: PolicyData[];
  clients: Client[];
  onUploadRenewal: () => void;
  reminderDays: number;
}

export const RemindersView: React.FC<RemindersViewProps> = ({ t, policies, clients, onUploadRenewal, reminderDays }) => {
  const [filter, setFilter] = useState<'all' | 'urgent'>('all');

  // Logic to find upcoming policy anniversaries (Next X days)
  const getUpcomingReminders = () => {
    const today = new Date();

    return policies.map(policy => {
      const [day, month] = policy.policyAnniversaryDate.split('/').map(Number);

      // Construct date for this year
      let anniversaryDate = new Date(today.getFullYear(), month - 1, day);

      // If date passed this year, check next year
      if (anniversaryDate < today) {
        anniversaryDate.setFullYear(today.getFullYear() + 1);
      }

      const diffTime = anniversaryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        ...policy,
        nextAnniversary: anniversaryDate,
        daysRemaining: diffDays,
        client: clients.find(c => c.name === policy.holderName)
      };
    })
      .filter(item => item.daysRemaining >= 0 && item.daysRemaining <= 60)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  };

  const reminders = getUpcomingReminders();
  const filteredReminders = filter === 'urgent'
    ? reminders.filter(r => r.daysRemaining <= 30)
    : reminders;

  const getUrgencyColor = (days: number) => {
    if (days <= 14) return 'bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]'; // Critical
    if (days <= 30) return 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]'; // Warning
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]'; // Info
  };

  const getUrgencyIcon = (days: number) => {
    if (days <= 14) return <AlertCircle className="w-3.5 h-3.5" />;
    if (days <= 30) return <Clock className="w-3.5 h-3.5" />;
    return <Calendar className="w-3.5 h-3.5" />;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-sm font-black text-white flex items-center gap-3 tracking-[0.25em] uppercase">
            <Bell className="w-5 h-5 text-white shadow-[0_0_15px_white]" />
            {t.title}
          </h1>
          <p className="text-slate-500 text-[10px] font-bold mt-2 uppercase tracking-wider">{t.subtitle}</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-white/5 backdrop-blur-xl rounded-2xl p-1 border border-white/10 shadow-2xl">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filter === 'all' ? 'bg-white text-slate-900 shadow-lg scale-105' : 'text-slate-500 hover:text-white'
              }`}
          >
            {t.filterAll}
          </button>
          <button
            onClick={() => setFilter('urgent')}
            className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filter === 'urgent' ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-105' : 'text-slate-500 hover:text-red-400'
              }`}
          >
            {t.filterUrgent}
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredReminders.length > 0 ? (
          filteredReminders.map(reminder => (
            <div key={reminder.id} className="group bg-white/[0.03] backdrop-blur-3xl rounded-[2rem] border border-white/5 shadow-2xl hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              {/* Left Section: Days Remaining Indicator */}
              <div className="flex items-center gap-6">
                <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-[1.5rem] border-2 transition-transform group-hover:scale-110 duration-500 ${getUrgencyColor(reminder.daysRemaining)}`}>
                  <span className="text-2xl font-black">{reminder.daysRemaining}</span>
                  <span className="text-[9px] uppercase font-black tracking-[0.2em]">Days</span>
                </div>

                <div>
                  <h3 className="font-black text-white text-xl tracking-tight leading-tight group-hover:translate-x-1 transition-transform">{reminder.planName}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1.5 mb-2">
                    <span className="text-slate-400">{reminder.holderName}</span>
                    <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                    <span className="font-mono">{reminder.policyNumber}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-tighter ${getUrgencyColor(reminder.daysRemaining)}`}>
                      {getUrgencyIcon(reminder.daysRemaining)}
                      <span className="ml-1.5">
                        {reminder.daysRemaining <= 30 ? t.urgent : t.upcoming}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.1em]">
                      {t.anniversary}: {reminder.nextAnniversary.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Section: Actions */}
              <div className="flex items-center gap-6 w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 border-white/5">
                <div className="flex flex-col gap-1 mr-4 text-right hidden lg:block">
                  <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest leading-none">{t.policyDetails}</span>
                  <span className="text-sm font-black text-white">${reminder.premiumAmount.toLocaleString()} <span className="text-[10px] text-slate-500">/ {reminder.paymentMode}</span></span>
                </div>

                {reminder.client && (
                  <div className="flex gap-2">
                    {reminder.client.email && (
                      <a href={`mailto:${reminder.client.email}`} className="p-3 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl border border-white/5 transition-all active:scale-95" title={reminder.client.email}>
                        <Mail className="w-5 h-5" />
                      </a>
                    )}
                    {reminder.client.phone && (
                      <a href={`tel:${reminder.client.phone}`} className="p-3 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl border border-white/5 transition-all active:scale-95" title={reminder.client.phone}>
                        <Phone className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}

                <button
                  onClick={onUploadRenewal}
                  className="flex-1 md:flex-none px-6 py-4 bg-white text-slate-900 text-[11px] font-black uppercase tracking-[0.2em] rounded-[1.25rem] shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <UploadCloud className="w-4 h-4" />
                  {t.uploadRenewal}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-24 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/5 shadow-inner">
            <Bell className="w-16 h-16 text-white/5 mx-auto mb-6" />
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">{t.noReminders}</p>
          </div>
        )}
      </div>
    </div>
  );
};