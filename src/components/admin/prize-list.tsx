import { Check, Minus, X } from "lucide-react";
import { RaffleListEntry, formatPrizeListSummary } from "@/components/admin/types";
import { formatPaddedNumber } from "@/lib/utils";

type PrizeListProps = {
  isLoading: boolean;
  error: string;
  hasGeneratedGeneration: boolean;
  generatedList: RaffleListEntry[];
  highestBibNumber: number;
  totalPrizes: number;
};

function StatusIcon({ status }: { status: "check" | "x" | "minus" }) {
  if (status === "check") {
    return (
      <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white dark:bg-emerald-500">
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    );
  }

  if (status === "x") {
    return (
      <span className="inline-flex size-5 items-center justify-center rounded-full bg-red-600 text-white dark:bg-red-500">
        <X className="size-3.5" strokeWidth={3} />
      </span>
    );
  }

  return (
    <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted-foreground/30 text-white">
      <Minus className="size-3.5" strokeWidth={3} />
    </span>
  );
}

export function PrizeList({
  isLoading,
  error,
  hasGeneratedGeneration,
  generatedList,
  highestBibNumber,
  totalPrizes,
}: PrizeListProps) {
  const assignedPrizeCount = generatedList.filter((entry) => entry.prizeType === "prize").length;

  return (
    <section aria-label="Prize list" className="space-y-4">
      <div className="relative z-30 space-y-1">
        <h2 className="text-lg font-semibold">Prize List</h2>
        <p className="text-sm text-muted-foreground">Prizes will be assigned in this order.</p>
      </div>
      {isLoading ? (
        <div
          aria-busy="true"
          aria-label="Loading generated raffle order"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
          <span>Loading list...</span>
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : hasGeneratedGeneration && generatedList.length === 0 ? (
        <p className="text-sm text-muted-foreground">No racers.</p>
      ) : generatedList.length === 0 ? (
        <p className="text-sm text-muted-foreground">No prize list has been generated.</p>
      ) : (
        <div>
          <p className="relative z-30 text-sm font-medium">
            {formatPrizeListSummary(assignedPrizeCount, generatedList.length)}
          </p>
          <div className="sticky top-0 z-20 bg-background pt-4 lg:top-16 lg:before:absolute lg:before:inset-x-0 lg:before:bottom-full lg:before:h-16 lg:before:bg-background">
            <div className="h-2 rounded-t-md border-x border-t bg-muted" />
          </div>
          <div className="overflow-clip rounded-b-md border-x border-b">
            <table className="w-full text-sm">
              <thead className="sticky top-6 lg:top-22 z-10 bg-muted text-xs font-medium uppercase tracking-wide whitespace-nowrap text-muted-foreground">
                <tr>
                  <th className="w-px px-3 pb-2 text-center" scope="col">
                    Bib #
                  </th>
                  <th className="w-1/2 px-3 pb-2 text-center" scope="col">
                    Prize
                  </th>
                  <th className="w-px px-3 pb-2 text-center" scope="col">
                    Prize #
                  </th>
                  <th className="w-1/2 px-3 pb-2 text-center" scope="col">
                    Redeemed
                  </th>
                </tr>
              </thead>
              <tbody>
                {generatedList.map((entry, index) => (
                  <tr className={index % 2 === 0 ? "bg-background" : "bg-muted/40"} key={entry.position}>
                    <td className="px-3 py-2.5 text-center font-mono">
                      {entry.bibNumber === null ? "-" : formatPaddedNumber(entry.bibNumber, highestBibNumber)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <StatusIcon status={entry.prizeType ? "check" : "minus"} />
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono">
                      {entry.prizeNumber === null ? "-" : formatPaddedNumber(entry.prizeNumber, totalPrizes)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {entry.bibNumber === null || !entry.prizeType ? (
                        <StatusIcon status="minus" />
                      ) : (
                        <StatusIcon status={entry.redeemedAt ? "check" : "x"} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
