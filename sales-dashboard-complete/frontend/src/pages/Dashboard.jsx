import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, ShoppingCart, Users, Package, Target } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import FilterPanel from '../components/dashboard/FilterPanel';
import SalesChart from '../components/charts/SalesChart';
import CategoryBreakdown from '../components/charts/CategoryBreakdown';
import RegionalChart from '../components/charts/RegionalChart';
import { dashboardAPI, salesAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';
import Card from '../components/common/Card';

const Dashboard = () => {
  const [data, setData] = useState({
    kpis: null,
    salesTrend: [],
    categoryBreakdown: [],
    regionalPerformance: [],
    topProducts: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      loadDashboardData();
    }
  }, [filters]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [kpisResponse, overviewResponse, salesTrendResponse] = await Promise.all([
        dashboardAPI.getKPIs(filters),
        dashboardAPI.getOverview(filters),
        salesAPI.getTrend({ ...filters, period: 'month' })
      ]);

      setData({
        kpis: kpisResponse.data,
        salesTrend: salesTrendResponse.data,
        categoryBreakdown: overviewResponse.data.category_breakdown,
        regionalPerformance: overviewResponse.data.regional_performance,
        topProducts: overviewResponse.data.top_products
      });

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleRetry = () => {
    loadDashboardData();
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your sales performance</p>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel onFiltersChange={handleFiltersChange} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
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
          icon={ShoppingCart}
          color="yellow"
          loading={loading}
        />
        <StatCard
          title="Total Orders"
          value={data.kpis ? formatNumber(data.kpis.total_orders) : '--'}
          icon={Package}
          color="indigo"
          loading={loading}
        />
        <StatCard
          title="Total Customers"
          value={data.kpis ? formatNumber(data.kpis.total_customers) : '--'}
          icon={Users}
          color="red"
          loading={loading}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart
          data={data.salesTrend}
          loading={loading}
          title="Sales Trend"
          className="lg:col-span-1"
        />
        <CategoryBreakdown
          data={data.categoryBreakdown}
          loading={loading}
          title="Sales by Category"
          className="lg:col-span-1"
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RegionalChart
          data={data.regionalPerformance}
          loading={loading}
          title="Regional Performance"
          className="lg:col-span-2"
        />
        
        {/* Top Products */}
        <Card className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
          </div>
          
          {loading ? (
            <LoadingSpinner size="lg" className="h-64" />
          ) : data.topProducts.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.topProducts.map((product, index) => (
                <div key={product.product_name} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full flex-shrink-0">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm truncate" title={product.product_name}>
                        {product.product_name}
                      </p>
                      <p className="text-xs text-gray-500">{product.category}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-medium text-gray-900 text-sm">{formatCurrency(product.total_sales)}</p>
                    <p className="text-xs text-gray-500">{product.quantity_sold} sold</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">No products data available</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;