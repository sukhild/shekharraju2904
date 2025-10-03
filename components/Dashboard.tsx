// components/Dashboard.tsx
import React, { useState } from "react";
import {
  Expense,
  Category,
  Status,
  AuditLogItem,
  Project,
  Site,
  AvailableBackups,
  Role,
  User,
} from "../types";

import Header from "./Header";
import AdminPanel from "./AdminPanel";
import RequestorDashboard from "./RequestorDashboard";
import VerifierDashboard from "./VerifierDashboard";
import ApproverDashboard from "./ApproverDashboard";
import OverviewDashboard from "./OverviewDashboard";
import AttachmentsDashboard from "./AttachmentsDashboard";
import Modal from "./Modal";
import ExpenseForm from "./ExpenseForm";
import { PlusIcon } from "./Icons";
import ExpenseCard from "./ExpenseCard";

interface DashboardProps {
  currentUser: User | any; // Supabase user object may not match User interface exactly
  categories: Category[];
  projects: Project[];
  sites: Site[];
  expenses: Expense[];
  auditLog: AuditLogItem[];
  isDailyBackupEnabled: boolean;
  availableBackups: AvailableBackups;

  onLogout: () => void;
  onAddExpense: (
    expenseData: Omit<
      Expense,
      | "id"
      | "status"
      | "submittedAt"
      | "history"
      | "requestorId"
      | "requestorName"
      | "referenceNumber"
    >
  ) => void;
  onUpdateExpenseStatus: (
    expenseId: string,
    newStatus: Status,
    comment?: string
  ) => void;
  onBulkUpdateExpenseStatus: (
    expenseIds: string[],
    newStatus: Status,
    comment?: string
  ) => void;
  onToggleExpensePriority: (expenseId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  expenses,
  categories,
  projects,
  sites,
  onLogout,
  onAddExpense,
  onUpdateExpenseStatus,
  onBulkUpdateExpenseStatus,
  onToggleExpensePriority,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isNewExpenseModalOpen, setNewExpenseModalOpen] = useState(false);
  const [modalExpense, setModalExpense] = useState<Expense | null>(null);

  // 🔑 Get role from Supabase metadata or default
  const roleStr: string = currentUser?.user_metadata?.role || "requestor";
  const role: Role =
    roleStr === "admin"
      ? Role.ADMIN
      : roleStr === "verifier"
      ? Role.VERIFIER
      : roleStr === "approver"
      ? Role.APPROVER
      : Role.REQUESTOR;

  const getRoleSpecificTabName = () => {
    switch (role) {
      case Role.ADMIN:
        return "Admin Panel";
      case Role.REQUESTOR:
        return "My Expenses";
      case Role.VERIFIER:
        return "Verification Queue";
      case Role.APPROVER:
        return "Approval Queue";
      default:
        return "My Tasks";
    }
  };

  const renderRoleSpecificContent = () => {
    switch (role) {
      case Role.ADMIN:
        return <AdminPanel />;

      case Role.REQUESTOR:
        const myExpenses = expenses.filter(
          (e) => e.requestorId === currentUser.id
        );
        return (
          <RequestorDashboard
            currentUser={currentUser}
            expenses={myExpenses}
            categories={categories}
            projects={projects}
            sites={sites}
            onViewExpense={setModalExpense}
          />
        );

      case Role.VERIFIER:
        const toVerify = expenses.filter(
          (e) => e.status === Status.PENDING_VERIFICATION
        );
        return (
          <VerifierDashboard
            expenses={toVerify}
            categories={categories}
            projects={projects}
            sites={sites}
            onUpdateExpenseStatus={onUpdateExpenseStatus}
            onBulkUpdateExpenseStatus={onBulkUpdateExpenseStatus}
            onToggleExpensePriority={onToggleExpensePriority}
            onViewExpense={setModalExpense}
          />
        );

      case Role.APPROVER:
        const toApprove = expenses.filter(
          (e) => e.status === Status.PENDING_APPROVAL
        );
        return (
          <ApproverDashboard
            expenses={toApprove}
            categories={categories}
            projects={projects}
            sites={sites}
            onUpdateExpenseStatus={onUpdateExpenseStatus}
            onBulkUpdateExpenseStatus={onBulkUpdateExpenseStatus}
            onToggleExpensePriority={onToggleExpensePriority}
            onViewExpense={setModalExpense}
          />
        );

      default:
        return <p>You do not have a role assigned.</p>;
    }
  };

  // Overview tab shows only personal expenses for requestors
  const overviewExpenses =
    role === Role.REQUESTOR
      ? expenses.filter((e) => e.requestorId === currentUser.id)
      : expenses;

  // Attachments tab only for Admin, Verifier, Approver
  const canSeeAttachmentsTab = [Role.ADMIN, Role.VERIFIER, Role.APPROVER].includes(
    role
  );

  const TabButton = ({
    tabName,
    label,
  }: {
    tabName: string;
    label: string;
  }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`${
        activeTab === tabName
          ? "border-primary text-primary"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-neutral-100">
      <Header
        user={currentUser}
        onLogout={onLogout}
        expenses={expenses}
        categories={categories}
        projects={projects}
        sites={sites}
        onSelectExpense={setModalExpense}
      />

      <main className="py-10">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="pb-5 border-b border-gray-200 sm:flex sm:items-baseline sm:justify-between">
            <nav className="flex -mb-px space-x-8" aria-label="Tabs">
              <TabButton tabName="overview" label="Overview" />
              <TabButton tabName="tasks" label={getRoleSpecificTabName()} />
              {canSeeAttachmentsTab && (
                <TabButton tabName="attachments" label="Attachments" />
              )}
            </nav>

            {/* Requestor → Submit new expense */}
            {activeTab === "tasks" && role === Role.REQUESTOR && (
              <div className="mt-3 sm:ml-4 sm:mt-0">
                <button
                  type="button"
                  onClick={() => setNewExpenseModalOpen(true)}
                  className="inline-flex items-center px-3 py-2 text-sm font-semibold text-white rounded-md shadow-sm bg-primary hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Submit New Expense
                </button>
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="mt-8">
            {activeTab === "overview" && (
              <OverviewDashboard
                expenses={overviewExpenses}
                categories={categories}
                projects={projects}
                sites={sites}
              />
            )}
            {activeTab === "tasks" && renderRoleSpecificContent()}
            {activeTab === "attachments" && canSeeAttachmentsTab && (
              <AttachmentsDashboard
                expenses={expenses}
                categories={categories}
                projects={projects}
                sites={sites}
              />
            )}
          </div>
        </div>
      </main>

      {/* New Expense Modal */}
      <Modal
        isOpen={isNewExpenseModalOpen}
        onClose={() => setNewExpenseModalOpen(false)}
        title="New Expense Request"
      >
        <ExpenseForm
          categories={categories}
          projects={projects}
          sites={sites}
          onSubmit={onAddExpense}
          onClose={() => setNewExpenseModalOpen(false)}
        />
      </Modal>

      {/* Expense Details Modal */}
      {modalExpense && (
        <Modal
          isOpen={!!modalExpense}
          onClose={() => setModalExpense(null)}
          title="Expense Details"
        >
          <ExpenseCard
            expense={modalExpense}
            categories={categories}
            projects={projects}
            sites={sites}
            userRole={role}
            onUpdateStatus={
              onUpdateExpenseStatus
                ? (status, comment) => {
                    onUpdateExpenseStatus(modalExpense.id, status, comment);
                    setModalExpense(null);
                  }
                : undefined
            }
            onToggleExpensePriority={onToggleExpensePriority}
            onClose={() => setModalExpense(null)}
          />
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
