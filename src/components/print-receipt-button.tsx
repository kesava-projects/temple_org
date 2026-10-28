"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintReceiptButton() {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      className="text-xs print:hidden gap-1.5"
    >
      <Printer className="h-3.5 w-3.5 text-amber-700" />
      Print / Save PDF Receipt
    </Button>
  );
}
