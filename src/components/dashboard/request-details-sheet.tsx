
"use client";

import type { ProcurementRequest } from "@/lib/data";
import { useAuth } from "@/contexts/auth-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RequestStatusStepper } from "./request-status-stepper";

interface RequestDetailsSheetProps {
  request: ProcurementRequest;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function RequestDetailsSheet({
  request,
  isOpen,
  onOpenChange,
}: RequestDetailsSheetProps) {

  const { allUsers } = useAuth();
  const submittedByUser = allUsers.find(u => u.id === request.submittedBy);
  const totalCost = (request.pricePerUnit ?? 0) * request.quantity;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-[90vw] p-0">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            <SheetHeader className="mb-2">
              <SheetTitle className="text-2xl text-gradient">Request Details</SheetTitle>
              <SheetDescription className="text-sm">
                <span className="text-muted-foreground">ID:</span>{" "}
                <span className="font-medium">{request.id}</span>
              </SheetDescription>
            </SheetHeader>

            {/* Item details and Justification ordered with Item first, then Justification */}
            <div className="space-y-4">
              <div className="p-4 rounded-custom border bg-card shadow-custom-sm">
                <h3 className="font-semibold mb-3">Item Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">{request.category}</p>
                  <p className="text-muted-foreground">Item Name</p>
                  <p className="font-medium">{request.itemName}</p>
                  <p className="text-muted-foreground">Quantity</p>
                  <p className="font-medium">
                    {request.quantity.toLocaleString()}
                  </p>
                  {request.pricePerUnit !== undefined && (
                    <>
                      <p className="text-muted-foreground">Price/unit</p>
                      <p className="font-medium">
                        ₹{request.pricePerUnit.toLocaleString()}
                      </p>
                      <p className="text-muted-foreground">Total Cost</p>
                      <p className="font-semibold">
                        ₹{totalCost.toLocaleString()}
                      </p>
                    </>
                  )}
                  <p className="text-muted-foreground">Priority</p>
                  <p className="font-medium">{request.priority}</p>
                  <p className="text-muted-foreground">Submitted By</p>
                  <p className="font-medium">
                    {submittedByUser?.name || "Unknown"}
                  </p>
                  <p className="text-muted-foreground">Date Submitted</p>
                  <p className="font-medium">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-custom border bg-card shadow-custom-sm">
                <h3 className="font-semibold mb-3">Justification</h3>
                <p className="text-sm text-foreground bg-secondary rounded-custom p-3 shadow-custom-sm">
                  {request.justification}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-custom border bg-card shadow-custom-sm">
              <h3 className="font-semibold mb-4">Request Status</h3>
              <RequestStatusStepper
                currentStatus={request.status}
                auditLog={request.auditLog}
              />
            </div>

            <div className="p-4 rounded-custom border bg-card shadow-custom-sm">
              <h3 className="font-semibold mb-4">Request Log</h3>
              <div className="space-y-4">
                {request.auditLog.map((log, index) => (
                  <div key={index} className="flex items-start gap-4 text-sm">
                    <div className="font-medium shrink-0 whitespace-nowrap text-muted-foreground">
                      {new Date(log.date).toLocaleString()}
                    </div>
                    <div className="flex flex-col">
                      <p>
                        <span className="font-semibold">{log.user}</span>{" "}
                        {log.action.toLowerCase()}.
                      </p>
                      {log.comment && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          "{log.comment}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
