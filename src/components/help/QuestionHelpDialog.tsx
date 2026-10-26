"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpIllustration } from "@/components/help/illustrations";
import { QUESTION_HELP } from "@/lib/questionHelp";
import { DOSHA_COLOR, DOSHA_LETTER } from "@/lib/doshaUi";
import { DominantType, Question } from "@/lib/questionnaireEngine";

/** Панелийн дэвсгэр — махбодын туяа (Х/Ш/Б өнгөний код). */
const PANEL_BG: Record<DominantType, string> = {
  H: "bg-primary/8",
  S: "bg-secondary-container/15",
  B: "bg-tertiary/10",
};

/**
 * Асуултын карт дээрх "Хэрхэн тодорхойлох вэ?" товч + сорилын тусламжийн цонх.
 * Өргөн дэлгэцэнд гурван хариултыг зэрэгцүүлж (3 панел), нарийн дэлгэцэнд нэг
 * хөдөлгөөнт зураг эргэлдэж, хариулт дээр дарвал царцана.
 */
export function QuestionHelpButton({ question }: { question: Question }) {
  const help = QUESTION_HELP[question.id];
  const [variant, setVariant] = useState<DominantType | undefined>(undefined);

  if (!help) return null;

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) setVariant(undefined);
      }}
    >
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="mt-2 -ml-2.5 text-primary" />
        }
      >
        <span className="material-symbols-outlined text-[16px]">help</span>
        Хэрхэн тодорхойлох вэ?
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-8">{help.title}</DialogTitle>
          <DialogDescription>{help.instruction}</DialogDescription>
        </DialogHeader>

        {/* Өргөн дэлгэц: 3 хариултыг зэрэгцүүлсэн харьцуулалт */}
        <div className="hidden sm:grid sm:grid-cols-3 gap-2.5">
          {question.options.map((opt) => {
            const outcome = help.outcomes[opt.value];
            return (
              <div
                key={opt.value}
                className={`rounded-2xl p-2.5 flex flex-col gap-2 ${PANEL_BG[opt.value]}`}
              >
                <div className="rounded-xl overflow-hidden bg-surface-container-lowest/40">
                  <HelpIllustration
                    questionId={question.id}
                    variant={opt.value}
                    className="w-full h-auto text-on-surface"
                  />
                </div>
                <div className="flex items-start gap-2">
                  <div
                    className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] bg-surface-container-lowest ${DOSHA_COLOR[opt.value]}`}
                  >
                    {DOSHA_LETTER[opt.value]}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-bold text-xs leading-tight ${DOSHA_COLOR[opt.value]}`}>
                      {outcome.label}
                    </p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                      {outcome.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Нарийн дэлгэц: нэг эргэлдэх зураг + дарж царцаах мөрүүд */}
        <div className="sm:hidden space-y-3">
          <div className="rounded-2xl bg-surface-container-low p-2">
            <HelpIllustration
              questionId={question.id}
              variant={variant}
              className="w-full h-auto text-on-surface"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-on-surface-variant">
              Хариулт дээр дарж тухайн төлөвийг харна уу
            </p>
            {variant && (
              <button
                type="button"
                onClick={() => setVariant(undefined)}
                className="shrink-0 text-xs font-bold text-primary hover:underline"
              >
                ▶ Автомат
              </button>
            )}
          </div>

          <div className="space-y-2">
            {question.options.map((opt) => {
              const outcome = help.outcomes[opt.value];
              const selected = variant === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    setVariant((v) => (v === opt.value ? undefined : opt.value))
                  }
                  className={`w-full text-left rounded-2xl p-3 transition-all ${PANEL_BG[opt.value]} ${
                    selected ? "ring-2 ring-primary/40" : "hover:shadow-ambient"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs bg-surface-container-lowest ${DOSHA_COLOR[opt.value]}`}
                    >
                      {DOSHA_LETTER[opt.value]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${DOSHA_COLOR[opt.value]}`}>
                        {outcome.label}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                        {outcome.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
