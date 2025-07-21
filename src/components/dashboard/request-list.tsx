"use client";

import { useState } from "react";
import type { ProcurementRequest } from "@/lib/data";
import { useAuth } from "@/contexts/auth-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Check, X } from "lucide-react";
import { RequestDetailsSheet } from "./request-details-sheet";
import { ApprovalDialog } from "./approval-dialog";

interface RequestListProps {
  requests: ProcurementRequest[];
  onUpdate: (updatedRequest: ProcurementRequest) => void;
}

export function RequestList({ requests, onUpdate }: RequestListProps) {
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<ProcurementRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"Approve" | "Reject">("Approve");

  const handleViewDetails = (request: ProcurementRequest) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  const handleApprovalAction = (request: ProcurementRequest, action: "Approve" | "Reject") => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setIsApprovalOpen(true);
  };

  if (requests.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-20">
        <CardHeader>
          <CardTitle className="text-center">No Requests Found</CardTitle>
          <CardDescription className="text-center">
            There are no procurement requests that require your attention at the moment.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getStatusVariant = (status: ProcurementRequest["status"]): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Approved":
        return "default";
      case "Rejected":
        return "destructive";
      case "Pending District Approval":
      case "Pending State Approval":
        return "secondary";
      default:
        return "outline";
    }
  };


  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
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
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleViewDetails(request)}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View Details</span>
                    </Button>
                    {user?.role !== 'base' && (
                        <>
                            <Button variant="outline" size="icon" className="text-green-600 hover:bg-green-100 hover:text-green-700 border-green-300" onClick={() => handleApprovalAction(request, "Approve")}>
                                <Check className="h-4 w-4" />
                                <span className="sr-only">Approve</span>
                            </Button>
                             <Button variant="outline" size="icon" className="text-red-600 hover:bg-red-100 hover:text-red-700 border-red-300" onClick={() => handleApprovalAction(request, "Reject")}>
                                <X className="h-4 w-4" />
                                <span className="sr-only">Reject</span>
                            </Button>
                        </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedRequest && (
        <RequestDetailsSheet
          request={selectedRequest}
          isOpen={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
        />
      )}
      {selectedRequest && user && (
        <ApprovalDialog
          request={selectedRequest}
          user={user}
          action={approvalAction}
          isOpen={isApprovalOpen}
          onOpenChange={setIsApprovalOpen}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}
