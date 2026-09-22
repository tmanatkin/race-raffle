"use client";

import { useState } from "react";
import { formatTimestamp, QrScanStatsData } from "@/components/admin/types";
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

type QrScanStatsProps = {
  stats: QrScanStatsData | null;
  error: string;
  isLoading: boolean;
  isResetting: boolean;
  onReset: () => void;
};

export function QrScanStats({ stats, error, isLoading, isResetting, onReset }: QrScanStatsProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <section aria-label="QR scan stats" className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">QR Code Scans</h2>
        <p className="text-sm text-muted-foreground">Track how many times the race QR code has been scanned.</p>
      </div>
      {isLoading ? (
        <div aria-busy="true" className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
          <span>Loading QR stats...</span>
        </div>
      ) : (
        <>
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
          <AlertDialog onOpenChange={setIsConfirmOpen} open={isConfirmOpen}>
            <Button
              disabled={isResetting || (stats?.totalScans ?? 0) === 0}
              onClick={() => setIsConfirmOpen(true)}
              type="button"
              variant="destructive"
            >
              {isResetting ? "Resetting..." : "Reset Scans"}
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all recorded QR code scans. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setIsConfirmOpen(false);
                    onReset();
                  }}
                >
                  Reset Scans
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </>
      )}
    </section>
  );
}
