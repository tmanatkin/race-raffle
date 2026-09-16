"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Home() {
  const [bibNumber, setBibNumber] = useState<number | "">("");
  const [highestBibNumber, setHighestBibNumber] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadBibSettings() {
      try {
        const response = await fetch("/api/bib-claims");
        const result = (await response.json()) as { highestBibNumber?: number; error?: string };

        if (!response.ok || result.highestBibNumber === undefined) {
          throw new Error(result.error ?? "Unable to load bib number settings.");
        }

        setHighestBibNumber(result.highestBibNumber);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load bib number settings.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadBibSettings();
  }, []);

  async function claimBibNumber(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (bibNumber === "" || !Number.isInteger(bibNumber)) {
      setError("Enter a whole number.");
      return;
    }

    if (highestBibNumber === null || bibNumber < 0 || bibNumber > highestBibNumber) {
      setError("Invalid bib number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bib-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bibNumber }),
      });
      const result = (await response.json()) as {
        error?: string;
        alreadyClaimed?: boolean;
        rafflePosition?: number;
        prizeType?: "prize" | null;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to claim that bib number.");
      }

      const resultLabel = result.prizeType === "prize" ? "Prize" : "No prize";

      setMessage(resultLabel);
      setBibNumber("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to claim that bib number.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-start justify-center p-8">
      <form className="w-full max-w-sm space-y-4" onSubmit={claimBibNumber}>
        <div className="space-y-2">
          <Label htmlFor="race-bib-number">Enter your bib number</Label>
          <Input
            id="race-bib-number"
            min="0"
            name="raceBibNumber"
            onChange={(event) => setBibNumber(event.target.value === "" ? "" : Number(event.target.value))}
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
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </main>
  );
}
