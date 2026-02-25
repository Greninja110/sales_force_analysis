import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Calendar, Target, AlertCircle } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import { forecastingAPI } from '../services/api';
import ErrorDisplay from '../components/common/ErrorDisplay';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const Forecasting = () => {
  const [data, setData] = useState({
    forecast: null,
    modelStatus: null,
    seasonality: null
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [predictionSettings, setPredictionSettings] = useState({
    days: 30,
    confidence: 0.95
  });
  const [isTraining, setIsTraining] = useState(false);

  useEffect(() => {
    loadForecastingData();
  }, []);

  const loadForecastingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statusResponse, seasonalityResponse] = await Promise.all([
        forecastingAPI.getModelStatus(),
        forecastingAPI.getSeasonality()
      ]);

      setData({
        modelStatus: statusResponse.data,
        seasonality: seasonalityResponse.data,
        forecast: null
      });

    } catch (err) {
      console.error('Error loading forecasting data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrainModel = async () => {
    try {
      setIsTraining(true);
      await forecastingAPI.trainModel();
      await loadForecastingData();
    } catch (err) {
      console.error('Error training model:', err);
      setError(err);
    } finally {
      setIsTraining(false);
    }
  };

  const handleGenerateForecast = async () => {
    try {
      setLoading(true);
      const response = await forecastingAPI.predictSimple(
        predictionSettings.days,
        predictionSettings.confidence
      );
      
      setData(prev => ({
        ...prev,
        forecast: response.data
      }));
    } catch (err) {
      console.error('Error generating forecast:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadForecastingData();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTooltip = (value, name) => {
    if (name === 'predicted_sales' || name === 'upper_bound' || name === 'lower_bound') {
      return [formatCurrency(value), name === 'predicted_sales' ? 'Predicted Sales' : 
              name === 'upper_bound' ? 'Upper Bound' : 'Lower Bound'];
    }
    return [value, name];
  };

  // Prepare forecast chart data
  const forecastChartData = data.forecast ? data.forecast.dates.map((date, index) => ({
    date: new Date(date).toLocaleDateString(),
    predicted_sales: data.forecast.predicted_sales[index],
    upper_bound: data.forecast.upper_bound[index],
    lower_bound: data.forecast.lower_bound[index]
  })) : [];

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Sales Forecasting</h1>
        </div>
        <ErrorDisplay error={error} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Forecasting</h1>
          <p className="text-gray-600">AI-powered sales predictions and trend analysis</p>
        </div>
        
        {/* Model Actions */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleTrainModel}
            disabled={isTraining}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Brain className="h-4 w-4" />
            <span>{isTraining ? 'Training...' : 'Train Model'}</span>
          </button>
        </div>
      </div>

      {/* Model Status */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              data.modelStatus?.trained ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Model Status</h3>
              <p className="text-gray-600">
                {data.modelStatus?.trained ? 'Model is trained and ready' : 'Model needs training'}
              </p>
            </div>
          </div>
          {data.modelStatus?.trained && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Last Training</p>
              <p className="font-medium text-gray-900">
                {data.modelStatus.last_training_date 
                  ? new Date(data.modelStatus.last_training_date).toLocaleDateString()
                  : 'Unknown'
                }
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Forecast Generation */}
      {data.modelStatus?.trained && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Generate Forecast</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Forecast Period (Days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={predictionSettings.days}
                onChange={(e) => setPredictionSettings(prev => ({ ...prev, days: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confidence Level
              </label>
              <select
                value={predictionSettings.confidence}
                onChange={(e) => setPredictionSettings(prev => ({ ...prev, confidence: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0.90}>90%</option>
                <option value={0.95}>95%</option>
                <option value={0.99}>99%</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleGenerateForecast}
                disabled={loading}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate Forecast'}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Forecast Results */}
      {data.forecast && (
        <div className="space-y-6">
          {/* Forecast Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Forecast Period"
              value={`${data.forecast.dates.length} days`}
              icon={Calendar}
              color="blue"
            />
            <StatCard
              title="Predicted Total Sales"
              value={formatCurrency(data.forecast.predicted_sales.reduce((sum, val) => sum + val, 0))}
              icon={TrendingUp}
              color="green"
            />
            <StatCard
              title="Avg Daily Sales"
              value={formatCurrency(data.forecast.predicted_sales.reduce((sum, val) => sum + val, 0) / data.forecast.dates.length)}
              icon={Target}
              color="purple"
            />
            <StatCard
              title="Model Accuracy"
              value={`${(data.forecast.model_accuracy * 100).toFixed(1)}%`}
              icon={Brain}
              color="yellow"
            />
          </div>

          {/* Forecast Chart */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sales Forecast</h3>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">Predicted</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-200 rounded-full"></div>
                  <span className="text-gray-600">Confidence Interval</span>
                </div>
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} tickFormatter={formatCurrency} />
                  <Tooltip formatter={formatTooltip} />
                  <Area
                    type="monotone"
                    dataKey="upper_bound"
                    stackId="1"
                    stroke="none"
                    fill="#dbeafe"
                    fillOpacity={0.4}
                  />
                  <Area
                    type="monotone"
                    dataKey="lower_bound"
                    stackId="1"
                    stroke="none"
                    fill="#ffffff"
                    fillOpacity={1}
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted_sales"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 2, fill: '#3b82f6' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* Seasonality Analysis */}
      {data.seasonality && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Seasonality */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Monthly Seasonality</h3>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.seasonality.monthly_seasonality}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Avg Sales']} />
                  <Line
                    type="monotone"
                    dataKey="avg_sales"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Weekly Seasonality */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Weekly Seasonality</h3>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.seasonality.weekly_seasonality}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Avg Sales']} />
                  <Line
                    type="monotone"
                    dataKey="avg_sales"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#8b5cf6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Forecasting;