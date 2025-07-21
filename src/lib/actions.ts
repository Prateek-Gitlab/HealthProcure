'use server';

import { revalidatePath } from 'next/cache';
import type { ProcurementRequest } from './data';
import { users } from './data';
import { addRow, updateRowByField } from './sheets';
import { cookies } from 'next/headers';

function getUserId() {
    // In Next.js server actions, we can access cookies using the `cookies()` function.
    return cookies().get('health_procure_user_id')?.value ?? '';
}

export async function addRequest(requestData: Omit<ProcurementRequest, 'id' | 'createdAt' | 'auditLog' | 'status' | 'submittedBy'>) {
  const userId = getUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }
  const user = users.find(u => u.id === userId);
  if (!user) {
    throw new Error('User not found');
  }

  const newRequest: Omit<ProcurementRequest, 'id'> & { auditLog: string } = {
    ...requestData,
    submittedBy: user.id,
    status: 'Pending District Approval',
    createdAt: new Date().toISOString(),
    auditLog: JSON.stringify([
      {
        action: 'Submitted',
        user: user.name,
        date: new Date().toISOString(),
      },
    ]),
  };
  
  await addRow(newRequest);
  revalidatePath('/dashboard');
}

export async function updateRequest(request: ProcurementRequest) {
    await updateRowByField('id', request.id, request);
    revalidatePath('/dashboard');
}
