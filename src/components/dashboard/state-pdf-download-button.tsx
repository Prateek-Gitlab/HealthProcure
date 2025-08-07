"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import type { ProcurementRequest } from "@/lib/data";
import { generateStatePdf } from "@/lib/pdf-generator";

interface StatePdfDownloadButtonProps {
  requests: ProcurementRequest[];
}

export function StatePdfDownloadButton({ requests }: StatePdfDownloadButtonProps) {
  const { user, allUsers } = useAuth();

  if (!user || user.role !== "state") return null;

  const handleClick = () => {
    if (!requests.length) return;
    generateStatePdf(requests, allUsers, user);
  };

  return (
    <Button variant="outline" onClick={handleClick} disabled={requests.length === 0}>
      <Download className="mr-2 h-4 w-4" />
      Download PDF
    </Button>
  );
}