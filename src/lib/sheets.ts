'use server';

import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import type { ProcurementRequest } from './data';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '';
const SHEET_NAME = 'ProcurementRequests';

if (!process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
    throw new Error('GOOGLE_SHEETS_PRIVATE_KEY environment variable not set');
}
if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL) {
    throw new Error('GOOGLE_SHEETS_CLIENT_EMAIL environment variable not set');
}

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
  key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);

const headers = [
  'id',
  'category',
  'itemName',
  'quantity',
  'justification',
  'submittedBy',
  'status',
  'createdAt',
  'auditLog',
];

async function getSheet() {
  await doc.loadInfo();
  let sheet = doc.sheetsByTitle[SHEET_NAME];
  if (!sheet) {
    sheet = await doc.addSheet({ title: SHEET_NAME, headerValues: headers });
  }
  return sheet;
}

// Ensure headers are set
async function ensureHeaders(sheet: any) {
    const currentHeaders = await sheet.headerValues;
    if (!currentHeaders || currentHeaders.length === 0) {
        await sheet.setHeaderRow(headers);
    }
}

export async function getRequests(): Promise<ProcurementRequest[]> {
  const sheet = await getSheet();
  const rows = await sheet.getRows();
  return rows.map(row => {
    const rowData = row.toObject();
    return {
      ...rowData,
      quantity: Number(rowData.quantity),
      auditLog: JSON.parse(rowData.auditLog || '[]'),
    } as ProcurementRequest;
  });
}

export async function addRow(newRequest: Omit<ProcurementRequest, 'id'>): Promise<ProcurementRequest> {
  const sheet = await getSheet();
  const id = `REQ-${String(Date.now()).slice(-6)}`;
  const requestWithId = { 
    ...newRequest,
    id,
    auditLog: JSON.stringify(newRequest.auditLog) 
  };
  await sheet.addRow(requestWithId as any);
  return { ...newRequest, id };
}

export async function updateRowByField(field: keyof ProcurementRequest, value: any, updatedData: Partial<ProcurementRequest>) {
  const sheet = await getSheet();
  const rows = await sheet.getRows();
  const rowIndex = rows.findIndex(row => row.get(field) === value);
  
  if (rowIndex > -1) {
    const row = rows[rowIndex];
    Object.keys(updatedData).forEach(key => {
      const dataKey = key as keyof ProcurementRequest;
      let dataValue = updatedData[dataKey];
      if (dataKey === 'auditLog' && Array.isArray(dataValue)) {
        dataValue = JSON.stringify(dataValue);
      }
      row.set(dataKey, dataValue as any);
    });
    await row.save();
  } else {
    throw new Error(`Row with ${field} = ${value} not found.`);
  }
}
