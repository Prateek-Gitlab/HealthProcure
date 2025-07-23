
"use client";

import { useState } from "react";
import type { ProcurementRequest, ProcurementCategory, RequestStatus, Priority } from "@/lib/data";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { procurementPriorities } from "@/lib/data";

interface DashboardClientProps {
  initialRequests: ProcurementRequest[];
}

interface StagedRequest {
  itemName: string;
  category: ProcurementCategory;
  quantity: number;
  pricePerUnit: number;
  priority: Priority;
  justification: string;
}

type FilterStatus = RequestStatus | 'all' | 'pending' | 'approved-by-me';


export function DashboardClient({ initialRequests }: DashboardClientProps) {
  const { user, allUsers } = useAuth();
  const [requests, setRequests] = useState<ProcurementRequest[]>(initialRequests);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [stagedRequests, setStagedRequests] = useState<StagedRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  if (!user) {
    return null;
  }

  const handleUpdateRequestInState = (updatedRequest: ProcurementRequest) => {
    setRequests(currentRequests => 
      currentRequests.map(req => 
        req.id === updatedRequest.id ? updatedRequest : req
      )
    );
  };

  const handleItemsSelected = (
    items: string[],
    category: ProcurementCategory
  ) => {
    const newStagedRequests: StagedRequest[] = items.map((itemName) => ({
      itemName,
      category,
      quantity: 1,
      pricePerUnit: 0,
      priority: "Medium",
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
    field: "quantity" | "justification" | "priority" | "pricePerUnit",
    value: string | number
  ) => {
    const updated = [...stagedRequests];
    if (field === "quantity" || field === "pricePerUnit") {
      updated[index][field] = Number(value);
    } else if (field === 'priority') {
      updated[index].priority = value as Priority;
    }
     else {
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

    const validRequests = stagedRequests.filter(req => req.quantity > 0 && req.justification.trim().length > 0 && req.pricePerUnit >= 0);
    
    if (validRequests.length !== stagedRequests.length) {
        toast({
            title: "Validation Error",
            description: "Please ensure all selected items have a quantity, justification and a valid price.",
            variant: "destructive",
        });
        return;
    }
    
    setIsSubmitting(true);
    try {
        const addedRequestsPromises = validRequests.map((req) =>
            addRequest(req, user.id)
        );
        const addedRequests = await Promise.all(addedRequestsPromises);

        // Filter out any nulls in case the action returns nothing on error
        const successfulRequests = addedRequests.filter(r => r) as ProcurementRequest[];
        
        setRequests(currentRequests => [...currentRequests, ...successfulRequests]);
        
        toast({
            title: "Requests Submitted",
            description: `${successfulRequests.length} requests have been successfully submitted.`,
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
  
  const allUserRequests = requests.filter((r) => {
    if (user.role === "base") {
      return r.submittedBy === user.id;
    }
    
    const submittedByUser = allUsers.find(u => u.id === r.submittedBy);
    if (!submittedByUser) return false;

    if (user.role === 'taluka') {
      const mySubordinates = allUsers.filter(u => u.reportsTo === user.id && u.role === 'base').map(u => u.id);
      return mySubordinates.includes(submittedByUser.id);
    }
  
    if (user.role === 'district') {
        if (r.status === 'Rejected') return false;
      const subordinateTalukaIds = allUsers.filter(u => u.reportsTo === user.id && u.role === 'taluka').map(u => u.id);
      return subordinateTalukaIds.includes(submittedByUser.reportsTo || '');
    }
  
    if (user.role === 'state') {
      return true;
    }
  
    return false;
  });
  
  const visibleRequests = () => {
    if (filterStatus === 'pending') {
        switch (user.role) {
          case "state":
          case "district":
            return allUserRequests.filter(
              (r) => r.status === "Pending Taluka Approval"
            );
          case "taluka":
            return allUserRequests.filter(
              (r) => r.status === "Pending Taluka Approval"
            );
          case "base":
            return allUserRequests.filter((r) => r.status.startsWith('Pending'));
          default:
            return [];
        }
    }
    if (filterStatus === 'approved-by-me') {
       if (user.role === 'taluka') {
          return allUserRequests.filter(r => r.status === 'Approved');
        }
        if (user.role === 'district') {
          return allUserRequests.filter(r => r.status === 'Approved');
        }
        // For state and base users, this is just final approved
        return allUserRequests.filter(r => r.status === 'Approved');
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
            return `Approval Queue`;
        case 'approved-by-me':
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
                            <TableHead className="w-[150px]">Price/unit (₹)</TableHead>
                            <TableHead className="w-[150px]">Priority</TableHead>
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
                                <Input
                                    type="number"
                                    value={req.pricePerUnit}
                                    onChange={(e) =>
                                    handleStagedRequestChange(index, "pricePerUnit", e.target.value)
                                    }
                                    className="w-full"
                                    min="0"
                                    step="0.01"
                                    disabled={isSubmitting}
                                />
                                </TableCell>
                                <TableCell>
                                    <Select 
                                        value={req.priority} 
                                        onValueChange={(value) => handleStagedRequestChange(index, "priority", value)}
                                        disabled={isSubmitting}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {procurementPriorities.map(p => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
        onUpdate={handleUpdateRequestInState}
        isFiltered={filterStatus !== 'pending'}
      />
    </div>
  );
}
