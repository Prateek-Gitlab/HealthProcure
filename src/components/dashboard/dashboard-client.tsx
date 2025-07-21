"use client";

import { useState } from "react";
import type { ProcurementRequest } from "@/lib/data";
import { users } from "@/lib/data";
import { useAuth } from "@/contexts/auth-context";
import { addRequest, updateRequest } from "@/lib/actions";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RequestList } from "@/components/dashboard/request-list";
import { RequestForm } from "@/components/dashboard/request-form";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface DashboardClientProps {
  initialRequests: ProcurementRequest[];
}

export function DashboardClient({ initialRequests }: DashboardClientProps) {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Note: We are not using state for requests anymore as revalidation should handle updates.
  // The initialRequests prop will be updated on navigation or revalidation.

  if (!user) {
    // This can be a loading skeleton or null
    return null; 
  }

  const handleNewRequest = async (
    newRequestData: Omit<ProcurementRequest, "id" | "createdAt" | "auditLog" | "status" | "submittedBy">
  ) => {
    if (!user) return;
    await addRequest(newRequestData);
    // Revalidation is handled by the server action
  };

  const handleUpdateRequest = async (updatedRequest: ProcurementRequest) => {
    await updateRequest(updatedRequest);
    // Revalidation is handled by the server action
  };

  const visibleRequests = () => {
    switch (user.role) {
      case "state":
        return initialRequests.filter(
          (r) => r.status === "Pending State Approval"
        );
      case "district":
        const managedUserIds = users
          .filter((u) => u.reportsTo === user.id)
          .map((u) => u.id);
        return initialRequests.filter(
          (r) =>
            managedUserIds.includes(r.submittedBy) &&
            r.status === "Pending District Approval"
        );
      case "base":
        return initialRequests.filter((r) => r.submittedBy === user.id);
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

  const allUserRequests = initialRequests.filter((r) => {
    if (user.role === "base") return r.submittedBy === user.id;
    if (user.role === "district") {
      const managedUserIds = users
        .filter((u) => u.reportsTo === user.id)
        .map((u) => u.id);
      return managedUserIds.includes(r.submittedBy) || r.submittedBy === user.id;
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
            <RequestForm
              isOpen={isFormOpen}
              onOpenChange={setIsFormOpen}
              onNewRequest={handleNewRequest}
            />
          </>
        )}
      </div>

      <RequestList
        requests={visibleRequests()}
        onUpdate={handleUpdateRequest}
      />
    </div>
  );
}
