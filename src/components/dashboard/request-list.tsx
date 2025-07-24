

"use client";

import { useState } from "react";
import type { ProcurementRequest, User } from "@/lib/data";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RequestDetailsSheet } from "./request-details-sheet";
import { ApprovalDialog } from "./approval-dialog";
import { RequestTable } from "./request-table";
import { groupRequestsForState, groupRequestsForTaluka, groupRequestsForDistrict } from "@/lib/grouping";

interface RequestListProps {
  requests: ProcurementRequest[];
  onUpdate: (updatedRequest: ProcurementRequest) => void;
  isFiltered?: boolean;
}

export function RequestList({ requests, onUpdate, isFiltered = false }: RequestListProps) {
  const { user, allUsers } = useAuth();
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
    if (!user) return null;

    if (user.role === 'state') {
        const groupedByDistrict = groupRequestsForState(requests, allUsers);

        return (
            <Accordion type="multiple" className="w-full space-y-4">
                {Object.entries(groupedByDistrict).map(([districtName, talukas]) => (
                    <AccordionItem value={districtName} key={districtName} className="border-b-0">
                        <Card>
                            <AccordionTrigger className="p-6 text-lg font-semibold hover:no-underline">
                                {districtName}
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                <Accordion type="multiple" className="w-full space-y-2">
                                    {Object.entries(talukas).map(([talukaName, bases]) => (
                                        <AccordionItem value={talukaName} key={talukaName} className="border rounded-md">
                                            <AccordionTrigger className="p-4 text-base font-medium hover:no-underline">
                                                {talukaName}
                                            </AccordionTrigger>
                                            <AccordionContent className="p-0 border-t">
                                                <Accordion type="multiple" className="w-full">
                                                    {Object.entries(bases).map(([baseName, baseRequests]) => (
                                                        <AccordionItem value={baseName} key={baseName} className="border-b">
                                                            <AccordionTrigger className="p-3 text-sm font-normal hover:no-underline">
                                                                {baseName} ({baseRequests.length} requests)
                                                            </AccordionTrigger>
                                                            <AccordionContent className="p-0">
                                                                <RequestTable 
                                                                    requests={baseRequests} 
                                                                    onViewDetails={handleViewDetails}
                                                                    onApprovalAction={handleApprovalAction}
                                                                />
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    ))}
                                                </Accordion>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </AccordionContent>
                        </Card>
                    </AccordionItem>
                ))}
            </Accordion>
        );
    }

    if (user.role === 'taluka') {
        const groupedByFacility = groupRequestsForTaluka(requests, allUsers);
  
        return (
            <Accordion type="multiple" className="w-full space-y-4">
            {Object.entries(groupedByFacility).map(([facilityName, categories]) => (
                <AccordionItem value={facilityName} key={facilityName} className="border-b-0">
                <Card>
                    <AccordionTrigger className="p-6 text-lg font-semibold hover:no-underline">
                        {facilityName} ({Object.values(categories).flat().length} requests)
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                        <Accordion type="multiple" className="w-full space-y-2">
                        {Object.entries(categories).map(([category, categoryRequests]) => (
                            <AccordionItem value={category} key={category} className="border rounded-md">
                            <AccordionTrigger className="p-4 text-base font-medium hover:no-underline">
                                {category} ({categoryRequests.length} requests)
                            </AccordionTrigger>
                            <AccordionContent className="p-0 border-t">
                                <RequestTable 
                                    requests={categoryRequests} 
                                    onViewDetails={handleViewDetails}
                                    onApprovalAction={handleApprovalAction}
                                />
                            </AccordionContent>
                            </AccordionItem>
                        ))}
                        </Accordion>
                    </AccordionContent>
                    </Card>
                </AccordionItem>
            ))}
            </Accordion>
        );
    }
    
    // Default grouping for district users
    const groupedRequests = groupRequestsForDistrict(requests, allUsers, user);
  
    return (
      <Accordion type="multiple" className="w-full space-y-4">
        {Object.entries(groupedRequests).map(([facilityName, facilityRequests]) => (
          <AccordionItem value={facilityName} key={facilityName} className="border-b-0">
             <Card>
                <AccordionTrigger className="p-6 text-lg font-semibold hover:no-underline">
                    {facilityName} ({facilityRequests.length} requests)
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  <CardContent className="p-0">
                    <RequestTable 
                        requests={facilityRequests} 
                        onViewDetails={handleViewDetails}
                        onApprovalAction={handleApprovalAction}
                    />
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
      {user && (user.role === 'state' || user.role === 'district' || user.role === 'taluka') ? (
        renderGroupedView()
      ) : (
        <Card>
          <CardContent className="p-0">
            <RequestTable 
                requests={requests}
                onViewDetails={handleViewDetails}
                onApprovalAction={handleApprovalAction}
            />
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
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}
