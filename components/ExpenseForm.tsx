import React, { useState, useCallback } from 'react';
import { Category, Expense, ExpenseAttachment } from '../types';
import { PaperClipIcon } from './Icons';

interface ExpenseFormProps {
  categories: Category[];
  onSubmit: (expenseData: Omit<Expense, 'id' | 'status' | 'submittedAt' | 'history' | 'requestorId' | 'requestorName' | 'referenceNumber'>) => void;
  onClose: () => void;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};


const ExpenseForm: React.FC<ExpenseFormProps> = ({ categories, onSubmit, onClose }) => {
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<ExpenseAttachment | undefined>(undefined);
  const [error, setError] = useState('');

  const selectedCategory = categories.find(c => c.id === categoryId);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const base64 = await fileToBase64(file);
      setAttachment({
          name: file.name,
          type: file.type,
          data: base64
      });
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedCategory?.attachmentRequired && !attachment) {
      setError(`An attachment is required for the '${selectedCategory.name}' category.`);
      return;
    }
    
    if (!categoryId || !amount || !description) {
        setError("All fields are required.");
        return;
    }

    onSubmit({
      categoryId,
      amount: parseFloat(amount),
      description,
      attachment
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="block w-full py-2 pl-3 pr-10 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        >
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (₹)</label>
        <div className="relative mt-1 rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
            </div>
            <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="block w-full py-2 pl-7 pr-12 border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="0.00"
            />
        </div>
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
        ></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Attachment {selectedCategory?.attachmentRequired && <span className="text-red-500">*</span>}</label>
        <div className="flex items-center justify-center w-full px-6 pt-5 pb-6 mt-1 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
                <PaperClipIcon className="w-12 h-12 mx-auto text-gray-400"/>
                <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative font-medium rounded-md cursor-pointer text-primary hover:text-primary-hover focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                </div>
                {attachment ? <p className="text-xs text-gray-500">{attachment.name}</p> : <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>}
            </div>
        </div>
      </div>
      
      {error && <p className="text-sm text-red-600">{error}</p>}
      
      <div className="pt-4 text-right">
        <button type="button" onClick={onClose} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-primary hover:bg-primary-hover">Submit Request</button>
      </div>
    </form>
  );
};

export default ExpenseForm;