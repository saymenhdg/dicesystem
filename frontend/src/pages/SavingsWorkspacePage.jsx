import React, { useEffect, useMemo, useState } from 'react';
import { PiggyBank, Target, Trash2, Plus, X } from 'lucide-react';
import {
  listSavingsGoals,
  createSavingsGoal,
  deleteSavingsGoal,
  depositSavingsGoal,
  withdrawSavingsGoal,
} from '../services/apiClient';

const SavingsWorkspacePage = ({ userData, pushNotification, onGoalsChanged }) => {
  const [goals, setGoals] = useState([]);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [goalsError, setGoalsError] = useState('');
  const [goalsInfo, setGoalsInfo] = useState('');
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalCurrent, setNewGoalCurrent] = useState('');
  const [goalActivities, setGoalActivities] = useState([]);
  const [transferModal, setTransferModal] = useState({ open: false, goal: null, mode: 'deposit' });
  const [transferAmount, setTransferAmount] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [goalFilter, setGoalFilter] = useState('all');

  const baseSavings = Number(userData?.savings ?? 0) || 0;
  const availableBalance = Number(userData?.balance ?? 0) || 0;

  const formatCurrency = (value) =>
    `$${Number(value || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const openTransferModal = (goal, mode) => {
    setGoalsError('');
    setTransferAmount('');
    setTransferModal({ open: true, goal, mode });
  };

  const closeTransferModal = () => {
    setTransferModal({ open: false, goal: null, mode: 'deposit' });
    setTransferAmount('');
    setTransferLoading(false);
    setGoalsError('');
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferModal.goal) return;
    const success = await performGoalTransfer(
      transferModal.goal.id,
      transferModal.mode,
      transferAmount
    );
    if (success) {
      closeTransferModal();
    }
  };

  const openAddGoalModal = () => {
    setGoalsError('');
    setShowAddGoalModal(true);
  };

  const closeAddGoalModal = () => {
    setShowAddGoalModal(false);
    setGoalsError('');
    setNewGoalName('');
    setNewGoalTarget('');
    setNewGoalCurrent('');
  };

  useEffect(() => {
    let cancelled = false;
    const loadGoals = async () => {
      setLoadingGoals(true);
      setGoalsError('');
      setGoalsInfo('');
      try {
        const data = await listSavingsGoals();
        if (cancelled || !Array.isArray(data)) return;
        setGoals(
          data.map((g) => ({
            id: g.id,
            name: g.name,
            target: Number(g.target_amount ?? 0),
            current: Number(g.current_amount ?? 0),
          }))
        );
      } catch (error) {
        setGoalsError(error?.detail || error?.message || 'Unable to load savings goals');
      } finally {
        if (!cancelled) {
          setLoadingGoals(false);
        }
      }
    };

    loadGoals();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const username = userData?.username || '';
    if (!username) return;
    const key = `dicebank.savings_goal_activity.${username}`;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setGoalActivities(parsed);
      }
    } catch {
      // ignore corrupt values
    }
  }, [userData?.username]);

  useEffect(() => {
    const username = userData?.username || '';
    if (!username) return;
    const key = `dicebank.savings_goal_activity.${username}`;
    try {
      window.localStorage.setItem(key, JSON.stringify(goalActivities));
    } catch {
      // ignore storage exceptions
    }
  }, [goalActivities, userData?.username]);

  const totalGoalCurrent = useMemo(
    () => goals.reduce((sum, goal) => sum + (Number(goal.current) || 0), 0),
    [goals]
  );

  const totalSavingsDisplay = baseSavings + totalGoalCurrent;
  const goalAllocationPercent = totalSavingsDisplay
    ? Math.min(100, Math.round((totalGoalCurrent / totalSavingsDisplay) * 100))
    : 0;

  const availableForGoals = Math.max(0, availableBalance - totalGoalCurrent);

  const getGoalStatus = (goal) => {
    const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
    if (progress >= 90) return { label: 'On track', tone: 'bg-emerald-50 text-emerald-700' };
    if (progress >= 50) return { label: 'In progress', tone: 'bg-blue-50 text-blue-700' };
    return { label: 'Needs boost', tone: 'bg-amber-50 text-amber-700' };
  };

  const filteredGoals = useMemo(() => {
    if (goalFilter === 'all') return goals;
    if (goalFilter === 'needs_boost') {
      return goals.filter((goal) => getGoalStatus(goal).label === 'Needs boost');
    }
    if (goalFilter === 'on_track') {
      return goals.filter((goal) => getGoalStatus(goal).label === 'On track');
    }
    return goals;
  }, [goals, goalFilter]);

  const performGoalTransfer = async (goalId, direction, amountValue) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return false;
    setGoalsError('');
    const raw = Number(amountValue);
    if (!Number.isFinite(raw) || raw <= 0) {
      setGoalsError('Enter a valid amount to move.');
      return false;
    }
    if (direction === 'deposit' && raw > availableBalance) {
      setGoalsError('Not enough available balance to move into savings.');
      return false;
    }
    if (direction === 'withdraw' && raw > goal.current) {
      setGoalsError('Cannot withdraw more than the goal currently holds.');
      return false;
    }

    setTransferLoading(true);
    try {
      const updated =
        direction === 'deposit'
          ? await depositSavingsGoal(goalId, raw)
          : await withdrawSavingsGoal(goalId, raw);
      const normalized = {
        id: updated.id,
        name: updated.name,
        target: Number(updated.target_amount ?? goal.target),
        current: Number(updated.current_amount ?? (direction === 'deposit' ? goal.current + raw : goal.current - raw)),
      };
      setGoals((prev) => prev.map((g) => (g.id === goalId ? normalized : g)));
      const note =
        direction === 'deposit'
          ? `Added $${raw.toFixed(2)} to "${goal.name}"`
          : `Withdrew $${raw.toFixed(2)} from "${goal.name}"`;
      setGoalActivities((prev) =>
        [
          {
            id: `goal-${goalId}-${Date.now()}`,
            description: note,
            amount: direction === 'deposit' ? raw : -raw,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev,
        ].slice(0, 12)
      );
      setGoalsInfo(note);
      if (typeof onGoalsChanged === 'function') {
        onGoalsChanged();
      }
      if (typeof pushNotification === 'function') {
        pushNotification(note);
      }
      return true;
    } catch (error) {
      setGoalsError(error?.detail || error?.message || 'Unable to move funds for this goal.');
      return false;
    } finally {
      setTransferLoading(false);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    setGoalsError('');
    const name = newGoalName.trim();
    const target = Number(newGoalTarget);
    const currentValue =
      newGoalCurrent === '' ? Number(userData?.balance ?? 0) : Number(newGoalCurrent);

    if (!name || !Number.isFinite(target) || target <= 0) {
      setGoalsError('Enter a goal name and a valid positive target.');
      return;
    }

    const current = Number.isFinite(currentValue) && currentValue >= 0 ? currentValue : 0;

    try {
      const created = await createSavingsGoal({
        name,
        target_amount: target,
        current_amount: current,
      });
      const normalized = {
        id: created.id,
        name: created.name,
        target: Number(created.target_amount ?? target),
        current: Number(created.current_amount ?? current),
      };
      setGoals((prev) => [...prev, normalized]);
      setGoalsInfo(`Added savings goal "${normalized.name}"`);
      setGoalActivities((prev) => [
        {
          id: `goal-${normalized.id}-${Date.now()}`,
          description: `Added savings goal "${normalized.name}"`,
          amount: normalized.current,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ].slice(0, 6));
      setNewGoalName('');
      setNewGoalTarget('');
      setNewGoalCurrent('');
      setShowAddGoalModal(false);
      if (typeof pushNotification === 'function') {
        pushNotification(`Added savings goal "${normalized.name}"`);
      }
      if (typeof onGoalsChanged === 'function') {
        await onGoalsChanged();
      }
    } catch (error) {
      setGoalsError(error?.detail || error?.message || 'Unable to save goal');
    }
  };

  const handleDeleteGoal = async (id) => {
    setGoalsError('');
    setGoalsInfo('');
    const toRemove = goals.find((g) => g.id === id);
    try {
      await deleteSavingsGoal(id);
      setGoals((prev) => prev.filter((goal) => goal.id !== id));
      if (toRemove) {
        setGoalsInfo(`Removed savings goal "${toRemove.name}"`);
        setGoalActivities((prev) => [
          {
            id: `goal-remove-${toRemove.id}-${Date.now()}`,
            description: `Removed savings goal "${toRemove.name}"`,
            amount: toRemove.current,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev,
        ].slice(0, 6));
        if (typeof pushNotification === 'function') {
          pushNotification(`Removed savings goal "${toRemove.name}"`);
        }
      }
      if (typeof onGoalsChanged === 'function') {
        await onGoalsChanged();
      }
    } catch (error) {
      setGoalsError(error?.detail || error?.message || 'Unable to delete goal');
    }
  };

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-6 pt-4 md:pt-6 px-4 lg:px-0">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">
            Savings workspace
          </p>
          <h1 className="text-2xl font-bold text-gray-900">Goals & Allocations</h1>
          <p className="text-sm text-gray-500">
            Monitor and fund your savings goals with a clean overview.
          </p>
        </div>
        <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
          <PiggyBank size={28} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total saved</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {`$${totalSavingsDisplay.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
          </p>
          <p className="text-sm text-gray-500 mt-1">Including your checking reserve.</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Allocated to goals</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {`$${totalGoalCurrent.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
          </p>
          <p className="text-sm text-gray-500 mt-1">{goalAllocationPercent}% of reserves</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Available to assign</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {`$${availableForGoals.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
          </p>
          <p className="text-sm text-gray-500 mt-1">From your DiceBank balance</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Active goals</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{goals.length}</p>
          <p className="text-sm text-gray-500 mt-1">Funnel your savings by priority.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Active goals</h2>
              <p className="text-sm text-gray-500">Track progress and add new goals below.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openAddGoalModal}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
              >
                <Plus size={14} />
                New goal
              </button>
              <div className="p-2 rounded-full bg-indigo-50 text-indigo-700">
                <Target size={20} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
            {[
              { id: 'all', label: 'All goals' },
              { id: 'needs_boost', label: 'Needs boost' },
              { id: 'on_track', label: 'On track' },
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setGoalFilter(filter.id)}
                className={`px-3 py-1 rounded-full border ${
                  goalFilter === filter.id
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {goalsError && (
            <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {goalsError}
            </div>
          )}
          {goalsInfo && !goalsError && (
            <div className="mb-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
              {goalsInfo}
            </div>
          )}
          {loadingGoals && !goals.length && !goalsError && (
            <p className="text-xs text-gray-400 mb-3">Loading your savings goals...</p>
          )}

          <div className="space-y-4">
            {filteredGoals.length === 0 ? (
              <p className="text-sm text-gray-500">
                {goals.length === 0
                  ? 'No savings goals yet. Start by creating your first one.'
                  : 'No goals match the selected filter.'}
              </p>
            ) : (
              filteredGoals.map((goal) => {
                const progress =
                  goal.target > 0
                    ? Math.max(0, Math.min(100, Math.round((goal.current / goal.target) * 100)))
                    : 0;
                const remaining = Math.max(0, goal.target - goal.current);
                const status = getGoalStatus(goal);
                return (
                  <div
                    key={goal.id}
                    className="p-5 rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-indigo-50 shadow-sm space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase text-gray-500">Goal</p>
                        <h3 className="text-lg font-semibold text-gray-900">{goal.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${status.tone}`}>
                          {status.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-xs text-red-500 hover:text-red-600 inline-flex items-center gap-1"
                        >
                          <Trash2 size={14} />
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-700">
                      <div>
                        <p className="text-xs uppercase text-gray-500">Target</p>
                        <p className="font-semibold">{formatCurrency(goal.target)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-500">Current</p>
                        <p className="font-semibold">{formatCurrency(goal.current)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-500">Remaining</p>
                        <p className="font-semibold">{formatCurrency(remaining)}</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-white rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span>{`Goal balance: ${formatCurrency(goal.current)}`}</span>
                        <span className="hidden sm:inline">·</span>
                        <span>{`Available cash: ${formatCurrency(availableBalance)}`}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openTransferModal(goal, 'deposit')}
                          className="px-4 py-2 rounded-2xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                        >
                          Add funds
                        </button>
                        <button
                          type="button"
                          onClick={() => openTransferModal(goal, 'withdraw')}
                          className="px-4 py-2 rounded-2xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                          disabled={goal.current <= 0}
                        >
                          Withdraw
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-gray-300 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Need another goal?</p>
              <p className="text-xs text-gray-500">
                Park savings for specific plans and fund them whenever you are ready.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddGoalModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
            >
              <Plus size={16} />
              Create savings goal
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Goal activity</h2>
            <span className="text-xs text-gray-500">
              Last {Math.min(goalActivities.length, 6)}
            </span>
          </div>
          {goalActivities.length === 0 ? (
            <p className="text-sm text-gray-500">
              Goal updates will appear here as you create, fund, or delete goals.
            </p>
          ) : (
            <div className="space-y-3">
              {goalActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50 border border-indigo-100"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                  {Number.isFinite(activity.amount) && (
                    <span className="font-semibold text-indigo-700">
                      {`$${Math.abs(activity.amount || 0).toFixed(2)}`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    {showAddGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeAddGoalModal} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">
                  New savings goal
                </p>
                <h3 className="text-xl font-bold text-gray-900">Create allocation</h3>
                <p className="text-sm text-gray-500">Name the goal and decide how much to start with.</p>
              </div>
              <button
                type="button"
                onClick={closeAddGoalModal}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close add goal modal"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddGoal} className="space-y-4">
              {goalsError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
                  {goalsError}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Goal name</label>
                <input
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  placeholder="e.g. Vacation, Emergency fund"
                  className="w-full px-3 py-2 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Target amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(e.target.value)}
                    placeholder="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Current saved</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newGoalCurrent}
                    onChange={(e) => setNewGoalCurrent(e.target.value)}
                    placeholder={availableBalance.toFixed(2)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAddGoalModal}
                  className="px-4 py-2 rounded-2xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
                >
                  Save goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    {transferModal.open && transferModal.goal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeTransferModal} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">
                  {transferModal.mode === 'deposit' ? 'Add to savings' : 'Withdraw from savings'}
                </p>
                <h3 className="text-xl font-bold text-gray-900">{transferModal.goal.name}</h3>
                <p className="text-sm text-gray-500">
                  Goal balance {formatCurrency(transferModal.goal.current)} · Available cash{' '}
                  {formatCurrency(availableBalance)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeTransferModal}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close transfer modal"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              {goalsError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
                  {goalsError}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Move amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeTransferModal}
                  className="px-4 py-2 rounded-2xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferLoading}
                  className="px-5 py-2 rounded-2xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
                >
                  {transferLoading ? 'Processing...' : transferModal.mode === 'deposit' ? 'Add funds' : 'Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SavingsWorkspacePage;
