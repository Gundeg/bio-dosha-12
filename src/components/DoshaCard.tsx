import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DOSHA_MAP, DoshaKey } from "@/lib/ktMapping";

interface DoshaCardProps {
  doshaKey: DoshaKey;
  kt: number;
}

const doshaColors: Record<string, string> = {
  Khii: "bg-blue-50 border-blue-200",
  Khii_Shar: "bg-sky-50 border-sky-200",
  Khii_Badgan: "bg-cyan-50 border-cyan-200",
  Shar_Khii: "bg-orange-50 border-orange-200",
  Shar: "bg-amber-50 border-amber-200",
  Tentsveertei: "bg-green-50 border-green-200",
  Shar_Badgan: "bg-yellow-50 border-yellow-200",
  Badgan_Khii: "bg-slate-50 border-slate-200",
  Badgan_Shar: "bg-stone-50 border-stone-200",
  Badgan: "bg-purple-50 border-purple-200",
};

export default function DoshaCard({ doshaKey, kt }: DoshaCardProps) {
  const dosha = DOSHA_MAP[doshaKey];
  if (!dosha) return null;

  const colorClass = doshaColors[doshaKey] ?? "bg-gray-50 border-gray-200";

  return (
    <Card className={`border-2 ${colorClass}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl">{dosha.label}</span>
          <span className="text-sm text-muted-foreground">{dosha.labelEn}</span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">Kt коэффициент: {kt}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{dosha.description}</p>
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">Шинж чанарууд:</p>
          <div className="flex flex-wrap gap-1">
            {dosha.qualities.map((q) => (
              <Badge key={q} variant="secondary" className="text-xs">{q}</Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">Эрсдэлт хүчин зүйл:</p>
          <div className="flex flex-wrap gap-1">
            {dosha.risks.map((r) => (
              <Badge key={r} variant="destructive" className="text-xs">{r}</Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
