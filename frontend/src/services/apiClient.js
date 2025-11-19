const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:8000';

const TOKEN_STORAGE_KEY = 'dicebank.session';

const isBrowser = () => typeof window !== 'undefined';

export const getSessionToken = () => (isBrowser() ? localStorage.getItem(TOKEN_STORAGE_KEY) : null);

export const saveSessionToken = (token) => {
  if (isBrowser()) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
};

export const clearSessionToken = () => {
  if (isBrowser()) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

export async function apiFetch(path, options = {}) {
  const token = getSessionToken();
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(options.headers || {}),
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message = payload?.detail || response.statusText || 'Request failed';
    const error = new Error(message);
    error.detail = payload?.detail ?? payload;
    error.status = response.status;
    throw error;
  }

  return payload;
}

export const login = (credentials) =>
  apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

export const register = (payload) =>
  apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const logout = () =>
  apiFetch('/api/auth/logout', {
    method: 'POST',
  }).catch((err) => {
    
    console.warn('Logout request failed', err);
  });

export const me = () => apiFetch('/api/auth/me');

export const myAccount = () => apiFetch('/api/accounts/me');

export const myTransactions = (limit = 20, direction) => {
  const params = new URLSearchParams();
  if (limit) params.set('limit', String(limit));
  if (direction) params.set('direction', direction);
  const query = params.toString();
  return apiFetch(`/api/transactions${query ? `?${query}` : ''}`);
};

export const listContacts = () => apiFetch('/api/contacts');

export const listCards = () => apiFetch('/api/cards');

export const orderCard = (payload) =>
  apiFetch('/api/cards', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateCardStatus = (cardId, status) =>
  apiFetch(`/api/cards/${cardId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const searchUsers = (query) =>
  apiFetch(`/api/users/search?query=${encodeURIComponent(query)}`);

export const sendTransfer = (payload) =>
  apiFetch('/api/transactions/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const topUp = ({ amount, card_id }) =>
  apiFetch('/api/transactions/topup', {
    method: 'POST',
    body: JSON.stringify({ amount, card_id }),
  });

export const adminGetAccount = (userId) =>
  apiFetch(`/api/accounts/admin/${userId}`);

export const adminUpdateAccountBalance = (userId, balance) =>
  apiFetch(`/api/accounts/admin/${userId}/balance`, {
    method: 'PUT',
    body: JSON.stringify({ balance }),
  });

export const adminActivateAccount = (userId, active) =>
  apiFetch(`/api/accounts/${userId}/activate`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  });

export const adminListUserCards = (userId) =>
  apiFetch(`/api/cards/admin/${userId}`);

export const adminUpdateCardBalance = (cardId, balance) =>
  apiFetch(`/api/cards/admin/${cardId}/balance`, {
    method: 'PUT',
    body: JSON.stringify({ balance }),
  });

export const adminUpdateCardStatus = (cardId, status) =>
  apiFetch(`/api/cards/admin/${cardId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const adminListTransactions = (userId, limit = 20) => {
  const params = new URLSearchParams();
  params.set('user_id', String(userId));
  if (limit) params.set('limit', String(limit));
  return apiFetch(`/api/transactions/admin?${params.toString()}`);
};

export const updateProfile = (payload) =>
  apiFetch('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const uploadAvatar = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch('/api/users/me/avatar', {
    method: 'POST',
    body: formData,
  });
};

export const listAdminUsers = () => apiFetch('/api/auth/admin/users');

export const updateUserStatusAdmin = (userId, isActive) =>
  apiFetch(`/api/auth/admin/users/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ is_active: isActive }),
  });

export const updateUserRoleAdmin = (userId, role) =>
  apiFetch(`/api/auth/admin/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });

export const listRecipients = () => apiFetch('/api/recipients');

export const addRecipient = (payload) =>
  apiFetch('/api/recipients', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateRecipient = (id, payload) =>
  apiFetch(`/api/recipients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const deleteRecipient = (id) =>
  apiFetch(`/api/recipients/${id}`, {
    method: 'DELETE',
  });

export const verifyRecipient = (lookup) =>
  apiFetch('/api/recipients/verify', {
    method: 'POST',
    body: JSON.stringify({ lookup }),
  });

export const listSavingsGoals = () => apiFetch('/api/savings-goals');

export const createSavingsGoal = (payload) =>
  apiFetch('/api/savings-goals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateSavingsGoal = (id, payload) =>
  apiFetch(`/api/savings-goals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const deleteSavingsGoal = (id) =>
  apiFetch(`/api/savings-goals/${id}`, {
    method: 'DELETE',
  });

export const depositSavingsGoal = (id, amount) =>
  apiFetch(`/api/savings-goals/${id}/deposit`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });

export const withdrawSavingsGoal = (id, amount) =>
  apiFetch(`/api/savings-goals/${id}/withdraw`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });

export const listSupportTickets = () => apiFetch('/api/support/tickets');

export const createSupportTicket = ({ subject, priority = 'medium', initialMessage }) =>
  apiFetch('/api/support/tickets', {
    method: 'POST',
    body: JSON.stringify({ subject, priority, initial_message: initialMessage }),
  });

export const getSupportMessages = (ticketId) =>
  apiFetch(`/api/support/tickets/${ticketId}/messages`);

export const sendSupportMessage = (ticketId, content) =>
  apiFetch('/api/support/messages', {
    method: 'POST',
    body: JSON.stringify({ ticket_id: ticketId, content }),
  });

export const uploadSupportAttachment = (ticketId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch(`/api/support/messages/${ticketId}/attachments`, {
    method: 'POST',
    body: formData,
  });
};

export const adminListSupportTickets = () => apiFetch('/api/support/admin/tickets');

export const adminUpdateSupportTicketStatus = (ticketId, status) =>
  apiFetch(`/api/support/admin/tickets/${ticketId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });

export const adminAssignSupportTicket = (ticketId, assignedToId) =>
  apiFetch(`/api/support/admin/tickets/${ticketId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ assigned_to_id: assignedToId }),
  });
