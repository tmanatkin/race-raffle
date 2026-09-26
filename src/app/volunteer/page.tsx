"use client";

import { SubmitEvent, useEffect, useState } from "react";
import { BibCardForm } from "@/components/bib-card-form";
import { BibCheckResult } from "@/components/bib-check-result";
import { CheckeredStripe } from "@/components/checkered-stripe";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/api/fetch-json";
import { cn, formatPaddedNumber } from "@/lib/utils";
import { useIsFontReady } from "@/lib/use-is-font-ready";
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

type HeadingKey = "lookup" | ResultStatus;

type Heading = {
  headline: string;
  subheading: string;
  className: string;
};

const HEADING: Record<HeadingKey, Heading> = {
  lookup: {
    headline: "Prize table",
    subheading: "Enter the number on the racer's bib.",
    className: "text-primary",
  },
  unredeemed: {
    headline: "Racer won",
    subheading: "Confirm the bib numbers match.",
    className: "text-primary",
  },
  redeemed: {
    headline: "Redeemed",
    subheading: "Ready for the next racer.",
    className: "text-foreground",
  },
  already_redeemed: {
    headline: "Picked up",
    subheading: "This prize has already been claimed.",
    className: "text-destructive/90",
  },
  no_prize: {
    headline: "No prize",
    subheading: "This racer did not win a prize.",
    className: "text-muted-foreground",
  },
};

export default function VolunteerPage() {
  const [bibNumber, setBibNumber] = useState<number | "">("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const isFontReady = useIsFontReady();
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
        const { ok, result } = await fetchJson<{
          lowestBibNumber?: number;
          highestBibNumber?: number;
          prizes?: number;
          error?: string;
        }>("/api/raffle-settings", "Couldn't load. Refresh the page.");

        if (!ok || result.lowestBibNumber === undefined || result.highestBibNumber === undefined) {
          throw new Error(result.error ?? "Couldn't load. Refresh the page.");
        }

        if (!isCurrent) {
          return;
        }

        setLowestBibNumber(result.lowestBibNumber);
        setHighestBibNumber(result.highestBibNumber);
        setTotalPrizes(result.prizes ?? null);
      } catch (loadError) {
        if (!isCurrent) {
          return;
        }

        // The bib range is needed to validate lookups, so a failure is shown instead of letting every
        // lookup report "Invalid bib number."
        setError(loadError instanceof Error ? loadError.message : "Couldn't load. Refresh the page.");
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadRaffleSettings();

    return () => {
      isCurrent = false;
    };
  }, []);

  async function submitLookup(bib: number) {
    return fetchJson<LookupResponse>(`/api/volunteer/lookup?bibNumber=${bib}`, "Couldn't look up bib. Try again.");
  }

  async function submitRedeem(bib: number) {
    return fetchJson<RedeemResponse>("/api/volunteer/redeem", "Couldn't redeem. Try again.", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bibNumber: bib }),
    });
  }

  async function submitUnredeem(bib: number) {
    return fetchJson<UnredeemResponse>("/api/volunteer/unredeem", "Couldn't undo. Try again.", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bibNumber: bib }),
    });
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

    if (lowestBibNumber === null || highestBibNumber === null) {
      setError("Couldn't load. Refresh the page.");
      return;
    }

    if (bibNumber === "" || !Number.isInteger(bibNumber)) {
      setError("Enter a bib number.");
      return;
    }

    if (bibNumber < lowestBibNumber || bibNumber > highestBibNumber) {
      setError("Invalid bib number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { ok, result } = await submitLookup(bibNumber);

      if (!ok || !result.status) {
        throw new Error(result.error ?? "Couldn't look up bib. Try again.");
      }

      if (result.status === "not_checked") {
        setNotCheckedBibNumber(bibNumber);
        setIsNotCheckedDialogOpen(true);
        return;
      }

      showResult(result.status, result.bibNumber ?? bibNumber, result.prizeNumber ?? null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Couldn't look up bib. Try again.");
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
      const { ok: isCheckOk, result: checkResult } = await fetchJson<{ error?: string }>(
        "/api/bib-checks",
        "Couldn't check bib. Try again.",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bibNumber: bib }),
        }
      );

      if (!isCheckOk) {
        throw new Error(checkResult.error ?? "Couldn't check bib. Try again.");
      }

      const { ok, result } = await submitLookup(bib);

      if (!ok || !result.status || result.status === "not_checked") {
        throw new Error(result.error ?? "Couldn't look up bib. Try again.");
      }

      showResult(result.status, result.bibNumber ?? bib, result.prizeNumber ?? null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Couldn't check bib. Try again.");
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
        throw new Error(result.error ?? "Couldn't redeem. Try again.");
      }

      setIsResultFromUndo(false);
      setResultStatus(result.status);
      setResultPrizeNumber(result.prizeNumber ?? null);
    } catch (submitError) {
      setResultError(submitError instanceof Error ? submitError.message : "Couldn't redeem. Try again.");
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
        throw new Error(result.error ?? "Couldn't undo. Try again.");
      }

      // "already_unredeemed" means another volunteer already undid it, so both land on the unredeemed screen.
      setIsResultFromUndo(true);
      setResultStatus(result.status === "no_prize" ? "no_prize" : "unredeemed");
      setResultPrizeNumber(result.prizeNumber ?? null);
    } catch (submitError) {
      setResultError(submitError instanceof Error ? submitError.message : "Couldn't undo. Try again.");
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

  const heading = resultStatus === null ? HEADING.lookup : HEADING[resultStatus];
  const displayedPrizeNumber = resultStatus === null || resultStatus === "no_prize" ? null : resultPrizeNumber;

  if (isLoading || !isFontReady) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div aria-busy="true" aria-label="Loading">
          <span className="block size-8 animate-spin rounded-full border-4 border-muted-foreground/30 border-t-muted-foreground" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex items-start justify-center p-8">
      <div className="@container w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <div className="flex items-baseline-last justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <p className="text-sm font-bold tracking-widest text-muted-foreground uppercase">Volunteer</p>
              <h1
                className={cn("text-[14cqi] leading-[0.9] font-bold font-stretch-[25%] uppercase", heading.className)}
              >
                {heading.headline}
              </h1>
            </div>
            {displayedPrizeNumber !== null ? (
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold tracking-widest text-muted-foreground uppercase">Prize</p>
                <p className="-mb-2 rounded-xl bg-primary px-3 py-2 text-[14cqi] leading-[0.9] font-bold font-stretch-[25%] text-white">
                  #{formatPaddedNumber(displayedPrizeNumber, totalPrizes ?? displayedPrizeNumber)}
                </p>
              </div>
            ) : null}
          </div>
          <p className="text-[5.5cqi] leading-snug font-medium text-balance">{heading.subheading}</p>
        </div>
        <CheckeredStripe />

        {resultStatus !== null && resultBibNumber !== null ? (
          <BibCheckResult
            bibNumber={resultBibNumber}
            onCheckAnotherBibNumber={requestCheckAnotherBibNumber}
            action={
              resultStatus === "unredeemed" ? (
                <Button
                  className="h-14 w-full rounded-xl text-base leading-tight font-bold whitespace-normal"
                  disabled={isRedeeming}
                  onClick={redeemPrize}
                  type="button"
                >
                  {isRedeeming ? "Redeeming..." : "Redeem"}
                </Button>
              ) : resultStatus === "redeemed" || resultStatus === "already_redeemed" ? (
                <Button
                  className="h-14 w-full rounded-xl text-base leading-tight font-bold whitespace-normal"
                  disabled={isUndoing}
                  onClick={() => setIsUndoConfirmOpen(true)}
                  type="button"
                  variant="destructive"
                >
                  {isUndoing ? "Undoing..." : "Unredeem"}
                </Button>
              ) : null
            }
            isCheckAnotherDisabled={isRedeeming || isUndoing}
            error={resultError}
          />
        ) : (
          <BibCardForm
            bibNumber={bibNumber}
            onBibNumberChange={setBibNumber}
            onSubmit={lookUpBibNumber}
            isSubmitting={isSubmitting}
            error={error}
            autoFocus
          />
        )}
      </div>

      <AlertDialog onOpenChange={setIsNotCheckedDialogOpen} open={isNotCheckedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {notCheckedBibNumber !== null ? (
                <>
                  Bib #<span className="font-mono">{notCheckedBibNumber}</span>{" "}
                  has not been checked for a prize.
                </>
              ) : null}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This racer has not checked if they have won a prize yet. Would you like to check for them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-14 w-full rounded-xl text-base leading-tight font-bold whitespace-normal sm:w-auto sm:flex-1">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-14 w-full rounded-xl text-base leading-tight font-bold whitespace-normal sm:w-auto sm:flex-1"
              onClick={checkBibNumberForRacer}
            >
              Continue
            </AlertDialogAction>
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
                    {resultBibNumber}
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
            <AlertDialogCancel className="h-14 w-full rounded-xl text-base leading-tight font-bold whitespace-normal sm:w-auto sm:flex-1">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-14 w-full rounded-xl text-base leading-tight font-bold whitespace-normal sm:w-auto sm:flex-1"
              onClick={undoRedemption}
              variant="destructive"
            >
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
                    {resultBibNumber}
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
            <AlertDialogCancel className="h-14 w-full rounded-xl text-base leading-tight font-bold whitespace-normal sm:w-auto sm:flex-1">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-14 w-full rounded-xl text-base leading-tight font-bold whitespace-normal sm:w-auto sm:flex-1"
              onClick={checkAnotherBibNumber}
            >
              Leave without redeeming
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
