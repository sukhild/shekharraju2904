
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

export interface Category {
  id: string;
  name: string;
  attachmentRequired: boolean;
  autoApproveAmount: number;
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
  requestorId: string;
  requestorName: string;
  categoryId: string;
  amount: number;
  description: string;
  submittedAt: string; // ISO string
  status: Status;
  attachment?: ExpenseAttachment;
  history: HistoryItem[];
}
