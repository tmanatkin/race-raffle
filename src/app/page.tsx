"use client";

import { SubmitEvent, useEffect, useState } from "react";
import { BibCardForm } from "@/components/bib-card-form";
import { BibCardResult } from "@/components/bib-card-result";
import { CheckeredStripe } from "@/components/checkered-stripe";

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
    headline: "Already claimed!",
    subheading: "Your prize has been picked up.",
  },
};

const FONT_LOAD_TIMEOUT_MS = 3000;

export default function Home() {
  const [bibNumber, setBibNumber] = useState<number | "">("");
  const [lowestBibNumber, setLowestBibNumber] = useState<number | null>(null);
  const [highestBibNumber, setHighestBibNumber] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFontReady, setIsFontReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkedBibNumber, setCheckedBibNumber] = useState<number | null>(null);
  const [prizeType, setPrizeType] = useState<"prize" | null>(null);
  const [redeemedAt, setRedeemedAt] = useState<string | null>(null);

  useEffect(() => {
    async function loadBibSettings() {
      try {
        const response = await fetch("/api/raffle-settings");
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

  useEffect(() => {
    async function waitForFont() {
      // document.fonts.ready would resolve immediately here because no visible text uses the font yet,
      // so the page font is loaded explicitly. The timeout keeps a slow connection from blocking the page.
      const fontFamily = window.getComputedStyle(document.documentElement).fontFamily;
      const timeout = new Promise((resolve) => setTimeout(resolve, FONT_LOAD_TIMEOUT_MS));

      try {
        await Promise.race([document.fonts.load(`1em ${fontFamily}`), timeout]);
      } catch (fontError) {
        console.error(fontError);
      } finally {
        setIsFontReady(true);
      }
    }

    void waitForFont();
  }, []);

  async function checkBibNumber(event: SubmitEvent<HTMLFormElement>) {
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
    <main className="flex min-h-dvh items-center justify-center p-8">
      <div className="@container w-full max-w-sm space-y-8">
        <div className="space-y-5">
          <div className="space-y-3">
            <h1 className="text-center text-[30cqi] leading-[0.85] font-bold font-stretch-[25%] text-primary uppercase [font-style:oblique_10deg]">
              {heading.headline}
            </h1>
            <p className="text-center text-[8cqi] font-medium font-stretch-50% tracking-wide text-balance">
              {heading.subheading}
            </p>
          </div>
        </div>
        <CheckeredStripe />

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
          />
        ) : null}
      </div>
    </main>
  );
}
