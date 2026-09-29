"use client";

import { useRef, useState } from "react";
import { Download, Upload, Trash2, ShieldCheck, Database, AlertTriangle, Printer, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useBackup, useRestore, useResetActuals, useProjection } from "./hooks";
import { formatKsh } from "@/lib/planner/engine";
import { cn } from "@/lib/utils";

export function BackupRestoreSection() {
  const backup = useBackup();
  const restore = useRestore();
  const resetActuals = useResetActuals();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data } = useProjection();
  const [dragOver, setDragOver] = useState(false);

  const trackedCount = data?.actuals.length ?? 0;

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return;
    restore.mutate(file);
  };

  return (
    <Card className="p-4 card-shadow">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Database className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold">Your data</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Back up your plan (settings, fees, tracked months) to a file, or restore from a previous backup. Your data stays on your device.
      </p>

      {/* Backup & Restore buttons */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => backup.mutate()}
          disabled={backup.isPending}
          // w-full + min-w-0 + whitespace-normal let labels like "Backing up…"
          // wrap cleanly inside the narrow phone column instead of pushing the
          // grid cell wider than the viewport.
          className="flex flex-col items-center gap-1 h-auto py-2.5 w-full min-w-0 whitespace-normal break-words"
        >
          <Download className="h-4 w-4 text-primary shrink-0" />
          <span className="text-[11px] font-medium leading-tight">
            {backup.isPending ? "Backing up…" : "Back up"}
          </span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={restore.isPending}
          className="flex flex-col items-center gap-1 h-auto py-2.5 w-full min-w-0 whitespace-normal break-words"
        >
          <Upload className="h-4 w-4 text-primary shrink-0" />
          <span className="text-[11px] font-medium leading-tight">
            {restore.isPending ? "Restoring…" : "Restore"}
          </span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open("/print", "_blank")}
          className="flex flex-col items-center gap-1 h-auto py-2.5 w-full min-w-0 whitespace-normal break-words"
        >
          <Printer className="h-4 w-4 text-primary shrink-0" />
          <span className="text-[11px] font-medium leading-tight">Print PDF</span>
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          handleFileSelect(file);
          e.target.value = ""; // allow re-selecting same file
        }}
      />

      {/* Drag-drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          handleFileSelect(file);
        }}
        className={cn(
          "rounded-lg border-2 border-dashed p-3 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border/60 bg-muted/30",
        )}
      >
        <ShieldCheck className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
        <p className="text-[10px] text-muted-foreground">
          Drag & drop a backup file here, or tap Restore above
        </p>
      </div>

      {/* Tracked months count + reset */}
      <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {trackedCount} month{trackedCount !== 1 ? "s" : ""} tracked
          </span>
        </div>
        {trackedCount > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-3 w-3 mr-1" />
                Reset all
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Reset all tracked months?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently clear {trackedCount} tracked month{trackedCount !== 1 ? "s" : ""} of plan-vs-actual history. Your settings and fee schedule stay intact. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => resetActuals.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, reset all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </Card>
  );
}
