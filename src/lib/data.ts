export type Role = "base" | "district" | "state";

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
  | "Pending District Approval"
  | "Pending State Approval"
  | "Approved"
  | "Rejected";

export interface ProcurementRequest {
  id: string;
  itemName: string;
  quantity: number;
  justification: string;
  submittedBy: string; // User ID
  status: RequestStatus;
  createdAt: string;
  auditLog: AuditLogEntry[];
}

export const users: User[] = [
  { id: "state-1", name: "State Officer", role: "state" },
  { id: "district-1", name: "North District Chief", role: "district" },
  { id: "district-2", name: "South District Chief", role: "district" },
  { id: "base-1", name: "Clinic A Manager", role: "base", reportsTo: "district-1" },
  { id: "base-2", name: "Clinic B Manager", role: "base", reportsTo: "district-1" },
  { id: "base-3", name: "Hospital C Lead", role: "base", reportsTo: "district-2" },
  { id: "base-4", name: "Hospital D Lead", role: "base", reportsTo: "district-2" },
];

export const medicalItems = [
  "Ibuprofen 200mg",
  "Amoxicillin 500mg",
  "Sterile Gauze Pads",
  "Nitrile Examination Gloves",
  "Surgical Masks",
  "Insulin Syringes",
  "Saline Solution IV Bags",
  "Digital Thermometers",
];

const now = new Date();

export const requests: ProcurementRequest[] = [
  {
    id: "REQ-001",
    itemName: "Nitrile Examination Gloves",
    quantity: 5000,
    justification: "Quarterly restock for all examination rooms.",
    submittedBy: "base-1",
    status: "Pending District Approval",
    createdAt: new Date(now.setDate(now.getDate() - 10)).toISOString(),
    auditLog: [
      {
        action: "Submitted",
        user: "Clinic A Manager",
        date: new Date(now.setDate(now.getDate() - 10)).toISOString(),
      },
    ],
  },
  {
    id: "REQ-002",
    itemName: "Ibuprofen 200mg",
    quantity: 10000,
    justification: "High demand due to seasonal flu outbreak.",
    submittedBy: "base-2",
    status: "Pending State Approval",
    createdAt: new Date(now.setDate(now.getDate() - 8)).toISOString(),
    auditLog: [
      {
        action: "Submitted",
        user: "Clinic B Manager",
        date: new Date(now.setDate(now.getDate() - 8)).toISOString(),
      },
      {
        action: "Approved",
        user: "North District Chief",
        date: new Date(now.setDate(now.getDate() - 7)).toISOString(),
        comment: "Seems reasonable given the circumstances. Pushing to state for final approval.",
      },
    ],
  },
  {
    id: "REQ-003",
    itemName: "Surgical Masks",
    quantity: 20000,
    justification: "Replenishing stock for surgical staff and patient distribution.",
    submittedBy: "base-3",
    status: "Approved",
    createdAt: new Date(now.setDate(now.getDate() - 5)).toISOString(),
    auditLog: [
      {
        action: "Submitted",
        user: "Hospital C Lead",
        date: new Date(now.setDate(now.getDate() - 5)).toISOString(),
      },
      {
        action: "Approved",
        user: "South District Chief",
        date: new Date(now.setDate(now.getDate() - 4)).toISOString(),
        comment: "Standard request, approved.",
      },
      {
        action: "Approved",
        user: "State Officer",
        date: new Date(now.setDate(now.getDate() - 3)).toISOString(),
        comment: "Final approval granted.",
      },
    ],
  },
  {
    id: "REQ-004",
    itemName: "Saline Solution IV Bags",
    quantity: 500,
    justification: "Urgent need for the emergency department.",
    submittedBy: "base-4",
    status: "Rejected",
    createdAt: new Date(now.setDate(now.getDate() - 2)).toISOString(),
    auditLog: [
      {
        action: "Submitted",
        user: "Hospital D Lead",
        date: new Date(now.setDate(now.getDate() - 2)).toISOString(),
      },
      {
        action: "Rejected",
        user: "South District Chief",
        date: new Date(now.setDate(now.getDate() - 1)).toISOString(),
        comment: "Quantity seems excessive for a single department. Please revise and resubmit with more detailed justification.",
      },
    ],
  },
];
