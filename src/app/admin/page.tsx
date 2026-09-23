"use client";

import { SubmitEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BibNumberRangeForm } from "@/components/admin/bib-number-range-form";
import { PrizeListGeneratorForm } from "@/components/admin/prize-list-generator-form";
import { QrScanStats } from "@/components/admin/qr-scan-stats";
import { PrizeList } from "@/components/admin/prize-list";
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

function shuffleArray<T>(list: T[]): T[] {
  const shuffled = [...list];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function assignPrizeNumbers(prizeSlots: ("prize" | null)[], prizeCount: number): (number | null)[] {
  const availablePrizeNumbers = shuffleArray(Array.from({ length: prizeCount }, (_, index) => index + 1));

  let nextPrizeNumberIndex = 0;
  return prizeSlots.map((slot) => {
    if (slot !== "prize") {
      return null;
    }

    const prizeNumber = availablePrizeNumbers[nextPrizeNumberIndex];
    nextPrizeNumberIndex += 1;
    return prizeNumber;
  });
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
  const [loadError, setLoadError] = useState("");
  const [generateError, setGenerateError] = useState("");
  const [bibError, setBibError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingBib, setIsSavingBib] = useState(false);
  const [isBibConfirmOpen, setIsBibConfirmOpen] = useState(false);
  const [qrScanStats, setQrScanStats] = useState<QrScanStatsData | null>(null);
  const [qrScanLoadError, setQrScanLoadError] = useState("");
  const [qrScanResetError, setQrScanResetError] = useState("");
  const [isLoadingQrScanStats, setIsLoadingQrScanStats] = useState(true);
  const [isResettingQrScanStats, setIsResettingQrScanStats] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function loadSavedGeneration() {
      try {
        const response = await fetch("/api/admin/raffle-entries");
        if (!response.ok) {
          throw new Error("Unable to load race setup information and prize list.");
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
          setLoadError(loadError instanceof Error ? loadError.message : "Unable to load the saved raffle.");
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
          setQrScanLoadError(loadError instanceof Error ? loadError.message : "Unable to load QR scan stats.");
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

  async function generateList(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericValues = {
      prizes: values.prizes === "" ? NaN : values.prizes,
      racers: values.racers === "" ? NaN : values.racers,
    };

    if (!Object.values(numericValues).every((value) => Number.isInteger(value) && value >= 0)) {
      setGenerateError("All values must be whole numbers and cannot be negative.");
      return;
    }

    const prizeSlots = Math.min(numericValues.prizes, numericValues.racers);
    const distributedPrizes = distributePrizesEvenly(prizeSlots, numericValues.racers);
    const shuffledPrizes = shuffleDistributedPrizes(distributedPrizes);
    const prizeNumbers = assignPrizeNumbers(shuffledPrizes, prizeSlots);
    const generatedEntries = shuffledPrizes.map((prize, index) => ({
      position: index + 1,
      prizeType: prize,
      prizeNumber: prizeNumbers[index],
      bibNumber: null,
      redeemedAt: null,
    }));
    setIsSaving(true);
    setGenerateError("");
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
            prizeNumber: prizeNumbers[index],
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
      setGenerateError(saveError instanceof Error ? saveError.message : "Unable to save the generated list.");
    } finally {
      setIsSaving(false);
    }
  }

  function validateBibNumberRange(): { lowestBibNumber: number; highestBibNumber: number } | null {
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
      return null;
    }

    if (lowestBibNumber > highestBibNumber) {
      setBibError("The lowest bib number cannot be greater than the highest.");
      return null;
    }

    return { lowestBibNumber, highestBibNumber };
  }

  // Fetches the latest list rather than using the loaded one, since the admin page may have been
  // open since before any racers checked in.
  async function hasCheckedInBibs() {
    const response = await fetch("/api/admin/raffle-entries");
    if (!response.ok) {
      throw new Error("Unable to check whether any bib numbers have been entered.");
    }

    const result = (await response.json()) as { entries: RaffleListEntry[] };
    return result.entries.some((entry) => entry.bibNumber !== null);
  }

  async function submitBibNumberRange(lowestBibNumber: number, highestBibNumber: number) {
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
  }

  async function saveBibNumberRange(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const range = validateBibNumberRange();
    if (range === null) {
      return;
    }

    setIsSavingBib(true);
    setBibError("");

    try {
      // Once racers have started checking in, changing the range needs a confirmation first.
      if (await hasCheckedInBibs()) {
        setIsBibConfirmOpen(true);
        return;
      }

      await submitBibNumberRange(range.lowestBibNumber, range.highestBibNumber);
    } catch (saveError) {
      setBibError(saveError instanceof Error ? saveError.message : "Unable to save the bib number range.");
    } finally {
      setIsSavingBib(false);
    }
  }

  async function confirmSaveBibNumberRange() {
    setIsBibConfirmOpen(false);
    const range = validateBibNumberRange();
    if (range === null) {
      return;
    }

    setIsSavingBib(true);
    setBibError("");

    try {
      await submitBibNumberRange(range.lowestBibNumber, range.highestBibNumber);
    } catch (saveError) {
      setBibError(saveError instanceof Error ? saveError.message : "Unable to save the bib number range.");
    } finally {
      setIsSavingBib(false);
    }
  }

  async function resetQrScanStats() {
    setIsResettingQrScanStats(true);
    setQrScanResetError("");

    try {
      const response = await fetch("/api/admin/qr-scans", { method: "DELETE" });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "Unable to reset QR scan stats.");
      }

      const result = (await response.json()) as QrScanStatsData;
      setQrScanStats(result);
    } catch (resetError) {
      setQrScanResetError(resetError instanceof Error ? resetError.message : "Unable to reset QR scan stats.");
    } finally {
      setIsResettingQrScanStats(false);
    }
  }

  const hasPrizeListChanges =
    savedValues === null || values.prizes !== savedValues.prizes || values.racers !== savedValues.racers;
  const hasBibNumberChanges =
    savedValues === null ||
    values.lowestBibNumber !== savedValues.lowestBibNumber ||
    values.highestBibNumber !== savedValues.highestBibNumber;
  // Uses the saved range because that is what racers' bib numbers are validated against.
  const bibRangeSize =
    savedValues !== null &&
    typeof savedValues.lowestBibNumber === "number" &&
    typeof savedValues.highestBibNumber === "number"
      ? savedValues.highestBibNumber - savedValues.lowestBibNumber + 1
      : null;

  return (
    <main className="p-8">
      <div className="mx-auto w-full max-w-2xl space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-primary">Admin</h1>

        <Tabs className="space-y-8" onValueChange={changeTab} value={activeTab}>
          <TabsList>
            <TabsTrigger value="setup">Race Setup</TabsTrigger>
            <TabsTrigger value="list">Prize List</TabsTrigger>
            <TabsTrigger value="qr">QR Scans</TabsTrigger>
          </TabsList>

          <TabsContent className="space-y-8" value="setup">
            <BibNumberRangeForm
              bibLastSavedAt={timestamps?.bibLastSavedAt ?? null}
              error={bibError}
              hasChanges={hasBibNumberChanges}
              isConfirmOpen={isBibConfirmOpen}
              isLoading={isLoading}
              isSaving={isSaving}
              isSavingBib={isSavingBib}
              loadError={loadError}
              onChange={updateValue}
              onConfirm={confirmSaveBibNumberRange}
              onConfirmOpenChange={setIsBibConfirmOpen}
              onSubmit={saveBibNumberRange}
              values={values}
            />
            <PrizeListGeneratorForm
              bibRangeSize={bibRangeSize}
              error={generateError}
              generatedAt={timestamps?.generatedAt}
              hasChanges={hasPrizeListChanges}
              isLoading={isLoading}
              isGeneratingList={isSaving}
              isSavingBib={isSavingBib}
              loadError={loadError}
              onChange={updateValue}
              onSubmit={generateList}
              values={values}
            />
          </TabsContent>

          <TabsContent value="list">
            <PrizeList
              error={loadError}
              generatedList={generatedList}
              hasGeneratedGeneration={hasGeneratedGeneration}
              highestBibNumber={typeof savedValues?.highestBibNumber === "number" ? savedValues.highestBibNumber : 0}
              isLoading={isLoading || isSaving}
              totalPrizes={typeof savedValues?.prizes === "number" ? savedValues.prizes : 0}
            />
          </TabsContent>

          <TabsContent value="qr">
            <QrScanStats
              isLoading={isLoadingQrScanStats}
              isResetting={isResettingQrScanStats}
              loadError={qrScanLoadError}
              onReset={resetQrScanStats}
              resetError={qrScanResetError}
              stats={qrScanStats}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
