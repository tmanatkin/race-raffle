"use client";

import { FormEvent, useEffect, useState } from "react";
import { BibNumberForm } from "@/components/bib-number-form";
import { BibCheckResult } from "@/components/bib-check-result";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type RedeemStatus = "redeemed" | "already_redeemed" | "no_prize";

type RedeemResponse = {
  error?: string;
  status?: RedeemStatus | "not_checked";
  bibNumber?: number;
  prizeNumber?: number | null;
};

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
  const [notCheckedBibNumber, setNotCheckedBibNumber] = useState<number | null>(null);

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

  async function submitRedeem(bib: number) {
    const response = await fetch("/api/bib-checks/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bibNumber: bib }),
    });
    const result = (await response.json()) as RedeemResponse;
    return { ok: response.ok, status: response.status, result };
  }

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
      const { ok, result } = await submitRedeem(bibNumber);

      if (!ok) {
        if (result.status === "not_checked") {
          setNotCheckedBibNumber(bibNumber);
          return;
        }

        throw new Error(result.error ?? "Unable to redeem prize.");
      }

      setResultStatus((result.status as RedeemStatus) ?? null);
      setResultBibNumber(result.bibNumber ?? bibNumber);
      setResultPrizeNumber(result.prizeNumber ?? null);
      setBibNumber("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to redeem prize.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function checkAndRedeemBibNumber() {
    const bib = notCheckedBibNumber;
    if (bib === null) {
      return;
    }

    setNotCheckedBibNumber(null);
    setError("");
    setIsSubmitting(true);

    try {
      const checkResponse = await fetch("/api/bib-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bibNumber: bib }),
      });
      const checkResult = (await checkResponse.json()) as { error?: string };

      if (!checkResponse.ok) {
        throw new Error(checkResult.error ?? "Unable to check bib number.");
      }

      const { ok, result } = await submitRedeem(bib);

      if (!ok) {
        throw new Error(result.error ?? "Unable to redeem prize.");
      }

      setResultStatus((result.status as RedeemStatus) ?? null);
      setResultBibNumber(result.bibNumber ?? bib);
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

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setNotCheckedBibNumber(null);
          }
        }}
        open={notCheckedBibNumber !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Racer has not checked if they won a prize.</AlertDialogTitle>
            <AlertDialogDescription>
              This racer has not checked if they have won a prize yet. Would you like to check for them if they won a
              prize?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={checkAndRedeemBibNumber}>Check & Redeem</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
