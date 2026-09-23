"use client";

import { ReactNode } from "react";
import { BIB_NUMBER_CLASS_NAME, BibCard } from "@/components/bib-card";
import { Button } from "@/components/ui/button";
import { cn, formatPaddedNumber } from "@/lib/utils";

type BibCheckResultProps = {
  bibNumber: number;
  highestBibNumber: number;
  onCheckAnotherBibNumber: () => void;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  isCheckAnotherDisabled?: boolean;
  error?: string;
};

export function BibCheckResult({
  bibNumber,
  highestBibNumber,
  onCheckAnotherBibNumber,
  primaryAction,
  secondaryAction,
  isCheckAnotherDisabled = false,
  error,
}: BibCheckResultProps) {
  return (
    <div className="w-full space-y-4">
      <BibCard>
        <p className="text-center text-sm leading-none font-bold tracking-widest uppercase">Bib number</p>
        <p className={BIB_NUMBER_CLASS_NAME}>{formatPaddedNumber(bibNumber, highestBibNumber)}</p>
      </BibCard>
      {primaryAction}
      <Button
        className={cn("w-full rounded-xl font-bold", primaryAction ? "h-12 text-base" : "h-14 text-lg")}
        disabled={isCheckAnotherDisabled}
        onClick={onCheckAnotherBibNumber}
        type="button"
        variant={primaryAction ? "outline" : "default"}
      >
        Check another bib
      </Button>
      {secondaryAction}
      {error ? (
        <p
          role="alert"
          className="rounded-xl border-2 border-destructive bg-destructive/10 px-4 py-3 text-center text-lg leading-tight font-semibold text-balance text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
