export type PrizeType = "prize" | null;

export type RaffleListEntry = {
  position: number;
  prizeType: PrizeType;
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
