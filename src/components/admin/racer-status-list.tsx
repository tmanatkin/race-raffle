import { Check, Minus, X } from "lucide-react";
import { RaffleListEntry } from "@/components/admin/types";

type RacerStatusListProps = {
  isLoading: boolean;
  hasGeneratedGeneration: boolean;
  generatedList: RaffleListEntry[];
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

export function RacerStatusList({ isLoading, hasGeneratedGeneration, generatedList }: RacerStatusListProps) {
  return (
    <section aria-label="Racer status list" className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Racer Status List</h2>
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
      ) : hasGeneratedGeneration && generatedList.length === 0 ? (
        <p className="text-sm text-muted-foreground">No racers.</p>
      ) : generatedList.length === 0 ? (
        <p className="text-sm text-muted-foreground">No racer status list has been generated.</p>
      ) : (
        <div className="max-h-96 overflow-y-auto rounded-md border">
          <table className="w-full table-fixed text-sm">
            <thead className="sticky top-0 z-10 bg-muted text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-1/3 px-4 py-2 text-left" scope="col">
                  Bib #
                </th>
                <th className="w-1/3 px-4 py-2 text-left" scope="col">
                  Prize
                </th>
                <th className="w-1/3 px-4 py-2 text-left" scope="col">
                  Redeemed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {generatedList.map((entry, index) => (
                <tr className={index % 2 === 0 ? "bg-background" : "bg-muted/40"} key={entry.position}>
                  <td className="px-4 py-3 text-left">{entry.bibNumber ?? "-"}</td>
                  <td className="px-4 py-3">
                    <StatusIcon status={entry.prizeType ? "check" : "minus"} />
                  </td>
                  <td className="px-4 py-3">
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
      )}
    </section>
  );
}
