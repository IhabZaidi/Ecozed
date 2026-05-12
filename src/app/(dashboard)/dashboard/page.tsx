"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/store/useAuthStore";
import { useLanguage } from "@/lib/translations";
import { 
  ShoppingCart, 
  Clock, 
  TrendingUp, 
  Package,
  Zap,
  ArrowUpRight,
  RefreshCw
} from "lucide-react";

export default function DashboardPage() {
  const { activeStoreIds } = useAuthStore();
  const { t, language } = useLanguage();
  const [stats, setStats] = useState({
    orderCount: 0,
    pendingCount: 0,
    productCount: 0,
    totalSales: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/dashboard/stats?storeIds=${activeStoreIds.join(",")}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeStoreIds.length > 0) {
      fetchStats();
    }
  }, [activeStoreIds]);

  const isRtl = language === "ar";

  const statCards = [
    { 
      label: isRtl ? "إجمالي الطلبات" : "Total Orders", 
      value: stats.orderCount.toString(), 
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100"
    },
    { 
      label: isRtl ? "طلبات قيد الانتظار" : "Pending Orders", 
      value: stats.pendingCount.toString(), 
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100"
    },
    { 
      label: isRtl ? "إجمالي المبيعات" : "Total Sales", 
      value: `${stats.totalSales.toFixed(0)} ${isRtl ? "د.ج" : "DA"}`, 
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100"
    },
    { 
      label: isRtl ? "المنتجات النشطة" : "Active Products", 
      value: stats.productCount.toString(), 
      icon: Package,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100"
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-10 flex justify-between items-center">
        <div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{isRtl ? "نظرة عامة" : "Overview"}</h2>
           <p className="text-slate-500">{isRtl ? "أداء المتاجر المختارة في الوقت الفعلي." : "Real-time performance of selected stores."}</p>
        </div>
        <button 
          onClick={fetchStats}
          className={`p-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all shadow-sm ${isLoading ? "animate-spin" : ""}`}
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className={`bg-white p-8 rounded-[32px] border-2 ${stat.border} shadow-sm hover:shadow-xl transition-all group relative overflow-hidden`}>
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${stat.bg} rounded-full opacity-50 blur-2xl group-hover:scale-150 transition-transform duration-700`} />
            
            <div className="flex justify-between items-start mb-6">
               <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-inner`}>
                <stat.icon size={28} />
              </div>
              <div className={`p-1.5 rounded-lg ${stat.bg} ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                <ArrowUpRight size={16} />
              </div>
            </div>
            
            <div className="relative z-10">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-slate-900 rounded-[40px] p-12 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-20 opacity-10 text-white animate-pulse">
           <Zap size={200} strokeWidth={1} />
        </div>
        
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-[24px] flex items-center justify-center mx-auto mb-8 text-white shadow-xl">
            <Zap size={40} className="fill-white" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 tracking-tight">
            {isRtl ? "مرحباً بك في لوحة التحكم الموحدة" : "Welcome to your Unified Dashboard"}
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-10">
            {isRtl 
              ? "لقد قمنا بتفعيل نظام تعدد المتاجر. يمكنك الآن التبديل بين متاجر مختلفة أو رؤية إحصائيات مجمعة لكل أعمالك من مكان واحد." 
              : "Multi-store architecture is now active. You can switch between different stores or view aggregated statistics for your entire business from one place."}
          </p>
          <div className="flex justify-center gap-4">
             <div className="px-6 py-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-white font-bold text-sm">
                {isRtl ? "تعدد المتاجر: نشط" : "Multi-store: Active"}
             </div>
             <div className="px-6 py-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-white font-bold text-sm">
                {isRtl ? "تشفير البيانات: مفعل" : "Encryption: Enabled"}
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
