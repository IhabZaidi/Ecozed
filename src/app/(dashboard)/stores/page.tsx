"use client";

import { useState, useEffect } from "react";
import { Button, Input, Modal, showToast } from "@/components/ui";
import { useLanguage } from "@/lib/translations";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  Store as StoreIcon, 
  Plus, 
  Pencil, 
  Trash2, 
  Package, 
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Search,
  ArrowRight
} from "lucide-react";

interface Store {
  id: string;
  name: string;
  description: string | null;
  websiteUrl: string | null;
  _count: {
    products: number;
    orders: number;
  };
  createdAt: string;
}

export default function StoresPage() {
  const { t, language } = useLanguage();
  const setUser = useAuthStore((state) => state.setUser);
  const [stores, setStores] = useState<Store[]>([]);
  const [filter, setFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [storeToDelete, setStoreToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: "",
    description: "",
    websiteUrl: ""
  });

  const isRtl = language === "ar";

  const fetchStores = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/stores");
      if (res.ok) {
        const data = await res.json();
        setStores(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleOpenAdd = () => {
    setEditingStore(null);
    setFormData({ name: "", description: "", websiteUrl: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (store: Store) => {
    setEditingStore(store);
    setFormData({ 
      name: store.name, 
      description: store.description || "", 
      websiteUrl: store.websiteUrl || "" 
    });
    setIsModalOpen(true);
  };

  const refreshAuthUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const method = editingStore ? "PUT" : "POST";
    const url = editingStore ? `/api/stores/${editingStore.id}` : "/api/stores";
    
    const res = await fetch(url, {
      method,
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchStores();
      refreshAuthUser();
      showToast("success", editingStore ? t.storeUpdated : t.storeCreated);
    } else {
      const err = await res.json().catch(() => ({}));
      showToast("error", err.error || t.storeFailedSave);
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!storeToDelete) return;
    setIsLoading(true);
    const res = await fetch(`/api/stores/${storeToDelete}`, { method: "DELETE" });
    if (res.ok) {
      setIsDeleteModalOpen(false);
      setStoreToDelete(null);
      fetchStores();
      refreshAuthUser();
      showToast("success", t.storeDeleted);
    } else {
      showToast("error", t.storeFailedDelete);
    }
    setIsLoading(false);
  };

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{t.manageStores}</h2>
          <p className="text-slate-500 text-sm">{t.storesPageDesc}</p>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRtl ? "right-3" : "left-3"}`} size={18} />
            <input
              type="text"
              placeholder={t.search}
              className={`w-full h-12 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm bg-white shadow-sm ${isRtl ? "pr-10 pl-4" : "pl-10 pr-4"}`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <Button onClick={handleOpenAdd} className="h-12 gap-2 px-6 shadow-lg shadow-slate-900/20">
            <Plus size={20} />
            <span className="font-bold">{t.addNew}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredStores.map((store) => (
          <div key={store.id} className="bg-white rounded-[32px] border-2 border-slate-100 p-8 hover:border-slate-300 transition-all group relative overflow-hidden shadow-sm hover:shadow-xl">
            <div className="absolute top-0 right-0 p-10 opacity-5 -mr-4 -mt-4 rotate-12 group-hover:rotate-0 transition-transform duration-500">
               <StoreIcon size={100} />
            </div>

            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20">
                <StoreIcon size={28} />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleOpenEdit(store)}
                  className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl shadow-none hover:shadow-lg transition-all border border-transparent hover:border-slate-100"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={() => {
                    setStoreToDelete(store.id);
                    setIsDeleteModalOpen(true);
                  }}
                  className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl shadow-none hover:shadow-lg transition-all border border-transparent hover:border-red-50"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="mb-8 relative z-10">
              <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight group-hover:text-indigo-600 transition-colors">{store.name}</h3>
              {store.websiteUrl && (
                <a 
                  href={store.websiteUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1 mb-2"
                >
                  <TrendingUp size={12} />
                  {store.websiteUrl.replace(/^https?:\/\//, "")}
                </a>
              )}
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                {t.storeCreatedAt}: {new Date(store.createdAt).toLocaleDateString(isRtl ? "ar-DZ" : "en-US")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm">
                  <Package size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t.products}</div>
                  <div className="text-sm font-bold text-slate-900">{store._count.products}</div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t.orders}</div>
                  <div className="text-sm font-bold text-slate-900">{store._count.orders}</div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Empty Card */}
        <button 
          onClick={handleOpenAdd}
          className="bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center gap-4 hover:border-slate-400 hover:bg-white transition-all group"
        >
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 group-hover:text-slate-900 group-hover:scale-110 transition-all shadow-sm">
            <Plus size={32} />
          </div>
          <span className="font-black text-slate-400 uppercase tracking-widest text-xs group-hover:text-slate-900 transition-colors">{t.createStore}</span>
        </button>
      </div>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingStore ? t.edit : t.createStore}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Input
              label={t.storeName}
              placeholder={t.storeNamePlaceholder}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="h-12"
            />
            <Input
              label={t.storeDescription}
              placeholder={t.storeDescPlaceholder}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="h-12"
            />
            <Input
              label={t.storeWebsite}
              placeholder="https://example.com"
              value={formData.websiteUrl}
              onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
              className="h-12"
            />
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
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-2">
            <h4 className="text-xl font-black text-slate-900">{t.storeDeleteConfirmTitle}</h4>
            <p className="text-slate-500 text-sm px-10">
              {t.deleteStoreWarning}
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)} className="h-12 px-8">{t.cancel}</Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isLoading} className="h-12 px-10 shadow-lg shadow-red-200">{t.delete}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
