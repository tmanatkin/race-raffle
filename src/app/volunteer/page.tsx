"use client";

import { FormEvent, useEffect, useState } from "react";
import { BibNumberForm } from "@/components/bib-number-form";
import { RedeemedConfirmation } from "@/components/redeemed-confirmation";

export default function VolunteerPage() {
  const [bibNumber, setBibNumber] = useState<number | "">("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redeemedBibNumber, setRedeemedBibNumber] = useState<number | null>(null);
  const [redeemedPrizeNumber, setRedeemedPrizeNumber] = useState<number | null>(null);
  const [highestBibNumber, setHighestBibNumber] = useState<number | null>(null);
  const [totalPrizes, setTotalPrizes] = useState<number | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadRaffleSettings() {
      try {
        const response = await fetch("/api/admin/raffle-entries");
        if (!response.ok) {
          throw new Error("Unable to load raffle settings.");
        }

        const result = (await response.json()) as {
          generation: { prizes: number; highestBibNumber: number } | null;
          bibSettings?: { highestBibNumber: number };
        };

        if (!isCurrent) {
          return;
        }

        if (result.generation) {
          setHighestBibNumber(result.generation.highestBibNumber);
          setTotalPrizes(result.generation.prizes);
        } else if (result.bibSettings) {
          setHighestBibNumber(result.bibSettings.highestBibNumber);
        }
      } catch {
        // Reference values are only used for number padding, so failures are silently ignored.
      }
    }

    void loadRaffleSettings();

    return () => {
      isCurrent = false;
    };
  }, []);

  async function redeemBibNumber(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (bibNumber === "" || !Number.isInteger(bibNumber)) {
      setError("Enter a whole number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bib-checks/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bibNumber }),
      });
      const result = (await response.json()) as { error?: string; bibNumber?: number; prizeNumber?: number | null };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to redeem prize.");
      }

      setRedeemedBibNumber(result.bibNumber ?? bibNumber);
      setRedeemedPrizeNumber(result.prizeNumber ?? null);
      setBibNumber("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to redeem prize.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function checkAnotherBibNumber() {
    setError("");
    setRedeemedBibNumber(null);
    setRedeemedPrizeNumber(null);
  }

  return (
    <main className="flex min-h-screen items-start justify-center p-8">
      {redeemedBibNumber !== null ? (
        <RedeemedConfirmation
          bibNumber={redeemedBibNumber}
          highestBibNumber={highestBibNumber ?? redeemedBibNumber}
          onCheckAnotherBibNumber={checkAnotherBibNumber}
          prizeNumber={redeemedPrizeNumber}
          totalPrizes={totalPrizes ?? redeemedPrizeNumber ?? 0}
        />
      ) : (
        <BibNumberForm
          bibNumber={bibNumber}
          onBibNumberChange={setBibNumber}
          onSubmit={redeemBibNumber}
          isLoading={false}
          isSubmitting={isSubmitting}
          error={error}
          label="Enter racer's bib number to redeem"
          submitLabel="Redeem"
          submittingLabel="Redeeming..."
        />
      )}
    </main>
  );
}
