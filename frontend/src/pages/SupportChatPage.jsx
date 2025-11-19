import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Inbox,
  MailPlus,
  Search,
  RefreshCw,
  Send,
  Paperclip,
  User as UserIcon,
  Bot,
  AlertCircle,
  Tag,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import {
  listSupportTickets,
  createSupportTicket,
  getSupportMessages,
  sendSupportMessage,
  adminListSupportTickets,
  uploadSupportAttachment,
} from '../services/apiClient';

const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:8000';

const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

const PRIORITY_COLORS = {
  low: 'text-emerald-600 bg-emerald-50',
  medium: 'text-yellow-700 bg-yellow-50',
  high: 'text-orange-700 bg-orange-50',
  critical: 'text-red-700 bg-red-50',
};

const STATUS_COLORS = {
  open: 'bg-yellow-50 text-yellow-700',
  in_progress: 'bg-blue-50 text-blue-700',
  resolved: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-gray-100 text-gray-600',
};

const SupportChatPage = ({ userRole, pushNotification = () => {}, isDarkMode }) => {
  const [tickets, setTickets] = useState([]);
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [ticketSearch, setTicketSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [composeMode, setComposeMode] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composePriority, setComposePriority] = useState('medium');
  const [composeBody, setComposeBody] = useState('');
  const [replyText, setReplyText] = useState('');
  const [error, setError] = useState('');
  const [bootstrapping, setBootstrapping] = useState(true);
  const [lastUnread, setLastUnread] = useState(0);
  const fileInputRef = useRef(null);
  const isStaff = userRole === 'admin' || userRole === 'account_manager';

  const formatTimestamp = (value) => {
    if (!value) return 'No replies yet';
    const date = new Date(value);
    return date.toLocaleString(undefined, {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    });
  };

  const resolveAttachmentUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path}`;
  };

  const isImageAttachment = (path) => /\.(png|jpe?g|gif|webp)$/i.test(path || '');

  const refreshTickets = async () => {
    setLoadingTickets(true);
    setError('');
    try {
      const listFn = isStaff ? adminListSupportTickets : listSupportTickets;
      const data = await listFn();
      const rows = Array.isArray(data) ? data : [];
      setTickets(rows);
      if (!composeMode && rows.length > 0 && !activeTicketId) {
        setActiveTicketId(rows[0].id);
        await fetchMessages(rows[0].id);
      } else if (activeTicketId) {
        const stillExists = rows.some((t) => t.id === activeTicketId);
        if (!stillExists) {
          setActiveTicketId(rows[0]?.id ?? null);
          if (rows[0]) await fetchMessages(rows[0].id);
          else setMessages([]);
        }
      }
    } catch (err) {
      setError(err?.detail || err?.message || 'Failed to load support tickets');
    } finally {
      setLoadingTickets(false);
      setBootstrapping(false);
    }
  };

  useEffect(() => {
    refreshTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff]);

  const fetchMessages = async (ticketId) => {
    setLoadingMessages(true);
    setError('');
    try {
      const data = await getSupportMessages(ticketId);
      const list = Array.isArray(data) ? data : [];
      setMessages(list);
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                unread_count: 0,
                last_message_at: list.length ? list[list.length - 1].timestamp : t.last_message_at,
              }
            : t
        )
      );
    } catch (err) {
      setError(err?.detail || err?.message || 'Unable to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectTicket = async (ticketId) => {
    if (ticketId === activeTicketId) return;
    setComposeMode(false);
    setReplyText('');
    setActiveTicketId(ticketId);
    if (ticketId) {
      await fetchMessages(ticketId);
    } else {
      setMessages([]);
    }
  };

  const handleCompose = () => {
    setComposeMode(true);
    setActiveTicketId(null);
    setMessages([]);
    setReplyText('');
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!composeBody.trim()) {
      setError('Please describe your issue before sending.');
      return;
    }
    setError('');
    setLoadingMessages(true);
    try {
      const payload = {
        subject: composeSubject.trim() || 'Support request',
        priority: composePriority,
        initialMessage: composeBody.trim(),
      };
      const res = await createSupportTicket(payload);
      const created = res.ticket;
      const msgs = Array.isArray(res.messages) ? res.messages : [];
      setTickets((prev) => [created, ...prev]);
      setComposeMode(false);
      setComposeSubject('');
      setComposePriority('medium');
      setComposeBody('');
      setActiveTicketId(created.id);
      setMessages(msgs);
      setReplyText('');
    } catch (err) {
      setError(err?.detail || err?.message || 'Unable to send support request');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!activeTicketId) return;
    const text = replyText.trim();
    if (!text) return;
    setReplyText('');
    setLoadingMessages(true);
    setError('');
    try {
      const message = await sendSupportMessage(activeTicketId, text);
      setMessages((prev) => [...prev, message]);
      setTickets((prev) =>
        prev.map((t) =>
          t.id === activeTicketId
            ? { ...t, last_message_at: message.timestamp, unread_count: 0 }
            : t
        )
      );
    } catch (err) {
      setError(err?.detail || err?.message || 'Unable to send message');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleAttachmentUpload = async (file) => {
    if (!file || !activeTicketId) return;
    setLoadingMessages(true);
    setError('');
    try {
      const res = await uploadSupportAttachment(activeTicketId, file);
      setMessages((prev) => [...prev, res]);
      setTickets((prev) =>
        prev.map((t) =>
          t.id === activeTicketId
            ? { ...t, last_message_at: res.timestamp, unread_count: 0 }
            : t
        )
      );
    } catch (err) {
      setError(err?.detail || err?.message || 'Unable to upload attachment');
    } finally {
      setLoadingMessages(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredTickets = useMemo(() => {
    const query = ticketSearch.trim().toLowerCase();
    const sorted = [...tickets].sort((a, b) => {
      if (a.unread_count && !b.unread_count) return -1;
      if (!a.unread_count && b.unread_count) return 1;
      const aDate = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const bDate = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return bDate - aDate;
    });
    return sorted.filter((ticket) => {
      if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
      if (!query) return true;
      const haystacks = [
        ticket.subject,
        ticket.user_username,
        ticket.user_email,
        ticket.priority,
        String(ticket.id),
      ]
        .filter(Boolean)
        .map((v) => v.toLowerCase());
      return haystacks.some((value) => value.includes(query));
    });
  }, [tickets, ticketSearch, statusFilter]);

  const stats = useMemo(() => {
    const summary = { total: tickets.length, unread: 0, open: 0, in_progress: 0, resolved: 0 };
    for (const t of tickets) {
      summary.unread += t.unread_count || 0;
      if (t.status in summary) summary[t.status] += 1;
    }
    return summary;
  }, [tickets]);

  useEffect(() => {
    const totalUnread = tickets.reduce((sum, t) => sum + (t.unread_count || 0), 0);
    if (totalUnread > lastUnread) {
      pushNotification('New support reply received', { time: 'just now' });
    }
    if (totalUnread !== lastUnread) {
      setLastUnread(totalUnread);
    }
  }, [tickets, lastUnread, pushNotification]);

  const currentTicket = tickets.find((t) => t.id === activeTicketId) || null;

  return (
    <div className="px-3 py-4 md:px-6 md:py-6">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">Support</p>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Inbox size={16} />
            <span>{stats.total} tickets</span>
            <span className="text-indigo-600 font-semibold">
              {stats.unread} unread
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-4">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm">
          <div className="p-4 space-y-4 border-b border-gray-100">
            <button
              type="button"
              onClick={handleCompose}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
            >
              <MailPlus size={16} />
              Compose new ticket
            </button>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  placeholder="Search subject, user, ticket ID"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={refreshTickets}
                className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50"
              >
                <RefreshCw size={16} className={loadingTickets ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {['all', 'open', 'in_progress', 'resolved'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-full border ${
                    statusFilter === status
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {status === 'all'
                    ? 'All'
                    : status
                        .split('_')
                        .map((w) => w[0].toUpperCase() + w.slice(1))
                        .join(' ')}
                </button>
              ))}
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-600">
              <div className="flex justify-between mb-1">
                <span>Open</span>
                <span className="font-semibold text-gray-900">{stats.open}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>In Progress</span>
                <span className="font-semibold text-gray-900">{stats.in_progress}</span>
              </div>
              <div className="flex justify-between">
                <span>Resolved</span>
                <span className="font-semibold text-gray-900">{stats.resolved}</span>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
            {filteredTickets.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-500">
                {tickets.length === 0
                  ? 'No support tickets yet. Compose a new one.'
                  : 'No tickets match this filter.'}
              </div>
            )}
            {filteredTickets.map((ticket) => {
              const unread = ticket.unread_count || 0;
              const statusBadge = STATUS_COLORS[ticket.status] || 'bg-gray-100 text-gray-600';
              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => handleSelectTicket(ticket.id)}
                  className={`w-full text-left p-4 transition ${
                    ticket.id === activeTicketId && !composeMode
                      ? 'bg-indigo-50 border-l-4 border-indigo-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {ticket.subject}
                    </h3>
                    {unread > 0 && (
                      <span className="text-xs bg-indigo-600 text-white rounded-full px-2 py-0.5">
                        {unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {isStaff
                      ? `${ticket.user_username || ticket.user_email || 'Client'}`
                      : `Ticket #${ticket.id}`}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTimestamp(ticket.last_message_at)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col min-h-[70vh]">
          {error && (
            <div className="px-4 py-3 bg-red-50 text-sm text-red-700 border-b border-red-200 flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {composeMode ? (
            <form className="p-6 space-y-4 flex-1 flex flex-col" onSubmit={handleCreateTicket}>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <MailPlus size={18} className="text-indigo-600" />
                <span>Compose new ticket</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-3">
                <input
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Subject"
                  className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={composePriority}
                  onChange={(e) => setComposePriority(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {['low', 'medium', 'high', 'critical'].map((level) => (
                    <option key={level} value={level}>
                      {PRIORITY_LABELS[level]}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                rows={10}
                placeholder="Describe how we can help..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loadingMessages}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
                >
                  {loadingMessages ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Submit ticket
                </button>
              </div>
            </form>
          ) : activeTicketId && currentTicket ? (
            <>
              <div className="p-5 border-b border-gray-100 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase text-gray-500">Subject</p>
                    <h2 className="text-xl font-semibold text-gray-900">{currentTicket.subject}</h2>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      STATUS_COLORS[currentTicket.status] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {currentTicket.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Tag size={12} /> {PRIORITY_LABELS[currentTicket.priority] || currentTicket.priority}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Inbox size={12} /> Ticket #{currentTicket.id}
                  </span>
                  {isStaff && (
                    <span className="inline-flex items-center gap-1">
                      <UserIcon size={12} /> {currentTicket.user_username || currentTicket.user_email}
                    </span>
                  )}
                  <span>{formatTimestamp(currentTicket.last_message_at)}</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.message_type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
                        msg.message_type === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-50 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs opacity-80 mb-1">
                        {msg.message_type === 'user' ? (
                          <>
                            <UserIcon size={12} />
                            <span>You</span>
                          </>
                        ) : msg.message_type === 'agent' ? (
                          <>
                            <Bot size={12} />
                            <span>Support team</span>
                          </>
                        ) : (
                          <>
                            <Bot size={12} />
                            <span>System</span>
                          </>
                        )}
                        <span>{formatTimestamp(msg.timestamp)}</span>
                      </div>
                      {msg.attachments ? (
                        isImageAttachment(msg.attachments) ? (
                          <a
                            href={resolveAttachmentUrl(msg.attachments)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block"
                          >
                            <img
                              src={resolveAttachmentUrl(msg.attachments)}
                              alt={msg.content || 'Attachment'}
                              className="max-h-64 rounded-xl border border-gray-200 object-contain"
                            />
                          </a>
                        ) : (
                          <a
                            href={resolveAttachmentUrl(msg.attachments)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-xs underline break-all"
                          >
                            <Paperclip size={12} />
                            <span>{msg.content || 'Attachment'}</span>
                          </a>
                        )
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      )}
                      {msg.is_read && msg.message_type === 'user' && (
                        <div className="mt-1 text-[11px] flex items-center gap-1 opacity-80">
                          <CheckCircle size={12} />
                          <span>Read by support</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loadingMessages && (
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Loading conversation...
                  </div>
                )}
                {!loadingMessages && messages.length === 0 && (
                  <div className="text-sm text-gray-500">
                    No messages yet. Start the conversation below.
                  </div>
                )}
              </div>
              <form onSubmit={handleSendReply} className="p-4 border-t border-gray-100">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => handleAttachmentUpload(e.target.files?.[0] || null)}
                    />
                    <button
                      type="button"
                      disabled={loadingMessages}
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      className="p-3 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                      title="Attach a file"
                    >
                      <Paperclip size={16} />
                    </button>
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={loadingMessages || !replyText.trim()}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 text-white font-semibold disabled:opacity-60"
                    >
                      <Send size={16} />
                      Send
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 text-gray-500">
              <MailPlus size={32} className="text-indigo-500 mb-3" />
              <p className="font-semibold">Select a ticket to read the conversation</p>
              <p className="text-sm">Or compose a new ticket from the inbox panel.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportChatPage;
