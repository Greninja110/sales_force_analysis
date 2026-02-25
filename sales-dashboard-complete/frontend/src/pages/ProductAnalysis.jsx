import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, DollarSign, Target } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import FilterPanel from '../components/dashboard/FilterPanel';
import CategoryBreakdown from '../components/charts/CategoryBreakdown';
import { salesAPI, dashboardAPI } from '../services/api';
import ErrorDisplay from '../components/common/ErrorDisplay';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProductAnalysis = () => {
  const [data, setData] = useState({
    topProducts: [],
    categoryBreakdown: [],
    profitAnalysis: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      loadProductData();
    }
  }, [filters]);

  const loadProductData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [topProductsResponse, categoryResponse, profitResponse] = await Promise.all([
        salesAPI.getTopProducts({ ...filters, limit: 20 }),
        salesAPI.getCategoryBreakdown(filters),
        dashboardAPI.getProfitAnalysis(filters)
      ]);

      setData({
        topProducts: topProductsResponse.data,
        categoryBreakdown: categoryResponse.data,
        profitAnalysis: profitResponse.data
      });

    } catch (err) {
      console.error('Error loading product data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleRetry = () => {
    loadProductData();
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
          <h1 className="text-2xl font-bold text-gray-900">Product Analysis</h1>
        </div>
        <ErrorDisplay error={error} onRetry={handleRetry} />
      </div>
    );
  }

  // Calculate summary stats
  const totalProducts = data.topProducts.length;
  const totalSales = data.topProducts.reduce((sum, product) => sum + product.total_sales, 0);
  const totalProfit = data.topProducts.reduce((sum, product) => sum + product.total_profit, 0);
  const avgProfitMargin = totalProducts > 0 ? (totalProfit / totalSales * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Analysis</h1>
          <p className="text-gray-600">Analyze product performance and profitability</p>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel onFiltersChange={handleFiltersChange} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={formatNumber(totalProducts)}
          icon={Package}
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
          title="Total Profit"
          value={formatCurrency(totalProfit)}
          icon={TrendingUp}
          color="purple"
          loading={loading}
        />
        <StatCard
          title="Avg Profit Margin"
          value={`${avgProfitMargin.toFixed(1)}%`}
          icon={Target}
          color="yellow"
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryBreakdown
          data={data.categoryBreakdown}
          loading={loading}
          title="Sales by Category"
        />
        
        {/* Profit Analysis Chart */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Profitability Analysis</h3>
          </div>
          
          {loading ? (
            <LoadingSpinner size="lg" className="h-80" />
          ) : data.profitAnalysis.length > 0 ? (
            <div className="h-80 overflow-y-auto">
              <div className="space-y-3">
                {data.profitAnalysis.slice(0, 15).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.sub_category}</p>
                      <p className="text-sm text-gray-500">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(item.total_profit)}</p>
                      <p className={`text-sm ${item.profit_margin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.profit_margin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <p className="text-gray-500">No profit analysis data available</p>
            </div>
          )}
        </Card>
      </div>

      {/* Top Products Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
        </div>
        
        {loading ? (
          <LoadingSpinner size="lg" className="h-64" />
        ) : data.topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Sales</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Profit</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Margin</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((product, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 max-w-xs truncate">{product.product_name}</p>
                          <p className="text-sm text-gray-500">{product.sub_category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{product.category}</td>
                    <td className="text-right py-3 px-4 text-gray-900">{formatCurrency(product.total_sales)}</td>
                    <td className="text-right py-3 px-4 text-gray-900">{formatCurrency(product.total_profit)}</td>
                    <td className={`text-right py-3 px-4 ${product.profit_margin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.profit_margin.toFixed(1)}%
                    </td>
                    <td className="text-right py-3 px-4 text-gray-900">{formatNumber(product.quantity_sold)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">No product data available</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProductAnalysis;