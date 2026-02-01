
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
    const headers = ['PolicyNumber', 'PlanName', 'HolderName', 'Birthday(YYYY-MM-DD)', 'Anniversary(DD/MM)', 'Premium', 'PaymentMode', 'Type'];
    const rows = [
      ['POL-001', 'Example Care Plan', 'John Doe', '1990-01-01', '01/01', '1200', 'Yearly', 'Medical']
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
      // If we have an API key and it's an image/pdf, try real analysis
      if (storedApiKey && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
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
            status: 'Active',
            extractedTags: [...(aiResult.extractedTags || []), 'AI Parsed'],
            riders: [],
            sumInsured: 0
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
          status: 'Active',
          extractedTags: derivedTags,
          riders: [],
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

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Sidebar: File List */}
        <div className="w-1/3 bg-white rounded-xl border border-slate-200 overflow-y-auto">
          <div className="p-4 border-b border-slate-100 bg-slate-50 sticky top-0 font-semibold text-slate-700">
            Uploaded Files
          </div>
          <div className="divide-y divide-slate-100">
            {processedFiles.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedFileId(item.id)}
                className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between ${selectedFileId === item.id ? 'bg-brand-50 border-l-4 border-brand-500' : ''}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {item.status === UploadStatus.ANALYZING ? (
                    <Loader2 className="w-5 h-5 text-brand-500 animate-spin flex-shrink-0" />
                  ) : item.status === UploadStatus.ERROR ? (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.file.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {item.data ? item.data.planName : item.status}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id); }}
                  className="text-slate-300 hover:text-red-500 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="p-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 border border-dashed border-slate-300 text-slate-500 rounded-lg text-sm hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add More Files
            </button>
          </div>
        </div>

        {/* Right Panel: Editor */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-y-auto p-6">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Plan Name</label>
                    <input
                      type="text"
                      value={activeItem.data.planName}
                      onChange={e => handleUpdateCurrentField('planName', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold"
                    />
                  </div>
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
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Holder Name</label>
                    <input
                      type="text"
                      value={activeItem.data.holderName}
                      onChange={e => handleUpdateCurrentField('holderName', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Premium ($)</label>
                    <input
                      type="number"
                      value={activeItem.data.premiumAmount}
                      onChange={e => handleUpdateCurrentField('premiumAmount', parseFloat(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Anniversary (DD/MM)</label>
                    <input
                      type="text"
                      value={activeItem.data.policyAnniversaryDate}
                      onChange={e => handleUpdateCurrentField('policyAnniversaryDate', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm"
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

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {activeItem.data.extractedTags?.map((tag, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md flex items-center gap-1">
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