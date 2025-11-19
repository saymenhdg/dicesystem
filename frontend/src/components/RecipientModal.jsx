import React, { useEffect, useMemo, useState } from 'react';
import { X, UserPlus, Search } from 'lucide-react';
import { searchUsers } from '../services/apiClient';

const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:8000';

const RecipientModal = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  error = '',
  initialLookup = '',
}) => {
  const [lookup, setLookup] = useState(initialLookup);
  const [nickname, setNickname] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [results, setResults] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (open) {
      setLookup(initialLookup || '');
      setNickname('');
      setResults([]);
      setSelectedId(null);
      setSearchError('');
    }
  }, [open, initialLookup]);

  const selectedUser = useMemo(
    () => results.find((r) => r.id === selectedId) || null,
    [results, selectedId]
  );

  if (!open) return null;

  const safeLookup = typeof lookup === 'string' ? lookup : '';

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      if (typeof onConfirm === 'function') {
        const chosen = results.find((r) => r.id === selectedId) || null;
        onConfirm({
          lookup: safeLookup || chosen?.username || chosen?.email || chosen?.phone_number || '',
          nickname,
          selectedUser: chosen,
        });
      }
    } catch (err) {
      console.error('RecipientModal submit failed', err);
      setSearchError('Unable to add this recipient. Please try again.');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const query = safeLookup.trim();
    if (!query) {
      setSearchError('Enter a username, email, phone number, or user ID to search.');
      setResults([]);
      setSelectedId(null);
      return;
    }
    setSearchError('');
    setSearching(true);
    try {
      const matches = await searchUsers(query);
      if (!Array.isArray(matches) || matches.length === 0) {
        setResults([]);
        setSelectedId(null);
        setSearchError('No matching users found.');
      } else {
        setResults(matches);
        setSelectedId(matches[0].id);
      }
    } catch (err) {
      setResults([]);
      setSelectedId(null);
      setSearchError(err?.detail || err?.message || 'Unable to search users right now.');
    } finally {
      setSearching(false);
    }
  };

  const renderAvatar = (user) => {
    if (user.profile_picture) {
      const src = `${API_BASE_URL}${user.profile_picture}`;
      return (
        <img
          src={src}
          alt={user.full_name || user.username}
          className="w-10 h-10 rounded-full object-cover"
        />
      );
    }
    const letter = user.full_name?.[0] || user.username?.[0] || '?';
    return (
      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">
        {letter.toUpperCase()}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <UserPlus size={16} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Add New Recipient</h3>
              <p className="text-xs text-gray-500">Search by user ID, email, or phone number.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Recipient identifier</label>
            <div className="flex gap-2">
              <input
                autoFocus
                value={safeLookup}
                onChange={(e) => setLookup(e.target.value)}
                placeholder="Username, email, phone number, or user ID"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching}
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-1"
              >
                <Search size={14} />
                {searching ? 'Searching' : 'Search'}
              </button>
            </div>
            {searchError && <p className="text-xs text-red-600 mt-1">{searchError}</p>}
          </div>

          {results.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
              {results.map((user) => (
                <button
                  type="button"
                  key={user.id}
                  onClick={() => {
                    setSelectedId(user.id);
                    setLookup(user.username || user.email || user.phone_number || String(user.id));
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition ${
                    selectedId === user.id ? 'bg-indigo-50' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {renderAvatar(user)}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {user.full_name || user.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      @{user.username} • {user.email}
                    </p>
                    {user.phone_number && <p className="text-xs text-gray-400">{user.phone_number}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nickname (optional)</label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Rent, Mom, Freelancer"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {selectedUser && (
              <div className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600">
                <p className="font-semibold text-gray-900 text-sm">
                  {selectedUser.full_name || selectedUser.username}
                </p>
                <p>@{selectedUser.username}</p>
                <p>{selectedUser.email}</p>
                {selectedUser.phone_number && <p>{selectedUser.phone_number}</p>}
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-xs text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Save recipient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecipientModal;
