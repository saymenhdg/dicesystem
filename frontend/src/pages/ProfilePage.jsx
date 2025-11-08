import React from 'react';

const ProfilePage = ({ userData, recentTransactions = [] }) => {
  const initials = (userData.name || '')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const downloadStatement = () => {
    const rows = [
      ['Date', 'Time', 'Description', 'Type', 'Amount'],
      ...recentTransactions.map((t) => [t.date, t.time || '', t.description, t.type, String(t.amount)])
    ];
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'statement.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareProfile = async () => {
    const profileText = `DiceBank Profile\nName: ${userData.name}\nUsername: @${userData.username}\nEmail: ${userData.email}\nPhone: ${userData.phoneNumber}\nLocation: ${userData.city}, ${userData.country}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'DiceBank Profile', text: profileText });
        return;
      }
    } catch (_) {}
    try {
      await navigator.clipboard.writeText(profileText);
      alert('Profile info copied to clipboard.');
    } catch (e) {
      const blob = new Blob([profileText], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'profile.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-lg">
            {userData.avatar ? (
              <img src={userData.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <p className="text-xl font-semibold text-gray-900">{userData.name}</p>
            <p className="text-sm text-gray-600">@{userData.username}</p>
          </div>
        </div>
        <img src="/logo.png" alt="DiceBank" className="w-10 h-10 object-contain hidden sm:block" />
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">First Name</p>
            <p className="mt-1 font-medium text-gray-900">{userData.firstName || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Last Name</p>
            <p className="mt-1 font-medium text-gray-900">{userData.lastName || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="mt-1 font-medium text-gray-900">{userData.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="mt-1 font-medium text-gray-900">{userData.phoneNumber || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Country</p>
            <p className="mt-1 font-medium text-gray-900">{userData.country || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">City</p>
            <p className="mt-1 font-medium text-gray-900">{userData.city || '-'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={downloadStatement} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">Download statement</button>
          <button type="button" onClick={shareProfile} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">Share profile</button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
