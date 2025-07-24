
"use client";

import { useState, useMemo } from "react";
import type { ProcurementRequest, RequestStatus, StagedRequest, FilterStatus } from "@/lib/data";
import { useAuth } from "@/contexts/auth-context";
import { useHierarchy } from "@/hooks/use-hierarchy";
import { addRequest } from "@/lib/actions";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RequestList } from "@/components/dashboard/request-list";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { PlaceholderChart } from "@/components/dashboard/placeholder-chart";
import { StagedRequests } from "@/components/dashboard/staged-requests";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";


interface DashboardClientProps {
  initialRequests: ProcurementRequest[];
}

export function DashboardClient({ initialRequests }: DashboardClientProps) {
  const { user, allUsers } = useAuth();
  const { getSubordinateIds } = useHierarchy();
  const [requests, setRequests] = useState<ProcurementRequest[]>(initialRequests);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const { toast } = useToast();

  const totalApprovedBudget = useMemo(() => {
    return requests
      .filter(r => r.status === 'Approved')
      .reduce((acc, req) => acc + (req.pricePerUnit || 0) * req.quantity, 0);
  }, [requests]);

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

  const handleSubmitStagedRequests = async (stagedRequests: StagedRequest[]) => {
    if (!user) return;
    
    try {
        const addedRequestsPromises = stagedRequests.map((req) =>
            addRequest(req, user.id)
        );
        const addedRequests = await Promise.all(addedRequestsPromises);

        const successfulRequests = addedRequests.filter(r => r) as ProcurementRequest[];
        
        setRequests(currentRequests => [...currentRequests, ...successfulRequests]);
        
        toast({
            title: "Requests Submitted",
            description: `${successfulRequests.length} requests have been successfully submitted.`,
        });

        return true;
    } catch (error) {
        toast({
            title: "Submission Error",
            description: "An unexpected error occurred while submitting requests.",
            variant: "destructive",
        });
        return false;
    }
  };

  const allUserRequests = useMemo(() => {
    if (!user) return [];
  
    if (user.role === 'state') {
      return requests;
    }
  
    const subordinateIds = getSubordinateIds(user.id);
    const allVisibleUserIds = [user.id, ...subordinateIds];

    return requests.filter(r => {
      // Base user sees their own requests
      if (user.role === "base") {
        return r.submittedBy === user.id;
      }
      
      // Other roles see requests submitted by their subordinates
      return allVisibleUserIds.includes(r.submittedBy);
    });
  }, [requests, user, getSubordinateIds]);
  
  const visibleRequests = () => {
    const filteredForRejected = user.role === 'district' || user.role === 'state' 
        ? allUserRequests.filter(r => r.status !== 'Rejected') 
        : allUserRequests;

    if (filterStatus === 'pending') {
        switch (user.role) {
          case "state":
          case "district":
            return filteredForRejected.filter(
              (r) => r.status === "Pending Taluka Approval"
            );
          case "taluka":
            return filteredForRejected.filter(
              (r) => r.status === "Pending Taluka Approval"
            );
          case "base":
            return filteredForRejected.filter((r) => r.status.startsWith('Pending'));
          default:
            return [];
        }
    }
    if (filterStatus === 'approved-by-me') {
       if (user.role === 'taluka') {
          return filteredForRejected.filter(r => r.status === 'Approved');
        }
        if (user.role === 'district') {
          return filteredForRejected.filter(r => r.status === 'Approved');
        }
        // For state and base users, this is just final approved
        return filteredForRejected.filter(r => r.status === 'Approved');
    }
    if (filterStatus === 'all') {
        return allUserRequests; // Show all, including rejected for 'all' filter
    }
    // Specific status filter like 'Rejected'
    return allUserRequests.filter(r => r.status === filterStatus);
  };

  const getTitle = () => {
    switch (filterStatus) {
        case 'pending':
            if (user.role === 'base') return "My Submitted Requests";
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

      {(user.role === 'district' || user.role === 'state') && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AnalyticsChart requests={requests} allUsers={allUsers} currentUser={user} />
            <PlaceholderChart 
              currentUser={user}
              totalApprovedBudget={totalApprovedBudget}
            />
        </div>
      )}

      {user.role === "base" && (
        <>
            <StagedRequests onSubmit={handleSubmitStagedRequests} />
            <Separator />
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
