import { CheckCircle2, XCircle } from "lucide-react";
import { RaffleListEntry } from "@/components/admin/types";

type RacerPrizeListProps = {
  isLoading: boolean;
  hasGeneratedGeneration: boolean;
  generatedList: RaffleListEntry[];
};

export function RacerPrizeList({ isLoading, hasGeneratedGeneration, generatedList }: RacerPrizeListProps) {
  if (isLoading) {
    return (
      <section
        aria-busy="true"
        aria-label="Loading generated raffle order"
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
        <span>Loading generated order...</span>
      </section>
    );
  }

  if (hasGeneratedGeneration && generatedList.length === 0) {
    return (
      <section aria-label="Prize list" className="space-y-3">
        <h2 className="text-lg font-semibold">Racer Prize List</h2>
        <p className="text-sm text-muted-foreground">No racers.</p>
      </section>
    );
  }

  if (generatedList.length === 0) {
    return null;
  }

  return (
    <section aria-label="Prize list" className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Racer Prize List</h2>
        <p className="text-sm text-muted-foreground">Prizes will be assigned in this order.</p>
      </div>
      <div className="max-h-96 overflow-y-auto rounded-md border">
        <table className="w-full table-fixed text-sm">
          <thead className="sticky top-0 z-10 bg-muted text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-1/4 px-4 py-2 text-left" scope="col">
                Position
              </th>
              <th className="w-1/4 px-4 py-2 text-left" scope="col">
                Result
              </th>
              <th className="w-1/4 px-4 py-2 text-left" scope="col">
                Bib #
              </th>
              <th className="w-1/4 px-4 py-2 text-left" scope="col">
                Redeemed
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {generatedList.map((entry) => (
              <tr
                className={
                  entry.prizeType ? "bg-emerald-50/60 dark:bg-emerald-950/20" : "bg-muted/20 text-muted-foreground"
                }
                key={entry.position}
              >
                <td className="px-4 py-3">{entry.position}</td>
                <td
                  className={
                    entry.prizeType ? "px-4 py-3 font-medium text-emerald-800 dark:text-emerald-300" : "px-4 py-3"
                  }
                >
                  {entry.prizeType ? "Prize" : "No prize"}
                </td>
                <td className="px-4 py-3 text-left">{entry.bibNumber ?? "-"}</td>
                <td className="px-4 py-3">
                  <div>
                    {entry.bibNumber === null || !entry.prizeType ? (
                      "-"
                    ) : entry.redeemedAt ? (
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
