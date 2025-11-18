import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import CommissionerDashboard from "./components/CommissionerDashboard";
import EEPHDashboard from "./components/EEPHDashboard";
import SEPHDashboard from "./components/SEPHDashboard";
import ENCPHDashboard from "./components/ENCPHDashboard";
import CDMADashboard from "./components/CDMADashboard";
import { getUser, isAuthenticated, logout as apiLogout } from "./services/api";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [forwardedSubmissions, setForwardedSubmissions] = useState([]);

  // Check if user is authenticated on mount
  useEffect(() => {
    if (isAuthenticated()) {
      const storedUser = getUser();
      if (storedUser) {
        setUser(storedUser);
      }
    }
  }, []);

  // Handle login
  const handleLogin = (userData) => {
    setUser(userData);
  };

  // Handle logout
  const handleLogout = async () => {
    await apiLogout();
    setUser(null);
    setForwardedSubmissions([]);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <Navigate
                to={
                  user.role === "engineer"
                    ? "/admin"
                    : user.role === "Commissioner"
                    ? "/commissioner"
                    : user.role === "eeph"
                    ? "/eeph"
                    : user.role === "seph"
                    ? "/seph"
                    : user.role === "encph"
                    ? "/encph"
                    : user.role === "cdma"
                    ? "/cdma"
                    : "/"
                }
                replace
              />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/admin"
          element={
            user && user.role === "engineer" ? (
              <AdminDashboard
                user={user}
                logout={handleLogout}
                forwardedSubmissions={forwardedSubmissions}
                setForwardedSubmissions={setForwardedSubmissions}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/commissioner"
          element={
            user && user.role === "Commissioner" ? (
              <CommissionerDashboard
                user={user}
                logout={handleLogout}
                forwardedSubmissions={forwardedSubmissions}
                setForwardedSubmissions={setForwardedSubmissions}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/eeph"
          element={
            user && user.role === "eeph" ? (
              <EEPHDashboard
                user={user}
                logout={handleLogout}
                forwardedSubmissions={forwardedSubmissions}
                setForwardedSubmissions={setForwardedSubmissions}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/seph"
          element={
            user && user.role === "seph" ? (
              <SEPHDashboard
                user={user}
                logout={handleLogout}
                forwardedSubmissions={forwardedSubmissions}
                setForwardedSubmissions={setForwardedSubmissions}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/encph"
          element={
            user && user.role === "encph" ? (
              <ENCPHDashboard
                user={user}
                logout={handleLogout}
                forwardedSubmissions={forwardedSubmissions}
                setForwardedSubmissions={setForwardedSubmissions}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/cdma"
          element={
            user && user.role === "cdma" ? (
              <CDMADashboard
                user={user}
                logout={handleLogout}
                forwardedSubmissions={forwardedSubmissions}
                setForwardedSubmissions={setForwardedSubmissions}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
