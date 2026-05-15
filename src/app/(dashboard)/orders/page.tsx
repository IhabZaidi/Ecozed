"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button, Input, Modal } from "@/components/ui";
import { useLanguage } from "@/lib/translations";
import { useAuthStore } from "@/store/useAuthStore";
import { showToast } from "@/components/ui";
import { 
  Plus, 
  Search, 
  AlertCircle, 
  Phone, 
  MapPin, 
  Package as PackageIcon, 
  RefreshCw, 
  LayoutGrid, 
  List as ListIcon,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  User,
  Calendar,
  Pencil,
  Trash2,
  TrendingUp,
  Inbox,
  CheckSquare,
  Square,
  X,
  Banknote,
  PhoneOff,
  Smartphone,
  PhoneCall,
  Store as StoreIcon,
  UserCheck,
  Shield,
  Printer,
  FileText,
  ChevronDown
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  storeId: string;
}

interface Order {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELED" | "DELIVERED" | "RETURNED" | "NO_ANSWER" | "BUSY" | "PHONE_CLOSED";
  clientName: string;
  clientPhone1: string;
  clientPhone2: string | null;
  state: string;
  city: string;
  address: string | null;
  notes: string | null;
  productId: string;
  storeId: string;
  quantity: number;
  totalPrice: number | null;
  shippingType: "HOME" | "STOP_DESK";
  shippingCost: number;
  adsCost: number;
  product: { 
    name: string; 
    sellingPrice: number;
    cost: number;
    adsCost: number;
    extraCharges: number;
  };
  isBlacklisted?: boolean;
  createdAt: string;
  hasUpsell?: boolean;
  upsellQuantity?: number | null;
  confirmedBy?: { id: string; username: string } | null;
  ecotrackRef?: string | null;
  sentToEcotrack?: boolean;
  sentToEcotrackAt?: string | null;
  ecotrackValidated?: boolean;
  ecotrackValidatedAt?: string | null;
}

export default function OrdersPage() {
  const { t, language } = useLanguage();
  const { user, activeStoreIds } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shippingConfigs, setShippingConfigs] = useState<any[]>([]);
  const [shippingProviders, setShippingProviders] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [wilayas, setWilayas] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [communeSearch, setCommuneSearch] = useState("");
  const [communeDropdownOpen, setCommuneDropdownOpen] = useState(false);
  const communeRef = useRef<HTMLDivElement>(null);
  const [stopDeskCommunes, setStopDeskCommunes] = useState<Set<string> | null>(null);
  const [loadingStopDesk, setLoadingStopDesk] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (communeRef.current && !communeRef.current.contains(e.target as Node)) {
        setCommuneDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone1: "",
    clientPhone2: "",
    state: "",
    city: "",
    address: "",
    productId: "",
    storeId: "",
    quantity: "1",
    totalPrice: "",
    shippingType: "HOME" as "HOME" | "STOP_DESK",
    shippingCost: 0,
    adsCost: "0",
    notes: "",
    status: "PENDING" as Order["status"],
    hasUpsell: false,
    upsellQuantity: "",
  });

  const stateCodeMap = Object.fromEntries(shippingConfigs.map(c => [c.stateName, c.stateCode]));
  const selectedWilayaCode = formData.state ? stateCodeMap[formData.state] || "" : "";
  const filteredCommunes = communes.filter(c => {
    if (c.wilaya_code !== selectedWilayaCode) return false;
    if (formData.shippingType === "STOP_DESK" && stopDeskCommunes) {
      if (!stopDeskCommunes.has(c.commune_latin)) return false;
    }
    if (communeSearch && !c.commune_ar.includes(communeSearch) && !c.commune_latin.toLowerCase().includes(communeSearch.toLowerCase())) return false;
    return true;
  });
  const selectedCommune = formData.city
    ? communes.find(c => c.commune_latin === formData.city || c.commune_ar === formData.city)
    : null;

  const fetchStopDeskCommunes = async (wilayaCode: string) => {
    setLoadingStopDesk(true);
    try {
      const res = await fetch(`/api/settings/shipping/stop-desk-communes?wilayaId=${wilayaCode}`);
      const data = res.ok ? await res.json() : null;
      if (res.ok && data) {
        const names = new Set<string>(
          (data.communes || [])
            .filter((c: any) => c.hasStopDesk === true)
            .map((c: any) => (c.communeLatin || c.nom) as string)
        );
        setStopDeskCommunes(names);
      } else {
        setStopDeskCommunes(new Set<string>());
      }
    } catch (err) {
      setStopDeskCommunes(new Set<string>());
    } finally {
      setLoadingStopDesk(false);
    }
  };

  const isRtl = language === "ar";

  const statusOptions = [
    { value: "PENDING", label: t.statusPending, icon: Clock, color: "bg-amber-50 text-amber-600 border-amber-100" },
    { value: "CONFIRMED", label: t.statusConfirmed, icon: CheckCircle2, color: "bg-blue-50 text-blue-600 border-blue-100" },
    { value: "NO_ANSWER", label: t.noAnswer, icon: PhoneOff, color: "bg-orange-50 text-orange-600 border-orange-100" },
    { value: "BUSY", label: t.busy, icon: PhoneCall, color: "bg-purple-50 text-purple-600 border-purple-100" },
    { value: "PHONE_CLOSED", label: t.phoneClosed, icon: Smartphone, color: "bg-slate-50 text-slate-600 border-slate-100" },
    { value: "CANCELED", label: t.statusCanceled, icon: XCircle, color: "bg-red-50 text-red-600 border-red-100" },
    { value: "DELIVERED", label: t.statusDelivered, icon: Truck, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    { value: "RETURNED", label: t.statusReturned, icon: RotateCcw, color: "bg-slate-50 text-slate-600 border-slate-100" },
  ];

  const filterOptions = [
    { value: null, label: t.filterAll, icon: null, color: "bg-slate-100 text-slate-700 border-slate-200" },
    { value: "PENDING", label: t.statusPending, icon: Clock, color: "bg-amber-50 text-amber-600 border-amber-100" },
    { value: "NEED_CONTACT", label: t.filterNeedContact, icon: PhoneCall, color: "bg-purple-50 text-purple-600 border-purple-100" },
    { value: "CONFIRMED", label: t.filterProcessing, icon: CheckCircle2, color: "bg-blue-50 text-blue-600 border-blue-100" },
    { value: "DELIVERED", label: t.statusDelivered, icon: Truck, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    { value: "RETURNED", label: t.statusReturned, icon: RotateCcw, color: "bg-slate-50 text-slate-600 border-slate-100" },
    { value: "CANCELED", label: t.statusCanceled, icon: XCircle, color: "bg-red-50 text-red-600 border-red-100" },
  ];

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/orders?storeIds=${activeStoreIds.join(",")}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    const userStoreIds = (user?.stores || []).map(s => s.id).join(",");
    const res = await fetch(`/api/products?storeIds=${userStoreIds}`);
    if (res.ok) {
      const data = await res.json();
      setProducts(data);
    }
  };

  const fetchShipping = async () => {
    const res = await fetch("/api/settings/shipping");
    if (res.ok) setShippingConfigs(await res.json());
  };

  const fetchShippingProviders = async () => {
    const res = await fetch("/api/settings/shipping-provider");
    const data = res.ok ? await res.json() : null;
    if (res.ok) setShippingProviders(data);
  };

  const fetchCommunes = async (wilayaCode?: string) => {
    const params = wilayaCode ? `?wilayaCode=${wilayaCode}` : "";
    const res = await fetch(`/api/settings/communes${params}`);
    if (res.ok) {
      const data = await res.json();
      setCommunes(data.communes);
      if (!wilayaCode) setWilayas(data.wilayas);
    }
  };

  useEffect(() => {
    if (activeStoreIds.length > 0) {
      fetchOrders();
    } else {
      setOrders([]);
    }
    fetchProducts();
    fetchShipping();
    fetchShippingProviders();
    fetchCommunes();
  }, [activeStoreIds]);

  useEffect(() => {
    if (formData.state && shippingConfigs.length > 0) {
      const config = shippingConfigs.find(c => c.stateName === formData.state);
      if (config) {
        const cost = formData.shippingType === "HOME" ? config.homeCost : config.stopDeskCost;
        setFormData(prev => {
          const cityStillValid = !prev.city || communes.some(c => c.wilaya_code === config.stateCode && (c.commune_latin === prev.city || c.commune_ar === prev.city));
          return {
            ...prev,
            shippingCost: cost,
            city: cityStillValid ? prev.city : "",
          };
        });
      }
    }
  }, [formData.state, formData.shippingType, shippingConfigs, communes]);

  useEffect(() => {
    if (formData.shippingType === "STOP_DESK" && formData.state) {
      const config = shippingConfigs.find(c => c.stateName === formData.state);
      if (config) fetchStopDeskCommunes(config.stateCode);
    } else {
      setStopDeskCommunes(null);
    }
  }, [formData.shippingType, formData.state, shippingConfigs]);

  const handleOpenAdd = () => {
    setEditingOrder(null);
    const defaultStoreId = activeStoreIds.length === 1 ? activeStoreIds[0] : (user?.stores?.[0]?.id || "");
    const storeProducts = products.filter(p => p.storeId === defaultStoreId);
    
    setFormData({
      clientName: "",
      clientPhone1: "",
      clientPhone2: "",
      state: "",
      city: "",
      address: "",
      productId: storeProducts[0]?.id || "",
      storeId: defaultStoreId,
      quantity: "1",
      totalPrice: "",
      shippingType: "HOME",
      shippingCost: 0,
      adsCost: "0",
      notes: "",
      status: "PENDING",
      hasUpsell: false,
      upsellQuantity: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      clientName: order.clientName,
      clientPhone1: order.clientPhone1,
      clientPhone2: order.clientPhone2 || "",
      state: order.state,
      city: order.city,
      address: order.address || "",
      productId: order.productId,
      storeId: order.storeId,
      quantity: order.quantity.toString(),
      totalPrice: order.totalPrice?.toString() || "",
      shippingType: order.shippingType,
      shippingCost: order.shippingCost,
      adsCost: order.adsCost.toString(),
      notes: order.notes || "",
      status: order.status,
      hasUpsell: order.hasUpsell || false,
      upsellQuantity: order.upsellQuantity?.toString() || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.state || !formData.city || !formData.address) {
      showToast("error", t.orderRequiredFields);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const method = editingOrder ? "PUT" : "POST";
    const url = editingOrder ? `/api/orders/${editingOrder.id}` : "/api/orders";
    
    const res = await fetch(url, {
      method,
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchOrders();
    }
    setIsLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchOrders();
  };

  const handleBulkUpdate = async (status: string) => {
    setIsLoading(true);
    const res = await fetch("/api/orders/bulk", {
      method: "PUT",
      body: JSON.stringify({ ids: selectedIds, status }),
    });
    if (res.ok) {
      setSelectedIds([]);
      fetchOrders();
    }
    setIsLoading(false);
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(t.bulkDeleteConfirm)) return;
    setIsLoading(true);
    const res = await fetch(`/api/orders/bulk?ids=${selectedIds.join(",")}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setSelectedIds([]);
      fetchOrders();
    }
    setIsLoading(false);
  };

  const handleValidateShipping = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders/shipping/validate", {
        method: "POST",
        body: JSON.stringify({ ids: selectedIds }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedIds([]);
        fetchOrders();
        showToast("success", `${data.validated} ${t.orders} ${t.validateSuccess}`);
      } else {
        const err = await res.json();
        if (err.rateLimited) {
          showToast("error", t.rateLimitError);
        } else {
          showToast("error", err.error || t.orderFailedDispatch);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToShipping = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders/shipping/send", {
        method: "POST",
        body: JSON.stringify({ ids: selectedIds }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedIds([]);
        fetchOrders();
        showToast("success", `${data.count} ${t.orders} ${t.sentSuccess}`);
      } else {
        const err = await res.json();
        showToast("error", err.error || t.orderFailedSend);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintLabel = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/shipping/label?orderId=${orderId}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const disposition = res.headers.get("Content-Disposition") || "";
        const filename = disposition.match(/filename="(.+)"/)?.[1] || "label.pdf";
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const err = await res.json();
        showToast("error", err.error || t.orderFailedLabel);
      }
    } catch {
      showToast("error", t.orderFailedLabelDownload);
    }
  };

  const handleSyncTracking = async () => {
    if (!shippingProviders.some(p => p.isActive)) {
      showToast("error", t.orderNoShippingProvider);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders/shipping/sync-tracking", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        showToast("success", t.syncTrackingSuccess.replace("{updated}", String(data.updated)).replace("{total}", String(data.total)));
        if (data.updated > 0) {
          fetchOrders();
        }
      } else {
        const err = await res.json();
        showToast("error", err.error || t.orderFailedSync);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSyncTracking = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders/shipping/sync-tracking", {
        method: "POST",
        body: JSON.stringify({ ids: selectedIds }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        showToast("success", t.syncTrackingSuccess.replace("{updated}", String(data.updated)).replace("{total}", String(data.total)));
        if (data.updated > 0) {
          setSelectedIds([]);
          fetchOrders();
        }
      } else {
        const err = await res.json();
        showToast("error", err.error || t.orderFailedSync);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintLabels = async () => {
    const trackedIds = selectedIds.filter(id => {
      const order = orders.find(o => o.id === id);
      return order?.ecotrackRef;
    });
    if (trackedIds.length === 0) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/orders/shipping/labels", {
        method: "POST",
        body: JSON.stringify({ ids: trackedIds }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `labels-${trackedIds.length}-orders.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast("success", t.orderLabelsDownloaded.replace("{count}", String(trackedIds.length)));
      } else {
        const err = await res.json();
        showToast("error", err.error || t.orderFailedLabels);
      }
    } catch {
      showToast("error", t.orderFailedLabelsDownload);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintBordereau = async () => {
    const sentIds = selectedIds.filter(id => {
      const order = orders.find(o => o.id === id);
      return order?.sentToEcotrack && order?.ecotrackRef;
    });
    if (sentIds.length === 0) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/orders/shipping/bordereau", {
        method: "POST",
        body: JSON.stringify({ ids: sentIds }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bordereau-${sentIds.length}-orders.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast("success", `${t.printBordereau} - ${sentIds.length} ${t.orders}`);
      } else {
        const err = await res.json();
        showToast("error", err.error || t.orderFailedBordereau);
      }
    } catch {
      showToast("error", t.orderFailedBordereau);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!orderToDelete) return;
    setIsLoading(true);
    const res = await fetch(`/api/orders/${orderToDelete}`, { method: "DELETE" });
    if (res.ok) {
      setIsDeleteModalOpen(false);
      setOrderToDelete(null);
      fetchOrders();
    }
    setIsLoading(false);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter === "NEED_CONTACT") {
      if (!["NO_ANSWER", "BUSY", "PHONE_CLOSED"].includes(o.status)) return false;
    } else if (statusFilter && o.status !== statusFilter) {
      return false;
    }
    return !filter || 
      o.clientName.toLowerCase().includes(filter.toLowerCase()) || 
      o.clientPhone1.includes(filter) ||
      o.product.name.toLowerCase().includes(filter.toLowerCase());
  });

  // Helper to filter products in modal based on selected store
  const filteredProductsForModal = products.filter(p => p.storeId === formData.storeId);

  return (
    <>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t.ordersTitle}</h2>
          <p className="text-slate-500 text-sm">{t.ordersDesc}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[240px]">
            <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRtl ? "right-3" : "left-3"}`} size={18} />
            <input
              type="text"
              placeholder={t.search}
              className={`w-full h-11 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-sm bg-white shadow-sm ${isRtl ? "pr-10 pl-4" : "pl-10 pr-4"}`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={fetchOrders} className="h-11 w-11 p-0" title={t.refresh}>
              <div className={`${isLoading ? "animate-spin" : ""}`}>
                <RefreshCw size={18} />
              </div>
            </Button>
            <Button variant="secondary" onClick={handleSyncTracking} className="h-11 gap-2 px-4" title={t.syncTrackingDesc}>
              <RefreshCw size={16} />
              <span className="text-xs font-bold hidden sm:inline">{t.syncTracking}</span>
            </Button>

            <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center shadow-sm h-11">
              <button 
                onClick={() => setViewMode("list")}
                className={`h-full px-3 rounded-lg transition-all flex items-center ${viewMode === "list" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
              >
                <ListIcon size={18} />
              </button>
              <button 
                onClick={() => setViewMode("grid")}
                className={`h-full px-3 rounded-lg transition-all flex items-center ${viewMode === "grid" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
              >
                <LayoutGrid size={18} />
              </button>
            </div>

            <Button onClick={handleOpenAdd} className="h-11 gap-2 px-6 shadow-lg shadow-slate-900/20">
              <Plus size={18} />
              <span className="font-bold">{t.addNew}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
        {filterOptions.map(opt => {
          const count = opt.value === null
            ? orders.length
            : opt.value === "NEED_CONTACT"
              ? orders.filter(o => ["NO_ANSWER", "BUSY", "PHONE_CLOSED"].includes(o.status)).length
              : orders.filter(o => o.status === opt.value).length;
          const isActive = statusFilter === opt.value;
          return (
            <button
              key={opt.value || "all"}
              onClick={() => { setStatusFilter(opt.value); setSelectedIds([]); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-black transition-all whitespace-nowrap ${
                isActive
                  ? `${opt.color} shadow-sm scale-105`
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              {opt.icon && <opt.icon size={14} />}
              {opt.label}
              <span className={`${isRtl ? "mr-1" : "ml-1"} text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                isActive ? "bg-white/30" : "bg-slate-100 text-slate-400"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-slate-200 border-dashed p-20 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
            <Inbox size={48} />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">
            {statusFilter || filter
              ? t.orderNoMatching
              : t.noOrders}
          </h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8">
            {activeStoreIds.length === 0
              ? t.orderSelectStore
              : statusFilter || filter
                ? t.orderTryChangeFilter
                : t.noOrdersDesc}
          </p>
          {!statusFilter && !filter && (
            <Button onClick={handleOpenAdd} className="gap-2 px-8 py-3">
              <Plus size={20} />
              <span>{t.addNew}</span>
            </Button>
          )}
        </div>
      ) : viewMode === "list" ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className={`w-full border-collapse ${isRtl ? "text-right" : "text-left"}`}>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 w-10">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-900 transition-colors">
                      {selectedIds.length === filteredOrders.length ? <CheckSquare size={20} className="text-indigo-600" /> : <Square size={20} />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{t.clientName}</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{t.productsTitle}</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">{t.quantity}</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">{t.totalPrice}</th>
                  {user?.role === "ADMIN" && (
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">{t.realProfit}</th>
                  )}
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{t.status}</th>
                  <th className={`px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest ${isRtl ? "text-left" : "text-right"}`}>{t.confirm}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const revenue = order.totalPrice || ((order.product.sellingPrice * order.quantity) + order.shippingCost);
                  const totalCost = (order.product.cost * order.quantity) + order.adsCost + order.product.extraCharges;
                  const realProfit = revenue - totalCost;
                  const isSelected = selectedIds.includes(order.id);
                  const storeName = user?.stores.find(s => s.id === order.storeId)?.name;

                   return (
                     <tr key={order.id} className={`hover:bg-slate-50/80 transition-colors group ${isSelected ? "bg-indigo-50/30" : ""}`}>
                      <td className="px-6 py-4">
                        <button onClick={() => toggleSelect(order.id)} className="text-slate-300 hover:text-indigo-600 transition-colors">
                          {isSelected ? <CheckSquare size={20} className="text-indigo-600" /> : <Square size={20} />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{order.clientName}</span>
                            {order.isBlacklisted && <AlertCircle size={14} className="text-red-500" />}
                          </div>
                          <div className="flex items-center gap-1.5">
                             <div className="px-1 py-0.5 rounded bg-slate-50 border border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">{storeName}</div>
                             <span className="text-[10px] text-slate-400 font-bold font-mono">{order.clientPhone1}</span>
                              {order.confirmedBy && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[9px] font-black text-emerald-700 leading-none shadow-sm">
                                  <UserCheck size={10} />
                                  {order.confirmedBy.username}
                                </span>
                              )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">{order.product.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{order.state} - {order.city}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-slate-100 text-slate-900 rounded-lg text-xs font-black">x{order.quantity}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className="text-sm font-black text-slate-900">{revenue.toFixed(0)} {t.currency}</span>
                      </td>
                      {user?.role === "ADMIN" && (
                        <td className="px-6 py-4 text-center">
                          <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black border ${
                            realProfit > 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                          }`}>
                            <TrendingUp size={12} className={realProfit > 0 ? "" : "rotate-180"} />
                            {realProfit.toFixed(0)} {t.currency}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <select 
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className={`text-[10px] font-black rounded-xl border px-3 py-2 focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all cursor-pointer ${
                            statusOptions.find(s => s.value === order.status)?.color
                          }`}
                        >
                          {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value} className="bg-white text-slate-900">{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex gap-1 ${isRtl ? "justify-end" : "justify-start"}`}>
                          {order.ecotrackRef && (
                            <>
                              <span className="px-2 py-1 rounded-lg text-[8px] font-black leading-none bg-blue-100 text-blue-700 border border-blue-200">
                                <PackageIcon size={10} className="inline mr-0.5" />
                                {t.sentToShipping}
                              </span>
                              <button 
                                onClick={() => handlePrintLabel(order.id)}
                                className="p-2.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                                title={t.printLabel}
                              >
                                <Printer size={18} />
                              </button>
                              <span className={`px-2 py-1 rounded-lg text-[8px] font-black leading-none ${
                                order.ecotrackValidated 
                                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                                  : "bg-amber-100 text-amber-700 border border-amber-200"
                              }`}>
                                {order.ecotrackValidated ? t.validated : t.notValidated}
                              </span>
                            </>
                          )}
                          <button 
                            onClick={() => handleOpenEdit(order)}
                            className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl shadow-none hover:shadow-lg transition-all border border-transparent hover:border-slate-100"
                          >
                            <Pencil size={18} />
                          </button>
                          {user?.role === "ADMIN" && (
                            <button 
                              onClick={() => {
                                setOrderToDelete(order.id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl shadow-none hover:shadow-lg transition-all border border-transparent hover:border-red-50"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const storeName = user?.stores.find(s => s.id === order.storeId)?.name;
            const revenue = order.totalPrice || ((order.product.sellingPrice * order.quantity) + order.shippingCost);
            const totalCost = (order.product.cost * order.quantity) + order.adsCost + order.product.extraCharges;
            const realProfit = revenue - totalCost;
            const isSelected = selectedIds.includes(order.id);
            const currentStatus = statusOptions.find(s => s.value === order.status);

            return (
              <div key={order.id} className={`bg-white rounded-[24px] border-2 p-6 hover:border-slate-300 transition-all shadow-sm flex flex-col group relative ${isSelected ? "border-indigo-500 shadow-indigo-100 shadow-xl" : "border-slate-200"} ${isRtl ? "text-right" : "text-left"}`}>
                {/* Checkbox for Grid */}
                <button 
                  onClick={() => toggleSelect(order.id)}
                  className={`absolute top-4 ${isRtl ? "left-4" : "right-4"} z-10 p-1 rounded-lg transition-all ${isSelected ? "text-indigo-600 bg-indigo-50" : "text-slate-300 bg-slate-50 hover:text-slate-600"}`}
                >
                  {isSelected ? <CheckSquare size={22} /> : <Square size={22} />}
                </button>

                <div className={`flex justify-between items-start mb-6 ${isRtl ? "flex-row" : "flex-row-reverse"}`}>
                   <div className="flex items-center gap-2">
                     <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider ${currentStatus?.color}`}>
                       {currentStatus && <currentStatus.icon size={12} />}
                       {currentStatus?.label}
                     </div>
                     {order.sentToEcotrack && (
                       <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border-blue-200 shadow-sm">
                         <PackageIcon size={11} />
                         {t.sentToShipping}
                       </span>
                     )}
                   </div>
                  <div className={`flex items-center gap-4 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-inner">
                      <User size={24} />
                    </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-slate-900 tracking-tight">{order.clientName}</h3>
                          {order.isBlacklisted && (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-lg shadow-lg shadow-red-200">
                              {t.bl}
                            </span>
                          )}
                        </div>
                      <div className={`flex items-center gap-1.5 text-[10px] text-slate-400 font-bold ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                        <Calendar size={10} />
                        {new Date(order.createdAt).toLocaleDateString(isRtl ? "ar-DZ" : "en-US")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 mb-8">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.phone}</div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700 font-mono">
                          <Phone size={12} className="text-indigo-400" />
                          {order.clientPhone1}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.location}</div>
                      <div className="flex items-start gap-2 text-[11px] font-bold text-slate-600 leading-relaxed">
                        <MapPin size={12} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                        {order.state}, {order.city}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-[20px] p-5 flex flex-col justify-center border border-slate-100 relative overflow-hidden">
                    <div className="absolute -top-1 -right-1 opacity-5 scale-150 rotate-12 text-slate-300">
                      <StoreIcon size={64} />
                    </div>
                    <div className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-[0.2em]">{storeName}</div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-slate-800 line-clamp-1">{order.product.name}</span>
                    </div>
                    <div className="text-[10px] font-black text-indigo-600">
                      {revenue} {t.currency} (x{order.quantity})
                    </div>
                    {user?.role === "ADMIN" && (
                      <div className="mt-3 pt-3 border-t border-slate-200/50 flex items-center justify-between">
                         <span className="text-[9px] font-black text-slate-400 uppercase">{t.profit}</span>
                         <span className={`text-[11px] font-black ${realProfit > 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {realProfit.toFixed(0)}
                         </span>
                      </div>
                    )}
                    {order.confirmedBy && (
                      <div className="mt-3 pt-3 border-t border-emerald-200/50 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-[0.1em]">
                          <UserCheck size={11} />
                          {t.orderConfirmedBy}
                        </span>
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black shadow-sm border border-emerald-200">
                          <Shield size={10} />
                          {order.confirmedBy.username}
                        </span>
                      </div>
                    )}
                    {order.sentToEcotrack && order.ecotrackRef && (
                      <>
                        <div className="mt-3 pt-3 border-t border-blue-200/50 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 uppercase tracking-[0.1em]">
                            <PackageIcon size={11} />
                            {t.ecotrackRef}
                          </span>
                          <div className="flex items-center gap-2">
                            <code className="text-[9px] font-mono font-black text-blue-800 bg-blue-100 px-2 py-1 rounded-lg border border-blue-200">
                              {order.ecotrackRef}
                            </code>
                            <button
                              onClick={() => handlePrintLabel(order.id)}
                              className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all"
                              title={t.printLabel}
                            >
                              <Printer size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">
                            {t.shippingStatus}
                          </span>
                          {order.ecotrackValidated ? (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[9px] font-black shadow-sm border border-emerald-200">
                              <CheckCircle2 size={10} />
                              {t.validated}
                              {order.ecotrackValidatedAt && (
                                <span className="opacity-60">({new Date(order.ecotrackValidatedAt).toLocaleDateString()})</span>
                              )}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 text-amber-800 text-[9px] font-black shadow-sm border border-amber-200">
                              <Clock size={10} />
                              {t.notValidated}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-auto">
                  <Button variant="secondary" onClick={() => handleOpenEdit(order)} className="flex-1 h-11 text-xs font-bold gap-2 rounded-2xl">
                    <Pencil size={14} />
                    {t.edit}
                  </Button>
                  {user?.role === "ADMIN" && (
                    <Button 
                      variant="danger" 
                      onClick={() => {
                        setOrderToDelete(order.id);
                        setIsDeleteModalOpen(true);
                      }} 
                      className="w-11 h-11 p-0 rounded-2xl"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-[32px] shadow-2xl shadow-indigo-500/20 flex items-center gap-6 border-4 border-white">
            <div className="flex items-center gap-3 pr-6 border-r border-slate-700">
              <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center font-black text-lg">
                {selectedIds.length}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">{t.selected}</span>
                <span className="text-sm font-bold">{t.orders}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {statusOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleBulkUpdate(opt.value)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl hover:bg-white hover:text-slate-900 transition-all text-xs font-bold whitespace-nowrap"
                >
                  <opt.icon size={14} />
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pl-6 border-l border-slate-700">
               {(() => {
                  const hasActiveProvider = selectedIds.some(id => {
                    const o = orders.find(o => o.id === id);
                    if (!o) return false;
                    return shippingProviders.some(p => p.isActive && (p.storeId === o.storeId || !p.storeId));
                  });
                  return (
                   <>
                      {/* Send confirmed orders to shipping */}
                      {hasActiveProvider && selectedIds.some(id => {
                        const o = orders.find(o => o.id === id);
                        return o?.status === "CONFIRMED" && !o.sentToEcotrack;
                      }) && (
                        <button 
                          onClick={handleSendToShipping}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all text-xs font-bold whitespace-nowrap hover:bg-emerald-500 hover:text-white text-emerald-400 cursor-pointer"
                          title={t.sendToShipping}
                        >
                          <PackageIcon size={14} />
                          {t.sendToShipping}
                        </button>
                      )}
                      {/* Dispatch to shipping */}
                      {hasActiveProvider && selectedIds.some(id => {
                        const o = orders.find(o => o.id === id);
                        return o?.sentToEcotrack && !o.ecotrackValidated;
                      }) && (
                        <button 
                          onClick={handleValidateShipping}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all text-xs font-bold whitespace-nowrap hover:bg-indigo-500 hover:text-white text-indigo-400 cursor-pointer"
                          title={t.validateShipping}
                        >
                          <TrendingUp size={14} />
                          {t.validateShipping}
                        </button>
                       )}
                       {/* Sync tracking */}
                       {hasActiveProvider && selectedIds.some(id => {
                         const o = orders.find(o => o.id === id);
                         return o?.sentToEcotrack;
                       }) && (
                         <button 
                           onClick={handleBulkSyncTracking}
                           className="flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all text-xs font-bold whitespace-nowrap hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                           title={t.syncTrackingDesc}
                         >
                           <RefreshCw size={14} />
                           {t.syncTracking}
                         </button>
                       )}
                    </>
                  );
                })()}
                {/* Print labels for sent orders */}
                {selectedIds.some(id => {
                  const o = orders.find(o => o.id === id);
                  return o?.ecotrackRef;
                }) && (
                  <button 
                    onClick={handlePrintLabels}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl hover:bg-white hover:text-slate-900 transition-all text-xs font-bold whitespace-nowrap"
                    title={t.printLabels}
                  >
                    <Printer size={14} />
                    {t.printLabels}
                  </button>
                )}
                {selectedIds.some(id => {
                  const o = orders.find(o => o.id === id);
                  return o?.sentToEcotrack && o?.ecotrackRef;
                }) && (
                  <button 
                    onClick={handlePrintBordereau}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl hover:bg-indigo-500 hover:text-white transition-all text-xs font-bold text-indigo-400 whitespace-nowrap"
                    title={(t.printBordereau || "")}
                  >
                    <FileText size={14} />
                    {(t.printBordereau || "")}
                  </button>
                )}
               {user?.role === "ADMIN" && (
                 <button 
                  onClick={handleBulkDelete}
                  className="p-2.5 rounded-2xl text-red-400 hover:bg-red-500 hover:text-white transition-all"
                  title={t.delete}
                 >
                   <Trash2 size={20} />
                 </button>
               )}
               <button 
                onClick={() => setSelectedIds([])}
                className="p-2.5 rounded-2xl text-slate-400 hover:bg-slate-800 transition-all"
               >
                 <X size={20} />
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingOrder ? t.edit : t.addNew}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <Input
                label={t.clientName}
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                required
                className="h-12"
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-sm font-bold text-slate-700">{t.store}</label>
              <select
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all disabled:opacity-50 disabled:bg-slate-50"
                value={formData.storeId}
                onChange={(e) => setFormData({ ...formData, storeId: e.target.value, productId: "" })}
                required
                disabled={activeStoreIds.length === 1 && !editingOrder}
              >
                {(user?.stores || []).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-sm font-bold text-slate-700">{t.status}</label>
              <select
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <Input
              label={t.clientPhone1}
              value={formData.clientPhone1}
              onChange={(e) => setFormData({ ...formData, clientPhone1: e.target.value })}
              required
              className="h-12"
            />
            <Input
              label={t.clientPhone2}
              value={formData.clientPhone2}
              onChange={(e) => setFormData({ ...formData, clientPhone2: e.target.value })}
              className="h-12"
            />
            <div className="flex flex-col space-y-1.5">
              <label className="text-sm font-bold text-slate-700">{t.state}</label>
              <select
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
              >
                <option value="">{t.orderSelectState}</option>
                {shippingConfigs.map(c => (
                  <option key={c.id} value={c.stateName}>{c.stateCode} - {c.stateName}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col space-y-1.5 relative" ref={communeRef}>
              <label className="text-sm font-bold text-slate-700">{t.city} <span className="text-red-500">*</span></label>
              <button
                type="button"
                onClick={() => { setCommuneDropdownOpen(!communeDropdownOpen); setCommuneSearch(""); }}
                className={`w-full h-12 px-4 rounded-xl border text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all text-left flex items-center justify-between ${formData.city ? "text-slate-900 bg-white" : "text-slate-400 bg-white"} ${!formData.state ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${isRtl ? "flex-row-reverse text-right" : ""}`}
                disabled={!formData.state}
              >
                <span className="truncate">
                  {selectedCommune
                    ? `${selectedCommune.commune_ar} (${selectedCommune.commune_latin})`
                    : formData.city || t.orderSelectCommune}
                </span>
                <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
              </button>
              {communeDropdownOpen && formData.state && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 flex flex-col">
                  <div className="p-2 border-b border-slate-100">
                    <input
                      type="text"
                      value={communeSearch}
                      onChange={(e) => setCommuneSearch(e.target.value)}
                      placeholder={t.orderSearchCommune}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      autoFocus
                    />
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {formData.shippingType === "STOP_DESK" && loadingStopDesk ? (
                      <div className="p-4 text-center text-sm text-slate-400 font-bold">
                        {t.orderLoadingCommunes}
                      </div>
                    ) : filteredCommunes.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-400 font-bold">
                        {formData.shippingType === "STOP_DESK"
                          ? t.orderNoStopDeskCommunes
                          : t.orderNoResults}
                      </div>
                    ) : (
                      filteredCommunes.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, city: c.commune_latin });
                            setCommuneDropdownOpen(false);
                            setCommuneSearch("");
                          }}
                          className={`w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors flex items-center gap-2 ${formData.city === c.commune_latin ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-700"} ${isRtl ? "flex-row-reverse text-right" : ""}`}
                        >
                          <span>{c.commune_ar}</span>
                          <span className="text-slate-400 text-xs">({c.commune_latin})</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
              {formData.shippingType === "STOP_DESK" && formData.city && stopDeskCommunes && !stopDeskCommunes.has(formData.city) && (
                <p className="text-xs text-amber-600 font-bold mt-1">
                  {t.orderWarningNoStopDesk}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <Input
                label={`${t.address} *`}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="h-12"
                required
              />
            </div>

            {/* Shipping Type & Cost */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none block mb-2">{t.shippingType}</label>
              <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100 h-12">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, shippingType: "HOME" })}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl transition-all font-bold text-sm ${formData.shippingType === "HOME" ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}
                >
                   {t.home}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, shippingType: "STOP_DESK" })}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl transition-all font-bold text-sm ${formData.shippingType === "STOP_DESK" ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}
                >
                   {t.stopDesk}
                </button>
              </div>
            </div>
            <div className="relative">
              <Input
                label={t.shippingCost}
                type="number"
                value={formData.shippingCost}
                onChange={(e) => setFormData({ ...formData, shippingCost: parseInt(e.target.value) || 0 })}
                className="h-12 font-black bg-indigo-50/50 border-indigo-100 focus:border-indigo-500"
              />
              <div className="absolute top-[38px] right-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t.currency}</div>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <label className="text-sm font-bold text-slate-700">{t.productsTitle}</label>
              <select
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                required
              >
                <option value="">{t.orderSelectProduct}</option>
                {filteredProductsForModal.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sellingPrice} {t.currency})</option>
                ))}
              </select>
              {filteredProductsForModal.length === 0 && (
                <p className="text-[10px] text-red-500 font-bold mt-1">{t.orderNoProducts}</p>
              )}
            </div>
            <Input
              label={t.quantity}
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
              className="h-12"
            />
            
            <div className="flex flex-col gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl md:col-span-2">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="hasUpsell" 
                  checked={formData.hasUpsell} 
                  onChange={(e) => setFormData({ ...formData, hasUpsell: e.target.checked })} 
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                />
                <label htmlFor="hasUpsell" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                  {(t.hasUpsell || "")}
                </label>
              </div>
              
              {formData.hasUpsell && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                  <Input
                    label={(t.upsellQuantity || "")}
                    type="number"
                    value={formData.upsellQuantity}
                    onChange={(e) => setFormData({ ...formData, upsellQuantity: e.target.value })}
                    className="h-12 bg-white"
                  />
                </div>
              )}
            </div>

            <Input
              label={t.totalPrice}
              type="number"
              placeholder={t.orderAutoCalc}
              value={formData.totalPrice}
              onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
              className="h-12"
            />
            <Input
              label={t.adsCost}
              type="number"
              step="0.01"
              value={formData.adsCost}
              onChange={(e) => setFormData({ ...formData, adsCost: e.target.value })}
              className="h-12"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="h-12 px-8">{t.cancel}</Button>
            <Button type="submit" isLoading={isLoading} className="h-12 px-10 shadow-lg shadow-slate-900/20">{t.save}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t.confirm}
      >
        <div className="text-center py-6 space-y-6">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-black text-slate-900">{t.confirmDelete}</h4>
            <p className="text-slate-500 text-sm">{t.deleteConfirm}</p>
          </div>
          <div className="flex justify-center gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)} className="h-12 px-8">{t.cancel}</Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isLoading} className="h-12 px-8 shadow-lg shadow-red-200">{t.delete}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
