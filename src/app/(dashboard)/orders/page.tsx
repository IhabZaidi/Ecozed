"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button, Input } from "@/components/ui";
import { Plus, Search, AlertCircle, Phone, MapPin, Package as PackageIcon } from "lucide-react";

interface Order {
  id: string;
  status: string;
  clientName: string;
  clientPhone1: string;
  clientPhone2: string | null;
  state: string;
  city: string;
  address: string;
  notes: string | null;
  productId: string;
  product: { name: string };
  isBlacklisted?: boolean;
}

const statusOptions = [
  { value: "PENDING", label: "قيد الانتظار", color: "bg-amber-100 text-amber-600 border-amber-200" },
  { value: "CONFIRMED", label: "تم التأكيد", color: "bg-blue-100 text-blue-600 border-blue-200" },
  { value: "CANCELED", label: "ملغي", color: "bg-red-100 text-red-600 border-red-200" },
  { value: "DELIVERED", label: "تم التسليم", color: "bg-emerald-100 text-emerald-600 border-emerald-200" },
  { value: "RETURNED", label: "مسترجع", color: "bg-slate-100 text-slate-600 border-slate-200" },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrders = async () => {
    const res = await fetch("/api/orders");
    if (res.ok) {
      const data = await res.json();
      setOrders(data);
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

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">إدارة الطلبات</h2>
          <p className="text-slate-500">تتبع ومعالجة طلبات العملاء</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="بحث عن عميل..."
              className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <Button className="gap-2">
            <Plus size={18} />
            <span className="hidden sm:inline">طلب جديد</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {orders.filter(o => o.clientName.includes(filter) || o.clientPhone1.includes(filter)).map((order) => (
          <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:shadow-slate-200/50 transition-all">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-slate-900">{order.clientName}</h3>
                {order.isBlacklisted && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full border border-red-100">
                    <AlertCircle size={12} />
                    قائمة سوداء
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateStatus(order.id, opt.value)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all ${
                      order.status === opt.value ? opt.color : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone size={16} className="text-slate-400" />
                  <span>{order.clientPhone1}</span>
                  {order.clientPhone2 && <span className="text-slate-300">|</span>}
                  <span>{order.clientPhone2}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin size={16} className="text-slate-400 mt-0.5" />
                  <span>{order.state}، {order.city}، {order.address}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-medium">
                  <PackageIcon size={16} className="text-slate-400" />
                  <span>{order.product.name}</span>
                </div>
                <div className="text-slate-500 mr-6">الكمية: {order.id}</div>
              </div>

              {order.notes && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600">
                  <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">ملاحظات</p>
                  {order.notes}
                </div>
              )}
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400">لا توجد طلبات لعرضها حالياً</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
