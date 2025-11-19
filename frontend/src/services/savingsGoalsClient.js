import { apiFetch } from './apiClientCore';

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
