import React, { useState } from 'react';
import { Product } from '../types';
import { TRANSLATIONS } from '../constants';
import { Search, Plus, MoreHorizontal, Shield, Tag, Box, HeartPulse, Home, Car, AlertTriangle, PiggyBank, Briefcase, Pencil, X, Check, Save, Layers } from 'lucide-react';

interface ProductLibraryViewProps {
  t: typeof TRANSLATIONS['en']['products'];
  products: Product[];
  onUpdateProduct: (product: Product, originalName: string) => void;
  onAddProduct: (product: Product) => void;
  onMergeProducts: (masterProduct: Product, productsToDelete: string[]) => void;
}

export const ProductLibraryView: React.FC<ProductLibraryViewProps> = ({ t, products, onUpdateProduct, onAddProduct, onMergeProducts }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Selection State
  const [selectedProductNames, setSelectedProductNames] = useState<string[]>([]);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [masterProductName, setMasterProductName] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [originalName, setOriginalName] = useState<string>(''); // To track name changes
  const [newTagInput, setNewTagInput] = useState('');

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectProduct = (name: string) => {
    setSelectedProductNames(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProductNames(filteredProducts.map(p => p.name));
    } else {
      setSelectedProductNames([]);
    }
  };

  const handleMergeClick = () => {
    if (selectedProductNames.length < 2) return;
    setMasterProductName(selectedProductNames[0]);
    setIsMergeModalOpen(true);
  };

  const handleExecuteMerge = () => {
    const masterProduct = products.find(p => p.name === masterProductName);
    if (!masterProduct) return;

    const productsToDelete = selectedProductNames.filter(name => name !== masterProductName);
    onMergeProducts(masterProduct, productsToDelete);

    setIsMergeModalOpen(false);
    setSelectedProductNames([]);
  };

  const handleScanDuplicates = () => {
    // Refined scanner: find products with identical names after normalization (ignoring case, spaces, and special chars)
    const duplicates: string[] = [];
    const seenMap = new Map<string, string[]>();

    products.forEach(p => {
      const normalized = p.name.toLowerCase().replace(/[^a-z0-j0-9]/g, '');
      const existing = seenMap.get(normalized) || [];
      seenMap.set(normalized, [...existing, p.name]);
    });

    seenMap.forEach((names) => {
      if (names.length > 1) {
        duplicates.push(...names);
      }
    });

    if (duplicates.length > 0) {
      const uniqueDupes = Array.from(new Set(duplicates));
      setSelectedProductNames(uniqueDupes);
      alert(`Found ${uniqueDupes.length} potential duplicates with overlapping names. They have been selected for your review.`);
    } else {
      alert("No obvious duplicates found.");
    }
  };

  const getTypeIcon = (type: Product['type']) => {
    switch (type) {
      case 'Medical': return <HeartPulse className="w-4 h-4" />;
      case 'Life': return <Shield className="w-4 h-4" />;
      case 'Auto': return <Car className="w-4 h-4" />;
      case 'Property': return <Home className="w-4 h-4" />;
      case 'Critical Illness': return <AlertTriangle className="w-4 h-4" />;
      case 'Savings': return <PiggyBank className="w-4 h-4" />;
      case 'Accident': return <Briefcase className="w-4 h-4" />;
      case 'Rider': return <Layers className="w-4 h-4" />;
      default: return <Box className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: Product['type']) => {
    switch (type) {
      case 'Medical': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'Life': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Auto': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Property': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'Critical Illness': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Savings': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Rider': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct({ ...product });
    setOriginalName(product.name);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingProduct({
      name: '',
      provider: '',
      type: 'Life',
      defaultTags: [],
      isTaxDeductible: false,
      annualCoverageLimit: undefined,
      wholeLifeCoverageLimit: undefined
    });
    setOriginalName('');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingProduct && editingProduct.name) {
      if (originalName) {
        onUpdateProduct(editingProduct, originalName);
      } else {
        onAddProduct(editingProduct);
      }
      setIsModalOpen(false);
      setEditingProduct(null);
    }
  };

  const handleAddTag = () => {
    if (editingProduct && newTagInput.trim()) {
      const updatedTags = [...editingProduct.defaultTags, newTagInput.trim()];
      setEditingProduct({ ...editingProduct, defaultTags: updatedTags });
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    if (editingProduct) {
      const updatedTags = editingProduct.defaultTags.filter((_, i) => i !== index);
      setEditingProduct({ ...editingProduct, defaultTags: updatedTags });
    }
  };

  const HK_PROVIDERS = [
    'AIA', 'Prudential', 'Manulife', 'Sun Life', 'FWD', 'AXA',
    'China Life', 'HSBC Life', 'BOC Life', 'Bupa', 'Cigna', 'Zurich'
  ];

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t.title}</h1>
          <p className="text-slate-500 text-sm mt-1">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleScanDuplicates}
            className="px-4 py-2 text-brand-600 border border-brand-200 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors flex items-center space-x-2"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Standardize Library</span>
          </button>
          <button
            onClick={handleAddClick}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-sm w-full md:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addProduct}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {selectedProductNames.length > 0 && (
            <div className="flex items-center gap-4 ml-4 animate-in fade-in slide-in-from-right-4">
              <span className="text-sm font-medium text-slate-600">{selectedProductNames.length} Selected</span>
              <button
                disabled={selectedProductNames.length < 2}
                onClick={handleMergeClick}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                Merge Duplicates
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedProductNames.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                </th>
                <th className="px-6 py-4 w-1/3">{t.table.name}</th>
                <th className="px-6 py-4">{t.table.provider}</th>
                <th className="px-6 py-4">{t.table.type}</th>
                <th className="px-6 py-4">{t.table.tags}</th>
                <th className="px-6 py-4 text-right">{t.table.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProducts.map((product, index) => (
                <tr key={`${product.name}-${index}`} className={`hover:bg-slate-50 transition-colors group ${selectedProductNames.includes(product.name) ? 'bg-brand-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProductNames.includes(product.name)}
                      onChange={() => handleSelectProduct(product.name)}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-800">{product.name}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {product.provider}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border gap-1.5 ${getTypeColor(product.type)}`}>
                        {getTypeIcon(product.type)}
                        {product.type}
                      </span>
                      {product.isTaxDeductible && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                          <Check className="w-3 h-3 mr-1" />
                          {t.form.taxDeductible}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {product.defaultTags.map(tag => (
                        <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <Tag className="w-3 h-3 mr-1 opacity-50" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEditClick(product)}
                      className="p-2 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
                      title={t.editProduct}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Box className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p>{t.table.noProducts}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Merge Confirmation Modal */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-600" />
                Merge Selection
              </h3>
              <button
                onClick={() => setIsMergeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-sm text-slate-600 leading-relaxed">
                You are merging <strong>{selectedProductNames.length}</strong> products. <br />
                Which one is the <u>Correct</u> product name/category to keep?
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {selectedProductNames.map(name => {
                  const p = products.find(prod => prod.name === name);
                  const isSelected = masterProductName === name;
                  return (
                    <div
                      key={name}
                      onClick={() => setMasterProductName(name)}
                      className={`group flex items-center p-3 border rounded-xl cursor-pointer transition-all duration-200 ${isSelected
                        ? 'border-brand-500 bg-brand-50/50 shadow-sm ring-1 ring-brand-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${isSelected ? 'border-brand-600 bg-brand-600' : 'border-slate-300 group-hover:border-slate-400'
                        }`}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold truncate ${isSelected ? 'text-brand-950' : 'text-slate-800'}`}>
                          {name}
                        </div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-2 mt-0.5">
                          {p?.provider} <span className="w-1 h-1 bg-slate-200 rounded-full" /> {p?.type}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-start gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                <Shield className="w-4 h-4 text-indigo-600 mt-0.5" />
                <div className="text-xs text-indigo-800 leading-normal">
                  <strong>Sync Logic:</strong> All data in existing policies (Plan Name, Provider, Category) will be updated to match your selection. This cannot be undone.
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t flex justify-end gap-3">
              <button
                onClick={() => setIsMergeModalOpen(false)}
                className="px-4 py-2 text-slate-600 font-semibold hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteMerge}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-black shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                Merge into "{masterProductName}"
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">
                {originalName ? t.editProduct : t.addProduct}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.form.name}</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.form.provider}</label>
                <input
                  list="provider-list"
                  type="text"
                  value={editingProduct.provider}
                  onChange={(e) => setEditingProduct({ ...editingProduct, provider: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Select or type insurer..."
                />
                <datalist id="provider-list">
                  {HK_PROVIDERS.map(p => <option key={p} value={p} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.form.type}</label>
                <select
                  value={editingProduct.type}
                  onChange={(e) => setEditingProduct({ ...editingProduct, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-brand-500 transition-colors cursor-pointer appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                >
                  <option value="Life">Life</option>
                  <option value="Medical">Medical</option>
                  <option value="Auto">Auto</option>
                  <option value="Property">Property</option>
                  <option value="Critical Illness">Critical Illness</option>
                  <option value="Savings">Savings</option>
                  <option value="Accident">Accident</option>
                  <option value="Hospital Income">Hospital Income</option>
                  <option value="Surgical Cash">Surgical Cash</option>
                  <option value="Pay Waiver">Pay Waiver</option>
                  <option value="Rider">Rider</option>
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2 cursor-pointer p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={!!editingProduct.isTaxDeductible}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isTaxDeductible: e.target.checked })}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span>{t.form.taxDeductible}</span>
                </label>
              </div>

              {['Medical', 'Rider', 'Critical Illness'].includes(editingProduct.type) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.form.annualLimit || 'Annual Limit'}</label>
                    <input
                      type="number"
                      value={editingProduct.annualCoverageLimit || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, annualCoverageLimit: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="e.g. 10000000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.form.lifeLimit || 'Life Limit'}</label>
                    <input
                      type="number"
                      value={editingProduct.wholeLifeCoverageLimit || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, wholeLifeCoverageLimit: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="e.g. 30000000"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.form.tags}</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder={t.form.addTag}
                    className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[24px]">
                  {editingProduct.defaultTags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(idx)}
                        className="ml-1.5 text-brand-400 hover:text-brand-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:text-slate-800"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 shadow-sm flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};