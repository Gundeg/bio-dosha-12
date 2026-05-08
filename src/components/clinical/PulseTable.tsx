"use client";

import { Input } from "@/components/ui/input";
import {
  PULSE_ROW_KEYS,
  PULSE_ROW_LABELS,
  type PulseColKey,
  type PulseRowKey,
} from "@/lib/clinicalConstants";
import type { PulseTable as PulseTableValue } from "@/lib/apiSchemas";

interface PulseTableProps {
  value: PulseTableValue;
  onChange: (next: PulseTableValue) => void;
  disabled?: boolean;
}

export function PulseTable({ value, onChange, disabled }: PulseTableProps) {
  function update(row: PulseRowKey, col: PulseColKey, next: string) {
    onChange({
      ...value,
      [row]: { ...value[row], [col]: next },
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-input">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted text-muted-foreground">
            <th className="w-24 px-3 py-2 text-left font-medium" rowSpan={2}>
              Хуруу
            </th>
            <th className="px-3 py-2 text-center font-medium" colSpan={2}>
              Эмчлүүлэгчийн баруун гар
            </th>
            <th className="px-3 py-2 text-center font-medium" colSpan={2}>
              Эмчлүүлэгчийн зүүн гар
            </th>
          </tr>
          <tr className="bg-muted/50 text-muted-foreground">
            <th className="px-3 py-2 text-center font-normal">Дээр</th>
            <th className="px-3 py-2 text-center font-normal">Доор</th>
            <th className="px-3 py-2 text-center font-normal">Дээр</th>
            <th className="px-3 py-2 text-center font-normal">Доор</th>
          </tr>
        </thead>
        <tbody>
          {PULSE_ROW_KEYS.map((row) => (
            <tr key={row} className="border-t border-input">
              <td className="px-3 py-2 font-medium">{PULSE_ROW_LABELS[row]}</td>
              {(["rightTop", "rightBottom", "leftTop", "leftBottom"] as const).map((col) => (
                <td key={col} className="px-2 py-1">
                  <Input
                    value={value[row][col] ?? ""}
                    onChange={(e) => update(row, col, e.target.value)}
                    disabled={disabled}
                    className="h-8 text-sm"
                    aria-label={`${PULSE_ROW_LABELS[row]} ${col}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
