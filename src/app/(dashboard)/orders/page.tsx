"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button, Input, Modal } from "@/components/ui";
import { useLanguage } from "@/lib/translations";
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
  MoreVertical,
  ChevronRight
} from "lucide-react";

interface Order {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELED" | "DELIVERED" | "RETURNED";
  clientName: string;
  clientPhone1: string;
  clientPhone2: string | null;
  state: string;
  city: string;
  address: string;
  notes: string | null;
  productId: string;
  product: { name: string; sellingPrice: number };
  isBlacklisted?: boolean;
  createdAt: string;
}

export default function OrdersPage() {
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [filter, setFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isRtl = language === "ar";

  const statusOptions = [
    { value: "PENDING", label: isRtl ? "قيد الانتظار" : "Pending", icon: Clock, color: "bg-amber-50 text-amber-600 border-amber-100" },
    { value: "CONFIRMED", label: isRtl ? "تم التأكيد" : "Confirmed", icon: CheckCircle2, color: "bg-blue-50 text-blue-600 border-blue-100" },
    { value: "CANCELED", label: isRtl ? "ملغي" : "Canceled", icon: XCircle, color: "bg-red-50 text-red-600 border-red-100" },
    { value: "DELIVERED", label: isRtl ? "تم التسليم" : "Delivered", icon: Truck, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    { value: "RETURNED", label: isRtl ? "مسترجع" : "Returned", icon: RotateCcw, color: "bg-slate-50 text-slate-600 border-slate-100" },
  ];

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchOrders();
  };

  const filteredOrders = orders.filter(o => 
    o.clientName.toLowerCase().includes(filter.toLowerCase()) || 
    o.clientPhone1.includes(filter) ||
    o.product.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t.ordersTitle}</h2>
          <p className="text-slate-500 text-sm">{t.ordersDesc}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRtl ? "right-3" : "left-3"}`} size={18} />
            <input
              type="text"
              placeholder={t.search}
              className={`w-full py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm bg-white ${isRtl ? "pr-10 pl-4" : "pl-10 pr-4"}`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <Button 
              variant="secondary" 
              onClick={fetchOrders} 
              className="p-2.5"
              title={t.refresh}
            >
              <div className={`${isLoading ? "animate-spin" : ""}`}>
                <RefreshCw size={18} />
              </div>
            </Button>

            {/* View Toggle */}
            <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center shadow-sm">
              <button 
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                <ListIcon size={18} />
              </button>
              <button 
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                <LayoutGrid size={18} />
              </button>
            </div>

            <Button onClick={() => setIsModalOpen(true)} className="gap-2 px-5">
              <Plus size={18} />
              <span>{t.addNew}</span>
            </Button>
          </div>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className={`w-full border-collapse ${isRtl ? "text-right" : "text-left"}`}>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.clientName}</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.productsTitle}</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.location}</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.status}</th>
                  <th className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider ${isRtl ? "text-left" : "text-right"}`}>{t.orderDate}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{order.clientName}</span>
                          {order.isBlacklisted && <AlertCircle size={14} className="text-red-500" />}
                        </div>
                        <span className="text-xs text-slate-500 font-mono">{order.clientPhone1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">{order.product.name}</span>
                        <span className="text-[10px] text-slate-400">{order.product.sellingPrice} {isRtl ? "د.ج" : "DA"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-600">{order.state} - {order.city}</span>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className={`text-[10px] font-bold rounded-lg border px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all ${
                          statusOptions.find(s => s.value === order.status)?.color
                        }`}
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className={`px-6 py-4 ${isRtl ? "text-left" : "text-right"}`}>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(order.createdAt).toLocaleDateString(isRtl ? "ar-DZ" : "en-US")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const currentStatus = statusOptions.find(s => s.value === order.status);
            return (
              <div key={order.id} className={`bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 transition-all shadow-sm flex flex-col group ${isRtl ? "text-right" : "text-left"}`}>
                <div className={`flex justify-between items-start mb-5 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                   <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold ${currentStatus?.color}`}>
                    {currentStatus && <currentStatus.icon size={12} />}
                    {currentStatus?.label}
                  </div>
                  <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 transition-colors">
                      <User size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">{order.clientName}</h3>
                        {order.isBlacklisted && (
                          <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded border border-red-100">
                            BLACKLIST
                          </span>
                        )}
                      </div>
                      <div className={`flex items-center gap-1.5 text-[10px] text-slate-500 font-mono ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                        <Calendar size={10} />
                        {new Date(order.createdAt).toLocaleDateString(isRtl ? "ar-DZ" : "en-US")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-3 text-right">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.phone}</div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
                          <Phone size={12} className="text-slate-300" />
                          {order.clientPhone1}
                        </div>
                        {order.clientPhone2 && (
                          <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
                            <Phone size={12} className="text-slate-300" />
                            {order.clientPhone2}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.location}</div>
                      <div className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                        <MapPin size={12} className="text-slate-300 mt-0.5 flex-shrink-0" />
                        {order.state}, {order.city}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 flex flex-col justify-center border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">{isRtl ? "الطلب" : "Order"}</div>
                    <div className="flex items-center gap-2 mb-1">
                      <PackageIcon size={14} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-800 line-clamp-1">{order.product.name}</span>
                    </div>
                    <div className={`text-[10px] font-mono text-slate-500 ${isRtl ? "mr-5" : "ml-5"}`}>{order.product.sellingPrice} {isRtl ? "د.ج" : "DA"}</div>
                  </div>
                </div>

                {order.notes && (
                  <div className="mb-6 p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-[11px] text-amber-700 italic">
                    <span className="font-bold not-italic block mb-1 uppercase tracking-wider text-[9px] opacity-60">{t.notes}:</span>
                    {order.notes}
                  </div>
                )}

                <div className={`mt-auto pt-4 border-t border-slate-100 flex items-center gap-2 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                  <div className="text-[10px] font-bold text-slate-400">{isRtl ? "تحديث الحالة:" : "Update Status:"}</div>
                  <div className="flex gap-1">
                    {statusOptions.slice(0, 4).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateStatus(order.id, opt.value)}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                          order.status === opt.value ? opt.color : "bg-white text-slate-300 border-slate-100 hover:border-slate-200"
                        }`}
                        title={opt.label}
                      >
                        <opt.icon size={16} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredOrders.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 py-32 text-center">
          <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
              <PackageIcon size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-slate-600 font-bold">{t.noData}</p>
            </div>
            <Button variant="secondary" onClick={() => setFilter("")} className="mt-2">{t.refresh}</Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
