import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import VendorList from './components/VendorList';
import VendorDetail from './components/VendorDetail';
import NewVendor from './components/NewVendor';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/vendors" element={<VendorList />} />
        <Route path="/vendors/new" element={<NewVendor />} />
        <Route path="/vendors/:vendorName" element={<VendorDetail />} />
      </Routes>
    </Router>
  );
};

export default App;
