"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/translations";
import { Button } from "../ui";
import { ShieldCheck } from "lucide-react";

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShow(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md z-[200] animate-in slide-in-from-bottom-10">
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-2xl border border-slate-800 flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="bg-emerald-500/10 text-emerald-500 p-2 rounded-lg h-fit">
            <ShieldCheck size={20} />
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {t.cookieMessage}
          </p>
        </div>
        <div className="flex justify-end">
          <Button onClick={accept} variant="secondary" className="px-6 py-1.5 text-xs">
            {t.cookieAccept}
          </Button>
        </div>
      </div>
    </div>
  );
}
