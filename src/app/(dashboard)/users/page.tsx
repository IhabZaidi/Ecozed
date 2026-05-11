"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button, Input, Modal } from "@/components/ui";
import { useLanguage } from "@/lib/translations";
import { 
  UserPlus, 
  Trash2, 
  Key, 
  ShieldCheck, 
  RefreshCw, 
  LayoutGrid, 
  List as ListIcon,
  AlertCircle,
  Shield,
  User as UserIcon,
  Lock,
  MoreVertical,
  CheckCircle2
} from "lucide-react";

interface Worker {
  id: string;
  username: string;
  permissions: string[];
  role: string;
}

export default function UsersPage() {
  const { t, language } = useLanguage();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [workerToDelete, setWorkerToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    permissions: ["read_orders"],
  });

  const [isLoading, setIsLoading] = useState(false);

  const PERMISSION_LABELS: Record<string, string> = {
    read_orders: language === "ar" ? "عرض الطلبات" : "Read Orders",
    write_orders: language === "ar" ? "إدارة الطلبات" : "Manage Orders",
    manage_products: language === "ar" ? "إدارة المنتجات" : "Manage Products",
    view_reports: language === "ar" ? "مشاهدة التقارير" : "View Reports",
  };

  const fetchWorkers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setWorkers(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleOpenAdd = () => {
    setEditingWorker(null);
    setFormData({ username: "", password: "", permissions: ["read_orders"] });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData({ username: worker.username, password: "", permissions: worker.permissions });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const method = editingWorker ? "PUT" : "POST";
    const url = editingWorker ? `/api/users/${editingWorker.id}` : "/api/users";
    
    const res = await fetch(url, {
      method,
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchWorkers();
    } else {
      const data = await res.json();
      alert(data.error || (language === "ar" ? "حدث خطأ ما" : "Something went wrong"));
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!workerToDelete) return;
    setIsLoading(true);
    const res = await fetch(`/api/users/${workerToDelete}`, { method: "DELETE" });
    if (res.ok) {
      setIsDeleteModalOpen(false);
      setWorkerToDelete(null);
      fetchWorkers();
    }
    setIsLoading(false);
  };

  const isRtl = language === "ar";

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t.usersTitle}</h2>
          <p className="text-slate-500">{t.usersDesc}</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Refresh Button */}
          <Button 
            variant="secondary" 
            onClick={fetchWorkers} 
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

          <Button onClick={handleOpenAdd} className="gap-2">
            <UserPlus size={18} />
            <span>{t.addNew}</span>
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className={`w-full ${isRtl ? "text-right" : "text-left"}`}>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700">{t.worker}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700">{t.role}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700">{t.permissions}</th>
                  <th className={`px-6 py-4 text-sm font-semibold text-slate-700 ${isRtl ? "text-right" : "text-left"}`}>{t.confirm}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                          <UserIcon size={20} />
                        </div>
                        <div className="font-bold text-slate-900">{worker.username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        worker.role === "ADMIN" ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-blue-50 text-blue-600 border-blue-100"
                      }`}>
                        <Shield size={12} />
                        {worker.role === "ADMIN" ? t.admin : t.worker}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {worker.permissions.map((p, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-50 text-slate-600 text-[10px] rounded border border-slate-100 font-bold">
                            {PERMISSION_LABELS[p] || p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex gap-1 ${isRtl ? "justify-end" : "justify-start"}`}>
                        <button 
                          onClick={() => handleOpenEdit(worker)}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                          title={t.edit}
                        >
                          <Key size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            setWorkerToDelete(worker.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"
                          title={t.delete}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {workers.map((worker) => (
            <div key={worker.id} className={`bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 transition-all shadow-sm group ${isRtl ? "text-right" : "text-left"}`}>
              <div className={`flex justify-between items-start mb-4 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 transition-colors border border-slate-100">
                  <UserIcon size={24} />
                </div>
                <button 
                  onClick={() => {
                    setWorkerToDelete(worker.id);
                    setIsDeleteModalOpen(true);
                  }}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div className="mb-4">
                <h3 className="font-bold text-slate-900 text-lg mb-1">{worker.username}</h3>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  worker.role === "ADMIN" ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-blue-50 text-blue-600 border-blue-100"
                }`}>
                  <Shield size={10} />
                  {worker.role === "ADMIN" ? t.admin : t.worker}
                </span>
              </div>

              <div className="space-y-2 mb-6">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t.permissions}</div>
                <div className={`flex flex-wrap gap-1.5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                  {worker.permissions.map((p, i) => (
                    <div key={i} className="flex items-center gap-1 px-2 py-1 bg-slate-50 text-slate-600 text-[10px] rounded-lg border border-slate-100 font-bold">
                      <CheckCircle2 size={10} className="text-emerald-500" />
                      {PERMISSION_LABELS[p] || p}
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                variant="secondary" 
                onClick={() => handleOpenEdit(worker)}
                className="w-full text-xs gap-2 py-2"
              >
                <Lock size={14} />
                {isRtl ? "تغيير الصلاحيات / السر" : "Change Perms / Pass"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {workers.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 py-20 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
              <UserIcon size={32} />
            </div>
            <p className="text-slate-500 font-medium">{t.noData}</p>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingWorker ? t.edit : t.addNew}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Input
              label={t.username}
              placeholder={isRtl ? "مثال: ahmed_24" : "e.g. ahmed_24"}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              disabled={!!editingWorker}
            />
            <Input
              label={editingWorker ? (isRtl ? "كلمة المرور الجديدة (اختياري)" : "New Password (Optional)") : t.password}
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingWorker}
              minLength={8}
            />
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t.permissions}</label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(PERMISSION_LABELS).map(([perm, label]) => (
                  <label key={perm} className={`flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                    <input 
                      type="checkbox"
                      checked={formData.permissions.includes(perm)}
                      onChange={(e) => {
                        const newPerms = e.target.checked 
                          ? [...formData.permissions, perm]
                          : formData.permissions.filter(p => p !== perm);
                        setFormData({ ...formData, permissions: newPerms });
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-xs font-bold text-slate-600">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>{t.cancel}</Button>
            <Button type="submit" isLoading={isLoading}>{editingWorker ? t.save : t.save}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t.confirm}
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <p className="text-slate-600">{isRtl ? "هل أنت متأكد من حذف حساب هذا الموظف؟" : "Are you sure you want to delete this staff account?"}</p>
          <div className="flex justify-center gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>{t.cancel}</Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isLoading}>{t.delete}</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
