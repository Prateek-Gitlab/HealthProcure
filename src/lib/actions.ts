'use server';

import { revalidatePath } from 'next/cache';
import type { ProcurementRequest } from './data';
import { users } from './data';
import { addRow, updateRowByField } from './sheets';
import { cookies } from 'next/headers';

export async function login(userId: string) {
  const user = users.find(u => u.id === userId);
  if (user) {
    cookies().set('health_procure_user_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    return { success: true };
  }
  return { success: false, error: 'User not found' };
}

export async function logout() {
  cookies().delete('health_procure_user_id');
}


export async function addRequest(
  requestData: Omit<ProcurementRequest, 'id' | 'createdAt' | 'auditLog' | 'status' | 'submittedBy'>,
  userId: string
) {
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
