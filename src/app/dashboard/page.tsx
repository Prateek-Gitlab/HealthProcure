'use server';

import { useAuth } from '@/contexts/auth-context';
import {
  users,
  type ProcurementRequest,
  getProcurementRequests,
} from '@/lib/data';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RequestList } from '@/components/dashboard/request-list';
import { RequestForm } from '@/components/dashboard/request-form';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { addRequest, updateRequest } from '@/lib/actions';
import { revalidatePath } from 'next/cache';

export default async function DashboardPage() {
  // This is a server component, so we can't use hooks directly at the top level.
  // We can, however, create a client component that uses them.
  // For this page, we'll fetch data on the server and pass it down.

  const allRequests = await getProcurementRequests();

  // We need a wrapper to use the auth context
  const PageClientWrapper = () => {
    'use client';

    const { user } = useAuth();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [allRequestsState, setAllRequestsState] =
      useState<ProcurementRequest[]>(allRequests);

    useEffect(() => {
      setAllRequestsState(allRequests);
    }, [allRequests]);

    if (!user) return null;

    const handleNewRequest = async (newRequestData: Omit<ProcurementRequest, 'id' | 'createdAt' | 'auditLog' | 'status' | 'submittedBy'>) => {
        if(!user) return;
        
        await addRequest(newRequestData);
        revalidatePath('/dashboard');
    };

    const handleUpdateRequest = async (updatedRequest: ProcurementRequest) => {
        await updateRequest(updatedRequest);
        revalidatePath('/dashboard');
    };

    const visibleRequests = () => {
      switch (user.role) {
        case 'state':
          return allRequestsState.filter(
            (r) => r.status === 'Pending State Approval'
          );
        case 'district':
          const managedUserIds = users
            .filter((u) => u.reportsTo === user.id)
            .map((u) => u.id);
          return allRequestsState.filter(
            (r) =>
              managedUserIds.includes(r.submittedBy) &&
              r.status === 'Pending District Approval'
          );
        case 'base':
          return allRequestsState.filter((r) => r.submittedBy === user.id);
        default:
          return [];
      }
    };

    const getTitle = () => {
      switch (user.role) {
        case 'state':
          return 'State-Level Approval Queue';
        case 'district':
          return 'District-Level Approval Queue';
        case 'base':
          return 'My Procurement Requests';
        default:
          return 'Procurement Requests';
      }
    };

    const allUserRequests = allRequestsState.filter((r) => {
      if (user.role === 'base') return r.submittedBy === user.id;
      if (user.role === 'district') {
        const managedUserIds = users
          .filter((u) => u.reportsTo === user.id)
          .map((u) => u.id);
        return managedUserIds.includes(r.submittedBy);
      }
      return true; // State user sees all
    });

    return (
      <div className="space-y-6">
        <StatsCards requests={allUserRequests} userRole={user.role} />

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-headline">{getTitle()}</h2>
          {user.role === 'base' && (
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
  };
  
  // Need to import these client components to avoid the server complaining
  const ClientWrapperForImports = () => {
    'use client';
    const { useState, useEffect } = require('react');
    return <></>;
  }

  return (
      <>
        <ClientWrapperForImports />
        <PageClientWrapper />
      </>
  );
}
