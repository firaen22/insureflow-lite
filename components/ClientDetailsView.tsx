import React, { useState } from 'react';
import { ArrowLeft, Mail, Phone, Calendar, Clock, Shield, Tag, Layers, Download, ExternalLink, Pencil, Trash2, Save, X, Plus, ChevronDown, Activity, DollarSign, AlertTriangle } from 'lucide-react';
import { Client, PolicyData, Product, Rider } from '../types';
import { TRANSLATIONS } from '../constants';

interface ClientDetailsViewProps {
  t: typeof TRANSLATIONS['en']['clientDetails'];
  client: Client;
  policies: PolicyData[];
  products: Product[];
  onUpdateClient: (client: Client) => void;
  onUpdatePolicy: (policy: PolicyData) => void;
  onDeletePolicy: (policyId: string) => void;
  onBack: () => void;
}

export const ClientDetailsView: React.FC<ClientDetailsViewProps> = ({ t, client, policies, products, onUpdateClient, onUpdatePolicy, onDeletePolicy, onBack }) => {
  const [editingPolicy, setEditingPolicy] = useState<PolicyData | null>(null);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editedClient, setEditedClient] = useState<Client>({ ...client });

  // Reset editedClient if prop changes
  React.useEffect(() => {
    if (!isEditingClient) setEditedClient({ ...client });
  }, [client, isEditingClient]);

  const handleSaveClient = () => {
    onUpdateClient(editedClient);
    setIsEditingClient(false);
  };

  // Calculate stats
  const totalPremiums = policies.reduce((acc, p) => {
    // Base premium
    let policyTotal = p.premiumAmount;

    // Add Riders
    if (p.riders) {
      policyTotal += p.riders.reduce((rSum, r) => rSum + r.premiumAmount, 0);
    }

    // Convert to Annual for display estimation (simplified logic)
    let annualMultiplier = 1;
    if (p.paymentMode === 'Monthly') annualMultiplier = 12;
    if (p.paymentMode === 'Quarterly') annualMultiplier = 4;
    if (p.paymentMode === 'Half-Yearly') annualMultiplier = 2;

    const curr = p.currency || 'HKD';
    acc[curr] = (acc[curr] || 0) + (policyTotal * annualMultiplier);
    return acc;
  }, {} as Record<string, number>);

  const handleEditClick = (policy: PolicyData) => {
    setEditingPolicy({ ...policy });
  };

  const handleDeleteClick = (policyId: string) => {
    if (window.confirm(t.deleteConfirm)) {
      onDeletePolicy(policyId);
    }
  };

  const handleSavePolicy = () => {
    if (editingPolicy) {
      onUpdatePolicy(editingPolicy);
      setEditingPolicy(null);
    }
  };

  const handleGenerateReport = () => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      alert("Please allow popups to generate the report.");
      return;
    }

    const today = new Date().toLocaleDateString();

    const reportContent = `
      <html>
        <head>
          <title>Client Summary - ${client.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #334155; }
            h1 { color: #1e293b; margin-bottom: 5px; }
            h2 { color: #475569; font-size: 18px; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            .meta { color: #64748b; font-size: 14px; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { text-align: left; padding: 12px 8px; border-bottom: 2px solid #cbd5e1; color: #475569; font-weight: 600; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
            .total-row { font-weight: bold; background-color: #f8fafc; }
            .footer { margin-top: 50px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; }
            .active { background: #dcfce7; color: #166534; }
            .pending { background: #fef3c7; color: #b45309; }
          </style>
        </head>
        <body>
          <h1>${client.name}</h1>
          <div class="meta">
            <p>ID: ${client.id} | Status: ${client.status}</p>
            <p>Generated: ${today}</p>
          </div>

          <h2>Client Information</h2>
          <p><strong>Email:</strong> ${client.email}</p>
          <p><strong>Phone:</strong> ${client.phone}</p>
          <p><strong>Birthday:</strong> ${client.birthday}</p>

          <h2>Policy Summary</h2>
          <table>
            <thead>
              <tr>
                <th>Policy No.</th>
                <th>Plan Name</th>
                <th>Type</th>
                <th>Anniversary</th>
                <th>Maturity Date</th>
                <th>Total Premium</th>
                <th>Mode</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${policies.map(p => {
      let totalPrem = p.premiumAmount;
      if (p.riders) totalPrem += p.riders.reduce((s, r) => s + r.premiumAmount, 0);
      const curr = p.currency || 'HKD';
      return `
                  <tr>
                    <td>${p.policyNumber}</td>
                    <td>${p.planName}</td>
                    <td>${p.type}</td>
                    <td>${p.policyAnniversaryDate}</td>
                    <td>${p.maturityDate || '-'}</td>
                    <td>${curr} $${totalPrem.toLocaleString()}</td>
                    <td>${p.paymentMode}</td>
                    <td><span class="badge ${p.status === 'Active' ? 'active' : 'pending'}">${p.status}</span></td>
                  </tr>
                 `;
    }).join('')}
              
              <tr class="total-row">
                <td colspan="5" style="text-align: right; padding-right: 15px;">Total Annual Premium (Est.)</td>
                <td colspan="3">
                  ${Object.entries(totalPremiums).map(([c, v]) => `<div>${c} $${v.toLocaleString()}</div>`).join('')}
                </td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            Generated by InsureFlow Lite
          </div>
          
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    reportWindow.document.write(reportContent);
    reportWindow.document.close();
  };

  const handleUpdateField = (field: keyof PolicyData, value: any) => {
    if (editingPolicy) {
      setEditingPolicy({ ...editingPolicy, [field]: value });
    }
  };

  const handleUpdateRider = (index: number, field: keyof Rider, value: any) => {
    if (editingPolicy && editingPolicy.riders) {
      const updatedRiders = [...editingPolicy.riders];
      updatedRiders[index] = { ...updatedRiders[index], [field]: value };
      setEditingPolicy({ ...editingPolicy, riders: updatedRiders });
    }
  };

  const handleAddRider = () => {
    if (editingPolicy) {
      setEditingPolicy({
        ...editingPolicy,
        riders: [...(editingPolicy.riders || []), { name: '', type: editingPolicy.type, premiumAmount: 0 }]
      });
    }
  };

  const handleRemoveRider = (index: number) => {
    if (editingPolicy && editingPolicy.riders) {
      setEditingPolicy({
        ...editingPolicy,
        riders: editingPolicy.riders.filter((_, i) => i !== index)
      });
    }
  };

  // Helper to render plan specifics in View Mode
  const renderPlanSpecifics = (policy: PolicyData) => {
    const details = [];

    // Medical
    if (policy.type === 'Medical') {
      if (policy.medicalPlanType) details.push({ label: t.policyCard.roomType, value: policy.medicalPlanType });
      if (policy.medicalExcess) details.push({ label: t.policyCard.excess, value: `$${policy.medicalExcess.toLocaleString()}` });
    }

    // Life, CI, Accident (Sum Insured)
    if (['Life', 'Critical Illness', 'Accident'].includes(policy.type) && policy.sumInsured) {
      details.push({ label: t.policyCard.sumInsured, value: `$${policy.sumInsured.toLocaleString()}` });
    }

    // Critical Illness Specifics
    if (policy.type === 'Critical Illness' && policy.isMultipay !== undefined) {
      details.push({ label: t.policyCard.multipay, value: policy.isMultipay ? 'Yes' : 'No' });
    }

    // Term Life (End Date) - Assuming 'Life' type covers Term
    if (policy.type === 'Life' && policy.policyEndDate) {
      details.push({ label: t.policyCard.endDate, value: policy.policyEndDate });
    }

    // Savings
    if (policy.type === 'Savings' && policy.capitalInvested) {
      details.push({ label: t.policyCard.capital, value: `$${policy.capitalInvested.toLocaleString()}` });
    }

    // Accident Specifics
    if (policy.type === 'Accident') {
      if (policy.accidentMedicalLimit) details.push({ label: t.policyCard.accidentLimit, value: `$${policy.accidentMedicalLimit.toLocaleString()}` });
      if (policy.accidentSectionLimit) details.push({ label: t.policyCard.sectionLimit, value: `$${policy.accidentSectionLimit.toLocaleString()}` });
      if (policy.accidentPhysioVisits) details.push({ label: t.policyCard.physio, value: `${policy.accidentPhysioVisits}` });
    }

    // Maturity Date (Any Type)
    if (policy.maturityDate) {
      details.push({ label: 'Maturity Date', value: policy.maturityDate });
    }

    // Cash Values (Any Type)
    if (policy.cashValue) details.push({ label: 'Guaranteed Cash Value', value: `$${policy.cashValue.toLocaleString()}` });
    if (policy.accumulatedDividend) details.push({ label: 'Accumulated Div.', value: `$${policy.accumulatedDividend.toLocaleString()}` });
    if (policy.totalCashValue) details.push({ label: 'Total Surrender Value', value: `$${policy.totalCashValue.toLocaleString()}` });

    if (details.length === 0) return null;

    return (
      <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/50 -mx-5 px-5 pb-2">
        <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1 uppercase">
          <Activity className="w-3 h-3" />
          Plan Details
        </p>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
          {details.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-slate-500">{item.label}</span>
              <span className="font-medium text-slate-700 text-right">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{client.name}</h1>
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <span className={`inline-block w-2 h-2 rounded-full ${client.status === 'Active' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
              <span>{client.status}</span>
              <span>•</span>
              <span>ID: {client.id}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerateReport}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          <span>Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative group">
            <div className="flex justify-between items-start mb-4">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-500" />
                {t.contactInfo}
              </h2>
              <button
                onClick={() => setIsEditingClient(!isEditingClient)}
                className="text-slate-400 hover:text-brand-600 transition-colors"
              >
                {isEditingClient ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
              </button>
            </div>

            {isEditingClient ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <label className="text-xs text-slate-400 font-medium uppercase">Name</label>
                  <input
                    type="text"
                    value={editedClient.name}
                    onChange={(e) => setEditedClient({ ...editedClient, name: e.target.value })}
                    className="w-full text-sm border-b border-slate-300 focus:border-brand-500 focus:outline-none py-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium uppercase">Email</label>
                  <input
                    type="email"
                    value={editedClient.email}
                    onChange={(e) => setEditedClient({ ...editedClient, email: e.target.value })}
                    className="w-full text-sm border-b border-slate-300 focus:border-brand-500 focus:outline-none py-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium uppercase">Phone</label>
                  <input
                    type="tel"
                    value={editedClient.phone}
                    onChange={(e) => setEditedClient({ ...editedClient, phone: e.target.value })}
                    className="w-full text-sm border-b border-slate-300 focus:border-brand-500 focus:outline-none py-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium uppercase">Birthday</label>
                  <input
                    type="date"
                    value={editedClient.birthday}
                    onChange={(e) => setEditedClient({ ...editedClient, birthday: e.target.value })}
                    className="w-full text-sm border-b border-slate-300 focus:border-brand-500 focus:outline-none py-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium uppercase">Status</label>
                  <select
                    value={editedClient.status}
                    onChange={(e) => setEditedClient({ ...editedClient, status: e.target.value as 'Active' | 'Lead' })}
                    className="w-full text-sm border-b border-slate-300 focus:border-brand-500 focus:outline-none py-1 bg-transparent"
                  >
                    <option value="Active">Active</option>
                    <option value="Lead">Lead</option>
                  </select>
                </div>
                <button
                  onClick={handleSaveClient}
                  className="w-full py-2 bg-brand-600 text-white rounded text-sm font-medium hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  <Save className="w-3 h-3" /> Save Contact
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-slate-400 mt-1" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase">{t.email}</p>
                    <p className="text-sm text-slate-700 break-all">{client.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-slate-400 mt-1" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase">{t.phone}</p>
                    <p className="text-sm text-slate-700">{client.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-slate-400 mt-1" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase">{t.birthday}</p>
                    <p className="text-sm text-slate-700">{client.birthday}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-slate-400 mt-1" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase">{t.lastContact}</p>
                    <p className="text-sm text-slate-700">{client.lastContact}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex flex-wrap gap-2">
                {client.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    <Tag className="w-3 h-3 mr-1 opacity-50" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Summary Card */}
          <div className="bg-brand-600 rounded-xl shadow-md p-6 text-white">
            <h3 className="text-brand-100 text-sm font-medium mb-1">{t.totalAnnualPremium}</h3>
            {Object.keys(totalPremiums).length > 0 ? (
              Object.entries(totalPremiums).map(([curr, val]) => (
                <p key={curr} className="text-3xl font-bold mb-1 last:mb-4">
                  <span className="text-lg opacity-80 mr-1">{curr}</span>
                  ${val.toLocaleString()}
                </p>
              ))
            ) : (
              <p className="text-3xl font-bold mb-4">$0</p>
            )}

            <div className="flex items-center justify-between text-sm border-t border-brand-500 pt-4 mt-2">
              <span className="text-brand-100">{t.totalPolicies}</span>
              <span className="font-semibold bg-white/20 px-2 py-0.5 rounded">{policies.length}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Policies List */}
        <div className="lg:col-span-2">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-500" />
            {t.policiesHeld}
          </h2>

          <div className="space-y-4">
            {policies.length > 0 ? (
              policies.map(policy => {
                const totalPolicyPrem = policy.premiumAmount + (policy.riders?.reduce((sum, r) => sum + r.premiumAmount, 0) || 0);

                return (
                  <div key={policy.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-brand-300 transition-colors group relative">
                    {/* Policy Header */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-800">{policy.planName}</h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${policy.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                            {policy.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono">{t.policyCard.policyNo}: {policy.policyNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-brand-700">
                          <span className="text-sm font-normal text-slate-500 mr-1">{policy.currency || 'HKD'}</span>
                          ${totalPolicyPrem.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">{policy.paymentMode}</p>
                      </div>
                    </div>

                    {/* Policy Body */}
                    <div className="p-5">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">{t.policyCard.type}</p>
                          <p className="text-sm font-medium text-slate-700">{policy.type}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">{t.policyCard.anniversary}</p>
                          <p className="text-sm font-medium text-slate-700">{policy.policyAnniversaryDate}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">{t.policyCard.premium}</p>
                          <p className="text-sm font-medium text-slate-700">
                            Base: ${policy.premiumAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* NEW: Render specific details based on plan type */}
                      {renderPlanSpecifics(policy)}

                      {/* Riders Section */}
                      {policy.riders && policy.riders.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {t.policyCard.riders}
                          </p>
                          <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                            {policy.riders.map((rider, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">{rider.name}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded">{rider.type}</span>
                                  {rider.sumInsured && <span className="text-[10px] text-slate-500 mr-2">SI: ${rider.sumInsured.toLocaleString()}</span>}
                                  <span className="font-medium text-slate-700 w-16 text-right">+${rider.premiumAmount.toLocaleString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 p-2 border-t border-slate-100 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditClick(policy)}
                        className="text-xs text-slate-500 hover:text-brand-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-200 transition-colors"
                      >
                        <Pencil className="w-3 h-3" /> {t.editPolicy}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(policy.id)}
                        className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> {t.deletePolicy}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500">{t.noPolicies}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Policy Modal */}
      {editingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.policyCard.basePlan}</label>
                <input
                  list="edit-plan-options"
                  type="text"
                  value={editingPolicy.planName}
                  onChange={e => {
                    const val = e.target.value;
                    const product = products.find(p => p.name === val);
                    setEditingPolicy(prev => prev ? ({
                      ...prev,
                      planName: val,
                      type: product ? product.type : prev.type
                    }) : null);
                  }}
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t.policyCard.type}</label>
                  <div className="relative">
                    <select
                      value={editingPolicy.type}
                      onChange={e => handleUpdateField('type', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none bg-white"
                    >
                      <option value="Life">Life</option>
                      <option value="Medical">Medical</option>
                      <option value="Auto">Auto</option>
                      <option value="Property">Property</option>
                      <option value="Critical Illness">Critical Illness</option>
                      <option value="Savings">Savings</option>
                      <option value="Accident">Accident</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Dynamic Edit Fields based on Type */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Plan Details
                </h4>

                {/* Medical Specifics */}
                {editingPolicy.type === 'Medical' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">{t.policyCard.roomType}</label>
                      <select
                        value={editingPolicy.medicalPlanType || 'Ward'}
                        onChange={e => handleUpdateField('medicalPlanType', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="Ward">Ward</option>
                        <option value="Semi-Private">Semi-Private</option>
                        <option value="Private">Private</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">{t.policyCard.excess} ($)</label>
                      <input
                        type="number"
                        value={editingPolicy.medicalExcess || ''}
                        placeholder="0"
                        onChange={e => handleUpdateField('medicalExcess', Number(e.target.value))}
                        className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                )}

                {/* Life/CI/Accident/Rider Sum Insured */}
                {['Life', 'Critical Illness', 'Accident', 'Rider'].includes(editingPolicy.type) && (
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-slate-600 mb-1">{t.policyCard.sumInsured} ($)</label>
                    <input
                      type="number"
                      value={editingPolicy.sumInsured || ''}
                      onChange={e => handleUpdateField('sumInsured', Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                )}

                {/* CI Multipay */}
                {editingPolicy.type === 'Critical Illness' && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="multipay-check"
                      checked={!!editingPolicy.isMultipay}
                      onChange={e => handleUpdateField('isMultipay', e.target.checked)}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <label htmlFor="multipay-check" className="text-xs font-medium text-slate-700">{t.policyCard.multipay}</label>
                  </div>
                )}

                {/* Life (Term) End Date */}
                {editingPolicy.type === 'Life' && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-slate-600 mb-1">{t.policyCard.endDate}</label>
                    <input
                      type="date"
                      value={editingPolicy.policyEndDate || ''}
                      onChange={e => handleUpdateField('policyEndDate', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                )}

                {/* Savings Capital */}
                {editingPolicy.type === 'Savings' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">{t.policyCard.capital} ($)</label>
                    <input
                      type="number"
                      value={editingPolicy.capitalInvested || ''}
                      onChange={e => handleUpdateField('capitalInvested', Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                )}

                {/* Accident Specifics */}
                {editingPolicy.type === 'Accident' && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">{t.policyCard.accidentLimit} ($)</label>
                      <input
                        type="number"
                        value={editingPolicy.accidentMedicalLimit || ''}
                        onChange={e => handleUpdateField('accidentMedicalLimit', Number(e.target.value))}
                        className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">{t.policyCard.sectionLimit} ($)</label>
                      <input
                        type="number"
                        value={editingPolicy.accidentSectionLimit || ''}
                        onChange={e => handleUpdateField('accidentSectionLimit', Number(e.target.value))}
                        className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">{t.policyCard.physio}</label>
                      <input
                        type="number"
                        value={editingPolicy.accidentPhysioVisits || ''}
                        onChange={e => handleUpdateField('accidentPhysioVisits', Number(e.target.value))}
                        className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                )}

                {/* Policy Values (General) */}
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <h5 className="text-[10px] bg-slate-200 text-slate-600 px-1 rounded inline-block mb-2">Statement Values</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Guaranteed Cash ($)</label>
                      <input
                        type="number"
                        value={editingPolicy.cashValue || ''}
                        onChange={e => handleUpdateField('cashValue', Number(e.target.value))}
                        className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Accumulated Div. ($)</label>
                      <input
                        type="number"
                        value={editingPolicy.accumulatedDividend || ''}
                        onChange={e => handleUpdateField('accumulatedDividend', Number(e.target.value))}
                        className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Total Surrender Value ($)</label>
                      <input
                        type="number"
                        value={editingPolicy.totalCashValue || ''}
                        onChange={e => handleUpdateField('totalCashValue', Number(e.target.value))}
                        className="w-full px-2 py-1.5 text-sm border border-brand-300 bg-brand-50 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t.policyCard.premium}</label>
                  <div className="flex gap-2">
                    <select
                      value={editingPolicy.currency || 'HKD'}
                      onChange={e => handleUpdateField('currency', e.target.value)}
                      className="w-20 px-2 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    >
                      <option value="HKD">HKD</option>
                      <option value="USD">USD</option>
                    </select>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2 text-slate-500">$</span>
                      <input
                        type="number"
                        value={editingPolicy.premiumAmount}
                        onChange={e => handleUpdateField('premiumAmount', Number(e.target.value))}
                        className="w-full pl-6 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t.policyCard.anniversary}</label>
                  <input
                    type="text"
                    value={editingPolicy.policyAnniversaryDate}
                    onChange={e => handleUpdateField('policyAnniversaryDate', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="DD/MM"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Maturity Date (YYYY-MM-DD)</label>
                <input
                  type="date"
                  value={editingPolicy.maturityDate || ''}
                  onChange={e => handleUpdateField('maturityDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t.policyCard.paymentMode}</label>
                  <div className="relative">
                    <select
                      value={editingPolicy.paymentMode}
                      onChange={e => handleUpdateField('paymentMode', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none bg-white"
                    >
                      <option value="Yearly">Yearly</option>
                      <option value="Half-Yearly">Half-Yearly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t.policyCard.status}</label>
                  <div className="relative">
                    <select
                      value={editingPolicy.status}
                      onChange={e => handleUpdateField('status', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none bg-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Expired">Expired</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Riders Section */}
              <div className="pt-2 border-t border-slate-200 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                    <Layers className="w-4 h-4 text-slate-500" />
                    {t.policyCard.riders}
                  </label>
                  <button
                    onClick={handleAddRider}
                    className="text-xs text-brand-600 font-medium hover:underline flex items-center"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </button>
                </div>

                <div className="space-y-3">
                  {editingPolicy.riders?.map((rider, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 relative">
                      <button
                        onClick={() => handleRemoveRider(idx)}
                        className="absolute right-2 top-2 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <div className="grid grid-cols-1 gap-2">
                        <input
                          type="text"
                          value={rider.name}
                          placeholder="Name"
                          onChange={(e) => handleUpdateRider(idx, 'name', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                        />
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <input
                              type="number"
                              value={rider.premiumAmount}
                              placeholder="Prem"
                              onChange={(e) => handleUpdateRider(idx, 'premiumAmount', parseFloat(e.target.value))}
                              className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                            />
                          </div>
                          <div className="flex-1">
                            <select
                              value={rider.type}
                              onChange={(e) => handleUpdateRider(idx, 'type', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                            >
                              <option value="Medical">Medical</option>
                              <option value="Accident">Accident</option>
                              <option value="Life">Life</option>
                              <option value="Critical Illness">Critical Illness</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <input
                              type="number"
                              value={rider.sumInsured || ''}
                              placeholder="SI ($)"
                              onChange={(e) => handleUpdateRider(idx, 'sumInsured', parseFloat(e.target.value))}
                              className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!editingPolicy.riders || editingPolicy.riders.length === 0) && (
                    <p className="text-xs text-slate-400 italic text-center py-2">No riders.</p>
                  )}
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
      )}
    </div>
  );
};
