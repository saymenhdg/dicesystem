// pages/MyCardsPage.jsx
import React from 'react';
import { Eye, EyeOff, Plus, Copy, Check, Shield, DollarSign, Wifi } from 'lucide-react';
import BankCard from '../components/BankCard';

const statusChipStyles = {
  Active: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  Frozen: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Canceled: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200',
};

const MyCardsPage = ({
  userCards,
  showCardDetails,
  toggleCardVisibility,
  copyToClipboard,
  copiedField,
  onNavigateOrder,
  onFreezeCard,
  onCancelCard,
}) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Cards</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your physical and virtual cards</p>
      </div>
      <button
        onClick={onNavigateOrder}
        className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg"
      >
        <Plus size={20} />
        <span>Order New Card</span>
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {userCards.map((card) => (
        <div key={card.id} className="space-y-5">
          <div className="transform transition-transform hover:scale-[1.02]">
            <BankCard card={card} showDetails={showCardDetails[card.id]} />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">{card.type} Card</span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  statusChipStyles[card.status] || statusChipStyles.Active
                }`}
              >
                {card.status}
              </span>
            </div>

            <div className="text-xs text-gray-500">
              {card.holder} - Expires {card.expiry}
            </div>

            <button
              onClick={() => toggleCardVisibility(card.id)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors border border-gray-200"
            >
              <span className="text-sm font-medium text-gray-700">
                {showCardDetails[card.id] ? 'Hide' : 'Show'} Card Details
              </span>
              {showCardDetails[card.id] ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>

            {showCardDetails[card.id] && (
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
                  <span className="text-xs text-gray-600">Card Number</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono tracking-wider">{card.number}</span>
                    <button
                      onClick={() => copyToClipboard(card.number.replace(/\s/g, ''), `number-${card.id}`)}
                      className="text-gray-400 hover:text-indigo-600 transition"
                      aria-label="Copy card number"
                    >
                      {copiedField === `number-${card.id}` ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
                  <span className="text-xs text-gray-600">CVV</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono">{card.cvv}</span>
                    <button
                      onClick={() => copyToClipboard(card.cvv, `cvv-${card.id}`)}
                      className="text-gray-400 hover:text-indigo-600 transition"
                      aria-label="Copy CVV"
                    >
                      {copiedField === `cvv-${card.id}` ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-3 border-t border-gray-200">
              <button
                className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm ring-1 ring-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all disabled:opacity-50"
                onClick={() => {
                  if (!onFreezeCard) return;
                  const nextStatus = card.status === 'Frozen' ? 'active' : 'frozen';
                  onFreezeCard(card.id, nextStatus);
                }}
              >
                {card.status === 'Frozen' ? 'Unfreeze' : 'Freeze'} Card
              </button>
              <button
                className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm ring-1 ring-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => onCancelCard && onCancelCard(card.id, 'canceled')}
                disabled={card.status === 'Canceled'}
              >
                {card.status === 'Canceled' ? 'Canceled' : 'Cancel Card'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>

    <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Card Benefits</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
          <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center mb-4 shadow-md">
            <Shield className="text-white" size={28} />
          </div>
          <h4 className="font-bold text-gray-900 mb-2">Fraud Protection</h4>
          <p className="text-sm text-gray-600">24/7 monitoring and instant alerts for suspicious activity</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
          <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center mb-4 shadow-md">
            <DollarSign className="text-white" size={28} />
          </div>
          <h4 className="font-bold text-gray-900 mb-2">Cashback Rewards</h4>
          <p className="text-sm text-gray-600">Earn 2% cashback on all purchases worldwide</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
          <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center mb-4 shadow-md">
            <Wifi className="text-white" size={28} />
          </div>
          <h4 className="font-bold text-gray-900 mb-2">Contactless Payment</h4>
          <p className="text-sm text-gray-600">Fast and secure tap-to-pay technology</p>
        </div>
      </div>
    </div>
  </div>
);

export default MyCardsPage;
