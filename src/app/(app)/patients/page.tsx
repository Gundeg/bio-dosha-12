"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DOSHA_MAP, DoshaKey } from "@/lib/ktMapping";
import { calcAge } from "@/lib/bediEngine";
import { toast } from "sonner";

interface Patient {
  id: string;
  addedAt: string;
  clinicalNotes: string | null;
  profile: {
    id: string;
    name: string;
    birthDate: string;
    sex: "MALE" | "FEMALE";
    heightCm: number;
    doshaType: string | null;
    ktScore: number | null;
    bediRecords: Array<{ deviation: number; status: string; date: string }>;
  };
}

const STATUS_CONFIG = {
  khii_excess: { label: "Хий арвидсан", variant: "secondary" as const },
  balanced: { label: "Тэнцвэртэй", variant: "default" as const },
  shar_badgan_excess: { label: "Шар/Бадган", variant: "destructive" as const },
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "", birthDate: "", sex: "MALE", heightCm: "", relationship: "patient",
  });
  const [submitting, setSubmitting] = useState(false);

  async function loadPatients() {
    const res = await fetch("/api/patients");
    const data = await res.json();
    setPatients(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { loadPatients(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/patients", {
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
      toast.success("Өвчтөн нэмэгдлээ!");
      setShowAdd(false);
      setForm({ name: "", birthDate: "", sex: "MALE", heightCm: "", relationship: "patient" });
      await loadPatients();
    } catch {
      toast.error("Нэмэх явцад алдаа гарлаа.");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = patients.filter((p) =>
    p.profile.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="text-center py-12 text-muted-foreground">Ачааллаж байна...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Өвчтөнүүд</h1>
          <p className="text-muted-foreground text-sm">Нийт {patients.length} өвчтөн</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>+ Өвчтөн нэмэх</Button>
      </div>

      <Input
        placeholder="Нэрээр хайх..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const latest = p.profile.bediRecords?.[0];
          const dosha = p.profile.doshaType ? DOSHA_MAP[p.profile.doshaType as DoshaKey] : null;
          const sc = latest ? STATUS_CONFIG[latest.status as keyof typeof STATUS_CONFIG] : null;

          return (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{p.profile.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {calcAge(p.profile.birthDate)} нас •{" "}
                      {p.profile.sex === "MALE" ? "Эрэгтэй" : "Эмэгтэй"}
                    </p>
                  </div>
                  {sc && <Badge variant={sc.variant} className="text-xs">{sc.label}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {dosha ? (
                  <div className="bg-slate-50 rounded-lg p-2 text-sm">
                    <span className="text-muted-foreground">Махбод: </span>
                    <span className="font-medium">{dosha.label}</span>
                    <span className="text-muted-foreground"> Kt={p.profile.ktScore}</span>
                  </div>
                ) : (
                  <div className="bg-yellow-50 rounded-lg p-2 text-sm text-yellow-700">
                    Үнэлгээ хийгдээгүй
                  </div>
                )}

                {latest && (
                  <div className="text-sm flex justify-between">
                    <span className="text-muted-foreground">Сүүлийн Δ:</span>
                    <span className={`font-semibold ${
                      latest.deviation < -0.3 ? "text-blue-500"
                      : latest.deviation > 0.3 ? "text-red-500"
                      : "text-green-500"
                    }`}>
                      {latest.deviation >= 0 ? "+" : ""}{latest.deviation.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  <ButtonLink size="sm" variant="outline" className="flex-1" href={`/calculator?profile=${p.profile.id}`}>Тооцоолох</ButtonLink>
                  <ButtonLink size="sm" variant="outline" className="flex-1" href={`/reports?patient=${p.profile.id}`}>Тайлан</ButtonLink>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Өвчтөн олдсонгүй.
          </div>
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Шинэ өвчтөн нэмэх</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1">
              <Label>Нэр</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Өвчтөний нэр"
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
                {[{ value: "MALE", label: "Эрэгтэй" }, { value: "FEMALE", label: "Эмэгтэй" }].map(({ value, label }) => (
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
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Өндөр (см)</Label>
              <Input
                type="number"
                required
                value={form.heightCm}
                onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                placeholder="170"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Болих</Button>
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
