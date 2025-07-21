'use server';

import { getProcurementRequests } from '@/lib/data';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

export default async function DashboardPage() {
  const allRequests = await getProcurementRequests();

  return <DashboardClient initialRequests={allRequests} />;
}
