import React, { useState } from 'react';
import {
  Search,
  RefreshCw,
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
} from 'lucide-react';
import {
  adminGetAccount,
  adminUpdateAccountBalance,
  adminActivateAccount,
  adminListUserCards,
  adminUpdateCardStatus,
  adminListTransactions,
  searchUsers,
} from '../services/apiClient';

const AccountControlPage = () => {
  const [userLookup, setUserLookup] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [accountDetails, setAccountDetails] = useState(null);
  const [cardDetails, setCardDetails] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [balanceInput, setBalanceInput] = useState('');
  const [transactionSearch, setTransactionSearch] = useState('');

  const [searchLoading, setSearchLoading] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [cardStatusLoadingId, setCardStatusLoadingId] = useState(null);
  const [transactionsError, setTransactionsError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const formatCurrency = (value) =>
    `$${Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSearchUsers = async (e) => {
    if (e) e.preventDefault();
    const query = userLookup.trim();
    setFeedback({ type: '', message: '' });
    setSelectedUser(null);
    setAccountDetails(null);
    setCardDetails([]);
    setTransactions([]);
    setBalanceInput('');
    if (!query) {
      setFeedback({ type: 'error', message: 'Enter a username, email, phone number, or ID.' });
      setUserResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const matches = await searchUsers(query);
      setUserResults(Array.isArray(matches) ? matches : []);
      if (!matches?.length) {
        setFeedback({ type: 'error', message: 'No matching users found.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err?.detail || err?.message || 'Lookup failed.' });
      setUserResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const loadAccount = async (user) => {
    if (!user) return;
    setSelectedUser(user);
    setFeedback({ type: '', message: '' });
    setAccountLoading(true);
    setTransactionsError('');
    try {
      const [account, cards, txns] = await Promise.all([
        adminGetAccount(user.id),
        adminListUserCards(user.id).catch(() => []),
        adminListTransactions(user.id, 25).catch(() => []),
      ]);
      setAccountDetails(account);
      setCardDetails(Array.isArray(cards) ? cards : []);
      setTransactions(Array.isArray(txns) ? txns : []);
      const raw = account?.raw_balance != null ? Number(account.raw_balance) : null;
      setBalanceInput(Number.isFinite(raw) ? raw.toFixed(2) : '');
    } catch (err) {
      setFeedback({ type: 'error', message: err?.detail || err?.message || 'Unable to load account.' });
      setCardDetails([]);
      setTransactions([]);
    } finally {
      setAccountLoading(false);
    }
  };

  const handleBalanceUpdate = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    const parsed = Number(balanceInput);
    if (!Number.isFinite(parsed)) {
      setFeedback({ type: 'error', message: 'Enter a valid numeric balance.' });
      return;
    }
    setActionLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      const updated = await adminUpdateAccountBalance(selectedUser.id, parsed);
      setAccountDetails(updated);
      const raw = updated?.raw_balance != null ? Number(updated.raw_balance) : parsed;
      setBalanceInput(Number.isFinite(raw) ? raw.toFixed(2) : parsed.toFixed(2));
      setFeedback({ type: 'success', message: 'Account balance updated.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err?.detail || err?.message || 'Update failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccountToggle = async () => {
    if (!selectedUser || !accountDetails) return;
    const next = !accountDetails.card_active;
    setActionLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      const res = await adminActivateAccount(selectedUser.id, next);
      setAccountDetails((prev) => (prev ? { ...prev, card_active: res?.card_active ?? next } : prev));
      setFeedback({
        type: 'success',
        message: next ? 'Account unfrozen.' : 'Account frozen.',
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err?.detail || err?.message || 'Unable to update status.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCardToggle = async (card) => {
    if (!card) return;
    const nextStatus = card.status === 'active' ? 'frozen' : 'active';
    setCardStatusLoadingId(card.id);
    setFeedback({ type: '', message: '' });
    try {
      const updated = await adminUpdateCardStatus(card.id, nextStatus);
      setCardDetails((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, status: updated.status } : c))
      );
      setFeedback({
        type: 'success',
        message: nextStatus === 'frozen' ? 'Card frozen.' : 'Card reactivated.',
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err?.detail || err?.message || 'Unable to update card.' });
    } finally {
      setCardStatusLoadingId(null);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const query = transactionSearch.trim().toLowerCase();
    if (!query) return true;
    const fields = [
      tx.description,
      tx.tx_type,
      tx.sender_id ? String(tx.sender_id) : '',
      tx.receiver_id ? String(tx.receiver_id) : '',
    ]
      .filter(Boolean)
      .map((value) => value.toLowerCase());
    return fields.some((value) => value.includes(query));
  });

  return (
    <div className="px-4 lg:px-6 py-4 md:py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">Account control</p>
          <h1 className="text-2xl font-bold text-gray-900">Customer accounts</h1>
          <p className="text-sm text-gray-500">
            Search for a customer to adjust balances, review cards, and monitor recent transactions.
          </p>
        </div>
        <CreditCard size={36} className="text-indigo-500" />
      </div>

      <form onSubmit={handleSearchUsers} className="flex flex-wrap gap-2">
        <input
          value={userLookup}
          onChange={(e) => setUserLookup(e.target.value)}
          placeholder="Search by username, email, phone number, or user ID"
          className="flex-1 px-4 py-2 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
        >
          <Search size={16} />
          Lookup
        </button>
      </form>
      {searchLoading && <p className="text-xs text-gray-500">Searching directory...</p>}
      {feedback.message && (
        <div
          className={`rounded-2xl px-3 py-2 text-xs ${
            feedback.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {feedback.message}
        </div>
      )}
      {userResults.length > 0 && (
        <div className="rounded-3xl border border-gray-100 divide-y divide-gray-100">
          {userResults.slice(0, 6).map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => loadAccount(user)}
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition ${
                selectedUser?.id === user.id ? 'bg-indigo-50' : 'hover:bg-gray-50'
              }`}
            >
              <div>
                <p className="font-semibold text-gray-900">{user.full_name || user.username}</p>
                <p className="text-xs text-gray-500">@{user.username} • {user.email}</p>
              </div>
              <span className="text-xs text-gray-400">ID #{user.id}</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-4">
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          {accountLoading && <p className="text-xs text-gray-500 mb-3">Loading account details...</p>}
          {!selectedUser && !accountLoading && (
            <p className="text-sm text-gray-500">Select a user to view account information.</p>
          )}
          {selectedUser && accountDetails && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase text-gray-500">Customer</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedUser.full_name || selectedUser.username}
                    </p>
                    <p className="text-xs text-gray-500">{selectedUser.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Account status</p>
                    <p className={`text-sm font-semibold ${accountDetails.card_active ? 'text-emerald-600' : 'text-red-600'}`}>
                      {accountDetails.card_active ? 'Active' : 'Frozen'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Available balance</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(accountDetails.balance)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total funds</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(accountDetails.raw_balance)}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleBalanceUpdate} className="space-y-3">
                <label className="block text-xs font-semibold text-gray-600">Set available balance</label>
                <div className="flex gap-2">
                  <input
                    value={balanceInput}
                    onChange={(e) => setBalanceInput(e.target.value)}
                    type="number"
                    step="0.01"
                    className="flex-1 px-3 py-2 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-60"
                  >
                    <RefreshCw size={16} className={actionLoading ? 'animate-spin' : ''} />
                    Update
                  </button>
                </div>
              </form>

              <button
                type="button"
                onClick={handleAccountToggle}
                disabled={actionLoading}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl border text-sm font-semibold ${
                  accountDetails.card_active
                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                } disabled:opacity-50`}
              >
                {accountDetails.card_active ? 'Freeze account access' : 'Unfreeze account'}
              </button>

              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-inner">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">Cards</h4>
                    <span className="text-xs text-gray-500">{cardDetails.length} card(s)</span>
                  </div>
                  {cardDetails.length === 0 && (
                    <p className="text-xs text-gray-500">No cards issued to this user.</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cardDetails.map((card) => (
                      <div
                        key={card.id}
                        className="rounded-xl border border-gray-100 p-3 bg-gradient-to-br from-gray-900 to-gray-700 text-white text-xs space-y-2"
                      >
                        <div className="flex justify-between text-[10px] uppercase tracking-wide opacity-70">
                          <span>{card.card_type === 'physical' ? 'Physical' : 'Virtual'}</span>
                          <span className={card.status === 'active' ? 'text-emerald-300' : 'text-amber-300'}>
                            {card.status}
                          </span>
                        </div>
                        <p className="text-base font-mono tracking-widest">
                          {(card.card_number || '').replace(/(.{4})/g, '$1 ').trim()}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <span>
                            Available:{' '}
                            {formatCurrency(card.balance)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCardToggle(card)}
                            disabled={cardStatusLoadingId === card.id}
                            className="px-2 py-1 rounded-full border border-white/40 text-[11px] uppercase tracking-wide hover:bg-white/10 disabled:opacity-60"
                          >
                            {card.status === 'active' ? 'Freeze' : 'Unfreeze'}
                          </button>
                        </div>
                        <div className="flex justify-between text-xs opacity-80">
                          <div>
                            <p className="text-[10px]">Card holder</p>
                            <p className="font-semibold">{card.holder_name || selectedUser.username}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px]">Expires</p>
                            <p className="font-semibold">
                              {String(card.expiry_month).padStart(2, '0')}/{String(card.expiry_year).slice(-2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-inner space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Recent transactions</h4>
                      <p className="text-xs text-gray-500">Filter within the latest 25 records</p>
                    </div>
                    <div className="relative">
                      <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={transactionSearch}
                        onChange={(e) => setTransactionSearch(e.target.value)}
                        placeholder="Search"
                        className="pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  {transactionsError && (
                    <p className="text-xs text-red-600">{transactionsError}</p>
                  )}
                  {!transactions.length && (
                    <p className="text-xs text-gray-500">No transactions recorded yet.</p>
                  )}
                  <div className="space-y-2">
                    {filteredTransactions.slice(0, 8).map((tx) => {
                      const isOutgoing = tx.sender_id === selectedUser.id;
                      const amount = Number(tx.amount || 0);
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isOutgoing ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                              }`}
                            >
                              {isOutgoing ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {tx.description || (isOutgoing ? 'Sent transfer' : 'Received transfer')}
                              </p>
                              <p className="text-[11px] text-gray-500">{formatDate(tx.timestamp)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-semibold ${isOutgoing ? 'text-red-600' : 'text-emerald-600'}`}
                            >
                              {isOutgoing ? '-' : '+'}${Math.abs(amount).toFixed(2)}
                            </p>
                            <p className="text-[11px] text-gray-400 uppercase">{tx.tx_type}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Account control guidelines</h3>
          <ul className="space-y-2 text-xs text-gray-600">
            <li>• Verify the customer’s identity before adjusting balances.</li>
            <li>• Communicate freeze/unfreeze actions through the support ticket.</li>
            <li>• Monitor for suspicious transactions and escalate to admins if needed.</li>
            <li>• Use this panel for high-priority financial interventions only.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AccountControlPage;
