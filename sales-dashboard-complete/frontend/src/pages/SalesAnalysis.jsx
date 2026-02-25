import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, DollarSign, Target } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import FilterPanel from '../components/dashboard/FilterPanel';
import SalesChart from '../components/charts/SalesChart';
import { salesAPI, dashboardAPI } from '../services/api';
import ErrorDisplay from '../components/common/ErrorDisplay';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';

const SalesAnalysis = () => {
  const [data, setData] = useState({
    kpis: null,
    monthlyTrend: [],
    quarterlyTrend: [],
    yearlyTrend: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      loadSalesData();
    }
  }, [filters, selectedPeriod]);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [kpisResponse, trendResponse] = await Promise.all([
        dashboardAPI.getKPIs(filters),
        salesAPI.getTrend({ ...filters, period: selectedPeriod })
      ]);

      setData({
        kpis: kpisResponse.data,
        [selectedPeriod + 'lyTrend']: trendResponse.data
      });

    } catch (err) {
      console.error('Error loading sales data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleRetry = () => {
    loadSalesData();
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
          <h1 className="text-2xl font-bold text-gray-900">Sales Analysis</h1>
        </div>
        <ErrorDisplay error={error} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Analysis</h1>
          <p className="text-gray-600">Detailed analysis of sales performance over time</p>
        </div>
        
        {/* Period Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Period:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="month">Monthly</option>
            <option value="quarter">Quarterly</option>
            <option value="year">Yearly</option>
          </select>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel onFiltersChange={handleFiltersChange} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={data.kpis ? formatCurrency(data.kpis.total_revenue) : '--'}
          icon={DollarSign}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Total Profit"
          value={data.kpis ? formatCurrency(data.kpis.total_profit) : '--'}
          icon={TrendingUp}
          color="green"
          loading={loading}
        />
        <StatCard
          title="Profit Margin"
          value={data.kpis ? `${data.kpis.profit_margin.toFixed(1)}%` : '--'}
          icon={Target}
          color="purple"
          loading={loading}
        />
        <StatCard
          title="Avg Order Value"
          value={data.kpis ? formatCurrency(data.kpis.avg_order_value) : '--'}
          icon={Calendar}
          color="yellow"
          loading={loading}
        />
      </div>

      {/* Sales Trend Chart */}
      <SalesChart
        data={data[selectedPeriod + 'lyTrend']}
        loading={loading}
        title={`Sales Trend (${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}ly)`}
      />

      {/* Sales Performance Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Sales Performance Summary</h3>
        </div>
        
        {loading ? (
          <LoadingSpinner size="lg" className="h-64" />
        ) : data[selectedPeriod + 'lyTrend'].length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Period</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Sales</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Profit</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Orders</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Avg Order</th>
                </tr>
              </thead>
              <tbody>
                {data[selectedPeriod + 'lyTrend'].map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{item.period}</td>
                    <td className="text-right py-3 px-4 text-gray-900">{formatCurrency(item.sales)}</td>
                    <td className="text-right py-3 px-4 text-gray-900">{formatCurrency(item.profit)}</td>
                    <td className="text-right py-3 px-4 text-gray-900">{formatNumber(item.orders)}</td>
                    <td className="text-right py-3 px-4 text-gray-900">
                      {formatCurrency(item.sales / item.orders)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">No sales data available</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SalesAnalysis;