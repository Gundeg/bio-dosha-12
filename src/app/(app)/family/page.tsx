"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
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
  self: "Өөрийнхөө",
  spouse: "Эхнэр/Нөхөр",
  child: "Хүүхэд",
  parent: "Эцэг эх",
  other: "Бусад",
};

const DOSHA_DOT: Record<string, string> = {
  Khii: "bg-primary",
  Khii_Shar: "bg-primary",
  Khii_Badgan: "bg-primary",
  Shar_Khii: "bg-secondary-container",
  Shar: "bg-secondary-container",
  Tentsveertei: "bg-primary",
  Shar_Badgan: "bg-secondary-container",
  Badgan_Khii: "bg-tertiary-container",
  Badgan_Shar: "bg-tertiary-container",
  Badgan: "bg-tertiary-container",
};

// Avatar color based on relationship
const AVATAR_GRADIENT: Record<string, string> = {
  self:   "from-primary to-primary-container",
  spouse: "from-secondary to-secondary-container",
  child:  "from-tertiary to-tertiary-container",
  parent: "from-primary-container to-tertiary",
  other:  "from-surface-container-high to-surface-container-highest",
};

const STATUS_DISPLAY: Record<string, { label: string; bg: string; text: string }> = {
  balanced:           { label: "Тэнцвэртэй",          bg: "bg-primary/10",   text: "text-primary"   },
  khii_excess:        { label: "Хий арвидсан",         bg: "bg-primary/10",   text: "text-primary"   },
  shar_badgan_excess: { label: "Шар/Бадган арвидсан",  bg: "bg-secondary/10", text: "text-secondary" },
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-on-surface-variant">Ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-1">
            BEDI протокол · Гэр бүл
          </p>
          <h1 className="font-headline text-3xl font-black text-on-surface tracking-tight">
            Гэр бүлийн Хяналт
          </h1>
          <p className="text-on-surface-variant text-sm mt-0.5">
            {profiles.length} гишүүний BEDI индекс хяналтад байна
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="shrink-0">
          <span className="material-symbols-outlined text-[18px] mr-1.5">person_add</span>
          Гишүүн нэмэх
        </Button>
      </div>

      {/* ── Profile grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((p) => {
          const latest = p.bediRecords?.[0];
          const dosha = p.doshaType ? DOSHA_MAP[p.doshaType as DoshaKey] : null;
          const status = latest ? STATUS_DISPLAY[latest.status] : null;
          const avatarGrad = AVATAR_GRADIENT[p.relationship] ?? AVATAR_GRADIENT.other;
          const initial = p.name[0]?.toUpperCase() ?? "?";
          const age = calcAge(p.birthDate);

          return (
            <div key={p.id} className="bg-surface-container-lowest rounded-3xl shadow-ambient overflow-hidden group hover:shadow-xl transition-shadow duration-200">

              {/* Card header */}
              <div className="bg-surface-container-low px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl bg-linear-to-br ${avatarGrad} flex items-center justify-center text-on-primary text-base font-bold shrink-0`}>
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-headline font-bold text-on-surface text-base truncate">{p.name}</p>
                      {p.relationship === "self" && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-primary/10 text-primary rounded-full shrink-0">ӨӨРИЙНХ</span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {RELATIONSHIP_LABELS[p.relationship] ?? p.relationship}
                      <span className="mx-1.5 text-outline-variant">·</span>
                      {age} нас
                      <span className="mx-1.5 text-outline-variant">·</span>
                      {p.sex === "MALE" ? "Эр" : "Эм"} {p.heightCm} см
                    </p>
                  </div>
                  {status && (
                    <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Card body */}
              <div className="px-5 py-4 space-y-3">

                {/* Dosha */}
                {dosha ? (
                  <div className="flex items-center gap-2.5 bg-surface-container-low rounded-xl px-3 py-2.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${p.doshaType ? (DOSHA_DOT[p.doshaType] ?? "bg-primary") : "bg-primary"}`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-on-surface">{dosha.label}</span>
                      <span className="text-on-surface-variant text-xs ml-2">({dosha.labelEn})</span>
                    </div>
                    <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                      Kt {p.ktScore?.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 bg-surface-container-high rounded-xl px-3 py-2.5">
                    <span className="w-2 h-2 rounded-full bg-outline-variant shrink-0" />
                    <span className="text-xs text-on-surface-variant">Үнэлгээ хийгдээгүй байна</span>
                  </div>
                )}

                {/* Latest BEDI deviation */}
                {latest && (
                  <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-3 py-2.5">
                    <span className="text-xs text-on-surface-variant">Сүүлийн хазайлт</span>
                    <span className={`font-headline text-base font-bold ${
                      latest.deviation < -0.3 ? "text-primary"
                      : latest.deviation > 0.3 ? "text-secondary"
                      : "text-primary"
                    }`}>
                      {latest.deviation >= 0 ? "+" : ""}{latest.deviation.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <ButtonLink size="sm" variant="outline" className="flex-1" href={`/calculator?profile=${p.id}`}>
                    Тооцоолох
                  </ButtonLink>
                  {!p.doshaType && (
                    <ButtonLink size="sm" variant="outline" className="flex-1" href="/calculator?tab=assessment">
                      Үнэлгээ
                    </ButtonLink>
                  )}
                  {p.relationship !== "self" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-error hover:text-error hover:bg-error/5"
                      onClick={() => handleDelete(p.id)}
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add card shortcut */}
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="border-2 border-dashed border-outline-variant/40 rounded-3xl flex flex-col items-center justify-center py-14 gap-3 text-on-surface-variant hover:border-primary/40 hover:text-primary hover:bg-primary/3 transition-all duration-200 group"
        >
          <span className="material-symbols-outlined text-[32px] transition-transform group-hover:scale-110">add_circle</span>
          <p className="text-sm font-semibold">Гишүүн нэмэх</p>
        </button>
      </div>

      {/* ── Add member dialog ── */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline">Гэр бүлийн гишүүн нэмэх</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Нэр</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Гишүүний нэр"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Төрсөн огноо</Label>
              <Input
                type="date"
                required
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Хүйс</Label>
              <div className="grid grid-cols-2 gap-2">
                {[{ value: "MALE", label: "Эрэгтэй" }, { value: "FEMALE", label: "Эмэгтэй" }].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, sex: value })}
                    className={`rounded-xl p-2.5 text-sm font-medium transition-all ${
                      form.sex === value
                        ? "bg-primary/10 text-primary border-2 border-primary/20"
                        : "bg-surface-container-high text-on-surface-variant border-2 border-transparent"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Өндөр (см)</Label>
              <Input
                type="number"
                required
                value={form.heightCm}
                onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                placeholder="165"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Хамаарал</Label>
              <select
                aria-label="Хамаарал сонгох"
                className="w-full bg-surface-container-low rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none border border-outline-variant/20"
                value={form.relationship}
                onChange={(e) => setForm({ ...form, relationship: e.target.value })}
              >
                <option value="spouse">Эхнэр/Нөхөр</option>
                <option value="child">Хүүхэд</option>
                <option value="parent">Эцэг эх</option>
                <option value="other">Бусад</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
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
