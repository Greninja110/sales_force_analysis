import React from 'react';
import { BarChart3 } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sales Dashboard</h1>
              <p className="text-xs text-gray-500">Analytics Platform</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center">
            {/* User Info */}
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Abhijeet sahoo</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;