import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import HrDashboard from './pages/HrDashboard';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (token && role) {
      setIsLoggedIn(true);
      setUserRole(role);
    }
    setLoading(false);
  }, []);

  const handleLogin = (token, role, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('user', JSON.stringify(user));
    setIsLoggedIn(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserRole(null);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px' }}>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to={userRole === 'HR' ? '/hr-dashboard' : '/employee-dashboard'} /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/employee-dashboard"
          element={isLoggedIn && userRole === 'Employee' ? <EmployeeDashboard onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/hr-dashboard"
          element={isLoggedIn && userRole === 'HR' ? <HrDashboard onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to={isLoggedIn ? (userRole === 'HR' ? '/hr-dashboard' : '/employee-dashboard') : '/login'} />} />
      </Routes>
    </Router>
  );
}

export default App;
