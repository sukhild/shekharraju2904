import React, { useState, useMemo } from 'react';
import { User, Expense, Category, Role, Status, Project, Site } from '../types';
import ExpenseList from './ExpenseList';

interface RequestorDashboardProps {
  currentUser: User;
  expenses: Expense[];
  categories: Category[];
  projects: Project[];
  sites: Site[];
  onViewExpense: (expense: Expense) => void;
}

const RequestorDashboard: React.FC<RequestorDashboardProps> = ({
  currentUser,
  expenses,
  categories,
  projects,
  sites,
  onViewExpense,
}) => {
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [sortBy, setSortBy] = useState<'priority' | 'date'>('date');

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ✅ Filter first
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (statusFilter !== 'All' && expense.status !== statusFilter) {
        return false;
      }
      const submittedDateStr = new Date(expense.submittedAt).toISOString().split('T')[0];
      if (dateRange.from && submittedDateStr < dateRange.from) return false;
      if (dateRange.to && submittedDateStr > dateRange.to) return false;
      return true;
    });
  }, [expenses, statusFilter, dateRange]);

  // ✅ Then sort
  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => {
      if (sortBy === 'priority') {
        if (a.isHighPriority && !b.isHighPriority) return -1;
        if (!a.isHighPriority && b.isHighPriority) return 1;
      }
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
  }, [filteredExpenses, sortBy]);

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">My Expenses</h2>

      <div className="p-4 my-6 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {/* Status filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status-filter"
              name="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Status | 'All')}
              className="block w-full py-2 pl-3 pr-10 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
              <option value="All">All Statuses</option>
              {Object.values(Status).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Date range: from */}
          <div>
            <label htmlFor="from-date" className="block text-sm font-medium text-gray-700">
              From
            </label>
            <input
              type="date"
              id="from-date"
              name="from"
              value={dateRange.from}
              onChange={handleDateChange}
              className="block w-full py-2 pl-3 pr-2 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>

          {/* Date range: to */}
          <div>
            <label htmlFor="to-date" className="block text-sm font-medium text-gray-700">
              To
            </label>
            <input
              type="date"
              id="to-date"
              name="to"
              value={dateRange.to}
              onChange={handleDateChange}
              className="block w-full py-2 pl-3 pr-2 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>

          {/* Sort */}
          <div>
            <label htmlFor="sort-by-requestor" className="block text-sm font-medium text-gray-700">
              Sort By
            </label>
            <select
              id="sort-by-requestor"
              name="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'priority')}
              className="block w-full py-2 pl-3 pr-10 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
              <option value="date">Submission Date</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ExpenseList
          expenses={sortedExpenses}
          categories={categories}
          projects={projects}
          sites={sites}
          title="My Expense History"
          emptyMessage="No expenses match the current filters."
          userRole={Role.REQUESTOR}
          onViewExpense={onViewExpense}
        />
      </div>
    </div>
  );
};

export default RequestorDashboard;
