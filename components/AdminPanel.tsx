// components/AdminPanel.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  User,
  Category,
  Role,
  Subcategory,
  AuditLogItem,
  Project,
  Site,
  AvailableBackups,
} from "../types";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  DocumentArrowDownIcon,
  UploadIcon,
} from "./Icons";
import Modal from "./Modal";
import { supabase } from "../supabaseClient";

/**
 * AdminPanel
 * - Full UI + CRUD for Users (profiles), Categories, Subcategories, Projects, Sites
 * - Audit Log view
 * - Backup & Export UI (stubbed handlers)
 *
 * Notes:
 * - This component expects your types to reflect DB columns (we map snake_case -> camelCase where needed).
 * - Reuse your Modal component (imported as Modal).
 */

type AdminUser = User & { created_at?: string };

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("users");

  // Data state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogItem[]>([]);
  const [availableBackups, setAvailableBackups] = useState<AvailableBackups>({
    daily: [],
    mirror: [],
  });
  const [isDailyBackupEnabled, setDailyBackupEnabled] = useState<boolean>(
    false
  );

  // Modal state
  const [isUserModalOpen, setUserModalOpen] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isSubcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [isSiteModalOpen, setSiteModalOpen] = useState(false);

  // Editing state
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(
    null
  );
  const [
    editingSubcategory,
    setEditingSubcategory,
  ] = useState<{ subcategory: Subcategory; categoryId: string } | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  const importBackupInputRef = useRef<HTMLInputElement | null>(null);

  // Loaders
  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    await Promise.all([
      loadUsers(),
      loadCategories(),
      loadProjects(),
      loadSites(),
      loadAuditLog(),
      // optionally load backups list if you have an endpoint
    ]);
  }

  // --- Users
  async function loadUsers() {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) {
      console.error("loadUsers error:", error);
      return;
    }
    if (data) {
      // Map DB rows to AdminUser
      setUsers(
        data.map((u: any) => ({
          id: u.id,
          name: u.full_name,
          username: u.email ? String(u.email).split("@")[0] : "",
          email: u.email,
          role: (u.role as Role) || Role.REQUESTOR,
          created_at: u.created_at,
        }))
      );
    }
  }

  async function saveUser(payload: Omit<User, "id">, editing?: AdminUser) {
    // Validate email and role
    if (!payload.email || !payload.name || !payload.role) {
      alert("Name, email and role are required");
      return;
    }

    if (editing) {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: payload.name,
          email: payload.email,
          role: payload.role,
        })
        .eq("id", editing.id);
      if (error) console.error("update user error", error);
    } else {
      const { error } = await supabase
        .from("profiles")
        .insert({
          full_name: payload.name,
          email: payload.email,
          role: payload.role,
        })
        .select();
      if (error) {
        console.error("insert user error", error);
        alert("Could not create user: " + error.message);
      }
    }
    await loadUsers();
    setUserModalOpen(false);
    setEditingUser(null);
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this user?")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) console.error("deleteUser error", error);
    await loadUsers();
  }

  // --- Categories & Subcategories
  async function loadCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("*, subcategories(*)")
      .order("name", { ascending: true });
    if (error) {
      console.error("loadCategories error", error);
      return;
    }
    if (data) {
      setCategories(
        data.map((c: any) => ({
          id: c.id,
          name: c.name,
          attachmentRequired: !!c.attachment_required,
          autoApproveAmount: Number(c.auto_approve_amount || 0),
          subcategories:
            c.subcategories?.map((s: any) => ({
              id: s.id,
              name: s.name,
              attachmentRequired: !!s.attachment_required,
            })) || [],
        }))
      );
    }
  }

  async function saveCategory(
    payload: Omit<Category, "id">,
    editing?: Category
  ) {
    if (!payload.name) return alert("Category name required");
    if (editing) {
      const { error } = await supabase
        .from("categories")
        .update({
          name: payload.name,
          attachment_required: payload.attachmentRequired,
          auto_approve_amount: payload.autoApproveAmount,
        })
        .eq("id", editing.id);
      if (error) console.error("saveCategory update error", error);
    } else {
      const { error } = await supabase.from("categories").insert({
        name: payload.name,
        attachment_required: payload.attachmentRequired,
        auto_approve_amount: payload.autoApproveAmount,
      });
      if (error) console.error("saveCategory insert error", error);
    }
    await loadCategories();
    setCategoryModalOpen(false);
    setEditingCategory(null);
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete category and its subcategories?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) console.error("deleteCategory error", error);
    await loadCategories();
  }

  async function saveSubcategory(
    categoryId: string,
    payload: Omit<Subcategory, "id">,
    editing?: Subcategory
  ) {
    if (!payload.name) return alert("Subcategory name required");
    if (editing) {
      const { error } = await supabase
        .from("subcategories")
        .update({
          name: payload.name,
          attachment_required: payload.attachmentRequired,
        })
        .eq("id", editing.id);
      if (error) console.error("saveSubcategory update error", error);
    } else {
      const { error } = await supabase.from("subcategories").insert({
        category_id: categoryId,
        name: payload.name,
        attachment_required: payload.attachmentRequired,
      });
      if (error) console.error("saveSubcategory insert error", error);
    }
    await loadCategories();
    setSubcategoryModalOpen(false);
    setEditingSubcategory(null);
  }

  async function deleteSubcategory(categoryId: string, subId: string) {
    if (!confirm("Delete subcategory?")) return;
    const { error } = await supabase.from("subcategories").delete().eq("id", subId);
    if (error) console.error("deleteSubcategory error", error);
    await loadCategories();
  }

  // --- Projects
  async function loadProjects() {
    const { data, error } = await supabase.from("projects").select("*").order("name", { ascending: true });
    if (error) {
      console.error("loadProjects error", error);
      return;
    }
    if (data) setProjects(data.map((p: any) => ({ id: p.id, name: p.name })));
  }

  async function saveProject(payload: Omit<Project, "id">, editing?: Project) {
    if (!payload.name) return alert("Project name required");
    if (editing) {
      const { error } = await supabase.from("projects").update({ name: payload.name }).eq("id", editing.id);
      if (error) console.error("saveProject update error", error);
    } else {
      const { error } = await supabase.from("projects").insert({ name: payload.name });
      if (error) console.error("saveProject insert error", error);
    }
    await loadProjects();
    setProjectModalOpen(false);
    setEditingProject(null);
  }

  async function deleteProject(id: string) {
    if (!confirm("Delete project?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) console.error("deleteProject error", error);
    await loadProjects();
  }

  // --- Sites
  async function loadSites() {
    const { data, error } = await supabase.from("sites").select("*").order("name", { ascending: true });
    if (error) {
      console.error("loadSites error", error);
      return;
    }
    if (data) setSites(data.map((s: any) => ({ id: s.id, name: s.name })));
  }

  async function saveSite(payload: Omit<Site, "id">, editing?: Site) {
    if (!payload.name) return alert("Site name required");
    if (editing) {
      const { error } = await supabase.from("sites").update({ name: payload.name }).eq("id", editing.id);
      if (error) console.error("saveSite update error", error);
    } else {
      const { error } = await supabase.from("sites").insert({ name: payload.name });
      if (error) console.error("saveSite insert error", error);
    }
    await loadSites();
    setSiteModalOpen(false);
    setEditingSite(null);
  }

  async function deleteSite(id: string) {
    if (!confirm("Delete site?")) return;
    const { error } = await supabase.from("sites").delete().eq("id", id);
    if (error) console.error("deleteSite error", error);
    await loadSites();
  }

async function loadAuditLog() {
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("timestamp", { ascending: false });
  if (error) {
    console.error("loadAuditLog error", error);
    return;
  }
  if (data) {
    setAuditLog(
      data.map((a: any) => ({
        id: a.id,
        actorId: a.actor_id, // ✅ add this line
        timestamp: a.timestamp,
        actorName: a.actor_name,
        action: a.action,
        details: a.details,
      }))
    );
  }
}


  // --- Backups (stub)
  const handleToggleDailyBackup = () => setDailyBackupEnabled((s) => !s);
  const handleManualBackup = () => {
    // TODO: Implement backup generation + download
    alert("Manual backup triggered (stub)");
  };
  const handleCreateMirrorBackup = () => {
    alert("Mirror backup triggered (stub)");
  };
  const handleDownloadBackup = (key: string) => {
    alert("Download backup: " + key);
  };
  const handleImportBackup = (file: File) => {
    alert("Import backup: " + file.name + " (stub)");
  };

  // --- Helpers & UI handlers
  const formatDateTime = (iso?: string) =>
    iso ? new Date(iso).toLocaleString("en-IN") : "";

  const openAddUserModal = () => {
    setEditingUser(null);
    setUserModalOpen(true);
  };
  const openEditUserModal = (u: AdminUser) => {
    setEditingUser(u);
    setUserModalOpen(true);
  };

  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryModalOpen(true);
  };
  const openEditCategoryModal = (c: Category) => {
    setEditingCategory(c);
    setCategoryModalOpen(true);
  };

  const openAddSubcategoryModal = (categoryId?: string) => {
    setEditingSubcategory(null);
    if (categoryId) setEditingSubcategory({ subcategory: { id: "", name: "", attachmentRequired: false }, categoryId });
    setSubcategoryModalOpen(true);
  };
  const openEditSubcategoryModal = (s: Subcategory, categoryId: string) => {
    setEditingSubcategory({ subcategory: s, categoryId });
    setSubcategoryModalOpen(true);
  };

  const openAddProjectModal = () => {
    setEditingProject(null);
    setProjectModalOpen(true);
  };
  const openEditProjectModal = (p: Project) => {
    setEditingProject(p);
    setProjectModalOpen(true);
  };

  const openAddSiteModal = () => {
    setEditingSite(null);
    setSiteModalOpen(true);
  };
  const openEditSiteModal = (s: Site) => {
    setEditingSite(s);
    setSiteModalOpen(true);
  };

  // File input for import
  const importBackupInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImportBackup(file);
    e.currentTarget.value = "";
  };

  // Tab button helper
  const TabButton: React.FC<{ tabId: string; label: string }> = ({ tabId, label }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`${
        activeTab === tabId
          ? "border-indigo-600 text-indigo-600"
          : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
    >
      {label}
    </button>
  );

  // ---------- Render ----------
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Admin Panel</h2>

      <div className="mt-6 border-b border-gray-200">
        <nav className="flex -mb-px space-x-8" aria-label="Tabs">
          <TabButton tabId="users" label="User Management" />
          <TabButton tabId="categories" label="Category Management" />
          <TabButton tabId="subcategories" label="Subcategory Management" />
          <TabButton tabId="projects" label="Project Management" />
          <TabButton tabId="sites" label="Site Management" />
          <TabButton tabId="audit" label="Audit Log" />
          <TabButton tabId="backup" label="Backup & Export" />
        </nav>
      </div>

      <div className="mt-8">

        {/* USERS */}
        {activeTab === "users" && (
          <section>
            <div className="sm:flex sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Users</h3>
                <p className="mt-1 text-sm text-gray-600">A list of all the users in the system.</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <button
                  onClick={openAddUserModal}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700"
                >
                  <PlusIcon className="w-5 h-5 mr-2" /> Add user
                </button>
              </div>
            </div>

            <div className="mt-6">
              <div className="bg-white shadow sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{u.username}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{u.role}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(u.created_at)}</td>
                        <td className="px-6 py-4 text-right text-sm">
                          <button
                            onClick={() => openEditUserModal(u)}
                            className="text-indigo-600 hover:text-indigo-800 mr-4"
                            aria-label="Edit user"
                          >
                            <PencilIcon className="w-5 h-5 inline" />
                          </button>
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="text-red-600 hover:text-red-800"
                            aria-label="Delete user"
                          >
                            <TrashIcon className="w-5 h-5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">No users found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* CATEGORIES */}
        {activeTab === "categories" && (
          <section>
            <div className="sm:flex sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
                <p className="mt-1 text-sm text-gray-600">Manage expense categories and approval rules.</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <button
                  onClick={openAddCategoryModal}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700"
                >
                  <PlusIcon className="w-5 h-5 mr-2" /> Add category
                </button>
              </div>
            </div>

            <div className="mt-6 bg-white shadow sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategories</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attachment Required</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auto-Approve Limit (₹)</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{c.subcategories?.length || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{c.attachmentRequired ? "Yes" : "No"}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{Number(c.autoApproveAmount).toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4 text-right text-sm">
                        <button onClick={() => openEditCategoryModal(c)} className="text-indigo-600 hover:text-indigo-800 mr-4"><PencilIcon className="w-5 h-5 inline" /></button>
                        <button onClick={() => deleteCategory(c.id)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5 inline" /></button>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">No categories found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* SUBCATEGORIES */}
        {activeTab === "subcategories" && (
          <section>
            <div className="sm:flex sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Subcategories</h3>
                <p className="mt-1 text-sm text-gray-600">Manage subcategories for each main expense category.</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <button
                  onClick={() => openAddSubcategoryModal()}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700"
                >
                  <PlusIcon className="w-5 h-5 mr-2" /> Add subcategory
                </button>
              </div>
            </div>

            <div className="mt-6 bg-white shadow sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategory Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attachment Required</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.flatMap((cat) =>
                    (cat.subcategories || []).map((s) => (
                      <tr key={s.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">{s.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{cat.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{s.attachmentRequired ? "Yes" : "No"}</td>
                        <td className="px-6 py-4 text-right text-sm">
                          <button onClick={() => openEditSubcategoryModal(s, cat.id)} className="text-indigo-600 hover:text-indigo-800 mr-4"><PencilIcon className="w-5 h-5 inline" /></button>
                          <button onClick={() => deleteSubcategory(cat.id, s.id)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5 inline" /></button>
                        </td>
                      </tr>
                    ))
                  )}
                  {categories.every((c) => (c.subcategories || []).length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">No subcategories found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* PROJECTS */}
        {activeTab === "projects" && (
          <section>
            <div className="sm:flex sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
                <p className="mt-1 text-sm text-gray-600">Manage the list of available projects for expense submission.</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <button onClick={openAddProjectModal} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700">
                  <PlusIcon className="w-5 h-5 mr-2" /> Add project
                </button>
              </div>
            </div>

            <div className="mt-6 bg-white shadow sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.map((p) => (
                    <tr key={p.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{p.name}</td>
                      <td className="px-6 py-4 text-right text-sm">
                        <button onClick={() => openEditProjectModal(p)} className="text-indigo-600 hover:text-indigo-800 mr-4"><PencilIcon className="w-5 h-5 inline" /></button>
                        <button onClick={() => deleteProject(p.id)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5 inline" /></button>
                      </td>
                    </tr>
                  ))}
                  {projects.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-6 py-10 text-center text-sm text-gray-500">No projects found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* SITES */}
        {activeTab === "sites" && (
          <section>
            <div className="sm:flex sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sites/Places</h3>
                <p className="mt-1 text-sm text-gray-600">Manage the list of available sites or places for expense submission.</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <button onClick={openAddSiteModal} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700">
                  <PlusIcon className="w-5 h-5 mr-2" /> Add Site/Place
                </button>
              </div>
            </div>

            <div className="mt-6 bg-white shadow sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site/Place Name</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sites.map((s) => (
                    <tr key={s.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{s.name}</td>
                      <td className="px-6 py-4 text-right text-sm">
                        <button onClick={() => openEditSiteModal(s)} className="text-indigo-600 hover:text-indigo-800 mr-4"><PencilIcon className="w-5 h-5 inline" /></button>
                        <button onClick={() => deleteSite(s.id)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5 inline" /></button>
                      </td>
                    </tr>
                  ))}
                  {sites.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-6 py-10 text-center text-sm text-gray-500">No sites found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* AUDIT LOG */}
        {activeTab === "audit" && (
          <section>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Audit Log</h3>
              <p className="mt-1 text-sm text-gray-600">A history of all administrative actions performed in the system.</p>
            </div>

            <div className="mt-6 bg-white shadow sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performed By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLog.map((a) => (
                    <tr key={a.id}>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(a.timestamp)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{a.actorName}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.action}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{a.details}</td>
                    </tr>
                  ))}
                  {auditLog.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">No audit log entries found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* BACKUP */}
        {activeTab === "backup" && (
          <section className="mt-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Backup & Export</h3>
              <p className="mt-1 text-sm text-gray-600">Manage data import, export, and retention policies.</p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left */}
              <div className="space-y-6">
                {/* Import */}
                <div className="p-6 bg-white rounded-lg shadow">
                  <h4 className="font-semibold text-gray-800">Import & Restore</h4>
                  <p className="mt-1 text-sm text-gray-600">Restore the application state from a JSON backup file. <span className="font-semibold text-red-600">Warning: This will overwrite all current data.</span></p>
                  <input ref={importBackupInputRef} type="file" accept="application/json" className="hidden" onChange={importBackupInput} />
                  <div className="mt-4">
                    <button onClick={() => importBackupInputRef.current?.click()} className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600">
                      <UploadIcon className="w-5 h-5 mr-2" /> Import from Backup
                    </button>
                  </div>
                </div>

                {/* Manual Backup */}
                <div className="p-6 bg-white rounded-lg shadow">
                  <h4 className="font-semibold text-gray-800">Ad-Hoc Manual Backup</h4>
                  <p className="mt-1 text-sm text-gray-600">Generate and download a full JSON backup of all system data immediately. This backup is not stored automatically.</p>
                  <div className="mt-4">
                    <button onClick={handleManualBackup} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                      <DocumentArrowDownIcon className="w-5 h-5 mr-2" /> Download Backup Now
                    </button>
                  </div>
                </div>

                {/* Mirror */}
                <div className="p-6 bg-white rounded-lg shadow">
                  <h4 className="font-semibold text-gray-800">Mirror Backup (6-Month Retention)</h4>
                  <p className="mt-1 text-sm text-gray-600">Create a long-term mirror backup. Backups older than 6 months will be automatically deleted.</p>
                  <div className="mt-4">
                    <button onClick={handleCreateMirrorBackup} className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                      Create 6-Month Mirror Backup
                    </button>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    <h5 className="font-medium text-gray-700">Available Mirror Backups:</h5>
                    {availableBackups.mirror.length > 0 ? (
                      <ul className="mt-2 space-y-2">
                        {availableBackups.mirror.map((k) => (
                          <li key={k} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <span className="font-mono text-xs">{k}</span>
                            <button onClick={() => handleDownloadBackup(k)} className="text-indigo-600 hover:text-indigo-800">
                              <DocumentArrowDownIcon className="w-5 h-5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : <div className="mt-2 text-gray-500">No mirror backups found.</div>}
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="space-y-6">
                <div className="p-6 bg-white rounded-lg shadow">
                  <h4 className="font-semibold text-gray-800">Automatic Daily Backups (20-Day Retention)</h4>
                  <p className="mt-1 text-sm text-gray-600">If enabled, a backup is created daily at 12:05 AM, an email is sent to admins, and the last 20 backups are retained.</p>
                  <div className="mt-4 flex items-center">
                    <button
                      onClick={handleToggleDailyBackup}
                      role="switch"
                      aria-checked={isDailyBackupEnabled}
                      className={`${isDailyBackupEnabled ? "bg-indigo-600" : "bg-gray-200"} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                    >
                      <span className={`${isDailyBackupEnabled ? "translate-x-5" : "translate-x-0"} inline-block h-5 w-5 transform bg-white rounded-full transition-transform`} />
                    </button>
                    <span className="ml-3 text-sm font-medium text-gray-900">{isDailyBackupEnabled ? "Enabled" : "Disabled"}</span>
                  </div>

                  <div className="mt-6">
                    <h5 className="text-sm font-medium text-gray-700">Recent Daily Backups:</h5>
                    {availableBackups.daily.length > 0 ? (
                      <ul className="mt-2 space-y-2">
                        {availableBackups.daily.map((k) => (
                          <li key={k} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <span className="font-mono text-xs">{k}</span>
                            <button onClick={() => handleDownloadBackup(k)} className="text-indigo-600 hover:text-indigo-800">
                              <DocumentArrowDownIcon className="w-5 h-5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-2 text-gray-500">No recent daily backups found.</div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </section>
        )}

      </div>

      {/* ---------------- Modals ---------------- */}

      {/* USER MODAL */}
      <Modal isOpen={isUserModalOpen} onClose={() => { setUserModalOpen(false); setEditingUser(null); }} title={editingUser ? "Edit User" : "Add User"}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          const name = String(fd.get("name") || "").trim();
          const email = String(fd.get("email") || "").trim();
          const role = (fd.get("role") as Role) || Role.REQUESTOR;
          const payload: Omit<User, "id"> = {
            name,
            username: email.split("@")[0],
            email,
            role,
          };
          await saveUser(payload, editingUser || undefined);
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input name="name" defaultValue={editingUser?.name || ""} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input name="email" type="email" defaultValue={editingUser?.email || ""} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select name="role" defaultValue={editingUser?.role || Role.REQUESTOR} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2">
              {Object.values(Role).map((r) => (<option key={r} value={r}>{r}</option>))}
            </select>
          </div>
          <div className="pt-4 text-right">
            <button type="button" onClick={() => { setUserModalOpen(false); setEditingUser(null); }} className="px-4 py-2 mr-2 text-sm border rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded">Save</button>
          </div>
        </form>
      </Modal>

      {/* CATEGORY MODAL */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => { setCategoryModalOpen(false); setEditingCategory(null); }} title={editingCategory ? "Edit Category" : "Add Category"}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          const name = String(fd.get("name") || "").trim();
          const autoApproveAmount = Number(fd.get("autoApproveAmount") || 0);
          const attachmentRequired = fd.get("attachmentRequired") === "on";
          await saveCategory({ name, autoApproveAmount, attachmentRequired }, editingCategory || undefined);
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category Name</label>
            <input name="name" defaultValue={editingCategory?.name || ""} required className="mt-1 block w-full border-gray-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Auto-Approve Limit (₹)</label>
            <input name="autoApproveAmount" type="number" defaultValue={editingCategory?.autoApproveAmount ?? 0} className="mt-1 block w-full border-gray-300 rounded-md p-2" />
          </div>
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input id="attachmentRequired" name="attachmentRequired" type="checkbox" defaultChecked={editingCategory?.attachmentRequired || false} className="h-4 w-4" />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="attachmentRequired" className="font-medium text-gray-700">Attachment is mandatory</label>
            </div>
          </div>
          <div className="pt-4 text-right">
            <button type="button" onClick={() => { setCategoryModalOpen(false); setEditingCategory(null); }} className="px-4 py-2 mr-2 text-sm border rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded">Save</button>
          </div>
        </form>
      </Modal>

      {/* SUBCATEGORY MODAL */}
      <Modal isOpen={isSubcategoryModalOpen} onClose={() => { setSubcategoryModalOpen(false); setEditingSubcategory(null); }} title={editingSubcategory ? "Edit Subcategory" : "Add Subcategory"}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          const name = String(fd.get("name") || "").trim();
          const attachmentRequired = fd.get("attachmentRequired") === "on";
          const categoryId = String(fd.get("categoryId") || (editingSubcategory?.categoryId || ""));
          if (!categoryId) return alert("Select a parent category");
          await saveSubcategory(categoryId, { name, attachmentRequired }, editingSubcategory?.subcategory);
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Parent Category</label>
            <select name="categoryId" defaultValue={editingSubcategory?.categoryId || ""} required className="mt-1 block w-full border-gray-300 rounded-md p-2">
              <option value="" disabled>Select a category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Subcategory Name</label>
            <input name="name" defaultValue={editingSubcategory?.subcategory.name || ""} required className="mt-1 block w-full border-gray-300 rounded-md p-2" />
          </div>
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input id="subAttachmentRequired" name="attachmentRequired" type="checkbox" defaultChecked={editingSubcategory?.subcategory.attachmentRequired || false} className="h-4 w-4" />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="subAttachmentRequired" className="font-medium text-gray-700">Attachment is mandatory</label>
            </div>
          </div>
          <div className="pt-4 text-right">
            <button type="button" onClick={() => { setSubcategoryModalOpen(false); setEditingSubcategory(null); }} className="px-4 py-2 mr-2 text-sm border rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded">Save</button>
          </div>
        </form>
      </Modal>

      {/* PROJECT MODAL */}
      <Modal isOpen={isProjectModalOpen} onClose={() => { setProjectModalOpen(false); setEditingProject(null); }} title={editingProject ? "Edit Project" : "Add Project"}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          const name = String(fd.get("name") || "").trim();
          await saveProject({ name }, editingProject || undefined);
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Project Name</label>
            <input name="name" defaultValue={editingProject?.name || ""} required className="mt-1 block w-full border-gray-300 rounded-md p-2" />
          </div>
          <div className="pt-4 text-right">
            <button type="button" onClick={() => { setProjectModalOpen(false); setEditingProject(null); }} className="px-4 py-2 mr-2 text-sm border rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded">Save</button>
          </div>
        </form>
      </Modal>

      {/* SITE MODAL */}
      <Modal isOpen={isSiteModalOpen} onClose={() => { setSiteModalOpen(false); setEditingSite(null); }} title={editingSite ? "Edit Site/Place" : "Add Site/Place"}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          const name = String(fd.get("name") || "").trim();
          await saveSite({ name }, editingSite || undefined);
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Site/Place Name</label>
            <input name="name" defaultValue={editingSite?.name || ""} required className="mt-1 block w-full border-gray-300 rounded-md p-2" />
          </div>
          <div className="pt-4 text-right">
            <button type="button" onClick={() => { setSiteModalOpen(false); setEditingSite(null); }} className="px-4 py-2 mr-2 text-sm border rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded">Save</button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default AdminPanel;
