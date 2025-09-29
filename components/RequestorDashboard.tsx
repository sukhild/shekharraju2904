import React, { useState } from 'react';
import { User, Expense, Category, Role, Status } from '../types';
import ExpenseList from './ExpenseList';
import Modal from './Modal';
import ExpenseForm from './ExpenseForm';
import { PlusIcon } from './Icons';

interface RequestorDashboardProps {
  currentUser: User;
  expenses: Expense[];
  categories: Category[];
  onAddExpense: (expenseData: Omit<Expense, 'id' | 'status' | 'submittedAt' | 'history' | 'requestorId' | 'requestorName'>) => void;
}

const RequestorDashboard: React.FC<RequestorDashboardProps> = ({ currentUser, expenses, categories, onAddExpense }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const filteredExpenses = expenses.filter(expense => {
    if (statusFilter !== 'All' && expense.status !== statusFilter) {
      return false;
    }
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
      <div className="sm:flex sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">My Expenses</h2>
        <div className="mt-3 sm:ml-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-3 py-2 text-sm font-semibold text-white rounded-md shadow-sm bg-primary hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Submit New Expense
          </button>
        </div>
      </div>

      <div className="p-4 my-6 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">Status</label>
            <select 
              id="status-filter" 
              name="status"
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value as Status | 'All')} 
              className="block w-full py-2 pl-3 pr-10 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
              <option value="All">All Statuses</option>
              {Object.values(Status).map(s => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
           <div>
            <label htmlFor="from-date" className="block text-sm font-medium text-gray-700">From</label>
            <input 
              type="date" 
              id="from-date" 
              name="from" 
              value={dateRange.from} 
              onChange={handleDateChange} 
              className="block w-full py-2 pl-3 pr-2 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
          </div>
          <div>
            <label htmlFor="to-date" className="block text-sm font-medium text-gray-700">To</label>
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
          title="My Expense History"
          emptyMessage="No expenses match the current filters."
          userRole={Role.REQUESTOR}
        />
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Expense Request">
        <ExpenseForm 
            categories={categories}
            onSubmit={onAddExpense}
            onClose={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default RequestorDashboard;