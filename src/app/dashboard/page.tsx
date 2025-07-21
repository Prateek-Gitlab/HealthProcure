"use client";

import { useAuth } from "@/contexts/auth-context";
import { requests, users, ProcurementRequest } from "@/lib/data";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RequestList } from "@/components/dashboard/request-list";
import { RequestForm } from "@/components/dashboard/request-form";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useState } from "react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [allRequests, setAllRequests] = useState<ProcurementRequest[]>(requests);

  if (!user) return null;

  const handleNewRequest = (newRequest: ProcurementRequest) => {
    setAllRequests(prev => [newRequest, ...prev]);
  };

  const visibleRequests = () => {
    switch (user.role) {
      case "state":
        return allRequests.filter(
          (r) => r.status === "Pending State Approval"
        );
      case "district":
        const managedUserIds = users
          .filter((u) => u.reportsTo === user.id)
          .map((u) => u.id);
        return allRequests.filter(
          (r) =>
            managedUserIds.includes(r.submittedBy) &&
            r.status === "Pending District Approval"
        );
      case "base":
        return allRequests.filter((r) => r.submittedBy === user.id);
      default:
        return [];
    }
  };

  const getTitle = () => {
    switch (user.role) {
      case "state":
        return "State-Level Approval Queue";
      case "district":
        return "District-Level Approval Queue";
      case "base":
        return "My Procurement Requests";
      default:
        return "Procurement Requests";
    }
  };
  
  const allUserRequests = allRequests.filter(r => {
    if (user.role === 'base') return r.submittedBy === user.id;
    if (user.role === 'district') {
      const managedUserIds = users.filter(u => u.reportsTo === user.id).map(u => u.id);
      return managedUserIds.includes(r.submittedBy);
    }
    return true; // State user sees all
  });

  return (
    <div className="space-y-6">
      <StatsCards requests={allUserRequests} userRole={user.role} />

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-headline">{getTitle()}</h2>
        {user.role === "base" && (
            <>
                <Button onClick={() => setIsFormOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Request
                </Button>
                <RequestForm isOpen={isFormOpen} onOpenChange={setIsFormOpen} onNewRequest={handleNewRequest}/>
            </>
        )}
      </div>
      
      <RequestList requests={visibleRequests()} />
    </div>
  );
}
