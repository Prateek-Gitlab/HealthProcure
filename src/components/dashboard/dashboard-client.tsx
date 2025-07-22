
"use client";

import { useState } from "react";
import type { ProcurementRequest, ProcurementCategory, RequestStatus } from "@/lib/data";
import { useAuth } from "@/contexts/auth-context";
import { addRequest } from "@/lib/actions";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RequestList } from "@/components/dashboard/request-list";
import { RequestForm } from "@/components/dashboard/request-form";
import { Button } from "@/components/ui/button";
import { PlusCircle, Send, XCircle, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface DashboardClientProps {
  initialRequests: ProcurementRequest[];
}

interface StagedRequest {
  itemName: string;
  category: ProcurementCategory;
  quantity: number;
  justification: string;
}

type FilterStatus = RequestStatus | 'all' | 'pending';


export function DashboardClient({ initialRequests }: DashboardClientProps) {
  const { user, allUsers } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [stagedRequests, setStagedRequests] = useState<StagedRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  if (!user) {
    return null;
  }

  const handleItemsSelected = (
    items: string[],
    category: ProcurementCategory
  ) => {
    const newStagedRequests: StagedRequest[] = items.map((itemName) => ({
      itemName,
      category,
      quantity: 1,
      justification: "",
    }));

    // Filter out duplicates
    const combined = [...stagedRequests, ...newStagedRequests];
    const unique = combined.filter(
      (v, i, a) => a.findIndex((t) => t.itemName === v.itemName) === i
    );

    setStagedRequests(unique);
    setIsFormOpen(false);
  };

  const handleStagedRequestChange = (
    index: number,
    field: "quantity" | "justification",
    value: string | number
  ) => {
    const updated = [...stagedRequests];
    if (field === "quantity") {
      updated[index].quantity = Number(value);
    } else {
      updated[index].justification = String(value);
    }
    setStagedRequests(updated);
  };
  
  const handleRemoveStagedRequest = (index: number) => {
    const updated = stagedRequests.filter((_, i) => i !== index);
    setStagedRequests(updated);
  }

  const handleSubmitAllStaged = async () => {
    if (!user) return;

    const validRequests = stagedRequests.filter(req => req.quantity > 0 && req.justification.trim().length > 0);
    
    if (validRequests.length !== stagedRequests.length) {
        toast({
            title: "Validation Error",
            description: "Please ensure all selected items have a quantity and justification.",
            variant: "destructive",
        });
        return;
    }
    
    setIsSubmitting(true);
    try {
        await Promise.all(
            validRequests.map((req) =>
                addRequest(req, user.id)
            )
        );

        toast({
            title: "Requests Submitted",
            description: `${validRequests.length} requests have been successfully submitted.`,
        });

        setStagedRequests([]);
    } catch (error) {
        toast({
            title: "Submission Error",
            description: "An unexpected error occurred while submitting requests.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const allUserRequests = initialRequests.filter((r) => {
    if (user.role === "base") return r.submittedBy === user.id;
    if (user.role === 'taluka' || user.role === "district") {
      const managedUserIds = allUsers
        .filter((u) => u.reportsTo === user.id)
        .map((u) => u.id);
      return (
        managedUserIds.includes(r.submittedBy) || r.submittedBy === user.id
      );
    }
    return true; // State user sees all
  });
  
  const visibleRequests = () => {
    if (filterStatus === 'pending') {
        switch (user.role) {
          case "state":
            return allUserRequests.filter(
              (r) => r.status === "Pending State Approval"
            );
          case "district":
            const managedDistrictUserIds = allUsers
              .filter((u) => u.reportsTo === user.id)
              .map((u) => u.id);
            return allUserRequests.filter(
              (r) =>
                managedDistrictUserIds.includes(r.submittedBy) &&
                r.status === "Pending District Approval"
            );
          case "taluka":
            const managedTalukaUserIds = allUsers
                .filter((u) => u.reportsTo === user.id)
                .map((u) => u.id);
            return allUserRequests.filter(
                (r) =>
                managedTalukaUserIds.includes(r.submittedBy) &&
                r.status === "Pending Taluka Approval"
            );
          case "base":
            return allUserRequests.filter((r) => r.status.includes('Pending'));
          default:
            return [];
        }
    }
    if (filterStatus === 'all') {
        return allUserRequests;
    }
    return allUserRequests.filter(r => r.status === filterStatus);
  };

  const getTitle = () => {
    switch (filterStatus) {
        case 'pending':
            if (user.role === 'base') return "My Pending Requests";
            return `${user.role.charAt(0).toUpperCase() + user.role.slice(1)}-Level Approval Queue`;
        case 'Approved':
            return 'Approved Requests';
        case 'Rejected':
            return 'Rejected Requests';
        case 'all':
            return 'All Requests';
        default:
            return 'Procurement Requests';
    }
  };


  return (
    <div className="space-y-6">
      <StatsCards 
        requests={allUserRequests} 
        userRole={user.role} 
        activeFilter={filterStatus}
        onFilterChange={setFilterStatus}
      />

      {user.role === "base" && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-headline">New Requests</h2>
            <Button onClick={() => setIsFormOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Items
            </Button>
            <RequestForm
              isOpen={isFormOpen}
              onOpenChange={setIsFormOpen}
              onItemsSelected={handleItemsSelected}
            />
          </div>

          {stagedRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Item Name</TableHead>
                            <TableHead className="w-[120px]">Quantity</TableHead>
                            <TableHead>Justification</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stagedRequests.map((req, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{req.itemName}</TableCell>
                                <TableCell>
                                <Input
                                    type="number"
                                    value={req.quantity}
                                    onChange={(e) =>
                                    handleStagedRequestChange(index, "quantity", e.target.value)
                                    }
                                    className="w-full"
                                    min="1"
                                    disabled={isSubmitting}
                                />
                                </TableCell>
                                <TableCell>
                                <Textarea
                                    value={req.justification}
                                    onChange={(e) =>
                                    handleStagedRequestChange(index, "justification", e.target.value)
                                    }
                                    placeholder="Enter justification..."
                                    className="w-full"
                                    disabled={isSubmitting}
                                />
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveStagedRequest(index)} disabled={isSubmitting}>
                                        <XCircle className="h-4 w-4 text-muted-foreground"/>
                                    </Button>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={handleSubmitAllStaged} disabled={isSubmitting || stagedRequests.length === 0}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit All Requests
                        </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-headline">{getTitle()}</h2>
      </div>

      <RequestList
        requests={visibleRequests()}
        onUpdate={() => {
          /* Server action handles revalidation */
        }}
        isFiltered={filterStatus !== 'pending'}
      />
    </div>
  );
}
