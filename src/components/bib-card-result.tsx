"use client";

import { BIB_NUMBER_CLASS_NAME, BibCard } from "@/components/bib-card";
import { Button } from "@/components/ui/button";

type BibCardResultProps = {
  bibNumber: number;
  onCheckAnotherBibNumber: () => void;
  isOnPrimaryBackground?: boolean;
};

export function BibCardResult({
  bibNumber,
  onCheckAnotherBibNumber,
  isOnPrimaryBackground = false,
}: BibCardResultProps) {
  return (
    <div className="w-full space-y-4">
      <BibCard isOnPrimaryBackground={isOnPrimaryBackground} error="">
        <p className="text-center text-sm leading-none font-bold tracking-widest uppercase">Bib number</p>
        <p className={BIB_NUMBER_CLASS_NAME}>{bibNumber}</p>
      </BibCard>
      <Button
        className="h-14 w-full rounded-xl text-lg font-bold"
        onClick={onCheckAnotherBibNumber}
        type="button"
        variant="outline"
      >
        Check another bib
      </Button>
    </div>
  );
}
