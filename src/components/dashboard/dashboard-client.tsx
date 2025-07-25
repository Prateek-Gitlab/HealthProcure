
"use client";

import { useState, useMemo } from "react";
import type { ProcurementRequest, RequestStatus, StagedRequest, FilterStatus, Priority } from "@/lib/data";
import { useAuth } from "@/contexts/auth-context";
import { useHierarchy } from "@/hooks/use-hierarchy";
import { addRequest } from "@/lib/actions";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RequestList } from "@/components/dashboard/request-list";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { ApprovedItemsTable } from "@/components/dashboard/approved-items-table";
import { StagedRequests } from "@/components/dashboard/staged-requests";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { CategoryPieChart } from "./category-pie-chart";
import { PlaceholderChart } from "./placeholder-chart";
import { RequestedBudgetTable } from "./requested-budget-table";


interface DashboardClientProps {
  initialRequests: ProcurementRequest[];
}

export function DashboardClient({ initialRequests }: DashboardClientProps) {
  const { user, allUsers } = useAuth();
  const { getSubordinateIds } = useHierarchy();
  const [requests, setRequests] = useState<ProcurementRequest[]>(initialRequests);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [analyticsFilterId, setAnalyticsFilterId] = useState<string>('all');
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

    let filteredRequests: ProcurementRequest[];

    if (filterStatus === 'pending') {
        switch (user.role) {
          case "state":
          case "district":
            filteredRequests = filteredForRejected.filter(
              (r) => r.status === "Pending Taluka Approval"
            );
            break;
          case "taluka":
            filteredRequests = filteredForRejected.filter(
              (r) => r.status === "Pending Taluka Approval"
            );
            break;
          case "base":
            filteredRequests = filteredForRejected.filter((r) => r.status.startsWith('Pending'));
            break;
          default:
            filteredRequests = [];
        }
    } else if (filterStatus === 'approved-by-me') {
       if (user.role === 'taluka') {
          filteredRequests = filteredForRejected.filter(r => r.status === 'Approved');
        } else if (user.role === 'district') {
          filteredRequests = filteredForRejected.filter(r => r.status === 'Approved');
        }
        // For state and base users, this is just final approved
        else {
          filteredRequests = filteredForRejected.filter(r => r.status === 'Approved');
        }
    } else if (filterStatus === 'all') {
        filteredRequests = allUserRequests; // Show all, including rejected for 'all' filter
    } else {
      // Specific status filter like 'Rejected'
      filteredRequests = allUserRequests.filter(r => r.status === filterStatus);
    }

    const priorityOrder: Record<Priority, number> = {
      'High': 1,
      'Medium': 2,
      'Low': 3
    };

    return filteredRequests.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
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

  const pieChartRequests = useMemo(() => {
    if (user.role === 'state' && analyticsFilterId !== 'all') {
        const selectedDistrict = allUsers.find(u => u.id === analyticsFilterId);
        if (!selectedDistrict) return requests;

        const talukasInDistrict = allUsers.filter(u => u.reportsTo === selectedDistrict.id).map(u => u.id);
        const basesInDistrict = allUsers.filter(u => talukasInDistrict.includes(u.reportsTo || '')).map(u => u.id);
        
        return requests.filter(req => {
            const submittedByUser = allUsers.find(u => u.id === req.submittedBy);
            return submittedByUser && basesInDistrict.includes(submittedByUser.id);
        });
    }
    return requests;
  }, [requests, user.role, analyticsFilterId, allUsers]);

  const getPieChartTitleAndDescription = () => {
    if (user.role === 'state' && analyticsFilterId !== 'all') {
        const districtName = allUsers.find(u => u.id === analyticsFilterId)?.name || 'the selected district';
        return {
            title: `Cost Breakdown for ${districtName}`,
            description: `Estimated approved cost by category for ${districtName}.`
        }
    }
    return {
        title: "Estimated Approved Cost by Category",
        description: "A breakdown of the total estimated cost of approved requests by procurement category."
    }
  }


  return (
    <div className="space-y-6">
      <StatsCards 
        requests={allUserRequests} 
        userRole={user.role} 
        activeFilter={filterStatus}
        onFilterChange={setFilterStatus}
      />

      {user.role === 'district' && (
         <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ApprovedItemsTable requests={requests} currentUser={user} />
            <AnalyticsChart 
                requests={requests} 
                allUsers={allUsers} 
                currentUser={user} 
                selectedFilterId={analyticsFilterId}
                onFilterChange={setAnalyticsFilterId}
            />
         </div>
      )}

      {user.role === 'state' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col h-full">
                <AnalyticsChart 
                    requests={requests} 
                    allUsers={allUsers} 
                    currentUser={user} 
                    selectedFilterId={analyticsFilterId}
                    onFilterChange={setAnalyticsFilterId}
                />
            </div>
            <div className="flex flex-col h-full">
                <CategoryPieChart 
                    requests={pieChartRequests} 
                    {...getPieChartTitleAndDescription()}
                />
            </div>
            <div className="flex flex-col h-full">
                <PlaceholderChart currentUser={user} totalApprovedBudget={totalApprovedBudget} />
            </div>
            <div className="flex flex-col h-full">
                 <ApprovedItemsTable requests={requests} currentUser={user} />
            </div>
        </div>
      )}

      {user.role === "base" && (
        <>
            <StagedRequests onSubmit={handleSubmitStagedRequests} />
            <Separator />
            <div className="pt-6">
                <RequestedBudgetTable requests={allUserRequests} />
            </div>
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
