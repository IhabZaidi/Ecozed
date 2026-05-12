"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useLanguage } from "@/lib/translations";
import { 
  Store as StoreIcon, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  CheckSquare, 
  Square,
  Globe
} from "lucide-react";

export default function StoreSelector() {
  const { user, activeStoreIds, setActiveStoreIds } = useAuthStore();
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isRtl = language === "ar";
  const stores = user?.stores || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (stores.length === 0) return null;

  const toggleStore = (id: string) => {
    if (activeStoreIds.includes(id)) {
      if (activeStoreIds.length > 1) {
        setActiveStoreIds(activeStoreIds.filter(i => i !== id));
      }
    } else {
      setActiveStoreIds([...activeStoreIds, id]);
    }
  };

  const selectAll = () => {
    setActiveStoreIds(stores.map(s => s.id));
  };

  const isAllSelected = activeStoreIds.length === stores.length;

  const getLabel = () => {
    if (isAllSelected) return t.allStores;
    if (activeStoreIds.length === 1) {
      return stores.find(s => s.id === activeStoreIds[0])?.name || t.selectStore;
    }
    return `${activeStoreIds.length} ${t.storesSelected}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all group min-w-[180px] max-w-[240px]"
      >
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-900 shadow-sm">
          {isAllSelected ? <Globe size={18} /> : <StoreIcon size={18} />}
        </div>
        <div className={`flex flex-col flex-1 overflow-hidden ${isRtl ? "text-right" : "text-left"}`}>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t.store}</span>
          <span className="text-sm font-bold text-slate-900 truncate">{getLabel()}</span>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-indigo-600" /> : <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-600" />}
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-2 w-64 bg-white rounded-[24px] shadow-2xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${isRtl ? "left-0" : "right-0"}`}>
          <div className="px-3 pb-2 mb-2 border-b border-slate-50">
             <button
              onClick={selectAll}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${isAllSelected ? "bg-indigo-50 text-indigo-600" : "hover:bg-slate-50 text-slate-600"}`}
            >
              <div className="flex items-center gap-3">
                {isAllSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                <span className="text-xs font-black uppercase tracking-wider">{t.allStores}</span>
              </div>
            </button>
          </div>
          
          <div className="max-h-64 overflow-y-auto px-2 space-y-1">
            {stores.map((store) => {
              const isSelected = activeStoreIds.includes(store.id);
              return (
                <button
                  key={store.id}
                  onClick={() => toggleStore(store.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isSelected ? "bg-slate-900 text-white shadow-lg" : "hover:bg-slate-50 text-slate-700"}`}
                >
                  <span className="text-sm font-bold truncate pr-2">{store.name}</span>
                  {isSelected && <Check size={16} className="flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
