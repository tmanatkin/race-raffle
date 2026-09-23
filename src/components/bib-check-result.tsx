"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { formatPaddedNumber } from "@/lib/utils";

type BibCheckResultProps = {
  bibNumber: number;
  highestBibNumber: number;
  onCheckAnotherBibNumber: () => void;
  title?: string;
  prizeNumber?: number | null;
  totalPrizes?: number;
  actions?: ReactNode;
  isCheckAnotherDisabled?: boolean;
  error?: string;
};

export function BibCheckResult({
  bibNumber,
  highestBibNumber,
  onCheckAnotherBibNumber,
  title,
  prizeNumber,
  totalPrizes,
  actions,
  isCheckAnotherDisabled = false,
  error,
}: BibCheckResultProps) {
  return (
    <div className="w-full max-w-sm space-y-4">
      <p className="text-lg">
        Bib #<span className="font-mono">{formatPaddedNumber(bibNumber, highestBibNumber)}</span>
      </p>
      <p className="text-lg font-semibold">{title}</p>
      {prizeNumber != null && totalPrizes != null ? (
        <p className="text-lg">
          Prize #<span className="font-mono">{formatPaddedNumber(prizeNumber, totalPrizes)}</span>
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        {actions}
        <Button disabled={isCheckAnotherDisabled} onClick={onCheckAnotherBibNumber} type="button" variant="outline">
          Check another bib number
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
