import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Users,
  IndianRupee,
  MapPin
} from 'lucide-react';
import { supabase } from './supabaseClient';

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
      alert('Error loading subscribers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const areas = ['all', ...new Set(subscribers.map(s => s.area))];

  const handleSubmit = async () => {
    // Required fields
    if (
      !formData.name ||
      !formData.phone ||
      !formData.area ||
      !formData.address ||
      !formData.monthly_fee ||
      !formData.connection_date ||
      !formData.service_provider
    ) {
      alert('Please fill all required fields');
      return;
    }

    // ✅ 10-digit mobile validation
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      alert('Mobile number must be exactly 10 digits');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('subscribers')
          .update({
            ...formData,
            monthly_fee: parseFloat(formData.monthly_fee),
            last_edited_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (error) throw error;
        alert('Subscriber updated successfully');
      } else {
        const { error } = await supabase
          .from('subscribers')
          .insert([
            {
              ...formData,
              monthly_fee: parseFloat(formData.monthly_fee)
            }
          ]);

        if (error) throw error;
        alert('Subscriber added successfully');
      }

      fetchSubscribers();
      resetForm();
    } catch (error) {
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
      service_provider: '',
      status: 'active'
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (subscriber) => {
    setFormData({ ...subscriber });
    setEditingId(subscriber.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscriber?')) return;

    const { error } = await supabase
      .from('subscribers')
      .delete()
      .eq('id', id);

    if (!error) fetchSubscribers();
  };

  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch =
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.phone.includes(searchTerm) ||
      sub.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArea = filterArea === 'all' || sub.area === filterArea;

    const matchesFee =
      filterFeeRange === 'all' ||
      (filterFeeRange === 'low' && sub.monthly_fee < 600) ||
      (filterFeeRange === 'medium' && sub.monthly_fee >= 600 && sub.monthly_fee < 900) ||
      (filterFeeRange === 'high' && sub.monthly_fee >= 900);

    return matchesSearch && matchesArea && matchesFee;
  });

  const stats = {
    total: subscribers.length,
    active: subscribers.filter(s => s.status === 'active').length,
    totalRevenue: subscribers
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + Number(s.monthly_fee || 0), 0)
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Cable Subscriber Management</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <p>Total Subscribers</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p>Active Subscribers</p>
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow flex justify-between">
            <div>
              <p>Monthly Revenue</p>
              <p className="text-3xl font-bold text-purple-600">
                ₹{stats.totalRevenue.toFixed(2)}
              </p>
            </div>
            <IndianRupee size={40} className="text-purple-500" />
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-3 rounded mb-6 flex items-center gap-2"
        >
          <Plus size={18} /> Add Subscriber
        </button>

        {/* Form */}
        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Name" value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })} />
              <input placeholder="Phone" value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              <input placeholder="Area" value={formData.area}
                onChange={e => setFormData({ ...formData, area: e.target.value })} />
              <input placeholder="Address" value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })} />
              <input type="number" placeholder="Monthly Fee" value={formData.monthly_fee}
                onChange={e => setFormData({ ...formData, monthly_fee: e.target.value })} />
              <input type="date" value={formData.connection_date}
                onChange={e => setFormData({ ...formData, connection_date: e.target.value })} />

              <select
                value={formData.service_provider}
                onChange={e => setFormData({ ...formData, service_provider: e.target.value })}
              >
                <option value="">Select Provider</option>
                <option value="Asianet">Asianet</option>
                <option value="KCCL">KCCL</option>
                <option value="BSNL">BSNL</option>
                <option value="KFoN">KFoN</option>
              </select>
            </div>

            <div className="mt-4 flex gap-3">
              <button onClick={handleSubmit} className="bg-blue-600 text-white px-6 py-2 rounded">
                {editingId ? 'Update' : 'Add'}
              </button>
              <button onClick={resetForm} className="bg-gray-300 px-6 py-2 rounded">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Area</th>
                <th>Provider</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscribers.map(sub => (
                <tr key={sub.id}>
                  <td>{sub.name}</td>
                  <td>{sub.phone}</td>
                  <td>{sub.area}</td>
                  <td>{sub.service_provider}</td>
                  <td>₹{sub.monthly_fee}</td>
                  <td>{sub.status}</td>
                  <td>
                    <button onClick={() => handleEdit(sub)}><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(sub.id)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
