import React, { useEffect, useMemo, useState } from 'react';
import { Filter, RefreshCw, User as UserIcon } from 'lucide-react';
import {
  adminListSupportTickets,
  adminUpdateSupportTicketStatus,
  adminAssignSupportTicket,
} from '../services/apiClient';

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const STATUS_COLORS = {
  open: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-red-100 text-red-700',
};

const SupportTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminListSupportTickets();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.detail || err?.message || 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (assignedFilter === 'assigned' && !t.assigned_to_id) return false;
      if (assignedFilter === 'unassigned' && t.assigned_to_id) return false;
      return true;
    });
  }, [tickets, statusFilter, priorityFilter, assignedFilter]);

  const stats = useMemo(() => {
    const s = { open: 0, in_progress: 0, resolved: 0, total: tickets.length };
    for (const t of tickets) {
      if (t.status in s) s[t.status] += 1;
    }
    return s;
  }, [tickets]);

  const formatLabel = (value) => {
    if (!value) return '';
    const normalized = String(value).replace('_', ' ');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const handleStatusChange = async (ticket, nextStatus) => {
    if (ticket.status === nextStatus) return;
    setUpdatingId(ticket.id);
    try {
      const updated = await adminUpdateSupportTicketStatus(ticket.id, nextStatus);
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? updated : t)));
    } catch (err) {
      setError(err?.detail || err?.message || 'Unable to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResetFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setAssignedFilter('all');
  };

  const handleAssignSelf = async (ticket) => {
    setUpdatingId(ticket.id);
    try {
      const updated = await adminAssignSupportTicket(ticket.id, null); // placeholder: assign/unassign handled server-side later
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? updated : t)));
    } catch (err) {
      setError(err?.detail || err?.message || 'Unable to assign ticket');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 space-y-6 pt-4 md:pt-6 text-[15px]">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
          <p className="text-sm text-gray-500 mt-1">
            Monitor, assign, and resolve customer support requests in real time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadTickets}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="hidden md:inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            title="Reset all filters"
          >
            <Filter size={16} />
            <span>Filter tickets</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600 mb-2">Open</p>
          <p className="text-3xl font-bold text-gray-900">{stats.open}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-2">In Progress</p>
          <p className="text-3xl font-bold text-gray-900">{stats.in_progress}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-green-500">
          <p className="text-sm text-gray-600 mb-2">Resolved</p>
          <p className="text-3xl font-bold text-gray-900">{stats.resolved}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
          <div className="flex flex-wrap gap-3 text-sm">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Ownership</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {loading && (
            <div className="text-sm text-gray-500 py-4 text-center">Loading tickets…</div>
          )}
          {!loading && filteredTickets.length === 0 && (
            <div className="text-sm text-gray-500 py-4 text-center">No tickets match your filters.</div>
          )}
          {!loading &&
            filteredTickets.map((ticket) => {
              const created = ticket.created_at
                ? new Date(ticket.created_at).toLocaleString()
                : '';
              const priorityColor = PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS.medium;
              const statusColor = STATUS_COLORS[ticket.status] || STATUS_COLORS.open;

              return (
                <div
                  key={ticket.id}
                  className="p-5 bg-white border border-gray-200 rounded-2xl shadow-md hover:border-indigo-300 hover:shadow-xl hover:-translate-y-0.5 transform transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-3 mb-3">
                        <span className="font-semibold text-gray-900 text-base">#{ticket.id}</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs md:text-sm font-medium ${priorityColor}`}
                        >
                          {formatLabel(ticket.priority)}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs md:text-sm font-medium ${statusColor}`}
                        >
                          {formatLabel(ticket.status)}
                        </span>
                        {ticket.unread_count > 0 && (
                          <span className="px-2 py-1 rounded-full text-xs md:text-sm font-medium bg-indigo-50 text-indigo-700">
                            {ticket.unread_count} unread
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 rounded-full text-xs md:text-sm font-medium ${
                            ticket.assigned_to_username
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ticket.assigned_to_username ? 'Assigned' : 'Unassigned'}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 truncate mb-1 text-xl">{ticket.subject}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <UserIcon size={14} className="text-gray-400" />
                        <span className="truncate">
                          {ticket.user_username} • {ticket.user_email}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Created {created}</p>
                    </div>
                    <div className="flex flex-col items-stretch gap-3 text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 md:min-w-[220px]">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ticket, 'open')}
                          className={`px-3 py-1 rounded-lg border text-sm ${
                            ticket.status === 'open'
                              ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          } ${updatingId === ticket.id ? 'opacity-60 cursor-wait' : ''}`}
                          disabled={updatingId === ticket.id}
                        >
                          Mark Open
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ticket, 'in_progress')}
                          className={`px-3 py-1 rounded-lg border text-sm ${
                            ticket.status === 'in_progress'
                              ? 'bg-blue-50 border-blue-200 text-blue-700'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          } ${updatingId === ticket.id ? 'opacity-60 cursor-wait' : ''}`}
                          disabled={updatingId === ticket.id}
                        >
                          In Progress
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ticket, 'resolved')}
                          className={`px-3 py-1 rounded-lg border text-sm ${
                            ticket.status === 'resolved'
                              ? 'bg-green-50 border-green-200 text-green-700'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          } ${updatingId === ticket.id ? 'opacity-60 cursor-wait' : ''}`}
                          disabled={updatingId === ticket.id}
                        >
                          Resolve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ticket, 'closed')}
                          className={`px-3 py-1 rounded-lg border text-sm ${
                            ticket.status === 'closed'
                              ? 'bg-red-50 border-red-200 text-red-700'
                              : 'border-red-200 text-red-600 hover:bg-red-50'
                          } ${updatingId === ticket.id ? 'opacity-60 cursor-wait' : ''}`}
                          disabled={updatingId === ticket.id}
                        >
                          Close
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAssignSelf(ticket)}
                        className="mt-1 inline-flex items-center justify-center w-full px-4 py-2 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-sm"
                        disabled={updatingId === ticket.id}
                      >
                        {ticket.assigned_to_username ? `Assigned to ${ticket.assigned_to_username}` : 'Assign to me'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default SupportTicketsPage;
