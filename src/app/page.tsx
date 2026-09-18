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
  const [claimedBibNumber, setClaimedBibNumber] = useState<number | null>(null);
  const [prizeType, setPrizeType] = useState<"prize" | null>(null);
  const [redeemedAt, setRedeemedAt] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    async function loadBibSettings() {
      try {
        const response = await fetch("/api/bib-claims");
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

  async function claimBibNumber(event: FormEvent<HTMLFormElement>) {
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
      const response = await fetch("/api/bib-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bibNumber }),
      });
      const result = (await response.json()) as {
        error?: string;
        alreadyClaimed?: boolean;
        bibNumber?: number;
        rafflePosition?: number;
        prizeType?: "prize" | null;
        redeemedAt?: string | null;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to claim that bib number.");
      }

      setClaimedBibNumber(result.bibNumber ?? null);
      setPrizeType(result.prizeType ?? null);
      setRedeemedAt(result.redeemedAt ?? null);
      setBibNumber("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to claim that bib number.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function redeemPrize() {
    if (claimedBibNumber === null) {
      return;
    }

    setIsRedeeming(true);
    setRedeemError("");

    try {
      const response = await fetch("/api/bib-claims/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bibNumber: claimedBibNumber }),
      });
      const result = (await response.json()) as { error?: string; redeemedAt?: string | null };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to redeem that prize.");
      }

      setRedeemedAt(result.redeemedAt ?? null);
    } catch (redeemPrizeError) {
      setRedeemError(redeemPrizeError instanceof Error ? redeemPrizeError.message : "Unable to redeem that prize.");
    } finally {
      setIsRedeeming(false);
    }
  }

  function checkAnotherBibNumber() {
    setError("");
    setClaimedBibNumber(null);
    setPrizeType(null);
    setRedeemedAt(null);
    setRedeemError("");
  }

  const step = redeemedAt ? "redeemed" : claimedBibNumber !== null ? "result" : "form";

  return (
    <main className="flex min-h-screen items-start justify-center p-8">
      {step === "form" ? (
        <BibNumberForm
          bibNumber={bibNumber}
          onBibNumberChange={setBibNumber}
          onSubmit={claimBibNumber}
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
