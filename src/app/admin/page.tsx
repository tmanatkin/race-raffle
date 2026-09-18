"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PrizeType = "prize" | null;

type RaffleListEntry = {
  position: number;
  prizeType: PrizeType;
  bibNumber: number | null;
  redeemedAt: string | null;
};

type GeneratorValues = {
  prizes: number | "";
  racers: number | "";
  lowestBibNumber: number | "";
  highestBibNumber: number | "";
};

type GenerationTimestamps = {
  generatedAt: string;
  bibLastSavedAt: string | null;
};

function formatTimestamp(timestamp: string | null) {
  if (!timestamp) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(timestamp));
}

function shuffle<T>(items: T[]) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

export default function AdminPage() {
  const [values, setValues] = useState<GeneratorValues>({
    prizes: 1,
    racers: 1,
    lowestBibNumber: 0,
    highestBibNumber: 1,
  });
  const [savedValues, setSavedValues] = useState<GeneratorValues | null>(null);
  const [generatedList, setGeneratedList] = useState<RaffleListEntry[]>([]);
  const [hasGeneratedGeneration, setHasGeneratedGeneration] = useState(false);
  const [timestamps, setTimestamps] = useState<GenerationTimestamps | null>(null);
  const [listError, setListError] = useState("");
  const [bibError, setBibError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingBib, setIsSavingBib] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function loadSavedGeneration() {
      try {
        const response = await fetch("/api/admin/raffle-entries");
        if (!response.ok) {
          throw new Error("Unable to load the saved raffle.");
        }

        const result = (await response.json()) as {
          generation: (GeneratorValues & GenerationTimestamps) | null;
          bibSettings?: {
            lowestBibNumber: number;
            highestBibNumber: number;
            bibLastSavedAt: string | null;
          };
          entries: RaffleListEntry[];
        };

        if (isCurrent && result.generation) {
          setValues(result.generation);
          setSavedValues(result.generation);
          setGeneratedList(result.entries);
          setHasGeneratedGeneration(true);
          setTimestamps({
            generatedAt: result.generation.generatedAt,
            bibLastSavedAt: result.generation.bibLastSavedAt,
          });
        } else if (isCurrent && result.bibSettings) {
          const emptyGenerationValues = {
            prizes: "" as const,
            racers: "" as const,
            lowestBibNumber: result.bibSettings.lowestBibNumber,
            highestBibNumber: result.bibSettings.highestBibNumber,
          };
          setValues(emptyGenerationValues);
          setSavedValues(emptyGenerationValues);
          setTimestamps({ generatedAt: "", bibLastSavedAt: result.bibSettings.bibLastSavedAt });
        }
      } catch (loadError) {
        if (isCurrent) {
          setListError(loadError instanceof Error ? loadError.message : "Unable to load the saved raffle.");
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadSavedGeneration();

    return () => {
      isCurrent = false;
    };
  }, []);

  function updateValue(field: keyof GeneratorValues, value: string) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value === "" ? "" : Number(value),
    }));
  }

  async function generateList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericValues = {
      prizes: values.prizes === "" ? NaN : values.prizes,
      racers: values.racers === "" ? NaN : values.racers,
    };

    if (!Object.values(numericValues).every((value) => Number.isInteger(value) && value >= 0)) {
      setListError("All values must be whole numbers and cannot be negative.");
      return;
    }

    const prizeSlots = Math.min(numericValues.prizes, numericValues.racers);
    const prizes: PrizeType[] = [
      ...Array<PrizeType>(prizeSlots).fill("prize"),
      ...Array<PrizeType>(numericValues.racers - prizeSlots).fill(null),
    ];

    const shuffledPrizes = shuffle(prizes);
    const generatedEntries = shuffledPrizes.map((prize, index) => ({
      position: index + 1,
      prizeType: prize,
      bibNumber: null,
      redeemedAt: null,
    }));
    setIsSaving(true);
    setListError("");

    try {
      const response = await fetch("/api/admin/raffle-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generation: numericValues,
          entries: shuffledPrizes.map((prize, index) => ({
            position: index + 1,
            prizeType: prize,
          })),
        }),
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "Unable to save the generated list.");
      }

      const result = (await response.json()) as Pick<GenerationTimestamps, "generatedAt">;
      setGeneratedList(generatedEntries);
      setHasGeneratedGeneration(true);
      setTimestamps((currentTimestamps) => ({
        generatedAt: result.generatedAt,
        bibLastSavedAt: currentTimestamps?.bibLastSavedAt ?? null,
      }));
      setSavedValues({
        prizes: numericValues.prizes,
        racers: numericValues.racers,
        lowestBibNumber: savedValues?.lowestBibNumber ?? values.lowestBibNumber,
        highestBibNumber: savedValues?.highestBibNumber ?? values.highestBibNumber,
      });
    } catch (saveError) {
      setListError(saveError instanceof Error ? saveError.message : "Unable to save the generated list.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveBibNumberRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const lowestBibNumber = values.lowestBibNumber;
    const highestBibNumber = values.highestBibNumber;

    if (
      lowestBibNumber === "" ||
      !Number.isInteger(lowestBibNumber) ||
      lowestBibNumber < 0 ||
      highestBibNumber === "" ||
      !Number.isInteger(highestBibNumber) ||
      highestBibNumber < 0
    ) {
      setBibError("The bib number range must be whole numbers of at least 0.");
      return;
    }

    if (lowestBibNumber > highestBibNumber) {
      setBibError("The lowest bib number cannot be greater than the highest.");
      return;
    }

    setIsSavingBib(true);
    setBibError("");

    try {
      const response = await fetch("/api/admin/raffle-entries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lowestBibNumber, highestBibNumber }),
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "Unable to save the bib number range.");
      }

      const result = (await response.json()) as { bibLastSavedAt: string | null };
      setTimestamps((currentTimestamps) =>
        currentTimestamps ? { ...currentTimestamps, bibLastSavedAt: result.bibLastSavedAt } : null
      );
      setSavedValues((currentValues) =>
        currentValues
          ? { ...currentValues, lowestBibNumber, highestBibNumber }
          : { prizes: "", racers: "", lowestBibNumber, highestBibNumber }
      );
    } catch (saveError) {
      setBibError(saveError instanceof Error ? saveError.message : "Unable to save the bib number range.");
    } finally {
      setIsSavingBib(false);
    }
  }

  const hasPrizeListChanges =
    savedValues === null || values.prizes !== savedValues.prizes || values.racers !== savedValues.racers;
  const hasBibNumberChanges =
    savedValues === null ||
    values.lowestBibNumber !== savedValues.lowestBibNumber ||
    values.highestBibNumber !== savedValues.highestBibNumber;

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="text-muted-foreground">Generate a predetermined raffle order.</p>
        </div>

        <form className="space-y-4" onSubmit={saveBibNumberRange}>
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Bib Number Range</h2>
              <p className="text-sm text-muted-foreground">Set the range of bib numbers used in the race.</p>
            </div>
            {hasBibNumberChanges && !isLoading ? (
              <p className="text-xs font-medium text-amber-700">Unsaved changes</p>
            ) : null}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lowest-bib-number">Lowest</Label>
                <Input
                  id="lowest-bib-number"
                  disabled={isLoading || isSaving || isSavingBib}
                  min="0"
                  onChange={(event) => updateValue("lowestBibNumber", event.target.value)}
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
                  disabled={isLoading || isSaving || isSavingBib}
                  min="0"
                  onChange={(event) => updateValue("highestBibNumber", event.target.value)}
                  placeholder={isLoading ? "-" : undefined}
                  step="1"
                  type="number"
                  value={isLoading ? "" : values.highestBibNumber}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button disabled={isLoading || isSaving || isSavingBib || !hasBibNumberChanges} type="submit">
                {isSavingBib ? "Saving..." : "Save"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Last saved: {formatTimestamp(timestamps?.bibLastSavedAt ?? null)}
              </p>
            </div>
            {bibError ? <p className="text-sm text-destructive">{bibError}</p> : null}
          </section>
        </form>

        <form className="space-y-6" onSubmit={generateList}>
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Prize List Generator</h2>
              <p className="text-sm text-muted-foreground">Set the parameters used to generate the prize list.</p>
            </div>
            {hasPrizeListChanges && !isLoading ? (
              <p className="text-xs font-medium text-amber-700">Unsaved changes</p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="prizes">Total number of prizes</Label>
              <Input
                id="prizes"
                disabled={isLoading || isSaving}
                min="0"
                onChange={(event) => updateValue("prizes", event.target.value)}
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
                disabled={isLoading || isSaving}
                min="0"
                onChange={(event) => updateValue("racers", event.target.value)}
                placeholder={isLoading ? "-" : undefined}
                step="1"
                type="number"
                value={isLoading ? "" : values.racers}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button disabled={isLoading || isSaving || isSavingBib || !hasPrizeListChanges} type="submit">
                {isSaving ? "Saving list..." : "Generate"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Last generated: {formatTimestamp(timestamps?.generatedAt ?? null)}
              </p>
            </div>
            {listError ? <p className="text-sm text-destructive">{listError}</p> : null}
          </section>
        </form>

        {isLoading ? (
          <section
            aria-busy="true"
            aria-label="Loading generated raffle order"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
            <span>Loading generated order...</span>
          </section>
        ) : hasGeneratedGeneration && generatedList.length === 0 ? (
          <section aria-label="Prize list" className="space-y-3">
            <h2 className="text-lg font-semibold">Racer Prize List</h2>
            <p className="text-sm text-muted-foreground">No racers.</p>
          </section>
        ) : generatedList.length > 0 ? (
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
                        entry.prizeType
                          ? "bg-emerald-50/60 dark:bg-emerald-950/20"
                          : "bg-muted/20 text-muted-foreground"
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
        ) : null}
      </div>
    </main>
  );
}
