"use client";

import { SubmitEvent, useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { BibCardForm } from "@/components/bib-card-form";
import { BibCardResult } from "@/components/bib-card-result";
import { CheckeredStripe } from "@/components/checkered-stripe";
import { fetchJson } from "@/lib/api/fetch-json";
import { cn } from "@/lib/utils";
import { useIsFontReady } from "@/lib/use-is-font-ready";

type CheckStatus = "no_prize" | "unredeemed" | "already_redeemed";

type HeadingKey = "unchecked" | CheckStatus;

type Heading = {
  headline: string;
  subheading: string;
};

const HEADING: Record<HeadingKey, Heading> = {
  unchecked: {
    headline: "Race Raffle",
    subheading: "Check if you won a prize!",
  },
  no_prize: {
    headline: "Not this time.",
    subheading: "Sorry! You did not win a prize.",
  },
  unredeemed: {
    headline: "You won a prize!",
    subheading: "Bring your bib to the prize table.",
  },
  already_redeemed: {
    headline: "Already claimed.",
    subheading: "Your prize has been picked up.",
  },
};

const MINIMUM_RESULT_DELAY_MS = 1000;

const CONFETTI_WHITE = "#ffffff";
const CONFETTI_GOLD = "#fbbf24";

const CONFETTI_SHARED_OPTIONS: confetti.Options = {
  colors: [CONFETTI_WHITE, CONFETTI_GOLD],
  shapes: ["square"],
  disableForReducedMotion: true,
};

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export default function Home() {
  const [bibNumber, setBibNumber] = useState<number | "">("");
  const [lowestBibNumber, setLowestBibNumber] = useState<number | null>(null);
  const [highestBibNumber, setHighestBibNumber] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const isFontReady = useIsFontReady();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkedBibNumber, setCheckedBibNumber] = useState<number | null>(null);
  const [prizeType, setPrizeType] = useState<"prize" | null>(null);
  const [redeemedAt, setRedeemedAt] = useState<string | null>(null);

  useEffect(() => {
    async function loadBibSettings() {
      try {
        const { ok, result } = await fetchJson<{
          lowestBibNumber?: number;
          highestBibNumber?: number;
          error?: string;
        }>("/api/raffle-settings", "Couldn't load. Refresh the page.");

        if (!ok || result.lowestBibNumber === undefined || result.highestBibNumber === undefined) {
          throw new Error(result.error ?? "Couldn't load. Refresh the page.");
        }

        setLowestBibNumber(result.lowestBibNumber);
        setHighestBibNumber(result.highestBibNumber);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Couldn't load. Refresh the page.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadBibSettings();
  }, []);

  async function checkBibNumber(event: SubmitEvent<HTMLFormElement>) {
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
    const submitStartedAt = Date.now();

    try {
      const { ok, result } = await fetchJson<{
        error?: string;
        alreadyChecked?: boolean;
        bibNumber?: number;
        rafflePosition?: number;
        prizeType?: "prize" | null;
        redeemedAt?: string | null;
      }>("/api/bib-checks", "Couldn't check bib. Try again.", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bibNumber }),
      });

      if (!ok) {
        throw new Error(result.error ?? "Couldn't check bib. Try again.");
      }

      // Hold successful results so a fast response doesn't swap the page before the racer notices.
      // Errors skip this and show right away.
      const elapsedMs = Date.now() - submitStartedAt;
      if (elapsedMs < MINIMUM_RESULT_DELAY_MS) {
        await wait(MINIMUM_RESULT_DELAY_MS - elapsedMs);
      }

      setCheckedBibNumber(result.bibNumber ?? null);
      setPrizeType(result.prizeType ?? null);
      setRedeemedAt(result.redeemedAt ?? null);
      setBibNumber("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Couldn't check bib. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function checkAnotherBibNumber() {
    setError("");
    setCheckedBibNumber(null);
    setPrizeType(null);
    setRedeemedAt(null);
  }

  const status: CheckStatus | null =
    checkedBibNumber === null
      ? null
      : redeemedAt
        ? "already_redeemed"
        : prizeType === "prize"
          ? "unredeemed"
          : "no_prize";

  const heading = status === null ? HEADING.unchecked : HEADING[status];
  const isWinner = status === "unredeemed";

  useEffect(() => {
    if (!isWinner) {
      return;
    }

    void confetti({
      ...CONFETTI_SHARED_OPTIONS,
      particleCount: 100,
      spread: 70,
      origin: { y: 1.1 },
    });
    void confetti({
      ...CONFETTI_SHARED_OPTIONS,
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.5 },
    });
    void confetti({
      ...CONFETTI_SHARED_OPTIONS,
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.5 },
    });
  }, [isWinner]);

  if (isLoading || !isFontReady) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-8">
        <div aria-busy="true" aria-label="Loading">
          <span className="block size-8 animate-spin rounded-full border-4 border-muted-foreground/30 border-t-muted-foreground" />
        </div>
      </main>
    );
  }

  return (
    <main data-body-bg-primary={isWinner} className="flex min-h-dvh items-center justify-center px-8 py-6">
      <div className="@container w-full max-w-sm space-y-6">
        <div className={cn("space-y-5", isWinner && "text-primary-foreground")}>
          <div className="space-y-3">
            <h1
              className={cn(
                "text-center text-[30cqi] leading-[0.85] font-bold font-stretch-[25%] uppercase [font-style:oblique_10deg]",
                isSubmitting ? "text-muted-foreground" : isWinner ? "text-primary-foreground" : "text-primary"
              )}
            >
              {heading.headline}
            </h1>
            <p className="text-center text-[8cqi] font-medium font-stretch-50% tracking-wide text-balance">
              {heading.subheading}
            </p>
          </div>
        </div>
        <CheckeredStripe isAnimating={isSubmitting} className={isWinner ? "text-primary-foreground" : undefined} />

        {status === null ? (
          <BibCardForm
            bibNumber={bibNumber}
            highestBibNumber={highestBibNumber ?? 0}
            onBibNumberChange={setBibNumber}
            onSubmit={checkBibNumber}
            isSubmitting={isSubmitting}
            error={error}
          />
        ) : checkedBibNumber !== null ? (
          <BibCardResult
            bibNumber={checkedBibNumber}
            highestBibNumber={highestBibNumber ?? checkedBibNumber}
            onCheckAnotherBibNumber={checkAnotherBibNumber}
            isOnPrimaryBackground={isWinner}
          />
        ) : null}
      </div>
    </main>
  );
}
