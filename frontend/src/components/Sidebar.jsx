// components/Sidebar.jsx
import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Receipt,
  CreditCard,
  Settings,
  LogOut,
  Plus,
  Users,
  LifeBuoy,
  Shield,
  X,
  PiggyBank,
} from 'lucide-react';

const Sidebar = ({ currentPage, setCurrentPage, sidebarOpen, setSidebarOpen, userRole, onLogout }) => {
  const getNavItems = () => {
    const baseItems = [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { id: 'savings', icon: PiggyBank, label: 'Savings' },
      { id: 'transfer', icon: ArrowLeftRight, label: 'Transfer' },
      { id: 'transactions', icon: Receipt, label: 'Transactions' },
      { id: 'cards', icon: CreditCard, label: 'My Cards' },
      { id: 'order-card', icon: Plus, label: 'Order Card' },
      { id: 'support-chat', icon: LifeBuoy, label: 'Support Chat' }
    ];

    const adminNav = [
      { id: 'support-chat', icon: LifeBuoy, label: 'Support Chat' },
      { id: 'savings', icon: PiggyBank, label: 'Savings' },
      { id: 'users', icon: Users, label: 'User Management' },
      { id: 'roles', icon: Shield, label: 'Role Assignment' },
      { id: 'tickets', icon: LifeBuoy, label: 'Support Tickets' },
    ];

    const accountManagerNav = [
      { id: 'account-manager', icon: LayoutDashboard, label: 'Manager Desk' },
      { id: 'account-control', icon: CreditCard, label: 'Account Control' },
      { id: 'support-chat', icon: LifeBuoy, label: 'Support Inbox' },
      { id: 'tickets', icon: LifeBuoy, label: 'Ticket Board' },
    ];

    const supportItems = [
      { id: 'tickets', icon: LifeBuoy, label: 'Support Tickets' }
    ];

    if (userRole === 'admin') return adminNav;
    if (userRole === 'account_manager') return accountManagerNav;
    if (userRole === 'support') return [...baseItems, ...supportItems];
    return baseItems;
  };

  return (
    <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900 text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="flex flex-col h-full">
        {/* Logo + DiceBank text */}
        <div className="flex flex-col items-center py-8 border-b border-indigo-700">
          <img
            src="/src/assets/image1.png"
            alt="DiceBank logo"
            className="h-20 w-auto object-contain"
            onError={(e) => {
              e.target.src = '/logo.png';
            }}
          />
          <span className="mt-2 text-lg font-semibold text-white">DiceBank</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto text-[15px]">
          {userRole === 'admin' && (
            <div className="mb-3 px-3 py-1.5 rounded-lg bg-white/10 text-[11px] font-medium tracking-wide uppercase text-indigo-100">
              Admin workspace
            </div>
          )}
          {getNavItems().map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                  isActive
                    ? 'bg-white text-indigo-900 shadow-md border-indigo-100 font-semibold'
                    : 'border-transparent hover:bg-white/10 text-white/90'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-indigo-700 space-y-1.5">
          <button
            onClick={() => setCurrentPage('settings')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-white/10 text-white/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-red-500/20 text-red-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <LogOut size={20} />
            <span className="font-medium">Log out</span>
          </button>
        </div>

        {/* Close Button (Mobile) */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-6 right-4 text-white/80 hover:text-white"
          aria-label="Close menu"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
