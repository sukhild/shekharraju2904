export enum Role {
  ADMIN = 'admin',
  REQUESTOR = 'requestor',
  VERIFIER = 'verifier',
  APPROVER = 'approver',
}

export enum Status {
  PENDING_VERIFICATION = 'Pending Verification',
  PENDING_APPROVAL = 'Pending Approval',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
}

export interface Subcategory {
  id: string;
  name: string;
  attachmentRequired: boolean;
}

export interface Category {
  id:string;
  name: string;
  attachmentRequired: boolean;
  autoApproveAmount: number;
  subcategories?: Subcategory[];
}

export interface ExpenseAttachment {
  name: string;
  type: string;
  data: string; // base64
}

export interface HistoryItem {
  actorId: string;
  actorName: string;
  action: string;
  timestamp: string; // ISO string
  comment?: string;
}

export interface Expense {
  id: string;
  referenceNumber: string;
  requestorId: string;
  requestorName: string;
  categoryId: string;
  subcategoryId?: string;
  amount: number;
  description: string;
  projectName: string;
  sitePlace: string;
  submittedAt: string; // ISO string
  status: Status;
  attachment?: ExpenseAttachment;
  subcategoryAttachment?: ExpenseAttachment;
  history: HistoryItem[];
}

export interface AuditLogItem {
  id: string;
  timestamp: string; // ISO string
  actorId: string;
  actorName: string;
  action: string;
  details: string;
}
