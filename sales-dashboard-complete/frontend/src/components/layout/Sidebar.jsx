import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  TrendingUp, 
  Package, 
  Users, 
  MapPin, 
  Brain,
  BarChart3
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Sales Analysis', href: '/sales-analysis', icon: TrendingUp },
    { name: 'Product Analysis', href: '/product-analysis', icon: Package },
    { name: 'Customer Analysis', href: '/customer-analysis', icon: Users },
    { name: 'Regional Analysis', href: '/regional-analysis', icon: MapPin },
    { name: 'Forecasting', href: '/forecasting', icon: Brain },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 pt-16">
      <div className="flex flex-col h-full">
        <div className="flex-1 px-4 py-6 overflow-y-auto">
          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${
                    isActive(item.href) ? 'text-blue-700' : 'text-gray-400'
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Sales Analytics</p>
              <p className="text-xs text-gray-500">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;