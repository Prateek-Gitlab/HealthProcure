
"use client";

import { useState } from "react";
import type { ProcurementRequest } from "@/lib/data";
import { useAuth } from "@/contexts/auth-context";
import { updateRequest } from "@/lib/actions";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


interface RequestListProps {
  requests: ProcurementRequest[];
  onUpdate: (updatedRequest: ProcurementRequest) => Promise<void>;
  isFiltered?: boolean;
}

export function RequestList({ requests, isFiltered = false }: RequestListProps) {
  const { user, allUsers } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<ProcurementRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"Approve" | "Reject">("Approve");

  const handleViewDetails = (request: ProcurementRequest) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };
  
  const handleUpdateRequest = async (updatedRequest: ProcurementRequest) => {
    if (!user) return;
    await updateRequest(updatedRequest, user.id);
  };

  const handleApprovalAction = (request: ProcurementRequest, action: "Approve" | "Reject") => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setIsApprovalOpen(true);
  };
  
  const canApproveOrReject = (request: ProcurementRequest) => {
    if (!user || user.role === 'base') return false;
    if (user.role === 'taluka' && request.status === 'Pending Taluka Approval') return true;
    if (user.role === 'district' && request.status === 'Pending District Approval') return true;
    if (user.role === 'state' && request.status === 'Pending State Approval') return true;
    return false;
  }

  const getStatusVariant = (status: ProcurementRequest["status"]): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Approved":
        return "default";
      case "Rejected":
        return "destructive";
      case "Pending Taluka Approval":
      case "Pending District Approval":
      case "Pending State Approval":
        return "secondary";
      default:
        return "outline";
    }
  };

  const renderRequestTable = (requestList: ProcurementRequest[]) => (
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
        {requestList.map((request) => (
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
              {canApproveOrReject(request) && (
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
  );

  if (requests.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-20">
        <CardHeader>
          <CardTitle className="text-center">No Requests Found</CardTitle>
          <CardDescription className="text-center">
            {isFiltered 
                ? "There are no requests matching the current filter."
                : "There are no procurement requests that require your attention at the moment."
            }
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const renderGroupedView = () => {
    const groupedRequests = requests.reduce((acc, request) => {
      const submittedByUser = allUsers.find(u => u.id === request.submittedBy);
      // Group by the facility that reports to the current user, or the user's own requests
      const facilityId = (submittedByUser?.role === 'base' || submittedByUser?.role === 'taluka') ? submittedByUser.id : user?.id || 'unknown';
      const facilityUser = allUsers.find(u => u.id === facilityId);
      const facilityName = facilityUser?.name || 'My Requests';

      if (!acc[facilityName]) {
        acc[facilityName] = [];
      }
      acc[facilityName].push(request);
      return acc;
    }, {} as Record<string, ProcurementRequest[]>);

    const facilityNames = Object.keys(groupedRequests).sort();

    return (
      <Accordion type="multiple" className="w-full space-y-4">
        {facilityNames.map(facilityName => (
          <AccordionItem value={facilityName} key={facilityName} className="border-b-0">
             <Card>
                <AccordionTrigger className="p-6 text-lg font-semibold hover:no-underline">
                    {facilityName} ({groupedRequests[facilityName].length} requests)
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  <CardContent className="p-0">
                    {renderRequestTable(groupedRequests[facilityName])}
                  </CardContent>
                </AccordionContent>
              </Card>
          </AccordionItem>
        ))}
      </Accordion>
    );
  };


  return (
    <>
      {user && (user.role === 'district' || user.role === 'state' || user.role === 'taluka') ? (
        renderGroupedView()
      ) : (
        <Card>
          <CardContent className="p-0">
            {renderRequestTable(requests)}
          </CardContent>
        </Card>
      )}

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
          onUpdate={handleUpdateRequest}
        />
      )}
    </>
  );
}
