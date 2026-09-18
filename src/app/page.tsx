"use client";

import { FormEvent, useEffect, useState } from "react";
import { BibNumberForm } from "@/components/bib-number-form";
import { PrizeResult } from "@/components/prize-result";
import { RedeemedConfirmation } from "@/components/redeemed-confirmation";

export default function Home() {
  const [bibNumber, setBibNumber] = useState<number | "">("");
  const [lowestBibNumber, setLowestBibNumber] = useState<number | null>(null);
  const [highestBibNumber, setHighestBibNumber] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkedBibNumber, setCheckedBibNumber] = useState<number | null>(null);
  const [prizeType, setPrizeType] = useState<"prize" | null>(null);
  const [redeemedAt, setRedeemedAt] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    async function loadBibSettings() {
      try {
        const response = await fetch("/api/bib-checks");
        const result = (await response.json()) as {
          lowestBibNumber?: number;
          highestBibNumber?: number;
          error?: string;
        };

        if (!response.ok || result.lowestBibNumber === undefined || result.highestBibNumber === undefined) {
          throw new Error(result.error ?? "Unable to load bib number settings.");
        }

        setLowestBibNumber(result.lowestBibNumber);
        setHighestBibNumber(result.highestBibNumber);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load bib number settings.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadBibSettings();
  }, []);

  async function checkBibNumber(event: FormEvent<HTMLFormElement>) {
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
      const response = await fetch("/api/bib-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bibNumber }),
      });
      const result = (await response.json()) as {
        error?: string;
        alreadyChecked?: boolean;
        bibNumber?: number;
        rafflePosition?: number;
        prizeType?: "prize" | null;
        redeemedAt?: string | null;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to check bib number.");
      }

      setCheckedBibNumber(result.bibNumber ?? null);
      setPrizeType(result.prizeType ?? null);
      setRedeemedAt(result.redeemedAt ?? null);
      setBibNumber("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to check bib number.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function redeemPrize() {
    if (checkedBibNumber === null) {
      return;
    }

    setIsRedeeming(true);
    setRedeemError("");

    try {
      const response = await fetch("/api/bib-checks/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bibNumber: checkedBibNumber }),
      });
      const result = (await response.json()) as { error?: string; redeemedAt?: string | null };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to redeem prize.");
      }

      setRedeemedAt(result.redeemedAt ?? null);
    } catch (redeemPrizeError) {
      setRedeemError(redeemPrizeError instanceof Error ? redeemPrizeError.message : "Unable to redeem prize.");
    } finally {
      setIsRedeeming(false);
    }
  }

  function checkAnotherBibNumber() {
    setError("");
    setCheckedBibNumber(null);
    setPrizeType(null);
    setRedeemedAt(null);
    setRedeemError("");
  }

  const step = redeemedAt ? "redeemed" : checkedBibNumber !== null ? "result" : "form";

  return (
    <main className="flex min-h-screen items-start justify-center p-8">
      {step === "form" ? (
        <BibNumberForm
          bibNumber={bibNumber}
          onBibNumberChange={setBibNumber}
          onSubmit={checkBibNumber}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          error={error}
        />
      ) : step === "result" ? (
        <PrizeResult
          prizeType={prizeType}
          isRedeeming={isRedeeming}
          redeemError={redeemError}
          onRedeem={redeemPrize}
          onCheckAnotherBibNumber={checkAnotherBibNumber}
        />
      ) : (
        <RedeemedConfirmation onCheckAnotherBibNumber={checkAnotherBibNumber} />
      )}
    </main>
  );
}
