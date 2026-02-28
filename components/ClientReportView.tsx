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
                            <div className="absolute left-0 top-1/2 -mt-px w-3 h-px bg-white/10"></div>
                            <div className="absolute left-0 top-0 bottom-1/2 w-px bg-white/10"></div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest bg-white/[0.05] px-1 py-0.5 rounded border border-white/10 mr-1">Rider</span>
                            <span className="font-medium text-slate-200 text-[10px]">{policy.name}</span>
                        </div>
                    );
                }
                return (
                    <div className="text-left leading-tight">
                        <div className="font-bold text-white truncate">{policy.company || 'Unknown'}</div>
                        <div className="text-[10px] text-slate-400 truncate">{policy.planName}</div>
                        <div className="text-[9px] text-slate-400 truncate">{policy.policyNumber}</div>
                    </div>
                );
            case 'effective':
                if (isRider) return <span className="text-[10px] text-slate-300 block leading-tight">Maturity:<br />P: {policy.protectionMatureDate || '-'}<br />$:{policy.premiumMatureDate || '-'}</span>;
                return (
                    <div className="text-[10px] leading-tight flex flex-col items-center">
                        <span>{formatDate(policy.effectiveDate)}</span>
                        {(policy.protectionMatureDate || policy.premiumMatureDate) && (
                            <span className="text-[8px] text-slate-400 mt-1 border-t border-white/10 pt-0.5 w-full text-center">
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
                                {riderPlanText && <span className="text-[8px] bg-blue-500/100/10 text-blue-400 border border-blue-500/30 px-1 rounded mt-0.5 whitespace-nowrap">{riderPlanText}</span>}
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
                            {planText && <span className="text-[9px] bg-blue-500/100/10 text-blue-400 border border-blue-500/30 px-1 py-0.5 rounded mt-0.5 whitespace-nowrap">{planText}</span>}
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
                if (isRider) return <span className="text-slate-300">-</span>;
                const matchedProduct = products.find(p => p.name === policy.planName);
                if (matchedProduct?.isTaxDeductible) {
                    return <span className="bg-emerald-100 text-emerald-700 w-5 h-5 flex items-center justify-center rounded-full text-[10px] mx-auto"><Check className="w-3 h-3" /></span>;
                }
                return <span className="text-slate-300">-</span>;
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
        <div className="h-full flex flex-col bg-white/[0.02]">
            {/* Header / Actions */}
            <div className="p-4 bg-white/5 backdrop-blur-xl border-b border-white/10 flex justify-between items-center shadow-lg shadow-black/20 z-10">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t.backToDetails}
                </button>
                <h1 className="text-lg font-bold text-white">{t.title}</h1>
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
                    className="w-[1123px] min-h-[794px] bg-white/5 backdrop-blur-xl shadow-2xl p-6 text-white origin-top transform scale-90" // Scale for preview visibility
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
                    <div className="flex items-center justify-between bg-white/[0.02] border border-white/10 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-6">
                            <div>
                                <h2 className="text-xl font-bold text-white">{client.name}</h2>
                                <p className="text-sm text-slate-400">{t.age}: {client.birthday ? new Date().getFullYear() - new Date(client.birthday).getFullYear() : '-'}</p>
                            </div>
                            <div className="h-8 w-px bg-white/10"></div>
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold mb-0.5 tracking-wider">{t.totalLife}</div>
                                <div className="text-lg font-bold text-blue-600">{formatCurrency(totalLifeSA)}</div>
                            </div>
                            <div className="h-8 w-px bg-white/10"></div>
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold mb-0.5 tracking-wider">{t.totalCI}</div>
                                <div className="text-lg font-bold text-red-500">{formatCurrency(totalCISA)}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-slate-400 uppercase font-bold mb-0.5 tracking-wider">{t.totalAnnualPremium}</div>
                            <div className="text-xl font-bold text-white">{formatCurrency(totalPremiumHKD)}</div>
                        </div>
                    </div>

                    {/* Inline Column Visibility Toggles */}
                    {onUpdateLayout && (
                        <div className="mb-4 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg flex flex-wrap gap-2 items-center shadow-lg shadow-black/20">
                            <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1">
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
                                        ? 'bg-white/10 border-brand-200 text-brand-700 hover:bg-brand-100 font-medium'
                                        : 'bg-white/5 backdrop-blur-xl border-white/10 text-slate-400 hover:bg-white/[0.02]'
                                        }`}
                                >
                                    {t.columns[col.id] || col.labelKey}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Main Content (Policy Table Full Width) */}
                    <div className="w-full">
                        <div className="flex-1 border border-white/10 rounded-lg overflow-hidden">
                            {/* Headers */}
                            {/* Headers */}
                            <div
                                className="bg-white/5 backdrop-blur-xl border-b border-white/10 text-center text-xs font-bold text-white py-3"
                                style={{ display: 'grid', gridTemplateColumns }}
                            >
                                {activeColumns.map((col, index) => (
                                    <div key={col.id} className="px-2 truncate relative group select-none border-r border-white/10 last:border-r-0">
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
                            <div className="text-xs text-slate-200">
                                {policies.map((policy, idx) => (
                                    <React.Fragment key={policy.id}>
                                        <div
                                            className={`border-b border-white/5 hover:bg-white/[0.02] items-center py-2 ${idx % 2 === 0 ? 'bg-white/5 backdrop-blur-xl' : 'bg-white/[0.02]/50'}`}
                                            style={{ display: 'grid', gridTemplateColumns }}
                                        >
                                            {activeColumns.map(col => (
                                                <div key={col.id} className="px-2 py-1 text-center flex items-center justify-center border-r border-white/5 last:border-r-0 h-full">
                                                    {renderCellContent(policy, col.id, false)}
                                                </div>
                                            ))}
                                        </div>
                                        {/* Rider Sub-rows */}
                                        {policy.riders && policy.riders.map((rider, rIdx) => (
                                            <div
                                                key={`${policy.id}-rider-${rIdx}`}
                                                className={`border-b border-white/5 hover:bg-white/[0.05] items-center py-1.5 ${idx % 2 === 0 ? 'bg-white/[0.02]/50' : 'bg-white/[0.05]/50'} relative overflow-hidden`}
                                                style={{ display: 'grid', gridTemplateColumns }}
                                            >
                                                {/* Left structural border indicating hierarchy */}
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-200"></div>
                                                {activeColumns.map(col => (
                                                    <div key={`rider-${col.id}`} className="px-2 py-0.5 text-center flex items-center justify-center border-r border-slate-100/50 last:border-r-0 h-full">
                                                        {renderCellContent(rider, col.id, true)}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Footer Totals Row */}
                            <div className="bg-white/[0.05] border-t border-white/20 p-3 flex justify-between items-center text-xs font-bold">
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
