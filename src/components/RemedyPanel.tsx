import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BEDIStatus } from "@/lib/bediEngine";
import { RemedyResult } from "@/lib/remedyEngine";

interface RemedyPanelProps {
  status: BEDIStatus;
  remedyResult: RemedyResult;
}

const statusColors: Record<BEDIStatus, { bg: string; border: string; title: string }> = {
  khii_excess: { bg: "bg-blue-50", border: "border-blue-300", title: "text-blue-700" },
  balanced: { bg: "bg-green-50", border: "border-green-300", title: "text-green-700" },
  shar_badgan_excess: { bg: "bg-red-50", border: "border-red-300", title: "text-red-700" },
};

export default function RemedyPanel({ status, remedyResult }: RemedyPanelProps) {
  const colors = statusColors[status];
  const { remedies, avoidFoods, riskFactors, ageNote } = remedyResult;

  return (
    <div className="space-y-4">
      <Card className={`border-2 ${colors.border} ${colors.bg}`}>
        <CardHeader className="pb-2">
          <CardTitle className={`text-base ${colors.title}`}>Алтан Ерөндөг (Эмчилгээ)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {remedies.map((r, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                {r}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-2 border-orange-200 bg-orange-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-orange-700">Хориглох идээн</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {avoidFoods.map((f, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-red-500 mt-0.5">✗</span>
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {riskFactors.length > 0 && (
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-yellow-700">Эрсдэлт хүчин зүйл</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {riskFactors.map((r, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">⚠</span>
                  {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-muted-foreground bg-slate-50 rounded-lg p-3 border">
        <span className="font-semibold">Насны зөвлөмж: </span>
        {ageNote}
      </div>
    </div>
  );
}
