import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthForm from './AuthForm';
import Dashboard from './Dashboard';
import Profile from './Profile';
import AdminPage from './AdminPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken'));
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || ''); // Добавляем состояние

  const handleLoginSuccess = (token, role) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', role);
    setUserRole(role);
    const userInfo = JSON.parse(atob(token.split('.')[1])); // Расшифровка JWT
    localStorage.setItem('userEmail', userInfo.email); // Сохраняем email
    setUserEmail(userInfo.email);
    setUserEmail(userInfo.email); // Устанавливаем email
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUserRole(null);
    setUserEmail(''); // Сбрасываем email
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" />
            ) : (
              <AuthForm onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard
                setIsAuthenticated={setIsAuthenticated}
                role={userRole}
                userEmail={userEmail}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/profile"
          element={
            isAuthenticated ? (
              <Profile userEmail={userEmail} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/admin"
          element={
            isAuthenticated && userRole === 'admin' ? (
              <AdminPage />
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
