export type PrizeType = "prize" | null;

export type RaffleListEntry = {
  position: number;
  prizeType: PrizeType;
  prizeNumber: number | null;
  bibNumber: number | null;
  redeemedAt: string | null;
};

export type GeneratorValues = {
  prizes: number | "";
  racers: number | "";
  lowestBibNumber: number | "";
  highestBibNumber: number | "";
};

export type GenerationTimestamps = {
  generatedAt: string;
  bibLastSavedAt: string | null;
};

export type QrScanStatsData = {
  totalScans: number;
  latestScanAt: string | null;
};

export function formatTimestamp(timestamp: string | null) {
  if (!timestamp) {
    return "Never";
  }

  return (
    new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Denver",
    }).format(new Date(timestamp)) + " (MST)"
  );
}

// e.g. "500 racers, 25 prizes"
export function formatPrizeListSummary(prizes: number, racers: number) {
  const racerLabel = racers === 1 ? "racer" : "racers";
  const prizeLabel = prizes === 1 ? "prize" : "prizes";
  return `${racers} ${racerLabel} - ${prizes} ${prizeLabel}`;
}
