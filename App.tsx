import React, { useState, useEffect, useCallback } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import {
  Expense,
  Category,
  Role,
  Status,
  AuditLogItem,
  Project,
  Site,
  AvailableBackups,
} from "./types";
import { CATEGORIES, EXPENSES, PROJECTS, SITES } from "./constants";
import { supabase } from "./supabaseClient";

// --- Helper to generate expense reference numbers ---
const generateReferenceNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EXP-${year}${month}${day}-${randomSuffix}`;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);

  // --- State ---
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [sites, setSites] = useState<Site[]>(SITES);
  const [expenses, setExpenses] = useState<Expense[]>(EXPENSES);
  const [auditLog, setAuditLog] = useState<AuditLogItem[]>([]);
  const [isDailyBackupEnabled, setDailyBackupEnabled] = useState<boolean>(false);
  const [availableBackups, setAvailableBackups] = useState<AvailableBackups>({
    daily: [],
    mirror: [],
  });

  // --- Supabase session management ---
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user));

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setCurrentUser(session?.user ?? null);
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  // --- Login ---
  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      alert(error.message);
      return false;
    }
    setCurrentUser(data.user);
    return true;
  };

  // --- Register ---
  const handleRegister = async (
    email: string,
    password: string,
    role: Role = Role.REQUESTOR,
    fullName?: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role }, // ✅ save role in user_metadata
      },
    });

    if (error) {
      alert(error.message);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: data.user.id,
          email,
          full_name: fullName || email,
          role,
        },
      ]);

      if (profileError) {
        console.error("Profile insert failed:", profileError.message);
      }
    }

    alert(`Registered as ${role}. Check your email to confirm.`);
  };

  // --- Logout ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  // --- Backup cleanup ---
  const scanAndCleanupBackups = useCallback(() => {
    const dailyBackups: string[] = [];
    const mirrorBackups: string[] = [];
    const now = new Date();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("backup_")) {
        dailyBackups.push(key);
      } else if (key?.startsWith("mirror_backup_")) {
        const dateStr = key.replace("mirror_backup_", "");
        const backupDate = new Date(dateStr);
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        if (backupDate < sixMonthsAgo) {
          localStorage.removeItem(key);
        } else {
          mirrorBackups.push(key);
        }
      }
    }

    dailyBackups.sort().reverse();
    if (dailyBackups.length > 20) {
      const toDelete = dailyBackups.slice(20);
      toDelete.forEach((key) => localStorage.removeItem(key));
      dailyBackups.splice(20);
    }

    mirrorBackups.sort().reverse();
    setAvailableBackups({ daily: dailyBackups, mirror: mirrorBackups });
  }, []);

  useEffect(() => {
    scanAndCleanupBackups();
  }, [scanAndCleanupBackups]);

  // --- Audit log ---
  const addAuditLogEntry = (action: string, details: string) => {
    if (!currentUser) return;
    const newLogEntry: AuditLogItem = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.email,
      action,
      details,
    };
    setAuditLog((prev) => [newLogEntry, ...prev]);
  };

  // --- Add expense ---
  const handleAddExpense = (
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
  ) => {
    if (!currentUser) return;

    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      referenceNumber: generateReferenceNumber(),
      requestorId: currentUser.id,
      requestorName: currentUser.email,
      submittedAt: new Date().toISOString(),
      status: Status.PENDING_VERIFICATION,
      isHighPriority: false,
      history: [
        {
          actorId: currentUser.id,
          actorName: currentUser.email,
          action: "Submitted",
          timestamp: new Date().toISOString(),
        },
      ],
    };

    setExpenses((prev) => [newExpense, ...prev]);
    addAuditLogEntry("Expense Submitted", `Expense ${newExpense.referenceNumber} submitted.`);
  };

  // --- Update single expense status ---
  const handleUpdateExpenseStatus = (expenseId: string, newStatus: Status, comment?: string) => {
    setExpenses((prev) =>
      prev.map((exp) =>
        exp.id === expenseId
          ? {
              ...exp,
              status: newStatus,
              history: [
                ...exp.history,
                {
                  actorId: currentUser.id,
                  actorName: currentUser.email,
                  action: `Status changed to ${newStatus}${comment ? ` (${comment})` : ""}`,
                  timestamp: new Date().toISOString(),
                },
              ],
            }
          : exp
      )
    );

    addAuditLogEntry("Expense Updated", `Expense ${expenseId} set to ${newStatus}`);
  };

  // --- Bulk update expenses ---
  const handleBulkUpdateExpenseStatus = (
    expenseIds: string[],
    newStatus: Status,
    comment?: string
  ) => {
    setExpenses((prev) =>
      prev.map((exp) =>
        expenseIds.includes(exp.id)
          ? {
              ...exp,
              status: newStatus,
              history: [
                ...exp.history,
                {
                  actorId: currentUser.id,
                  actorName: currentUser.email,
                  action: `Bulk status change to ${newStatus}${comment ? ` (${comment})` : ""}`,
                  timestamp: new Date().toISOString(),
                },
              ],
            }
          : exp
      )
    );

    addAuditLogEntry("Bulk Expense Update", `${expenseIds.length} expenses set to ${newStatus}`);
  };

  // --- Toggle priority ---
  const handleToggleExpensePriority = (expenseId: string) => {
    setExpenses((prev) =>
      prev.map((exp) =>
        exp.id === expenseId
          ? { ...exp, isHighPriority: !exp.isHighPriority }
          : exp
      )
    );

    addAuditLogEntry("Priority Toggled", `Expense ${expenseId} priority toggled`);
  };

  // --- If not logged in ---
  if (!currentUser) {
    return <Login onLogin={handleLogin} onRegister={handleRegister} />;
  }

  // --- If logged in ---
  return (
    <Dashboard
      currentUser={currentUser}
      categories={categories}
      projects={projects}
      sites={sites}
      expenses={expenses}
      auditLog={auditLog}
      isDailyBackupEnabled={isDailyBackupEnabled}
      availableBackups={availableBackups}
      onLogout={handleLogout}
      onAddExpense={handleAddExpense}
      onUpdateExpenseStatus={handleUpdateExpenseStatus}
      onBulkUpdateExpenseStatus={handleBulkUpdateExpenseStatus}
      onToggleExpensePriority={handleToggleExpensePriority}
    />
  );
};

export default App;
