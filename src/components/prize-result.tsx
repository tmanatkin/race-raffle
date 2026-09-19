"use client";

import { Button } from "@/components/ui/button";

type PrizeResultProps = {
  bibNumber: number;
  prizeType: "prize" | null;
  onCheckAnotherBibNumber: () => void;
};

export function PrizeResult({ bibNumber, prizeType, onCheckAnotherBibNumber }: PrizeResultProps) {
  return (
    <div className="w-full max-w-sm space-y-4">
      <p className="text-lg">Racer #{bibNumber}</p>
      <p className="text-lg font-semibold">
        {prizeType === "prize" ? "You won! Visit the volunteer table to redeem your prize." : "Sorry! Not this time."}
      </p>
      <Button onClick={onCheckAnotherBibNumber} type="button" variant="outline">
        Check another bib number
      </Button>
    </div>
  );
}
