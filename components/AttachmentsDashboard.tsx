import React, { useState } from 'react';
import { Expense, Category, Status, ExpenseAttachment } from '../types';
import { DocumentArrowDownIcon } from './Icons';

interface AttachmentsDashboardProps {
  expenses: Expense[];
  categories: Category[];
}

const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

const AttachmentsDashboard: React.FC<AttachmentsDashboardProps> = ({ expenses, categories }) => {
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown';

  const allAttachments = expenses.reduce((acc, expense) => {
    const submittedDateStr = new Date(expense.submittedAt).toISOString().split('T')[0];
    if ((dateRange.from && submittedDateStr < dateRange.from) || (dateRange.to && submittedDateStr > dateRange.to)) {
      return acc;
    }
    
    if (expense.attachment) {
        acc.push({ expense, attachment: expense.attachment, type: 'Category' });
    }
    if (expense.subcategoryAttachment) {
        acc.push({ expense, attachment: expense.subcategoryAttachment, type: 'Subcategory' });
    }
    return acc;
  }, [] as { expense: Expense; attachment: ExpenseAttachment; type: string }[]);


  const StatusBadge = ({ status }: { status: Status }) => {
    const baseClasses = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
    switch (status) {
      case Status.APPROVED: return <span className={`${baseClasses} bg-green-100 text-green-800`}>{status}</span>;
      case Status.REJECTED: return <span className={`${baseClasses} bg-red-100 text-red-800`}>{status}</span>;
      case Status.PENDING_APPROVAL: return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>{status}</span>;
      case Status.PENDING_VERIFICATION: return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>{status}</span>;
      default: return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Attachment Library</h2>
      <p className="mt-1 text-sm text-gray-600">Browse and download all expense attachments from a single place.</p>
      
      <div className="p-4 my-6 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
           <div>
            <label htmlFor="from-date-attach" className="block text-sm font-medium text-gray-700">From Date</label>
            <input 
              type="date" 
              id="from-date-attach" 
              name="from" 
              value={dateRange.from} 
              onChange={handleDateChange} 
              className="block w-full py-2 pl-3 pr-2 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
          </div>
          <div>
            <label htmlFor="to-date-attach" className="block text-sm font-medium text-gray-700">To Date</label>
            <input 
              type="date" 
              id="to-date-attach" 
              name="to" 
              value={dateRange.to} 
              onChange={handleDateChange} 
              className="block w-full py-2 pl-3 pr-2 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
          </div>
        </div>
      </div>
      
      <div className="p-6 mt-8 bg-white rounded-lg shadow">
        <div className="flow-root">
          {allAttachments.length > 0 ? (
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Date</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Requestor</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Project</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Attachment Name</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Attachment For</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">Download</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allAttachments.map(({ expense, attachment, type }, index) => (
                      <tr key={`${expense.id}-${type}-${index}`}>
                        <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 whitespace-nowrap sm:pl-0">{formatDate(expense.submittedAt)}</td>
                        <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{expense.requestorName}</td>
                        <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{expense.projectName}</td>
                        <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{getCategoryName(expense.categoryId)}</td>
                        <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap"><StatusBadge status={expense.status} /></td>
                        <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{attachment.name}</td>
                        <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{type}</td>
                        <td className="relative py-4 pl-3 pr-4 text-sm font-medium text-right whitespace-nowrap sm:pr-0">
                          <a 
                            href={`data:${attachment.type};base64,${attachment.data}`} 
                            download={attachment.name} 
                            className="inline-flex items-center p-1 text-primary hover:text-primary-hover"
                            aria-label={`Download ${attachment.name}`}
                          >
                            <DocumentArrowDownIcon className="w-5 h-5"/>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500">No expenses with attachments match the current filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttachmentsDashboard;