"use client";

import { formatTimestamp, QrScanStatsData } from "@/components/admin/types";

type QrScanStatsProps = {
  stats: QrScanStatsData | null;
  error: string;
  isLoading: boolean;
};

export function QrScanStats({ stats, error, isLoading }: QrScanStatsProps) {
  return (
    <section aria-label="QR scan stats" className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">QR Code Scans</h2>
        <p className="text-sm text-muted-foreground">Track how many times the race QR code has been scanned.</p>
      </div>
      {isLoading ? (
        <div aria-busy="true" className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
          <span>Loading scan stats...</span>
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 rounded-md border p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Scans</p>
            <p className="text-2xl font-semibold">{stats?.totalScans ?? 0}</p>
          </div>
          <div className="space-y-1 rounded-md border p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Last Scan</p>
            <p className="text-sm font-medium">{formatTimestamp(stats?.latestScanAt ?? null)}</p>
          </div>
        </div>
      )}
    </section>
  );
}
