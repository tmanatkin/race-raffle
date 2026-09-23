"use client";

import { SubmitEvent, useEffect, useState } from "react";
import { BibNumberForm } from "@/components/bib-number-form";
import { BibCheckResult } from "@/components/bib-check-result";
import { Button } from "@/components/ui/button";
import { formatPaddedNumber } from "@/lib/utils";
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

type ResultStatus = "unredeemed" | "redeemed" | "already_redeemed" | "no_prize";

type LookupResponse = {
  error?: string;
  status?: Exclude<ResultStatus, "redeemed"> | "not_checked";
  bibNumber?: number;
  prizeNumber?: number | null;
};

type RedeemResponse = {
  error?: string;
  status?: Exclude<ResultStatus, "unredeemed"> | "not_checked";
  bibNumber?: number;
  prizeNumber?: number | null;
};

type UnredeemResponse = {
  error?: string;
  status?: "unredeemed" | "already_unredeemed" | "no_prize" | "not_checked";
  bibNumber?: number;
  prizeNumber?: number | null;
};

const RESULT_STATUS_TITLE: Record<ResultStatus, string> = {
  unredeemed: "Racer won! Confirm the bib number matches the racer's bib before redeeming.",
  redeemed: "Racer won! Prize is now claimed.",
  already_redeemed: "Racer has already redeemed prize.",
  no_prize: "Racer did not win a prize.",
};

export default function VolunteerPage() {
  const [bibNumber, setBibNumber] = useState<number | "">("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [isUndoConfirmOpen, setIsUndoConfirmOpen] = useState(false);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const [isResultFromUndo, setIsResultFromUndo] = useState(false);
  const [resultError, setResultError] = useState("");
  const [resultStatus, setResultStatus] = useState<ResultStatus | null>(null);
  const [resultBibNumber, setResultBibNumber] = useState<number | null>(null);
  const [resultPrizeNumber, setResultPrizeNumber] = useState<number | null>(null);
  const [lowestBibNumber, setLowestBibNumber] = useState<number | null>(null);
  const [highestBibNumber, setHighestBibNumber] = useState<number | null>(null);
  const [totalPrizes, setTotalPrizes] = useState<number | null>(null);
  const [notCheckedBibNumber, setNotCheckedBibNumber] = useState<number | null>(null);
  const [isNotCheckedDialogOpen, setIsNotCheckedDialogOpen] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function loadRaffleSettings() {
      try {
        const response = await fetch("/api/raffle-settings");
        if (!response.ok) {
          throw new Error("Unable to load raffle settings.");
        }

        const result = (await response.json()) as {
          lowestBibNumber: number;
          highestBibNumber: number;
          prizes: number;
        };

        if (!isCurrent) {
          return;
        }

        setLowestBibNumber(result.lowestBibNumber);
        setHighestBibNumber(result.highestBibNumber);
        setTotalPrizes(result.prizes);
      } catch {
        // Reference values are only used for number padding, so failures are silently ignored.
      }
    }

    void loadRaffleSettings();

    return () => {
      isCurrent = false;
    };
  }, []);

  async function submitLookup(bib: number) {
    const response = await fetch(`/api/volunteer/lookup?bibNumber=${bib}`);

    let result: LookupResponse;
    try {
      result = (await response.json()) as LookupResponse;
    } catch {
      result = { error: "Unable to look up bib number." };
    }

    return { ok: response.ok, result };
  }

  async function submitRedeem(bib: number) {
    const response = await fetch("/api/volunteer/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bibNumber: bib }),
    });

    let result: RedeemResponse;
    try {
      result = (await response.json()) as RedeemResponse;
    } catch {
      result = { error: "Unable to redeem prize." };
    }

    return { ok: response.ok, status: response.status, result };
  }

  async function submitUnredeem(bib: number) {
    const response = await fetch("/api/volunteer/unredeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bibNumber: bib }),
    });

    let result: UnredeemResponse;
    try {
      result = (await response.json()) as UnredeemResponse;
    } catch {
      result = { error: "Unable to undo prize redemption." };
    }

    return { ok: response.ok, result };
  }

  function showResult(status: ResultStatus, bib: number, prizeNumber: number | null) {
    setIsResultFromUndo(false);
    setResultStatus(status);
    setResultBibNumber(bib);
    setResultPrizeNumber(prizeNumber);
    setResultError("");
    setBibNumber("");
  }

  async function lookUpBibNumber(event: SubmitEvent<HTMLFormElement>) {
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
      const { ok, result } = await submitLookup(bibNumber);

      if (!ok || !result.status) {
        throw new Error(result.error ?? "Unable to look up bib number.");
      }

      if (result.status === "not_checked") {
        setNotCheckedBibNumber(bibNumber);
        setIsNotCheckedDialogOpen(true);
        return;
      }

      showResult(result.status, result.bibNumber ?? bibNumber, result.prizeNumber ?? null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to look up bib number.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function checkBibNumberForRacer() {
    const bib = notCheckedBibNumber;
    if (bib === null) {
      return;
    }

    setIsNotCheckedDialogOpen(false);
    setError("");
    setIsSubmitting(true);

    try {
      const checkResponse = await fetch("/api/bib-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bibNumber: bib }),
      });

      let checkResult: { error?: string };
      try {
        checkResult = (await checkResponse.json()) as { error?: string };
      } catch {
        checkResult = { error: "Unable to check bib number." };
      }

      if (!checkResponse.ok) {
        throw new Error(checkResult.error ?? "Unable to check bib number.");
      }

      const { ok, result } = await submitLookup(bib);

      if (!ok || !result.status || result.status === "not_checked") {
        throw new Error(result.error ?? "Unable to look up bib number.");
      }

      showResult(result.status, result.bibNumber ?? bib, result.prizeNumber ?? null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to check bib number.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function redeemPrize() {
    if (resultBibNumber === null) {
      return;
    }

    setResultError("");
    setIsRedeeming(true);

    try {
      const { ok, result } = await submitRedeem(resultBibNumber);

      if (!ok || !result.status || result.status === "not_checked") {
        throw new Error(result.error ?? "Unable to redeem prize.");
      }

      setIsResultFromUndo(false);
      setResultStatus(result.status);
      setResultPrizeNumber(result.prizeNumber ?? null);
    } catch (submitError) {
      setResultError(submitError instanceof Error ? submitError.message : "Unable to redeem prize.");
    } finally {
      setIsRedeeming(false);
    }
  }

  async function undoRedemption() {
    if (resultBibNumber === null) {
      return;
    }

    setIsUndoConfirmOpen(false);
    setResultError("");
    setIsUndoing(true);

    try {
      const { ok, result } = await submitUnredeem(resultBibNumber);

      if (!ok || !result.status || result.status === "not_checked") {
        throw new Error(result.error ?? "Unable to undo prize redemption.");
      }

      // "already_unredeemed" means another volunteer already undid it, so both land on the unredeemed screen.
      setIsResultFromUndo(true);
      setResultStatus(result.status === "no_prize" ? "no_prize" : "unredeemed");
      setResultPrizeNumber(result.prizeNumber ?? null);
    } catch (submitError) {
      setResultError(submitError instanceof Error ? submitError.message : "Unable to undo prize redemption.");
    } finally {
      setIsUndoing(false);
    }
  }

  function checkAnotherBibNumber() {
    setIsLeaveConfirmOpen(false);
    setIsResultFromUndo(false);
    setError("");
    setResultError("");
    setResultStatus(null);
    setResultBibNumber(null);
    setResultPrizeNumber(null);
  }

  // Leaving an unredeemed winner's result is usually a typo'd lookup, but it can also mean the prize was
  // handed over without being marked, so confirm before moving on. Skipped after an undo, since the undo
  // confirmation already established the prize is back on the table.
  function requestCheckAnotherBibNumber() {
    if (resultStatus === "unredeemed" && !isResultFromUndo) {
      setIsLeaveConfirmOpen(true);
      return;
    }

    checkAnotherBibNumber();
  }

  return (
    <main className="flex items-start justify-center p-8">
      {resultStatus !== null && resultBibNumber !== null ? (
        <BibCheckResult
          bibNumber={resultBibNumber}
          highestBibNumber={highestBibNumber ?? resultBibNumber}
          onCheckAnotherBibNumber={requestCheckAnotherBibNumber}
          title={RESULT_STATUS_TITLE[resultStatus]}
          prizeNumber={resultStatus === "no_prize" ? null : resultPrizeNumber}
          totalPrizes={totalPrizes ?? resultPrizeNumber ?? 0}
          actions={
            resultStatus === "unredeemed" ? (
              <Button disabled={isRedeeming} onClick={redeemPrize} type="button">
                {isRedeeming ? "Redeeming..." : "Mark as redeemed"}
              </Button>
            ) : resultStatus === "redeemed" || resultStatus === "already_redeemed" ? (
              <Button
                disabled={isUndoing}
                onClick={() => setIsUndoConfirmOpen(true)}
                type="button"
                variant="destructive"
              >
                {isUndoing ? "Undoing..." : "Undo redemption"}
              </Button>
            ) : null
          }
          isCheckAnotherDisabled={isRedeeming || isUndoing}
          error={resultError}
        />
      ) : (
        <BibNumberForm
          bibNumber={bibNumber}
          onBibNumberChange={setBibNumber}
          onSubmit={lookUpBibNumber}
          isLoading={false}
          isSubmitting={isSubmitting}
          error={error}
          label="Enter racer's bib number"
          submitLabel="Submit"
          submittingLabel="Submitting..."
        />
      )}

      <AlertDialog onOpenChange={setIsNotCheckedDialogOpen} open={isNotCheckedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {notCheckedBibNumber !== null && highestBibNumber !== null ? (
                <>
                  Bib #<span className="font-mono">{formatPaddedNumber(notCheckedBibNumber, highestBibNumber)}</span>{" "}
                  has not been checked for a prize.
                </>
              ) : null}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This racer has not checked if they have won a prize yet. Would you like to check for them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={checkBibNumberForRacer}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog onOpenChange={setIsUndoConfirmOpen} open={isUndoConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {resultBibNumber !== null ? (
                <>
                  Undo redemption for Bib #
                  <span className="font-mono">
                    {formatPaddedNumber(resultBibNumber, highestBibNumber ?? resultBibNumber)}
                  </span>
                  ?
                </>
              ) : null}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {resultPrizeNumber !== null ? (
                <>
                  Only undo if Prize #
                  <span className="font-mono">
                    {formatPaddedNumber(resultPrizeNumber, totalPrizes ?? resultPrizeNumber)}
                  </span>{" "}
                  is back on the prize table.
                </>
              ) : (
                "Only undo if the prize is back on the prize table."
              )}{" "}
              The prize will be marked as not claimed and can be redeemed again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={undoRedemption} variant="destructive">
              Undo redemption
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog onOpenChange={setIsLeaveConfirmOpen} open={isLeaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {resultBibNumber !== null ? (
                <>
                  Leave without redeeming Bib #
                  <span className="font-mono">
                    {formatPaddedNumber(resultBibNumber, highestBibNumber ?? resultBibNumber)}
                  </span>
                  ?
                </>
              ) : null}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {resultPrizeNumber !== null ? (
                <>
                  This racer won Prize #
                  <span className="font-mono">
                    {formatPaddedNumber(resultPrizeNumber, totalPrizes ?? resultPrizeNumber)}
                  </span>
                  , but it has not been marked as redeemed.
                </>
              ) : (
                "This racer won a prize, but it has not been marked as redeemed."
              )}{" "}
              If the prize was handed over, go back and mark it as redeemed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction onClick={checkAnotherBibNumber}>Leave without redeeming</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
