import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Users, IndianRupee, MapPin } from 'lucide-react';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx';

function App() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
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
  monthly_fee: '',
  connection_date: '',
  service_provider: '',
  status: 'active'
});


  // Load subscribers from Supabase
  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscribers(data || []);
    } catch (error) {
      console.error('Error fetching subscribers:', error.message);
      alert('Error loading subscribers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const areas = ['all', ...new Set(subscribers.map(s => s.area))];

  const handleSubmit = async () => {
// Basic required field validation
if (
  !formData.name ||
  !formData.phone ||
  !formData.area ||
  !formData.address ||
  !formData.monthly_fee ||
  !formData.connection_date
) {
  alert('Please fill all required fields');
  return;
}

// ✅ 10-digit mobile number validation
const phoneRegex = /^[0-9]{10}$/;
if (!phoneRegex.test(formData.phone)) {
  alert('Mobile number must be exactly 10 digits');
  return;
}
if (!formData.service_provider) {
  alert('Please select a service provider');
  return;
}
    try {
      if (editingId) {
        // Update existing subscriber
        const { error } = await supabase
          .from('subscribers')
          .update({
            ...formData,
            monthly_fee: parseFloat(formData.monthly_fee),
            last_edited_at: new Date().toISOString(),
            last_edited_by: 'user@example.com' // TODO: Replace with actual user email
          })
          .eq('id', editingId);

        if (error) throw error;
        alert('Subscriber updated successfully!');
      } else {
        // Add new subscriber
        const { error } = await supabase
          .from('subscribers')
          .insert([{
            ...formData,
            monthly_fee: parseFloat(formData.monthly_fee),
            created_by: 'user@example.com' // TODO: Replace with actual user email
          }]);

        if (error) throw error;
        alert('Subscriber added successfully!');
      }

      fetchSubscribers();
      resetForm();
    } catch (error) {
      console.error('Error saving subscriber:', error.message);
      alert('Error saving subscriber: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      area: '',
      address: '',
      monthly_fee: '',
      connection_date: '',
      status: 'active'
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (subscriber) => {
    setFormData({
      name: subscriber.name,
      phone: subscriber.phone,
      area: subscriber.area,
      address: subscriber.address,
      monthly_fee: subscriber.monthly_fee,
      connection_date: subscriber.connection_date,
      status: subscriber.status
    });
    setEditingId(subscriber.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscriber?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('subscribers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Subscriber deleted successfully!');
      fetchSubscribers();
    } catch (error) {
      console.error('Error deleting subscriber:', error.message);
      alert('Error deleting subscriber: ' + error.message);
    }
  };

const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      // Parse Excel file
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log('📊 Parsed Excel data:', jsonData);

      // Transform and validate data
      const subscribers = jsonData.map((row, index) => {
        // Support different column name formats (case-insensitive)
        const name = row.Name || row.name || row.NAME || '';
        const phone = String(row.Phone || row.phone || row.PHONE || '');
        const area = row.Area || row.area || row.AREA || '';
        const address = row.Address || row.address || row.ADDRESS || '';
        const monthly_fee = parseFloat(
          row['Monthly Fee'] ||
          row.monthly_fee ||
          row.MONTHLY_FEE ||
          row.Fee ||
          row.fee ||
          0
        );
        const connection_date = row['Connection Date'] ||
                               row.connection_date ||
                               row.CONNECTION_DATE ||
                               row.Date ||
                               new Date().toISOString().split('T')[0];
        const status = (row.Status || row.status || row.STATUS || 'active').toLowerCase();

        // Validate required fields
        if (!name || !phone || !area || !address) {
          console.warn(`⚠️ Row ${index + 2} skipped: missing required fields`, row);
          return null;
        }

        return {
          name: name.trim(),
          phone: phone.trim(),
          area: area.trim(),
          address: address.trim(),
          monthly_fee,
          connection_date,
          status: status === 'active' || status === 'inactive' ? status : 'active',
          created_by: 'excel_import'
        };
      }).filter(Boolean); // Remove null entries

      if (subscribers.length === 0) {
        alert('❌ No valid data found in Excel file. Please check the format.');
        return;
      }

      console.log(`✅ Validated ${subscribers.length} subscribers for import`);

      // Insert into Supabase
      const { data, error } = await supabase
        .from('subscribers')
        .insert(subscribers);

      if (error) throw error;

      alert(`✅ Successfully imported ${subscribers.length} subscribers!`);
      fetchSubscribers(); // Refresh the list

      // Reset file input
      e.target.value = '';
    } catch (error) {
      console.error('❌ Error importing Excel:', error);
      alert('❌ Error importing Excel file: ' + error.message);
    }
  };

  reader.readAsArrayBuffer(file);
};
  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.phone.includes(searchTerm) ||
                         sub.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = filterArea === 'all' || sub.area === filterArea;
    const matchesFee = filterFeeRange === 'all' ||
                       (filterFeeRange === 'low' && sub.monthly_fee < 600) ||
                       (filterFeeRange === 'medium' && sub.monthly_fee >= 600 && sub.monthly_fee < 900) ||
                       (filterFeeRange === 'high' && sub.monthly_fee >= 900);
    return matchesSearch && matchesArea && matchesFee;
  });

  const stats = {
    total: subscribers.length,
    active: subscribers.filter(s => s.status === 'active').length,
    totalRevenue: subscribers.filter(s => s.status === 'active').reduce((sum, s) => sum + parseFloat(s.monthly_fee || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800 mb-2">Loading...</div>
          <div className="text-gray-600">Fetching subscriber data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Cable Subscriber Management</h1>
          <p className="text-gray-600">Manage your local area broadband customers - Powered by Think and Break Company</p>
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
                <p className="text-3xl font-bold text-purple-600">₹{stats.totalRevenue.toFixed(2)}</p>
              </div>
              <IndianRupee className="text-purple-500" size={40} />
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

{/* Add and Import Buttons */}
<div className="mb-6 flex gap-4 flex-wrap">
  <button
    onClick={() => setShowForm(!showForm)}
    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
  >
    <Plus size={20} />
    Add New Subscriber
  </button>

  <label className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors cursor-pointer">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
    Import from Excel
    <input
      type="file"
      accept=".xlsx,.xls"
      onChange={handleFileUpload}
      className="hidden"
    />
  </label>


    href="data:text/csv;charset=utf-8,Name,Phone,Area,Address,Monthly Fee,Connection Date,Status%0ARajesh Kumar,9876543210,Sector A,House 101,500,2024-01-15,active%0APriya Sharma,9876543211,Sector B,Flat 202,750,2024-02-20,active"
    download="subscriber_template.csv"
    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
    Download Template
  </a>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Provider *
                </label>
                <select
                  value={formData.service_provider}
                  onChange={(e) =>
                    setFormData({ ...formData, service_provider: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select provider</option>
                  <option value="Asianet">Asianet</option>
                  <option value="KCCL">KCCL</option>
                  <option value="BSNL">BSNL</option>
                  <option value="KFoN">KFoN</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Fee (₹) *</label>
                <input
                  type="number"
                  value={formData.monthly_fee}
                  onChange={(e) => setFormData({...formData, monthly_fee: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Connection Date *</label>
                <input
                  type="date"
                  value={formData.connection_date}
                  onChange={(e) => setFormData({...formData, connection_date: e.target.value})}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
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
                      <td className="px-6 py-4 text-sm text-gray-600"> {subscriber.service_provider}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{subscriber.monthly_fee}</td>
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