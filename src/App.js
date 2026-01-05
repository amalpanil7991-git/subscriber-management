import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Users, DollarSign, MapPin } from 'lucide-react';

function App() {
  const [subscribers, setSubscribers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('all');
  const [filterFeeRange, setFilterFeeRange] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    area: '',
    address: '',
    monthlyFee: '',
    connectionDate: '',
    status: 'active'
  });

// Load data from localStorage on mount
useEffect(() => {
  const saved = localStorage.getItem('subscribers');
  if (saved) {
    setSubscribers(JSON.parse(saved));
  } else {
    // Sample data for first-time users
    const sampleData = [
      { id: 1, name: 'Rajesh Kumar', phone: '9876543210', area: 'Sector A', address: 'House 101', monthlyFee: 500, connectionDate: '2024-01-15', status: 'active' },
      { id: 2, name: 'Priya RS', phone: '9876543211', area: 'Sector B', address: 'Flat 202', monthlyFee: 750, connectionDate: '2024-02-20', status: 'active' },
      { id: 3, name: 'Amir Khan', phone: '9876543212', area: 'Sector A', address: 'House 305', monthlyFee: 1000, connectionDate: '2024-03-10', status: 'inactive' },
    ];
    setSubscribers(sampleData);
    localStorage.setItem('subscribers', JSON.stringify(sampleData));
  }
}, []);

// Save to localStorage whenever subscribers change
useEffect(() => {
  if (subscribers.length > 0) {
    localStorage.setItem('subscribers', JSON.stringify(subscribers));
  }
}, [subscribers]);

  const areas = ['all', ...new Set(subscribers.map(s => s.area))];

  const handleSubmit = () => {
    if (!formData.name || !formData.phone || !formData.area || !formData.address || !formData.monthlyFee || !formData.connectionDate) {
      alert('Please fill all required fields');
      return;
    }

    if (editingId) {
      setSubscribers(subscribers.map(s =>
        s.id === editingId ? { ...formData, id: editingId } : s
      ));
      setEditingId(null);
    } else {
      const newSubscriber = {
        ...formData,
        id: Date.now(),
        monthlyFee: parseFloat(formData.monthlyFee)
      };
      setSubscribers([...subscribers, newSubscriber]);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      area: '',
      address: '',
      monthlyFee: '',
      connectionDate: '',
      status: 'active'
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (subscriber) => {
    setFormData(subscriber);
    setEditingId(subscriber.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this subscriber?')) {
      setSubscribers(subscribers.filter(s => s.id !== id));
    }
  };

  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.phone.includes(searchTerm) ||
                         sub.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = filterArea === 'all' || sub.area === filterArea;
    const matchesFee = filterFeeRange === 'all' ||
                       (filterFeeRange === 'low' && sub.monthlyFee < 600) ||
                       (filterFeeRange === 'medium' && sub.monthlyFee >= 600 && sub.monthlyFee < 900) ||
                       (filterFeeRange === 'high' && sub.monthlyFee >= 900);
    return matchesSearch && matchesArea && matchesFee;
  });

  const stats = {
    total: subscribers.length,
    active: subscribers.filter(s => s.status === 'active').length,
    totalRevenue: subscribers.filter(s => s.status === 'active').reduce((sum, s) => sum + s.monthlyFee, 0)
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Broadband Business</h1>
          <p className="text-gray-600">Manage your local area broadband customers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Subscribers</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <Users className="text-blue-500" size={40} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Subscribers</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Users className="text-green-500" size={40} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Monthly Revenue</p>
                <p className="text-3xl font-bold text-purple-600">₹{stats.totalRevenue}</p>
              </div>
              <DollarSign className="text-purple-500" size={40} />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, phone, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <select
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {areas.map(area => (
                  <option key={area} value={area}>
                    {area === 'all' ? 'All Areas' : area}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterFeeRange}
                onChange={(e) => setFilterFeeRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Plans</option>
                <option value="low">Budget (&lt; ₹600)</option>
                <option value="medium">Standard (₹600-900)</option>
                <option value="high">Premium (₹900+)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Add Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Add New Subscriber
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingId ? 'Edit Subscriber' : 'Add New Subscriber'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area *</label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData({...formData, area: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Fee (₹) *</label>
                <input
                  type="number"
                  value={formData.monthlyFee}
                  onChange={(e) => setFormData({...formData, monthlyFee: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Connection Date *</label>
                <input
                  type="date"
                  value={formData.connectionDate}
                  onChange={(e) => setFormData({...formData, connectionDate: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {editingId ? 'Update' : 'Add'} Subscriber
              </button>
              <button
                onClick={resetForm}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Subscribers List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Fee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubscribers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No subscribers found. Add your first subscriber to get started!
                    </td>
                  </tr>
                ) : (
                  filteredSubscribers.map(subscriber => (
                    <tr key={subscriber.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{subscriber.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{subscriber.phone}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400" />
                          {subscriber.area}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{subscriber.address}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{subscriber.monthlyFee}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          subscriber.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {subscriber.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(subscriber)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(subscriber.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          Showing {filteredSubscribers.length} of {subscribers.length} subscribers
        </div>
      </div>
    </div>
  );
}

export default App;