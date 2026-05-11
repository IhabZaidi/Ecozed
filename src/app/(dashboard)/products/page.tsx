"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button, Input, Modal } from "@/components/ui";
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
  List as ListIcon
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
  status: "DRAFT" | "TESTING" | "PRODUCTION";
}

export default function ProductsPage() {
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
    status: "DRAFT" as Product["status"],
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
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
      status: "DRAFT",
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
      status: product.status,
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
    if (!confirm(`هل أنت متأكد من حذف ${selectedIds.length} منتجات؟`)) return;
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
    DRAFT: { label: "مسودة", color: "bg-slate-100 text-slate-600 border-slate-200" },
    TESTING: { label: "تجريب", color: "bg-amber-100 text-amber-600 border-amber-200" },
    PRODUCTION: { label: "إنتاج", color: "bg-green-100 text-green-600 border-green-200" },
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">المنتجات</h2>
          <p className="text-slate-500">إدارة المخزون وتفاصيل الحملات الإعلانية</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Refresh Button */}
          <Button 
            variant="secondary" 
            onClick={fetchProducts} 
            className="p-2.5"
            title="تحديث البيانات"
          >
            <div className={`${isLoading ? "animate-spin" : ""}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
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
                تعديل جماعي ({selectedIds.length})
              </Button>
              <Button variant="danger" onClick={handleBulkDelete} className="gap-2 text-sm">
                حذف جماعي
              </Button>
            </div>
          )}
          <Button onClick={handleOpenAdd} className="gap-2">
            <Plus size={18} />
            <span>إضافة منتج جديد</span>
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 w-12">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600 transition-colors">
                      {selectedIds.length === products.length && products.length > 0 ? <CheckSquare size={20} className="text-slate-900" /> : <Square size={20} />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700">المنتج</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700">الحالة</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-center">التكاليف</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-center">سعر البيع</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-center">صافي الربح</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => {
                  const netProfit = product.sellingPrice - (product.cost + product.adsCost + product.extraCharges);
                  const isPositive = netProfit > 0;

                  return (
                    <tr key={product.id} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(product.id) ? "bg-slate-50" : ""}`}>
                      <td className="px-6 py-4">
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
                            <div className="text-xs text-slate-500">{product.weight ? `${product.weight} كغ` : "بدون وزن"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusMap[product.status]?.color}`}>
                          {statusMap[product.status]?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-xs text-slate-400 mb-1">إجمالي: {product.cost + product.adsCost + product.extraCharges}</div>
                        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
                          <span>إعلان: {product.adsCost}</span>
                          <span>شحن: {product.extraCharges}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-900 font-mono">
                        {product.sellingPrice} <span className="text-[10px] font-normal text-slate-500">د.ج</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${
                          isPositive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                        }`}>
                          <TrendingUp size={14} className={isPositive ? "" : "rotate-180"} />
                          <span>{netProfit.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1 justify-end">
                          <button 
                            onClick={() => handleOpenEdit(product)}
                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              setProductToDelete(product.id);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"
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

            return (
              <div 
                key={product.id} 
                className={`bg-white rounded-2xl border transition-all group overflow-hidden flex flex-col ${
                  selectedIds.includes(product.id) ? "border-slate-900 ring-4 ring-slate-900/5" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageIcon size={32} />
                    </div>
                  )}
                  <button 
                    onClick={() => toggleSelect(product.id)}
                    className="absolute top-3 left-3 p-1.5 rounded-lg bg-white/90 backdrop-blur shadow-sm text-slate-400 hover:text-slate-900 transition-all"
                  >
                    {selectedIds.includes(product.id) ? <CheckSquare size={18} className="text-slate-900" /> : <Square size={18} />}
                  </button>
                  {product.imageUrl && (
                    <button 
                      onClick={() => setPreviewImage(product.imageUrl!)}
                      className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-white/90 backdrop-blur shadow-sm text-slate-400 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Maximize2 size={18} />
                    </button>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-sm ${statusMap[product.status]?.color}`}>
                      {statusMap[product.status]?.label}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="mb-4">
                    <h3 className="font-bold text-slate-900 mb-1">{product.name}</h3>
                    <p className="text-xs text-slate-500">{product.weight ? `${product.weight} كغ` : "بدون وزن"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400 mb-0.5">التكلفة الإجمالية</div>
                      <div className="font-bold text-slate-900 text-sm">{(product.cost + product.adsCost + product.extraCharges).toFixed(0)} <span className="text-[10px] font-normal">د.ج</span></div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400 mb-0.5">سعر البيع</div>
                      <div className="font-bold text-slate-900 text-sm">{product.sellingPrice} <span className="text-[10px] font-normal">د.ج</span></div>
                    </div>
                  </div>

                  <div className={`mt-auto p-3 rounded-xl border flex items-center justify-between ${
                    isPositive ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
                        <TrendingUp size={16} className={isPositive ? "" : "rotate-180"} />
                      </div>
                      <div className="text-xs font-bold text-slate-700">صافي الربح</div>
                    </div>
                    <div className={`font-bold ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                      {netProfit.toFixed(0)} <span className="text-[10px] font-normal">د.ج</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    <Button 
                      variant="secondary" 
                      onClick={() => handleOpenEdit(product)} 
                      className="flex-1 py-1.5 text-xs gap-1.5"
                    >
                      <Pencil size={14} />
                      تعديل
                    </Button>
                    <Button 
                      variant="danger" 
                      onClick={() => {
                        setProductToDelete(product.id);
                        setIsDeleteModalOpen(true);
                      }} 
                      className="p-1.5"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {products.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 py-20 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
              <ImageIcon size={32} />
            </div>
            <p className="text-slate-500 font-medium">لا توجد منتجات حالياً، ابدأ بإضافة أول منتج.</p>
          </div>
        </div>
      )}

      {/* Modals remain the same... */}
      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingProduct ? "تعديل منتج" : "إضافة منتج جديد"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="اسم المنتج"
                placeholder="أدخل اسم المنتج"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <Input
              label="رابط الصورة"
              placeholder="https://example.com/image.jpg"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-slate-700">الحالة</label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="DRAFT">مسودة</option>
                <option value="TESTING">تجريب</option>
                <option value="PRODUCTION">إنتاج</option>
              </select>
            </div>
            <Input
              label="سعر البيع (د.ج)"
              type="number"
              step="0.01"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
              required
            />
            <Input
              label="تكلفة المنتج (د.ج)"
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              required
            />
            <Input
              label="تكلفة الإعلانات (د.ج)"
              type="number"
              step="0.01"
              value={formData.adsCost}
              onChange={(e) => setFormData({ ...formData, adsCost: e.target.value })}
            />
            <Input
              label="مصاريف إضافية (د.ج)"
              type="number"
              step="0.01"
              value={formData.extraCharges}
              onChange={(e) => setFormData({ ...formData, extraCharges: e.target.value })}
            />
            <Input
              label="الوزن (كغ)"
              type="number"
              step="0.01"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">صافي الربح المتوقع:</span>
              <span className={`text-xl font-bold ${
                (parseFloat(formData.sellingPrice || "0") - (parseFloat(formData.cost || "0") + parseFloat(formData.adsCost || "0") + parseFloat(formData.extraCharges || "0"))) > 0 
                ? "text-emerald-600" : "text-red-600"
              }`}>
                {(parseFloat(formData.sellingPrice || "0") - (parseFloat(formData.cost || "0") + parseFloat(formData.adsCost || "0") + parseFloat(formData.extraCharges || "0"))).toFixed(2)} د.ج
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>إلغاء</Button>
            <Button type="submit" isLoading={isLoading}>{editingProduct ? "تحديث المنتج" : "حفظ المنتج"}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="تأكيد الحذف"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <p className="text-slate-600">هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.</p>
          <div className="flex justify-center gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>إلغاء</Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isLoading}>حذف الآن</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Update Modal */}
      <Modal
        isOpen={isBulkUpdateOpen}
        onClose={() => setIsBulkUpdateOpen(false)}
        title={`تعديل جماعي لـ ${selectedIds.length} منتجات`}
      >
        <form onSubmit={handleBulkUpdate} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-slate-700">الحالة الجديدة</label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white"
                value={bulkData.status}
                onChange={(e) => setBulkData({ ...bulkData, status: e.target.value })}
              >
                <option value="">لا يوجد تغيير</option>
                <option value="DRAFT">مسودة</option>
                <option value="TESTING">تجريب</option>
                <option value="PRODUCTION">إنتاج</option>
              </select>
            </div>
            <Input
              label="تكلفة المنتج الجديدة (د.ج)"
              type="number"
              step="0.01"
              placeholder="أدخل التكلفة الجديدة"
              value={bulkData.cost}
              onChange={(e) => setBulkData({ ...bulkData, cost: e.target.value })}
            />
            <Input
              label="سعر البيع الجديد (د.ج)"
              type="number"
              step="0.01"
              placeholder="أدخل السعر الجديد"
              value={bulkData.sellingPrice}
              onChange={(e) => setBulkData({ ...bulkData, sellingPrice: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsBulkUpdateOpen(false)}>إلغاء</Button>
            <Button type="submit" isLoading={isLoading}>تحديث الكل</Button>
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
              className="rounded-2xl shadow-2xl border-4 border-white object-contain"
            />
            <button 
              className="absolute -top-4 -right-4 bg-white p-2 rounded-full shadow-lg hover:bg-slate-100 transition-colors"
              onClick={() => setPreviewImage(null)}
            >
              <XCircle className="text-slate-900" size={24} />
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
