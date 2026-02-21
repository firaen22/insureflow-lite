import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
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
    <div className="space-y-6 print:space-y-4">
      <style>{`
        @media print {
          @page { margin: 1cm; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-break-inside-avoid { break-inside: avoid; }
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors print:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              {client.name}
              <button
                onClick={() => setEditingClient(client)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-brand-600 transition-colors"
                title="Edit Client Details"
              >
                <Edit className="w-4 h-4" />
              </button>
            </h1>
          </div>
        </div>

        <div className="flex gap-2 print:hidden">


          {onGenerateReport && (
            <button
              onClick={onGenerateReport}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-sm text-sm font-medium"
            >
              <FileText className="w-4 h-4" />
              <span>PDF Report</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left Column: Client Info & Summary */}
        {/* Summary Totals Card */}
        <div className="bg-slate-900 rounded-xl shadow-md p-6 text-white print:bg-slate-900 print:text-white">
          <h3 className="text-brand-100 text-sm font-medium mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" /> {t.summary?.title || 'Protection Summary (HKD)'}
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-brand-200 uppercase tracking-wider mb-1">{t.summary?.totalPremium || 'Total Annual Premium'}</p>
              <p className="text-2xl font-bold">${totalAnnualPremiumHKD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-500/30">
              <div>
                <p className="text-xs text-brand-200 uppercase tracking-wider mb-1">{t.summary?.life || 'Life Coverage'}</p>
                <p className="text-lg font-semibold">${totalLifeSumInsuredHKD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <div>
                <p className="text-xs text-brand-200 uppercase tracking-wider mb-1">{t.summary?.ci || 'Critical Illness'}</p>
                <p className="text-lg font-semibold">${totalCISumInsuredHKD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">{t.contactInfo}</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                <Mail className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase">{t.email}</p>
                <p className="text-sm text-slate-700">{client.email || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                <Phone className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase">{t.phone}</p>
                <p className="text-sm text-slate-700">{client.phone || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase">{t.birthday}</p>
                <p className="text-sm text-slate-700">{client.birthday}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
              {client.tags.length > 0 ? client.tags.map(tag => (
                <span key={tag} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> {tag}
                </span>
              )) : <span className="text-xs text-slate-400 italic">No tags</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Policies Table */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              {t.policiesHeld} ({policies.length})
            </h3>
          </div>

          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 min-w-[100px]">{t.policyCard.type}</th>
                  <th className="px-4 py-3 min-w-[120px]">
                    <div className="flex flex-col">
                      <span>{t.policyCard.effectiveDate}</span>
                      <span className="text-[10px] font-normal text-slate-400 uppercase">{t.policyCard.anniversary}</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 min-w-[150px]">{t.policyCard.basePlan}</th>
                  <th className="px-4 py-3">{t.policyCard.sumInsured}</th>
                  <th className="px-4 py-3 text-right">{t.policyCard.premium}</th>
                  <th className="px-4 py-3 min-w-[150px]">{t.protectionMatureDate || 'Protection Maturity'} / {t.premiumMatureDate || 'Premium Maturity'}</th>
                  <th className="px-4 py-3 text-center">{t.policyCard.status}</th>
                  <th className="px-4 py-3 text-right print:hidden"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {policies.length > 0 ? policies.map(policy => (
                  <React.Fragment key={policy.id}>
                    <tr className="hover:bg-slate-50/80 group">
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${policy.type === 'Life' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            policy.type === 'Critical Illness' ? 'bg-red-50 text-red-700 border-red-100' :
                              policy.type === 'Medical' ? 'bg-green-50 text-green-700 border-green-100' :
                                policy.type === 'Savings' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                  'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                            {policy.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top whitespace-nowrap">
                        <div className="flex flex-col text-xs text-slate-600">
                          {policy.effectiveDate && (
                            <span className="font-medium text-slate-700">Eff: {policy.effectiveDate}</span>
                          )}
                          <span className="text-slate-400">Ann: {policy.policyAnniversaryDate}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="font-bold text-slate-800 flex items-center flex-wrap gap-2">
                          <span>{policy.planName}</span>
                          {products.find(p => p.name === policy.planName)?.isTaxDeductible && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-1 leading-none whitespace-nowrap" title={t.taxDeductible || 'Tax Deductible'}>
                              <FileText className="w-3 h-3" /> {t.taxDeductible || 'Tax Ded.'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-slate-500 mt-0.5">{policy.policyNumber}</div>
                        {!isClientInsured(policy, client.name) && (
                          <div className="text-[10px] bg-slate-100 text-slate-600 px-1.5 rounded mt-1 inline-flex items-center gap-1 border border-slate-200" title="Insured Person">
                            <Shield className="w-3 h-3" /> Insured: {policy.insuredName}
                          </div>
                        )}
                        {policy.medicalPlanType && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 rounded mt-1 inline-block border border-blue-200">
                            {['High-End Semi-Private', 'High-End Private'].includes(policy.medicalPlanType as string) ? 'High-End Medical' : policy.medicalPlanType}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top">
                        {policy.sumInsured ? (
                          <span className="font-medium text-slate-700">${policy.sumInsured.toLocaleString()}</span>
                        ) : '-'}
                        {policy.isMultipay && <div className="text-[10px] text-brand-600 font-medium">Multipay</div>}
                      </td>
                      <td className="px-4 py-4 align-top text-right">
                        <div className="font-bold text-slate-800">
                          {policy.currency} ${policy.premiumAmount.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-400">{policy.paymentMode}</div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col text-xs mt-1">
                          <span className="text-slate-600"><span className="text-slate-400 w-12 inline-block">Prot:</span> {policy.protectionMatureDate || '-'}</span>
                          <span className="text-slate-600"><span className="text-slate-400 w-12 inline-block">Prem:</span> {policy.premiumMatureDate || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top text-center">
                        <span className={`inline-flex w-2.5 h-2.5 rounded-full ${policy.status === 'Active' ? 'bg-green-500' :
                          policy.status === 'Pending' ? 'bg-amber-500' : 'bg-red-500'
                          }`} title={policy.status}></span>
                      </td>
                      <td className="px-4 py-4 align-top text-right print:hidden">
                        <div className="flex justify-end gap-1 opacity-10 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingPolicy(policy)}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(policy.id)}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-red-600"
                          >
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

        {/* Meeting Logs Section (New) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              {meetingsT.title} ({(client.meetingLogs || []).length})
            </h3>
            <button
              onClick={() => setIsAddMeetingOpen(true)}
              className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors font-medium flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> {meetingsT.addLog}
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar">
            {(client.meetingLogs || []).length > 0 ? [...(client.meetingLogs || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
              <div key={log.id} className="relative pl-6 pb-6 border-l-2 border-slate-100 last:pb-0">
                <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-brand-500 shadow-sm" />
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">{log.date}</span>
                  <div className="flex items-center gap-2">

                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200">{meetingsT.types?.[log.type.replace(/\s+/g, '')] || log.type}</span>
                    <button
                      onClick={() => {
                        if (window.confirm(meetingsT.deleteConfirm)) {
                          const updatedLogs = (client.meetingLogs || []).filter(l => l.id !== log.id);
                          onUpdateClient({ ...client, meetingLogs: updatedLogs });
                        }
                      }}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                  </div>
                </div>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">{log.summary}</p>
                {log.rawNotes && (
                  <details className="mt-2 group">
                    <summary className="text-[10px] text-slate-400 cursor-pointer hover:text-brand-600 font-bold uppercase transition-colors list-none flex items-center gap-1">
                      <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                      {meetingsT.notes}
                    </summary>
                    <div className="mt-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-500 whitespace-pre-wrap italic border border-slate-100">
                      {log.rawNotes}
                    </div>
                  </details>
                )}
              </div>
            )) : (
              <div className="text-center py-10">
                <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm italic">{meetingsT.noLogs}</p>
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
                        <option value="Life">Life</option>
                        <option value="Medical">Medical</option>
                        <option value="Critical Illness">Critical Illness</option>
                        <option value="Savings">Savings</option>
                        <option value="Accident">Accident</option>
                        <option value="Hospital Income">Hospital Income</option>
                        <option value="Auto">Auto</option>
                        <option value="Property">Property</option>
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
                      </>
                    )}

                    {/* Savings */}
                    {editingPolicy.type === 'Savings' && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{t.policyCard.capital}</label>
                        <input type="number" value={editingPolicy.capitalInvested || ''} onChange={e => handleUpdateField('capitalInvested', Number(e.target.value))} className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded" />
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
                            <input type="text" value={rider.name} placeholder="Plan / Rider Name" onChange={e => handleUpdateRider(idx, 'name', e.target.value)} className="w-full px-2 py-1.5 border rounded border-slate-300" />
                          </div>
                          <div className="col-span-4">
                            <label className="block font-medium text-slate-500 mb-1">Type</label>
                            <select value={rider.type || 'Other'} onChange={e => handleUpdateRider(idx, 'type', e.target.value)} className="w-full px-2 py-1.5 border rounded border-slate-300 bg-slate-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-brand-500 transition-colors cursor-pointer appearance-none" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.25rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em', paddingRight: '1.5rem' }}>
                              <option value="" disabled>Select Type...</option>
                              <option value="Medical">Medical</option>
                              <option value="Accident">Accident</option>
                              <option value="Critical Illness">Critical Illness</option>
                              <option value="Hospital Income">Hospital Income</option>
                              <option value="Life">Life</option>
                              <option value="Savings">Savings</option>
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
