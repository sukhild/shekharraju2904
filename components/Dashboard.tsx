import React, { useState } from 'react';
import { User, Expense, Category, Role, Status } from '../types';
import Header from './Header';
import AdminPanel from './AdminPanel';
import RequestorDashboard from './RequestorDashboard';
import VerifierDashboard from './VerifierDashboard';
import ApproverDashboard from './ApproverDashboard';
import OverviewDashboard from './OverviewDashboard';

interface DashboardProps {
  currentUser: User;
  users: User[];
  categories: Category[];
  expenses: Expense[];
  onLogout: () => void;
  onAddExpense: (expenseData: Omit<Expense, 'id' | 'status' | 'submittedAt' | 'history' | 'requestorId' | 'requestorName'>) => void;
  onUpdateExpenseStatus: (expenseId: string, newStatus: Status, comment?: string) => void;
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = (props) => {
  const { currentUser, users, categories, expenses, onLogout, onAddExpense, onUpdateExpenseStatus, ...adminProps } = props;
  const [activeTab, setActiveTab] = useState('overview');

  const getRoleSpecificTabName = () => {
    switch(currentUser.role) {
      case Role.ADMIN: return 'Admin Panel';
      case Role.REQUESTOR: return 'My Expenses';
      case Role.VERIFIER: return 'Verification Queue';
      case Role.APPROVER: return 'Approval Queue';
      default: return 'My Tasks';
    }
  };

  const renderRoleSpecificContent = () => {
    switch (currentUser.role) {
      case Role.ADMIN:
        return (
          <AdminPanel 
            users={users}
            categories={categories}
            onAddUser={adminProps.onAddUser}
            onUpdateUser={adminProps.onUpdateUser}
            onDeleteUser={adminProps.onDeleteUser}
            onAddCategory={adminProps.onAddCategory}
            onUpdateCategory={adminProps.onUpdateCategory}
            onDeleteCategory={adminProps.onDeleteCategory}
          />
        );
      case Role.REQUESTOR:
        const myExpenses = expenses.filter(e => e.requestorId === currentUser.id);
        return (
          <RequestorDashboard 
            currentUser={currentUser}
            expenses={myExpenses}
            categories={categories}
            onAddExpense={onAddExpense}
          />
        );
      case Role.VERIFIER:
        const toVerify = expenses.filter(e => e.status === Status.PENDING_VERIFICATION);
        return (
          <VerifierDashboard
            expenses={toVerify}
            categories={categories}
            onUpdateExpenseStatus={onUpdateExpenseStatus}
          />
        );
      case Role.APPROVER:
        const toApprove = expenses.filter(e => e.status === Status.PENDING_APPROVAL);
        return (
          <ApproverDashboard
            expenses={toApprove}
            categories={categories}
            onUpdateExpenseStatus={onUpdateExpenseStatus}
          />
        );
      default:
        return <p>You do not have a role assigned.</p>;
    }
  };

  // Filter expenses for the overview dashboard based on user role
  const overviewExpenses = currentUser.role === Role.REQUESTOR
    ? expenses.filter(e => e.requestorId === currentUser.id)
    : expenses;

  const TabButton = ({ tabName, label }: {tabName: string; label: string}) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`${activeTab === tabName ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
    >
      {label}
    </button>
  )

  return (
    <div className="min-h-screen bg-neutral-100">
      <Header user={currentUser} onLogout={onLogout} />
      <main className="py-10">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px space-x-8" aria-label="Tabs">
              <TabButton tabName="overview" label="Overview" />
              <TabButton tabName="tasks" label={getRoleSpecificTabName()} />
            </nav>
          </div>
          <div className="mt-8">
            {activeTab === 'overview' && (
              <OverviewDashboard 
                expenses={overviewExpenses}
                categories={categories}
              />
            )}
            {activeTab === 'tasks' && renderRoleSpecificContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;