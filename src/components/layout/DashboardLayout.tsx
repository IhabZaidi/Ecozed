"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useLanguage } from "@/lib/translations";
import { initAuthInterceptor } from "@/lib/http-client";
import CookieConsent from "./CookieConsent";
import StoreSelector from "./StoreSelector";
import { Toast } from "@/components/ui";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  Settings,
  Store as StoreIcon,
  Wallet
} from "lucide-react";

const DzFlag = () => (
  <svg className="w-full h-full rounded-sm" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect fill="#006233" width="256" height="512"/>
    <rect fill="#FFF" x="256" width="256" height="512"/>
    <path fill="#d21034" d="M334.6 256c0 37.7-27.1 69-62.7 75.3 33.8 12.3 73.1-5.3 85.4-39.1 12.3-33.8-5.3-73.1-39.1-85.4 12.5 12.3 16.4 31 16.4 49.2zm11.4-23.7l11 11.5 15.6-4.2-7.5 14.2 8.5 13.6-15.8-2.6-9.6 12.8-1.5-16.1-13.6-8.5 15.3-5.2z"/>
  </svg>
);

const UsFlag = () => (
  <svg className="w-full h-full rounded-sm" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect fill="#eee" width="512" height="512"/>
    <path fill="#d80027" d="M0 36.6h512v36.5H0zm0 73.2h512v36.5H0zm0 73.1h512v36.6H0zm0 73.2h512v36.5H0zm0 73.2h512v36.5H0zm0 73.1h512v36.6H0zm0 73.2h512v36.5H0z"/>
    <path fill="#0052b4" d="M0 0h284.4v256H0z"/>
    <path fill="#eee" d="M42.1 36.6l5.7 17.6h18.5l-15 10.9 5.7 17.6-15-10.8-15 10.8 5.7-17.6-15-10.9h18.5zm113.8 0l5.7 17.6H180l-15 10.9 5.7 17.6-15-10.8-15 10.8 5.7-17.6-15-10.9h18.5zm113.8 0l5.7 17.6h18.5l-15 10.9 5.7 17.6-15-10.8-15 10.8 5.7-17.6-15-10.9H236zm-56.9 73.2l5.7 17.6H217l-15 10.9 5.7 17.6-15-10.8-15 10.8 5.7-17.6-15-10.9h18.5zm-113.8 0l5.7 17.6h18.5l-15 10.9 5.7 17.6-15-10.8-15 10.8 5.7-17.6-15-10.9h18.5zm56.9 73.2l5.7 17.6h18.5l-15 10.9 5.7 17.6-15-10.8-15 10.8 5.7-17.6-15-10.9h18.5zm113.8 0l5.7 17.6h18.5l-15 10.9 5.7 17.6-15-10.8-15 10.8 5.7-17.6-15-10.9H236z"/>
  </svg>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const { language, setLanguage, t } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const authChecked = useRef(false);

  const navItems = [
    { name: t.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { name: t.orders, href: "/orders", icon: ShoppingCart },
    { name: t.products, href: "/products", icon: Package },
    { name: t.users, href: "/users", icon: Users, adminOnly: true },
    { name: t.salary, href: "/salary", icon: Wallet, adminOnly: true },
    { name: t.manageStores, href: "/stores", icon: StoreIcon, adminOnly: true },
    { name: t.settings, href: "/settings", icon: Settings, adminOnly: true },
  ];

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [language]);

  // Initialize the 401 interceptor once
  useEffect(() => {
    initAuthInterceptor();
  }, []);

  // Auth check — runs ONCE on mount (layout persists across navigations)
  useEffect(() => {
    if (authChecked.current) return;
    authChecked.current = true;

    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        setUser(data.user);
        setIsInitialLoad(false);
      } catch {
        logout();
        router.push("/login");
      }
    }
    checkAuth();
  }, []);

  // Listen for 401 from any API call via the interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      router.push("/login");
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    logout();
    router.push("/login");
  };

  const isRtl = language === "ar";

  if (isInitialLoad) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50" dir={isRtl ? "rtl" : "ltr"}>
        <div className="text-center">
          <div className="w-20 h-20 bg-slate-900 rounded-[28px] flex items-center justify-center text-white shadow-2xl shadow-slate-900/10 mx-auto mb-8">
            <Package size={40} />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-4">
            <div className="w-3 h-3 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-3 h-3 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-3 h-3 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <p className="text-sm font-bold text-slate-400 tracking-wider uppercase">{t.layoutCheckingCredentials}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen bg-slate-50 ${isRtl ? "font-cairo text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
      {/* Sidebar */}
      <aside className={`w-64 bg-white border-slate-200 flex flex-col fixed inset-y-0 z-50 transition-all duration-300 ${
        isRtl ? "border-l right-0" : "border-r left-0"
      }`}>
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
              <Package size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t.appName}</h2>
          </div>
          <div className="h-1 w-12 bg-slate-900 rounded-full" />
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            if (item.adminOnly && user?.role !== "ADMIN") return null;
            
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20 translate-x-1" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={20} />
                <span className="font-bold text-sm">{item.name}</span>
                {isActive && (
                  <div className={isRtl ? "mr-auto" : "ml-auto"}>
                    {isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-5 py-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-300 group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm">{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isRtl ? "mr-64" : "ml-64"}`}>
        <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-40">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {navItems.find(i => i.href === pathname)?.name || t.dashboard}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <StoreSelector />
            <div className="h-10 w-px bg-slate-200 mx-2" />
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-all group"
              >
                <div className="w-6 h-4 overflow-hidden shadow-sm border border-slate-200">
                  {language === "ar" ? <DzFlag /> : <UsFlag />}
                </div>
                {isLangOpen ? <ChevronUp size={14} className="text-indigo-600" /> : <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600" />}
              </button>

              {isLangOpen && (
                <div className={`absolute top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200 ${isRtl ? "left-0" : "right-0"}`}>
                  <button
                    onClick={() => { setLanguage("en"); setIsLangOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-4 overflow-hidden border border-slate-100">
                        <UsFlag />
                      </div>
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t.layoutEnglish}</span>
                    </div>
                    {language === "en" && <Check size={14} className="text-emerald-500" />}
                  </button>
                  <button
                    onClick={() => { setLanguage("ar"); setIsLangOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-4 overflow-hidden border border-slate-100">
                        <DzFlag />
                      </div>
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t.layoutArabic}</span>
                    </div>
                    {language === "ar" && <Check size={14} className="text-emerald-500" />}
                  </button>
                </div>
              )}
            </div>

            <div className="h-10 w-px bg-slate-200 mx-2" />

            <div className="flex items-center gap-4 px-4 py-2">
              <div className={isRtl ? "text-left" : "text-right"}>
                <p className="text-sm font-black text-slate-900 leading-tight mb-1">{user?.username}</p>
                <div className={`flex items-center gap-1.5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {user?.role === "ADMIN" ? t.admin : t.worker}
                   </span>
                </div>
              </div>
              <div className="relative">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg border-2 border-white ring-1 ring-slate-100">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-10 max-w-[1600px] mx-auto animate-in fade-in duration-700">
          {children}
        </div>
      </main>

      <CookieConsent />
      <Toast />
    </div>
  );
}
