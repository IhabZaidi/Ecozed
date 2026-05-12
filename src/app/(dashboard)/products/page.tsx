"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button, Input, Modal } from "@/components/ui";
import { useLanguage } from "@/lib/translations";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  CheckSquare, 
  Square, 
  AlertCircle,
  TrendingUp,
  Image as ImageIcon,
  MoreVertical,
  XCircle,
  Maximize2,
  LayoutGrid,
  List as ListIcon,
  RefreshCw,
  Store as StoreIcon,
  Package as PackageIcon
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  weight: number | null;
  cost: number;
  sellingPrice: number;
  adsCost: number;
  extraCharges: number;
  imageUrl: string | null;
  description: string | null;
  landingPageUrl: string | null;
  status: "DRAFT" | "TESTING" | "PRODUCTION";
  storeId: string;
}

export default function ProductsPage() {
  const { t, language } = useLanguage();
  const { user, activeStoreIds } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    weight: "",
    cost: "",
    sellingPrice: "",
    adsCost: "0",
    extraCharges: "0",
    imageUrl: "",
    description: "",
    landingPageUrl: "",
    status: "DRAFT" as Product["status"],
    storeId: "",
  });

  const [bulkData, setBulkData] = useState({
    status: "",
    cost: "",
    sellingPrice: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products?storeIds=${activeStoreIds.join(",")}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeStoreIds.length > 0) {
      fetchProducts();
    } else {
      setProducts([]);
    }
  }, [activeStoreIds]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      weight: "",
      cost: "",
      sellingPrice: "",
      adsCost: "0",
      extraCharges: "0",
      imageUrl: "",
      description: "",
      landingPageUrl: "",
      status: "DRAFT",
      storeId: activeStoreIds.length === 1 ? activeStoreIds[0] : (user?.stores?.[0]?.id || ""),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      weight: product.weight?.toString() || "",
      cost: product.cost.toString(),
      sellingPrice: product.sellingPrice.toString(),
      adsCost: product.adsCost.toString(),
      extraCharges: product.extraCharges.toString(),
      imageUrl: product.imageUrl || "",
      description: product.description || "",
      landingPageUrl: product.landingPageUrl || "",
      status: product.status,
      storeId: product.storeId,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const method = editingProduct ? "PUT" : "POST";
    const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
    
    const res = await fetch(url, {
      method,
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchProducts();
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setIsLoading(true);
    const res = await fetch(`/api/products/${productToDelete}`, { method: "DELETE" });
    if (res.ok) {
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      fetchProducts();
    }
    setIsLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => 
      prev.length === products.length ? [] : products.map(p => p.id)
    );
  };

  const handleBulkDelete = async () => {
    if (!confirm(language === "ar" ? `هل أنت متأكد من حذف ${selectedIds.length} منتجات؟` : `Are you sure you want to delete ${selectedIds.length} products?`)) return;
    const res = await fetch("/api/products/bulk", {
      method: "POST",
      body: JSON.stringify({ ids: selectedIds, action: "delete" }),
    });
    if (res.ok) {
      setSelectedIds([]);
      fetchProducts();
    }
  };

  const handleBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await fetch("/api/products/bulk", {
      method: "POST",
      body: JSON.stringify({ ids: selectedIds, action: "update", data: bulkData }),
    });
    if (res.ok) {
      setSelectedIds([]);
      setIsBulkUpdateOpen(false);
      fetchProducts();
    }
    setIsLoading(false);
  };

  const statusMap = {
    DRAFT: { label: t.draft, color: "bg-slate-100 text-slate-600 border-slate-200" },
    TESTING: { label: t.testing, color: "bg-amber-100 text-amber-600 border-amber-200" },
    PRODUCTION: { label: t.production, color: "bg-green-100 text-green-600 border-green-200" },
  };

  const isRtl = language === "ar";

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t.productsTitle}</h2>
          <p className="text-slate-500">{t.productsDesc}</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Refresh Button */}
          <Button 
            variant="secondary" 
            onClick={fetchProducts} 
            className="p-2.5"
            title={t.refresh}
          >
            <div className={`${isLoading ? "animate-spin" : ""}`}>
              <RefreshCw size={18} />
            </div>
          </Button>

          {/* View Mode Toggle */}
          <div className="bg-white border border-slate-200 rounded-lg p-1 flex items-center shadow-sm">
            <button 
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              <ListIcon size={18} />
            </button>
            <button 
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex gap-2 animate-in slide-in-from-left-4">
              <Button variant="secondary" onClick={() => setIsBulkUpdateOpen(true)} className="gap-2 text-sm">
                {t.edit} ({selectedIds.length})
              </Button>
              <Button variant="danger" onClick={handleBulkDelete} className="gap-2 text-sm">
                {t.delete}
              </Button>
            </div>
          )}
          <Button 
            onClick={handleOpenAdd} 
            disabled={(user?.stores?.length || 0) === 0}
            className="gap-2 shadow-lg shadow-slate-900/10 disabled:opacity-50 disabled:shadow-none"
          >
            <Plus size={18} />
            <span className="font-bold">{t.addNew}</span>
          </Button>
        </div>
      </div>

      {/* No Store Warning */}
      {(user?.stores?.length || 0) === 0 && (
        <div className="mb-8 p-6 bg-amber-50 border-2 border-amber-100 rounded-[32px] flex items-center gap-4 animate-in slide-in-from-top-2">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm">
            <AlertCircle size={24} />
          </div>
          <div className="flex-1">
             <h4 className="font-black text-amber-900">{isRtl ? "تنبيه: لا يوجد متاجر" : "Warning: No Stores Found"}</h4>
             <p className="text-amber-700 text-sm">
               {isRtl 
                 ? "يجب عليك إنشاء متجر واحد على الأقل لتتمكن من إضافة المنتجات." 
                 : "You must create at least one store before you can add products."}
             </p>
          </div>
          <Button 
            variant="secondary" 
            onClick={() => window.location.href = "/stores"}
            className="h-10 text-xs font-bold bg-white border-amber-200 text-amber-700 hover:bg-amber-100 transition-all"
          >
            {t.manageStores}
          </Button>
        </div>
      )}

      {viewMode === "list" ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className={`w-full ${isRtl ? "text-right" : "text-left"}`}>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 w-12 text-center">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600 transition-colors">
                      {selectedIds.length === products.length && products.length > 0 ? <CheckSquare size={20} className="text-slate-900" /> : <Square size={20} />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700">{t.productsTitle}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700">{t.status}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-center">{t.productCost}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-center">{t.productPrice}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-center">{t.netProfit}</th>
                  <th className={`px-6 py-4 text-sm font-semibold text-slate-700 ${isRtl ? "text-left" : "text-right"}`}>{t.confirm}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => {
                  const netProfit = product.sellingPrice - (product.cost + product.adsCost + product.extraCharges);
                  const isPositive = netProfit > 0;
                  const storeName = user?.stores.find(s => s.id === product.storeId)?.name;

                  return (
                    <tr key={product.id} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(product.id) ? "bg-slate-50" : ""}`}>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => toggleSelect(product.id)} className="text-slate-400 hover:text-slate-600 transition-colors">
                          {selectedIds.includes(product.id) ? <CheckSquare size={20} className="text-slate-900" /> : <Square size={20} />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => product.imageUrl && setPreviewImage(product.imageUrl)}
                            className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 group relative"
                          >
                            {product.imageUrl ? (
                              <>
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Maximize2 size={14} className="text-white" />
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <ImageIcon size={20} />
                              </div>
                            )}
                          </button>
                          <div>
                            <div className="font-bold text-slate-900">{product.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                               <div className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">{storeName}</div>
                               <span className="text-[10px] text-slate-400 font-bold tracking-tight">{product.weight ? `${product.weight} ${isRtl ? "كغ" : "kg"}` : ""}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${statusMap[product.status]?.color}`}>
                          {statusMap[product.status]?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-[10px] font-bold text-slate-400 mb-1 leading-none uppercase tracking-widest">{isRtl ? "إجمالي" : "Total"}: {product.cost + product.adsCost + product.extraCharges}</div>
                        <div className="flex items-center justify-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                          <span>{t.adsCost}: {product.adsCost}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-200" />
                          <span>{t.extraCharges}: {product.extraCharges}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-black text-slate-900 font-mono">
                        {product.sellingPrice} <span className="text-[10px] font-normal text-slate-400">{isRtl ? "د.ج" : "DA"}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black border ${
                          isPositive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                        }`}>
                          <TrendingUp size={12} className={isPositive ? "" : "rotate-180"} />
                          <span>{netProfit.toFixed(0)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`flex gap-1 ${isRtl ? "justify-start" : "justify-end"}`}>
                          <button 
                            onClick={() => handleOpenEdit(product)}
                            className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100 shadow-none hover:shadow-lg"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              setProductToDelete(product.id);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-red-50 shadow-none hover:shadow-lg"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const netProfit = product.sellingPrice - (product.cost + product.adsCost + product.extraCharges);
            const isPositive = netProfit > 0;
            const storeName = user?.stores.find(s => s.id === product.storeId)?.name;

            return (
              <div 
                key={product.id} 
                className={`bg-white rounded-[24px] border-2 transition-all group overflow-hidden flex flex-col relative ${
                  selectedIds.includes(product.id) ? "border-slate-900 shadow-2xl shadow-slate-900/10" : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className="relative aspect-square bg-slate-50 overflow-hidden m-3 rounded-[20px] shadow-inner">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                      <ImageIcon size={48} strokeWidth={1.5} />
                    </div>
                  )}
                  
                  {/* Store Badge in Grid */}
                  <div className={`absolute bottom-3 ${isRtl ? "right-3" : "left-3"}`}>
                    <div className="px-2.5 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-slate-100 shadow-sm flex items-center gap-2">
                       <StoreIcon size={10} className="text-slate-400" />
                       <span className="text-[10px] font-black text-slate-700 truncate max-w-[100px] uppercase tracking-wider">{storeName}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => toggleSelect(product.id)}
                    className={`absolute top-3 p-2 rounded-xl bg-white shadow-lg text-slate-300 hover:text-slate-900 transition-all ${isRtl ? "left-3" : "right-3"}`}
                  >
                    {selectedIds.includes(product.id) ? <CheckSquare size={20} className="text-slate-900" /> : <Square size={20} />}
                  </button>
                  
                  <div className={`absolute top-3 ${isRtl ? "right-3" : "left-3"}`}>
                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black border shadow-lg uppercase tracking-[0.1em] ${statusMap[product.status]?.color}`}>
                      {statusMap[product.status]?.label}
                    </span>
                  </div>
                </div>

                <div className={`p-5 pt-2 flex-1 flex flex-col ${isRtl ? "text-right" : "text-left"}`}>
                  <div className="mb-4">
                    <h3 className="text-lg font-black text-slate-900 mb-1 leading-tight">{product.name}</h3>
                    <p className="text-[11px] font-bold text-slate-400 tracking-tight">{product.weight ? `${product.weight} ${isRtl ? "كغ" : "kg"}` : t.weight}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">{isRtl ? "التكلفة" : "Cost"}</div>
                      <div className="font-black text-slate-900 text-sm">{(product.cost + product.adsCost + product.extraCharges).toFixed(0)} <span className="text-[10px] font-normal">{isRtl ? "د.ج" : "DA"}</span></div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">{isRtl ? "السعر" : "Price"}</div>
                      <div className="font-black text-slate-900 text-sm">{product.sellingPrice} <span className="text-[10px] font-normal">{isRtl ? "د.ج" : "DA"}</span></div>
                    </div>
                  </div>

                  <div className={`mt-auto p-4 rounded-2xl border-2 flex items-center justify-between ${
                    isPositive ? "bg-emerald-50/50 border-emerald-100" : "bg-red-50/50 border-red-100"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isPositive ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-red-500 text-white shadow-lg shadow-red-200"}`}>
                        <TrendingUp size={16} className={isPositive ? "" : "rotate-180"} />
                      </div>
                      <div className="text-xs font-black text-slate-700 uppercase tracking-wider">{t.netProfit}</div>
                    </div>
                    <div className={`font-black text-lg ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                      {netProfit.toFixed(0)}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-5">
                    <Button 
                      variant="secondary" 
                      onClick={() => handleOpenEdit(product)} 
                      className="flex-1 h-11 text-xs font-black gap-2 rounded-xl"
                    >
                      <Pencil size={14} />
                      {t.edit}
                    </Button>
                    <Button 
                      variant="danger" 
                      onClick={() => {
                        setProductToDelete(product.id);
                        setIsDeleteModalOpen(true);
                      }} 
                      className="w-11 h-11 p-0 rounded-xl"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {products.length === 0 && (
        <div className="bg-white rounded-[32px] border-2 border-dashed border-slate-200 py-32 text-center animate-in fade-in duration-500">
          <div className="flex flex-col items-center gap-6">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 shadow-inner">
              <PackageIcon size={48} strokeWidth={1} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 mb-2">{t.noData}</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">{isRtl ? "لم يتم العثور على أي منتجات في المتاجر المختارة." : "No products found in the selected stores."}</p>
            </div>
            <Button onClick={handleOpenAdd} className="px-8 py-3 rounded-2xl shadow-xl shadow-slate-900/10">
              <Plus size={20} />
              <span>{t.addNew}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingProduct ? t.edit : t.addNew}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <Input
                label={t.productName}
                placeholder={isRtl ? "أدخل اسم المنتج" : "Enter product name"}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-12"
              />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <label className="text-sm font-bold text-slate-700">{t.store}</label>
              <select
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all disabled:opacity-50 disabled:bg-slate-50"
                value={formData.storeId}
                onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                required
                disabled={activeStoreIds.length === 1 && !editingProduct}
              >
                {(user?.stores || []).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-sm font-bold text-slate-700">{t.status}</label>
              <select
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="DRAFT">{t.draft}</option>
                <option value="TESTING">{t.testing}</option>
                <option value="PRODUCTION">{t.production}</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <Input
                label={t.productDescription}
                placeholder={isRtl ? "أدخل وصف المنتج" : "Enter product description"}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label={t.landingPageUrl}
                placeholder="https://example.com/landing-page"
                value={formData.landingPageUrl}
                onChange={(e) => setFormData({ ...formData, landingPageUrl: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label={t.imageUrl}
                placeholder="https://example.com/image.jpg"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="h-12"
              />
            </div>

            <Input
              label={t.productPrice}
              type="number"
              step="0.01"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
              required
              className="h-12"
            />
            <Input
              label={t.productCost}
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              required
              className="h-12"
            />
            <Input
              label={t.adsCost}
              type="number"
              step="0.01"
              value={formData.adsCost}
              onChange={(e) => setFormData({ ...formData, adsCost: e.target.value })}
              className="h-12"
            />
            <Input
              label={t.extraCharges}
              type="number"
              step="0.01"
              value={formData.extraCharges}
              onChange={(e) => setFormData({ ...formData, extraCharges: e.target.value })}
              className="h-12"
            />
            <Input
              label={t.weight}
              type="number"
              step="0.01"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              className="h-12"
            />
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.netProfit}</div>
                  <div className="text-sm font-bold text-slate-700">{isRtl ? "المتوقع للمنتج" : "Projected per item"}</div>
                </div>
              </div>
              <div className={`text-2xl font-black ${
                (parseFloat(formData.sellingPrice || "0") - (parseFloat(formData.cost || "0") + parseFloat(formData.adsCost || "0") + parseFloat(formData.extraCharges || "0"))) > 0 
                ? "text-emerald-600" : "text-red-600"
              }`}>
                {(parseFloat(formData.sellingPrice || "0") - (parseFloat(formData.cost || "0") + parseFloat(formData.adsCost || "0") + parseFloat(formData.extraCharges || "0"))).toFixed(0)} <span className="text-xs font-bold opacity-60 uppercase">{isRtl ? "د.ج" : "DA"}</span>
              </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="h-12 px-8">{t.cancel}</Button>
            <Button type="submit" isLoading={isLoading} className="h-12 px-10 shadow-lg shadow-slate-900/20">{t.save}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t.confirm}
      >
        <div className="text-center py-6 space-y-6">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-2">
             <h4 className="text-lg font-black text-slate-900">{isRtl ? "هل أنت متأكد من الحذف؟" : "Are you sure?"}</h4>
             <p className="text-slate-500 text-sm px-10">{isRtl ? "سيتم حذف هذا المنتج نهائياً من قاعدة البيانات. لا يمكن التراجع عن هذا الإجراء." : "This product will be permanently deleted. This action cannot be undone."}</p>
          </div>
          <div className="flex justify-center gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)} className="h-12 px-8">{t.cancel}</Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isLoading} className="h-12 px-10 shadow-lg shadow-red-200">{t.delete}</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Update Modal */}
      <Modal
        isOpen={isBulkUpdateOpen}
        onClose={() => setIsBulkUpdateOpen(false)}
        title={`${t.edit} (${selectedIds.length})`}
      >
        <form onSubmit={handleBulkUpdate} className="space-y-6">
          <div className="grid grid-cols-1 gap-5">
            <div className="flex flex-col space-y-1.5">
              <label className="text-sm font-bold text-slate-700">{t.status}</label>
              <select
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                value={bulkData.status}
                onChange={(e) => setBulkData({ ...bulkData, status: e.target.value })}
              >
                <option value="">{isRtl ? "لا يوجد تغيير" : "No change"}</option>
                <option value="DRAFT">{t.draft}</option>
                <option value="TESTING">{t.testing}</option>
                <option value="PRODUCTION">{t.production}</option>
              </select>
            </div>
            <Input
              label={t.productCost}
              type="number"
              step="0.01"
              value={bulkData.cost}
              onChange={(e) => setBulkData({ ...bulkData, cost: e.target.value })}
              className="h-12"
            />
            <Input
              label={t.productPrice}
              type="number"
              step="0.01"
              value={bulkData.sellingPrice}
              onChange={(e) => setBulkData({ ...bulkData, sellingPrice: e.target.value })}
              className="h-12"
            />
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsBulkUpdateOpen(false)} className="h-12 px-8">{t.cancel}</Button>
            <Button type="submit" isLoading={isLoading} className="h-12 px-10 shadow-lg shadow-slate-900/20">{t.confirm}</Button>
          </div>
        </form>
      </Modal>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] animate-in zoom-in-95 duration-200">
            <img 
              src={previewImage} 
              alt="Preview" 
              className="rounded-[32px] shadow-2xl border-4 border-white object-contain"
            />
            <button 
              className="absolute -top-4 -right-4 bg-white p-3 rounded-full shadow-2xl hover:bg-slate-50 transition-all border border-slate-100 group"
              onClick={() => setPreviewImage(null)}
            >
              <XCircle className="text-slate-400 group-hover:text-red-500 transition-colors" size={24} />
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
