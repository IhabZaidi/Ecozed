"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button, Input } from "@/components/ui";
import { UserPlus, Trash2, Key, ShieldCheck } from "lucide-react";

interface Worker {
  id: string;
  username: string;
  permissions: string[];
}

export default function UsersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchWorkers = async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setWorkers(data);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await fetch("/api/users", {
      method: "POST",
      body: JSON.stringify({ username: newUsername, password: newPassword, permissions: ["read_orders"] }),
    });
    if (res.ok) {
      setNewUsername("");
      setNewPassword("");
      setIsAdding(false);
      fetchWorkers();
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) fetchWorkers();
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">إدارة الموظفين</h2>
          <p className="text-slate-500">إضافة وتعديل حسابات العمال وصلاحياتهم</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} className="gap-2">
          <UserPlus size={18} />
          <span>إضافة موظف جديد</span>
        </Button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 mb-8 animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleAddWorker} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Input
              label="اسم المستخدم"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
            />
            <Input
              label="كلمة المرور"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Button type="submit" isLoading={isLoading}>حفظ</Button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-sm font-semibold text-slate-700">اسم المستخدم</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-700">الصلاحيات</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-700">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {workers.map((worker) => (
              <tr key={worker.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{worker.username}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {worker.permissions.map((p, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-md border border-blue-100">
                        {p}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                      <Key size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(worker.id)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {workers.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                  لا يوجد موظفين حالياً
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
