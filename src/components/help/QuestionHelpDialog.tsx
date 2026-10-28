"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
import { DOSHA_BG, DOSHA_COLOR } from "@/lib/doshaUi";
import { DominantType, Question } from "@/lib/questionnaireEngine";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/** Махбодын үсэг бүхий дугуй тэмдэг (Х/Ш/Б өнгөний код). */
function DoshaMark({ value, letter, className }: { value: DominantType; letter: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-inset ring-current/20",
        DOSHA_BG[value],
        DOSHA_COLOR[value],
        className
      )}
    >
      {letter}
    </span>
  );
}

/**
 * Асуултын карт дээрх "Хэрхэн тодорхойлох вэ?" товч + сорилын тусламжийн цонх.
 * Өргөн дэлгэцэнд гурван хариултыг зэрэгцүүлж (3 панел), нарийн дэлгэцэнд нэг
 * хөдөлгөөнт зураг эргэлдэж, хариулт дээр дарвал царцана.
 */
export function QuestionHelpButton({ question }: { question: Question }) {
  const t = useTranslations("help.dialog");
  const tHelp = useTranslations("questionHelp");
  const tShared = useTranslations("shared");
  const [variant, setVariant] = useState<DominantType | undefined>(undefined);

  if (!QUESTION_HELP[question.id]) return null;
  const qKey = `q${question.id}`;

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) setVariant(undefined);
      }}
    >
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="mt-2 -ml-2.5 text-primary hover:text-primary" />
        }
      >
        <Icon name="help" className="size-4" />
        {t("trigger")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-8">{tHelp(`${qKey}.title`)}</DialogTitle>
          <DialogDescription>{tHelp(`${qKey}.instruction`)}</DialogDescription>
        </DialogHeader>

        {/* Өргөн дэлгэц: 3 хариултыг зэрэгцүүлсэн харьцуулалт */}
        <div className="hidden gap-3 sm:grid sm:grid-cols-3">
          {question.options.map((opt) => {
            const doshaName = tShared(`dosha3.${opt.value}`);
            return (
              <div
                key={opt.value}
                className="flex flex-col gap-2.5 rounded-xl p-2.5 ring-1 ring-inset ring-outline-variant"
              >
                <div className="overflow-hidden rounded-lg bg-surface-container-low">
                  <HelpIllustration
                    questionId={question.id}
                    variant={opt.value}
                    className="h-auto w-full text-on-surface"
                  />
                </div>
                <div className="flex items-start gap-2">
                  <DoshaMark value={opt.value} letter={doshaName.charAt(0)} className="size-6 text-xs" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight text-on-surface">
                      <span className="sr-only">{doshaName}: </span>
                      {tHelp(`${qKey}.outcomes.${opt.value}.label`)}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                      {tHelp(`${qKey}.outcomes.${opt.value}.description`)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Нарийн дэлгэц: нэг эргэлдэх зураг + дарж царцаах мөрүүд */}
        <div className="space-y-3 sm:hidden">
          <div className="rounded-lg bg-surface-container-low p-2">
            <HelpIllustration
              questionId={question.id}
              variant={variant}
              className="h-auto w-full text-on-surface"
            />
          </div>

          <div className="flex min-h-8 items-center justify-between gap-2">
            <p className="text-xs text-on-surface-variant">{t("hint")}</p>
            {variant && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVariant(undefined)}
                className="-mr-2 shrink-0 text-primary hover:text-primary"
              >
                <Icon name="play" className="size-4" />
                {t("auto")}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {question.options.map((opt) => {
              const selected = variant === opt.value;
              const doshaName = tShared(`dosha3.${opt.value}`);
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    setVariant((v) => (v === opt.value ? undefined : opt.value))
                  }
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg p-3 text-left ring-1 ring-inset transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    selected
                      ? "bg-primary/8 ring-primary/30"
                      : "bg-surface-container-lowest ring-outline-variant hover:bg-surface-container-low"
                  )}
                >
                  <DoshaMark value={opt.value} letter={doshaName.charAt(0)} className="size-8 text-xs" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-on-surface">
                      <span className="sr-only">{doshaName}: </span>
                      {tHelp(`${qKey}.outcomes.${opt.value}.label`)}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-on-surface-variant">
                      {tHelp(`${qKey}.outcomes.${opt.value}.description`)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
