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

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-[90vw] p-0">
        <ScrollArea className="h-full">
            <div className="p-6">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-2xl">Request Details</SheetTitle>
                    <SheetDescription>
                        ID: {request.id}
                    </SheetDescription>
                </SheetHeader>
                
                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold mb-2">Item Details</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <p className="text-muted-foreground">Category</p>
                            <p className="font-medium">{request.category}</p>
                            <p className="text-muted-foreground">Item Name</p>
                            <p className="font-medium">{request.itemName}</p>
                            <p className="text-muted-foreground">Quantity</p>
                            <p className="font-medium">{request.quantity.toLocaleString()}</p>
                            <p className="text-muted-foreground">Submitted By</p>
                            <p className="font-medium">{submittedByUser?.name || 'Unknown'}</p>
                            <p className="text-muted-foreground">Date Submitted</p>
                            <p className="font-medium">{new Date(request.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <Separator />
                    
                    <div>
                        <h3 className="font-semibold mb-2">Justification</h3>
                        <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md">{request.justification}</p>
                    </div>

                    <Separator />

                    <div>
                        <h3 className="font-semibold mb-4">Request Status</h3>
                        <RequestStatusStepper currentStatus={request.status} auditLog={request.auditLog} />
                    </div>

                    <Separator />

                    <div>
                        <h3 className="font-semibold mb-4">Audit Log</h3>
                        <div className="space-y-4">
                            {request.auditLog.map((log, index) => (
                                <div key={index} className="flex gap-4 text-sm">
                                    <div className="font-medium min-w-[100px]">{new Date(log.date).toLocaleString()}</div>
                                    <div className="flex flex-col">
                                        <p><span className="font-semibold">{log.user}</span> {log.action.toLowerCase()} the request.</p>
                                        {log.comment && <p className="text-xs text-muted-foreground mt-1 italic">"{log.comment}"</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
