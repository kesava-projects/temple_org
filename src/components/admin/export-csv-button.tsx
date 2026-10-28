"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { exportBookingsCsvAction } from "@/server/bookings/actions";
import { Download, Loader2 } from "lucide-react";

export function ExportCsvButton() {
  const [isPending, startTransition] = useTransition();

  const handleExport = () => {
    startTransition(async () => {
      const res = await exportBookingsCsvAction();
      if (res.success && res.csv) {
        // Download CSV blob
        const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `temple_bookings_export_${new Date().toISOString().split("T")[0]}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        alert(res.error || "Failed to export bookings CSV");
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isPending}
      className="text-xs h-8 gap-1.5 border-stone-300"
    >
      {isPending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="h-3.5 w-3.5 text-amber-700" />
          Export CSV
        </>
      )}
    </Button>
  );
}
