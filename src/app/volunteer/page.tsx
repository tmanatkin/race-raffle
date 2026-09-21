"use client";

import { FormEvent, useEffect, useState } from "react";
import { BibNumberForm } from "@/components/bib-number-form";
import { BibCheckResult } from "@/components/bib-check-result";

type RedeemStatus = "redeemed" | "already_redeemed" | "no_prize";

const REDEEM_STATUS_TITLE: Record<RedeemStatus, string> = {
  redeemed: "Racer Prize Redeemed!",
  already_redeemed: "Racer has already redeemed prize.",
  no_prize: "Racer did not win a prize.",
};

export default function VolunteerPage() {
  const [bibNumber, setBibNumber] = useState<number | "">("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultStatus, setResultStatus] = useState<RedeemStatus | null>(null);
  const [resultBibNumber, setResultBibNumber] = useState<number | null>(null);
  const [resultPrizeNumber, setResultPrizeNumber] = useState<number | null>(null);
  const [lowestBibNumber, setLowestBibNumber] = useState<number | null>(null);
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
          generation: { prizes: number; lowestBibNumber: number; highestBibNumber: number } | null;
          bibSettings?: { lowestBibNumber: number; highestBibNumber: number };
        };

        if (!isCurrent) {
          return;
        }

        if (result.generation) {
          setLowestBibNumber(result.generation.lowestBibNumber);
          setHighestBibNumber(result.generation.highestBibNumber);
          setTotalPrizes(result.generation.prizes);
        } else if (result.bibSettings) {
          setLowestBibNumber(result.bibSettings.lowestBibNumber);
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

    if (
      lowestBibNumber === null ||
      highestBibNumber === null ||
      bibNumber < lowestBibNumber ||
      bibNumber > highestBibNumber
    ) {
      setError("Invalid bib number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bib-checks/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bibNumber }),
      });
      const result = (await response.json()) as {
        error?: string;
        status?: RedeemStatus;
        bibNumber?: number;
        prizeNumber?: number | null;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to redeem prize.");
      }

      setResultStatus(result.status ?? null);
      setResultBibNumber(result.bibNumber ?? bibNumber);
      setResultPrizeNumber(result.prizeNumber ?? null);
      setBibNumber("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to redeem prize.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function checkAnotherBibNumber() {
    setError("");
    setResultStatus(null);
    setResultBibNumber(null);
    setResultPrizeNumber(null);
  }

  return (
    <main className="flex min-h-screen items-start justify-center p-8">
      {resultStatus !== null && resultBibNumber !== null ? (
        <BibCheckResult
          bibNumber={resultBibNumber}
          highestBibNumber={highestBibNumber ?? resultBibNumber}
          onCheckAnotherBibNumber={checkAnotherBibNumber}
          title={REDEEM_STATUS_TITLE[resultStatus]}
          prizeNumber={resultStatus === "no_prize" ? null : resultPrizeNumber}
          totalPrizes={totalPrizes ?? resultPrizeNumber ?? 0}
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
