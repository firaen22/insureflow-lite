import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { Client, PolicyData, Product } from '../types';
import {
  ArrowLeft, Mail, Phone, Calendar, Clock, Tag,
  Trash2, Edit, Save, X, Plus, ChevronDown,
  FileText, Layers, Activity, Shield
} from 'lucide-react';

interface ClientDetailsViewProps {
  client: Client;
  policies: PolicyData[];
  onBack: () => void;
  onDeletePolicy: (policyId: string) => void;
  onUpdatePolicy: (updatedPolicy: PolicyData) => void;
  products: Product[];
  t: typeof TRANSLATIONS['en']['clientDetails'];
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
  onGenerateReport,
  onUpdateClient,
  availableTags = []
}) => {
  const [editingPolicy, setEditingPolicy] = useState<PolicyData | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

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
  const totalAnnualPremiumHKD = policies.reduce((sum, p) => {
    let amount = p.premiumAmount || 0;
    if (p.currency === 'USD') amount = amount * 7.8;
    return sum + amount;
  }, 0);

  const totalCISumInsuredHKD = policies.reduce((sum, p) => {
    let val = 0;
    // Base Plan
    if (p.type === 'Critical Illness') {
      val += p.sumInsured || 0;
    }
    // Riders
    if (p.riders) {
      val += p.riders
        .filter(r => r.type === 'Critical Illness')
        .reduce((rSum, r) => rSum + (r.sumInsured || 0), 0);
    }
    // Currency (Assuming SI matches Policy Currency)
    if (p.currency === 'USD') val = val * 7.8;
    return sum + val;
  }, 0);

  const totalLifeSumInsuredHKD = policies.reduce((sum, p) => {
    let val = 0;
    if (p.type === 'Life') {
      val += p.sumInsured || 0;
    }
    if (p.riders) {
      val += p.riders
        .filter(r => r.type === 'Life')
        .reduce((rSum, r) => rSum + (r.sumInsured || 0), 0);
    }
    if (p.currency === 'USD') val = val * 7.8;
    return sum + val;
  }, 0);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Client Info & Summary */}
        <div className="space-y-6">
          {/* Summary Totals Card */}
          <div className="bg-slate-900 rounded-xl shadow-md p-6 text-white print:bg-slate-900 print:text-white">
            <h3 className="text-brand-100 text-sm font-medium mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Protection Summary (HKD)
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-brand-200 uppercase tracking-wider mb-1">Total Annual Premium</p>
                <p className="text-2xl font-bold">${totalAnnualPremiumHKD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-500/30">
                <div>
                  <p className="text-xs text-brand-200 uppercase tracking-wider mb-1">Life Coverage</p>
                  <p className="text-lg font-semibold">${totalLifeSumInsuredHKD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div>
                  <p className="text-xs text-brand-200 uppercase tracking-wider mb-1">Critical Illness</p>
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

        {/* Right Column: Policies Table */}
        <div className="lg:col-span-2 space-y-6">
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
                    <th className="px-4 py-3 min-w-[150px]">{t.policyCard.basePlan}</th>
                    <th className="px-4 py-3">{t.policyCard.sumInsured}</th>
                    <th className="px-4 py-3 text-right">{t.policyCard.premium}</th>
                    <th className="px-4 py-3 min-w-[180px]">{t.policyCard.riders}</th>
                    <th className="px-4 py-3 text-center">{t.policyCard.status}</th>
                    <th className="px-4 py-3 text-right print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {policies.length > 0 ? policies.map(policy => (
                    <tr key={policy.id} className="hover:bg-slate-50/80 group">
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
                          <span className="text-[10px] text-slate-400 font-mono">{policy.effectiveDate || policy.policyAnniversaryDate}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="font-bold text-slate-800">{policy.planName}</div>
                        <div className="text-xs font-mono text-slate-500 mt-0.5">{policy.policyNumber}</div>
                        {policy.medicalPlanType && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 rounded mt-1 inline-block">
                            {policy.medicalPlanType}
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
                        {policy.riders && policy.riders.length > 0 ? (
                          <div className="space-y-1">
                            {policy.riders.map((r, idx) => (
                              <div key={idx} className="text-xs flex justify-between bg-slate-50 p-1.5 rounded border border-slate-100">
                                <span className="text-slate-600 truncate max-w-[100px]" title={r.name}>{r.name}</span>
                                <span className="font-medium text-slate-500">${r.premiumAmount.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        ) : <span className="text-slate-300">-</span>}
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
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        {t.noPolicies}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

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
                  <input
                    list="edit-plan-options"
                    type="text"
                    value={editingPolicy.planName}
                    onChange={e => setEditingPolicy({ ...editingPolicy, planName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <datalist id="edit-plan-options">
                    {products.map(p => (
                      <option key={p.name} value={p.name}>{p.provider} - {p.type}</option>
                    ))}
                  </datalist>
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.policyCard.type}</label>
                    <div className="relative">
                      <select
                        value={editingPolicy.type}
                        onChange={e => handleUpdateField('type', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg appearance-none bg-white"
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

                {/* Type Specific Fields */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Plan Details
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Sum Insured - Generic */}
                    {['Life', 'Critical Illness', 'Accident'].includes(editingPolicy.type) && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{t.policyCard.sumInsured}</label>
                        <input type="number" value={editingPolicy.sumInsured || ''} onChange={e => handleUpdateField('sumInsured', Number(e.target.value))} className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded" />
                      </div>
                    )}

                    {/* Medical */}
                    {editingPolicy.type === 'Medical' && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">{t.policyCard.roomType}</label>
                          <select value={editingPolicy.medicalPlanType || 'Ward'} onChange={e => handleUpdateField('medicalPlanType', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded">
                            <option value="Ward">Ward</option>
                            <option value="Semi-Private">Semi-Private</option>
                            <option value="Private">Private</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">{t.policyCard.excess}</label>
                          <input type="number" value={editingPolicy.medicalExcess || ''} onChange={e => handleUpdateField('medicalExcess', Number(e.target.value))} className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded" />
                        </div>
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
                  <div className="space-y-2">
                    {editingPolicy.riders?.map((rider, idx) => (
                      <div key={idx} className="flex gap-2 items-start bg-slate-50 p-2 rounded">
                        <input type="text" value={rider.name} placeholder="Name" onChange={e => handleUpdateRider(idx, 'name', e.target.value)} className="flex-1 px-2 py-1 text-xs border rounded" />
                        <input type="number" value={rider.premiumAmount} placeholder="Prem" onChange={e => handleUpdateRider(idx, 'premiumAmount', Number(e.target.value))} className="w-16 px-2 py-1 text-xs border rounded" />
                        <input type="number" value={rider.sumInsured || ''} placeholder="SI" onChange={e => handleUpdateRider(idx, 'sumInsured', Number(e.target.value))} className="w-20 px-2 py-1 text-xs border rounded" />
                        <button onClick={() => handleRemoveRider(idx)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
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
      {editingClient && (
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none bg-white text-slate-700"
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
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
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
