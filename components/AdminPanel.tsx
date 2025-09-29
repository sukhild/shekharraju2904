import React, { useState } from 'react';
import { User, Category, Role } from '../types';
import { PencilIcon, TrashIcon, PlusIcon } from './Icons';
import Modal from './Modal';

interface AdminPanelProps {
  users: User[];
  categories: Category[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  users, categories, onAddUser, onUpdateUser, onDeleteUser,
  onAddCategory, onUpdateCategory, onDeleteCategory
}) => {
  const [activeTab, setActiveTab] = useState('users');
  const [isUserModalOpen, setUserModalOpen] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleOpenUserModal = (user: User | null = null) => {
    setEditingUser(user);
    setUserModalOpen(true);
  };

  const handleOpenCategoryModal = (category: Category | null = null) => {
    setEditingCategory(category);
    setCategoryModalOpen(true);
  };
  
  const handleUserFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const role = formData.get('role') as Role;
    const password = formData.get('password') as string;
    const email = formData.get('email') as string;

    if (editingUser) {
        const updatedData: Partial<User> = { name, username, role, email };
        if (password) {
            updatedData.password = password;
        }
        onUpdateUser({ ...editingUser, ...updatedData });
    } else {
        onAddUser({ name, username, role, password, email });
    }
    setUserModalOpen(false);
    setEditingUser(null);
  }

  const handleCategoryFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const categoryData = {
          name: formData.get('name') as string,
          attachmentRequired: (formData.get('attachmentRequired') === 'on'),
          autoApproveAmount: Number(formData.get('autoApproveAmount')),
      };

      if (editingCategory) {
          onUpdateCategory({ ...editingCategory, ...categoryData });
      } else {
          onAddCategory(categoryData);
      }
      setCategoryModalOpen(false);
      setEditingCategory(null);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Admin Panel</h2>
      <div className="mt-4 border-b border-gray-200">
        <nav className="flex -mb-px space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('users')}
            className={`${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`${activeTab === 'categories' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Category Management
          </button>
        </nav>
      </div>

      <div className="mt-8">
        {activeTab === 'users' && (
          <div>
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Users</h3>
                <p className="mt-2 text-sm text-gray-700">A list of all the users in the system.</p>
              </div>
              <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                <button onClick={() => handleOpenUserModal()} type="button" className="inline-flex items-center px-3 py-2 text-sm font-semibold text-white rounded-md shadow-sm bg-primary hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                    <PlusIcon className="w-5 h-5 mr-2" /> Add user
                </button>
              </div>
            </div>
            <div className="flow-root mt-8">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full bg-white divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Username</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Edit</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 whitespace-nowrap sm:pl-6">{user.name}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{user.username}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{user.email}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{user.role}</td>
                                            <td className="relative py-4 pl-3 pr-4 text-sm font-medium text-right whitespace-nowrap sm:pr-6">
                                                <button onClick={() => handleOpenUserModal(user)} className="text-primary hover:text-primary-hover"><PencilIcon className="w-4 h-4" /></button>
                                                <button onClick={() => onDeleteUser(user.id)} className="ml-4 text-red-600 hover:text-red-800"><TrashIcon className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}
        
        {activeTab === 'categories' && (
           <div>
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Categories</h3>
                <p className="mt-2 text-sm text-gray-700">Manage expense categories and approval rules.</p>
              </div>
              <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                <button onClick={() => handleOpenCategoryModal()} type="button" className="inline-flex items-center px-3 py-2 text-sm font-semibold text-white rounded-md shadow-sm bg-primary hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                    <PlusIcon className="w-5 h-5 mr-2" /> Add category
                </button>
              </div>
            </div>
            <div className="flow-root mt-8">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full bg-white divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Attachment Required</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Auto-Approve Limit (₹)</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Edit</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {categories.map((cat) => (
                                        <tr key={cat.id}>
                                            <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 whitespace-nowrap sm:pl-6">{cat.name}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{cat.attachmentRequired ? 'Yes' : 'No'}</td>
                                            <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">{cat.autoApproveAmount.toLocaleString('en-IN')}</td>
                                            <td className="relative py-4 pl-3 pr-4 text-sm font-medium text-right whitespace-nowrap sm:pr-6">
                                                <button onClick={() => handleOpenCategoryModal(cat)} className="text-primary hover:text-primary-hover"><PencilIcon className="w-4 h-4" /></button>
                                                <button onClick={() => onDeleteCategory(cat.id)} className="ml-4 text-red-600 hover:text-red-800"><TrashIcon className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isUserModalOpen} onClose={() => setUserModalOpen(false)} title={editingUser ? 'Edit User' : 'Add User'}>
          <form onSubmit={handleUserFormSubmit} className="space-y-4">
              <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input type="text" name="name" id="name" defaultValue={editingUser?.name || ''} required className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
              <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                  <input type="text" name="username" id="username" defaultValue={editingUser?.username || ''} required className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
               <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" name="email" id="email" defaultValue={editingUser?.email || ''} required className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
               <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                  <select id="role" name="role" defaultValue={editingUser?.role || Role.REQUESTOR} className="block w-full py-2 pl-3 pr-10 mt-1 text-base border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                      {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
              </div>
              <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <input 
                      type="password" 
                      name="password" 
                      id="password"
                      autoComplete="new-password"
                      placeholder={editingUser ? 'Leave blank to keep unchanged' : ''}
                      required={!editingUser}
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
              <div className="pt-4 text-right">
                  <button type="button" onClick={() => setUserModalOpen(false)} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-primary hover:bg-primary-hover">Save</button>
              </div>
          </form>
      </Modal>

      <Modal isOpen={isCategoryModalOpen} onClose={() => setCategoryModalOpen(false)} title={editingCategory ? 'Edit Category' : 'Add Category'}>
          <form onSubmit={handleCategoryFormSubmit} className="space-y-4">
              <div>
                  <label htmlFor="cat-name" className="block text-sm font-medium text-gray-700">Category Name</label>
                  <input type="text" name="name" id="cat-name" defaultValue={editingCategory?.name || ''} required className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
              <div>
                  <label htmlFor="autoApproveAmount" className="block text-sm font-medium text-gray-700">Auto-Approve Limit (₹)</label>
                  <input type="number" name="autoApproveAmount" id="autoApproveAmount" defaultValue={editingCategory?.autoApproveAmount || 0} required className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" />
              </div>
               <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                      <input id="attachmentRequired" name="attachmentRequired" type="checkbox" defaultChecked={editingCategory?.attachmentRequired || false} className="w-4 h-4 border-gray-300 rounded text-primary focus:ring-primary" />
                  </div>
                  <div className="ml-3 text-sm">
                      <label htmlFor="attachmentRequired" className="font-medium text-gray-700">Attachment is mandatory</label>
                  </div>
              </div>
              <div className="pt-4 text-right">
                  <button type="button" onClick={() => setCategoryModalOpen(false)} className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-primary hover:bg-primary-hover">Save</button>
              </div>
          </form>
      </Modal>

    </div>
  );
};

export default AdminPanel;