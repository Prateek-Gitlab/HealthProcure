'use server';

import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import type { ProcurementRequest } from './data';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '';
const SHEET_NAME = 'ProcurementRequests';

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
  const doc = await getDoc();
  if (!doc) return null;

  await doc.loadInfo();
  let sheet = doc.sheetsByTitle[SHEET_NAME];
  if (!sheet) {
    sheet = await doc.addSheet({ title: SHEET_NAME, headerValues: headers });
  }
  return sheet;
}

export async function getRequests(): Promise<ProcurementRequest[]> {
  const sheet = await getSheet();
  if (!sheet) return [];
  
  try {
    await sheet.loadHeaderRow();
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
        auditLog: auditLog,
      } as ProcurementRequest;
    });
  } catch (error) {
    console.error("Error fetching requests from Google Sheets:", error);
    return [];
  }
}

export async function addRow(newRequest: Omit<ProcurementRequest, 'id'>): Promise<ProcurementRequest> {
  const sheet = await getSheet();
  if (!sheet) {
    throw new Error("Application is not configured to connect to the database.");
  }
  const id = `REQ-${String(Date.now()).slice(-6)}`;
  
  const requestForSheet = { 
    ...newRequest,
    id,
    auditLog: JSON.stringify(newRequest.auditLog),
  };

  await sheet.addRow(requestForSheet);
  return { ...newRequest, id };
}

export async function updateRowByField(field: keyof ProcurementRequest, value: any, updatedData: Partial<ProcurementRequest>) {
  const sheet = await getSheet();
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
