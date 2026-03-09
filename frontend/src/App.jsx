import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';


import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ReceiptsPage from './pages/ReceiptsPage';
import ReceiptDetailPage from './pages/ReceiptDetailPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
      
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
         
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute redirection="/login"><DashboardPage /></ProtectedRoute>
            } 
          />
          
          <Route 
            path="/receipts" 
            element={
              <ProtectedRoute redirection="/login"><ReceiptsPage /></ProtectedRoute>
            } 
          />
          
          <Route 
            path="/receipts/:id" 
            element={
              <ProtectedRoute redirection="/login"><ReceiptDetailPage /></ProtectedRoute>
            } 
          />

         
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;