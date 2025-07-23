
'use server';

import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import type { ProcurementRequest, User } from './data';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '';
const PROCUREMENT_SHEET_NAME = 'ProcurementRequests';
const USERS_SHEET_NAME = 'Users';


function areCredsAvailable() {
  return (
    process.env.GOOGLE_SHEETS_PRIVATE_KEY &&
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL &&
    process.env.GOOGLE_SHEET_ID
  );
}

async function getDoc() {
  if (!areCredsAvailable()) {
    console.warn("Google Sheets credentials are not available. Skipping sheet operations.");
    return null;
  }
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    key: (process.env.GOOGLE_SHEETS_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
}


const procurementHeaders = [
  'id',
  'category',
  'itemName',
  'quantity',
  'pricePerUnit',
  'priority',
  'justification',
  'submittedBy',
  'status',
  'createdAt',
  'auditLog',
];

const userHeaders = [
    'id',
    'name',
    'role',
    'reportsTo'
];

async function getSheet(sheetName: string, headers: string[]) {
  const doc = await getDoc();
  if (!doc) return null;

  await doc.loadInfo();
  let sheet = doc.sheetsByTitle[sheetName];
  if (!sheet) {
    sheet = await doc.addSheet({ title: sheetName, headerValues: headers });
  } else {
    // This ensures the headers are always what the code expects.
    await sheet.setHeaderRow(headers);
  }
  return sheet;
}

export async function getUsers(): Promise<User[]> {
    const sheet = await getSheet(USERS_SHEET_NAME, userHeaders);
    if (!sheet) return [];

    try {
        const rows = await sheet.getRows();
        return rows.map(row => row.toObject() as User);
    } catch (error) {
        console.error("Error fetching users from Google Sheets:", error);
        return [];
    }
}


export async function getRequests(): Promise<ProcurementRequest[]> {
  const sheet = await getSheet(PROCUREMENT_SHEET_NAME, procurementHeaders);
  if (!sheet) return [];
  
  try {
    const rows = await sheet.getRows();
    return rows.map(row => {
      const rowData = row.toObject();
      let auditLog = [];
      try {
        if (rowData.auditLog && typeof rowData.auditLog === 'string') {
          auditLog = JSON.parse(rowData.auditLog);
        }
      } catch (e) {
        console.error(`Failed to parse auditLog for request ID ${rowData.id}:`, e);
      }
      return {
        ...rowData,
        quantity: Number(rowData.quantity),
        pricePerUnit: rowData.pricePerUnit ? Number(rowData.pricePerUnit) : undefined,
        priority: rowData.priority || 'Medium',
        auditLog: auditLog,
      } as ProcurementRequest;
    });
  } catch (error) {
    console.error("Error fetching requests from Google Sheets:", error);
    return [];
  }
}

export async function addRow(newRequest: Omit<ProcurementRequest, 'id'>): Promise<ProcurementRequest> {
  const sheet = await getSheet(PROCUREMENT_SHEET_NAME, procurementHeaders);
  if (!sheet) {
    throw new Error("Application is not configured to connect to the database.");
  }

  const id = `REQ-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
  const requestWithId = { ...newRequest, id };

  const rowData: { [key: string]: string | number | boolean } = {};
  for (const header of procurementHeaders) {
      const key = header as keyof ProcurementRequest;
      if (key in requestWithId) {
          const value = requestWithId[key];
          if (key === 'auditLog' && Array.isArray(value)) {
              rowData[key] = JSON.stringify(value);
          } else if (value !== undefined) {
              rowData[key] = value as string | number | boolean;
          }
      }
  }

  await sheet.addRow(rowData);
  return requestWithId;
}

export async function updateRowByField(field: keyof ProcurementRequest, value: any, updatedData: Partial<ProcurementRequest>) {
  const sheet = await getSheet(PROCUREMENT_SHEET_NAME, procurementHeaders);
  if (!sheet) {
    throw new Error("Application is not configured to connect to the database.");
  }

  const rows = await sheet.getRows();
  const rowIndex = rows.findIndex(row => row.get(field) === value);
  
  if (rowIndex > -1) {
    const row = rows[rowIndex];
    const updatedDataForSheet = { ...updatedData };
    if (updatedDataForSheet.auditLog) {
      updatedDataForSheet.auditLog = JSON.stringify(updatedData.auditLog) as any;
    }

    Object.keys(updatedDataForSheet).forEach(key => {
        row.set(key, (updatedDataForSheet as any)[key]);
    });
    
    await row.save();
  } else {
    throw new Error(`Row with ${field} = ${value} not found.`);
  }
}
