import React, { useState } from 'react';
import { Product } from '../types';
import { TRANSLATIONS, PRODUCT_TYPES, HK_PROVIDERS } from '../constants';
import { Search, Plus, MoreHorizontal, Shield, Tag, Box, HeartPulse, Home, Car, AlertTriangle, PiggyBank, Briefcase, Pencil, X, Check, Save, Layers } from 'lucide-react';
import { useToast } from './Toast';

interface ProductLibraryViewProps {
  t: typeof TRANSLATIONS['en']['products'];
  products: Product[];
  onUpdateProduct: (product: Product, originalName: string) => void;
  onAddProduct: (product: Product) => void;
  onMergeProducts: (masterProduct: Product, productsToDelete: string[]) => void;
}

export const ProductLibraryView: React.FC<ProductLibraryViewProps> = ({ t, products, onUpdateProduct, onAddProduct, onMergeProducts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  // Selection State
  const [selectedProductNames, setSelectedProductNames] = useState<string[]>([]);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [masterProductName, setMasterProductName] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [originalName, setOriginalName] = useState<string>(''); // To track name changes
  const [newTagInput, setNewTagInput] = useState('');
  const [isCustomProvider, setIsCustomProvider] = useState(false);

  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.provider.toLowerCase().includes(searchLower) ||
      product.type.toLowerCase().includes(searchLower) ||
      product.defaultTags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  // Group filtered products by provider and sort alphabetically
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const provider = product.provider || 'Unknown';
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const sortedProviders = Object.keys(groupedProducts).sort();

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
      toast.info(`Found ${uniqueDupes.length} potential duplicates with overlapping names. They have been selected for your review.`);
    } else {
      toast.success("No obvious duplicates found.");
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
      case 'Medical': return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-500/20';
      case 'Life': return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-500/20';
      case 'Auto': return 'bg-white dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10';
      case 'Property': return 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-100/20';
      case 'Critical Illness': return 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-500/20';
      case 'Savings': return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-500/20';
      case 'Rider': return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-500/20';
      default: return 'bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-400 border-gray-100 dark:border-white/10';
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct({ ...product });
    setOriginalName(product.name);
    setIsCustomProvider(product.provider !== '' && !HK_PROVIDERS.some(p => p.toLowerCase() === product.provider.toLowerCase()));
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
    setIsCustomProvider(false);
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


  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleScanDuplicates}
            className="px-4 py-2 text-white border border-brand-200 bg-slate-100 dark:bg-white/10 rounded-lg hover:bg-brand-100 transition-colors flex items-center space-x-2"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Standardize Library</span>
          </button>
          <button
            onClick={handleAddClick}
            className="bg-brand-600 hover:bg-brand-700 text-slate-900 dark:text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-lg shadow-black/20 w-full md:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addProduct}</span>
          </button>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-xl border border-slate-200 dark:border-white/10 shadow-lg shadow-black/20 overflow-hidden">
        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]/50 flex justify-between items-center">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-white/5 text-slate-900 dark:text-white"
            />
          </div>

          {selectedProductNames.length > 0 && (
            <div className="flex items-center gap-4 ml-4 animate-in fade-in slide-in-from-right-4">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{selectedProductNames.length} Selected</span>
              <button
                disabled={selectedProductNames.length < 2}
                onClick={handleMergeClick}
                className="px-4 py-2 bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                Merge Duplicates
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedProductNames.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 dark:border-white/20 text-slate-900 dark:text-white focus:ring-brand-500"
                  />
                </th>
                <th className="px-6 py-4 w-1/3">{t.table.name}</th>
                <th className="px-6 py-4">{t.table.provider}</th>
                <th className="px-6 py-4">{t.table.type}</th>
                <th className="px-6 py-4">{t.table.tags}</th>
                <th className="px-6 py-4 text-right">{t.table.actions}</th>
              </tr>
            </thead>
            {sortedProviders.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Box className="w-12 h-12 text-slate-600 dark:text-slate-300 mb-3" />
                      <p className="text-lg font-medium text-slate-700 dark:text-slate-200">No products found</p>
                      <p className="text-sm mt-1">Try adjusting your search or add a new product.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : (
              sortedProviders.map(provider => (
                <tbody key={provider} className="bg-white/80 dark:bg-white/5 backdrop-blur-xl">
                  {/* Group Header Row */}
                  <tr className="bg-slate-50 dark:bg-white/[0.03] border-t border-b border-slate-200 dark:border-white/10">
                    <td colSpan={6} className="px-6 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {provider} <span className="text-slate-500 dark:text-slate-400 font-medium ml-2">({groupedProducts[provider].length})</span>
                    </td>
                  </tr>

                  {/* Group Products */}
                  {groupedProducts[provider].map((product, index) => (
                    <tr key={`${product.name}-${index}`} className={`hover:bg-slate-50 dark:bg-white/[0.02] transition-colors border-b border-slate-100 dark:border-white/5 group ${selectedProductNames.includes(product.name) ? 'bg-slate-100 dark:bg-white/10/30' : ''}`}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProductNames.includes(product.name)}
                          onChange={() => handleSelectProduct(product.name)}
                          className="rounded border-slate-300 dark:border-white/20 text-slate-900 dark:text-white focus:ring-brand-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white group-hover:text-slate-900 dark:text-white transition-colors">{product.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-slate-600 dark:text-slate-300">
                          {product.provider.toLowerCase() === 'aia' && <Shield className="w-3.5 h-3.5 mr-2 text-rose-600" />}
                          {product.provider.toLowerCase() === 'prudential' && <Shield className="w-3.5 h-3.5 mr-2 text-slate-900 dark:text-white" />}
                          {product.provider.toLowerCase() === 'manulife' && <Shield className="w-3.5 h-3.5 mr-2 text-emerald-600" />}
                          {product.provider.toLowerCase() === 'sun life' && <Shield className="w-3.5 h-3.5 mr-2 text-amber-500" />}
                          {product.provider.toLowerCase() === 'fwd' && <Shield className="w-3.5 h-3.5 mr-2 text-orange-500" />}
                          {product.provider.toLowerCase() === 'axa' && <Shield className="w-3.5 h-3.5 mr-2 text-blue-600" />}
                          {product.provider.toLowerCase() === 'china life' && <Shield className="w-3.5 h-3.5 mr-2 text-red-700" />}
                          {product.provider.toLowerCase() === 'hsbc life' && <Shield className="w-3.5 h-3.5 mr-2 text-slate-900 dark:text-white" />}
                          {!['aia', 'prudential', 'manulife', 'sun life', 'fwd', 'axa', 'china life', 'hsbc life'].includes(product.provider.toLowerCase()) && <Shield className="w-3.5 h-3.5 mr-2 text-slate-500 dark:text-slate-400" />}
                          <span className="font-medium">{product.provider}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(product.type)}`}>
                          {getTypeIcon(product.type)}
                          <span className="ml-1.5">{product.type}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {product.defaultTags?.map((tag, i) => (
                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                              <Tag className="w-2.5 h-2.5 mr-1" />
                              {tag}
                            </span>
                          ))}
                          {(!product.defaultTags || product.defaultTags.length === 0) && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 italic">No tags</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEditClick(product)}
                          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors p-1"
                          title="Edit Product"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))
            )}
          </table>
        </div>
      </div>

      {/* Merge Confirmation Modal */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-100 dark:bg-slate-900/50 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-xl shadow-sm dark:shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/[0.02]">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-slate-900 dark:text-white" />
                Merge Selection
              </h3>
              <button
                onClick={() => setIsMergeModalOpen(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
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
                        ? 'border-brand-500 bg-slate-100 dark:bg-white/10/50 shadow-lg shadow-black/20 ring-1 ring-brand-500'
                        : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:border-white/20 hover:bg-slate-50 dark:bg-white/[0.02]'
                        }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${isSelected ? 'border-brand-600 bg-brand-600' : 'border-slate-300 dark:border-white/20 group-hover:border-slate-400'
                        }`}>
                        {isSelected && <div className="w-2 h-2 bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-full" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold truncate ${isSelected ? 'text-brand-950' : 'text-slate-900 dark:text-white'}`}>
                          {name}
                        </div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          {p?.provider} <span className="w-1 h-1 bg-slate-100 dark:bg-white/10 rounded-full" /> {p?.type}
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

            <div className="p-5 bg-slate-50 dark:bg-white/[0.02] border-t flex justify-end gap-3">
              <button
                onClick={() => setIsMergeModalOpen(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 font-semibold hover:text-slate-900 dark:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteMerge}
                className="px-6 py-2 bg-slate-900 text-slate-900 dark:text-white rounded-lg font-bold hover:bg-black shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                Merge into "{masterProductName}"
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100 dark:bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-xl shadow-sm dark:shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/[0.02]">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {originalName ? t.editProduct : t.addProduct}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t.form.name}</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-white/5 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t.form.provider}</label>
                <div className="space-y-2">
                  <select
                    value={isCustomProvider ? 'Other' : editingProduct.provider}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Other') {
                        setIsCustomProvider(true);
                        setEditingProduct({ ...editingProduct, provider: '' });
                      } else {
                        setIsCustomProvider(false);
                        setEditingProduct({ ...editingProduct, provider: val });
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/20 rounded-lg text-sm bg-slate-50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 backdrop-blur-xl focus:bg-white/80 dark:focus:bg-white/10 focus:ring-2 focus:ring-brand-500 transition-colors cursor-pointer appearance-none text-slate-900 dark:text-white"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                  >
                    <option value="" disabled>Select insurer...</option>
                    {HK_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                    <option value="Other">Other / Custom...</option>
                  </select>

                  {isCustomProvider && (
                    <input
                      type="text"
                      value={editingProduct.provider}
                      onChange={(e) => setEditingProduct({ ...editingProduct, provider: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 animate-in fade-in slide-in-from-top-1 bg-white dark:bg-white/5 text-slate-900 dark:text-white"
                      placeholder="Enter custom insurer name..."
                      autoFocus
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t.form.type}</label>
                <select
                  value={editingProduct.type}
                  onChange={(e) => setEditingProduct({ ...editingProduct, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/20 rounded-lg text-sm bg-slate-50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 backdrop-blur-xl focus:bg-white/80 dark:focus:bg-white/10 focus:ring-2 focus:ring-brand-500 transition-colors cursor-pointer appearance-none text-slate-900 dark:text-white"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                >
                  {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  <option value="Rider">Rider</option>
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 dark:text-slate-200 mb-2 cursor-pointer p-3 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:bg-white/[0.02] transition-colors">
                  <input
                    type="checkbox"
                    checked={!!editingProduct.isTaxDeductible}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isTaxDeductible: e.target.checked })}
                    className="rounded border-slate-300 dark:border-white/20 text-slate-900 dark:text-white focus:ring-brand-500 w-4 h-4"
                  />
                  <span>{t.form.taxDeductible}</span>
                </label>
              </div>

              {['Medical', 'Rider', 'Critical Illness'].includes(editingProduct.type) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t.form.annualLimit || 'Annual Limit'}</label>
                    <input
                      type="number"
                      value={editingProduct.annualCoverageLimit || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, annualCoverageLimit: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-white/5 text-slate-900 dark:text-white"
                      placeholder="e.g. 10000000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t.form.lifeLimit || 'Life Limit'}</label>
                    <input
                      type="number"
                      value={editingProduct.wholeLifeCoverageLimit || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, wholeLifeCoverageLimit: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-white/5 text-slate-900 dark:text-white"
                      placeholder="e.g. 30000000"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t.form.tags}</label>
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
                    className="flex-1 px-3 py-1.5 text-sm border border-slate-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-white/5 text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-3 py-1.5 bg-white dark:bg-white/[0.05] hover:bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[24px]">
                  {editingProduct.defaultTags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-white/10 text-brand-700 border border-brand-100">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(idx)}
                        className="ml-1.5 text-brand-400 hover:text-slate-900 dark:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:text-slate-900 dark:text-white"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 shadow-lg shadow-black/20 flex items-center gap-2"
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