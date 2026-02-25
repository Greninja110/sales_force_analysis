import React, { useState, useEffect } from 'react';
import { Calendar, Filter, X } from 'lucide-react';
import { dashboardAPI } from '../../services/api';
import Card from '../common/Card';

const FilterPanel = ({ onFiltersChange, className = '' }) => {
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    regions: [],
    categories: [],
    segments: []
  });
  
  const [filterOptions, setFilterOptions] = useState({
    regions: [],
    categories: [],
    segments: [],
    date_range: { min_date: '', max_date: '' }
  });
  
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const response = await dashboardAPI.getFilterOptions();
      setFilterOptions(response.data);
      
      // No default filters - start with empty filters
      const defaultFilters = {
        start_date: '',
        end_date: '',
        regions: [],
        categories: [],
        segments: []
      };
      
      setFilters(defaultFilters);
      onFiltersChange(defaultFilters);
    } catch (error) {
      console.error('Error loading filter options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleMultiSelectChange = (key, value) => {
    const currentValues = filters[key] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    handleFilterChange(key, newValues);
  };

  const clearFilters = () => {
    const clearedFilters = {
      start_date: '',
      end_date: '',
      regions: [],
      categories: [],
      segments: []
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.start_date) count++;
    if (filters.end_date) count++;
    if (filters.regions.length > 0) count++;
    if (filters.categories.length > 0) count++;
    if (filters.segments.length > 0) count++;
    return count;
  };

  if (loading) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 rounded"></div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="space-y-4">
        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
          >
            <Filter className="h-5 w-5" />
            <span className="font-medium">Filters</span>
            {getActiveFiltersCount() > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {getActiveFiltersCount()}
              </span>
            )}
          </button>
          
          {getActiveFiltersCount() > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Filter Controls */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4 inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                min={filterOptions.date_range.min_date}
                max={filterOptions.date_range.max_date}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4 inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                min={filterOptions.date_range.min_date}
                max={filterOptions.date_range.max_date}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Regions */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Regions</label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {filterOptions.regions.map((region) => (
                  <label key={region} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.regions.includes(region)}
                      onChange={() => handleMultiSelectChange('regions', region)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{region}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Categories</label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {filterOptions.categories.map((category) => (
                  <label key={category} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => handleMultiSelectChange('categories', category)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Segments */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Segments</label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {filterOptions.segments.map((segment) => (
                  <label key={segment} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.segments.includes(segment)}
                      onChange={() => handleMultiSelectChange('segments', segment)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{segment}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default FilterPanel;