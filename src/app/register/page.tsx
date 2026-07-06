"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations("auth.register");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [wantsPractitioner, setWantsPractitioner] = useState(false);

  const personas = [
    { value: false, label: t("individualLabel"), icon: "👤", desc: t("individualDesc") },
    { value: true, label: t("practitionerLabel"), icon: "🏥", desc: t("practitionerDesc") },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, wantsPractitioner }),
      });
      const text = await res.text();
      let data: { error?: string } = {};
      try { data = JSON.parse(text); } catch { /* non-JSON response */ }
      if (!res.ok) {
        console.error("[register] status:", res.status, "body:", text);
        toast.error(data.error ?? t("errorWithStatus", { status: res.status }));
        return;
      }

      // Бүртгэл амжилттай — шууд нэвтрүүлнэ (дахин нууц үг шивүүлэхгүй)
      const login = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (login?.error) {
        toast.success(t("successManualLogin"));
        router.push("/login");
        return;
      }
      toast.success(wantsPractitioner ? t("welcomePractitioner") : t("welcome"));
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("[register] fetch error:", err);
      toast.error(t("errorWithStatus", { status: 0 }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-violet-600 items-center justify-center mb-4">
            <span className="text-white text-lg font-black">BD</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">{t("title")}</h1>
          <p className="text-sm text-slate-500 mt-1">{t("subtitle")}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {t("name")}
              </Label>
              <Input
                id="name"
                required
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("namePlaceholder")}
                className="border-slate-200 h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {t("email")}
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
                className="border-slate-200 h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {t("password")}
              </Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={t("passwordPlaceholder")}
                className="border-slate-200 h-11"
              />
            </div>

            {/* Persona selector — эрх биш, зөвхөн хүсэлт */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {t("personaTitle")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {personas.map(({ value, label, icon, desc }) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={wantsPractitioner === value}
                    onClick={() => setWantsPractitioner(value)}
                    className={`flex flex-col items-start text-left gap-1 border rounded-xl p-3 transition-all text-sm ${
                      wantsPractitioner === value
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <span className="text-xl">{icon}</span>
                    <span className={`font-semibold ${wantsPractitioner === value ? "text-blue-700" : "text-slate-700"}`}>
                      {label}
                    </span>
                    <span className="text-xs text-slate-400 leading-tight">{desc}</span>
                  </button>
                ))}
              </div>
              {wantsPractitioner && (
                <p className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  {t("practitionerNote")}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full h-11 font-semibold mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {t("submitting")}
                </span>
              ) : t("submit")}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          {t("hasAccount")}{" "}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            {t("loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
