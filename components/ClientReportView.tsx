import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Download, Loader2, Eye, Check } from 'lucide-react';
import { Client, PolicyData, PDFColumnConfig, Product } from '../types';
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
    products?: Product[];
    pdfLayout: PDFColumnConfig[];
    onUpdateLayout?: (newLayout: PDFColumnConfig[]) => void;
    onBack: () => void;
    t: any; // Translation strings
}

export const ClientReportView: React.FC<ClientReportViewProps> = ({ client, policies, products = [], pdfLayout, onUpdateLayout, onBack, t }) => {
    const reportRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Calculate totals using shared utility
    const totalLifeSA = calculateTotalLifeSumInsuredHKD(policies, client.name);
    const totalCISA = calculateTotalCISumInsuredHKD(policies, client.name);
    const totalPremiumHKD = calculateTotalAnnualPremiumHKD(policies);

    const activeColumns = [...pdfLayout].sort((a, b) => a.order - b.order).filter(c => c.visible);
    const gridTemplateColumns = activeColumns.map(c => `${c.width}%`).join(' ');

    const renderCellContent = (policy: PolicyData | any, columnId: string, isRider?: boolean) => {
        switch (columnId) {
            case 'company_plan':
                if (isRider) {
                    return (
                        <div className="text-left leading-tight pl-4 relative">
                            <div className="absolute left-0 top-1/2 -mt-px w-3 h-px bg-slate-200"></div>
                            <div className="absolute left-0 top-0 bottom-1/2 w-px bg-slate-200"></div>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-1 py-0.5 rounded border border-slate-200 mr-1">Rider</span>
                            <span className="font-medium text-slate-700 text-[10px]">{policy.name}</span>
                        </div>
                    );
                }
                return (
                    <div className="text-left leading-tight">
                        <div className="font-bold text-slate-900 truncate">{policy.company || 'Unknown'}</div>
                        <div className="text-[10px] text-slate-500 truncate">{policy.planName}</div>
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">{policy.policyNumber}</div>
                    </div>
                );
            case 'effective':
                if (isRider) return <span className="text-[10px] text-slate-600 block leading-tight">Maturity:<br />P: {policy.protectionMatureDate || '-'}<br />$:{policy.premiumMatureDate || '-'}</span>;
                return (
                    <div className="text-[10px] leading-tight flex flex-col items-center">
                        <span className="text-slate-800">{formatDate(policy.effectiveDate)}</span>
                        {(policy.protectionMatureDate || policy.premiumMatureDate) && (
                            <span className="text-[8px] text-slate-500 mt-1 border-t border-slate-200 pt-0.5 w-full text-center">
                                Maturity: P:{policy.protectionMatureDate || '-'} $:{policy.premiumMatureDate || '-'}
                            </span>
                        )}
                    </div>
                );
            case 'term':
                return isRider ? '-' : 'To 100';
            case 'status':
                return isRider ? '-' : <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px]">Active</span>;
            case 'insured':
                return isRider ? '-' : <div className="truncate" title={policy.insuredName || policy.holderName || 'Self'}>{policy.insuredName || policy.holderName || 'Self'}</div>;
            case 'life':
                if (isRider) return policy.type === 'Life' && policy.sumInsured ? formatCurrency(policy.sumInsured, 'HKD') : '-';
                return (policy.type === 'Life' || policy.type === 'Savings') && policy.sumInsured ? formatCurrency(policy.sumInsured, policy.currency) : '-';
            case 'ci':
                if (isRider) return <span className="text-red-600 font-medium">{policy.type === 'Critical Illness' && policy.sumInsured ? formatCurrency(policy.sumInsured, 'HKD') : '-'}</span>;
                return <span className="text-red-600 font-medium">{policy.type === 'Critical Illness' && policy.sumInsured ? formatCurrency(policy.sumInsured, policy.currency) : '-'}</span>;
            case 'medical':
                if (isRider) {
                    if (policy.type === 'Medical') {
                        const matchedRiderProduct = products.find(p => p.name === policy.name);
                        const riderPlanText = (['High-End Semi-Private', 'High-End Private'].includes(policy.medicalPlanType || '') ? 'High-End Medical' : policy.medicalPlanType) || 'Ward';
                        return (
                            <div className="flex flex-col items-center justify-center leading-tight">
                                {matchedRiderProduct && (matchedRiderProduct.annualCoverageLimit || matchedRiderProduct.wholeLifeCoverageLimit) ? (
                                    <div className="flex flex-col items-center">
                                        <span className="text-blue-600 font-medium text-[10px] whitespace-nowrap">Ann: {matchedRiderProduct.annualCoverageLimit ? formatCurrency(matchedRiderProduct.annualCoverageLimit, 'HKD') : '-'}</span>
                                        <span className="text-blue-500 text-[9px] whitespace-nowrap">Life: {matchedRiderProduct.wholeLifeCoverageLimit ? formatCurrency(matchedRiderProduct.wholeLifeCoverageLimit, 'HKD') : '-'}</span>
                                    </div>
                                ) : (
                                    <span className="text-blue-600 font-medium">{policy.sumInsured ? formatCurrency(policy.sumInsured, 'HKD') : '-'}</span>
                                )}
                                {riderPlanText && <span className="text-[8px] bg-blue-50 text-blue-600 border border-blue-100 px-1 rounded mt-0.5 whitespace-nowrap">{riderPlanText}</span>}
                            </div>
                        );
                    }
                    return '-';
                }

                if (policy.type === 'Medical') {
                    const matchedProduct = products.find(p => p.name === policy.planName);
                    const planText = (['High-End Semi-Private', 'High-End Private'].includes(policy.medicalPlanType || '') ? 'High-End Medical' : policy.medicalPlanType) || 'Ward';

                    return (
                        <div className="flex flex-col items-center justify-center leading-tight">
                            {matchedProduct ? (
                                <div className="flex flex-col items-center">
                                    <span className="text-blue-600 font-medium text-[10px]">Ann: {matchedProduct.annualCoverageLimit ? formatCurrency(matchedProduct.annualCoverageLimit, policy.currency) : '-'}</span>
                                    <span className="text-blue-500 text-[9px]">Life: {matchedProduct.wholeLifeCoverageLimit ? formatCurrency(matchedProduct.wholeLifeCoverageLimit, policy.currency) : '-'}</span>
                                </div>
                            ) : (
                                <span className="text-blue-600 font-medium">{policy.sumInsured ? formatCurrency(policy.sumInsured, policy.currency) : '-'}</span>
                            )}
                            {planText && <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-1 py-0.5 rounded mt-0.5 whitespace-nowrap">{planText}</span>}
                        </div>
                    );
                }
                return '-';
            case 'accident':
                if (isRider) return <span className="text-orange-600 font-medium">{policy.type === 'Accident' && policy.sumInsured ? formatCurrency(policy.sumInsured, 'HKD') : '-'}</span>;
                return <span className="text-orange-600 font-medium">{policy.type === 'Accident' && policy.sumInsured ? formatCurrency(policy.sumInsured, policy.currency) : '-'}</span>;
            case 'currency':
                return isRider ? '-' : policy.currency;
            case 'premium_amt':
                return <span className="font-bold">{policy.premiumAmount ? policy.premiumAmount.toLocaleString() : '-'}</span>;
            case 'payment_mode':
                return isRider ? '-' : policy.paymentMode;
            case 'tax_deductible':
                if (isRider) return <span className="text-slate-600 dark:text-slate-300">-</span>;
                const matchedProduct = products.find(p => p.name === policy.planName);
                if (matchedProduct?.isTaxDeductible) {
                    return <span className="bg-emerald-100 text-emerald-700 w-5 h-5 flex items-center justify-center rounded-full text-[10px] mx-auto"><Check className="w-3 h-3" /></span>;
                }
                return <span className="text-slate-600 dark:text-slate-300">-</span>;
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
        <div className="h-full flex flex-col bg-slate-50 dark:bg-white/[0.02]">
            {/* Header / Actions */}
            <div className="p-4 bg-white/80 dark:bg-white/5 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 flex justify-between items-center shadow-lg shadow-black/20 z-10">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t.backToDetails}
                </button>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">{t.title}</h1>
                <button
                    onClick={handleDownloadPDF}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-lg shadow-black/20"
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
                    className="w-[1123px] min-h-[794px] bg-white shadow-sm dark:shadow-2xl p-8 text-slate-900 origin-top transform scale-90" // White background for PDF
                    style={{ fontFamily: 'Inter, sans-serif' }}
                >
                    {/* Header Section */}
                    <div className="flex items-center gap-2 mb-8 border-b-2 border-blue-600 pb-2">
                        <div className="w-0 h-0 border-l-[20px] border-l-transparent border-b-[30px] border-b-blue-700 border-r-[20px] border-r-transparent relative top-4 -left-2 rotate-45 transform origin-center"></div>
                        <div className="bg-blue-700 text-white px-8 py-2.5 rounded-tr-xl skew-x-[-20deg] ml-[-10px]">
                            <span className="skew-x-[20deg] font-bold text-xl tracking-wide uppercase">{t.protection}</span>
                        </div>
                    </div>

                    {/* Top Summary Bar (Horizontal) */}
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
                        <div className="flex items-center gap-8">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{client.name}</h2>
                                <p className="text-sm text-slate-500 font-medium">{t.age}: {client.birthday ? new Date().getFullYear() - new Date(client.birthday).getFullYear() : '-'}</p>
                            </div>
                            <div className="h-10 w-px bg-slate-200"></div>
                            <div>
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-wider">{t.totalLife}</div>
                                <div className="text-xl font-bold text-blue-700">{formatCurrency(totalLifeSA)}</div>
                            </div>
                            <div className="h-10 w-px bg-slate-200"></div>
                            <div>
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-wider">{t.totalCI}</div>
                                <div className="text-xl font-bold text-blue-700">{formatCurrency(totalCISA)}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-wider">{t.totalPremium}</div>
                            <div className="text-3xl font-black text-slate-900 leading-none">
                                <span className="text-sm font-bold mr-1">HKD</span>
                                {formatCurrency(totalPremiumHKD).replace('HKD', '').replace('$', '')}
                                <span className="text-xs font-bold block text-slate-400 mt-1 uppercase">Annual Total</span>
                            </div>
                        </div>
                    </div>

                    {/* Inline Column Visibility Toggles */}
                    {onUpdateLayout && (
                        <div className="mb-4 p-3 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-lg flex flex-wrap gap-2 items-center shadow-lg shadow-black/20">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-2 flex items-center gap-1">
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
                                        ? 'bg-slate-100 dark:bg-white/10 border-brand-200 text-brand-700 hover:bg-brand-100 font-medium'
                                        : 'bg-white/80 dark:bg-white/5 backdrop-blur-xl border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-white/[0.02]'
                                        }`}
                                >
                                    {t.columns[col.id] || col.labelKey}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Main Content (Policy Table Full Width) */}
                    <div className="w-full">
                        {/* Table Section */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <div
                                className="grid bg-[#2d3b5d] text-white text-[10px] font-bold uppercase tracking-wider py-4 px-3"
                                style={{ gridTemplateColumns }}
                            >
                                {activeColumns.map(col => (
                                    <div key={col.id} className={col.id === 'premium' ? 'text-right pr-2' : col.id === 'status' ? 'text-center' : 'text-center'}>
                                        {t.columns[col.id] || col.labelKey}
                                    </div>
                                ))}
                            </div>

                            <div className="divide-y divide-slate-100">
                                {policies.map((policy, idx) => (
                                    <React.Fragment key={policy.id}>
                                        <div
                                            className={`grid items-center py-4 px-3 text-[11px] ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                                            style={{ gridTemplateColumns }}
                                        >
                                            {activeColumns.map(col => (
                                                <div key={col.id} className={col.id === 'premium' ? 'text-right pr-2' : col.id === 'status' ? 'text-center' : 'text-center'}>
                                                    {renderCellContent(policy, col.id)}
                                                </div>
                                            ))}
                                        </div>
                                        {policy.riders?.map((rider, ridx) => (
                                            <div
                                                key={`${policy.id}-rider-${ridx}`}
                                                className={`grid items-center py-3 px-3 text-[10px] border-t border-slate-100/50 relative ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                                                style={{ gridTemplateColumns }}
                                            >
                                                {/* Left structural border indicating hierarchy */}
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200"></div>
                                                {activeColumns.map((col, cidx) => (
                                                    <div key={`rider-${col.id}`} className={`px-2 py-0.5 text-center flex items-center justify-center border-slate-100/50 h-full ${cidx !== activeColumns.length - 1 ? 'border-r' : ''}`}>
                                                        {renderCellContent(rider, col.id, true)}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Footer Totals Row */}
                            <div className="bg-slate-100 border-t-2 border-slate-300 p-4 flex justify-between items-center text-xs font-bold text-slate-800">
                                <div className="text-slate-500 italic">{t.totalsApprox}</div>
                                <div className="flex gap-10 text-right pr-4 items-baseline">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-tighter">{t.life}</span>
                                        <span className="text-sm">{formatCurrency(totalLifeSA)}</span>
                                    </div>
                                    <div className="flex flex-col text-red-600">
                                        <span className="text-[9px] text-red-400 uppercase tracking-tighter">{t.ci}</span>
                                        <span className="text-sm">{formatCurrency(totalCISA)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-tighter">{t.prem}</span>
                                        <span className="text-sm">{formatCurrency(totalPremiumHKD)} {t.yr}</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};
