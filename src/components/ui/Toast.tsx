"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertTriangle, X, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

let toastId = 0;
let addToastFn: ((type: ToastType, message: string) => void) | null = null;

export function showToast(type: ToastType, message: string) {
  if (addToastFn) addToastFn(type, message);
}

export default function Toast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-6 z-[100] flex flex-col gap-3">
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const isError = toast.type === "error";
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-5 py-4 rounded-2xl border-2 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 min-w-[300px] max-w-[450px] ${
              isSuccess
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : isError
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 size={22} className="flex-shrink-0 text-emerald-500" />
            ) : isError ? (
              <AlertTriangle size={22} className="flex-shrink-0 text-red-500" />
            ) : (
              <Info size={22} className="flex-shrink-0 text-blue-500" />
            )}
            <span className="text-sm font-bold flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className={`p-1 rounded-lg transition-colors flex-shrink-0 ${
                isSuccess ? "hover:bg-emerald-100" : isError ? "hover:bg-red-100" : "hover:bg-blue-100"
              }`}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
