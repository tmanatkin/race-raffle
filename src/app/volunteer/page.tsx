"use client";

import { FormEvent, useState } from "react";
import { BibNumberForm } from "@/components/bib-number-form";
import { RedeemedConfirmation } from "@/components/redeemed-confirmation";

export default function VolunteerPage() {
  const [bibNumber, setBibNumber] = useState<number | "">("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redeemedBibNumber, setRedeemedBibNumber] = useState<number | null>(null);

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
      const result = (await response.json()) as { error?: string; bibNumber?: number };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to redeem prize.");
      }

      setRedeemedBibNumber(result.bibNumber ?? bibNumber);
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
  }

  return (
    <main className="flex min-h-screen items-start justify-center p-8">
      {redeemedBibNumber !== null ? (
        <RedeemedConfirmation bibNumber={redeemedBibNumber} onCheckAnotherBibNumber={checkAnotherBibNumber} />
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
