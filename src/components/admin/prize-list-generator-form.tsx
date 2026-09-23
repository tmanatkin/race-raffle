import { SubmitEvent, useRef, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GeneratorValues, formatPrizeListSummary, formatTimestamp } from "@/components/admin/types";

type PrizeListGeneratorFormProps = {
  values: Pick<GeneratorValues, "prizes" | "racers">;
  bibRangeSize: number | null;
  hasChanges: boolean;
  isLoading: boolean;
  isGeneratingList: boolean;
  isSavingBib: boolean;
  generatedAt: string | null | undefined;
  error: string;
  loadError: string;
  onChange: (field: "prizes" | "racers", value: string) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
};

export function PrizeListGeneratorForm({
  values,
  bibRangeSize,
  hasChanges,
  isLoading,
  isGeneratingList,
  isSavingBib,
  generatedAt,
  error,
  loadError,
  onChange,
  onSubmit,
}: PrizeListGeneratorFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Summary and warnings shown in the confirmation so typos in the counts are easy to spot before generating.
  const prizes = values.prizes;
  const racers = values.racers;
  const hasValidCounts =
    typeof prizes === "number" &&
    Number.isInteger(prizes) &&
    prizes >= 0 &&
    typeof racers === "number" &&
    Number.isInteger(racers) &&
    racers >= 0;
  const hasMoreRacersThanBibs = hasValidCounts && bibRangeSize !== null && racers > bibRangeSize;
  const hasMorePrizesThanRacers = hasValidCounts && prizes > racers;

  if (!isLoading && loadError) {
    return (
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Prize List Generator</h2>
          <p className="text-sm text-muted-foreground">Set the parameters used to generate the prize list.</p>
        </div>
        <p className="text-sm text-destructive">{loadError}</p>
      </section>
    );
  }

  return (
    <form ref={formRef} className="space-y-6" onSubmit={onSubmit}>
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Prize List Generator</h2>
          <p className="text-sm text-muted-foreground">Set the parameters used to generate the prize list.</p>
        </div>
        {hasChanges && !isLoading ? <p className="text-xs font-medium text-amber-700">Unsaved changes</p> : null}
        <div className="space-y-2">
          <Label htmlFor="prizes">Total number of prizes</Label>
          <Input
            id="prizes"
            autoComplete="off"
            disabled={isLoading || isGeneratingList}
            inputMode="numeric"
            min="0"
            onChange={(event) => onChange("prizes", event.target.value)}
            placeholder={isLoading ? "-" : undefined}
            step="1"
            type="number"
            value={isLoading ? "" : values.prizes}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="racers">Total number of people racing</Label>
          <Input
            id="racers"
            autoComplete="off"
            disabled={isLoading || isGeneratingList}
            inputMode="numeric"
            min="0"
            onChange={(event) => onChange("racers", event.target.value)}
            placeholder={isLoading ? "-" : undefined}
            step="1"
            type="number"
            value={isLoading ? "" : values.racers}
          />
        </div>
        <div className="flex items-center gap-3">
          <AlertDialog onOpenChange={setIsConfirmOpen} open={isConfirmOpen}>
            <Button
              disabled={isLoading || isGeneratingList || isSavingBib || !hasChanges}
              onClick={() => setIsConfirmOpen(true)}
              type="button"
            >
              {isGeneratingList ? "Generating..." : "Generate"}
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will replace any existing prize list. This action cannot be undone.
                </AlertDialogDescription>
                {hasValidCounts ? (
                  <p className="text-sm font-medium">{formatPrizeListSummary(prizes, racers)}</p>
                ) : null}
                {hasMoreRacersThanBibs ? (
                  <p className="text-sm font-medium text-amber-700">
                    There are more racers than bib numbers in the saved bib range ({bibRangeSize}). Double-check the
                    racer count and bib range.
                  </p>
                ) : null}
                {hasMorePrizesThanRacers ? (
                  <p className="text-sm font-medium text-amber-700">
                    There are more prizes than racers. Only {racers} {racers === 1 ? "prize" : "prizes"} will be
                    assigned.
                  </p>
                ) : null}
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setIsConfirmOpen(false);
                    formRef.current?.requestSubmit();
                  }}
                >
                  Generate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {isLoading ? (
            <span aria-busy="true" className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
              Loading last generated time...
            </span>
          ) : (
            <p className="text-xs text-muted-foreground">Last generated: {formatTimestamp(generatedAt ?? null)}</p>
          )}
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </section>
    </form>
  );
}
