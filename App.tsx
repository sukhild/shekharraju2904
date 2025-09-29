import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { User, Expense, Category, Role, Status } from './types';
import { USERS, CATEGORIES, EXPENSES } from './constants';
import * as Notifications from './notifications';

const generateReferenceNumber = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `EXP-${year}${month}${day}-${randomSuffix}`;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(USERS);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [expenses, setExpenses] = useState<Expense[]>(EXPENSES);

  useEffect(() => {
    // Attempt to load user from local storage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (username: string, password_input: string): boolean => {
    const user = users.find(u => u.username === username && u.password === password_input);
    if (user) {
      const userToStore = { ...user };
      delete userToStore.password; // Don't store password
      setCurrentUser(userToStore);
      localStorage.setItem('currentUser', JSON.stringify(userToStore));
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const handleAddExpense = (expenseData: Omit<Expense, 'id' | 'status' | 'submittedAt' | 'history' | 'requestorId' | 'requestorName' | 'referenceNumber'>) => {
    if (!currentUser) return;

    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      referenceNumber: generateReferenceNumber(),
      requestorId: currentUser.id,
      requestorName: currentUser.name,
      submittedAt: new Date().toISOString(),
      status: Status.PENDING_VERIFICATION,
      history: [{
        actorId: currentUser.id,
        actorName: currentUser.name,
        action: 'Submitted',
        timestamp: new Date().toISOString(),
      }]
    };

    const category = categories.find(c => c.id === newExpense.categoryId);
    // Auto-approve logic
    if (category && newExpense.amount <= category.autoApproveAmount) {
      newExpense.status = Status.APPROVED;
      newExpense.history.push({
        actorId: 'system',
        actorName: 'System',
        action: 'Auto-Approved',
        timestamp: new Date().toISOString(),
        comment: `Amount is within auto-approval limit of ₹${category.autoApproveAmount.toLocaleString('en-IN')}.`
      });
    }

    setExpenses(prev => [newExpense, ...prev]);

    // Notifications
    if (category) {
        Notifications.notifyRequestorOnSubmission(currentUser, newExpense, category.name);
        if (newExpense.status === Status.PENDING_VERIFICATION) {
            const verifiers = users.filter(u => u.role === Role.VERIFIER);
            Notifications.notifyVerifiersOnSubmission(verifiers, newExpense, category.name);
        }
    }
  };

  const handleUpdateExpenseStatus = (expenseId: string, newStatus: Status, comment?: string) => {
    if (!currentUser) return;

    setExpenses(prevExpenses => {
      const newExpenses = [...prevExpenses];
      const expenseIndex = newExpenses.findIndex(e => e.id === expenseId);
      if (expenseIndex === -1) return prevExpenses;

      const expenseToUpdate = { ...newExpenses[expenseIndex] };
      const oldStatus = expenseToUpdate.status;
      expenseToUpdate.status = newStatus;
      
      let action = '';
      if (newStatus === Status.PENDING_APPROVAL) action = 'Verified';
      else if (newStatus === Status.APPROVED) action = 'Approved';
      else if (newStatus === Status.REJECTED) action = 'Rejected';

      expenseToUpdate.history = [...expenseToUpdate.history, {
        actorId: currentUser.id,
        actorName: currentUser.name,
        action,
        timestamp: new Date().toISOString(),
        comment
      }];

      newExpenses[expenseIndex] = expenseToUpdate;
      
      // Notifications
      const requestor = users.find(u => u.id === expenseToUpdate.requestorId);
      const category = categories.find(c => c.id === expenseToUpdate.categoryId);
      if (requestor && category) {
          Notifications.notifyOnStatusChange(requestor, expenseToUpdate, category.name, comment);
          if (oldStatus === Status.PENDING_VERIFICATION && newStatus === Status.PENDING_APPROVAL) {
              const approvers = users.filter(u => u.role === Role.APPROVER);
              Notifications.notifyApproversOnVerification(approvers, expenseToUpdate, category.name);
          }
      }

      return newExpenses;
    });
  };

  const handleAddUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = { ...userData, id: `user-${Date.now()}` };
    setUsers(prev => [...prev, newUser]);
  };
  
  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
  };
  
  const onDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };
  
  const handleAddCategory = (categoryData: Omit<Category, 'id'>) => {
    const newCategory: Category = { ...categoryData, id: `cat-${Date.now()}` };
    setCategories(prev => [...prev, newCategory]);
  };
  
  const handleUpdateCategory = (updatedCategory: Category) => {
    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
  };
  
  const onDeleteCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
  };


  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Dashboard
      currentUser={currentUser}
      users={users}
      categories={categories}
      expenses={expenses}
      onLogout={handleLogout}
      onAddExpense={handleAddExpense}
      onUpdateExpenseStatus={handleUpdateExpenseStatus}
      onAddUser={handleAddUser}
      onUpdateUser={handleUpdateUser}
      onDeleteUser={onDeleteUser}
      onAddCategory={handleAddCategory}
      onUpdateCategory={handleUpdateCategory}
      onDeleteCategory={onDeleteCategory}
    />
  );
};

export default App;