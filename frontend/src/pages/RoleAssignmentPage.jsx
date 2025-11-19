import React, { useEffect, useMemo, useState } from 'react';
import { Shield, RefreshCw } from 'lucide-react';
import { listAdminUsers, updateUserRoleAdmin } from '../services/apiClient';

const ROLE_LABELS = {
  admin: 'Admin',
  account_manager: 'Account Manager',
  user: 'User',
};

const RoleAssignmentPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listAdminUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.detail || err?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      return true;
    });
  }, [users, roleFilter]);

  const handleChangeRole = async (user, nextRole) => {
    if (!nextRole || nextRole === user.role) return;
    setUpdatingId(user.id);
    setError('');
    try {
      const updated = await updateUserRoleAdmin(user.id, nextRole);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                role: updated.role,
              }
            : u
        )
      );
    } catch (err) {
      setError(err?.detail || err?.message || 'Unable to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 space-y-6 pt-4 md:pt-6 text-base md:text-[17px]">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Role Assignment</h2>
            <p className="text-base text-gray-500 mt-1">
              Promote admins, assign account managers, and control access across DiceBank.
            </p>
          </div>
        </div>
        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-base text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-3 md:space-y-0">
          <div>
            <p className="text-base text-gray-600">
              Choose which users are admins, account managers, or standard users. Changes apply immediately.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-base">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="account_manager">Account Managers</option>
              <option value="user">Users</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-base text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Current Role</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Change To</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="py-6 px-4 text-center text-gray-500 text-base">
                    Loading users...
                  </td>
                </tr>
              )}
              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 px-4 text-center text-gray-500 text-base">
                    No users available for role assignment.
                  </td>
                </tr>
              )}
              {!loading &&
                filteredUsers.map((user) => {
                  const name = user.username || user.email || `User #${user.id}`;
                  const initials = name
                    .split(/[\s@.]+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((n) => n[0]?.toUpperCase())
                    .join('');

                  return (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {initials || 'U'}
                          </div>
                          <span className="font-medium text-gray-900 text-base">{name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-50 text-purple-700 border border-purple-100">
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleChangeRole(user, e.target.value)}
                          disabled={updatingId === user.id}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="account_manager">Account Manager</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoleAssignmentPage;
