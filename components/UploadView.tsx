
import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, CheckCircle, Loader2, AlertCircle, X, ShieldCheck, Pencil, Save, Tag, Sparkles, BookOpen, Cake, Plus, Calendar, Layers, Trash2, Activity, Keyboard, FileSpreadsheet, ListChecks } from 'lucide-react';
import { UploadStatus, PolicyData, Product, Rider } from '../types';
import { TRANSLATIONS } from '../constants';

interface UploadViewProps {
  t: typeof TRANSLATIONS['en']['upload'];
  products: Product[];
  onSave: (data: PolicyData, isNewProduct: boolean) => void;
}

interface ProcessedFile {
  id: string;
  file: File;
  status: UploadStatus;
  data?: PolicyData;
  error?: string;
  isNewProduct?: boolean;
}

export const UploadView: React.FC<UploadViewProps> = ({ t, products, onSave }) => {
  // Mode: 'upload' (dropzone) or 'review' (validation table)
  const [viewMode, setViewMode] = useState<'upload' | 'review'>('upload');

  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- CSV Template & Parsing ---

  const downloadTemplate = () => {
    const headers = ['PolicyNumber', 'PlanName', 'HolderName', 'Birthday(YYYY-MM-DD)', 'Anniversary(DD/MM)', 'Premium', 'PaymentMode', 'Type', 'Currency'];
    const rows = [
      ['POL-001', 'Example Care Plan', 'John Doe', '1990-01-01', '01/01', '1200', 'Yearly', 'Medical', 'HKD']
    ];
    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "policy_template.csv");
    document.body.appendChild(link);
    link.click();
  };

  const parseCSV = (content: string, fileName: string): PolicyData[] => {
    const lines = content.split('\n');
    const data: PolicyData[] = [];
    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',');
      if (row.length < 5) continue;

      data.push({
        id: `csv-${Date.now()}-${i}`,
        policyNumber: row[0]?.trim() || '',
        planName: row[1]?.trim() || 'Imported Plan',
        holderName: row[2]?.trim() || 'Unknown',
        clientBirthday: row[3]?.trim() || '',
        policyAnniversaryDate: row[4]?.trim() || '',
        premiumAmount: parseFloat(row[5]) || 0,
        paymentMode: (row[6]?.trim() as any) || 'Yearly',
        type: (row[7]?.trim() as any) || 'Life',
        currency: (row[8]?.trim() as any) || 'HKD',
        status: 'Active',
        extractedTags: ['Imported'],
        riders: []
      });
    }
    return data;
  };

  // --- Processing Logic ---

  const processFile = async (file: File): Promise<ProcessedFile> => {
    const id = Math.random().toString(36).substring(7);

    // 1. CSV Handler
    if (file.name.endsWith('.csv')) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          try {
            const parsed = parseCSV(text, file.name);
            // For now, CSV just takes the first valid row as the "file" data representation, 
            // effectively treating 1 CSV row as 1 policy for simplicity in this view implementation.
            // *Enhancement*: In a real bulk importer, one CSV file would spawn multiple "Review Items".
            // For this mock, let's assume one-policy-per-file or take the first one.
            const firstPolicy = parsed[0];
            resolve({
              id,
              file,
              status: UploadStatus.COMPLETE,
              data: firstPolicy,
              isNewProduct: !products.some(p => p.name === firstPolicy.planName)
            });
          } catch (err) {
            resolve({ id, file, status: UploadStatus.ERROR, error: 'Invalid CSV format' });
          }
        };
        reader.readAsText(file);
      });
    }

    // 2. Real/Mock AI Logic (PDF/Image)
    const storedApiKey = localStorage.getItem('gemini_api_key');

    return new Promise(async (resolve) => {
      const isImageOrPdf = file.type.startsWith('image/') || file.type === 'application/pdf' || /\.(jpg|jpeg|png|webp|pdf)$/i.test(file.name);

      console.log('Processing file:', file.name, 'Type:', file.type, 'Has Key:', !!storedApiKey, 'Is Supported:', isImageOrPdf);

      // If we have an API key and it's an image/pdf, try real analysis
      if (storedApiKey && isImageOrPdf) {
        try {
          const { analyzePolicyImage } = await import('../services/gemini');
          const aiResult = await analyzePolicyImage(file, storedApiKey);

          const isNew = !products.some(p => p.name === aiResult.planName);

          // Merge with PolicyData structure
          const policyData: PolicyData = {
            id: `ai-${Date.now()}`,
            policyNumber: aiResult.policyNumber || 'Unknown',
            planName: aiResult.planName || 'Unknown Plan',
            holderName: aiResult.holderName || 'Unknown',
            clientBirthday: aiResult.clientBirthday || '',
            type: (aiResult.type as any) || 'Life',
            policyAnniversaryDate: aiResult.policyAnniversaryDate || '',
            paymentMode: (aiResult.paymentMode as any) || 'Yearly',
            premiumAmount: aiResult.premiumAmount || 0,
            currency: (aiResult.currency as 'USD' | 'HKD') || 'HKD',
            status: 'Active',
            extractedTags: [...(aiResult.extractedTags || []), 'AI Parsed'],
            riders: aiResult.riders || [],
            sumInsured: aiResult.sumInsured || 0,
            cashValue: aiResult.cashValue || 0,
            accumulatedDividend: aiResult.accumulatedDividend || 0,
            totalCashValue: aiResult.totalCashValue || 0
          };

          resolve({
            id,
            file,
            status: UploadStatus.COMPLETE,
            data: policyData,
            isNewProduct: isNew
          });
          return;

        } catch (error) {
          console.error("Real AI failed, falling back to mock or error", error);
          // Fallthrough to mock logic if real AI fails? Or return error?
          // Let's return error to inform user their key might be wrong
          resolve({
            id,
            file,
            status: UploadStatus.ERROR,
            error: `AI Parsing Failed: ${(error as Error).message}`
          });
          return;
        }
      }

      // Mock Fallback (if no key is provided)
      setTimeout(() => {
        // Enhanced Mock Logic: Check for Chinese characters in filename
        const isChineseContext = /[\u4e00-\u9fa5]/.test(file.name);
        const mockPlanName = isChineseContext ? 'CEO Medical Plan' : 'Future Protect Plus';

        // Check Product Library
        const libraryMatch = products.find(p => p.name === mockPlanName);
        let derivedTags: string[] = ['Mock Data'];
        let type = isChineseContext ? 'Medical' : 'Life';
        let isNew = true;

        if (libraryMatch) {
          derivedTags = [...libraryMatch.defaultTags, 'Mock Data'];
          type = libraryMatch.type;
          isNew = false;
        }

        const mockResult: PolicyData = {
          id: `mock-${Date.now()}`,
          policyNumber: isChineseContext ? 'AIA-HK-899' : 'POL-NEW-882',
          planName: mockPlanName,
          holderName: isChineseContext ? '陳大文 (Mock)' : 'Robert Fox (Mock)',
          clientBirthday: isChineseContext ? '1980-05-20' : '1992-11-15',
          type: type as any,
          policyAnniversaryDate: isChineseContext ? '20/05' : '14/08',
          paymentMode: isChineseContext ? 'Yearly' : 'Monthly',
          premiumAmount: isChineseContext ? 12000 : 2500.00,
          currency: isChineseContext ? 'HKD' : 'USD',
          status: 'Active',
          extractedTags: derivedTags,
          riders: isChineseContext
            ? [{ name: 'Medical Rider A', type: 'Medical', premiumAmount: 500 }]
            : [{ name: 'Accidental Death', type: 'Accident', premiumAmount: 100 }],
          sumInsured: type === 'Life' ? 1000000 : 0
        };

        resolve({
          id,
          file,
          status: UploadStatus.COMPLETE,
          data: mockResult,
          isNewProduct: isNew
        });
      }, 2000 + Math.random() * 1000); // Random delay
    });
  };

  const handleFiles = async (files: File[]) => {
    // Initialize placeholders
    const newItems = files.map(f => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      status: UploadStatus.ANALYZING
    }));
    setProcessedFiles(prev => [...prev, ...newItems]);
    setViewMode('review'); // Switch to review immediately

    // Process sequentially or parallel
    for (const item of newItems) {
      const result = await processFile(item.file);
      setProcessedFiles(prev => prev.map(p => p.file === item.file ? result : p));
      if (!selectedFileId) setSelectedFileId(result.id); // Select first one
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleUpdateCurrentField = (field: keyof PolicyData, value: any) => {
    if (!selectedFileId) return;
    setProcessedFiles(prev => prev.map(item => {
      if (item.id === selectedFileId && item.data) {
        return { ...item, data: { ...item.data, [field]: value } };
      }
      return item;
    }));
  };

  const handleUpdateRider = (index: number, field: keyof Rider, value: any) => {
    if (!selectedFileId) return;
    setProcessedFiles(prev => prev.map(item => {
      if (item.id === selectedFileId && item.data && item.data.riders) {
        const newRiders = [...item.data.riders];
        newRiders[index] = { ...newRiders[index], [field]: value };
        return { ...item, data: { ...item.data, riders: newRiders } };
      }
      return item;
    }));
  };

  const handleAddRider = () => {
    if (!selectedFileId) return;
    setProcessedFiles(prev => prev.map(item => {
      if (item.id === selectedFileId && item.data) {
        const newRider: Rider = { name: 'New Rider', type: 'Medical', premiumAmount: 0 };
        return { ...item, data: { ...item.data, riders: [...(item.data.riders || []), newRider] } };
      }
      return item;
    }));
  };

  const handleRemoveRider = (index: number) => {
    if (!selectedFileId) return;
    setProcessedFiles(prev => prev.map(item => {
      if (item.id === selectedFileId && item.data && item.data.riders) {
        const newRiders = item.data.riders.filter((_, i) => i !== index);
        return { ...item, data: { ...item.data, riders: newRiders } };
      }
      return item;
    }));
  };

  const handleSaveAll = () => {
    const completed = processedFiles.filter(p => p.status === UploadStatus.COMPLETE && p.data);
    completed.forEach(item => {
      if (item.data) onSave(item.data, !!item.isNewProduct);
    });
    alert(`Successfully saved ${completed.length} policies!`);
    // Reset
    setProcessedFiles([]);
    setViewMode('upload');
  };

  const handleRemoveItem = (id: string) => {
    setProcessedFiles(prev => prev.filter(p => p.id !== id));
    if (selectedFileId === id) setSelectedFileId(null);
  };

  const activeItem = processedFiles.find(p => p.id === selectedFileId);

  // --- Preview URL Management ---
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (activeItem?.file) {
      const url = URL.createObjectURL(activeItem.file);
      setPreviewUrl(url);

      // Cleanup previous URL when component unmounts or file changes
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [activeItem?.file]);

  // --- Render ---

  if (viewMode === 'upload' && processedFiles.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t.title}</h1>
          <p className="text-slate-500 mt-2">{t.subtitle}</p>
        </div>

        <div
          className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-brand-400 hover:bg-brand-50/10 transition-all cursor-pointer bg-slate-50"
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-6">
            <Upload className="w-10 h-10 text-brand-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-3">{t.dragDropTitle}</h3>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">{t.dragDropDesc}</p>

          <input
            type="file"
            multiple
            ref={fileInputRef}
            className="hidden"
            onChange={onFileChange}
            accept=".pdf,.jpg,.png,.csv"
          />

          <div className="flex gap-4 justify-center">
            <button className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-sm transition-colors">
              Select Files
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
              className="px-6 py-3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              CSV Template
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ListChecks className="w-6 h-6 text-brand-600" />
            Review & Validate
          </h1>
          <p className="text-slate-500 text-sm">Review {processedFiles.length} extracted policies before saving.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setProcessedFiles([]); setViewMode('upload'); }}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAll}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save All ({processedFiles.filter(p => p.status === UploadStatus.COMPLETE).length})
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left Sidebar: File List */}
        <div className="w-64 bg-white rounded-xl border border-slate-200 overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50 sticky top-0 font-semibold text-slate-700">
            Files ({processedFiles.length})
          </div>
          <div className="divide-y divide-slate-100">
            {processedFiles.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedFileId(item.id)}
                className={`p-3 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between ${selectedFileId === item.id ? 'bg-brand-50 border-l-4 border-brand-500' : ''}`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {item.status === UploadStatus.ANALYZING ? (
                    <Loader2 className="w-4 h-4 text-brand-500 animate-spin flex-shrink-0" />
                  ) : item.status === UploadStatus.ERROR ? (
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-900 truncate">{item.file.name}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id); }}
                  className="text-slate-300 hover:text-red-500 p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="p-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 border border-dashed border-slate-300 text-slate-500 rounded-lg text-xs hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-3 h-3" />
              Add More
            </button>
          </div>
        </div>

        {/* Center Panel: Document Preview */}
        <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative flex items-center justify-center p-4">
          {activeItem && previewUrl ? (
            activeItem.file.type.includes('pdf') ? (
              <iframe
                src={previewUrl}
                className="w-full h-full rounded shadow-sm"
                title="PDF Preview"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-full object-contain shadow-sm rounded bg-white"
              />
            )
          ) : (
            <p className="text-slate-400 font-medium">No file selected</p>
          )}
        </div>

        {/* Right Panel: Editor */}
        <div className="w-[400px] bg-white rounded-xl border border-slate-200 overflow-y-auto p-6 flex-shrink-0 shadow-lg">
          {activeItem ? (
            activeItem.status === UploadStatus.COMPLETE && activeItem.data ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-slate-800">Policy Details</h3>
                  {activeItem.isNewProduct && (
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      New Product
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Plan Name</label>
                    <input
                      type="text"
                      value={activeItem.data.planName}
                      onChange={e => handleUpdateCurrentField('planName', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold shadow-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Policy Number</label>
                      <input
                        type="text"
                        value={activeItem.data.policyNumber}
                        onChange={e => handleUpdateCurrentField('policyNumber', e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Type</label>
                      <select
                        value={activeItem.data.type}
                        onChange={e => handleUpdateCurrentField('type', e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                      >
                        <option value="Life">Life</option>
                        <option value="Medical">Medical</option>
                        <option value="Savings">Savings</option>
                        <option value="Critical Illness">Critical Illness</option>
                        <option value="Accident">Accident</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Holder Name</label>
                      <input
                        type="text"
                        value={activeItem.data.holderName}
                        onChange={e => handleUpdateCurrentField('holderName', e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Anniversary</label>
                      <input
                        type="text"
                        placeholder="DD/MM"
                        value={activeItem.data.policyAnniversaryDate}
                        onChange={e => handleUpdateCurrentField('policyAnniversaryDate', e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Premium & Currency</label>
                      <div className="flex gap-2">
                        <select
                          value={activeItem.data.currency || 'HKD'}
                          onChange={e => handleUpdateCurrentField('currency', e.target.value)}
                          className="w-20 p-2 border border-slate-300 rounded-lg text-sm bg-white font-medium"
                        >
                          <option value="HKD">HKD</option>
                          <option value="USD">USD</option>
                        </select>
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-2 text-slate-400">$</span>
                          <input
                            type="number"
                            value={activeItem.data.premiumAmount}
                            onChange={e => handleUpdateCurrentField('premiumAmount', parseFloat(e.target.value))}
                            className="w-full pl-6 p-2 border border-slate-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Frequency</label>
                      <select
                        value={activeItem.data.paymentMode}
                        onChange={e => handleUpdateCurrentField('paymentMode', e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                      >
                        <option value="Yearly">Yearly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Sum Insured / Face Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400">$</span>
                      <input
                        type="number"
                        value={activeItem.data.sumInsured || ''}
                        onChange={e => handleUpdateCurrentField('sumInsured', parseFloat(e.target.value))}
                        placeholder="0"
                        className="w-full pl-6 p-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Policy Values Section */}
                <div className="border-t border-slate-100 pt-4">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-3">Policy Values (Statement)</label>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Guaranteed Cash Value</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-slate-400 text-xs">$</span>
                        <input
                          type="number"
                          value={activeItem.data.cashValue || ''}
                          onChange={e => handleUpdateCurrentField('cashValue', parseFloat(e.target.value))}
                          placeholder="0.00"
                          className="w-full pl-5 p-1.5 border border-slate-300 rounded text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Accumulated Div/Int</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-slate-400 text-xs">$</span>
                        <input
                          type="number"
                          value={activeItem.data.accumulatedDividend || ''}
                          onChange={e => handleUpdateCurrentField('accumulatedDividend', parseFloat(e.target.value))}
                          placeholder="0.00"
                          className="w-full pl-5 p-1.5 border border-slate-300 rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-semibold text-brand-600">Total Surrender Value</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-slate-400 text-xs">$</span>
                      <input
                        type="number"
                        value={activeItem.data.totalCashValue || ''}
                        onChange={e => handleUpdateCurrentField('totalCashValue', parseFloat(e.target.value))}
                        placeholder="0.00"
                        className="w-full pl-5 p-1.5 border border-brand-200 bg-brand-50 rounded text-sm font-semibold text-brand-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Riders Section */}
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-xs font-semibold text-slate-500 uppercase">Riders / Benefits</label>
                    <button
                      onClick={handleAddRider}
                      className="text-xs text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Rider
                    </button>
                  </div>

                  <div className="space-y-3">
                    {activeItem.data.riders?.map((rider, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 relative group">
                        <button
                          onClick={() => handleRemoveRider(idx)}
                          className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={rider.name}
                            onChange={e => handleUpdateRider(idx, 'name', e.target.value)}
                            placeholder="Rider Name"
                            className="w-full p-1.5 border border-slate-300 rounded text-sm bg-white"
                          />
                          <div className="flex gap-2">
                            <select
                              value={rider.type}
                              onChange={e => handleUpdateRider(idx, 'type', e.target.value)}
                              className="w-1/3 p-1.5 border border-slate-300 rounded text-xs bg-white"
                            >
                              <option value="Medical">Medical</option>
                              <option value="Accident">Accident</option>
                              <option value="Critical Illness">Critical Illness</option>
                              <option value="Other">Other</option>
                            </select>
                            <input
                              type="number"
                              value={rider.sumInsured || ''}
                              onChange={e => handleUpdateRider(idx, 'sumInsured', parseFloat(e.target.value))}
                              placeholder="Sum Insured"
                              className="w-1/3 p-1.5 border border-slate-300 rounded text-xs bg-white"
                            />
                            <input
                              type="number"
                              value={rider.premiumAmount}
                              onChange={e => handleUpdateRider(idx, 'premiumAmount', parseFloat(e.target.value))}
                              placeholder="Premium"
                              className="w-1/3 p-1.5 border border-slate-300 rounded text-xs bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!activeItem.data.riders || activeItem.data.riders.length === 0) && (
                      <p className="text-xs text-slate-400 italic text-center py-2">No riders detected.</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {activeItem.data.extractedTags?.map((tag, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md flex items-center gap-1 border border-slate-200">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                {activeItem.status === UploadStatus.ANALYZING ? (
                  <>
                    <Loader2 className="w-10 h-10 mb-4 animate-spin text-brand-300" />
                    <p>Analyzing document...</p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-10 h-10 mb-4 text-red-300" />
                    <p className="text-red-500 font-medium">Processing Error</p>
                    <p className="text-sm">{activeItem.error}</p>
                  </>
                )}
              </div>
            )
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <FileText className="w-12 h-12 mb-4 opacity-20" />
              <p>Select a file from the list to review details</p>
            </div>
          )}
        </div>
      </div>

      {/* Hidden Input for Add More */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        className="hidden"
        onChange={onFileChange}
        accept=".pdf,.jpg,.png,.csv"
      />
    </div>
  );
};