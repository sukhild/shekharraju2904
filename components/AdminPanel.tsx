import React, { useState, useEffect, useRef } from "react";
import {
  Category,
  Subcategory,
  AuditLogItem,
  Project,
  Site,
  Expense,
  AvailableBackups,
} from "../types";
import {
  DocumentArrowDownIcon,
  UploadIcon,
} from "./Icons";
import { supabase } from "../supabaseClient";

interface AdminPanelProps {
  categories: Category[];
  projects: Project[];
  sites: Site[];
  expenses: Expense[];
  auditLog: AuditLogItem[];
  isDailyBackupEnabled: boolean;
  availableBackups: AvailableBackups;
  onAddCategory: (category: Omit<Category, "id">) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddSubcategory: (
    categoryId: string,
    subcategoryData: Omit<Subcategory, "id">
  ) => void;
  onUpdateSubcategory: (
    categoryId: string,
    updatedSubcategory: Subcategory
  ) => void;
  onDeleteSubcategory: (categoryId: string, subcategoryId: string) => void;
  onAddProject: (project: Omit<Project, "id">) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onAddSite: (site: Omit<Site, "id">) => void;
  onUpdateSite: (site: Site) => void;
  onDeleteSite: (siteId: string) => void;
  onToggleDailyBackup: () => void;
  onManualBackup: () => void;
  onImportBackup: (file: File) => void;
  onCreateMirrorBackup: () => void;
  onDownloadSpecificBackup: (key: string) => void;
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  categories,
  projects,
  sites,
  auditLog,
  isDailyBackupEnabled,
  availableBackups,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddSubcategory,
  onUpdateSubcategory,
  onDeleteSubcategory,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddSite,
  onUpdateSite,
  onDeleteSite,
  onToggleDailyBackup,
  onManualBackup,
  onImportBackup,
  onCreateMirrorBackup,
  onDownloadSpecificBackup,
}) => {
  const [activeTab, setActiveTab] = useState("users");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const importBackupInputRef = useRef<HTMLInputElement>(null);

  // 🔹 Fetch profiles from Supabase
  useEffect(() => {
    const loadProfiles = async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) {
        console.error("Error fetching profiles:", error.message);
      } else {
        setProfiles(data || []);
      }
    };
    loadProfiles();
  }, []);

  const TabButton = ({ tabId, label }: { tabId: string; label: string }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`${
        activeTab === tabId
          ? "border-primary text-primary"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">
        Admin Panel
      </h2>
      <div className="mt-4 border-b border-gray-200">
        <nav className="flex -mb-px space-x-8" aria-label="Tabs">
          <TabButton tabId="users" label="User Management" />
          <TabButton tabId="categories" label="Category Management" />
          <TabButton tabId="projects" label="Project Management" />
          <TabButton tabId="sites" label="Site Management" />
          <TabButton tabId="audit" label="Audit Log" />
          <TabButton tabId="backup" label="Backup & Export" />
        </nav>
      </div>

      <div className="mt-8">
        {/* 👤 USER MANAGEMENT */}
        {activeTab === "users" && (
          <div>
            <h3 className="text-lg font-semibold">User Management</h3>
            <p className="mt-2 text-sm text-gray-600">
              All registered users stored in the profiles table.
            </p>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full bg-white divide-y divide-gray-200 shadow sm:rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                      Role
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {profiles.length > 0 ? (
                    profiles.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {user.full_name}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {user.role}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-sm text-gray-500"
                      >
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TODO: categories/projects/sites/audit/backup tabs unchanged */}
        {activeTab === "categories" && (
          <div>
            <h3 className="text-lg font-semibold">Categories</h3>
            {/* Category management table stays here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
