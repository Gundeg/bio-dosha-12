"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ROLES = [
  { value: "INDIVIDUAL",   label: "Хувь хүн",   icon: "👤", desc: "Өөрийн болон гэр бүлийн BEDI" },
  { value: "PRACTITIONER", label: "Тб оточ",     icon: "🏥", desc: "Өвчтөн удирдах, тайлан гаргах" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "INDIVIDUAL" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Бүртгэл амжилтгүй боллоо.");
      setLoading(false);
      return;
    }
    const result = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    if (result?.error) {
      toast.error("Бүртгэл амжилттай боловч нэвтрэхэд алдаа гарлаа. Нэвтрэх хуудас руу орно уу.");
      setLoading(false);
      router.push("/login");
      return;
    }
    router.refresh();
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-violet-600 items-center justify-center mb-4">
            <span className="text-white text-lg font-black">BD</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Бүртгүүлэх</h1>
          <p className="text-sm text-slate-500 mt-1">Bio-Dosha-12 системд шинэ бүртгэл үүсгэх</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Нэр
              </Label>
              <Input
                id="name"
                required
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Таны нэр"
                className="border-slate-200 h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Имэйл
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
                Нууц үг
              </Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Хамгийн багадаа 6 тэмдэгт"
                className="border-slate-200 h-11"
              />
            </div>

            {/* Role selector */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Хэрэглэгчийн төрөл
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(({ value, label, icon, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, role: value })}
                    className={`flex flex-col items-start text-left gap-1 border rounded-xl p-3 transition-all text-sm ${
                      form.role === value
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <span className="text-xl">{icon}</span>
                    <span className={`font-semibold ${form.role === value ? "text-blue-700" : "text-slate-700"}`}>
                      {label}
                    </span>
                    <span className="text-xs text-slate-400 leading-tight">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full h-11 font-semibold mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Бүртгэж байна...
                </span>
              ) : "Бүртгүүлэх"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Бүртгэлтэй юу?{" "}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            Нэвтрэх
          </Link>
        </p>
      </div>
    </div>
  );
}
