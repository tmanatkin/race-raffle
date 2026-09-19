"use client";

import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BibNumberFormProps = {
  bibNumber: number | "";
  onBibNumberChange: (bibNumber: number | "") => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string;
  label?: string;
  submitLabel?: string;
  submittingLabel?: string;
};

export function BibNumberForm({
  bibNumber,
  onBibNumberChange,
  onSubmit,
  isLoading,
  isSubmitting,
  error,
  label = "Enter your bib number",
  submitLabel = "Submit",
  submittingLabel = "Checking...",
}: BibNumberFormProps) {
  return (
    <form className="w-full max-w-sm space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="race-bib-number">{label}</Label>
        <Input
          id="race-bib-number"
          min="0"
          name="raceBibNumber"
          onChange={(event) => onBibNumberChange(event.target.value === "" ? "" : Number(event.target.value))}
          placeholder={isLoading ? "-" : undefined}
          step="1"
          type="number"
          value={isLoading ? "" : bibNumber}
          disabled={isLoading || isSubmitting}
        />
      </div>
      <Button disabled={isLoading || isSubmitting} type="submit">
        {isSubmitting ? submittingLabel : submitLabel}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
