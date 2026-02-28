import React, { useState } from 'react';
import { TRANSLATIONS, PRODUCT_TYPES } from '../constants';
import { Client, PolicyData, Product } from '../types';
import {
  ArrowLeft, Mail, Phone, Calendar, Clock, Tag,
  Trash2, Edit, Save, X, Plus, ChevronDown,
  FileText, Layers, Activity, Shield, MessageSquare
} from 'lucide-react';
import { summarizeMeetingNotes } from '../services/gemini';
import {
  isClientInsured,
  calculateTotalAnnualPremiumHKD,
  calculateTotalCISumInsuredHKD,
  calculateTotalLifeSumInsuredHKD
} from '../utils/policyCalculations';
import { Card3D } from './ui/Card3D';

interface ClientDetailsViewProps {
  client: Client;
  policies: PolicyData[];
  onBack: () => void;
  onDeletePolicy: (policyId: string) => void;
  onUpdatePolicy: (updatedPolicy: PolicyData) => void;
  products: Product[];
  t: any; // Using any due to dynamic translation updates causing lint
  meetingsT: any;
  onGenerateReport?: () => void;
  onUpdateClient: (client: Client) => void;
  availableTags?: string[];
}

export const ClientDetailsView: React.FC<ClientDetailsViewProps> = ({
  client,
  policies,
  onBack,
  onDeletePolicy,
  onUpdatePolicy,
  products,
  t,
  meetingsT,
  onGenerateReport,
  onUpdateClient,
  availableTags = []
}) => {
  // ... existing state ...

  // ... inside render ...


  const [editingPolicy, setEditingPolicy] = useState<PolicyData | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isAddMeetingOpen, setIsAddMeetingOpen] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Policy Review' as const,
    summary: '',
    rawNotes: ''
  });

  const handleAISummarize = async () => {
    if (!newMeeting.rawNotes) return;
    setIsSummarizing(true);
    try {
      const apiKey = localStorage.getItem('gemini_api_key') || '';
      const summary = await summarizeMeetingNotes(newMeeting.rawNotes, apiKey);
      setNewMeeting(prev => ({ ...prev, summary }));
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAddMeeting = () => {
    const log = {
      id: `m-${Date.now()}`,
      ...newMeeting
    };
    const updatedClient = {
      ...client,
      meetingLogs: [log, ...(client.meetingLogs || [])],
      lastContact: newMeeting.date // Auto-update last contact
    };
    onUpdateClient(updatedClient);
    setIsAddMeetingOpen(false);
    setNewMeeting({
      date: new Date().toISOString().split('T')[0],
      type: 'Policy Review',
      summary: '',
      rawNotes: ''
    });
  };

  const handleDeleteClick = (policyId: string) => {
    if (window.confirm(t.deleteConfirm)) {
      onDeletePolicy(policyId);
    }
  };

  const handleUpdateField = (field: keyof PolicyData, value: any) => {
    if (editingPolicy) {
      setEditingPolicy({ ...editingPolicy, [field]: value });
    }
  };

  const handleUpdateRider = (index: number, field: string, value: any) => {
    if (editingPolicy && editingPolicy.riders) {
      const newRiders = [...editingPolicy.riders];
      newRiders[index] = { ...newRiders[index], [field]: value };
      setEditingPolicy({ ...editingPolicy, riders: newRiders });
    }
  };

  const handleAddRider = () => {
    if (editingPolicy) {
      const newRiders = editingPolicy.riders ? [...editingPolicy.riders] : [];
      newRiders.push({ name: '', type: 'Medical', premiumAmount: 0, sumInsured: 0 });
      setEditingPolicy({ ...editingPolicy, riders: newRiders });
    }
  };

  const handleRemoveRider = (index: number) => {
    if (editingPolicy && editingPolicy.riders) {
      const newRiders = editingPolicy.riders.filter((_, i) => i !== index);
      setEditingPolicy({ ...editingPolicy, riders: newRiders });
    }
  };

  const handleSavePolicy = () => {
    if (editingPolicy) {
      onUpdatePolicy(editingPolicy);
      setEditingPolicy(null);
    }
  };

  // --- Calculations for Summary ---
  const totalAnnualPremiumHKD = calculateTotalAnnualPremiumHKD(policies);
  const totalCISumInsuredHKD = calculateTotalCISumInsuredHKD(policies, client.name);
  const totalLifeSumInsuredHKD = calculateTotalLifeSumInsuredHKD(policies, client.name);

  return (
    <div className="space-y-10 print:space-y-4">
      <style>{`
        @media print {
          @page { margin: 1cm; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
          .no-print { display: none !important; }
          .print-break-inside-avoid { break-inside: avoid; }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all active:scale-95 print:hidden group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black text-white tracking-tight">
                {client.name.toUpperCase()}
              </h1>
              <button
                onClick={() => setEditingClient(client)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white border border-white/5 transition-all"
                title="Edit Client Details"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              <div className="h-1 w-12 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
              <div className="h-1 w-4 bg-white/20 rounded-full" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 print:hidden">
          {onGenerateReport && (
            <button
              onClick={onGenerateReport}
              className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-2xl hover:bg-slate-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] text-sm font-black uppercase tracking-widest active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>Generate PDF</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        {/* Left Column: Client Info & Summary */}
        <Card3D className="h-full">
          <div className="flex flex-col h-full">
            <h3 className="text-white text-xs font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <Shield className="w-4 h-4" /> {t.summary?.title || 'Protection Summary'}
            </h3>

            <div className="space-y-8">
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">{t.summary?.totalPremium || 'Total Annual Premium'}</p>
                <p className="text-4xl font-black text-white hover:translate-x-1 transition-transform cursor-default">
                  HKD ${(totalAnnualPremiumHKD / 1000).toFixed(1)}K
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/5">
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">{t.summary?.life || 'Life Coverage'}</p>
                  <p className="text-2xl font-black text-white">${(totalLifeSumInsuredHKD / 1000000).toFixed(1)}M</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">{t.summary?.ci || 'Critical Illness'}</p>
                  <p className="text-2xl font-black text-white">${(totalCISumInsuredHKD / 1000000).toFixed(1)}M</p>
                </div>
              </div>
            </div>
          </div>
        </Card3D>

        {/* Contact Info Card */}
        <Card3D className="h-full">
          <div className="flex flex-col h-full">
            <h3 className="text-white text-xs font-black uppercase tracking-[0.2em] mb-8">{t.contactInfo?.toUpperCase()}</h3>

            <div className="space-y-6">
              {[
                { icon: Mail, label: t.email, value: client.email },
                { icon: Phone, label: t.phone, value: client.phone },
                { icon: Calendar, label: t.birthday, value: client.birthday }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 group/item">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover/item:bg-white/10 group-hover/item:scale-110 transition-all">
                    <item.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">{item.label}</p>
                    <p className="text-sm text-white font-bold">{item.value || '-'}</p>
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap gap-2 pt-6 border-t border-white/5">
                {client.tags.length > 0 ? client.tags.map(tag => (
                  <span key={tag} className="bg-white/5 text-slate-400 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-white/10 flex items-center gap-1 hover:bg-white/10 hover:text-white transition-colors">
                    <Tag className="w-3 h-3" /> {tag}
                  </span>
                )) : <span className="text-[10px] text-slate-600 font-black uppercase py-1">No metadata tags</span>}
              </div>
            </div>
          </div>
        </Card3D>
      </div>

      {/* Policies Table */}
      <div className="space-y-8">
        <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/40">
            <h3 className="text-sm font-black text-white flex items-center gap-3 tracking-[0.2em]">
              <FileText className="w-5 h-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              {t.policiesHeld?.toUpperCase()} ({policies.length})
            </h3>
            <div className="h-1 w-12 bg-white/20 rounded-full" />
          </div>

          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-500 font-black uppercase tracking-widest border-b border-white/5">
                  <th className="px-6 py-5 min-w-[100px]">{t.policyCard.type}</th>
                  <th className="px-6 py-5 min-w-[120px]">{t.policyCard.effectiveDate}</th>
                  <th className="px-6 py-5 min-w-[200px]">{t.policyCard.basePlan}</th>
                  <th className="px-6 py-5">{t.policyCard.sumInsured}</th>
                  <th className="px-6 py-5 text-right">{t.policyCard.premium}</th>
                  <th className="px-6 py-5 text-center">{t.policyCard.status}</th>
                  <th className="px-6 py-5 text-right print:hidden"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {policies.length > 0 ? policies.map(policy => (
                  <React.Fragment key={policy.id}>
                    <tr className="hover:bg-white/[0.03] transition-colors group">
                      <td className="px-6 py-6 align-top">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter border ${policy.type === 'Life' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          policy.type === 'Critical Illness' ? 'bg-red-500/10 text-red-100 border-red-500/20' :
                            policy.type === 'Medical' ? 'bg-emerald-500/10 text-emerald-100 border-emerald-500/20' :
                              'bg-white/5 text-white/50 border-white/10'
                          }`}>
                          {policy.type}
                        </span>
                      </td>
                      <td className="px-6 py-6 align-top">
                        <div className="flex flex-col text-[10px] font-black text-slate-500">
                          <span className="text-white mb-1 uppercase tracking-tighter">Eff: {policy.effectiveDate || '-'}</span>
                          <span className="uppercase tracking-widest font-bold">Ann: {policy.policyAnniversaryDate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6 align-top">
                        <div className="font-black text-white text-base tracking-tight flex items-center flex-wrap gap-2 group-hover:translate-x-1 transition-transform">
                          <span>{policy.planName}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-widest">{policy.policyNumber}</div>
                        {policy.medicalPlanType && (
                          <span className="text-[9px] font-black uppercase bg-white/5 text-slate-400 px-2 py-0.5 rounded mt-2 inline-block border border-white/10">
                            {policy.medicalPlanType}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-6 align-top font-black text-white text-sm">
                        {policy.sumInsured ? `$${policy.sumInsured.toLocaleString()}` : '-'}
                        {policy.isMultipay && <div className="text-[9px] text-emerald-400 font-black uppercase tracking-tighter mt-1">✓ Multipay</div>}
                      </td>
                      <td className="px-6 py-6 align-top text-right">
                        <div className="font-black text-white text-sm">
                          {policy.currency} ${policy.premiumAmount.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{policy.paymentMode}</div>
                      </td>
                      <td className="px-6 py-6 align-top text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase border tracking-tighter shadow-lg ${policy.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}>
                          {policy.status}
                        </span>
                      </td>
                      <td className="px-6 py-6 align-top text-right print:hidden">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <button onClick={() => setEditingPolicy(policy)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white border border-white/5 transition-all">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteClick(policy.id)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-red-400 border border-white/5 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Render Riders as distinct rows */}
                    {policy.riders && policy.riders.map((rider, idx) => (
                      <tr key={`${policy.id}-rider-${idx}`} className="bg-slate-50/50 hover:bg-slate-100/50 group border-t-0 border-l-2 border-l-brand-200">
                        <td className="px-4 py-2 align-middle border-t-0 pl-6">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium border bg-slate-100 text-slate-500 border-slate-200 uppercase tracking-widest">
                            Rider
                          </span>
                        </td>
                        <td className="px-4 py-2 align-middle border-t-0 text-slate-400 text-xs">
                          └─
                        </td>
                        <td className="px-4 py-2 align-middle border-t-0">
                          <div className="font-medium text-slate-700 text-sm">{rider.name}</div>
                          {rider.type && <div className="text-[10px] text-slate-500">{rider.type}</div>}
                        </td>
                        <td className="px-4 py-2 align-middle border-t-0 text-slate-700">
                          {rider.type === 'Medical' && rider.medicalPlanType ? (
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 rounded inline-block border border-blue-200">
                              {['High-End Semi-Private', 'High-End Private'].includes(rider.medicalPlanType as string) ? 'High-End Medical' : rider.medicalPlanType}
                            </span>
                          ) : rider.sumInsured ? (
                            <span className="font-medium text-slate-700">${rider.sumInsured.toLocaleString()}</span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-2 align-middle text-right border-t-0">
                          <div className="font-bold text-slate-700">
                            {policy.currency} ${rider.premiumAmount.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-2 align-middle border-t-0 text-xs text-slate-600">
                          {rider.protectionMatureDate || rider.premiumMatureDate ? (
                            <div className="flex flex-col mt-1">
                              {rider.protectionMatureDate && <span><span className="text-slate-400 w-12 inline-block">Prot:</span> {rider.protectionMatureDate}</span>}
                              {rider.premiumMatureDate && <span><span className="text-slate-400 w-12 inline-block">Prem:</span> {rider.premiumMatureDate}</span>}
                            </div>
                          ) : '-'}
                        </td>
                        <td colSpan={2} className="px-4 py-2 border-t-0"></td>
                      </tr>
                    ))}
                  </React.Fragment>
                )) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      {t.noPolicies}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Meeting Logs Section */}
        <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/40">
            <h3 className="text-sm font-black text-white flex items-center gap-3 tracking-[0.2em]">
              <Clock className="w-5 h-5 text-white/50" />
              {meetingsT.title?.toUpperCase()} ({(client.meetingLogs || []).length})
            </h3>
            <button
              onClick={() => setIsAddMeetingOpen(true)}
              className="text-[10px] font-black uppercase tracking-widest bg-white text-slate-900 px-5 py-2.5 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <Plus className="w-3.5 h-3.5" /> {meetingsT.addLog}
            </button>
          </div>

          <div className="p-8 space-y-8 max-h-[600px] overflow-y-auto custom-scrollbar">
            {(client.meetingLogs || []).length > 0 ? [...(client.meetingLogs || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
              <div key={log.id} className="relative pl-10 pb-8 last:pb-0">
                <div className="absolute left-0 top-0 w-[2px] h-full bg-white/5" />
                <div className="absolute left-[-4px] top-0 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />

                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{log.date}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-slate-300 font-black uppercase tracking-tighter">
                      {log.type.toUpperCase()}
                    </span>
                    <button onClick={() => {
                      if (window.confirm(meetingsT.deleteConfirm)) {
                        const updatedLogs = (client.meetingLogs || []).filter(l => l.id !== log.id);
                        onUpdateClient({ ...client, meetingLogs: updatedLogs });
                      }
                    }} className="text-slate-600 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-200 font-bold leading-relaxed">{log.summary}</p>
              </div>
            )) : (
              <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                <MessageSquare className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest leading-loose">{meetingsT.noLogs}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Meeting Modal */}
      {isAddMeetingOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-500" /> {meetingsT.addLog}
              </h3>
              <button onClick={() => setIsAddMeetingOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{meetingsT.date}</label>
                  <input
                    type="date"
                    value={newMeeting.date}
                    onChange={e => setNewMeeting({ ...newMeeting, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{meetingsT.type}</label>
                  <select
                    value={newMeeting.type}
                    onChange={e => setNewMeeting({ ...newMeeting, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-brand-500 transition-colors cursor-pointer appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                  >
                    <option value="Intro">{meetingsT.types?.Intro || 'Intro'}</option>
                    <option value="Policy Review">{meetingsT.types?.PolicyReview || 'Policy Review'}</option>
                    <option value="Claim">{meetingsT.types?.Claim || 'Claim'}</option>
                    <option value="Upsell">{meetingsT.types?.Upsell || 'Upsell'}</option>
                    <option value="General">{meetingsT.types?.General || 'General'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex justify-between items-center">
                  {meetingsT.notes}
                  <button
                    onClick={handleAISummarize}
                    disabled={isSummarizing || !newMeeting.rawNotes}
                    className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-all ${isSummarizing ? 'bg-slate-100 text-slate-400' : 'bg-brand-50 text-brand-600 hover:bg-brand-100 hover:shadow-sm'
                      }`}
                  >
                    {isSummarizing ? 'Thinking...' : `✨ ${meetingsT.summarize}`}
                  </button>
                </label>
                <textarea
                  rows={4}
                  placeholder="Paste rough notes, bullet points, or conversation summary..."
                  value={newMeeting.rawNotes}
                  onChange={e => setNewMeeting({ ...newMeeting, rawNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{meetingsT.summary}</label>
                <textarea
                  rows={2}
                  value={newMeeting.summary}
                  onChange={e => setNewMeeting({ ...newMeeting, summary: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsAddMeetingOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                {t.cancel}
              </button>
              <button
                onClick={handleAddMeeting}
                disabled={!newMeeting.summary}
                className="px-6 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all disabled:opacity-50 disabled:shadow-none"
              >
                {t.saveChanges}
              </button>
            </div>

          </div>
        </div>
      )
      }

      {/* Edit Policy Modal */}
      {
        editingPolicy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto print:hidden">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">{t.editPolicy}</h3>
                <button
                  onClick={() => setEditingPolicy(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Basic Fields */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t.policyCard.basePlan}</label>
                  <select
                    value={editingPolicy.planName}
                    onChange={e => {
                      const selectedPlanName = e.target.value;
                      const selectedProduct = products.find(p => p.name === selectedPlanName);
                      if (selectedProduct) {
                        setEditingPolicy({
                          ...editingPolicy,
                          planName: selectedPlanName,
                          company: selectedProduct.provider, // Auto-fill company
                          type: selectedProduct.type // Auto-fill type
                        });
                      } else {
                        setEditingPolicy({ ...editingPolicy, planName: selectedPlanName });
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-brand-500 transition-colors cursor-pointer appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                  >
                    <option value="" disabled>Select a plan...</option>
                    {products.map(p => (
                      <option key={p.name} value={p.name}>{p.provider} - {p.name}</option>
                    ))}
                    {/* Fallback option if a legacy plan isn't in the library */}
                    {!products.some(p => p.name === editingPolicy.planName) && editingPolicy.planName && (
                      <option value={editingPolicy.planName}>{editingPolicy.planName} (Not in Library)</option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.policyCard.policyNo}</label>
                    <input
                      type="text"
                      value={editingPolicy.policyNumber}
                      onChange={e => handleUpdateField('policyNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Insured Name</label>
                    <input
                      type="text"
                      value={editingPolicy.insuredName || ''}
                      onChange={e => handleUpdateField('insuredName', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="Same as holder"
                    />
                  </div>
                </div>

                {/* Company Field (New) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Insurance Company</label>
                  <input
                    list="company-options"
                    type="text"
                    value={editingPolicy.company || ''}
                    onChange={e => handleUpdateField('company', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="e.g. AIA, Prudential"
                  />
                  <datalist id="company-options">
                    <option value="AIA" />
                    <option value="Prudential" />
                    <option value="Manulife" />
                    <option value="Sun Life" />
                    <option value="FWD" />
                    <option value="AXA" />
                    <option value="China Life" />
                    <option value="HSBC Life" />
                    <option value="BOC Life" />
                  </datalist>
                </div>

                {/* Policy Tags Field (New) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Policy Tags (Synced to Client)</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      id="policy-tag-input"
                      className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                      placeholder="Add tag..."
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val && !editingPolicy.extractedTags?.includes(val)) {
                            handleUpdateField('extractedTags', [...(editingPolicy.extractedTags || []), val]);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('policy-tag-input') as HTMLInputElement;
                        const val = input.value.trim();
                        if (val && !editingPolicy.extractedTags?.includes(val)) {
                          handleUpdateField('extractedTags', [...(editingPolicy.extractedTags || []), val]);
                          input.value = '';
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-xs font-medium"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editingPolicy.extractedTags?.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {tag}
                        <button
                          onClick={() => handleUpdateField('extractedTags', editingPolicy.extractedTags?.filter((_, i) => i !== idx))}
                          className="ml-1.5 opacity-60 hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.policyCard.type}</label>
                    <div className="relative">
                      <select
                        value={editingPolicy.type}
                        onChange={e => handleUpdateField('type', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-brand-500 transition-colors cursor-pointer appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                      >
                        {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.policyCard.effectiveDate} (YYYY-MM-DD)</label>
                    <input
                      type="date"
                      value={editingPolicy.effectiveDate || ''}
                      onChange={e => handleUpdateField('effectiveDate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.policyCard.anniversary} (DD/MM)</label>
                    <input
                      type="text"
                      value={editingPolicy.policyAnniversaryDate}
                      onChange={e => handleUpdateField('policyAnniversaryDate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="DD/MM"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.protectionMatureDate || 'Protection Maturity'}</label>
                    <input
                      type="text"
                      value={editingPolicy.protectionMatureDate || ''}
                      onChange={e => handleUpdateField('protectionMatureDate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="e.g. YYYY-MM-DD or Age 100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.premiumMatureDate || 'Premium Maturity'}</label>
                    <input
                      type="text"
                      value={editingPolicy.premiumMatureDate || ''}
                      onChange={e => handleUpdateField('premiumMatureDate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="e.g. YYYY-MM-DD or 20 Years"
                    />
                  </div>
                </div>

                {/* Type Specific Fields */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Plan Details
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Sum Insured - Generic (Hide for Medical) */}
                    {['Life', 'Critical Illness', 'Accident'].includes(editingPolicy.type) && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{t.policyCard.sumInsured}</label>
                        <input type="number" value={editingPolicy.sumInsured || ''} onChange={e => handleUpdateField('sumInsured', Number(e.target.value))} className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded" />
                      </div>
                    )}

                    {/* Medical */}
                    {editingPolicy.type === 'Medical' && (
                      <>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-slate-600 mb-1">{t.policyCard.roomType}</label>
                          <select value={editingPolicy.medicalPlanType || 'Ward'} onChange={e => handleUpdateField('medicalPlanType', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded bg-slate-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-brand-500 transition-colors cursor-pointer appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.25rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em', paddingRight: '1.75rem' }}>
                            <option value="Ward">Ward</option>
                            <option value="Semi-Private">Semi-Private</option>
                            <option value="Private">Private</option>
                            <option value="High-End Semi-Private">High-End Semi-Private</option>
                            <option value="High-End Private">High-End Private</option>
                          </select>
                        </div>
                        {['High-End Semi-Private', 'High-End Private'].includes(editingPolicy.medicalPlanType || '') && (
                          <div className="col-span-2 mt-1">
                            <label className="block text-xs font-medium text-slate-600 mb-1">{t.policyCard.excess}</label>
                            <input type="number" placeholder="Annual Excess Amount" value={editingPolicy.medicalExcess || ''} onChange={e => handleUpdateField('medicalExcess', Number(e.target.value))} className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded" />
                          </div>
                        )}
                        {(products.find(p => p.name === editingPolicy.planName)?.annualCoverageLimit || products.find(p => p.name === editingPolicy.planName)?.wholeLifeCoverageLimit) ? (
                          <div className="col-span-2 bg-slate-100 p-2 rounded border border-slate-200 mt-1 flex justify-between items-center">
                            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                              <Activity className="w-3 h-3" />
                              Library Limits Mapped
                            </div>
                            <div className="text-xs text-slate-700 font-medium text-right flex gap-3">
                              {products.find(p => p.name === editingPolicy.planName)?.annualCoverageLimit && <span>Ann: ${products.find(p => p.name === editingPolicy.planName)?.annualCoverageLimit?.toLocaleString()}</span>}
                              {products.find(p => p.name === editingPolicy.planName)?.wholeLifeCoverageLimit && <span>Life: ${products.find(p => p.name === editingPolicy.planName)?.wholeLifeCoverageLimit?.toLocaleString()}</span>}
                            </div>
                          </div>
                        ) : null}
                      </>
                    )}

                    {/* Savings */}
                    {editingPolicy.type === 'Savings' && (
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1">{t.policyCard.capital}</label>
                        <input type="number" value={editingPolicy.capitalInvested || ''} onChange={e => handleUpdateField('capitalInvested', Number(e.target.value))} className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded" />
                      </div>
                    )}

                    {/* Accident Option specifics */}
                    {editingPolicy.type === 'Accident' && (
                      <div className="col-span-2 bg-orange-50 p-3 rounded-lg border border-orange-100 space-y-3 mt-1">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-orange-700 mb-1">Medical Limit</label>
                            <input type="number" value={editingPolicy.accidentMedicalLimit || ''} onChange={e => handleUpdateField('accidentMedicalLimit', Number(e.target.value))} className="w-full px-2 py-1.5 text-sm border border-orange-200 rounded" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-orange-700 mb-1">Section Limit</label>
                            <input type="number" value={editingPolicy.accidentSectionLimit || ''} onChange={e => handleUpdateField('accidentSectionLimit', Number(e.target.value))} className="w-full px-2 py-1.5 text-sm border border-orange-200 rounded" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-orange-700 mb-1">Bonesetting Limit</label>
                            <input type="number" value={editingPolicy.accidentBonesettingLimit || ''} onChange={e => handleUpdateField('accidentBonesettingLimit', Number(e.target.value))} className="w-full px-2 py-1.5 text-sm border border-orange-200 rounded" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-orange-700 mb-1">Acupuncture Limit</label>
                            <input type="number" value={editingPolicy.accidentAcupunctureLimit || ''} onChange={e => handleUpdateField('accidentAcupunctureLimit', Number(e.target.value))} className="w-full px-2 py-1.5 text-sm border border-orange-200 rounded" />
                          </div>
                        </div>
                        {/* Physio Limits */}
                        <div className="border-t border-orange-200 pt-3">
                          <label className="block text-xs font-medium text-orange-700 mb-2">Physio Limits</label>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <select value={editingPolicy.accidentPhysioLimitType1 || ''} onChange={e => handleUpdateField('accidentPhysioLimitType1', e.target.value || undefined)} className="w-full px-2 py-1.5 text-sm border border-orange-200 rounded bg-white text-slate-700">
                              <option value="">None</option>
                              <option value="Annual">Annual Limit</option>
                              <option value="Per Treatment">Per Treatment</option>
                              <option value="Per Accident">Per Accident</option>
                            </select>
                            <input type="number" value={editingPolicy.accidentPhysioLimitAmount1 || ''} onChange={e => handleUpdateField('accidentPhysioLimitAmount1', Number(e.target.value))} placeholder="$ Limit 1" disabled={!editingPolicy.accidentPhysioLimitType1} className="w-full px-2 py-1.5 text-sm border border-orange-200 rounded bg-white disabled:bg-slate-100" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <select value={editingPolicy.accidentPhysioLimitType2 || ''} onChange={e => handleUpdateField('accidentPhysioLimitType2', e.target.value || undefined)} className="w-full px-2 py-1.5 text-sm border border-orange-200 rounded bg-white text-slate-700">
                              <option value="">None</option>
                              <option value="Annual">Annual Limit</option>
                              <option value="Per Treatment">Per Treatment</option>
                              <option value="Per Accident">Per Accident</option>
                            </select>
                            <input type="number" value={editingPolicy.accidentPhysioLimitAmount2 || ''} onChange={e => handleUpdateField('accidentPhysioLimitAmount2', Number(e.target.value))} placeholder="$ Limit 2" disabled={!editingPolicy.accidentPhysioLimitType2} className="w-full px-2 py-1.5 text-sm border border-orange-200 rounded bg-white disabled:bg-slate-100" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <h5 className="text-[10px] text-slate-400 font-bold uppercase mb-2">Cash Values</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Total Cash Value</label>
                        <input type="number" value={editingPolicy.totalCashValue || ''} onChange={e => handleUpdateField('totalCashValue', Number(e.target.value))} className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded bg-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Riders */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                      <Layers className="w-4 h-4 text-slate-500" /> {t.policyCard.riders}
                    </label>
                    <button onClick={handleAddRider} className="text-xs text-brand-600 font-medium flex items-center hover:underline">
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </button>
                  </div>
                  <div className="space-y-4 text-xs">
                    {editingPolicy.riders?.map((rider, idx) => (
                      <div key={idx} className="flex flex-col gap-2 bg-slate-50 p-3 rounded border border-slate-200 shadow-sm relative pt-4">
                        <button onClick={() => handleRemoveRider(idx)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 bg-white rounded-full p-1 shadow-sm"><Trash2 className="w-3 h-3" /></button>

                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-8">
                            <label className="block font-medium text-slate-500 mb-1">Rider Name</label>
                            <input
                              list={`edit-rider-products-${idx}`}
                              type="text"
                              value={rider.name}
                              placeholder="Plan / Rider Name"
                              onChange={e => {
                                const val = e.target.value;
                                handleUpdateRider(idx, 'name', val);
                                const matchedProduct = products.find(p => p.name === val);
                                if (matchedProduct) {
                                  handleUpdateRider(idx, 'type', matchedProduct.type);
                                }
                              }}
                              className="w-full px-2 py-1.5 border rounded border-slate-300 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                            />
                            <datalist id={`edit-rider-products-${idx}`}>
                              {products.map(p => <option key={p.name} value={p.name}>{p.provider} - {p.name}</option>)}
                            </datalist>
                          </div>
                          <div className="col-span-4">
                            <label className="block font-medium text-slate-500 mb-1">Type</label>
                            <select value={rider.type || 'Other'} onChange={e => handleUpdateRider(idx, 'type', e.target.value)} className="w-full px-2 py-1.5 border rounded border-slate-300 bg-slate-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-brand-500 transition-colors cursor-pointer appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.25rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em', paddingRight: '1.5rem' }}>
                              <option value="" disabled>Select Type...</option>
                              {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-6">
                            <label className="block font-medium text-slate-500 mb-1">Premium Amt</label>
                            <input type="number" value={rider.premiumAmount} placeholder="Amount" onChange={e => handleUpdateRider(idx, 'premiumAmount', Number(e.target.value))} className="w-full px-2 py-1.5 border rounded border-slate-300" />
                          </div>
                          <div className="col-span-6">
                            <label className="block font-medium text-slate-500 mb-1">Sum Insured</label>
                            {rider.type === 'Medical' ? (
                              <select
                                value={rider.medicalPlanType || 'Ward'}
                                onChange={e => handleUpdateRider(idx, 'medicalPlanType', e.target.value)}
                                className="w-full px-2 py-1.5 border rounded border-slate-300 bg-slate-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-brand-500 transition-colors cursor-pointer appearance-none"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.25rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em', paddingRight: '1.5rem' }}
                              >
                                <option value="Ward">Ward</option>
                                <option value="Semi-Private">Semi-Private</option>
                                <option value="Private">Private</option>
                                <option value="High-End Semi-Private">High-End Semi-Private</option>
                                <option value="High-End Private">High-End Private</option>
                              </select>
                            ) : (
                              <input type="number" value={rider.sumInsured || ''} placeholder="Amount" onChange={e => handleUpdateRider(idx, 'sumInsured', Number(e.target.value))} className="w-full px-2 py-1.5 border rounded border-slate-300" />
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-6">
                            <label className="block font-medium text-slate-500 mb-1">Protection Maturity</label>
                            <input type="text" value={rider.protectionMatureDate || ''} placeholder="Age 100/Date" onChange={e => handleUpdateRider(idx, 'protectionMatureDate', e.target.value)} className="w-full px-2 py-1.5 border rounded border-slate-300" />
                          </div>
                          <div className="col-span-6">
                            <label className="block font-medium text-slate-500 mb-1">Premium Maturity</label>
                            <input type="text" value={rider.premiumMatureDate || ''} placeholder="Age 65/Date" onChange={e => handleUpdateRider(idx, 'premiumMatureDate', e.target.value)} className="w-full px-2 py-1.5 border rounded border-slate-300" />
                          </div>
                        </div>
                        {(products.find(p => p.name === rider.name)?.annualCoverageLimit || products.find(p => p.name === rider.name)?.wholeLifeCoverageLimit) ? (
                          <div className="bg-slate-100 p-2 rounded border border-slate-200 mt-2 flex justify-between items-center">
                            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                              <Activity className="w-3 h-3" />
                              Library Limits Mapped
                            </div>
                            <div className="text-xs text-slate-700 font-medium text-right flex gap-3">
                              {products.find(p => p.name === rider.name)?.annualCoverageLimit && <span>Ann: ${products.find(p => p.name === rider.name)?.annualCoverageLimit?.toLocaleString()}</span>}
                              {products.find(p => p.name === rider.name)?.wholeLifeCoverageLimit && <span>Life: ${products.find(p => p.name === rider.name)?.wholeLifeCoverageLimit?.toLocaleString()}</span>}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                    {(!editingPolicy.riders || editingPolicy.riders.length === 0) && <p className="text-xs text-slate-400 italic">No riders added.</p>}
                  </div>
                </div>

              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button
                  onClick={() => setEditingPolicy(null)}
                  className="px-4 py-2 text-slate-600 font-medium hover:text-slate-800"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSavePolicy}
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 shadow-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {t.saveChanges}
                </button>
              </div>
            </div>
          </div>
        )
      }
      {/* Edit Client Modal */}
      {
        editingClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto print:hidden">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">Edit Client Details</h3>
                <button
                  onClick={() => setEditingClient(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editingClient.name}
                    onChange={e => setEditingClient({ ...editingClient, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={editingClient.phone}
                      onChange={e => setEditingClient({ ...editingClient, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Birthday (YYYY-MM-DD)</label>
                    <input
                      type="text"
                      value={editingClient.birthday}
                      onChange={e => setEditingClient({ ...editingClient, birthday: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingClient.email}
                    onChange={e => setEditingClient({ ...editingClient, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>

                  {/* Tag Selection Dropdown */}
                  <div className="relative mb-2">
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-brand-500 appearance-none text-slate-700 transition-colors cursor-pointer"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                      value=""
                      onChange={e => {
                        const val = e.target.value;
                        if (val && !editingClient.tags.includes(val)) {
                          setEditingClient({ ...editingClient, tags: [...editingClient.tags, val] });
                        }
                      }}
                    >
                      <option value="" disabled>Select a tag...</option>
                      {availableTags.filter(t => !editingClient.tags.includes(t)).map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Tag Input */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      id="custom-tag-input"
                      className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-400"
                      placeholder="Or type custom tag..."
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val && !editingClient.tags.includes(val)) {
                            setEditingClient({ ...editingClient, tags: [...editingClient.tags, val] });
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('custom-tag-input') as HTMLInputElement;
                        const val = input.value.trim();
                        if (val && !editingClient.tags.includes(val)) {
                          setEditingClient({ ...editingClient, tags: [...editingClient.tags, val] });
                          input.value = '';
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-xs font-medium"
                    >
                      Add
                    </button>
                  </div>

                  {/* Selected Tags Display */}
                  <div className="flex flex-wrap gap-2 min-h-[24px]">
                    {editingClient.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium shadow-sm border bg-slate-100 text-slate-700 border-slate-200"
                      >
                        {tag}
                        <button
                          onClick={() => setEditingClient({ ...editingClient, tags: editingClient.tags.filter((_, i) => i !== idx) })}
                          className="ml-1.5 opacity-60 hover:opacity-100 p-0.5 hover:bg-slate-200 rounded-full transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {editingClient.tags.length === 0 && (
                      <span className="text-slate-400 text-xs italic py-1">No tags selected</span>
                    )}
                  </div>
                </div>

              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 text-slate-600 font-medium hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onUpdateClient(editingClient);
                    setEditingClient(null);
                  }}
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 shadow-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};
