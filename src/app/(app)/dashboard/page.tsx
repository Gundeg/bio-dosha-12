"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import BEDIGauge from "@/components/BEDIGauge";
import DoshaCard from "@/components/DoshaCard";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DoshaKey } from "@/lib/ktMapping";

interface Profile {
  id: string;
  name: string;
  relationship: string;
  doshaType: string | null;
  ktScore: number | null;
  bediRecords: Array<{
    id: string;
    date: string;
    bedi: number;
    deviation: number;
    status: string;
    weightKg: number;
    season: string;
  }>;
}

const SEASON_LABELS: Record<string, string> = {
  WINTER: "Өвөл", SPRING: "Хавар", SUMMER: "Зун", AUTUMN: "Намар",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profiles")
      .then((r) => r.json())
      .then((data) => {
        setProfiles(data);
        const self = data.find((p: Profile) => p.relationship === "self") ?? data[0];
        setSelected(self ?? null);
        setLoading(false);
      });
  }, []);

  const latest = selected?.bediRecords?.[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Ачааллаж байна...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Сайн байна уу, {session?.user?.name}!</h1>
          <p className="text-muted-foreground text-sm">Bio-Dosha-12 хяналтын самбар</p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/calculator">Шинэ тооцоолол</ButtonLink>
          {!selected?.doshaType && (
            <ButtonLink variant="outline" href="/assessment">Үнэлгээ өгөх</ButtonLink>
          )}
        </div>
      </div>

      {profiles.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <p className="text-lg text-muted-foreground">Профайл үүсгэгдээгүй байна.</p>
            <ButtonLink href="/assessment">Үнэлгээ эхлүүлэх</ButtonLink>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Profile selector */}
          {profiles.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selected?.id === p.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* BEDI Gauge */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">BEDI Индекс</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {latest ? (
                  <>
                    <BEDIGauge deviation={latest.deviation} size={220} />
                    <div className="mt-4 grid grid-cols-2 gap-4 w-full text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">BEDI</p>
                        <p className="text-xl font-bold">{latest.bedi.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Улирал</p>
                        <p className="text-xl font-bold">{SEASON_LABELS[latest.season]}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Жин</p>
                        <p className="text-xl font-bold">{latest.weightKg} кг</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Огноо</p>
                        <p className="text-sm font-medium">
                          {new Date(latest.date).toLocaleDateString("mn-MN")}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center space-y-3">
                    <p className="text-muted-foreground text-sm">Тооцоолол хийгдэж байна...</p>
                    <ButtonLink size="sm" href="/calculator">Тооцоолол хийх</ButtonLink>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dosha info */}
            <div className="lg:col-span-2 space-y-4">
              {selected?.doshaType ? (
                <DoshaCard
                  doshaKey={selected.doshaType as DoshaKey}
                  kt={selected.ktScore ?? 1.0}
                />
              ) : (
                <Card>
                  <CardContent className="py-8 text-center space-y-3">
                    <p className="text-muted-foreground">
                      Махбодийн үнэлгээ хийгдээгүй байна.
                    </p>
                    <ButtonLink href="/assessment">12 асуултын үнэлгээ өгөх</ButtonLink>
                  </CardContent>
                </Card>
              )}

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="py-4 text-center">
                    <p className="text-xs text-muted-foreground">Нийт тооцоолол</p>
                    <p className="text-2xl font-bold">{selected?.bediRecords?.length ?? 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4 text-center">
                    <p className="text-xs text-muted-foreground">Гэр бүлийн гишүүд</p>
                    <p className="text-2xl font-bold">
                      {profiles.filter((p) => p.relationship !== "self").length}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4 text-center">
                    <p className="text-xs text-muted-foreground">Төлөв</p>
                    <Badge
                      variant={latest?.status === "balanced" ? "default" : "destructive"}
                      className="mt-1"
                    >
                      {latest?.status === "balanced"
                        ? "Тэнцвэртэй"
                        : latest?.status === "khii_excess"
                        ? "Хий"
                        : latest
                        ? "Шар/Бадган"
                        : "—"}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
