
import React from 'react';
import { User } from '../types';
import Avatar from './Avatar';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-primary">ExpenseFlow</h1>
          </div>
          <div className="flex items-center">
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <span className="mr-3 text-sm font-medium text-gray-700">Welcome, {user.name}</span>
                <Avatar name={user.name} />
                <button
                    onClick={onLogout}
                    className="ml-4 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                    Logout
                </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
