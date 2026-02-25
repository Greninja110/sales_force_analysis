import React, { useState, useEffect } from 'react';
import { Users, DollarSign, ShoppingCart, Target } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import FilterPanel from '../components/dashboard/FilterPanel';
import { salesAPI, dashboardAPI } from '../services/api';
import ErrorDisplay from '../components/common/ErrorDisplay';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const CustomerAnalysis = () => {
  const [data, setData] = useState({
    topCustomers: [],
    kpis: null
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      loadCustomerData();
    }
  }, [filters]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [topCustomersResponse, kpisResponse] = await Promise.all([
        salesAPI.getTopCustomers({ ...filters, limit: 50 }),
        dashboardAPI.getKPIs(filters)
      ]);

      setData({
        topCustomers: topCustomersResponse.data,
        kpis: kpisResponse.data
      });

    } catch (err) {
      console.error('Error loading customer data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleRetry = () => {
    loadCustomerData();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Customer Analysis</h1>
        </div>
        <ErrorDisplay error={error} onRetry={handleRetry} />
      </div>
    );
  }

  // Calculate segment breakdown
  const segmentBreakdown = data.topCustomers.reduce((acc, customer) => {
    const segment = customer.segment;
    if (!acc[segment]) {
      acc[segment] = { count: 0, sales: 0 };
    }
    acc[segment].count++;
    acc[segment].sales += customer.total_sales;
    return acc;
  }, {});

  const segmentData = Object.entries(segmentBreakdown).map(([segment, data]) => ({
    segment,
    count: data.count,
    sales: data.sales
  }));

  // Calculate order frequency distribution
  const orderFrequency = data.topCustomers.reduce((acc, customer) => {
    const orders = customer.order_count;
    let bucket;
    if (orders === 1) bucket = '1 order';
    else if (orders <= 3) bucket = '2-3 orders';
    else if (orders <= 5) bucket = '4-5 orders';
    else if (orders <= 10) bucket = '6-10 orders';
    else bucket = '10+ orders';
    
    if (!acc[bucket]) acc[bucket] = 0;
    acc[bucket]++;
    return acc;
  }, {});

  const orderFrequencyData = Object.entries(orderFrequency).map(([bucket, count]) => ({
    bucket,
    count
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Analysis</h1>
          <p className="text-gray-600">Analyze customer behavior and segmentation</p>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel onFiltersChange={handleFiltersChange} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value={data.kpis ? formatNumber(data.kpis.total_customers) : '--'}
          icon={Users}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Avg Customer Value"
          value={data.kpis ? formatCurrency(data.kpis.total_revenue / data.kpis.total_customers) : '--'}
          icon={DollarSign}
          color="green"
          loading={loading}
        />
        <StatCard
          title="Avg Order Value"
          value={data.kpis ? formatCurrency(data.kpis.avg_order_value) : '--'}
          icon={ShoppingCart}
          color="purple"
          loading={loading}
        />
        <StatCard
          title="Orders per Customer"
          value={data.kpis ? (data.kpis.total_orders / data.kpis.total_customers).toFixed(1) : '--'}
          icon={Target}
          color="yellow"
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Segments */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Customer Segments</h3>
          </div>
          
          {loading ? (
            <LoadingSpinner size="lg" className="h-80" />
          ) : segmentData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ segment, count }) => `${segment}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {segmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatNumber(value), 'Customers']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <p className="text-gray-500">No segment data available</p>
            </div>
          )}
        </Card>

        {/* Order Frequency */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Order Frequency Distribution</h3>
          </div>
          
          {loading ? (
            <LoadingSpinner size="lg" className="h-80" />
          ) : orderFrequencyData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderFrequencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="bucket" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip formatter={(value) => [formatNumber(value), 'Customers']} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <p className="text-gray-500">No frequency data available</p>
            </div>
          )}
        </Card>
      </div>

      {/* Top Customers Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Customers</h3>
        </div>
        
        {loading ? (
          <LoadingSpinner size="lg" className="h-64" />
        ) : data.topCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Segment</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Total Sales</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Total Profit</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Orders</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Avg Order Value</th>
                </tr>
              </thead>
              <tbody>
                {data.topCustomers.slice(0, 20).map((customer, index) => (
                  <tr key={customer.customer_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customer.customer_name}</p>
                          <p className="text-sm text-gray-500">{customer.customer_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        customer.segment === 'Consumer' ? 'bg-blue-100 text-blue-800' :
                        customer.segment === 'Corporate' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {customer.segment}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-900">{formatCurrency(customer.total_sales)}</td>
                    <td className="text-right py-3 px-4 text-gray-900">{formatCurrency(customer.total_profit)}</td>
                    <td className="text-right py-3 px-4 text-gray-900">{formatNumber(customer.order_count)}</td>
                    <td className="text-right py-3 px-4 text-gray-900">{formatCurrency(customer.avg_order_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">No customer data available</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CustomerAnalysis;