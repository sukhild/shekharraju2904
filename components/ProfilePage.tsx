
import React from 'react';
import { User } from '../types';

interface ProfilePageProps {
  user: User;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold">My Profile</h2>
      <div className="p-6 mt-4 bg-white rounded-lg shadow">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Full Name</p>
            <p className="mt-1 text-lg text-gray-900">{user.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Username</p>
            <p className="mt-1 text-lg text-gray-900">{user.username}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Email Address</p>
            <p className="mt-1 text-lg text-gray-900">{user.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Role</p>
            <p className="mt-1 text-lg text-gray-900 capitalize">{user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
