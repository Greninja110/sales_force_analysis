import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import SalesAnalysis from './pages/SalesAnalysis';
import ProductAnalysis from './pages/ProductAnalysis';
import CustomerAnalysis from './pages/CustomerAnalysis';
import RegionalAnalysis from './pages/RegionalAnalysis';
import Forecasting from './pages/Forecasting';

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sales-analysis" element={<SalesAnalysis />} />
          <Route path="/product-analysis" element={<ProductAnalysis />} />
          <Route path="/customer-analysis" element={<CustomerAnalysis />} />
          <Route path="/regional-analysis" element={<RegionalAnalysis />} />
          <Route path="/forecasting" element={<Forecasting />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;