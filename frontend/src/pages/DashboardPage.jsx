import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, ArrowDownRight, ArrowUpRight, Wifi, CreditCard, X } from 'lucide-react';
import RecipientModal from '../components/RecipientModal';
import { addRecipient, verifyRecipient } from '../services/apiClient';

const SPENDING_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500'];

const DashboardPage = ({
  userData,
  recentTransactions,
  spendingData,
  quickContacts,
  userCards = [],
  pushNotification,
  onManageCards,
  onOrderCard,
  onTopUp,
}) => {
  const [chartMode, setChartMode] = useState('Income vs Expense');
  const maxBarHeight = 320;

  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [savingRecipient, setSavingRecipient] = useState(false);
  const [recipientModalError, setRecipientModalError] = useState('');

  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpCardId, setTopUpCardId] = useState(null);
  const [topUpError, setTopUpError] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  const { labels: chartDays, dailyIncome, dailyExpense, dailyNet } = useMemo(() => {
    const buckets = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const label = d.toLocaleDateString(undefined, { weekday: 'short' });
      const key = d.toDateString();
      buckets.push({ key, label, income: 0, expense: 0 });
    }
    const byKey = new Map(buckets.map((b) => [b.key, b]));
    if (Array.isArray(recentTransactions)) {
      for (const tx of recentTransactions) {
        if (!tx.timestamp) continue;
        const ts = new Date(tx.timestamp);
        const key = ts.toDateString();
        const bucket = byKey.get(key);
        if (!bucket) continue;
        const amount = Math.abs(Number(tx.amount ?? 0));
        if (tx.type === 'income') bucket.income += amount;
        else if (tx.type === 'expense') bucket.expense += amount;
      }
    }
    return {
      labels: buckets.map((b) => b.label),
      dailyIncome: buckets.map((b) => b.income),
      dailyExpense: buckets.map((b) => b.expense),
      dailyNet: buckets.map((b) => b.income - b.expense),
    };
  }, [recentTransactions]);

  const maxValue = useMemo(() => {
    const all = [...dailyIncome, ...dailyExpense];
    const max = all.length ? Math.max(...all) : 0;
    return max > 0 ? max : 1;
  }, [dailyIncome, dailyExpense]);

  const balanceSeries = useMemo(() => {
    const netPerDay = dailyNet;
    const len = netPerDay.length;
    if (!len) return [];
    let current = Number(userData?.balance ?? 0);
    const series = new Array(len);
    for (let i = len - 1; i >= 0; i--) {
      series[i] = current;
      current -= netPerDay[i];
    }
    return series;
  }, [dailyNet, userData?.balance]);

  const { balanceMin, balanceMax } = useMemo(() => {
    if (!balanceSeries.length) {
      return { balanceMin: 0, balanceMax: 0 };
    }
    const rawMax = Math.max(...balanceSeries);
    const rawMin = Math.min(...balanceSeries);
    if (rawMax === 0 && rawMin === 0) {
      return { balanceMin: -1, balanceMax: 1 };
    }

    let max = rawMax * 1.05;
    let min = rawMin * 0.95;
    if (max === min) {
      const pad = Math.abs(max) * 0.05 || 1;
      max += pad;
      min -= pad;
    }
    return { balanceMin: min, balanceMax: max };
  }, [balanceSeries]);

  const spendingBreakdown = useMemo(() => {
    if (!Array.isArray(recentTransactions) || !recentTransactions.length) return [];
    const expenseTx = recentTransactions.filter((t) => t.type === 'expense');
    if (!expenseTx.length) return [];
    let total = 0;
    const map = new Map();
    for (const t of expenseTx) {
      const amount = Math.abs(Number(t.amount ?? 0));
      total += amount;
      const key = (t.description || 'Other').trim() || 'Other';
      map.set(key, (map.get(key) || 0) + amount);
    }
    let items = Array.from(map.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }));
    items.sort((a, b) => b.amount - a.amount);
    items = items.slice(0, 4);
    const sumPct = items.reduce((sum, curr) => sum + curr.percentage, 0);
    if (items.length && sumPct !== 100) {
      items[items.length - 1].percentage += 100 - sumPct;
    }
    return items;
  }, [recentTransactions]);

  const spendingItems = spendingBreakdown.length ? spendingBreakdown : spendingData;

  const activeCards = useMemo(
    () => (Array.isArray(userCards) ? userCards.filter((c) => c.status === 'Active') : []),
    [userCards]
  );

  const cardsToDisplay = useMemo(
    () => (Array.isArray(userCards) ? userCards.slice(0, 4) : []),
    [userCards]
  );
  const canTopUp = activeCards.length > 0;

  const availableBalance = useMemo(
    () => Number(userData?.balance ?? 0),
    [userData?.balance]
  );

  const savingsBalance = useMemo(
    () => Number(userData?.savings ?? 0),
    [userData?.savings]
  );

  const weeklyIncome = useMemo(
    () => (Array.isArray(dailyIncome) ? dailyIncome.reduce((sum, value) => sum + value, 0) : 0),
    [dailyIncome]
  );

  const weeklyExpense = useMemo(
    () => (Array.isArray(dailyExpense) ? dailyExpense.reduce((sum, value) => sum + value, 0) : 0),
    [dailyExpense]
  );

  const weeklyNet = useMemo(() => weeklyIncome - weeklyExpense, [weeklyIncome, weeklyExpense]);

  useEffect(() => {
    if (!activeCards.length) {
      setTopUpCardId(null);
      return;
    }
    if (topUpCardId == null) {
      setTopUpCardId(activeCards[0].id);
    }
  }, [activeCards, topUpCardId]);

  const formatCurrency = (value) =>
    `$${Number(value ?? 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleSubmitTopUp = async (e) => {
    e.preventDefault();
    if (!onTopUp) return;
    setTopUpError('');
    const amountNum = Number(topUpAmount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setTopUpError('Enter a valid amount greater than 0');
      return;
    }
    const cardId = topUpCardId || (activeCards[0] && activeCards[0].id);
    if (!cardId) {
      setTopUpError('Select a card to top up from');
      return;
    }
    try {
      setTopUpLoading(true);
      await onTopUp({ amount: amountNum, cardId });
      setTopUpAmount('');
      setShowTopUpModal(false);
    } catch (error) {
      setTopUpError(error?.detail || error?.message || 'Unable to top up balance');
    } finally {
      setTopUpLoading(false);
    }
  };

  const handleAddRecipient = async ({ lookup, nickname, selectedUser }) => {
    const value = (
      lookup ||
      selectedUser?.username ||
      selectedUser?.email ||
      selectedUser?.phone_number ||
      ''
    ).trim();
    if (!value) {
      setRecipientModalError('Please enter a username, email, or phone');
      return;
    }
    setSavingRecipient(true);
    setRecipientModalError('');
    try {
      await verifyRecipient(value).catch(() => null);
      await addRecipient({ lookup: value, nickname: nickname?.trim() || undefined });
      setShowRecipientModal(false);
    } catch (error) {
      setRecipientModalError(error?.detail || error?.message || 'Unable to add recipient');
    } finally {
      setSavingRecipient(false);
    }
  };

  const handleOpenTopUp = (preferredCardId) => {
    if (preferredCardId) {
      setTopUpCardId(preferredCardId);
    } else if (!topUpCardId && activeCards[0]) {
      setTopUpCardId(activeCards[0].id);
    }
    setTopUpError('');
    setShowTopUpModal(true);
  };

  const handleCloseTopUp = () => {
    setShowTopUpModal(false);
    setTopUpError('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 space-y-6 pt-4 md:pt-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-8 text-white shadow-2xl">
          <div className="absolute inset-y-0 -right-10 w-64 bg-gradient-to-b from-white/20 to-transparent blur-3xl opacity-40 pointer-events-none" />
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-300">Welcome back</p>
              <h2 className="text-3xl font-semibold tracking-tight">
                {userData?.displayName || userData?.name || 'DiceBank Member'}
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs uppercase tracking-wide">
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-slate-200">
                Primary account
              </span>
              <span className="text-slate-300">Safe & up to date</span>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="rounded-2xl bg-white/10 border border-white/10 p-5 backdrop-blur">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-200">
                <span>Available balance</span>
                <span className="text-emerald-200 font-semibold">On hand</span>
              </div>
              <p className="mt-3 text-4xl font-semibold tracking-tight">
                {formatCurrency(availableBalance)}
              </p>
              <p className="text-xs text-slate-300 mt-2">After scheduled savings & holds.</p>
            </div>
            <div className="rounded-2xl bg-white text-slate-900 p-5 border border-white/60 shadow-2xl">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                <span>Savings balance</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    savingsBalance > 0 ? 'bg-slate-900 text-white' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {savingsBalance > 0 ? 'Auto-save on' : 'No goals yet'}
                </span>
              </div>
              <p className="mt-3 text-4xl font-semibold tracking-tight">
                {formatCurrency(savingsBalance)}
              </p>
              <p className="text-xs text-slate-500 mt-2">Locked inside your savings goals.</p>
            </div>
          </div>

          <div className="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-200">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-300">Weekly income</p>
                <p className="text-lg font-semibold">{formatCurrency(weeklyIncome)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-200 flex items-center justify-center">
                <ArrowDownRight size={18} />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-300">Weekly expense</p>
                <p className="text-lg font-semibold">{formatCurrency(weeklyExpense)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-200 flex items-center justify-center">
                <ArrowUpRight size={18} />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-300">Net flow</p>
                <p
                  className={`text-lg font-semibold ${
                    weeklyNet >= 0 ? 'text-emerald-200' : 'text-rose-200'
                  }`}
                >
                  {`${weeklyNet >= 0 ? '+' : '-'}`}{formatCurrency(Math.abs(weeklyNet))}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center">
                <DollarSign size={18} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Your cards</h3>
              <p className="text-xs text-gray-500">Personalize, manage, and fund from your wallet.</p>
            </div>
            <div className="flex items-center gap-2">
              {canTopUp && (
                <button
                  type="button"
                  onClick={() => handleOpenTopUp()}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <CreditCard size={14} />
                  Top up balance
                </button>
              )}
              <button
                type="button"
                onClick={onManageCards}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Manage
              </button>
            </div>
          </div>
          {cardsToDisplay.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {cardsToDisplay.map((card) => (
                <div
                  key={card.id}
                  className={`relative overflow-hidden rounded-2xl text-white shadow-lg bg-gradient-to-br ${
                    card.color || 'from-indigo-600 to-purple-600'
                  } p-4 min-h-[180px] flex flex-col gap-3`}
                >
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute top-4 right-4 text-white/70">
                    <Wifi size={18} />
                  </div>
                  <div className="relative flex items-center justify-between text-[10px] uppercase tracking-wide">
                    <span className="font-semibold">{card.type} card</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                        card.status === 'Active'
                          ? 'bg-white/25'
                          : card.status === 'Frozen'
                          ? 'bg-yellow-400/70 text-slate-900'
                          : 'bg-black/40'
                      }`}
                    >
                      {card.status}
                    </span>
                  </div>
                  <div className="relative">
                    <p className="text-[9px] text-white/80 uppercase tracking-wide">Available</p>
                    <p className="text-xl font-semibold tracking-tight">{formatCurrency(card.balance)}</p>
                  </div>
                  <div className="relative font-mono tracking-widest text-base">
                    {card.number || '---- ---- ---- ----'}
                  </div>
                  <div className="relative flex items-center justify-between text-[10px] uppercase tracking-wide">
                    <div>
                      <p className="text-white/70">Card holder</p>
                      <p className="font-semibold">{card.holder || userData.displayName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/70">Expires</p>
                      <p className="font-semibold">{card.expiry}</p>
                    </div>
                  </div>
                  {canTopUp && (
                    <button
                      type="button"
                      onClick={() => handleOpenTopUp(card.id)}
                      className="relative px-2 py-1 text-[10px] font-semibold uppercase tracking-wide border border-white/40 rounded-full hover:bg-white/10"
                    >
                      Use for top up
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              <p>No cards yet.</p>
              <button
                type="button"
                onClick={onOrderCard}
                className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                Order your first card
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">7-Day Statistics</h3>
            <select
              value={chartMode}
              onChange={(e) => setChartMode(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>Income vs Expense</option>
              <option>Balance Trend</option>
            </select>
          </div>
          {chartMode === 'Income vs Expense' ? (
            <div className="relative" style={{ minHeight: `${maxBarHeight + 40}px` }}>
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-full border-t border-dashed border-gray-200"></div>
                ))}
              </div>
              <div className="relative flex items-end justify-between gap-4 px-1">
                {chartDays.map((day, index) => {
                  const incomeVal = dailyIncome[index] || 0;
                  const expenseVal = dailyExpense[index] || 0;
                  const incomeHeight = (incomeVal / maxValue) * maxBarHeight;
                  const expenseHeight = (expenseVal / maxValue) * maxBarHeight;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center">
                      <div className="relative w-full flex items-end justify-center gap-2">
                        <div className="relative flex flex-col items-center" style={{ width: '42%' }}>
                          <div
                            title={`Income: $${incomeVal.toLocaleString()}`}
                            className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-md shadow-sm transition-all duration-300"
                            style={{ height: `${Math.max(0, incomeHeight)}px` }}
                          />
                          <span className="mt-2 text-[11px] text-gray-700 font-medium">
                            {`$${incomeVal.toLocaleString()}`}
                          </span>
                        </div>
                        <div className="relative flex flex-col items-center" style={{ width: '42%' }}>
                          <div
                            title={`Expense: $${expenseVal.toLocaleString()}`}
                            className="w-full bg-gradient-to-t from-red-600 to-red-400 rounded-md shadow-sm transition-all duration-300"
                            style={{ height: `${Math.max(0, expenseHeight)}px` }}
                          />
                          <span className="mt-2 text-[11px] text-gray-700 font-medium">
                            {`$${expenseVal.toLocaleString()}`}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 mt-2">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="relative" style={{ height: `${maxBarHeight + 40}px` }}>
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-full border-t border-dashed border-gray-200"></div>
                ))}
              </div>
              <div className="absolute inset-0">
                {(() => {
                  const w = 100;
                  const h = maxBarHeight;
                  const len = balanceSeries.length;
                  if (!len) {
                    return (
                      <svg
                        viewBox={`0 0 ${w} ${h}`}
                        preserveAspectRatio="none"
                        className="w-full h-full overflow-visible"
                      />
                    );
                  }

                  const range = balanceMax - balanceMin || 1;
                  const points = balanceSeries
                    .map((v, i) => {
                      const x = len === 1 ? w / 2 : (i / (len - 1)) * w;
                      const y = (1 - (v - balanceMin) / range) * h;
                      return `${x},${y}`;
                    })
                    .join(' ');
                  const areaPoints = `0,${h} ${points} ${w},${h}`;
                  return (
                    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="grad-balance" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>
                      <polyline points={points} fill="none" stroke="#4f46e5" strokeWidth="1.5" />
                      <polygon points={areaPoints} fill="url(#grad-balance)" />
                    </svg>
                  );
                })()}
              </div>
              <div className="absolute inset-x-0 bottom-0 flex justify-between text-xs text-gray-500 px-1">
                {chartDays.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
            </div>
          )}
          {chartMode === 'Income vs Expense' ? (
            <div className="flex justify-center space-x-6 mt-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-600 to-green-400 ring-1 ring-green-300/50"></div>
                <span className="text-sm text-gray-700">Income</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-600 to-red-400 ring-1 ring-red-300/50"></div>
                <span className="text-sm text-gray-700">Expense</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center space-x-6 mt-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 ring-1 ring-indigo-300/50"></div>
                <span className="text-sm text-gray-700">Balance</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {Array.isArray(recentTransactions) && recentTransactions.length > 0 ? (
              recentTransactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      {transaction.type === 'income' ? (
                        <ArrowDownRight className="text-green-600" size={18} />
                      ) : (
                        <ArrowUpRight className="text-red-600" size={18} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-xs text-gray-500">{transaction.time}</p>
                    </div>
                  </div>
                  <span
                    className={`font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {`${transaction.type === 'income' ? '+' : ''}$${Math.abs(transaction.amount).toFixed(2)}`}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No recent transactions yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Spending Overview</h3>
          <div className="space-y-4">
            {spendingItems.map((item, index) => (
              <div key={item.category}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">{item.category}</span>
                  <span className="text-sm font-bold text-gray-900">{item.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${
                      spendingBreakdown.length ? SPENDING_COLORS[index % SPENDING_COLORS.length] : item.color
                    } h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(0, Math.min(100, item.percentage || 0))}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900">Quick Transfer</h3>
            <p className="text-xs text-gray-500">Add new recipients from the modal below</p>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Tap “Add New” to search by username, email, phone number, or user ID. Saved contacts appear
            below for one-tap transfers.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {quickContacts.map((contact) => (
              <button
                key={contact.id}
                className="flex flex-col items-center space-y-2 p-4 hover:bg-gray-50 rounded-xl transition-all group"
              >
                <div
                  className={`w-16 h-16 ${contact.color} rounded-full flex items-center justify-center text-white text-xl font-bold group-hover:scale-110 transition-transform`}
                >
                  {contact.avatar}
                </div>
                <span className="text-sm font-medium text-gray-700">{contact.name}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setRecipientModalError('');
                setShowRecipientModal(true);
              }}
              className="flex flex-col items-center space-y-2 p-4 border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-gray-50 rounded-xl transition-all group"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <span className="text-gray-600 text-xl font-bold">+</span>
              </div>
              <span className="text-sm font-medium text-gray-700">Add New</span>
            </button>
          </div>
        </div>
      </div>

      <RecipientModal
        open={showRecipientModal}
        onClose={() => {
          if (!savingRecipient) {
            setShowRecipientModal(false);
            setRecipientModalError('');
          }
        }}
        onConfirm={handleAddRecipient}
        loading={savingRecipient}
        error={recipientModalError}
      />
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={handleCloseTopUp} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Top up your account</h3>
                <p className="text-xs text-gray-500">Choose a card and enter the amount to move.</p>
              </div>
              <button
                type="button"
                onClick={handleCloseTopUp}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            {canTopUp ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeCards.map((card) => (
                    <button
                      type="button"
                      key={card.id}
                      onClick={() => setTopUpCardId(card.id)}
                      className={`relative overflow-hidden rounded-2xl border ${
                        topUpCardId === card.id ? 'border-indigo-500 shadow-lg' : 'border-gray-200'
                      } bg-gradient-to-br ${card.color || 'from-indigo-600 to-purple-600'} text-white p-4 text-left`}
                    >
                      <div className="absolute inset-0 bg-black/10" />
                      <div className="relative flex items-center justify-between text-[10px] uppercase tracking-wide mb-2">
                        <span>{card.type} card</span>
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px]">
                          {card.status}
                        </span>
                      </div>
                      <p className="relative text-sm opacity-80">Available</p>
                      <p className="relative text-2xl font-semibold">{formatCurrency(card.balance)}</p>
                      <p className="relative font-mono tracking-widest text-base mt-2">
                        {card.number || '---- ---- ---- ----'}
                      </p>
                    </button>
                  ))}
                </div>
                <form onSubmit={handleSubmitTopUp} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Amount</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      placeholder="50.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  {topUpError && <p className="text-xs text-red-600">{topUpError}</p>}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCloseTopUp}
                      className="px-4 py-2 text-xs text-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={topUpLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {topUpLoading ? 'Processing...' : 'Apply top up'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <p className="text-sm text-gray-500">
                You need at least one active card to top up.{' '}
                <button
                  type="button"
                  onClick={onOrderCard}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Order a card
                </button>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
