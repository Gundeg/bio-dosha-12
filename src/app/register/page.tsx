"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "INDIVIDUAL",
  });

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
    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Бүртгүүлэх</CardTitle>
          <CardDescription>Bio-Dosha-12 системд шинэ бүртгэл үүсгэх</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Нэр</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Таны нэр"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Имэйл</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Нууц үг</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1">
              <Label>Хэрэглэгчийн төрөл</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "INDIVIDUAL", label: "Хувь хүн" },
                  { value: "PRACTITIONER", label: "Тб оточ" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, role: value })}
                    className={`border rounded-lg p-3 text-sm text-center transition-colors ${
                      form.role === value
                        ? "border-primary bg-primary/5 font-semibold"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Бүртгэж байна..." : "Бүртгүүлэх"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Бүртгэлтэй юу?{" "}
            <Link href="/login" className="text-primary underline">
              Нэвтрэх
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
