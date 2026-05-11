import DashboardLayout from "@/components/layout/DashboardLayout";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const [orderCount, pendingCount, productCount] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.product.count(),
  ]);

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "إجمالي الطلبات", value: orderCount.toString(), color: "bg-blue-500" },
          { label: "طلبات قيد الانتظار", value: pendingCount.toString(), color: "bg-amber-500" },
          { label: "إجمالي المبيعات", value: "0 د.ج", color: "bg-emerald-500" },
          { label: "المنتجات النشطة", value: productCount.toString(), color: "bg-purple-500" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">مرحباً بك في لوحة التحكم</h2>
          <p className="text-slate-500">
            أنت الآن تشاهد لمحة عامة عن أداء متجرك. يمكنك البدء بإدارة الطلبات أو إضافة منتجات جديدة من القائمة الجانبية.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
