"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { useLanguage } from "@/lib/translations";
import { Package, Eye, EyeOff } from "lucide-react";

export default function SetupPage() {
  const { t, language } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const router = useRouter();

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    fetch("/api/auth/setup")
      .then((res) => res.json())
      .then((data) => {
        if (!data.setupRequired) {
          router.push("/login");
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        setChecking(false);
        setError(t.genericError);
      });
  }, [router, t.genericError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError(t.passwordsDoNotMatch);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 1500);
      } else {
        const errorMap: Record<string, string> = {
          "Admin already exists": t.setupErrorExists,
          "Missing fields": t.setupErrorMissingFields,
          "Password must be at least 8 characters": t.setupShortPassword,
          "Username already exists": t.setupErrorUsernameExists,
        };
        setError(errorMap[data.error] || t.genericError);
      }
    } catch {
      setError(t.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="animate-pulse text-slate-400">{t.layoutCheckingCredentials}</div>
      </div>
    );
  }

  const isRtl = language === "ar";

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 bg-slate-50 ${isRtl ? "font-cairo" : ""}`} dir={isRtl ? "rtl" : "ltr"}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-900/10">
            <Package size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{t.setupTitle}</h1>
          <p className="text-slate-500 text-sm">{t.setupDesc}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-100 text-green-600 text-sm rounded-lg text-center">
              {t.setupSuccess}
            </div>
          )}

          <Input
            label={t.username}
            placeholder={t.usernamePlaceholder}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 block">{t.password}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 block">{t.confirmPassword}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all pr-10"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-11" isLoading={isLoading} disabled={success}>
            {t.setup}
          </Button>
        </form>
      </div>
    </div>
  );
}
