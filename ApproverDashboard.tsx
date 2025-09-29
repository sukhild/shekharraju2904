import React, { useState } from 'react';
import { Expense, Category, Status, Role, User } from '../types';
import ExpenseList from './ExpenseList';

interface ApproverDashboardProps {
  currentUser: User;
  expenses: Expense[];
  categories: Category[];
  onUpdateExpenseStatus: (expenseId: string, newStatus: Status, comment?: string) => void;
}

type FilterType = Status | 'All' | 'Pending';

const ApproverDashboard: React.FC<ApproverDashboardProps> = ({ expenses, categories, onUpdateExpenseStatus }) => {
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [statusFilter, setStatusFilter] = useState<FilterType>('Pending');

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const filteredExpenses = expenses.filter(expense => {
    let statusMatch = true;
    if (statusFilter === 'Pending') {
        statusMatch = expense.status === Status.PENDING_APPROVAL;
    } else if (statusFilter !== 'All') {
        statusMatch = expense.status === statusFilter;
    }
    if (!statusMatch) return false;
    
    const submittedDateStr = new Date(expense.submittedAt).toISOString().split('T')[0];
    if (dateRange.from && submittedDateStr < dateRange.from) {
      return false;
    }
    if (dateRange.to && submittedDateStr > dateRange.to) {
      return false;
    }
    return true;
  });

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Approval Tasks</h2>
      <p className="mt-1 text-sm text-gray-600">Review, approve, and track verified expense requests.</p>

      <div className="p-4 my-6 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">Status</label>
            <select 
              id="status-filter" 
              name="status"
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value as FilterType)} 
              className="block w-full py-2 pl-3 pr-10 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
              <option value="Pending">Pending My Action</option>
              <option value="All">All</option>
              <option value={Status.APPROVED}>{Status.APPROVED}</option>
              <option value={Status.REJECTED}>{Status.REJECTED}</option>
            </select>
          </div>
           <div>
            <label htmlFor="from-date" className="block text-sm font-medium text-gray-700">From Date</label>
            <input 
              type="date" 
              id="from-date" 
              name="from" 
              value={dateRange.from} 
              onChange={handleDateChange} 
              className="block w-full py-2 pl-3 pr-2 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
          </div>
          <div>
            <label htmlFor="to-date" className="block text-sm font-medium text-gray-700">To Date</label>
            <input 
              type="date" 
              id="to-date" 
              name="to" 
              value={dateRange.to} 
              onChange={handleDateChange} 
              className="block w-full py-2 pl-3 pr-2 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ExpenseList
          expenses={filteredExpenses}
          categories={categories}
          title="Expense Requests"
          emptyMessage="There are no expenses matching the current filters."
          userRole={Role.APPROVER}
          onUpdateStatus={onUpdateExpenseStatus}
        />
      </div>
    </div>
  );
};

export default ApproverDashboard;