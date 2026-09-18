"use client";

import { Button } from "@/components/ui/button";

type RedeemedConfirmationProps = {
  bibNumber: number;
  onCheckAnotherBibNumber: () => void;
};

export function RedeemedConfirmation({ bibNumber, onCheckAnotherBibNumber }: RedeemedConfirmationProps) {
  return (
    <div className="w-full max-w-sm space-y-4">
      <p className="text-lg">Racer #{bibNumber}</p>
      <p className="text-lg font-semibold">Prize Redeemed!</p>
      <Button onClick={onCheckAnotherBibNumber} type="button" variant="outline">
        Check another bib number
      </Button>
    </div>
  );
}
