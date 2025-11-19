import React, { useEffect, useMemo, useState } from 'react';
import {
  Inbox,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import { adminListSupportTickets } from '../services/apiClient';

const AccountManagerWorkspace = ({ onGoToTickets, onGoToChat, onGoToAccountControl }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminListSupportTickets();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.detail || err?.message || 'Unable to load support tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const stats = useMemo(() => {
    const total = tickets.length;
    const unread = tickets.reduce((sum, t) => sum + (t.unread_count || 0), 0);
    const unassigned = tickets.filter(
      (t) => !t.assigned_to_id && !['resolved', 'closed'].includes(t.status)
    ).length;
    const open = tickets.filter((t) => t.status === 'open').length;
    return { total, unread, unassigned, open };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tickets;
    return tickets.filter((ticket) =>
      [ticket.subject, ticket.user_username, ticket.user_email, String(ticket.id)]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [tickets, search]);

  const urgentTickets = useMemo(() => {
    return filteredTickets
      .filter(
        (t) =>
          ['high', 'critical'].includes(t.priority) &&
          !['resolved', 'closed'].includes(t.status)
      )
      .sort((a, b) => (b.unread_count || 0) - (a.unread_count || 0))
      .slice(0, 4);
  }, [filteredTickets]);

  const recentActivity = useMemo(() => {
    return [...filteredTickets]
      .sort((a, b) => {
        const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 6);
  }, [filteredTickets]);

  const formatDate = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="px-4 lg:px-6 py-4 md:py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">
            Account Manager
          </p>
          <h1 className="text-2xl font-bold text-gray-900">Operations Desk</h1>
          <p className="text-sm text-gray-500">
            Monitor customer requests, triage urgent tickets, and move work forward.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onGoToAccountControl}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Users size={16} />
            Accounts control
          </button>
          <button
            type="button"
            onClick={onGoToChat}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
          >
            <MessageSquare size={16} />
            Support inbox
          </button>
          <button
            type="button"
            onClick={onGoToTickets}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >
            Manage tickets
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-gray-500">Total tickets</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-bold text-gray-900">{stats.total}</h3>
            <Inbox className="text-indigo-500" size={28} />
          </div>
          <p className="text-xs text-gray-500 mt-1">All time</p>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-gray-500">Unread replies</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-bold text-gray-900">{stats.unread}</h3>
            <AlertTriangle className="text-amber-500" size={28} />
          </div>
          <p className="text-xs text-gray-500 mt-1">Needs your attention</p>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-gray-500">Open</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-bold text-gray-900">{stats.open}</h3>
            <Users className="text-blue-500" size={28} />
          </div>
          <p className="text-xs text-gray-500 mt-1">Awaiting action</p>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-gray-500">Unassigned</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-bold text-gray-900">{stats.unassigned}</h3>
            <CheckCircle2 className="text-emerald-500" size={28} />
          </div>
          <p className="text-xs text-gray-500 mt-1">Grab before SLA breaches</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Active queue</h2>
              <p className="text-xs text-gray-500">
                Search tickets or jump to the full board for assignments.
              </p>
            </div>
            <button
              type="button"
              onClick={loadTickets}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
          <div className="relative mb-4">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by subject, ticket id, or requester"
              className="w-full pl-9 pr-3 py-2 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase">
                  <th className="py-2">Ticket</th>
                  <th className="py-2">Priority</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Unread</th>
                  <th className="py-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.slice(0, 6).map((ticket) => (
                  <tr key={ticket.id} className="border-t border-gray-100">
                    <td className="py-3">
                      <div className="font-semibold text-gray-900">{ticket.subject}</div>
                      <p className="text-xs text-gray-500">
                        #{ticket.id} • {ticket.user_username || ticket.user_email}
                      </p>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        {ticket.priority}
                      </span>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-center font-semibold text-indigo-600">
                      {ticket.unread_count || 0}
                    </td>
                    <td className="text-xs text-gray-500">{formatDate(ticket.last_message_at)}</td>
                  </tr>
                ))}
                {!filteredTickets.length && (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-gray-500 text-sm">
                      {loading ? 'Loading queue...' : 'No tickets match this search.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Urgent queue</h3>
              <span className="text-xs text-gray-500">{urgentTickets.length} items</span>
            </div>
            <div className="space-y-3">
              {urgentTickets.length === 0 && (
                <p className="text-sm text-gray-500">No urgent tickets. Great job!</p>
              )}
              {urgentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-3 rounded-2xl border border-red-100 bg-red-50 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900 truncate">{ticket.subject}</p>
                    <span className="text-xs font-semibold text-red-700">
                      {ticket.unread_count || 0} unread
                    </span>
                  </div>
                  <p className="text-xs text-red-600">
                    {ticket.user_username || ticket.user_email || 'Customer'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Updated {formatDate(ticket.last_message_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Recent activity</h3>
              <span className="text-xs text-gray-500">Last 6 tickets</span>
            </div>
            <div className="space-y-3">
              {recentActivity.length === 0 && (
                <p className="text-sm text-gray-500">No recent ticket activity. Check back soon.</p>
              )}
              {recentActivity.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold text-gray-900">{ticket.subject}</p>
                    <p className="text-xs text-gray-500">{formatDate(ticket.last_message_at)}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-gradient-to-r from-indigo-50 to-indigo-100 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Need to update balances or freeze cards?</h3>
            <p className="text-sm text-gray-600">
              Use the dedicated Account Control dashboard for financial interventions, card freezes, and transaction reviews.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToAccountControl}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >
            Open account control
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountManagerWorkspace;
