"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button, Input, Modal } from "@/components/ui";
import { useLanguage } from "@/lib/translations";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  Plus, 
  Search, 
  AlertCircle, 
  Phone, 
  MapPin, 
  Package as PackageIcon, 
  RefreshCw, 
  LayoutGrid, 
  List as ListIcon,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  User,
  Calendar,
  Pencil,
  Trash2,
  TrendingUp,
  Inbox,
  CheckSquare,
  Square,
  X,
  Banknote,
  PhoneOff,
  Smartphone,
  PhoneCall,
  Store as StoreIcon
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  storeId: string;
}

interface Order {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELED" | "DELIVERED" | "RETURNED" | "NO_ANSWER" | "BUSY" | "PHONE_CLOSED";
  clientName: string;
  clientPhone1: string;
  clientPhone2: string | null;
  state: string;
  city: string;
  address: string;
  notes: string | null;
  productId: string;
  storeId: string;
  quantity: number;
  totalPrice: number | null;
  adsCost: number;
  product: { 
    name: string; 
    sellingPrice: number;
    cost: number;
    adsCost: number;
    extraCharges: number;
  };
  isBlacklisted?: boolean;
  createdAt: string;
}

export default function OrdersPage() {
  const { t, language } = useLanguage();
  const { user, activeStoreIds } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [filter, setFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone1: "",
    clientPhone2: "",
    state: "",
    city: "",
    address: "",
    productId: "",
    storeId: "",
    quantity: "1",
    totalPrice: "",
    adsCost: "0",
    notes: "",
    status: "PENDING" as Order["status"],
  });

  const isRtl = language === "ar";

  const statusOptions = [
    { value: "PENDING", label: isRtl ? "قيد الانتظار" : "Pending", icon: Clock, color: "bg-amber-50 text-amber-600 border-amber-100" },
    { value: "CONFIRMED", label: isRtl ? "تم التأكيد" : "Confirmed", icon: CheckCircle2, color: "bg-blue-50 text-blue-600 border-blue-100" },
    { value: "NO_ANSWER", label: t.noAnswer, icon: PhoneOff, color: "bg-orange-50 text-orange-600 border-orange-100" },
    { value: "BUSY", label: t.busy, icon: PhoneCall, color: "bg-purple-50 text-purple-600 border-purple-100" },
    { value: "PHONE_CLOSED", label: t.phoneClosed, icon: Smartphone, color: "bg-slate-50 text-slate-600 border-slate-100" },
    { value: "CANCELED", label: isRtl ? "ملغي" : "Canceled", icon: XCircle, color: "bg-red-50 text-red-600 border-red-100" },
    { value: "DELIVERED", label: isRtl ? "تم التسليم" : "Delivered", icon: Truck, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    { value: "RETURNED", label: isRtl ? "مسترجع" : "Returned", icon: RotateCcw, color: "bg-slate-50 text-slate-600 border-slate-100" },
  ];

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/orders?storeIds=${activeStoreIds.join(",")}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    // Fetch all products allowed for the user to help with the modal store-product relation
    const userStoreIds = (user?.stores || []).map(s => s.id).join(",");
    const res = await fetch(`/api/products?storeIds=${userStoreIds}`);
    if (res.ok) {
      const data = await res.json();
      setProducts(data);
    }
  };

  useEffect(() => {
    if (activeStoreIds.length > 0) {
      fetchOrders();
    } else {
      setOrders([]);
    }
    fetchProducts();
  }, [activeStoreIds]);

  const handleOpenAdd = () => {
    setEditingOrder(null);
    const defaultStoreId = activeStoreIds.length === 1 ? activeStoreIds[0] : (user?.stores?.[0]?.id || "");
    const storeProducts = products.filter(p => p.storeId === defaultStoreId);
    
    setFormData({
      clientName: "",
      clientPhone1: "",
      clientPhone2: "",
      state: "",
      city: "",
      address: "",
      productId: storeProducts[0]?.id || "",
      storeId: defaultStoreId,
      quantity: "1",
      totalPrice: "",
      adsCost: "0",
      notes: "",
      status: "PENDING",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      clientName: order.clientName,
      clientPhone1: order.clientPhone1,
      clientPhone2: order.clientPhone2 || "",
      state: order.state,
      city: order.city,
      address: order.address,
      productId: order.productId,
      storeId: order.storeId,
      quantity: order.quantity.toString(),
      totalPrice: order.totalPrice?.toString() || "",
      adsCost: order.adsCost.toString(),
      notes: order.notes || "",
      status: order.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const method = editingOrder ? "PUT" : "POST";
    const url = editingOrder ? `/api/orders/${editingOrder.id}` : "/api/orders";
    
    const res = await fetch(url, {
      method,
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchOrders();
    }
    setIsLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchOrders();
  };

  const handleBulkUpdate = async (status: string) => {
    setIsLoading(true);
    const res = await fetch("/api/orders/bulk", {
      method: "PUT",
      body: JSON.stringify({ ids: selectedIds, status }),
    });
    if (res.ok) {
      setSelectedIds([]);
      fetchOrders();
    }
    setIsLoading(false);
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(t.bulkDeleteConfirm)) return;
    setIsLoading(true);
    const res = await fetch(`/api/orders/bulk?ids=${selectedIds.join(",")}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setSelectedIds([]);
      fetchOrders();
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!orderToDelete) return;
    setIsLoading(true);
    const res = await fetch(`/api/orders/${orderToDelete}`, { method: "DELETE" });
    if (res.ok) {
      setIsDeleteModalOpen(false);
      setOrderToDelete(null);
      fetchOrders();
    }
    setIsLoading(false);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.clientName.toLowerCase().includes(filter.toLowerCase()) || 
    o.clientPhone1.includes(filter) ||
    o.product.name.toLowerCase().includes(filter.toLowerCase())
  );

  // Helper to filter products in modal based on selected store
  const filteredProductsForModal = products.filter(p => p.storeId === formData.storeId);

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t.ordersTitle}</h2>
          <p className="text-slate-500 text-sm">{t.ordersDesc}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[240px]">
            <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRtl ? "right-3" : "left-3"}`} size={18} />
            <input
              type="text"
              placeholder={t.search}
              className={`w-full h-11 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm bg-white shadow-sm ${isRtl ? "pr-10 pl-4" : "pl-10 pr-4"}`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={fetchOrders} className="h-11 w-11 p-0">
              <div className={`${isLoading ? "animate-spin" : ""}`}>
                <RefreshCw size={18} />
              </div>
            </Button>

            <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center shadow-sm h-11">
              <button 
                onClick={() => setViewMode("list")}
                className={`h-full px-3 rounded-lg transition-all flex items-center ${viewMode === "list" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
              >
                <ListIcon size={18} />
              </button>
              <button 
                onClick={() => setViewMode("grid")}
                className={`h-full px-3 rounded-lg transition-all flex items-center ${viewMode === "grid" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
              >
                <LayoutGrid size={18} />
              </button>
            </div>

            <Button onClick={handleOpenAdd} className="h-11 gap-2 px-6 shadow-lg shadow-slate-900/20">
              <Plus size={18} />
              <span className="font-bold">{t.addNew}</span>
            </Button>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-slate-200 border-dashed p-20 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
            <Inbox size={48} />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">{t.noOrders}</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8">
            {activeStoreIds.length === 0 ? (isRtl ? "يرجى اختيار متجر لعرض الطلبات." : "Please select a store to view orders.") : t.noOrdersDesc}
          </p>
          <Button onClick={handleOpenAdd} className="gap-2 px-8 py-3">
            <Plus size={20} />
            <span>{t.addNew}</span>
          </Button>
        </div>
      ) : viewMode === "list" ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className={`w-full border-collapse ${isRtl ? "text-right" : "text-left"}`}>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 w-10">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-900 transition-colors">
                      {selectedIds.length === filteredOrders.length ? <CheckSquare size={20} className="text-indigo-600" /> : <Square size={20} />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{t.clientName}</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{t.productsTitle}</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">{t.quantity}</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">{t.totalPrice}</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">{t.realProfit}</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{t.status}</th>
                  <th className={`px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest ${isRtl ? "text-left" : "text-right"}`}>{t.confirm}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const revenue = order.totalPrice || (order.product.sellingPrice * order.quantity);
                  const totalCost = (order.product.cost * order.quantity) + order.adsCost + order.product.extraCharges;
                  const realProfit = revenue - totalCost;
                  const isSelected = selectedIds.includes(order.id);
                  const storeName = user?.stores.find(s => s.id === order.storeId)?.name;

                  return (
                    <tr key={order.id} className={`hover:bg-slate-50/80 transition-colors group ${isSelected ? "bg-indigo-50/30" : ""}`}>
                      <td className="px-6 py-4">
                        <button onClick={() => toggleSelect(order.id)} className="text-slate-300 hover:text-indigo-600 transition-colors">
                          {isSelected ? <CheckSquare size={20} className="text-indigo-600" /> : <Square size={20} />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{order.clientName}</span>
                            {order.isBlacklisted && <AlertCircle size={14} className="text-red-500" />}
                          </div>
                          <div className="flex items-center gap-1.5">
                             <div className="px-1 py-0.5 rounded bg-slate-50 border border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">{storeName}</div>
                             <span className="text-[10px] text-slate-400 font-bold font-mono">{order.clientPhone1}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">{order.product.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{order.state} - {order.city}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-slate-100 text-slate-900 rounded-lg text-xs font-black">x{order.quantity}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className="text-sm font-black text-slate-900">{revenue.toFixed(0)} {isRtl ? "د.ج" : "DA"}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black border ${
                          realProfit > 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                        }`}>
                          <TrendingUp size={12} className={realProfit > 0 ? "" : "rotate-180"} />
                          {realProfit.toFixed(0)} {isRtl ? "د.ج" : "DA"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className={`text-[10px] font-black rounded-xl border px-3 py-2 focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all cursor-pointer ${
                            statusOptions.find(s => s.value === order.status)?.color
                          }`}
                        >
                          {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value} className="bg-white text-slate-900">{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex gap-1 ${isRtl ? "justify-end" : "justify-start"}`}>
                          <button 
                            onClick={() => handleOpenEdit(order)}
                            className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl shadow-none hover:shadow-lg transition-all border border-transparent hover:border-slate-100"
                          >
                            <Pencil size={18} />
                          </button>
                          {user?.role === "ADMIN" && (
                            <button 
                              onClick={() => {
                                setOrderToDelete(order.id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl shadow-none hover:shadow-lg transition-all border border-transparent hover:border-red-50"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const currentStatus = statusOptions.find(s => s.value === order.status);
            const revenue = order.totalPrice || (order.product.sellingPrice * order.quantity);
            const totalCost = (order.product.cost * order.quantity) + order.adsCost + order.product.extraCharges;
            const realProfit = revenue - totalCost;
            const isSelected = selectedIds.includes(order.id);
            const storeName = user?.stores.find(s => s.id === order.storeId)?.name;

            return (
              <div key={order.id} className={`bg-white rounded-[24px] border-2 p-6 hover:border-slate-300 transition-all shadow-sm flex flex-col group relative ${isSelected ? "border-indigo-500 shadow-indigo-100 shadow-xl" : "border-slate-200"} ${isRtl ? "text-right" : "text-left"}`}>
                {/* Checkbox for Grid */}
                <button 
                  onClick={() => toggleSelect(order.id)}
                  className={`absolute top-4 ${isRtl ? "left-4" : "right-4"} z-10 p-1 rounded-lg transition-all ${isSelected ? "text-indigo-600 bg-indigo-50" : "text-slate-300 bg-slate-50 hover:text-slate-600"}`}
                >
                  {isSelected ? <CheckSquare size={22} /> : <Square size={22} />}
                </button>

                <div className={`flex justify-between items-start mb-6 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                   <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider ${currentStatus?.color}`}>
                    {currentStatus && <currentStatus.icon size={12} />}
                    {currentStatus?.label}
                  </div>
                  <div className={`flex items-center gap-4 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-inner">
                      <User size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900 tracking-tight">{order.clientName}</h3>
                        {order.isBlacklisted && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-lg shadow-lg shadow-red-200">
                            BL
                          </span>
                        )}
                      </div>
                      <div className={`flex items-center gap-1.5 text-[10px] text-slate-400 font-bold ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                        <Calendar size={10} />
                        {new Date(order.createdAt).toLocaleDateString(isRtl ? "ar-DZ" : "en-US")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 mb-8">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.phone}</div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700 font-mono">
                          <Phone size={12} className="text-indigo-400" />
                          {order.clientPhone1}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.location}</div>
                      <div className="flex items-start gap-2 text-[11px] font-bold text-slate-600 leading-relaxed">
                        <MapPin size={12} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                        {order.state}, {order.city}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-[20px] p-5 flex flex-col justify-center border border-slate-100 relative overflow-hidden">
                    <div className="absolute -top-1 -right-1 opacity-5 scale-150 rotate-12 text-slate-300">
                      <StoreIcon size={64} />
                    </div>
                    <div className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-[0.2em]">{storeName}</div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-slate-800 line-clamp-1">{order.product.name}</span>
                    </div>
                    <div className="text-[10px] font-black text-indigo-600">
                      {revenue} {isRtl ? "د.ج" : "DA"} (x{order.quantity})
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200/50 flex items-center justify-between">
                       <span className="text-[9px] font-black text-slate-400 uppercase">{t.profit}</span>
                       <span className={`text-[11px] font-black ${realProfit > 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {realProfit.toFixed(0)}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-auto">
                  <Button variant="secondary" onClick={() => handleOpenEdit(order)} className="flex-1 h-11 text-xs font-bold gap-2 rounded-2xl">
                    <Pencil size={14} />
                    {t.edit}
                  </Button>
                  {user?.role === "ADMIN" && (
                    <Button 
                      variant="danger" 
                      onClick={() => {
                        setOrderToDelete(order.id);
                        setIsDeleteModalOpen(true);
                      }} 
                      className="w-11 h-11 p-0 rounded-2xl"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-[32px] shadow-2xl shadow-indigo-500/20 flex items-center gap-6 border-4 border-white">
            <div className="flex items-center gap-3 pr-6 border-r border-slate-700">
              <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center font-black text-lg">
                {selectedIds.length}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">{t.selected}</span>
                <span className="text-sm font-bold">{t.orders}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {statusOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleBulkUpdate(opt.value)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl hover:bg-white hover:text-slate-900 transition-all text-xs font-bold whitespace-nowrap"
                >
                  <opt.icon size={14} />
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pl-6 border-l border-slate-700">
               {user?.role === "ADMIN" && (
                 <button 
                  onClick={handleBulkDelete}
                  className="p-2.5 rounded-2xl text-red-400 hover:bg-red-500 hover:text-white transition-all"
                  title={t.delete}
                 >
                   <Trash2 size={20} />
                 </button>
               )}
               <button 
                onClick={() => setSelectedIds([])}
                className="p-2.5 rounded-2xl text-slate-400 hover:bg-slate-800 transition-all"
               >
                 <X size={20} />
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingOrder ? t.edit : t.addNew}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <Input
                label={t.clientName}
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                required
                className="h-12"
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-sm font-bold text-slate-700">{t.store}</label>
              <select
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all disabled:opacity-50 disabled:bg-slate-50"
                value={formData.storeId}
                onChange={(e) => setFormData({ ...formData, storeId: e.target.value, productId: "" })}
                required
                disabled={activeStoreIds.length === 1 && !editingOrder}
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
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <Input
              label={t.clientPhone1}
              value={formData.clientPhone1}
              onChange={(e) => setFormData({ ...formData, clientPhone1: e.target.value })}
              required
              className="h-12"
            />
            <Input
              label={t.clientPhone2}
              value={formData.clientPhone2}
              onChange={(e) => setFormData({ ...formData, clientPhone2: e.target.value })}
              className="h-12"
            />
            <Input
              label={t.state}
              placeholder={isRtl ? "مثال: الجزائر" : "e.g. Algiers"}
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              required
              className="h-12"
            />
            <Input
              label={t.city}
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
              className="h-12"
            />
            <div className="md:col-span-2">
              <Input
                label={t.address}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                className="h-12"
              />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <label className="text-sm font-bold text-slate-700">{t.productsTitle}</label>
              <select
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                required
              >
                <option value="">{isRtl ? "اختر منتجاً..." : "Select a product..."}</option>
                {filteredProductsForModal.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sellingPrice} {isRtl ? "د.ج" : "DA"})</option>
                ))}
              </select>
              {filteredProductsForModal.length === 0 && (
                <p className="text-[10px] text-red-500 font-bold mt-1">{isRtl ? "لا توجد منتجات لهذا المتجر!" : "No products available for this store!"}</p>
              )}
            </div>
            <Input
              label={t.quantity}
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
              className="h-12"
            />
            <Input
              label={t.totalPrice}
              type="number"
              placeholder={isRtl ? "اتركه فارغاً للحساب التلقائي" : "Leave empty for auto-calc"}
              value={formData.totalPrice}
              onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
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
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="h-12 px-8">{t.cancel}</Button>
            <Button type="submit" isLoading={isLoading} className="h-12 px-10 shadow-lg shadow-slate-900/20">{t.save}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
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
            <h4 className="text-lg font-black text-slate-900">{t.confirmDelete}</h4>
            <p className="text-slate-500 text-sm">{t.deleteConfirm}</p>
          </div>
          <div className="flex justify-center gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)} className="h-12 px-8">{t.cancel}</Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isLoading} className="h-12 px-8 shadow-lg shadow-red-200">{t.delete}</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
