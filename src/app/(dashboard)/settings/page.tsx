"use client";

import { useState, useEffect } from "react";
import { Button, Modal, showToast } from "@/components/ui";
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
  ArrowRight,
  Settings as SettingsIcon,
  User,
  Bell,
  Lock,
  Globe,
  Truck,
  Search,
  Save,
  CheckSquare,
  Square,
  X,
  Link,
  Copy,
  Key,
  Power,
  PowerOff,
  ExternalLink,
  Eye,
  EyeOff,
  Shield,
  Package,
  MapPin,
  Printer
} from "lucide-react";

type SettingsSection = "general" | "backup" | "notifications" | "security" | "shipping" | "integrations" | "shipping-provider";

interface ShippingConfig {
  id: string;
  stateName: string;
  stateCode: string;
  homeCost: number;
  stopDeskCost: number;
  returnCost: number;
  changeCost: number;
}

export default function SettingsPage() {
  const { t, language } = useLanguage();
  const [activeSection, setActiveSection] = useState<SettingsSection>("shipping");
  const [shippingConfigs, setShippingConfigs] = useState<ShippingConfig[]>([]);
  const [shippingFilter, setShippingFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [syncingProviderId, setSyncingProviderId] = useState<string | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isRtl = language === "ar";

  const fetchShipping = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings/shipping");
      if (res.ok) {
        const data = await res.json();
        setShippingConfigs(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIntegrations = async () => {
    const res = await fetch("/api/settings/integrations");
    if (res.ok) setIntegrations(await res.json());
  };

  const fetchStores = async () => {
    const res = await fetch("/api/stores");
    if (res.ok) setStores(await res.json());
  };

  const fetchShippingProvider = async () => {
    const res = await fetch("/api/settings/shipping-provider");
    if (res.ok) setShippingProviders(await res.json());
  };

  useEffect(() => {
    if (activeSection === "shipping") {
      fetchShipping();
    } else if (activeSection === "integrations") {
      fetchIntegrations();
      fetchStores();
    } else if (activeSection === "shipping-provider") {
      fetchShippingProvider();
      fetchStores();
    }
  }, [activeSection]);

  const handleExport = async () => {
    setIsLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/settings/backup");
      if (!res.ok) throw new Error(t.settingsExportFailed);
      
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
            throw new Error(err.error || t.settingsRestoreFailed);
          }

          setStatus({ type: "success", message: t.restoreSuccess });
          setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
          setStatus({ type: "error", message: (error as Error).message });
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsText(restoreFile);
    } catch (error) {
      setStatus({ type: "error", message: t.settingsReadFileFailed });
      setIsLoading(false);
    }
  };

  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [bulkValues, setBulkValues] = useState({ homeCost: 0, stopDeskCost: 0, returnCost: 0, changeCost: 0 });

  // Integrations state
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<any | null>(null);
  const [integrationForm, setIntegrationForm] = useState({ storeId: "", apiKey: "", useGeneratedKey: true });
  const [copiedUuid, setCopiedUuid] = useState<string | null>(null);
  const [copiedApiKey, setCopiedApiKey] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [deleteIntegrationId, setDeleteIntegrationId] = useState<string | null>(null);

  // Shipping provider state
  const [shippingProviders, setShippingProviders] = useState<any[]>([]);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [editingShippingProvider, setEditingShippingProvider] = useState<any | null>(null);
  const [deleteShippingId, setDeleteShippingId] = useState<string | null>(null);
  const [shippingForm, setShippingForm] = useState({ storeId: "", prefix: "", apiKey: "", company: "ecotrack", baseUrl: "", useGeneratedKey: true });
  const [showShippingApiKey, setShowShippingApiKey] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleUpdateShipping = async (config: ShippingConfig) => {
    try {
      const res = await fetch("/api/settings/shipping", {
        method: "PUT",
        body: JSON.stringify(config),
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        setStatus({ type: "success", message: t.settingsShippingCostsUpdated });
        // Clear status after 3 seconds
        setTimeout(() => setStatus(null), 3000);
      }
    } catch (error) {
      setStatus({ type: "error", message: t.settingsUpdateFailed });
    }
  };

  const handleOpenAddIntegration = () => {
    setEditingIntegration(null);
    setIntegrationForm({ storeId: "", apiKey: "", useGeneratedKey: true });
    setIsIntegrationModalOpen(true);
  };

  const handleOpenEditIntegration = (integration: any) => {
    setEditingIntegration(integration);
    setIntegrationForm({ storeId: integration.storeId, apiKey: "", useGeneratedKey: true });
    setIsIntegrationModalOpen(true);
  };

  const handleSaveIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const apiKey = integrationForm.useGeneratedKey
        ? Array.from({ length: 3 }, () => Math.random().toString(36).substring(2)).join("")
        : integrationForm.apiKey;

      const body = { storeId: integrationForm.storeId, apiKey };
      const url = editingIntegration
        ? `/api/settings/integrations/${editingIntegration.id}`
        : "/api/settings/integrations";
      const method = editingIntegration ? "PUT" : "POST";

      const res = await fetch(url, { method, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
      if (res.ok) {
        setIsIntegrationModalOpen(false);
        fetchIntegrations();
        setStatus({ type: "success", message: editingIntegration
          ? t.settingsIntegrationUpdated
          : t.settingsIntegrationCreated });
        setTimeout(() => setStatus(null), 3000);
      } else {
        const err = await res.json();
        setStatus({ type: "error", message: err.error || t.settingsSaveFailed });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleIntegrationStatus = async (integration: any) => {
    const res = await fetch(`/api/settings/integrations/${integration.id}`, {
      method: "PUT",
      body: JSON.stringify({ isActive: !integration.isActive }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) fetchIntegrations();
  };

  const handleDeleteIntegration = async () => {
    if (!deleteIntegrationId) return;
    setIsLoading(true);
    const res = await fetch(`/api/settings/integrations/${deleteIntegrationId}`, { method: "DELETE" });
    if (res.ok) {
      setDeleteIntegrationId(null);
      fetchIntegrations();
      setStatus({ type: "success", message: t.settingsDeleted });
      setTimeout(() => setStatus(null), 3000);
    }
    setIsLoading(false);
  };

  const handleCopyEndpoint = async (uuid: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/woocommerce/${uuid}`);
      setCopiedUuid(uuid);
      setTimeout(() => setCopiedUuid(null), 2000);
    } catch {}
  };

  const handleCopyApiKey = async (id: string, key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedApiKey(id);
      setTimeout(() => setCopiedApiKey(null), 2000);
    } catch {}
  };

  // Shipping provider handlers
  const handleOpenAddShipping = () => {
    setEditingShippingProvider(null);
    setShippingForm({ storeId: "", prefix: "", apiKey: "", company: "ecotrack", baseUrl: "", useGeneratedKey: true });
    setShowShippingApiKey(false);
    setTestResult(null);
    setIsShippingModalOpen(true);
  };

  const handleOpenEditShipping = (provider: any) => {
    setEditingShippingProvider(provider);
    setShippingForm({
      storeId: provider.storeId,
      prefix: provider.prefix,
      apiKey: provider.apiKey,
      company: provider.company,
      baseUrl: provider.baseUrl,
      useGeneratedKey: false,
    });
    setShowShippingApiKey(false);
    setTestResult(null);
    setIsShippingModalOpen(true);
  };

  const handleSaveShippingProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const body = {
        storeId: shippingForm.storeId,
        company: shippingForm.company,
        prefix: shippingForm.prefix,
        apiKey: shippingForm.apiKey,
        baseUrl: shippingForm.baseUrl || `https://${shippingForm.prefix}.ecotrack.dz`,
      };

      const url = editingShippingProvider
        ? `/api/settings/shipping-provider/${editingShippingProvider.id}`
        : "/api/settings/shipping-provider";
      const method = editingShippingProvider ? "PUT" : "POST";

      const res = await fetch(url, { method, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
      if (res.ok) {
        setIsShippingModalOpen(false);
        fetchShippingProvider();
        setStatus({ type: "success", message: editingShippingProvider
          ? t.settingsProviderUpdated
          : t.settingsProviderAdded });
        setTimeout(() => setStatus(null), 3000);
      } else {
        const err = await res.json();
        setStatus({ type: "error", message: err.error || t.settingsSaveFailed });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteShippingProvider = async () => {
    if (!deleteShippingId) return;
    setIsLoading(true);
    const res = await fetch(`/api/settings/shipping-provider/${deleteShippingId}`, { method: "DELETE" });
    if (res.ok) {
      setDeleteShippingId(null);
      fetchShippingProvider();
      setStatus({ type: "success", message: t.settingsDeleted });
      setTimeout(() => setStatus(null), 3000);
    }
    setIsLoading(false);
  };

  const handleBulkUpdateShipping = async () => {
    setIsLoading(true);
    try {
      for (const stateId of selectedStates) {
        const config = shippingConfigs.find(c => c.id === stateId);
        if (config) {
          await fetch("/api/settings/shipping", {
            method: "PUT",
            body: JSON.stringify({ ...config, ...bulkValues }),
            headers: { "Content-Type": "application/json" }
          });
        }
      }
      setStatus({ type: "success", message: t.settingsStatesUpdated });
      setSelectedStates([]);
      fetchShipping();
    } catch (error) {
      setStatus({ type: "error", message: t.settingsBulkUpdateFailed });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncStopDesk = async (providerId: string) => {
    setSyncingProviderId(providerId);
    try {
      const res = await fetch("/api/settings/shipping/stop-desk-communes/sync", {
        method: "POST",
        body: JSON.stringify({ configId: providerId }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        showToast("success", t.settingsCommunesCount.replace("{count}", data.count));
        fetchShippingProvider();
      } else {
        const err = await res.json();
        showToast("error", err.error || t.settingsSyncFailed);
      }
    } catch {
      showToast("error", t.settingsSyncFailed);
    } finally {
      setSyncingProviderId(null);
    }
  };

  const menuItems = [
    { id: "general", label: t.settingsMenuGeneral, icon: Globe },
    { id: "shipping", label: t.shipping, icon: Truck },
    { id: "integrations", label: t.integrations, icon: Link },
    { id: "shipping-provider", label: t.shippingProvider, icon: Package },
    { id: "backup", label: t.backupTitle, icon: Database },
    { id: "notifications", label: t.settingsMenuNotifications, icon: Bell },
    { id: "security", label: t.settingsMenuSecurity, icon: Lock },
  ];

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Sidebar */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-[32px] border border-slate-200 p-4 shadow-sm">
            <div className="px-4 py-6">
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t.settings}</h2>
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as SettingsSection)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${
                    activeSection === item.id 
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <item.icon size={20} />
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeSection === "shipping" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 mb-1">{t.shipping}</h3>
                    <p className="text-slate-500 text-sm">{t.settingsShippingDesc}</p>
                  </div>
                  <div className="relative w-full md:w-64">
                    <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRtl ? "right-3" : "left-3"}`} size={18} />
                    <input
                      type="text"
                      placeholder={t.search}
                      className={`w-full h-11 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm ${isRtl ? "pr-10 pl-4" : "pl-10 pr-4"}`}
                      value={shippingFilter}
                      onChange={(e) => setShippingFilter(e.target.value)}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-[24px] border border-slate-100">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-900">
                        <th className="px-4 py-6 w-12 text-center text-white">
                           <button 
                            onClick={() => {
                              if (selectedStates.length === shippingConfigs.length) setSelectedStates([]);
                              else setSelectedStates(shippingConfigs.map(c => c.id));
                            }}
                            className="text-slate-400 hover:text-white transition-colors"
                           >
                             {selectedStates.length === shippingConfigs.length && shippingConfigs.length > 0 ? <CheckSquare size={20} className="text-white" /> : <Square size={20} />}
                           </button>
                        </th>
                        <th className={`px-4 py-6 text-xs font-black uppercase tracking-widest text-white ${isRtl ? "text-right" : "text-left"}`}>{t.state}</th>
                        <th className="px-4 py-6 text-xs font-black uppercase tracking-widest text-white text-center">{t.stopDesk}</th>
                        <th className="px-4 py-6 text-xs font-black uppercase tracking-widest text-white text-center">{t.home}</th>
                        <th className="px-4 py-6 text-xs font-black uppercase tracking-widest text-white text-center">{t.return}</th>
                        <th className="px-4 py-6 text-xs font-black uppercase tracking-widest text-white text-center">{t.change}</th>
                        <th className="px-4 py-6 w-20 text-white"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {shippingConfigs.filter(c => c.stateName.toLowerCase().includes(shippingFilter.toLowerCase())).map((config) => (
                        <tr key={config.id} className={`hover:bg-slate-50/50 transition-colors ${selectedStates.includes(config.id) ? "bg-indigo-50/30" : ""}`}>
                          <td className="px-4 py-3 text-center">
                            <button 
                              onClick={() => {
                                if (selectedStates.includes(config.id)) setSelectedStates(selectedStates.filter(s => s !== config.id));
                                else setSelectedStates([...selectedStates, config.id]);
                              }}
                              className="text-slate-300 hover:text-indigo-600 transition-colors"
                            >
                              {selectedStates.includes(config.id) ? <CheckSquare size={20} className="text-indigo-600" /> : <Square size={20} />}
                            </button>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-700">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400 font-black font-mono">{config.stateCode}</span>
                              <span className="text-sm">{config.stateName}</span>
                            </div>
                          </td>
                          <td className="px-2 py-4">
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{t.stopDesk}</span>
                              <input 
                                type="number"
                                className="w-full max-w-[85px] h-11 rounded-xl border border-slate-200 text-center text-sm font-black focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all bg-white"
                                value={config.stopDeskCost}
                                onChange={(e) => {
                                  const newConfigs = [...shippingConfigs];
                                  const idx = newConfigs.findIndex(c => c.id === config.id);
                                  newConfigs[idx].stopDeskCost = parseInt(e.target.value) || 0;
                                  setShippingConfigs(newConfigs);
                                }}
                              />
                            </div>
                          </td>
                          <td className="px-2 py-4">
                            <div className="flex flex-col items-center gap-1.5">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{t.home}</span>
                               <input 
                                type="number"
                                className="w-full max-w-[85px] h-11 rounded-xl border border-slate-200 text-center text-sm font-black focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all bg-white"
                                value={config.homeCost}
                                onChange={(e) => {
                                  const newConfigs = [...shippingConfigs];
                                  const idx = newConfigs.findIndex(c => c.id === config.id);
                                  newConfigs[idx].homeCost = parseInt(e.target.value) || 0;
                                  setShippingConfigs(newConfigs);
                                }}
                              />
                            </div>
                          </td>
                          <td className="px-2 py-4">
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{t.return}</span>
                              <input 
                                type="number"
                                className="w-full max-w-[85px] h-11 rounded-xl border border-slate-200 text-center text-sm font-black focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all bg-white"
                                value={config.returnCost}
                                onChange={(e) => {
                                  const newConfigs = [...shippingConfigs];
                                  const idx = newConfigs.findIndex(c => c.id === config.id);
                                  newConfigs[idx].returnCost = parseInt(e.target.value) || 0;
                                  setShippingConfigs(newConfigs);
                                }}
                              />
                            </div>
                          </td>
                          <td className="px-2 py-4">
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{t.change}</span>
                              <input 
                                type="number"
                                className="w-full max-w-[85px] h-11 rounded-xl border border-slate-200 text-center text-sm font-black focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all bg-white"
                                value={config.changeCost}
                                onChange={(e) => {
                                  const newConfigs = [...shippingConfigs];
                                  const idx = newConfigs.findIndex(c => c.id === config.id);
                                  newConfigs[idx].changeCost = parseInt(e.target.value) || 0;
                                  setShippingConfigs(newConfigs);
                                }}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button 
                              onClick={() => handleUpdateShipping(config)}
                              className="p-2.5 bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-none hover:shadow-lg active:scale-95"
                            >
                              <Save size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Floating Bulk Action Bar */}
              {selectedStates.length > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500 max-w-[90vw]">
                  <div className="bg-slate-900 text-white px-8 py-6 rounded-[32px] shadow-2xl flex flex-col md:flex-row items-center gap-8 border-4 border-white">
                    <div className="flex items-center gap-3 pr-8 md:border-r border-slate-700">
                      <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center font-black text-lg">
                        {selectedStates.length}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">{t.selected}</span>
                        <span className="text-sm font-bold">{t.state}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                       <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t.stopDesk}</label>
                          <input 
                            type="number"
                            className="w-full h-10 bg-slate-800 rounded-xl border border-slate-700 text-center text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                            value={bulkValues.stopDeskCost}
                            onChange={(e) => setBulkValues({ ...bulkValues, stopDeskCost: parseInt(e.target.value) || 0 })}
                          />
                       </div>
                       <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t.home}</label>
                          <input 
                            type="number"
                            className="w-full h-10 bg-slate-800 rounded-xl border border-slate-700 text-center text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                            value={bulkValues.homeCost}
                            onChange={(e) => setBulkValues({ ...bulkValues, homeCost: parseInt(e.target.value) || 0 })}
                          />
                       </div>
                       <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t.return}</label>
                          <input 
                            type="number"
                            className="w-full h-10 bg-slate-800 rounded-xl border border-slate-700 text-center text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                            value={bulkValues.returnCost}
                            onChange={(e) => setBulkValues({ ...bulkValues, returnCost: parseInt(e.target.value) || 0 })}
                          />
                       </div>
                       <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t.change}</label>
                          <input 
                            type="number"
                            className="w-full h-10 bg-slate-800 rounded-xl border border-slate-700 text-center text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                            value={bulkValues.changeCost}
                            onChange={(e) => setBulkValues({ ...bulkValues, changeCost: parseInt(e.target.value) || 0 })}
                          />
                       </div>
                    </div>

                    <div className="flex items-center gap-3 pl-8 md:border-l border-slate-700">
                      <Button onClick={handleBulkUpdateShipping} isLoading={isLoading} className="h-12 px-8 whitespace-nowrap">
                        {t.save}
                      </Button>
                      <button 
                        onClick={() => setSelectedStates([])}
                        className="p-3 rounded-2xl text-slate-400 hover:bg-slate-800 transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === "integrations" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 mb-1">{t.integrations}</h3>
                    <p className="text-slate-500 text-sm">{t.integrationsDesc}</p>
                  </div>
                  <Button onClick={handleOpenAddIntegration} className="gap-2 h-11">
                    <Link size={18} />
                    <span>{t.addIntegration}</span>
                  </Button>
                </div>

                {integrations.length === 0 ? (
                  <div className="bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 py-20 text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
                      <Link size={32} />
                    </div>
                    <p className="text-lg font-black text-slate-400 mb-1">{t.noIntegrations}</p>
                    <p className="text-sm text-slate-400">{t.noIntegrationsDesc}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {integrations.map((integration) => (
                      <div key={integration.id} className={`bg-slate-50 rounded-[24px] p-6 border transition-all ${integration.isActive ? "border-emerald-100" : "border-slate-200 opacity-70"}`}>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${integration.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-200 text-slate-400"}`}>
                              <ExternalLink size={22} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-black text-slate-900">{integration.store?.name}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${integration.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                                  {integration.isActive ? t.integrationActive : t.integrationInactive}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-400 mt-0.5">{integration.websiteType}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleIntegrationStatus(integration)}
                              className={`p-2.5 rounded-xl transition-all ${integration.isActive ? "bg-white text-emerald-600 hover:bg-emerald-50" : "bg-white text-slate-400 hover:bg-slate-100"}`}
                              title={t.toggleStatus}
                            >
                              {integration.isActive ? <Power size={18} /> : <PowerOff size={18} />}
                            </button>
                            <button
                              onClick={() => handleOpenEditIntegration(integration)}
                              className="p-2.5 bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all"
                              title={t.edit}
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteIntegrationId(integration.id)}
                              className="p-2.5 bg-white rounded-xl text-red-400 hover:text-red-600 transition-all"
                              title={t.delete}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 pt-5 border-t border-slate-200/50 space-y-4">
                          {/* Webhook Endpoint URL */}
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">{t.endpointUrl}</label>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 block truncate bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-700 shadow-sm">
                                {`${typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/woocommerce/${integration.endpointUuid}`}
                              </code>
                              <button
                                onClick={() => handleCopyEndpoint(integration.endpointUuid)}
                                className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
                              >
                                {copiedUuid === integration.endpointUuid ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                              </button>
                            </div>
                          </div>

                          {/* API Key */}
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1.5">
                              <Key size={11} />
                              {t.apiKey}
                            </label>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 block truncate bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-700 shadow-sm">
                                {revealedKey === integration.id ? integration.apiKey : `${integration.apiKey.substring(0, 8)}...${integration.apiKey.slice(-4)}`}
                              </code>
                              <button
                                onClick={() => setRevealedKey(revealedKey === integration.id ? null : integration.id)}
                                className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
                                title={revealedKey === integration.id ? t.settingsHide : t.settingsShow}
                              >
                                {revealedKey === integration.id ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                              <button
                                onClick={() => handleCopyApiKey(integration.id, integration.apiKey)}
                                className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
                                title={t.copyEndpoint}
                              >
                                {copiedApiKey === integration.id ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delete Confirmation */}
              <Modal isOpen={!!deleteIntegrationId} onClose={() => setDeleteIntegrationId(null)} title={t.confirm}>
                <div className="text-center py-6 space-y-6">
                  <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <AlertTriangle size={40} />
                  </div>
                  <p className="text-slate-600">{t.deleteIntegrationWarning}</p>
                  <div className="flex justify-center gap-3">
                    <Button variant="secondary" onClick={() => setDeleteIntegrationId(null)} className="h-12 px-8">{t.cancel}</Button>
                    <Button variant="danger" onClick={handleDeleteIntegration} isLoading={isLoading} className="h-12 px-8">{t.delete}</Button>
                  </div>
                </div>
              </Modal>

              {/* Add/Edit Integration Modal */}
              <Modal isOpen={isIntegrationModalOpen} onClose={() => setIsIntegrationModalOpen(false)} title={editingIntegration ? t.editIntegration : t.addIntegration}>
                <form onSubmit={handleSaveIntegration} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">{t.websiteType}</label>
                      <select
                        defaultValue="woocommerce"
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                      >
                        <option value="woocommerce">WooCommerce</option>
                        <option value="shopify" disabled>{t.settingsShopify}</option>
                        <option value="funnel" disabled>{t.settingsFunnel}</option>
                        <option value="other" disabled>{t.settingsOther}</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">{t.selectStore}</label>
                      <select
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                        value={integrationForm.storeId}
                        onChange={(e) => setIntegrationForm({ ...integrationForm, storeId: e.target.value })}
                        required
                        disabled={!!editingIntegration}
                      >
                        <option value="">{t.settingsSelectStore}</option>
                        {stores.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">{t.apiKey}</label>
                      <div className="flex items-center gap-3 mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={integrationForm.useGeneratedKey}
                            onChange={() => setIntegrationForm({ ...integrationForm, useGeneratedKey: true, apiKey: "" })}
                            className="w-4 h-4 text-slate-900 focus:ring-slate-900"
                          />
                          <span className="text-xs font-bold text-slate-600">{t.generateApiKey}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={!integrationForm.useGeneratedKey}
                            onChange={() => setIntegrationForm({ ...integrationForm, useGeneratedKey: false })}
                            className="w-4 h-4 text-slate-900 focus:ring-slate-900"
                          />
                          <span className="text-xs font-bold text-slate-600">{t.useCustomKey}</span>
                        </label>
                      </div>
                      {!integrationForm.useGeneratedKey && (
                        <input
                          type="text"
                          className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-mono font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                          placeholder={t.settingsSecretKeyHint}
                          value={integrationForm.apiKey}
                          onChange={(e) => setIntegrationForm({ ...integrationForm, apiKey: e.target.value })}
                          required
                        />
                      )}
                      {integrationForm.useGeneratedKey && (
                        <p className="text-[10px] font-bold text-slate-400">
                          {t.settingsAutoGenerateKey}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <Button type="button" variant="secondary" onClick={() => setIsIntegrationModalOpen(false)} className="h-12 px-8">{t.cancel}</Button>
                    <Button type="submit" isLoading={isLoading} className="h-12 px-8">{t.save}</Button>
                  </div>
                </form>
              </Modal>
            </div>
          )}

          {activeSection === "shipping-provider" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 mb-1">{t.shippingProvider}</h3>
                    <p className="text-slate-500 text-sm">{t.shippingProviderDesc}</p>
                  </div>
                  <Button onClick={handleOpenAddShipping} className="gap-2 h-11">
                    <Package size={18} />
                    <span>{t.addShippingProvider}</span>
                  </Button>
                </div>

                {shippingProviders.length === 0 ? (
                  <div className="bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 py-20 text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
                      <Truck size={32} />
                    </div>
                    <p className="text-lg font-black text-slate-400 mb-1">{t.noShippingProvider}</p>
                    <p className="text-sm text-slate-400">{t.noShippingProviderDesc}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {shippingProviders.map((provider) => (
                      <div key={provider.id} className={`bg-slate-50 rounded-[24px] p-6 border transition-all ${provider.isActive ? "border-emerald-100" : "border-slate-200 opacity-70"}`}>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${provider.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-200 text-slate-400"}`}>
                              <Package size={22} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-black text-slate-900">{provider.storeId ? provider.store?.name : t.allStores}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${provider.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                                  {provider.isActive ? t.shippingProviderActive : t.shippingProviderInactive}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-400 mt-0.5">{provider.prefix}.ecotrack.dz</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEditShipping(provider)}
                              className="p-2.5 bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all"
                              title={t.edit}
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteShippingId(provider.id)}
                              className="p-2.5 bg-white rounded-xl text-red-400 hover:text-red-600 transition-all"
                              title={t.delete}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 pt-5 border-t border-slate-200/50 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            <MapPin size={12} className="text-slate-400" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">{t.baseUrl}:</span>
                            <code className="font-mono text-slate-800">{provider.baseUrl}</code>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            <Key size={12} className="text-slate-400" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">{t.shippingApiKey}:</span>
                            <code className="font-mono text-slate-800">{provider.apiKey.substring(0, 12)}...</code>
                          </div>
                        </div>

                        {/* Stop Desk Sync */}
                        <div className="mt-4 pt-4 border-t border-slate-200/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                              <RefreshCcw size={12} className="text-slate-400" />
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.stopDesk}</span>
                              {provider.lastStopDeskSync && (
                                <span className="text-slate-400 font-normal mr-1">
                                  {t.settingsLastSync} {new Date(provider.lastStopDeskSync).toLocaleString()}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleSyncStopDesk(provider.id)}
                              disabled={syncingProviderId === provider.id}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                syncingProviderId === provider.id
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                  : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                              }`}
                            >
                              <RefreshCcw size={14} className={syncingProviderId === provider.id ? "animate-spin" : ""} />
                              {syncingProviderId === provider.id
                                ? t.settingsSyncing
                                : t.settingsSyncCommunes}
                            </button>
                          </div>
                          {!provider.lastStopDeskSync && (
                            <p className="text-xs text-slate-400 mt-2">
                              {t.settingsNotSynced}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delete Confirmation */}
              <Modal isOpen={!!deleteShippingId} onClose={() => setDeleteShippingId(null)} title={t.confirm}>
                <div className="text-center py-6 space-y-6">
                  <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <AlertTriangle size={40} />
                  </div>
                  <p className="text-slate-600">{t.deleteShippingWarning}</p>
                  <div className="flex justify-center gap-3">
                    <Button variant="secondary" onClick={() => setDeleteShippingId(null)} className="h-12 px-8">{t.cancel}</Button>
                    <Button variant="danger" onClick={handleDeleteShippingProvider} isLoading={isLoading} className="h-12 px-8">{t.delete}</Button>
                  </div>
                </div>
              </Modal>

              {/* Add/Edit Modal */}
              <Modal isOpen={isShippingModalOpen} onClose={() => setIsShippingModalOpen(false)} title={editingShippingProvider ? t.editShippingProvider : t.addShippingProvider}>
                <form onSubmit={handleSaveShippingProvider} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">{t.company}</label>
                      <select
                        defaultValue="ecotrack"
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                      >
                        <option value="ecotrack">Ecotrack</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">{t.selectStore}</label>
                      <select
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                        value={shippingForm.storeId}
                        onChange={(e) => setShippingForm({ ...shippingForm, storeId: e.target.value })}
                        disabled={!!editingShippingProvider}
                      >
                        <option value="">{t.settingsAllStoresGlobal}</option>
                        {stores.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">{t.prefix}</label>
                      <div className="flex">
                        <input
                          type="text"
                          className="flex-1 h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-mono font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                          placeholder={t.settingsPrefixPlaceholder}
                          value={shippingForm.prefix}
                          onChange={(e) => setShippingForm({ ...shippingForm, prefix: e.target.value })}
                          required
                        />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400">{t.prefixDesc}</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">{t.shippingApiKey}</label>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={shippingForm.useGeneratedKey ?? false}
                            onChange={() => setShippingForm({ ...shippingForm, useGeneratedKey: true, apiKey: "" })}
                            className="w-4 h-4 text-slate-900 focus:ring-slate-900"
                          />
                          <span className="text-xs font-bold text-slate-600">{t.generateApiKey}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={!(shippingForm.useGeneratedKey ?? false)}
                            onChange={() => setShippingForm({ ...shippingForm, useGeneratedKey: false, apiKey: "" })}
                            className="w-4 h-4 text-slate-900 focus:ring-slate-900"
                          />
                          <span className="text-xs font-bold text-slate-600">{t.useCustomKey}</span>
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type={showShippingApiKey ? "text" : "password"}
                          className="w-full h-12 px-4 pl-12 rounded-xl border border-slate-200 bg-white text-sm font-mono font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                          placeholder={t.settingsApiKeyPlaceholder}
                          value={shippingForm.apiKey}
                          onChange={(e) => setShippingForm({ ...shippingForm, apiKey: e.target.value })}
                          required
                        />
                        <Key size={16} className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-3" : "left-3"} text-slate-300`} />
                        <div className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "left-1" : "right-1"} flex items-center gap-1`}>
                          {shippingForm.useGeneratedKey && (
                            <button
                              type="button"
                              onClick={() => {
                                const key = Array.from({ length: 3 }, () => Math.random().toString(36).substring(2)).join("");
                                setShippingForm({ ...shippingForm, apiKey: key });
                              }}
                              className="p-2 text-xs font-black text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all"
                              title={t.generateApiKey}
                            >
                              <Key size={16} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowShippingApiKey(!showShippingApiKey)}
                            className="p-2 text-slate-400 hover:text-slate-600 transition-all"
                          >
                            {showShippingApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">{t.baseUrl}</label>
                      <input
                        type="text"
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-mono font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                        placeholder="https://world-express.ecotrack.dz"
                        value={shippingForm.baseUrl}
                        onChange={(e) => setShippingForm({ ...shippingForm, baseUrl: e.target.value })}
                      />
                      <p className="text-[10px] font-bold text-slate-400">
                        {t.settingsDefaultUrlHint}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <Button type="button" variant="secondary" onClick={() => setIsShippingModalOpen(false)} className="h-12 px-8">{t.cancel}</Button>
                    <Button type="submit" isLoading={isLoading} className="h-12 px-8">{t.save}</Button>
                  </div>
                </form>
              </Modal>
            </div>
          )}

          {activeSection === "backup" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-5 -mr-8 -mt-8 rotate-12">
                   <Database size={160} />
                </div>
                
                <div className="relative z-10">
                  <h3 className="text-2xl font-black text-slate-900 mb-2">{t.backupTitle}</h3>
                  <p className="text-slate-500 mb-10 max-w-xl">{t.backupDesc}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Export Card */}
                    <div className="bg-slate-50 rounded-[32px] border border-slate-100 p-8 hover:bg-white hover:shadow-xl transition-all group">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-inner">
                        <Download size={24} />
                      </div>
                      <h4 className="text-lg font-black text-slate-900 mb-2">{t.exportData}</h4>
                      <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                        {t.settingsBackupDescFull}
                      </p>
                      <Button onClick={handleExport} isLoading={isLoading} className="w-full h-12 rounded-xl">
                        {t.exportData}
                      </Button>
                    </div>

                    {/* Import Card */}
                    <div className="bg-slate-50 rounded-[32px] border border-slate-100 p-8 hover:bg-white hover:shadow-xl transition-all group">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 shadow-inner">
                        <Upload size={24} />
                      </div>
                      <h4 className="text-lg font-black text-slate-900 mb-2">{t.importData}</h4>
                      <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                        {t.settingsRestoreDescFull}
                      </p>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <Button variant="secondary" className="w-full h-12 rounded-xl border-dashed">
                          {t.importData}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Banner */}
              <div className="bg-amber-50 rounded-[32px] border border-amber-100 p-8 flex items-start gap-5">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm flex-shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-amber-900 mb-1">{t.settingsSecurityTip}</h4>
                  <p className="text-amber-700 text-sm leading-relaxed">
                    {t.settingsSecurityTipDesc}
                  </p>
                </div>
              </div>
            </div>
          )}

          {["general", "notifications", "security"].includes(activeSection) && (
            <div className="bg-white rounded-[40px] border border-slate-200 p-20 text-center animate-in fade-in zoom-in-95 duration-500">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <SettingsIcon size={40} />
               </div>
               <h3 className="text-2xl font-black text-slate-900 mb-2">
                 {menuItems.find(i => i.id === activeSection)?.label}
               </h3>
               <p className="text-slate-500">
                 {t.settingsUnderDevelopment}
               </p>
            </div>
          )}
        </div>
      </div>

      {/* Global Status Message */}
      {status && (
        <div className={`fixed bottom-10 right-10 p-6 rounded-[24px] border-2 flex items-center gap-4 animate-in slide-in-from-bottom-10 z-50 shadow-2xl ${
          status.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"
        }`}>
          {status.type === "success" ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
          <span className="font-bold">{status.message}</span>
        </div>
      )}

      {/* Restore Modal */}
      <Modal isOpen={isRestoreModalOpen} onClose={() => setIsRestoreModalOpen(false)} title={t.importData}>
        <div className="text-center py-6 space-y-6">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <RefreshCcw size={40} />
          </div>
          <div className="space-y-2 px-6">
            <h4 className="text-xl font-black text-slate-900">{t.settingsConfirmRestore}</h4>
            <p className="text-slate-500 text-sm">{t.restoreWarning}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between mx-8">
            <div className="flex items-center gap-3">
              <FileJson size={20} className="text-indigo-500" />
              <p className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{restoreFile?.name}</p>
            </div>
            <ArrowRight size={20} className="text-slate-300" />
          </div>
          <div className="flex justify-center gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsRestoreModalOpen(false)} className="h-12 px-8">{t.cancel}</Button>
            <Button variant="danger" onClick={handleRestore} isLoading={isLoading} className="h-12 px-10 shadow-lg shadow-red-200">{t.settingsStartRestore}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
