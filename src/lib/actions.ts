
'use server';

import { revalidatePath } from 'next/cache';
import type { ProcurementRequest, ProcurementCategory, Priority } from './data';
import { getAllUsers } from './data';
import { addRow, updateRowByField } from './sheets';
import { cookies } from 'next/headers';

export async function login(userId: string) {
  const users = await getAllUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    const cookieStore = cookies();
    cookieStore.set('health_procure_user_id', userId, {
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
  const cookieStore = cookies();
  cookieStore.delete('health_procure_user_id');
}

interface NewRequestData {
  itemName: string;
  category: ProcurementCategory;
  quantity: number;
  priority: Priority;
  justification: string;
}

export async function addRequest(
  requestData: NewRequestData,
  userId: string
): Promise<ProcurementRequest | null> {
  if (!userId) {
    console.error('Add request failed: User not authenticated');
    return null;
  }
  const users = await getAllUsers();
  const user = users.find(u => u.id === userId);
  if (!user) {
    console.error(`Add request failed: User with ID ${userId} not found`);
    return null;
  }

  const newRequest: Omit<ProcurementRequest, 'id'> = {
    ...requestData,
    submittedBy: user.id,
    status: 'Pending Taluka Approval',
    createdAt: new Date().toISOString(),
    auditLog: [
      {
        action: 'Submitted',
        user: user.name,
        date: new Date().toISOString(),
      },
    ],
  };
  
  try {
    const addedRequest = await addRow(newRequest);
    revalidatePath('/dashboard');
    return addedRequest;
  } catch (error) {
    console.error('Failed to add request to sheet:', error);
    return null;
  }
}

export async function updateRequest(request: ProcurementRequest, userId: string) {
  if (!userId) {
    throw new Error('User not authenticated');
  }
  const users = await getAllUsers();
  const user = users.find(u => u.id === userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  await updateRowByField('id', request.id, request);
  revalidatePath('/dashboard');
}
