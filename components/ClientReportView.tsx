import React, { useRef, useState } from 'react';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { Client, PolicyData } from '../types';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import {
    calculateTotalAnnualPremiumHKD,
    calculateTotalCISumInsuredHKD,
    calculateTotalLifeSumInsuredHKD
} from '../utils/policyCalculations';

interface ClientReportViewProps {
    client: Client;
    policies: PolicyData[];
    onBack: () => void;
}

export const ClientReportView: React.FC<ClientReportViewProps> = ({ client, policies, onBack }) => {
    const reportRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Calculate totals using shared utility
    const totalLifeSA = calculateTotalLifeSumInsuredHKD(policies, client.name);
    const totalCISA = calculateTotalCISumInsuredHKD(policies, client.name);
    const totalPremiumHKD = calculateTotalAnnualPremiumHKD(policies);

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;
        setIsGenerating(true);

        try {
            // 1. Capture the report as a high-quality image
            const dataUrl = await toPng(reportRef.current, {
                quality: 1.0,
                pixelRatio: 2, // Higher resolution
                backgroundColor: '#ffffff'
            });

            // 2. Create PDF (Landscape A4)
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${client.name}_Report.pdf`);
        } catch (err) {
            console.error('Failed to generate PDF', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const formatCurrency = (amount: number, currency: string = 'HKD') => {
        return new Intl.NumberFormat('en-HK', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return dateStr;
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header / Actions */}
            <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Details
                </button>
                <h1 className="text-lg font-bold text-slate-800">Client Report Preview</h1>
                <button
                    onClick={handleDownloadPDF}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {isGenerating ? 'Generating...' : 'Download PDF'}
                </button>
            </div>

            {/* Scrollable Preview Area */}
            <div className="flex-1 overflow-auto p-8 flex justify-center">
                {/* Report Container - A4 Landscape Approximate Aspect Ratio */}
                <div
                    ref={reportRef}
                    className="w-[1123px] min-h-[794px] bg-white shadow-2xl p-6 text-slate-900 origin-top transform scale-90" // Scale for preview visibility
                    style={{ fontFamily: 'Inter, sans-serif' }}
                >
                    {/* Header Section */}
                    <div className="flex items-center gap-2 mb-6 border-b-2 border-blue-500 pb-2">
                        <div className="w-0 h-0 border-l-[20px] border-l-transparent border-b-[30px] border-b-blue-600 border-r-[20px] border-r-transparent relative top-4 -left-2 rotate-45 transform origin-center"></div> {/* Abstract Logo Placeholder */}
                        <div className="bg-blue-600 text-white px-6 py-2 rounded-tr-xl skew-x-[-20deg] ml-[-10px]">
                            <span className="skew-x-[20deg] font-bold text-lg tracking-wide">保障 Protection</span>
                        </div>
                    </div>

                    {/* Top Summary Bar (Horizontal) */}
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{client.name}</h2>
                                <p className="text-sm text-slate-500">Age: {client.birthday ? new Date().getFullYear() - new Date(client.birthday).getFullYear() : '-'}</p>
                            </div>
                            <div className="h-8 w-px bg-slate-200"></div>
                            <div>
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-0.5 tracking-wider">Total Life Protection</div>
                                <div className="text-lg font-bold text-blue-600">{formatCurrency(totalLifeSA)}</div>
                            </div>
                            <div className="h-8 w-px bg-slate-200"></div>
                            <div>
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-0.5 tracking-wider">Total CI Protection</div>
                                <div className="text-lg font-bold text-red-500">{formatCurrency(totalCISA)}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-0.5 tracking-wider">Total Annual Premium</div>
                            <div className="text-xl font-bold text-slate-900">{formatCurrency(totalPremiumHKD)}</div>
                        </div>
                    </div>

                    {/* Main Content (Policy Table Full Width) */}
                    <div className="w-full">
                        <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden">
                            {/* Headers */}
                            <div className="grid grid-cols-12 bg-white border-b border-slate-200 text-center text-xs font-bold text-slate-600">
                                {/* Basic Info Header */}
                                <div className="col-span-6 border-r border-slate-200">
                                    <div className="py-2 bg-orange-100/50 border-b border-orange-200 text-orange-800">基本資料 Basic Info</div>
                                    <div className="grid grid-cols-6 py-2">
                                        <div className="col-span-2">Company / Plan</div>
                                        <div className="col-span-1">Effective</div>
                                        <div className="col-span-1">Term</div>
                                        <div className="col-span-1">Status</div>
                                        <div className="col-span-1">Insured</div>
                                    </div>
                                </div>

                                {/* Coverage Header */}
                                <div className="col-span-3 border-r border-slate-200">
                                    <div className="py-2 bg-red-50 border-b border-red-100 text-red-800">保障範圍 Coverage (HKD)</div>
                                    <div className="grid grid-cols-3 py-2">
                                        <div>Life</div>
                                        <div>CI</div>
                                        <div>Med/Acc</div>
                                    </div>
                                </div>

                                {/* Premium Header */}
                                <div className="col-span-3">
                                    <div className="py-2 bg-blue-50 border-b border-blue-100 text-blue-800">保費 Premium</div>
                                    <div className="grid grid-cols-3 py-2">
                                        <div>Curr.</div>
                                        <div>Amt</div>
                                        <div>Mode</div>
                                    </div>
                                </div>
                            </div>

                            {/* Rows */}
                            <div className="text-xs text-slate-700">
                                {policies.map((policy, idx) => (
                                    <div key={policy.id} className={`grid grid-cols-12 border-b border-slate-100 hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>

                                        {/* Basic Info Cells */}
                                        <div className="col-span-6 grid grid-cols-6 p-3 border-r border-slate-200 items-center">
                                            <div className="col-span-2">
                                                <div className="font-bold text-slate-900">{policy.company || 'Unknown'}</div>
                                                <div className="text-xs text-slate-500 truncate">{policy.planName}</div>
                                                <div className="text-[10px] text-slate-400">{policy.policyNumber}</div>
                                            </div>
                                            <div className="col-span-1 text-center">{formatDate(policy.effectiveDate)}</div>
                                            <div className="col-span-1 text-center">To 100</div> {/* Placeholder for Term */}
                                            <div className="col-span-1 text-center">
                                                <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px]">Active</span>
                                            </div>
                                            <div className="col-span-1 text-center text-[10px] truncate" title={policy.insuredName || policy.holderName || 'Self'}>
                                                {policy.insuredName || policy.holderName || 'Self'}
                                            </div>
                                        </div>

                                        {/* Coverage Cells */}
                                        <div className="col-span-3 grid grid-cols-3 p-3 border-r border-slate-200 items-center text-right">
                                            <div className="font-medium">
                                                {(policy.type === 'Life' || policy.type === 'Savings') && policy.sumInsured ? formatCurrency(policy.sumInsured, policy.currency) : '-'}
                                            </div>
                                            <div className="font-medium text-red-600">
                                                {policy.type === 'Critical Illness' && policy.sumInsured ? formatCurrency(policy.sumInsured, policy.currency) : '-'}
                                            </div>
                                            <div className="font-medium text-blue-600">
                                                {(policy.type === 'Medical' || policy.type === 'Accident') && policy.sumInsured ? formatCurrency(policy.sumInsured, policy.currency) : '-'}
                                            </div>
                                        </div>

                                        {/* Premium Cells */}
                                        <div className="col-span-3 grid grid-cols-3 p-3 items-center text-right">
                                            <div className="text-slate-500">{policy.currency}</div>
                                            <div className="font-bold">{policy.premiumAmount ? policy.premiumAmount.toLocaleString() : '-'}</div>
                                            <div className="text-slate-500">{policy.paymentMode}</div>
                                        </div>

                                    </div>
                                ))}
                            </div>

                            {/* Footer Totals Row */}
                            <div className="grid grid-cols-12 bg-slate-100 border-t border-slate-300 p-3 text-xs font-bold">
                                <div className="col-span-6 text-right pr-4">TOTALS (Approx. HKD):</div>
                                <div className="col-span-3 grid grid-cols-3 text-right">
                                    <div>{formatCurrency(totalLifeSA)}</div>
                                    <div className="text-red-600">{formatCurrency(totalCISA)}</div>
                                    <div>-</div>
                                </div>
                                <div className="col-span-3 text-right pr-4">
                                    {formatCurrency(totalPremiumHKD)} / Year
                                </div>
                            </div>

                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};
