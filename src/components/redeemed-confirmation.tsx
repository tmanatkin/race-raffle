"use client";

import { Button } from "@/components/ui/button";

type RedeemedConfirmationProps = {
  bibNumber: number;
  onCheckAnotherBibNumber: () => void;
  title?: string;
};

export function RedeemedConfirmation({
  bibNumber,
  onCheckAnotherBibNumber,
  title = "Prize Redeemed!",
}: RedeemedConfirmationProps) {
  return (
    <div className="w-full max-w-sm space-y-4">
      <p className="text-lg">Racer #{bibNumber}</p>
      <p className="text-lg font-semibold">{title}</p>
      <Button onClick={onCheckAnotherBibNumber} type="button" variant="outline">
        Check another bib number
      </Button>
    </div>
  );
}
