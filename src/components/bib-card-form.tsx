"use client";

import { SubmitEvent } from "react";
import { BIB_NUMBER_CLASS_NAME, BibCard } from "@/components/bib-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatPaddedNumber } from "@/lib/utils";

type BibCardFormProps = {
  bibNumber: number | "";
  highestBibNumber: number;
  onBibNumberChange: (bibNumber: number | "") => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  error: string;
  autoFocus?: boolean;
};

export function BibCardForm({
  bibNumber,
  highestBibNumber,
  onBibNumberChange,
  onSubmit,
  isSubmitting,
  error,
  autoFocus = false,
}: BibCardFormProps) {
  return (
    <form className="w-full space-y-4" onSubmit={onSubmit}>
      <BibCard>
        <Label htmlFor="race-bib-number" className="text-center font-bold tracking-widest uppercase">
          Bib number
        </Label>
        <Input
          id="race-bib-number"
          autoComplete="off"
          autoFocus={autoFocus}
          inputMode="numeric"
          min="0"
          name="raceBibNumber"
          onChange={(event) => onBibNumberChange(event.target.value === "" ? "" : Number(event.target.value))}
          placeholder={formatPaddedNumber(0, highestBibNumber)}
          step="1"
          type="number"
          value={bibNumber}
          disabled={isSubmitting}
          className={cn(
            BIB_NUMBER_CLASS_NAME,
            "h-auto rounded-none border-0 p-0 text-center [appearance:textfield] placeholder:text-muted-foreground/40 focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          )}
        />
      </BibCard>
      <Button className="h-14 w-full rounded-xl text-lg font-bold" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Submitting..." : "Submit"}
      </Button>
      {error ? (
        <p
          role="alert"
          className="rounded-xl border-2 border-destructive bg-destructive/10 px-4 py-3 text-center text-lg leading-tight font-semibold text-balance text-destructive"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
