"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", { ...form, redirect: false });
    setLoading(false);
    if (res?.error) {
      toast.error("Имэйл эсвэл нууц үг буруу байна.");
    } else {
      window.location.href = "/dashboard";
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-violet-600 items-center justify-center mb-4">
            <span className="text-white text-lg font-black">BD</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Нэвтрэх</h1>
          <p className="text-sm text-slate-500 mt-1">Bio-Dosha-12 системд нэвтрэх</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="border-slate-200 h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11 font-semibold mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Нэвтэрч байна...
                </span>
              ) : "Нэвтрэх"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Бүртгэл байхгүй юу?{" "}
          <Link href="/register" className="text-blue-600 font-semibold hover:underline">
            Бүртгүүлэх
          </Link>
        </p>
      </div>
    </div>
  );
}
