"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BibNumberRangeForm } from "@/components/admin/bib-number-range-form";
import { RacerStatusListGeneratorForm } from "@/components/admin/racer-status-list-generator-form";
import { QrScanStats } from "@/components/admin/qr-scan-stats";
import { RacerStatusList } from "@/components/admin/racer-status-list";
import { GeneratorValues, GenerationTimestamps, QrScanStatsData, RaffleListEntry } from "@/components/admin/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function distributePrizesEvenly(prizeCount: number, totalSlots: number) {
  let distributed: ("prize" | null)[] = new Array(totalSlots).fill(null);

  if (prizeCount === 0) {
    return distributed;
  }

  if (prizeCount >= totalSlots) {
    distributed = distributed.fill("prize");
    return distributed;
  }

  for (let i = 1; i <= prizeCount; i += 1) {
    // Divide array into equal slots and place prizes at touching boundaries
    const position = Math.round(i * ((totalSlots + 1) / (prizeCount + 1))) - 1;
    distributed[position] = "prize";
  }

  return distributed;
}

function shuffleDistributedPrizes(list: ("prize" | null)[], swapProbability = 0.5): ("prize" | null)[] {
  const shuffled = [...list];

  for (let i = 0; i < shuffled.length - 1; i++) {
    // shuffle when adjacent positions are different and determine by swap probability
    if (shuffled[i] !== shuffled[i + 1] && Math.random() < swapProbability) {
      [shuffled[i], shuffled[i + 1]] = [shuffled[i + 1], shuffled[i]]; // array destructuring swap
      i++; // skip slot just swapped so it doesn't get swapped again
    }
  }

  return shuffled;
}

const ADMIN_TABS = ["setup", "list", "qr"] as const;
type AdminTab = (typeof ADMIN_TABS)[number];

function isAdminTab(value: string | null): value is AdminTab {
  return ADMIN_TABS.includes(value as AdminTab);
}

export default function AdminPage() {
  return (
    <Suspense>
      <AdminPageContent />
    </Suspense>
  );
}

function AdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = isAdminTab(tabParam) ? tabParam : "setup";
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
  const [qrScanStats, setQrScanStats] = useState<QrScanStatsData | null>(null);
  const [qrScanStatsError, setQrScanStatsError] = useState("");
  const [isLoadingQrScanStats, setIsLoadingQrScanStats] = useState(true);

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

  useEffect(() => {
    let isCurrent = true;

    async function loadQrScanStats() {
      try {
        const response = await fetch("/api/admin/qr-scans");
        if (!response.ok) {
          throw new Error("Unable to load QR scan stats.");
        }

        const result = (await response.json()) as QrScanStatsData;
        if (isCurrent) {
          setQrScanStats(result);
        }
      } catch (loadError) {
        if (isCurrent) {
          setQrScanStatsError(loadError instanceof Error ? loadError.message : "Unable to load QR scan stats.");
        }
      } finally {
        if (isCurrent) {
          setIsLoadingQrScanStats(false);
        }
      }
    }

    void loadQrScanStats();

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

  function changeTab(tab: string) {
    if (!isAdminTab(tab)) {
      return;
    }

    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
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
    const distributedPrizes = distributePrizesEvenly(prizeSlots, numericValues.racers);
    const shuffledPrizes = shuffleDistributedPrizes(distributedPrizes);
    const generatedEntries = shuffledPrizes.map((prize, index) => ({
      position: index + 1,
      prizeType: prize,
      bibNumber: null,
      redeemedAt: null,
    }));
    setIsSaving(true);
    setListError("");
    changeTab("list");

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

  const hasRacerStatusListChanges =
    savedValues === null || values.prizes !== savedValues.prizes || values.racers !== savedValues.racers;
  const hasBibNumberChanges =
    savedValues === null ||
    values.lowestBibNumber !== savedValues.lowestBibNumber ||
    values.highestBibNumber !== savedValues.highestBibNumber;

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto w-full max-w-2xl space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>

        <Tabs className="space-y-8" onValueChange={changeTab} value={activeTab}>
          <TabsList>
            <TabsTrigger value="setup">Race Setup</TabsTrigger>
            <TabsTrigger value="list">Racer Status List</TabsTrigger>
            <TabsTrigger value="qr">QR Scans</TabsTrigger>
          </TabsList>

          <TabsContent className="space-y-8" value="setup">
            <BibNumberRangeForm
              bibLastSavedAt={timestamps?.bibLastSavedAt ?? null}
              error={bibError}
              hasChanges={hasBibNumberChanges}
              isLoading={isLoading}
              isSaving={isSaving}
              isSavingBib={isSavingBib}
              onChange={updateValue}
              onSubmit={saveBibNumberRange}
              values={values}
            />
            <RacerStatusListGeneratorForm
              error={listError}
              generatedAt={timestamps?.generatedAt}
              hasChanges={hasRacerStatusListChanges}
              isLoading={isLoading}
              isGeneratingList={isSaving}
              isSavingBib={isSavingBib}
              onChange={updateValue}
              onSubmit={generateList}
              values={values}
            />
          </TabsContent>

          <TabsContent value="list">
            <RacerStatusList
              generatedList={generatedList}
              hasGeneratedGeneration={hasGeneratedGeneration}
              isLoading={isLoading || isSaving}
            />
          </TabsContent>

          <TabsContent value="qr">
            <QrScanStats error={qrScanStatsError} isLoading={isLoadingQrScanStats} stats={qrScanStats} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
