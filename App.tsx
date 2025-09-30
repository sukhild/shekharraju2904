import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { User, Expense, Category, Role, Status, Subcategory, AuditLogItem, Project, Site } from './types';
import { USERS, CATEGORIES, EXPENSES, PROJECTS, SITES } from './constants';
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
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [sites, setSites] = useState<Site[]>(SITES);
  const [expenses, setExpenses] = useState<Expense[]>(EXPENSES);
  const [auditLog, setAuditLog] = useState<AuditLogItem[]>([]);
  const [isDailyBackupEnabled, setDailyBackupEnabled] = useState<boolean>(false);

  useEffect(() => {
    // Attempt to load user from local storage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  // Effect for daily backup trigger simulation
  useEffect(() => {
    if (!isDailyBackupEnabled) {
      return; // Do nothing if the feature is disabled
    }

    const backupInterval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentDayStr = now.toISOString().split('T')[0];

      // Reset the trigger flag for a new day
      if (localStorage.getItem('lastBackupDate') !== currentDayStr) {
        localStorage.removeItem('backupTriggeredToday');
      }

      // Check for backup time (00:05) and ensure it hasn't already been triggered today
      if (hours === 0 && minutes === 5 && !localStorage.getItem('backupTriggeredToday')) {
        console.log("Backup time reached (00:05). Triggering backup email...");

        const backupData = { users, categories, projects, sites, expenses, auditLog };
        const backupJSON = JSON.stringify(backupData, null, 2);
        const admins = users.filter(u => u.role === Role.ADMIN);

        if (admins.length > 0) {
          Notifications.sendBackupEmail(admins, backupJSON);
        }

        // Set flags to prevent re-triggering for today
        localStorage.setItem('backupTriggeredToday', 'true');
        localStorage.setItem('lastBackupDate', currentDayStr);
      }
    }, 30 * 1000); // Check every 30 seconds

    return () => clearInterval(backupInterval);
  }, [isDailyBackupEnabled, users, categories, projects, sites, expenses, auditLog]);


  const addAuditLogEntry = (action: string, details: string) => {
    if (!currentUser) return; // Should not happen if an admin action is taken
    const newLogEntry: AuditLogItem = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.name,
      action,
      details,
    };
    setAuditLog(prev => [newLogEntry, ...prev]);
  };


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
      isHighPriority: false,
      history: [{
        actorId: currentUser.id,
        actorName: currentUser.name,
        action: 'Submitted',
        timestamp: new Date().toISOString(),
      }]
    };

    const category = categories.find(c => c.id === newExpense.categoryId);
    const subcategory = category?.subcategories?.find(sc => sc.id === newExpense.subcategoryId);

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
    const projectName = projects.find(p => p.id === newExpense.projectId)?.name || 'N/A';
    const siteName = sites.find(s => s.id === newExpense.siteId)?.name || 'N/A';

    if (category) {
        Notifications.notifyRequestorOnSubmission(currentUser, newExpense, category.name, subcategory?.name, projectName, siteName);
        if (newExpense.status === Status.PENDING_VERIFICATION) {
            const verifiers = users.filter(u => u.role === Role.VERIFIER);
            Notifications.notifyVerifiersOnSubmission(verifiers, newExpense, category.name, subcategory?.name, projectName, siteName);
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
      const subcategory = category?.subcategories?.find(sc => sc.id === expenseToUpdate.subcategoryId);
      const projectName = projects.find(p => p.id === expenseToUpdate.projectId)?.name || 'N/A';
      const siteName = sites.find(s => s.id === expenseToUpdate.siteId)?.name || 'N/A';

      if (requestor && category) {
          Notifications.notifyOnStatusChange(requestor, expenseToUpdate, category.name, subcategory?.name, projectName, siteName, comment);
          if (oldStatus === Status.PENDING_VERIFICATION && newStatus === Status.PENDING_APPROVAL) {
              const approvers = users.filter(u => u.role === Role.APPROVER);
              Notifications.notifyApproversOnVerification(approvers, expenseToUpdate, category.name, subcategory?.name, projectName, siteName);
          }
      }

      return newExpenses;
    });
  };

  const handleBulkUpdateExpenseStatus = (expenseIds: string[], newStatus: Status, comment?: string) => {
    if (!currentUser) return;

    setExpenses(prevExpenses => {
        const updatedExpenses = prevExpenses.map(expense => {
            if (expenseIds.includes(expense.id)) {
                const oldStatus = expense.status;
                const newExpense = { ...expense, status: newStatus };
                
                let action = '';
                if (newStatus === Status.PENDING_APPROVAL) action = 'Verified';
                else if (newStatus === Status.APPROVED) action = 'Approved';
                else if (newStatus === Status.REJECTED) action = 'Rejected';

                newExpense.history = [...expense.history, {
                    actorId: currentUser.id,
                    actorName: currentUser.name,
                    action,
                    timestamp: new Date().toISOString(),
                    comment
                }];

                // Notifications for each expense
                const requestor = users.find(u => u.id === newExpense.requestorId);
                const category = categories.find(c => c.id === newExpense.categoryId);
                const subcategory = category?.subcategories?.find(sc => sc.id === newExpense.subcategoryId);
                const projectName = projects.find(p => p.id === newExpense.projectId)?.name || 'N/A';
                const siteName = sites.find(s => s.id === newExpense.siteId)?.name || 'N/A';

                if (requestor && category) {
                    Notifications.notifyOnStatusChange(requestor, newExpense, category.name, subcategory?.name, projectName, siteName, comment);
                    if (oldStatus === Status.PENDING_VERIFICATION && newStatus === Status.PENDING_APPROVAL) {
                        const approvers = users.filter(u => u.role === Role.APPROVER);
                        Notifications.notifyApproversOnVerification(approvers, newExpense, category.name, subcategory?.name, projectName, siteName);
                    }
                }
                
                return newExpense;
            }
            return expense;
        });
        return updatedExpenses;
    });

    // Audit Log for bulk action
    let actionVerb = '';
    if (newStatus === Status.PENDING_APPROVAL) actionVerb = 'Verified';
    else if (newStatus === Status.APPROVED) actionVerb = 'Approved';
    else if (newStatus === Status.REJECTED) actionVerb = 'Rejected';
    addAuditLogEntry('Bulk Expense Update', `Bulk action: ${actionVerb} ${expenseIds.length} expense(s).`);
  };

  const handleAddUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = { ...userData, id: `user-${Date.now()}` };
    setUsers(prev => [...prev, newUser]);
    addAuditLogEntry('User Created', `Created user '${newUser.username}' with role '${newUser.role}'.`);
  };
  
  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
    addAuditLogEntry('User Updated', `Updated profile for user '${updatedUser.username}'.`);
  };
  
  const onDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (userToDelete) {
      addAuditLogEntry('User Deleted', `Deleted user '${userToDelete.username}'.`);
    }
  };
  
  const handleAddCategory = (categoryData: Omit<Category, 'id'>) => {
    const newCategory: Category = { ...categoryData, id: `cat-${Date.now()}` };
    setCategories(prev => [...prev, newCategory]);
    addAuditLogEntry('Category Created', `Created category '${newCategory.name}'.`);
  };
  
  const handleUpdateCategory = (updatedCategory: Category) => {
    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
    addAuditLogEntry('Category Updated', `Updated category '${updatedCategory.name}'.`);
  };
  
  const onDeleteCategory = (categoryId: string) => {
    if (expenses.some(e => e.categoryId === categoryId)) {
      alert("This category cannot be deleted because it is associated with existing expenses.");
      return;
    }
    const categoryToDelete = categories.find(c => c.id === categoryId);
    setCategories(prev => prev.filter(c => c.id !== categoryId));
     if (categoryToDelete) {
      addAuditLogEntry('Category Deleted', `Deleted category '${categoryToDelete.name}'.`);
    }
  };

  const handleAddSubcategory = (categoryId: string, subcategoryData: Omit<Subcategory, 'id'>) => {
    const parentCategory = categories.find(c => c.id === categoryId);
    const newSubcategory: Subcategory = { ...subcategoryData, id: `sub-cat-${Date.now()}` };
    setCategories(prev => prev.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          subcategories: [...(c.subcategories || []), newSubcategory]
        };
      }
      return c;
    }));
    if (parentCategory) {
        addAuditLogEntry('Subcategory Created', `Created subcategory '${newSubcategory.name}' under '${parentCategory.name}'.`);
    }
  };

  const handleUpdateSubcategory = (categoryId: string, updatedSubcategory: Subcategory) => {
    const parentCategory = categories.find(c => c.id === categoryId);
    setCategories(prev => prev.map(c => {
      if (c.id === categoryId) {
        const newSubcategories = (c.subcategories || []).map(sc => sc.id === updatedSubcategory.id ? updatedSubcategory : sc);
        return {
          ...c,
          subcategories: newSubcategories
        };
      }
      return c;
    }));
     if (parentCategory) {
      addAuditLogEntry('Subcategory Updated', `Updated subcategory '${updatedSubcategory.name}' under '${parentCategory.name}'.`);
    }
  };

  const onDeleteSubcategory = (categoryId: string, subcategoryId: string) => {
    if (expenses.some(e => e.subcategoryId === subcategoryId)) {
      alert("This subcategory cannot be deleted because it is associated with existing expenses.");
      return;
    }
    const parentCategory = categories.find(c => c.id === categoryId);
    const subcategoryToDelete = parentCategory?.subcategories?.find(sc => sc.id === subcategoryId);
    setCategories(prev => prev.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          subcategories: (c.subcategories || []).filter(sc => sc.id !== subcategoryId)
        };
      }
      return c;
    }));
    if (parentCategory && subcategoryToDelete) {
      addAuditLogEntry('Subcategory Deleted', `Deleted subcategory '${subcategoryToDelete.name}' from '${parentCategory.name}'.`);
    }
  };

  const handleAddProject = (projectData: Omit<Project, 'id'>) => {
    const newProject: Project = { ...projectData, id: `proj-${Date.now()}` };
    setProjects(prev => [...prev, newProject]);
    addAuditLogEntry('Project Created', `Created project '${newProject.name}'.`);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    addAuditLogEntry('Project Updated', `Updated project '${updatedProject.name}'.`);
  };

  const onDeleteProject = (projectId: string) => {
    if (expenses.some(e => e.projectId === projectId)) {
      alert("This project cannot be deleted because it is associated with existing expenses.");
      return;
    }
    const projectToDelete = projects.find(p => p.id === projectId);
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (projectToDelete) {
      addAuditLogEntry('Project Deleted', `Deleted project '${projectToDelete.name}'.`);
    }
  };

  const handleAddSite = (siteData: Omit<Site, 'id'>) => {
    const newSite: Site = { ...siteData, id: `site-${Date.now()}` };
    setSites(prev => [...prev, newSite]);
    addAuditLogEntry('Site/Place Created', `Created site/place '${newSite.name}'.`);
  };

  const handleUpdateSite = (updatedSite: Site) => {
    setSites(prev => prev.map(s => s.id === updatedSite.id ? updatedSite : s));
    addAuditLogEntry('Site/Place Updated', `Updated site/place '${updatedSite.name}'.`);
  };

  const onDeleteSite = (siteId: string) => {
    if (expenses.some(e => e.siteId === siteId)) {
      alert("This site/place cannot be deleted because it is associated with existing expenses.");
      return;
    }
    const siteToDelete = sites.find(s => s.id === siteId);
    setSites(prev => prev.filter(s => s.id !== siteId));
    if (siteToDelete) {
      addAuditLogEntry('Site/Place Deleted', `Deleted site/place '${siteToDelete.name}'.`);
    }
  };

  const handleToggleExpensePriority = (expenseId: string) => {
    const expenseToUpdate = expenses.find(e => e.id === expenseId);
    if (!expenseToUpdate || !currentUser) return;
    
    setExpenses(prev => prev.map(exp => 
      exp.id === expenseId 
        ? { ...exp, isHighPriority: !exp.isHighPriority } 
        : exp
    ));

    const action = !expenseToUpdate.isHighPriority ? 'Marked as High Priority' : 'Removed High Priority';
    addAuditLogEntry('Expense Priority Changed', `${action} for expense '${expenseToUpdate.referenceNumber}'.`);
  };

  const handleToggleDailyBackup = () => {
    const newState = !isDailyBackupEnabled;
    setDailyBackupEnabled(newState);
    addAuditLogEntry('System Setting Changed', `Automatic daily backups ${newState ? 'Enabled' : 'Disabled'}.`);
  };

  const handleManualBackup = () => {
    if (!currentUser) return;

    const backupData = { users, categories, projects, sites, expenses, auditLog };
    const backupJSON = JSON.stringify(backupData, null, 2);
    const blob = new Blob([backupJSON], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}`;
    const filename = `expenseflow-backup-${timestamp}.json`;

    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    addAuditLogEntry('Data Export', 'Generated and downloaded a manual JSON backup.');
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Dashboard
      currentUser={currentUser}
      users={users}
      categories={categories}
      projects={projects}
      sites={sites}
      expenses={expenses}
      auditLog={auditLog}
      isDailyBackupEnabled={isDailyBackupEnabled}
      onLogout={handleLogout}
      onAddExpense={handleAddExpense}
      onUpdateExpenseStatus={handleUpdateExpenseStatus}
      onBulkUpdateExpenseStatus={handleBulkUpdateExpenseStatus}
      onAddUser={handleAddUser}
      onUpdateUser={handleUpdateUser}
      onDeleteUser={onDeleteUser}
      onAddCategory={handleAddCategory}
      onUpdateCategory={handleUpdateCategory}
      onDeleteCategory={onDeleteCategory}
      onAddSubcategory={handleAddSubcategory}
      onUpdateSubcategory={handleUpdateSubcategory}
      onDeleteSubcategory={onDeleteSubcategory}
      onToggleExpensePriority={handleToggleExpensePriority}
      onAddProject={handleAddProject}
      onUpdateProject={handleUpdateProject}
      onDeleteProject={onDeleteProject}
      onAddSite={handleAddSite}
      onUpdateSite={handleUpdateSite}
      onDeleteSite={onDeleteSite}
      onToggleDailyBackup={handleToggleDailyBackup}
      onManualBackup={handleManualBackup}
    />
  );
};

export default App;