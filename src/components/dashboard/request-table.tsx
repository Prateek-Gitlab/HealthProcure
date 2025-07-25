
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

  const getStatusVariant = (status: ProcurementRequest["status"]): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Approved":
        return "default";
      case "Rejected":
        return "destructive";
      case "Pending Taluka Approval":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getPriorityClass = (priority: Priority) => {
    switch(priority) {
      case 'High':
        return 'bg-red-500 hover:bg-red-600';
      case 'Medium':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'Low':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Request ID</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Item</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead className="text-right">Estimated Cost (₹)</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => {
          const totalCost = (request.pricePerUnit ?? 0) * request.quantity;
          return (
            <TableRow key={request.id}>
              <TableCell className="font-medium">{request.id}</TableCell>
              <TableCell>{request.category}</TableCell>
              <TableCell>{request.itemName}</TableCell>
              <TableCell className="text-right">{request.quantity.toLocaleString()}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(request.status)}>
                  {request.status}
                </Badge>
              </TableCell>
              <TableCell>
                  <Badge className={cn("text-white", getPriorityClass(request.priority))}>
                      {request.priority}
                  </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                {totalCost.toLocaleString('en-IN')}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="outline" size="icon" onClick={() => onViewDetails(request)}>
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View Details</span>
                </Button>
                {canApproveOrReject(request) && (
                    <>
                        <Button variant="outline" size="icon" className="text-green-600 hover:bg-green-100 hover:text-green-700 border-green-300" onClick={() => onApprovalAction(request, "Approve")}>
                            <Check className="h-4 w-4" />
                            <span className="sr-only">Approve</span>
                        </Button>
                          <Button variant="outline" size="icon" className="text-red-600 hover:bg-red-100 hover:text-red-700 border-red-300" onClick={() => onApprovalAction(request, "Reject")}>
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
