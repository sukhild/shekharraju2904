import { User, Category, Expense, Role, Status } from './types';

export const USERS: User[] = [
  { id: 'user-1', username: 'admin', name: 'Admin User', email: 'admin@example.com', password: 'password', role: Role.ADMIN },
  { id: 'user-2', username: 'requestor', name: 'Requestor User', email: 'requestor@example.com', password: 'password', role: Role.REQUESTOR },
  { id: 'user-3', username: 'verifier', name: 'Verifier User', email: 'verifier@example.com', password: 'password', role: Role.VERIFIER },
  { id: 'user-4', username: 'approver', name: 'Approver User', email: 'approver@example.com', password: 'password', role: Role.APPROVER },
];

export const CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Office Supplies', attachmentRequired: false, autoApproveAmount: 500 },
  { id: 'cat-2', name: 'Travel', attachmentRequired: true, autoApproveAmount: 0 },
  { id: 'cat-3', name: 'Food & Dining', attachmentRequired: false, autoApproveAmount: 1000 },
  { id: 'cat-4', name: 'Software Subscription', attachmentRequired: false, autoApproveAmount: 2000 },
];

export const EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    referenceNumber: 'EXP-20240520-A4B1',
    requestorId: 'user-2',
    requestorName: 'Requestor User',
    categoryId: 'cat-1',
    amount: 350,
    description: 'Purchase of new stationery for the team.',
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: Status.APPROVED,
    history: [
      { actorId: 'user-2', actorName: 'Requestor User', action: 'Submitted', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { actorId: 'system', actorName: 'System', action: 'Auto-Approved', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), comment: 'Amount is within auto-approval limit of ₹500.' },
    ],
  },
  {
    id: 'exp-2',
    referenceNumber: 'EXP-20240519-C8D2',
    requestorId: 'user-2',
    requestorName: 'Requestor User',
    categoryId: 'cat-2',
    amount: 8500,
    description: 'Flight tickets for client meeting in Mumbai.',
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: Status.REJECTED,
    attachment: { name: 'flight-ticket.pdf', type: 'application/pdf', data: '' },
    history: [
      { actorId: 'user-2', actorName: 'Requestor User', action: 'Submitted', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { actorId: 'user-3', actorName: 'Verifier User', action: 'Verified', timestamp: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString() },
      { actorId: 'user-4', actorName: 'Approver User', action: 'Rejected', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), comment: 'Please book a cheaper flight.' },
    ],
  },
  {
    id: 'exp-3',
    referenceNumber: 'EXP-20240521-E2F3',
    requestorId: 'user-2',
    requestorName: 'Requestor User',
    categoryId: 'cat-3',
    amount: 1200,
    description: 'Team lunch.',
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: Status.PENDING_VERIFICATION,
    history: [
      { actorId: 'user-2', actorName: 'Requestor User', action: 'Submitted', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 'exp-4',
    referenceNumber: 'EXP-20240522-G6H4',
    requestorId: 'user-2',
    requestorName: 'Requestor User',
    categoryId: 'cat-4',
    amount: 1500,
    description: 'Annual subscription for design tool.',
    submittedAt: new Date().toISOString(),
    status: Status.PENDING_APPROVAL,
    history: [
      { actorId: 'user-2', actorName: 'Requestor User', action: 'Submitted', timestamp: new Date().toISOString() },
      { actorId: 'user-3', actorName: 'Verifier User', action: 'Verified', timestamp: new Date().toISOString() },
    ],
  },
];