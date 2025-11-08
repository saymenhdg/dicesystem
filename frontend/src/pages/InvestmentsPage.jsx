import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const InvestmentsPage = () => {
  const allocations = [
    { name: 'US Tech', pct: 38, color: 'bg-blue-600' },
    { name: 'Real Estate', pct: 27, color: 'bg-emerald-500' },
    { name: 'Bonds', pct: 20, color: 'bg-orange-500' },
    { name: 'Crypto', pct: 10, color: 'bg-purple-500' },
    { name: 'Cash', pct: 5, color: 'bg-gray-400' },
  ];
  const positions = [
    { symbol: 'AAPL', name: 'Apple Inc.', quantity: 40, price: 187.2, change: 1.4 },
    { symbol: 'MSFT', name: 'Microsoft', quantity: 25, price: 338.5, change: -0.8 },
    { symbol: 'VNQ', name: 'Vanguard REIT', quantity: 60, price: 85.1, change: 0.6 },
    { symbol: 'BND', name: 'Total Bond', quantity: 80, price: 75.9, change: 0.2 },
    { symbol: 'ETH', name: 'Ethereum', quantity: 2.5, price: 1840.0, change: 3.1 },
  ];
  const kpis = [
    { label: 'Portfolio Value', value: '$45,320.00', change: +1.8 },
    { label: 'Total Return', value: '+$8,450.00', change: +22.5 },
    { label: 'Cash Available', value: '$2,150.50', change: 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">{k.label}</p>
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{k.value}</h2>
              {k.change !== 0 && (
                <span className={`inline-flex items-center text-sm font-medium ${k.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {k.change > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  {k.change > 0 ? '+' : ''}{k.change}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Portfolio Allocation</h3>
          <div className="space-y-4">
            {allocations.map((a) => (
              <div key={a.name} className="">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{a.name}</span>
                  <span className="text-gray-600">{a.pct}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`${a.color} h-3`} style={{ width: `${a.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">30D Performance</h3>
          <div className="h-28">
            <svg viewBox="0 0 300 100" className="w-full h-full">
              <defs>
                <linearGradient id="perf" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,70 L20,65 L40,68 L60,60 L80,55 L100,62 L120,58 L140,64 L160,50 L180,48 L200,55 L220,52 L240,46 L260,44 L280,40 L300,42" fill="none" stroke="#4f46e5" strokeWidth="2" />
              <path d="M0,100 L0,70 L20,65 L40,68 L60,60 L80,55 L100,62 L120,58 L140,64 L160,50 L180,48 L200,55 L220,52 L240,46 L260,44 L280,40 L300,42 L300,100 Z" fill="url(#perf)" />
              <g>
                {[0,50,100,150,200,250,300].map((x) => (
                  <line key={x} x1={x} x2={x} y1={0} y2={100} stroke="#e5e7eb" strokeWidth="1" opacity="0.5" />
                ))}
              </g>
            </svg>
          </div>
          <p className="text-sm text-gray-600 mt-2">Simulated trend over last 30 days</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Positions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-6">Symbol</th>
                <th className="py-2 pr-6">Name</th>
                <th className="py-2 pr-6">Qty</th>
                <th className="py-2 pr-6">Price</th>
                <th className="py-2 pr-6">Change</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.symbol} className="border-t border-gray-100">
                  <td className="py-3 pr-6 font-semibold text-gray-900">{p.symbol}</td>
                  <td className="py-3 pr-6 text-gray-700">{p.name}</td>
                  <td className="py-3 pr-6 text-gray-900">{p.quantity}</td>
                  <td className="py-3 pr-6 text-gray-900">${p.price.toLocaleString()}</td>
                  <td className={`py-3 pr-6 font-medium ${p.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{p.change >= 0 ? '+' : ''}{p.change}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvestmentsPage;
