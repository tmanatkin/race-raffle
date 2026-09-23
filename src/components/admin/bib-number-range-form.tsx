import { SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GeneratorValues, formatTimestamp } from "@/components/admin/types";

type BibNumberRangeFormProps = {
  values: Pick<GeneratorValues, "lowestBibNumber" | "highestBibNumber">;
  hasChanges: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isSavingBib: boolean;
  bibLastSavedAt: string | null;
  error: string;
  loadError: string;
  onChange: (field: "lowestBibNumber" | "highestBibNumber", value: string) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
};

export function BibNumberRangeForm({
  values,
  hasChanges,
  isLoading,
  isSaving,
  isSavingBib,
  bibLastSavedAt,
  error,
  loadError,
  onChange,
  onSubmit,
}: BibNumberRangeFormProps) {
  if (!isLoading && loadError) {
    return (
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Bib Number Range</h2>
          <p className="text-sm text-muted-foreground">Set the range of bib numbers used in the race.</p>
        </div>
        <p className="text-sm text-destructive">{loadError}</p>
      </section>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Bib Number Range</h2>
          <p className="text-sm text-muted-foreground">Set the range of bib numbers used in the race.</p>
        </div>
        {hasChanges && !isLoading ? <p className="text-xs font-medium text-amber-700">Unsaved changes</p> : null}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lowest-bib-number">Lowest</Label>
            <Input
              id="lowest-bib-number"
              autoComplete="off"
              disabled={isLoading || isSaving || isSavingBib}
              inputMode="numeric"
              min="0"
              onChange={(event) => onChange("lowestBibNumber", event.target.value)}
              placeholder={isLoading ? "-" : undefined}
              step="1"
              type="number"
              value={isLoading ? "" : values.lowestBibNumber}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="highest-bib-number">Highest</Label>
            <Input
              id="highest-bib-number"
              autoComplete="off"
              disabled={isLoading || isSaving || isSavingBib}
              inputMode="numeric"
              min="0"
              onChange={(event) => onChange("highestBibNumber", event.target.value)}
              placeholder={isLoading ? "-" : undefined}
              step="1"
              type="number"
              value={isLoading ? "" : values.highestBibNumber}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button disabled={isLoading || isSaving || isSavingBib || !hasChanges} type="submit">
            {isSavingBib ? "Saving..." : "Save"}
          </Button>
          {isLoading ? (
            <span aria-busy="true" className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
              Loading last saved time...
            </span>
          ) : (
            <p className="text-xs text-muted-foreground">Last saved: {formatTimestamp(bibLastSavedAt)}</p>
          )}
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </section>
    </form>
  );
}
