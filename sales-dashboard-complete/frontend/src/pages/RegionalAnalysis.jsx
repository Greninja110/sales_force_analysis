import React, { useState, useEffect } from 'react';
import { MapPin, DollarSign, Users, Package } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import FilterPanel from '../components/dashboard/FilterPanel';
import RegionalChart from '../components/charts/RegionalChart';
import { salesAPI, dashboardAPI } from '../services/api';
import ErrorDisplay from '../components/common/ErrorDisplay';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';

const RegionalAnalysis = () => {
  const [data, setData] = useState({
    regionalPerformance: [],
    kpis: null
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      loadRegionalData();
    }
  }, [filters]);

  const loadRegionalData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [regionalResponse, kpisResponse] = await Promise.all([
        salesAPI.getRegionalPerformance(filters),
        dashboardAPI.getKPIs(filters)
      ]);

      setData({
        regionalPerformance: regionalResponse.data,
        kpis: kpisResponse.data
      });

    } catch (err) {
      console.error('Error loading regional data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleRetry = () => {
    loadRegionalData();
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
          <h1 className="text-2xl font-bold text-gray-900">Regional Analysis</h1>
        </div>
        <ErrorDisplay error={error} onRetry={handleRetry} />
      </div>
    );
  }

  // Calculate regional summary stats
  const totalRegions = data.regionalPerformance.length;
  const totalSales = data.regionalPerformance.reduce((sum, region) => sum + region.total_sales, 0);
  const totalOrders = data.regionalPerformance.reduce((sum, region) => sum + region.order_count, 0);
  const totalCustomers = data.regionalPerformance.reduce((sum, region) => sum + region.customer_count, 0);

  // Find best performing region
  const bestRegion = data.regionalPerformance.length > 0 
    ? data.regionalPerformance.reduce((best, region) => 
        region.total_sales > best.total_sales ? region : best
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Regional Analysis</h1>
          <p className="text-gray-600">Analyze sales performance across different regions</p>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel onFiltersChange={handleFiltersChange} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Regions"
          value={formatNumber(totalRegions)}
          icon={MapPin}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Total Sales"
          value={formatCurrency(totalSales)}
          icon={DollarSign}
          color="green"
          loading={loading}
        />
        <StatCard
          title="Total Orders"
          value={formatNumber(totalOrders)}
          icon={Package}
          color="purple"
          loading={loading}
        />
        <StatCard
          title="Total Customers"
          value={formatNumber(totalCustomers)}
          icon={Users}
          color="yellow"
          loading={loading}
        />
      </div>

      {/* Best Performing Region */}
      {bestRegion && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Best Performing Region</h3>
              <p className="text-gray-600">Highest sales performance</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{bestRegion.region}</p>
              <p className="text-sm text-gray-500">{formatCurrency(bestRegion.total_sales)} in sales</p>
            </div>
          </div>
        </Card>
      )}

      {/* Regional Performance Chart */}
      <RegionalChart
        data={data.regionalPerformance}
        loading={loading}
        title="Sales by Region"
      />

      {/* Regional Performance Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Regional Performance Details</h3>
        </div>
        
        {loading ? (
          <LoadingSpinner size="lg" className="h-64" />
        ) : data.regionalPerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Region</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Sales</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Profit</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Orders</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Customers</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Avg Order Value</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Sales per Customer</th>
                </tr>
              </thead>
              <tbody>
                {data.regionalPerformance.map((region, index) => (
                  <tr key={region.region} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{region.region}</p>
                          <p className="text-sm text-gray-500">Region</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-900">{formatCurrency(region.total_sales)}</td>
                    <td className="text-right py-3 px-4 text-gray-900">{formatCurrency(region.total_profit)}</td>
                    <td className="text-right py-3 px-4 text-gray-900">{formatNumber(region.order_count)}</td>
                    <td className="text-right py-3 px-4 text-gray-900">{formatNumber(region.customer_count)}</td>
                    <td className="text-right py-3 px-4 text-gray-900">
                      {formatCurrency(region.total_sales / region.order_count)}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-900">
                      {formatCurrency(region.total_sales / region.customer_count)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">No regional data available</p>
          </div>
        )}
      </Card>

      {/* Regional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Share */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Market Share by Region</h3>
          </div>
          
          {loading ? (
            <LoadingSpinner size="lg" className="h-64" />
          ) : data.regionalPerformance.length > 0 ? (
            <div className="space-y-4">
              {data.regionalPerformance.map((region, index) => {
                const percentage = (region.total_sales / totalSales * 100).toFixed(1);
                return (
                  <div key={region.region} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{region.region}</span>
                      <span className="text-sm text-gray-500">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">No market share data available</p>
            </div>
          )}
        </Card>

        {/* Performance Metrics */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
          </div>
          
          {loading ? (
            <LoadingSpinner size="lg" className="h-64" />
          ) : data.regionalPerformance.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-600">Highest Sales</p>
                  <p className="text-lg font-bold text-blue-900">
                    {data.regionalPerformance[0]?.region || 'N/A'}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-600">Most Profitable</p>
                  <p className="text-lg font-bold text-green-900">
                    {data.regionalPerformance.reduce((best, region) => 
                      region.total_profit > best.total_profit ? region : best
                    )?.region || 'N/A'}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-purple-600">Most Orders</p>
                  <p className="text-lg font-bold text-purple-900">
                    {data.regionalPerformance.reduce((best, region) => 
                      region.order_count > best.order_count ? region : best
                    )?.region || 'N/A'}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-yellow-600">Most Customers</p>
                  <p className="text-lg font-bold text-yellow-900">
                    {data.regionalPerformance.reduce((best, region) => 
                      region.customer_count > best.customer_count ? region : best
                    )?.region || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">No performance metrics available</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default RegionalAnalysis;