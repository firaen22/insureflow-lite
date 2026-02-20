import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Download, Loader2, Eye } from 'lucide-react';
import { Client, PolicyData, PDFColumnConfig } from '../types';
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
    pdfLayout: PDFColumnConfig[];
    onUpdateLayout?: (newLayout: PDFColumnConfig[]) => void;
    onBack: () => void;
    t: any; // Translation strings
}

export const ClientReportView: React.FC<ClientReportViewProps> = ({ client, policies, pdfLayout, onUpdateLayout, onBack, t }) => {
    const reportRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Calculate totals using shared utility
    const totalLifeSA = calculateTotalLifeSumInsuredHKD(policies, client.name);
    const totalCISA = calculateTotalCISumInsuredHKD(policies, client.name);
    const totalPremiumHKD = calculateTotalAnnualPremiumHKD(policies);

    const activeColumns = [...pdfLayout].sort((a, b) => a.order - b.order).filter(c => c.visible);
    const gridTemplateColumns = activeColumns.map(c => `${c.width}%`).join(' ');

    const renderCellContent = (policy: PolicyData, columnId: string) => {
        switch (columnId) {
            case 'company_plan':
                return (
                    <div className="text-left leading-tight">
                        <div className="font-bold text-slate-900 truncate">{policy.company || 'Unknown'}</div>
                        <div className="text-[10px] text-slate-500 truncate">{policy.planName}</div>
                        <div className="text-[9px] text-slate-400 truncate">{policy.policyNumber}</div>
                    </div>
                );
            case 'effective':
                return formatDate(policy.effectiveDate);
            case 'term':
                return 'To 100';
            case 'status':
                return <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px]">Active</span>;
            case 'insured':
                return <div className="truncate" title={policy.insuredName || policy.holderName || 'Self'}>{policy.insuredName || policy.holderName || 'Self'}</div>;
            case 'life':
                return (policy.type === 'Life' || policy.type === 'Savings') && policy.sumInsured ? formatCurrency(policy.sumInsured, policy.currency) : '-';
            case 'ci':
                return <span className="text-red-600 font-medium">{policy.type === 'Critical Illness' && policy.sumInsured ? formatCurrency(policy.sumInsured, policy.currency) : '-'}</span>;
            case 'med_acc':
                return <span className="text-blue-600 font-medium">{(policy.type === 'Medical' || policy.type === 'Accident') && policy.sumInsured ? formatCurrency(policy.sumInsured, policy.currency) : '-'}</span>;
            case 'currency':
                return policy.currency;
            case 'premium_amt':
                return <span className="font-bold">{policy.premiumAmount ? policy.premiumAmount.toLocaleString() : '-'}</span>;
            case 'payment_mode':
                return policy.paymentMode;
            default:
                return '-';
        }
    };

    // Resizing Logic
    const [resizingIndex, setResizingIndex] = useState<number | null>(null);
    const [startX, setStartX] = useState(0);
    const [startWidths, setStartWidths] = useState<{ left: number, right: number } | null>(null);

    const handleResizeStart = (e: React.MouseEvent, index: number) => {
        if (!onUpdateLayout) return;
        e.preventDefault();
        const leftCol = activeColumns[index];
        const rightCol = activeColumns[index + 1];
        setResizingIndex(index);
        setStartX(e.clientX);
        setStartWidths({ left: leftCol.width, right: rightCol.width });
    };

    useEffect(() => {
        if (resizingIndex === null || !startWidths || !onUpdateLayout) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!reportRef.current) return;
            const deltaX = e.clientX - startX;
            // The container is scaled down to 0.9, so we adjust deltaX by scaling factor
            const reportWidth = reportRef.current.getBoundingClientRect().width / 0.9;
            const deltaPercent = (deltaX / reportWidth) * 100;

            let newLeftWidth = startWidths.left + deltaPercent;
            let newRightWidth = startWidths.right - deltaPercent;

            // Enforce minimum width of 2%
            if (newLeftWidth < 2) {
                newRightWidth -= (2 - newLeftWidth);
                newLeftWidth = 2;
            } else if (newRightWidth < 2) {
                newLeftWidth -= (2 - newRightWidth);
                newRightWidth = 2;
            }

            const leftCol = activeColumns[resizingIndex];
            const rightCol = activeColumns[resizingIndex + 1];

            const newLayout = [...pdfLayout];
            const leftTarget = newLayout.find(c => c.id === leftCol.id);
            const rightTarget = newLayout.find(c => c.id === rightCol.id);
            if (leftTarget && rightTarget) {
                leftTarget.width = newLeftWidth;
                rightTarget.width = newRightWidth;
                onUpdateLayout(newLayout);
            }
        };

        const handleMouseUp = () => {
            setResizingIndex(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingIndex, startX, startWidths, pdfLayout, onUpdateLayout, activeColumns]);

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
                    {t.backToDetails}
                </button>
                <h1 className="text-lg font-bold text-slate-800">{t.title}</h1>
                <button
                    onClick={handleDownloadPDF}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {isGenerating ? t.generating : t.downloadBtn}
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
                            <span className="skew-x-[20deg] font-bold text-lg tracking-wide">{t.protection}</span>
                        </div>
                    </div>

                    {/* Top Summary Bar (Horizontal) */}
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{client.name}</h2>
                                <p className="text-sm text-slate-500">{t.age}: {client.birthday ? new Date().getFullYear() - new Date(client.birthday).getFullYear() : '-'}</p>
                            </div>
                            <div className="h-8 w-px bg-slate-200"></div>
                            <div>
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-0.5 tracking-wider">{t.totalLife}</div>
                                <div className="text-lg font-bold text-blue-600">{formatCurrency(totalLifeSA)}</div>
                            </div>
                            <div className="h-8 w-px bg-slate-200"></div>
                            <div>
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-0.5 tracking-wider">{t.totalCI}</div>
                                <div className="text-lg font-bold text-red-500">{formatCurrency(totalCISA)}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-0.5 tracking-wider">{t.totalAnnualPremium}</div>
                            <div className="text-xl font-bold text-slate-900">{formatCurrency(totalPremiumHKD)}</div>
                        </div>
                    </div>

                    {/* Inline Column Visibility Toggles */}
                    {onUpdateLayout && (
                        <div className="mb-4 p-3 bg-white border border-slate-200 rounded-lg flex flex-wrap gap-2 items-center shadow-sm">
                            <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
                                <Eye className="w-3 h-3" /> {t.visibleColumns}
                            </span>
                            {pdfLayout.sort((a, b) => a.order - b.order).map(col => (
                                <button
                                    key={col.id}
                                    onClick={() => {
                                        const newLayout = pdfLayout.map(c =>
                                            c.id === col.id ? { ...c, visible: !c.visible } : c
                                        );
                                        onUpdateLayout(newLayout);
                                    }}
                                    className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${col.visible
                                        ? 'bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100 font-medium'
                                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                                        }`}
                                >
                                    {t.columns[col.id] || col.labelKey}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Main Content (Policy Table Full Width) */}
                    <div className="w-full">
                        <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden">
                            {/* Headers */}
                            {/* Headers */}
                            <div
                                className="bg-white border-b border-slate-200 text-center text-xs font-bold text-slate-800 py-3"
                                style={{ display: 'grid', gridTemplateColumns }}
                            >
                                {activeColumns.map((col, index) => (
                                    <div key={col.id} className="px-2 truncate relative group select-none border-r border-slate-200 last:border-r-0">
                                        {t.columns[col.id] || col.labelKey}
                                        {onUpdateLayout && index < activeColumns.length - 1 && (
                                            <div
                                                className="absolute right-0 top-0 bottom-0 w-2 -mr-1 cursor-col-resize hover:bg-brand-400 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                onMouseDown={(e) => handleResizeStart(e, index)}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Rows */}
                            <div className="text-xs text-slate-700">
                                {policies.map((policy, idx) => (
                                    <div
                                        key={policy.id}
                                        className={`border-b border-slate-100 hover:bg-slate-50 items-center py-2 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                                        style={{ display: 'grid', gridTemplateColumns }}
                                    >
                                        {activeColumns.map(col => (
                                            <div key={col.id} className="px-2 py-1 text-center flex items-center justify-center border-r border-slate-100 last:border-r-0 h-full">
                                                {renderCellContent(policy, col.id)}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            {/* Footer Totals Row */}
                            <div className="bg-slate-100 border-t border-slate-300 p-3 flex justify-between items-center text-xs font-bold">
                                <div>{t.totalsApprox}</div>
                                <div className="flex gap-8 text-right pr-4">
                                    <div>{t.life} {formatCurrency(totalLifeSA)}</div>
                                    <div className="text-red-600">{t.ci} {formatCurrency(totalCISA)}</div>
                                    <div>{t.prem} {formatCurrency(totalPremiumHKD)} {t.yr}</div>
                                </div>
                            </div>

                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};
