"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { useAuthStore } from "@/store/useAuthStore";
import { useLanguage } from "@/lib/translations";

export default function LoginPage() {
  const { t, language } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        router.push("/dashboard");
      } else {
        setError(data.error || t.loginError);
      }
    } catch (err) {
      setError(t.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  const isRtl = language === "ar";

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 bg-slate-50 ${isRtl ? "font-cairo" : ""}`}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{t.login}</h1>
          <p className="text-slate-500 text-sm">{t.welcomeBack}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg text-center">
              {error}
            </div>
          )}

          <Input
            label={t.username}
            placeholder={isRtl ? "أدخل اسم المستخدم" : "Enter username"}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <Input
            label={t.password}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" className="w-full h-11" isLoading={isLoading}>
            {t.login}
          </Button>
        </form>
      </div>
    </div>
  );
}
