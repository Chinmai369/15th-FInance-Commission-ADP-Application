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
  // Load forwardedSubmissions from localStorage on mount
  const [forwardedSubmissions, setForwardedSubmissions] = useState(() => {
    try {
      const stored = localStorage.getItem('forwardedSubmissions');
      console.log("📦 App: Attempting to load from localStorage");
      console.log("   - Stored value exists:", !!stored);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log("📦 App: Loaded forwardedSubmissions from localStorage:", parsed.length);
        console.log("   - Sample submission:", parsed[0] ? {
          id: parsed[0].id,
          status: parsed[0].status,
          section: parsed[0].forwardedTo?.section,
          proposal: parsed[0].proposal?.substring(0, 30)
        } : "none");
        return parsed;
      } else {
        console.log("📦 App: No data in localStorage, starting with empty array");
      }
    } catch (error) {
      console.error("❌ App: Error loading forwardedSubmissions from localStorage:", error);
      console.error("   - Error details:", error.message);
    }
    return [];
  });
  
  const [user, setUser] = useState(null);
  
  // Save forwardedSubmissions to localStorage whenever it changes
  useEffect(() => {
    // Skip saving if array is empty (to avoid overwriting with empty data on initial load)
    // But allow saving if we're updating existing data (when length changes from non-zero to non-zero)
    if (forwardedSubmissions.length === 0) {
      console.log("⏭️ App: Skipping save to localStorage (empty array)");
      return;
    }
    
    console.log("💾 App: Preparing to save forwardedSubmissions to localStorage");
    console.log("   - Count:", forwardedSubmissions.length);
    
    try {
      // Filter out any File objects before saving (they can't be serialized)
      const serializable = forwardedSubmissions.map(s => {
        const { workImage, detailedReport, committeeReport, councilResolution, ...rest } = s;
        return {
          ...rest,
          // Only include file properties if they're strings (base64), not File objects
          workImage: typeof workImage === 'string' ? workImage : (workImage ? '[File Object]' : null),
          detailedReport: typeof detailedReport === 'string' ? detailedReport : (detailedReport ? '[File Object]' : null),
          committeeReport: typeof committeeReport === 'string' ? committeeReport : (committeeReport ? '[File Object]' : null),
          councilResolution: typeof councilResolution === 'string' ? councilResolution : (councilResolution ? '[File Object]' : null),
        };
      });
      const jsonString = JSON.stringify(serializable);
      localStorage.setItem('forwardedSubmissions', jsonString);
      console.log("💾 App: Saved forwardedSubmissions to localStorage:", forwardedSubmissions.length);
      console.log("   - JSON size:", (jsonString.length / 1024).toFixed(2), "KB");
      console.log("   - Sample submission in save:", serializable[0] ? {
        id: serializable[0].id,
        status: serializable[0].status,
        section: serializable[0].forwardedTo?.section
      } : "none");
    } catch (error) {
      console.error("❌ App: Error saving forwardedSubmissions to localStorage:", error);
      // If error is due to size, try to clear and save again
      if (error.name === 'QuotaExceededError') {
        console.warn("⚠️ App: localStorage quota exceeded, clearing old data");
        try {
          localStorage.removeItem('forwardedSubmissions');
          localStorage.setItem('forwardedSubmissions', JSON.stringify(forwardedSubmissions.slice(-50))); // Keep only last 50
        } catch (e) {
          console.error("❌ App: Failed to save even after clearing:", e);
        }
      }
    }
  }, [forwardedSubmissions]);
  
  // Log when forwardedSubmissions state changes
  useEffect(() => {
    console.log("🔄 App: forwardedSubmissions state changed");
    console.log("   - Count:", forwardedSubmissions.length);
    console.log("   - Submissions:", forwardedSubmissions.map(s => ({
      id: s.id,
      status: s.status,
      proposal: s.proposal?.substring(0, 30) || 'N/A'
    })));
  }, [forwardedSubmissions]);

  // Check if user is authenticated on mount and reload forwardedSubmissions
  useEffect(() => {
    if (isAuthenticated()) {
      const storedUser = getUser();
      if (storedUser) {
        setUser(storedUser);
      }
    }
    
    // Also reload forwardedSubmissions from localStorage when component mounts
    // This ensures data is available even if state was reset
    try {
      const stored = localStorage.getItem('forwardedSubmissions');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log("🔄 App: Reloading forwardedSubmissions from localStorage on mount:", parsed.length);
        if (parsed.length > 0) {
          console.log("🔄 App: Setting forwardedSubmissions from localStorage");
          setForwardedSubmissions(parsed);
        }
      } else {
        console.log("🔄 App: No data in localStorage to reload");
      }
    } catch (error) {
      console.error("❌ App: Error reloading forwardedSubmissions:", error);
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
    // Don't clear forwardedSubmissions on logout - keep them for other users
    // setForwardedSubmissions([]);
    // localStorage will persist the data
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
