import React from 'react';

const AccountsPage = ({ userData }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-6">My Accounts</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border-2 border-indigo-200 bg-indigo-50 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-indigo-600 font-medium mb-1">Primary Account</p>
              <p className="text-xs text-gray-500">Account: ****8901</p>
            </div>
            <div className="bg-indigo-600 px-3 py-1 rounded-full">
              <p className="text-xs text-white font-semibold">Active</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">${userData.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-sm text-gray-600">Available Balance</p>
        </div>

        <div className="p-6 border-2 border-green-200 bg-green-50 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-green-600 font-medium mb-1">Savings Account</p>
              <p className="text-xs text-gray-500">Account: ****7654</p>
            </div>
            <div className="bg-green-600 px-3 py-1 rounded-full">
              <p className="text-xs text-white font-semibold">Active</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">${userData.savings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-sm text-gray-600">Savings Balance</p>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Account Activity</h3>
      <div className="space-y-3">
        {[
          { action: 'Transfer to Savings', amount: 500, date: '2025-11-06', type: 'transfer' },
          { action: 'ATM Withdrawal', amount: -200, date: '2025-11-05', type: 'withdrawal' },
          { action: 'Direct Deposit', amount: 3500, date: '2025-11-01', type: 'deposit' }
        ].map((activity, index) => (
          <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
            <div>
              <p className="font-medium text-gray-900">{activity.action}</p>
              <p className="text-sm text-gray-500">{activity.date}</p>
            </div>
            <p className={`font-semibold ${activity.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {activity.amount > 0 ? '+' : ''}${Math.abs(activity.amount).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default AccountsPage;
