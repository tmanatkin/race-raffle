"use client";

import { Button } from "@/components/ui/button";

type PrizeResultProps = {
  prizeType: "prize" | null;
  isRedeeming: boolean;
  redeemError: string;
  onRedeem: () => void;
  onCheckAnotherBibNumber: () => void;
};

export function PrizeResult({
  prizeType,
  isRedeeming,
  redeemError,
  onRedeem,
  onCheckAnotherBibNumber,
}: PrizeResultProps) {
  return (
    <div className="w-full max-w-sm space-y-4">
      <p className="text-lg font-semibold">
        {prizeType === "prize" ? "You won! Redeem your prize at the table." : "Sorry! Not this time."}
      </p>
      {prizeType === "prize" ? (
        <div className="space-y-2">
          <Button disabled={isRedeeming} onClick={onRedeem} type="button">
            {isRedeeming ? "Redeeming..." : "Redeem"}
          </Button>
          {redeemError ? <p className="text-sm text-destructive">{redeemError}</p> : null}
        </div>
      ) : null}
      <Button onClick={onCheckAnotherBibNumber} type="button" variant="outline">
        Check another bib number
      </Button>
    </div>
  );
}
