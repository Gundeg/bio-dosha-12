"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DOSHA_MAP, DoshaKey } from "@/lib/ktMapping";
import { calcAge } from "@/lib/bediEngine";
import { toast } from "sonner";

interface Profile {
  id: string;
  name: string;
  relationship: string;
  sex: "MALE" | "FEMALE";
  heightCm: number;
  birthDate: string;
  doshaType: string | null;
  ktScore: number | null;
  bediRecords: Array<{ deviation: number; status: string; date: string }>;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  self: "Өөрийн",
  spouse: "Эхнэр/Нөхөр",
  child: "Хүүхэд",
  parent: "Эцэг эх",
  other: "Бусад",
};

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "destructive" | "secondary" }> = {
  balanced: { label: "Тэнцвэртэй", variant: "default" },
  khii_excess: { label: "Хий арвидсан", variant: "secondary" },
  shar_badgan_excess: { label: "Шар/Бадган", variant: "destructive" },
};

export default function FamilyPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "", birthDate: "", sex: "MALE", heightCm: "", relationship: "spouse",
  });
  const [submitting, setSubmitting] = useState(false);

  async function loadProfiles() {
    try {
      const res = await fetch("/api/profiles");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setProfiles(data);
    } catch {
      // network error — leave current state
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProfiles(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          birthDate: form.birthDate,
          sex: form.sex,
          heightCm: parseFloat(form.heightCm),
          relationship: form.relationship,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Гэр бүлийн гишүүн нэмэгдлээ!");
      setShowAdd(false);
      setForm({ name: "", birthDate: "", sex: "MALE", heightCm: "", relationship: "spouse" });
      await loadProfiles();
    } catch {
      toast.error("Нэмэх явцад алдаа гарлаа.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Устгах уу?")) return;
    await fetch(`/api/profiles/${id}`, { method: "DELETE" });
    await loadProfiles();
    toast.success("Устгагдлаа.");
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Ачааллаж байна...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Гэр бүлийн Хяналт</h1>
          <p className="text-muted-foreground text-sm">Гэр бүлийн гишүүдийн BEDI индекс</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>+ Гишүүн нэмэх</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((p) => {
          const latest = p.bediRecords?.[0];
          const dosha = p.doshaType ? DOSHA_MAP[p.doshaType as DoshaKey] : null;
          const status = latest ? STATUS_LABELS[latest.status] : null;

          return (
            <Card key={p.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {RELATIONSHIP_LABELS[p.relationship] ?? p.relationship} •{" "}
                      {calcAge(p.birthDate)} нас
                    </p>
                  </div>
                  {status && (
                    <Badge variant={status.variant} className="text-xs">
                      {status.label}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Хүйс: </span>
                    {p.sex === "MALE" ? "Эрэгтэй" : "Эмэгтэй"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Өндөр: </span>
                    {p.heightCm} см
                  </div>
                </div>

                {dosha ? (
                  <div className="bg-slate-50 rounded-lg p-2 text-sm">
                    <span className="text-muted-foreground">Махбод: </span>
                    <span className="font-medium">{dosha.label}</span>
                    <span className="text-muted-foreground ml-2">Kt={p.ktScore}</span>
                  </div>
                ) : (
                  <div className="bg-yellow-50 rounded-lg p-2 text-sm text-yellow-700">
                    Үнэлгээ хийгдээгүй байна
                  </div>
                )}

                {latest && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Сүүлийн BEDI хазайлт: </span>
                    <span className={`font-semibold ${
                      latest.deviation < -0.3 ? "text-blue-500"
                      : latest.deviation > 0.3 ? "text-red-500"
                      : "text-green-500"
                    }`}>
                      {latest.deviation >= 0 ? "+" : ""}{latest.deviation.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <ButtonLink size="sm" variant="outline" className="flex-1" href={`/calculator?profile=${p.id}`}>Тооцоолох</ButtonLink>
                  {!p.doshaType && (
                    <ButtonLink size="sm" variant="outline" className="flex-1" href="/assessment">Үнэлгээ</ButtonLink>
                  )}
                  {p.relationship !== "self" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(p.id)}
                    >
                      Устгах
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Гэр бүлийн гишүүн нэмэх</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1">
              <Label>Нэр</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Гишүүний нэр"
              />
            </div>
            <div className="space-y-1">
              <Label>Төрсөн огноо</Label>
              <Input
                type="date"
                required
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Хүйс</Label>
              <div className="grid grid-cols-2 gap-2">
                {[{ value: "MALE", label: "Эрэгтэй" }, { value: "FEMALE", label: "Эмэгтэй" }].map(
                  ({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm({ ...form, sex: value })}
                      className={`border rounded-lg p-2 text-sm transition-colors ${
                        form.sex === value ? "border-primary bg-primary/5 font-semibold" : "border-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Өндөр (см)</Label>
              <Input
                type="number"
                required
                value={form.heightCm}
                onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                placeholder="165"
              />
            </div>
            <div className="space-y-1">
              <Label>Хамаарал</Label>
              <select
                aria-label="Хамаарал сонгох"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={form.relationship}
                onChange={(e) => setForm({ ...form, relationship: e.target.value })}
              >
                <option value="spouse">Эхнэр/Нөхөр</option>
                <option value="child">Хүүхэд</option>
                <option value="parent">Эцэг эх</option>
                <option value="other">Бусад</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>
                Болих
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? "Нэмж байна..." : "Нэмэх"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
