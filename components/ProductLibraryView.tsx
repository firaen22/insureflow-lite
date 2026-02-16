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
    // Basic scanner: find products with identical names (case insensitive) or very similar
    const duplicates: string[] = [];
    const seen = new Set<string>();

    products.forEach(p => {
      const normalized = p.name.toLowerCase().replace(/\s+/g, '');
      products.forEach(other => {
        if (p.name !== other.name) {
          const otherNormalized = other.name.toLowerCase().replace(/\s+/g, '');
          if (normalized === otherNormalized || normalized.includes(otherNormalized) || otherNormalized.includes(normalized)) {
            duplicates.push(p.name);
            duplicates.push(other.name);
          }
        }
      });
    });

    if (duplicates.length > 0) {
      const uniqueDupes = Array.from(new Set(duplicates));
      setSelectedProductNames(uniqueDupes);
      alert(`Found ${uniqueDupes.length} potential duplicates. They have been selected for you.`);
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
      defaultTags: []
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
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border gap-1.5 ${getTypeColor(product.type)}`}>
                      {getTypeIcon(product.type)}
                      {product.type}
                    </span>
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-600" />
                Merge Products
              </h3>
              <button onClick={() => setIsMergeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                You are merging <strong>{selectedProductNames.length}</strong> products into one. Please select the primary product to keep:
              </p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                {selectedProductNames.map(name => {
                  const p = products.find(prod => prod.name === name);
                  return (
                    <label key={name} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${masterProductName === name ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input
                        type="radio"
                        name="master-product"
                        value={name}
                        checked={masterProductName === name}
                        onChange={() => setMasterProductName(name)}
                        className="text-brand-600 focus:ring-brand-500 mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800">{name}</div>
                        <div className="text-xs text-slate-500">{p?.provider} • {p?.type}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700">
                  This action will delete all other selected products and update all existing client policies to match the primary product details.
                </p>
              </div>
            </div>
            <div className="p-5 bg-slate-50 border-t flex justify-end gap-3">
              <button onClick={() => setIsMergeModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium">Cancel</button>
              <button onClick={handleExecuteMerge} className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 shadow-sm">Confirm Merge</button>
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="Life">Life</option>
                  <option value="Medical">Medical</option>
                  <option value="Auto">Auto</option>
                  <option value="Property">Property</option>
                  <option value="Critical Illness">Critical Illness</option>
                  <option value="Savings">Savings</option>
                  <option value="Accident">Accident</option>
                  <option value="Rider">Rider</option>
                </select>
              </div>

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