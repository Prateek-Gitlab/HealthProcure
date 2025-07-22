import { getRequests } from "./sheets";

export type Role = 'base' | 'district' | 'state';

export interface User {
  id: string;
  name: string;
  role: Role;
  reportsTo?: string;
}

export interface AuditLogEntry {
  action: string;
  user: string;
  date: string;
  comment?: string;
}

export type RequestStatus =
  | 'Pending District Approval'
  | 'Pending State Approval'
  | 'Approved'
  | 'Rejected';

export const procurementCategories = ['HR', 'Infrastructure', 'Equipment', 'Training'] as const;
export type ProcurementCategory = typeof procurementCategories[number];

export interface ProcurementRequest {
  id: string;
  category: ProcurementCategory;
  itemName: string;
  quantity: number;
  justification: string;
  submittedBy: string; // User ID
  status: RequestStatus;
  createdAt: string;
  auditLog: AuditLogEntry[];
}

export const users: User[] = [
  {id: 'state-1', name: 'State Officer', role: 'state'},
  {id: 'district-1', name: 'District Office 1', role: 'district'},
  {id: 'district-2', name: 'District Office 2', role: 'district'},
  {
    id: 'base-1',
    name: 'PHC1',
    role: 'base',
    reportsTo: 'district-1',
  },
  {
    id: 'base-2',
    name: 'PHC2',
    role: 'base',
    reportsTo: 'district-1',
  },
  {
    id: 'base-3',
    name: 'PHC3',
    role: 'base',
    reportsTo: 'district-2',
  },
  {
    id: 'base-4',
    name: 'PHC4',
    role: 'base',
    reportsTo: 'district-2',
  },
];

const hrItems = [
  'Medical Officer (MBBS)',
  'AYUSH MO',
  'Staff Nurse',
  'Pharmacist',
  'Lab Technician',
  'FHS',
  'FHW',
  'MPHW',
  'Accountant/DEO',
  'Peon',
  'Sweeper',
  'Security',
];

const infrastructureItems = [
  'New Building Construction',
  'Building Renovation',
  'Plumbing/Electrical Work',
  'Furniture',
];

const equipmentItems = [
  'Radiant Warmer',
  'X-Ray Machine',
  '3 Part Hematology analyzer',
  'ESR analyzer',
  'HbA1C Analyzer',
  'Hemoglobinometer',
  'Glucometer',
  'Suction Machine',
  'Pulse oximeter',
  'Labour Bed',
  'Fetal Doppler',
  'Phototherapy Unit',
  'Examination Table with footstep',
  'BP apparatus',
  'Foot Operated Suction Machine',
  'ILR with Voltage Stabilizer',
  'DF Small with Voltage Stabilizer',
  'Blood group kit',
  'Wet mounting and gram staining',
  'Emergency Drug Tray',
  'Oxygen Cylinder',
  'Ambu Bags (for adult & neonatal)',
  'Delivery Trolley',
  'Lights for conducting deliveries',
  'Delivery tray',
  'Episiotomy tray',
  'Baby tray',
  'MVA tray',
  'PPIUCD tray',
  'Kelly pads',
  'Sponge holding forceps',
  'Vulsellum uterine forceps',
  'Normal Delivery Kit',
  'Equipment for assisted forceps delivery',
  'Standard Surgical Set (for minor procedures)',
  'Equipment for Manual Vacuum Aspiration',
  'IUCD insertion kit',
];

const trainingItems = [
  'CPR Training',
  'Advanced First Aid',
  'Medical Software Training',
  'New Equipment Training',
];

export const categorizedItems = {
  HR: hrItems,
  Infrastructure: infrastructureItems,
  Equipment: equipmentItems,
  Training: trainingItems,
}

export function getItemsForCategory(category: ProcurementCategory): string[] {
  return categorizedItems[category] || [];
}

/**
 * @deprecated The `medicalItems` export is deprecated. Use `categorizedItems` or `getItemsForCategory` instead.
 */
export const medicalItems = equipmentItems;

export async function getProcurementRequests(): Promise<ProcurementRequest[]> {
    return getRequests();
}
