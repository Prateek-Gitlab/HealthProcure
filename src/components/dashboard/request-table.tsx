
"use client";

import type { ProcurementRequest, Priority, User } from "@/lib/data";
import { useAuth } from "@/contexts/auth-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";


interface RequestTableProps {
  requests: ProcurementRequest[];
  onViewDetails: (request: ProcurementRequest) => void;
  onApprovalAction: (request: ProcurementRequest, action: "Approve" | "Reject") => void;
}

export function RequestTable({ requests, onViewDetails, onApprovalAction }: RequestTableProps) {
  const { user } = useAuth();
  
  const canApproveOrReject = (request: ProcurementRequest) => {
    if (!user || user.role === 'base' || user.role === 'district' || user.role === 'state') return false;
    if (user.role === 'taluka' && request.status === 'Pending Taluka Approval') return true;
    return false;
  }

  const getStatusBadgeClass = (status: ProcurementRequest["status"]) => {
    switch (status) {
      case "Approved":
        return "status-approved border rounded-full px-2.5 py-0.5 text-xs font-semibold";
      case "Rejected":
        return "status-rejected border rounded-full px-2.5 py-0.5 text-xs font-semibold";
      case "Pending Taluka Approval":
        return "status-pending border rounded-full px-2.5 py-0.5 text-xs font-semibold";
      default:
        return "bg-muted text-muted-foreground border rounded-full px-2.5 py-0.5 text-xs font-semibold";
    }
  };

  const getPriorityClass = (priority: Priority) => {
    switch(priority) {
      case 'High':
        return 'priority-high border rounded-full px-2.5 py-0.5 text-xs font-semibold';
      case 'Medium':
        return 'priority-medium border rounded-full px-2.5 py-0.5 text-xs font-semibold';
      case 'Low':
        return 'priority-low border rounded-full px-2.5 py-0.5 text-xs font-semibold';
      default:
        return 'bg-muted text-muted-foreground border rounded-full px-2.5 py-0.5 text-xs font-semibold';
    }
  }

  return (
    <Table className="rounded-custom bg-card shadow-custom overflow-hidden">
      <TableHeader>
        <TableRow className="bg-secondary/60">
          <TableHead className="whitespace-nowrap">Request ID</TableHead>
          <TableHead className="whitespace-nowrap">Category</TableHead>
          <TableHead className="whitespace-nowrap">Item</TableHead>
          <TableHead className="text-right whitespace-nowrap">Quantity</TableHead>
          <TableHead className="whitespace-nowrap">Status</TableHead>
          <TableHead className="whitespace-nowrap">Priority</TableHead>
          <TableHead className="text-right whitespace-nowrap">Estimated Cost (₹)</TableHead>
          <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request, idx) => {
          const totalCost = (request.pricePerUnit ?? 0) * request.quantity;
          return (
            <TableRow key={request.id} className={cn("transition-colors", idx % 2 === 0 ? "bg-white" : "bg-muted/30")}>
              <TableCell className="font-medium">{request.id}</TableCell>
              <TableCell>{request.category}</TableCell>
              <TableCell className="max-w-[280px] truncate">{request.itemName}</TableCell>
              <TableCell className="text-right">{request.quantity.toLocaleString()}</TableCell>
              <TableCell>
                <span className={getStatusBadgeClass(request.status)}>
                  {request.status}
                </span>
              </TableCell>
              <TableCell>
                <span className={getPriorityClass(request.priority)}>
                  {request.priority}
                </span>
              </TableCell>
              <TableCell className="text-right font-semibold">
                {totalCost.toLocaleString('en-IN')}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="outline" size="icon" className="hover:scale-105 focus-ring" onClick={() => onViewDetails(request)}>
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View Details</span>
                </Button>
                {canApproveOrReject(request) && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-success border-success/40 hover:bg-success/10 hover:text-success focus-ring"
                      onClick={() => onApprovalAction(request, "Approve")}
                    >
                      <Check className="h-4 w-4" />
                      <span className="sr-only">Approve</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive focus-ring"
                      onClick={() => onApprovalAction(request, "Reject")}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Reject</span>
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
