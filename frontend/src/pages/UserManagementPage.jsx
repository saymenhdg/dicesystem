import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, RefreshCw, User as UserIcon, X } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import {
  listAdminUsers,
  updateUserStatusAdmin,
  register as registerUser,
  adminGetAccount,
  adminUpdateAccountBalance,
  adminListUserCards,
  adminUpdateCardBalance,
} from '../services/apiClient';

const ROLE_LABELS = {
  admin: 'Admin',
  account_manager: 'Account Manager',
  user: 'User',
};

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [viewUser, setViewUser] = useState(null);

  const [viewAccount, setViewAccount] = useState(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [balanceInput, setBalanceInput] = useState('');

  const [viewCards, setViewCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState('');
  const [cardBalances, setCardBalances] = useState({});
  const [cardSavingId, setCardSavingId] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addForm, setAddForm] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    password: '',
    role: 'user',
  });

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

  const loadCards = async (userId) => {
    setCardsLoading(true);
    setCardsError('');
    try {
      const data = await adminListUserCards(userId);
      const rows = Array.isArray(data) ? data : [];
      setViewCards(rows);
      const map = {};
      for (const c of rows) {
        const raw = c.balance != null ? Number(c.balance) : 0;
        const safe = Number.isFinite(raw) ? raw : 0;
        map[c.id] = safe.toFixed(2);
      }
      setCardBalances(map);
    } catch (err) {
      setCardsError(err?.detail || err?.message || 'Failed to load cards');
      setViewCards([]);
      setCardBalances({});
    } finally {
      setCardsLoading(false);
    }
  };

  const loadAccount = async (userId) => {
    setAccountLoading(true);
    setAccountError('');
    try {
      const data = await adminGetAccount(userId);
      setViewAccount(data);
      const raw = data?.raw_balance != null ? Number(data.raw_balance) : 0;
      const safeRaw = Number.isFinite(raw) ? raw : 0;
      setBalanceInput(safeRaw.toFixed(2));
    } catch (err) {
      setAccountError(err?.detail || err?.message || 'Failed to load account');
      setViewAccount(null);
    } finally {
      setAccountLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (viewUser) {
      loadAccount(viewUser.id);
      loadCards(viewUser.id);
    } else {
      setViewAccount(null);
      setAccountError('');
      setBalanceInput('');
      setViewCards([]);
      setCardsError('');
      setCardBalances({});
      setCardSavingId(null);
    }
  }, [viewUser]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.trim().toLowerCase();
      if (q) {
        const match =
          u.username?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone_number?.toLowerCase?.().includes(q);
        if (!match) return false;
      }
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter === 'active' && !u.is_active) return false;
      if (statusFilter === 'inactive' && u.is_active) return false;
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  const handleToggleStatus = async (user) => {
    const next = !user.is_active;
    setUpdatingId(user.id);
    try {
      await updateUserStatusAdmin(user.id, next);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: next } : u)));
    } catch (err) {
      setError(err?.detail || err?.message || 'Unable to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddUserChange = (field, value) => {
    setAddForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    try {
      await registerUser({
        email: addForm.email,
        username: addForm.username,
        first_name: addForm.first_name,
        last_name: addForm.last_name,
        phone_number: addForm.phone_number,
        password: addForm.password,
        country: '',
        city: '',
        role: addForm.role || 'user',
      });
      setAddOpen(false);
      setAddForm({
        email: '',
        username: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        password: '',
        role: 'user',
      });
      await fetchUsers();
    } catch (err) {
      setAddError(err?.detail || err?.message || 'Unable to create user');
    } finally {
      setAddLoading(false);
    }
  };

  const handleBalanceSave = async (e) => {
    e.preventDefault();
    if (!viewUser) return;
    const parsed = Number(balanceInput);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setAccountError('Enter a valid, non-negative balance amount');
      return;
    }
    setAccountError('');
    setAccountLoading(true);
    try {
      const updated = await adminUpdateAccountBalance(viewUser.id, parsed);
      setViewAccount(updated);
      const nextRaw = updated?.raw_balance != null ? Number(updated.raw_balance) : parsed;
      setBalanceInput(
        Number.isFinite(nextRaw) ? nextRaw.toFixed(2) : parsed.toFixed(2)
      );
    } catch (err) {
      setAccountError(err?.detail || err?.message || 'Unable to update account balance');
    } finally {
      setAccountLoading(false);
    }
  };

  const handleCardBalanceChange = (cardId, value) => {
    setCardBalances((prev) => ({ ...prev, [cardId]: value }));
  };

  const handleCardBalanceSave = async (card) => {
    const inputValue = cardBalances[card.id];
    const parsed = Number(inputValue);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setCardsError('Enter a valid, non-negative card balance');
      return;
    }
    setCardsError('');
    setCardSavingId(card.id);
    try {
      const updated = await adminUpdateCardBalance(card.id, parsed);
      setViewCards((prev) =>
        prev.map((existing) => (existing.id === card.id ? updated : existing))
      );
      const nextBalance =
        updated?.balance != null ? Number(updated.balance) : parsed;
      setCardBalances((prev) => ({
        ...prev,
        [card.id]: Number.isFinite(nextBalance)
          ? nextBalance.toFixed(2)
          : prev[card.id],
      }));
    } catch (err) {
      setCardsError(err?.detail || err?.message || 'Unable to update card balance');
    } finally {
      setCardSavingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 space-y-6 pt-4 md:pt-6 text-base md:text-[17px]">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-base text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              setAddError('');
              setAddOpen(true);
            }}
            className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg"
          >
            <Plus size={20} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
            <input
              type="text"
              placeholder="Search by username, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-80 text-base"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="account_manager">Account Manager</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="py-6 px-4 text-center text-gray-500 text-base">
                    Loading users...
                  </td>
                </tr>
              )}
              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 px-4 text-center text-gray-500 text-base">
                    {users.length === 0 && !search.trim() && roleFilter === 'all' && statusFilter === 'all'
                      ? 'No users yet. Use "Add User" to create the first account.'
                      : 'No users found. Try adjusting filters.'}
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
                  const created = user.created_at ? new Date(user.created_at).toLocaleDateString() : '-';
                  const roleLabel = ROLE_LABELS[user.role] || user.role;

                  return (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {initials || 'U'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 text-base">{name}</span>
                            {user.phone_number && (
                              <span className="text-base text-gray-500">{user.phone_number}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-base text-gray-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-50 text-purple-700 border border-purple-100">
                          {roleLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={user.is_active ? 'active' : 'inactive'} />
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">{created}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={updatingId === user.id}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                              user.is_active
                                ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            } ${updatingId === user.id ? 'opacity-70 cursor-wait' : ''}`}
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewUser(user)}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAddOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
              <p className="text-xs text-gray-500 mt-1">
                Create a new DiceBank user account and assign a role.
              </p>
            </div>
            <form onSubmit={handleAddUserSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First name</label>
                  <input
                    value={addForm.first_name}
                    onChange={(e) => handleAddUserChange('first_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last name</label>
                  <input
                    value={addForm.last_name}
                    onChange={(e) => handleAddUserChange('last_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => handleAddUserChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
                  <input
                    value={addForm.username}
                    onChange={(e) => handleAddUserChange('username', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="username"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone number</label>
                  <input
                    value={addForm.phone_number}
                    onChange={(e) => handleAddUserChange('phone_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="+1 555 000 0000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Initial password</label>
                  <input
                    type="password"
                    value={addForm.password}
                    onChange={(e) => handleAddUserChange('password', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Set a temporary password"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => handleAddUserChange('role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="account_manager">Account Manager</option>
                  </select>
                </div>
              </div>
              {addError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                  {addError}
                </div>
              )}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60"
                >
                  {addLoading ? 'Creating...' : 'Create user'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setViewUser(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                  <UserIcon size={16} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">User details</h3>
                  <p className="text-xs text-gray-500">ID #{viewUser.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewUser(null)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-xs uppercase text-gray-500 tracking-wide">Username</span>
                <span className="font-medium text-gray-900 truncate">{viewUser.username}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-xs uppercase text-gray-500 tracking-wide">Email</span>
                <span className="text-gray-800 truncate">{viewUser.email}</span>
              </div>
              {viewUser.phone_number && (
                <div className="flex justify-between gap-3">
                  <span className="text-xs uppercase text-gray-500 tracking-wide">Phone</span>
                  <span className="text-gray-800 truncate">{viewUser.phone_number}</span>
                </div>
              )}
              <div className="flex justify-between gap-3 items-center">
                <span className="text-xs uppercase text-gray-500 tracking-wide">Role</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-100">
                  {ROLE_LABELS[viewUser.role] || viewUser.role}
                </span>
              </div>
              <div className="flex justify-between gap-3 items-center">
                <span className="text-xs uppercase text-gray-500 tracking-wide">Status</span>
                <StatusBadge status={viewUser.is_active ? 'active' : 'inactive'} />
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-xs uppercase text-gray-500 tracking-wide">Created</span>
                <span className="text-gray-800 text-xs">
                  {viewUser.created_at
                    ? new Date(viewUser.created_at).toLocaleString()
                    : '-'}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase text-gray-500 tracking-wide">Available balance</span>
                  <span className="text-gray-900 font-semibold text-sm">
                    {viewAccount
                      ? `$${Number(viewAccount.balance ?? 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : accountLoading
                      ? 'Loading...'
                      : '--'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase text-gray-500 tracking-wide">Account balance</span>
                  <span className="text-gray-700 text-sm">
                    {viewAccount
                      ? `$${Number(viewAccount.raw_balance ?? 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : accountLoading
                      ? 'Loading...'
                      : '--'}
                  </span>
                </div>
                <form onSubmit={handleBalanceSave} className="space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs uppercase text-gray-500 tracking-wide">
                      Set account balance
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={balanceInput}
                      onChange={(e) => setBalanceInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0.00"
                    />
                    <button
                      type="submit"
                      disabled={accountLoading}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {accountLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  {accountError && (
                    <p className="text-[11px] text-red-600">{accountError}</p>
                  )}
                </form>
                <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs uppercase text-gray-500 tracking-wide">Cards</span>
                    {cardsLoading && (
                      <span className="text-[11px] text-gray-400">Loading...</span>
                    )}
                  </div>
                  {cardsError && (
                    <p className="text-[11px] text-red-600 mb-1">{cardsError}</p>
                  )}
                  {viewCards.length === 0 && !cardsLoading && !cardsError && (
                    <p className="text-xs text-gray-500">No cards for this user yet.</p>
                  )}
                  {viewCards.length > 0 && (
                    <div className="space-y-3">
                      {viewCards.map((card) => {
                        const labelType = card.card_type === 'physical' ? 'Physical' : 'Virtual';
                        const masked = (card.card_number || '').replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                        return (
                          <div
                            key={card.id}
                            className="p-3 rounded-lg border border-gray-200 bg-gray-50 space-y-2"
                          >
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-gray-800">
                                {`${labelType} \u2022 ${masked || '----'}`}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                                {card.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Card balance</span>
                              <span className="text-gray-900 font-semibold">
                                ${Number(card.balance ?? 0).toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={cardBalances[card.id] ?? ''}
                                onChange={(e) => handleCardBalanceChange(card.id, e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="0.00"
                              />
                              <button
                                type="button"
                                disabled={cardSavingId === card.id}
                                onClick={() => handleCardBalanceSave(card)}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60"
                              >
                                {cardSavingId === card.id ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
