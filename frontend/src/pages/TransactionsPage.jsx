import React, { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Receipt } from 'lucide-react';

const TransactionsPage = ({ recentTransactions }) => {
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'income' | 'expense'
  const filtered = useMemo(() => {
    if (typeFilter === 'all') return recentTransactions;
    return recentTransactions.filter(t => t.type === typeFilter);
  }, [recentTransactions, typeFilter]);

  return (
  <div className="space-y-6">
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
          <p className="text-sm text-gray-500 mt-1">A summary of your recent income and expenses</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select value={typeFilter} onChange={(e)=>setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3.5 px-4 text-sm font-semibold text-gray-700">Date</th>
              <th className="text-left py-3.5 px-4 text-sm font-semibold text-gray-700">Description</th>
              <th className="text-left py-3.5 px-4 text-sm font-semibold text-gray-700">Type</th>
              <th className="text-right py-3.5 px-4 text-sm font-semibold text-gray-700">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="text-sm text-gray-900">{t.date}</div>
                  <div className="text-xs text-gray-500">{t.time}</div>
                </td>
                <td className="py-3.5 px-4 text-sm text-gray-900">{t.description}</td>
                <td className="py-3.5 px-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${t.type === 'income' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
                    {t.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {t.type === 'income' ? 'Income' : 'Expense'}
                  </span>
                </td>
                <td className={`py-3.5 px-4 text-right font-semibold tabular-nums ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'income' ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="md:hidden divide-y divide-gray-100">
        {filtered.map((t) => (
          <div key={t.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'income' ? 'bg-green-50 text-green-600 ring-1 ring-green-100' : 'bg-red-50 text-red-600 ring-1 ring-red-100'}`}>
                {t.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{t.description}</div>
                <div className="text-xs text-gray-500">{t.date} · {t.time}</div>
              </div>
            </div>
            <div className={`text-sm font-semibold tabular-nums ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
              {t.type === 'income' ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
};

export default TransactionsPage;
