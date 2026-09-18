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
};

export function BibNumberForm({
  bibNumber,
  onBibNumberChange,
  onSubmit,
  isLoading,
  isSubmitting,
  error,
}: BibNumberFormProps) {
  return (
    <form className="w-full max-w-sm space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="race-bib-number">Enter your bib number</Label>
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
        {isSubmitting ? "Checking..." : "Submit"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
