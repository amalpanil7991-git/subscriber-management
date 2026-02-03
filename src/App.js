import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Users, IndianRupee, MapPin, Filter, DollarSign, Calendar, Building2 } from 'lucide-react';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx';

function App() {
  // State for subscribers and loading
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for home page filters
  const [selectedService, setSelectedService] = useState('');
  const [selectedServiceProvider, setSelectedServiceProvider] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showMainView, setShowMainView] = useState(false);

  // State for form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // State for finance modal
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('both');

  const [formData, setFormData] = useState({
    subscriber_code: '',
    name: '',
    mobile: '',
    area: '',
    address: '',
    service: '',
    service_provider: '',
    monthly_fee: '',
    connection_date: '',
    status: 'active',
    billing_year: '',
    billing_month: '',
    payment_mode: ''
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

  // Generate years array (current year to 10 years back)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - i);

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Handle home page filter submission
  const handleFilterSubmit = () => {
    if (!selectedService || !selectedServiceProvider || !selectedYear || !selectedMonth) {
      alert('Please select all filters: Service, Service Provider, Year, and Month');
      return;
    }
    setShowMainView(true);
  };

  // Reset filters and go back to home
  const handleBackToHome = () => {
    setShowMainView(false);
    setSelectedService('');
    setSelectedServiceProvider('');
    setSelectedYear('');
    setSelectedMonth('');
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.mobile || !formData.area || !formData.service || !formData.service_provider || !formData.monthly_fee) {
      alert('Please fill all required fields');
      return;
    }

    // 10-digit mobile number validation
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.mobile)) {
      alert('Mobile number must be exactly 10 digits');
      return;
    }

    try {
      // Auto-generate subscriber code if not provided
      let subscriberCode = formData.subscriber_code;

      if (!subscriberCode) {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const { count } = await supabase
          .from('subscribers')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date().toISOString().split('T')[0]);

        const sequence = String((count || 0) + 1).padStart(3, '0');
        subscriberCode = `SUB-${date}-${sequence}`;
      }

      if (editingId) {
        // Update existing subscriber
        const { error } = await supabase
          .from('subscribers')
          .update({
            subscriber_code: subscriberCode,
            name: formData.name,
            mobile: formData.mobile,
            area: formData.area,
            address: formData.address,
            service: formData.service,
            service_provider: formData.service_provider,
            monthly_fee: parseFloat(formData.monthly_fee),
            connection_date: formData.connection_date,
            status: formData.status,
            billing_year: formData.billing_year || selectedYear,
            billing_month: formData.billing_month || selectedMonth,
            payment_mode: formData.payment_mode,
            last_edited_at: new Date().toISOString(),
            last_edited_by: 'user@example.com'
          })
          .eq('id', editingId);

        if (error) throw error;
        alert('Subscriber updated successfully!');
      } else {
        // Add new subscriber
        const { error } = await supabase
          .from('subscribers')
          .insert([{
            subscriber_code: subscriberCode,
            name: formData.name,
            mobile: formData.mobile,
            area: formData.area,
            address: formData.address,
            service: formData.service,
            service_provider: formData.service_provider,
            monthly_fee: parseFloat(formData.monthly_fee),
            connection_date: formData.connection_date || new Date().toISOString().split('T')[0],
            status: formData.status,
            billing_year: formData.billing_year || selectedYear,
            billing_month: formData.billing_month || selectedMonth,
            payment_mode: formData.payment_mode,
            created_by: 'user@example.com'
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
      subscriber_code: '',
      name: '',
      mobile: '',
      area: '',
      address: '',
      service: '',
      service_provider: '',
      monthly_fee: '',
      connection_date: '',
      status: 'active',
      billing_year: '',
      billing_month: '',
      payment_mode: ''
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (subscriber) => {
    setFormData({
      subscriber_code: subscriber.subscriber_code || '',
      name: subscriber.name,
      mobile: subscriber.mobile,
      area: subscriber.area,
      address: subscriber.address || '',
      service: subscriber.service,
      service_provider: subscriber.service_provider,
      monthly_fee: subscriber.monthly_fee,
      connection_date: subscriber.connection_date || '',
      status: subscriber.status,
      billing_year: subscriber.billing_year || '',
      billing_month: subscriber.billing_month || '',
      payment_mode: subscriber.payment_mode || ''
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
        const newSubscribers = jsonData.map((row, index) => {
          const subscriber_code = row['Subscriber Code'] || row.subscriber_code || row.Code || '';
          const name = row.Name || row.name || row['Customer Name'] || '';
          const mobile = String(row.Mobile || row.mobile || row['Contact Number'] || '');
          const area = row.Area || row.area || row['Area / Location'] || '';
          const address = row.Address || row.address || '';
          const service = row.Service || row.service || '';
          const service_provider = row['Service Provider'] || row.service_provider || '';
          const monthly_fee = parseFloat(row['Monthly Fee'] || row.monthly_fee || 0);
          const connection_date = row['Connection Date'] || row.connection_date || new Date().toISOString().split('T')[0];
          const status = (row.Status || row.status || 'active').toLowerCase();
          const billing_year = row['Billing Year'] || row.billing_year || selectedYear || currentYear.toString();
          const billing_month = row['Billing Month'] || row.billing_month || selectedMonth || '';
          const payment_mode = row['Payment Mode'] || row.payment_mode || '';

          // Validate required fields
          if (!name || !mobile || !area || !service || !service_provider) {
            console.warn(`⚠️ Row ${index + 2} skipped: missing required fields`, row);
            return null;
          }

          const finalCode = subscriber_code || `SUB-IMPORT-${String(index + 1).padStart(3, '0')}`;

          return {
            subscriber_code: finalCode,
            name: name.trim(),
            mobile: mobile.trim(),
            area: area.trim(),
            address: address.trim(),
            service: service.trim(),
            service_provider: service_provider.trim(),
            monthly_fee,
            connection_date,
            status: ['active', 'inactive', 'suspended'].includes(status) ? status : 'active',
            billing_year,
            billing_month,
            payment_mode: payment_mode.trim(),
            created_by: 'excel_import'
          };
        }).filter(Boolean);

        if (newSubscribers.length === 0) {
          alert('❌ No valid data found in Excel file. Please check the format.');
          return;
        }

        console.log(`✅ Validated ${newSubscribers.length} subscribers for import`);

        // Insert into Supabase
        const { error } = await supabase
          .from('subscribers')
          .insert(newSubscribers);

        if (error) throw error;

        alert(`✅ Successfully imported ${newSubscribers.length} subscribers!`);
        fetchSubscribers();

        // Reset file input
        e.target.value = '';
      } catch (error) {
        console.error('❌ Error importing Excel:', error);
        alert('❌ Error importing Excel file: ' + error.message);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Filter subscribers based on home page selections and search
  const filteredSubscribers = subscribers.filter(sub => {
    // Home page filters
    const matchesService = selectedService === 'all' || sub.service === selectedService;
    const matchesProvider = sub.service_provider === selectedServiceProvider;
    const matchesYear = sub.billing_year === selectedYear;
    const matchesMonth = sub.billing_month === selectedMonth;

    // Search filter
    const matchesSearch = sub.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.mobile?.includes(searchTerm) ||
                         sub.subscriber_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.area?.toLowerCase().includes(searchTerm.toLowerCase());

    // Area filter
    const matchesArea = filterArea === 'all' || sub.area === filterArea;

    // Status filter
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;

    return matchesService && matchesProvider && matchesYear && matchesMonth &&
           matchesSearch && matchesArea && matchesStatus;
  });

  // Filter for finance modal based on payment mode
  const financeFilteredSubscribers = filteredSubscribers.filter(sub => {
    if (selectedPaymentMode === 'both') return true;
    if (selectedPaymentMode === 'online') return sub.payment_mode?.toLowerCase() === 'online';
    if (selectedPaymentMode === 'lco') return sub.payment_mode?.toLowerCase() === 'lco';
    return true;
  });

  const areas = ['all', ...new Set(subscribers.map(s => s.area).filter(Boolean))];

  const stats = {
    total: filteredSubscribers.length,
    active: filteredSubscribers.filter(s => s.status === 'active').length,
    inactive: filteredSubscribers.filter(s => s.status === 'inactive').length,
    suspended: filteredSubscribers.filter(s => s.status === 'suspended').length,
    totalRevenue: filteredSubscribers.filter(s => s.status === 'active').reduce((sum, s) => sum + parseFloat(s.monthly_fee || 0), 0)
  };

  const financeStats = {
    total: financeFilteredSubscribers.length,
    totalRevenue: financeFilteredSubscribers.reduce((sum, s) => sum + parseFloat(s.monthly_fee || 0), 0),
    onlineRevenue: financeFilteredSubscribers.filter(s => s.payment_mode?.toLowerCase() === 'online').reduce((sum, s) => sum + parseFloat(s.monthly_fee || 0), 0),
    lcoRevenue: financeFilteredSubscribers.filter(s => s.payment_mode?.toLowerCase() === 'lco').reduce((sum, s) => sum + parseFloat(s.monthly_fee || 0), 0)
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

  // HOME PAGE - Filter Selection
  if (!showMainView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Cable Subscriber Management</h1>
            <p className="text-gray-600">Select filters to view subscriber data</p>
          </div>

          <div className="space-y-6">
            {/* Service Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Service Type *
              </label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Service</option>
                <option value="Internet">Internet</option>
                <option value="Video">Video</option>
                <option value="Internet + Video">Internet + Video</option>
                <option value="all">All Services</option>
              </select>
            </div>

            {/* Service Provider Selection */}
            {selectedService && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Service Provider *
                </label>
                <select
                  value={selectedServiceProvider}
                  onChange={(e) => setSelectedServiceProvider(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Service Provider</option>
                  <option value="Asianet">Asianet</option>
                  <option value="KCCL">KCCL</option>
                  <option value="KFoN">KFoN</option>
                  <option value="BSNL">BSNL</option>
                </select>
              </div>
            )}

            {/* Year and Month Selection */}
            {selectedServiceProvider && (
              <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Billing Year *
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Year</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Billing Month *
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Month</option>
                    {months.map(month => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Submit Button */}
            {selectedService && selectedServiceProvider && selectedYear && selectedMonth && (
              <button
                onClick={handleFilterSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl animate-fadeIn"
              >
                View Subscribers
              </button>
            )}
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Total Subscribers in Database: {subscribers.length}</p>
          </div>
        </div>
      </div>
    );
  }

  // MAIN VIEW - Subscriber List
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button and Finance Button */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Subscriber Management</h1>
              <p className="text-gray-600">
                {selectedService === 'all' ? 'All Services' : selectedService} - {selectedServiceProvider} - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFinanceModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                <IndianRupee size={20} />
                Monthly Finance
              </button>
              <button
                onClick={handleBackToHome}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                <p className="text-gray-600 text-sm">Active</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Users className="text-green-500" size={40} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Inactive</p>
                <p className="text-3xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <Users className="text-red-500" size={40} />
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

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, mobile, code..."
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
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>
{/* Action Buttons */}
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

           <a
            href="data:text/csv;charset=utf-8,Subscriber Code,Customer Name,Contact Number,Area,Address,Service,Service Provider,Monthly Fee,Connection Date,Status,Billing Year,Billing Month,Payment Mode%0ASUB-001,Rajesh Kumar,9876543210,Sector A,House 101,Internet,Asianet,500,2024-01-15,active,2024,01,Online%0ASUB-002,Priya Sharma,9876543211,Sector B,Flat 202,Video,KCCL,750,2024-02-20,active,2024,02,LCO"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscriber Code
                  <span className="text-gray-500 text-xs ml-2">(Auto-generated)</span>
                </label>
                <input
                  type="text"
                  value={formData.subscriber_code}
                  onChange={(e) => setFormData({...formData, subscriber_code: e.target.value.toUpperCase()})}
                  placeholder="SUB-20240116-001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Rajesh Kumar"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  placeholder="9876543210"
                  maxLength="10"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area / Location *</label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData({...formData, area: e.target.value})}
                  placeholder="Sector A"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="House 101, Street 1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                <select
                  value={formData.service}
                  onChange={(e) => setFormData({...formData, service: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Service</option>
                  <option value="Internet">Internet</option>
                  <option value="Video">Video</option>
                  <option value="Internet + Video">Internet + Video</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Provider *</label>
                <select
                  value={formData.service_provider}
                  onChange={(e) => setFormData({...formData, service_provider: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Provider</option>
                  <option value="Asianet">Asianet</option>
                  <option value="KCCL">KCCL</option>
                  <option value="KFoN">KFoN</option>
                  <option value="BSNL">BSNL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Fee (₹) *</label>
                <input
                  type="number"
                  value={formData.monthly_fee}
                  onChange={(e) => setFormData({...formData, monthly_fee: e.target.value})}
                  placeholder="500"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Connection Date</label>
                <input
                  type="date"
                  value={formData.connection_date}
                  onChange={(e) => setFormData({...formData, connection_date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                <select
                  value={formData.payment_mode}
                  onChange={(e) => setFormData({...formData, payment_mode: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Payment Mode</option>
                  <option value="Online">Online</option>
                  <option value="LCO">LCO</option>
                </select>
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
                  <option value="suspended">Suspended</option>
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

        {/* Subscribers Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Fee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubscribers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No subscribers found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredSubscribers.map(subscriber => (
                    <tr key={subscriber.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono">
                          {subscriber.subscriber_code || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{subscriber.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{subscriber.mobile}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400" />
                          {subscriber.area}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{subscriber.monthly_fee}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          subscriber.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : subscriber.status === 'suspended'
                            ? 'bg-yellow-100 text-yellow-800'
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
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(subscriber.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
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
          Showing {filteredSubscribers.length} subscribers
        </div>
      </div>

      {/* Finance Modal */}
      {showFinanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Monthly Finance Status</h2>
                <button
                  onClick={() => setShowFinanceModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Payment Mode Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Filter by Payment Mode
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedPaymentMode('both')}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                      selectedPaymentMode === 'both'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Both
                  </button>
                  <button
                    onClick={() => setSelectedPaymentMode('online')}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                      selectedPaymentMode === 'online'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Online Purchase
                  </button>
                  <button
                    onClick={() => setSelectedPaymentMode('lco')}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                      selectedPaymentMode === 'lco'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    LCO Credits
                  </button>
                </div>
              </div>

              {/* Finance Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Subscribers</p>
                  <p className="text-2xl font-bold text-blue-600">{financeStats.total}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Online Revenue</p>
                  <p className="text-2xl font-bold text-green-600">₹{financeStats.onlineRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">LCO Revenue</p>
                  <p className="text-2xl font-bold text-purple-600">₹{financeStats.lcoRevenue.toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-lg p-6">
                <p className="text-sm text-gray-600 mb-2">Total Revenue</p>
                <p className="text-4xl font-bold text-indigo-600">₹{financeStats.totalRevenue.toFixed(2)}</p>
              </div>

              {/* Subscriber List */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Subscribers ({financeStats.total})</h3>
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  {financeFilteredSubscribers.map(sub => (
                    <div key={sub.id} className="p-3 border-b hover:bg-gray-50 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">{sub.name}</p>
                        <p className="text-sm text-gray-600">{sub.subscriber_code} - {sub.area}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">₹{sub.monthly_fee}</p>
                        <p className="text-xs text-gray-500">{sub.payment_mode || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;