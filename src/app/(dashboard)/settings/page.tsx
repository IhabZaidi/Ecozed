"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button, Modal } from "@/components/ui";
import { useLanguage } from "@/lib/translations";
import { 
  Download, 
  Upload, 
  Database, 
  ShieldCheck, 
  AlertTriangle,
  RefreshCcw,
  CheckCircle2,
  FileJson,
  ArrowRight
} from "lucide-react";

export default function SettingsPage() {
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isRtl = language === "ar";

  const handleExport = async () => {
    setIsLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/settings/backup");
      if (!res.ok) throw new Error("Failed to export data");
      
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ecozed_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setStatus({ type: "success", message: t.backupSuccess });
    } catch (error) {
      setStatus({ type: "error", message: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setRestoreFile(e.target.files[0]);
      setIsRestoreModalOpen(true);
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) return;
    setIsLoading(true);
    setIsRestoreModalOpen(false);
    setStatus(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result;
        try {
          const res = await fetch("/api/settings/restore", {
            method: "POST",
            body: content as string,
            headers: { "Content-Type": "application/json" }
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to restore data");
          }

          setStatus({ type: "success", message: t.restoreSuccess });
          // Optional: Reload after success to refresh all data
          setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
          setStatus({ type: "error", message: (error as Error).message });
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsText(restoreFile);
    } catch (error) {
      setStatus({ type: "error", message: "Failed to read file" });
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{t.settings}</h2>
          <p className="text-slate-500">{t.backupDesc}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Export Card */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-12 opacity-5 -mr-8 -mt-8 rotate-12 group-hover:rotate-0 transition-transform duration-500">
               <Download size={120} />
            </div>
            
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <Database size={28} />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 mb-3">{t.exportData}</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              {isRtl 
                ? "قم بتنزيل نسخة كاملة من بياناتك (المتجر، المنتجات، الطلبات) في ملف JSON آمن." 
                : "Download a full copy of your data (Stores, Products, Orders) in a secure JSON file."}
            </p>
            
            <Button 
              onClick={handleExport} 
              isLoading={isLoading}
              className="w-full h-14 gap-2 rounded-2xl shadow-lg shadow-indigo-500/10"
            >
              <Download size={20} />
              <span className="font-bold">{t.exportData}</span>
            </Button>
          </div>

          {/* Import Card */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-12 opacity-5 -mr-8 -mt-8 -rotate-12 group-hover:rotate-0 transition-transform duration-500">
               <Upload size={120} />
            </div>

            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <ShieldCheck size={28} />
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-3">{t.importData}</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              {isRtl 
                ? "استرجع بياناتك من نسخة احتياطية سابقة. سيؤدي هذا إلى استبدال جميع البيانات الحالية." 
                : "Restore your data from a previous backup. This will replace all current database records."}
            </p>

            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={isLoading}
              />
              <Button 
                variant="secondary"
                className="w-full h-14 gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-white hover:border-emerald-500 hover:text-emerald-600 transition-all"
              >
                <Upload size={20} />
                <span className="font-bold">{t.importData}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {status && (
          <div className={`mt-8 p-6 rounded-[24px] border-2 flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 ${
            status.type === "success" 
              ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
              : "bg-red-50 border-red-100 text-red-700"
          }`}>
            {status.type === "success" ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
            <span className="font-bold">{status.message}</span>
          </div>
        )}

        {/* Security Warning Section */}
        <div className="mt-12 p-8 bg-amber-50 rounded-[32px] border border-amber-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 text-amber-500">
            <AlertTriangle size={80} />
          </div>
          <div className="flex items-start gap-5 relative z-10">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm flex-shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-black text-amber-900">{isRtl ? "نصيحة أمنية" : "Security Tip"}</h4>
              <p className="text-amber-700 text-sm leading-relaxed max-w-2xl">
                {isRtl 
                  ? "احتفظ دائماً بنسخة احتياطية قبل إجراء تحديثات كبيرة على النظام. يمكنك استخدام هذه الملفات لنقل بياناتك إلى خادم آخر أو استعادتها في حالة حدوث خطأ أثناء التحديث." 
                  : "Always keep a backup before performing major system updates. You can use these files to migrate your data to another server or restore it if something goes wrong during an update."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        title={t.importData}
      >
        <div className="text-center py-6 space-y-6">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
            <RefreshCcw size={40} />
          </div>
          <div className="space-y-2">
            <h4 className="text-xl font-black text-slate-900">{isRtl ? "هل أنت متأكد من الاستعادة؟" : "Confirm Data Restore"}</h4>
            <p className="text-slate-500 text-sm px-8">
              {t.restoreWarning}
            </p>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between mx-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-500">
                <FileJson size={20} />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{isRtl ? "الملف المختار" : "Selected File"}</p>
                <p className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{restoreFile?.name}</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-slate-300" />
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsRestoreModalOpen(false)} className="h-12 px-8">{t.cancel}</Button>
            <Button variant="danger" onClick={handleRestore} isLoading={isLoading} className="h-12 px-10 shadow-lg shadow-red-200">{isRtl ? "ابدأ الاستعادة" : "Start Restore"}</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
