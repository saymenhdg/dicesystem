import React from 'react';

const SupportTicketsPage = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
      <div className="flex space-x-3">
        <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option>All Tickets</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Resolved</option>
        </select>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-yellow-500">
        <p className="text-sm text-gray-600 mb-2">Open Tickets</p>
        <p className="text-3xl font-bold text-gray-900">12</p>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
        <p className="text-sm text-gray-600 mb-2">In Progress</p>
        <p className="text-3xl font-bold text-gray-900">8</p>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
        <p className="text-sm text-gray-600 mb-2">Resolved Today</p>
        <p className="text-3xl font-bold text-gray-900">15</p>
      </div>
    </div>

    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <div className="space-y-4">
        {[
          { id: '#1234', user: 'John Doe', subject: 'Cannot transfer money', priority: 'High', status: 'Open', date: '2025-11-06' },
          { id: '#1235', user: 'Jane Smith', subject: 'Card activation issue', priority: 'Medium', status: 'In Progress', date: '2025-11-06' },
          { id: '#1236', user: 'Bob Wilson', subject: 'Account balance inquiry', priority: 'Low', status: 'Open', date: '2025-11-05' },
          { id: '#1237', user: 'Alice Brown', subject: 'Password reset request', priority: 'High', status: 'Resolved', date: '2025-11-05' }
        ].map((ticket, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-xl hover:border-indigo-300 transition-colors">
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="font-semibold text-gray-900">{ticket.id}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${ticket.priority === 'High' ? 'bg-red-100 text-red-700' : ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{ticket.priority}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${ticket.status === 'Open' ? 'bg-yellow-100 text-yellow-700' : ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{ticket.status}</span>
                </div>
                <p className="font-medium text-gray-900 mb-1">{ticket.subject}</p>
                <p className="text-sm text-gray-600">By {ticket.user} • {ticket.date}</p>
              </div>
              <div className="flex space-x-2">
                <button className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">View Details</button>
                <button className="px-4 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors" onClick={() => alert(`Ticket ${ticket.id} marked as resolved (demo)`)}>Resolve</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default SupportTicketsPage;
