"use client";

import { Button } from "@/components/ui/button";
import { formatPaddedNumber } from "@/lib/utils";

type PrizeResultProps = {
  bibNumber: number;
  highestBibNumber: number;
  prizeType: "prize" | null;
  onCheckAnotherBibNumber: () => void;
};

export function PrizeResult({ bibNumber, highestBibNumber, prizeType, onCheckAnotherBibNumber }: PrizeResultProps) {
  return (
    <div className="w-full max-w-sm space-y-4">
      <p className="text-lg">
        Racer <span className="font-mono">{formatPaddedNumber(bibNumber, highestBibNumber)}</span>
      </p>
      <p className="text-lg font-semibold">
        {prizeType === "prize" ? "You won! Visit the volunteer table to redeem your prize." : "Sorry! Not this time."}
      </p>
      <Button onClick={onCheckAnotherBibNumber} type="button" variant="outline">
        Check another bib number
      </Button>
    </div>
  );
}
