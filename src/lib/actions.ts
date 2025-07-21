"use server";

import { revalidatePath } from 'next/cache';
import type { ProcurementRequest } from './data';
import { users } from './data';
import { addRow, updateRowByField } from './sheets';
import { headers } from 'next/headers';

function getUserId() {
    const heads = headers();
    // This is a placeholder for getting the real user ID
    // In a real app, you'd get this from the session
    const userCookie = heads.get('cookie')?.split('; ').find(c => c.startsWith('health_procure_user_id='));
    return userCookie?.split('=')[1] ?? '';
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

  const newRequest: Omit<ProcurementRequest, 'id'> = {
    ...requestData,
    submittedBy: user.id,
    status: 'Pending District Approval',
    createdAt: new Date().toISOString(),
    auditLog: [
      {
        action: 'Submitted',
        user: user.name,
        date: new Date().toISOString(),
      },
    ],
  };
  
  await addRow(newRequest);
  revalidatePath('/dashboard');
}

export async function updateRequest(request: ProcurementRequest) {
    await updateRowByField('id', request.id, request);
    revalidatePath('/dashboard');
}
