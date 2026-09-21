"use client";

import { Button } from "@/components/ui/button";
import { formatPaddedNumber } from "@/lib/utils";

type BibCheckResultProps = {
  bibNumber: number;
  highestBibNumber: number;
  onCheckAnotherBibNumber: () => void;
  title?: string;
  prizeNumber?: number | null;
  totalPrizes?: number;
};

export function BibCheckResult({
  bibNumber,
  highestBibNumber,
  onCheckAnotherBibNumber,
  title,
  prizeNumber,
  totalPrizes,
}: BibCheckResultProps) {
  return (
    <div className="w-full max-w-sm space-y-4">
      <p className="text-lg">
        Racer <span className="font-mono">{formatPaddedNumber(bibNumber, highestBibNumber)}</span>
      </p>
      <p className="text-lg font-semibold">{title}</p>
      {prizeNumber != null && totalPrizes != null ? (
        <p className="text-lg">
          Prize <span className="font-mono">{formatPaddedNumber(prizeNumber, totalPrizes)}</span>
        </p>
      ) : null}
      <Button onClick={onCheckAnotherBibNumber} type="button" variant="outline">
        Check another bib number
      </Button>
    </div>
  );
}
