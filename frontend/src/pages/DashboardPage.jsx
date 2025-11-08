import React, { useMemo, useState } from 'react';
import { DollarSign, ArrowDownRight, ArrowUpRight, Target } from 'lucide-react';

const DashboardPage = ({ userData, recentTransactions, spendingData, quickContacts }) => {
  const series = [4200, 3800, 4500, 3200, 4800, 3600, 5200];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [chartMode, setChartMode] = useState('Income vs Expense');
  const maxValue = 5500;
  const maxBarHeight = 320; // px

  // Simple demo balance trend: start at base and add (income - expense) per day
  const balanceBase = 12000;
  const balanceSeries = useMemo(() => {
    let acc = balanceBase;
    const vals = [];
    for (let i = 0; i < series.length; i++) {
      const income = series[i];
      const expense = Math.max(0, series[i] - 1000);
      acc += income - expense;
      vals.push(acc);
    }
    return vals;
  }, [series]);
  const balanceMax = Math.max(...balanceSeries) * 1.05;
  const balanceMin = Math.min(...balanceSeries) * 0.95;

  return (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-indigo-200 text-sm mb-1">Total Balance</p>
            <h2 className="text-4xl font-bold">
              ${userData.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h2>
          </div>
          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
            <DollarSign size={24} />
          </div>
        </div>
        <div className="flex space-x-6 mt-6">
          <div className="flex items-center space-x-2">
            <div className="bg-green-400 p-1 rounded">
              <ArrowDownRight size={16} />
            </div>
            <div>
              <p className="text-xs text-indigo-200">Income</p>
              <p className="font-semibold">${userData.income.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-red-400 p-1 rounded">
              <ArrowUpRight size={16} />
            </div>
            <div>
              <p className="text-xs text-indigo-200">Expense</p>
              <p className="font-semibold">${userData.expense.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-gray-600 text-sm mb-1">Total Savings</p>
            <h2 className="text-4xl font-bold text-gray-900">
              ${userData.savings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h2>
          </div>
          <div className="bg-green-100 p-3 rounded-xl">
            <Target size={24} className="text-green-600" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Progress</span>
            <span className="font-semibold text-green-600">+12.5%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full" style={{ width: '65%' }}></div>
          </div>
        </div>
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
            {[0,1,2,3,4].map((i) => (
              <div key={i} className="w-full border-t border-dashed border-gray-200"></div>
            ))}
          </div>
          <div className="relative flex items-end justify-between gap-4 px-1">
            {series.map((value, index) => {
              const incomeVal = value;
              const expenseVal = Math.max(0, value - 1000);
              const incomeHeight = (incomeVal / maxValue) * maxBarHeight;
              const expenseHeight = (expenseVal / maxValue) * maxBarHeight;
              const day = days[index];
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="relative w-full flex items-end justify-center gap-2">
                    <div className="relative flex flex-col items-center" style={{ width: '42%' }}>
                      <div
                        title={`Income: $${incomeVal.toLocaleString()}`}
                        className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-md shadow-sm transition-all duration-300 hover:opacity-90"
                        style={{ height: `${Math.max(0, incomeHeight)}px` }}
                      />
                      <span className="mt-2 text-[11px] text-gray-700 font-medium">${incomeVal.toLocaleString()}</span>
                    </div>
                    <div className="relative flex flex-col items-center" style={{ width: '42%' }}>
                      <div
                        title={`Expense: $${expenseVal.toLocaleString()}`}
                        className="w-full bg-gradient-to-t from-red-600 to-red-400 rounded-md shadow-sm transition-all duration-300 hover:opacity-90"
                        style={{ height: `${Math.max(0, expenseHeight)}px` }}
                      />
                      <span className="mt-2 text-[11px] text-gray-700 font-medium">${expenseVal.toLocaleString()}</span>
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
            {[0,1,2,3,4].map((i) => (
              <div key={i} className="w-full border-t border-dashed border-gray-200"></div>
            ))}
          </div>
          <div className="absolute inset-0">
            {(() => {
              const w = 100; // percentage width
              const h = maxBarHeight; // px
              const points = balanceSeries.map((v, i) => {
                const x = (i / (balanceSeries.length - 1)) * w;
                const y = ((1 - (v - balanceMin) / (balanceMax - balanceMin)) * h);
                return `${x},${y}`;
              }).join(' ');
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
            {days.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="absolute inset-0 flex items-end justify-between px-1">
            {balanceSeries.map((v, i) => (
              <div key={i} className="relative group" style={{ width: '12%' }}>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-[11px] px-2 py-1 rounded shadow-lg">
                  ${v.toLocaleString()}
                </div>
                <div className="w-px h-3 bg-indigo-300/0 group-hover:bg-indigo-400/50 transition-colors"></div>
              </div>
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
          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View All</button>
        </div>
        <div className="space-y-4">
          {recentTransactions.slice(0, 5).map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
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
              <span className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {transaction.type === 'income' ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Savings Goals</h3>
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-gray-900">Summer Vacations</span>
              <span className="text-sm font-bold text-indigo-600">75%</span>
            </div>
            <div className="w-full bg-white rounded-full h-2 mb-2">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">$7,500 of $10,000</span>
              <span className="text-indigo-600 font-medium">$2,500 left</span>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-gray-900">Emergency Fund</span>
              <span className="text-sm font-bold text-green-600">45%</span>
            </div>
            <div className="w-full bg-white rounded-full h-2 mb-2">
              <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">$4,500 of $10,000</span>
              <span className="text-green-600 font-medium">$5,500 left</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Spending Overview</h3>
        <div className="space-y-4">
          {spendingData.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">{item.category}</span>
                <span className="text-sm font-bold text-gray-900">{item.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`${item.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${item.percentage}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Transfer</h3>
      <div className="flex flex-wrap gap-4">
        {quickContacts.map((contact) => (
          <button key={contact.id} className="flex flex-col items-center space-y-2 p-4 hover:bg-gray-50 rounded-xl transition-all group">
            <div className={`w-16 h-16 ${contact.color} rounded-full flex items-center justify-center text-white text-xl font-bold group-hover:scale-110 transition-transform`}>
              {contact.avatar}
            </div>
            <span className="text-sm font-medium text-gray-700">{contact.name}</span>
          </button>
        ))}
        <button className="flex flex-col items-center space-y-2 p-4 hover:bg-gray-50 rounded-xl transition-all group">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center group-hover:bg-gray-300 transition-colors">
            <span className="text-gray-600 text-xl font-bold">+</span>
          </div>
          <span className="text-sm font-medium text-gray-700">Add New</span>
        </button>
      </div>
    </div>
  </div>
  );
};

export default DashboardPage;
