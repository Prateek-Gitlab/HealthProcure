
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
  {id: 'district-1', name: 'North District Chief', role: 'district'},
  {id: 'district-2', name: 'South District Chief', role: 'district'},
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

const now = new Date();

export const initialRequests: ProcurementRequest[] = [
  {
    id: 'REQ-001',
    category: 'Equipment',
    itemName: 'Nitrile Examination Gloves',
    quantity: 5000,
    justification: 'Quarterly restock for all examination rooms.',
    submittedBy: 'base-1',
    status: 'Pending District Approval',
    createdAt: new Date(new Date().setDate(now.getDate() - 10)).toISOString(),
    auditLog: [
      {
        action: 'Submitted',
        user: 'PHC1',
        date: new Date(new Date().setDate(now.getDate() - 10)).toISOString(),
      },
    ],
  },
  {
    id: 'REQ-002',
    category: 'Equipment',
    itemName: 'Ibuprofen 200mg',
    quantity: 10000,
    justification: 'High demand due to seasonal flu outbreak.',
    submittedBy: 'base-2',
    status: 'Pending State Approval',
    createdAt: new Date(new Date().setDate(now.getDate() - 8)).toISOString(),
    auditLog: [
      {
        action: 'Submitted',
        user: 'PHC2',
        date: new Date(new Date().setDate(now.getDate() - 8)).toISOString(),
      },
      {
        action: 'Approved',
        user: 'North District Chief',
        date: new Date(new Date().setDate(now.getDate() - 7)).toISOString(),
        comment:
          'Seems reasonable given the circumstances. Pushing to state for final approval.',
      },
    ],
  },
  {
    id: 'REQ-003',
    category: 'Equipment',
    itemName: 'Surgical Masks',
    quantity: 20000,
    justification:
      'Replenishing stock for surgical staff and patient distribution.',
    submittedBy: 'base-3',
    status: 'Approved',
    createdAt: new Date(new Date().setDate(now.getDate() - 5)).toISOString(),
    auditLog: [
      {
        action: 'Submitted',
        user: 'PHC3',
        date: new Date(new Date().setDate(now.getDate() - 5)).toISOString(),
      },
      {
        action: 'Approved',
        user: 'South District Chief',
        date: new Date(new Date().setDate(now.getDate() - 4)).toISOString(),
        comment: 'Standard request, approved.',
      },
      {
        action: 'Approved',
        user: 'State Officer',
        date: new Date(new Date().setDate(now.getDate() - 3)).toISOString(),
        comment: 'Final approval granted.',
      },
    ],
  },
  {
    id: 'REQ-004',
    category: 'Equipment',
    itemName: 'Saline Solution IV Bags',
    quantity: 500,
    justification: 'Urgent need for the emergency department.',
    submittedBy: 'base-4',
    status: 'Rejected',
    createdAt: new Date(new Date().setDate(now.getDate() - 2)).toISOString(),
    auditLog: [
      {
        action: 'Submitted',
        user: 'PHC4',
        date: new Date(new Date().setDate(now.getDate() - 2)).toISOString(),
      },
      {
        action: 'Rejected',
        user: 'South District Chief',
        date: new Date(new Date().setDate(now.getDate() - 1)).toISOString(),
        comment:
          'Quantity seems excessive for a single department. Please revise and resubmit with more detailed justification.',
      },
    ],
  },
];

const REQUESTS_STORAGE_KEY = 'health_procure_requests';

export function getStoredRequests(): ProcurementRequest[] {
  if (typeof window === 'undefined') {
    return initialRequests;
  }
  try {
    const stored = window.localStorage.getItem(REQUESTS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Backwards compatibility for requests created before categories
      return parsed.map((req: any) => ({
        ...req,
        category: req.category || 'Equipment'
      }));
    } else {
      window.localStorage.setItem(
        REQUESTS_STORAGE_KEY,
        JSON.stringify(initialRequests)
      );
      return initialRequests;
    }
  } catch (error) {
    console.error('Failed to access localStorage:', error);
    return initialRequests;
  }
}

export function saveStoredRequests(requests: ProcurementRequest[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

// Legacy export for files that might still use it temporarily.
export const requests = initialRequests;
