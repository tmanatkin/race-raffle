"use client";

import { ReactNode } from "react";
import { BIB_NUMBER_CLASS_NAME, BibCard } from "@/components/bib-card";
import { Button } from "@/components/ui/button";
import { cn, formatPaddedNumber } from "@/lib/utils";

type BibCheckResultProps = {
  bibNumber: number;
  highestBibNumber: number;
  onCheckAnotherBibNumber: () => void;
  action?: ReactNode;
  isCheckAnotherDisabled?: boolean;
  error?: string;
};

export function BibCheckResult({
  bibNumber,
  highestBibNumber,
  onCheckAnotherBibNumber,
  action,
  isCheckAnotherDisabled = false,
  error,
}: BibCheckResultProps) {
  return (
    <div className="w-full space-y-4">
      <BibCard error={error}>
        <p className="text-center text-sm leading-none font-bold tracking-widest uppercase">Bib number</p>
        <p className={BIB_NUMBER_CLASS_NAME}>{formatPaddedNumber(bibNumber, highestBibNumber)}</p>
      </BibCard>
      <div className={cn("grid gap-3", action ? "grid-cols-2" : "grid-cols-1")}>
        <Button
          className="h-14 w-full rounded-xl text-base leading-tight font-bold whitespace-normal"
          disabled={isCheckAnotherDisabled}
          onClick={onCheckAnotherBibNumber}
          type="button"
          variant="outline"
        >
          Check a bib
        </Button>
        {action}
      </div>
    </div>
  );
}
