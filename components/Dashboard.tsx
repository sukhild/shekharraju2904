
import React from 'react';
import { User, Expense, Category, Role, Status } from '../types';
import Header from './Header';
import AdminPanel from './AdminPanel';
import RequestorDashboard from './RequestorDashboard';
import VerifierDashboard from './VerifierDashboard';
import ApproverDashboard from './ApproverDashboard';

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

  const renderContent = () => {
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={currentUser} onLogout={onLogout} />
      <main className="py-10">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
