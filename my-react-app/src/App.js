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
import { 
  initDB, 
  saveToIndexedDB, 
  loadFromIndexedDB, 
  migrateFromLocalStorage,
  getStorageInfo,
  clearAllWorks
} from "./services/storage";
import "./App.css";

function App() {
  const [forwardedSubmissions, setForwardedSubmissions] = useState([]);
  const [user, setUser] = useState(null);
  const [storageType, setStorageType] = useState('indexeddb'); // 'indexeddb' or 'localstorage'
  
  // Save forwardedSubmissions to storage whenever it changes
  useEffect(() => {
    // Skip saving if array is empty (to avoid overwriting with empty data on initial load)
    if (forwardedSubmissions.length === 0) {
      console.log("⏭️ App: Skipping save (empty array)");
      return;
    }
    
    console.log("💾 App: Preparing to save forwardedSubmissions");
    console.log("   - Count:", forwardedSubmissions.length);
    console.log("   - Storage type:", storageType);
    
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

    // Save to IndexedDB (preferred) or localStorage (fallback)
    if (storageType === 'indexeddb') {
      saveToIndexedDB(serializable).catch(error => {
        console.error("❌ App: Error saving to IndexedDB, falling back to localStorage:", error);
        // Fallback to localStorage
        try {
          const jsonString = JSON.stringify(serializable);
          localStorage.setItem('forwardedSubmissions', jsonString);
          setStorageType('localstorage');
          console.log("💾 App: Saved to localStorage (fallback):", forwardedSubmissions.length);
        } catch (e) {
          console.error("❌ App: Error saving to localStorage:", e);
          if (e.name === 'QuotaExceededError') {
            console.warn("⚠️ App: localStorage quota exceeded");
            try {
              localStorage.removeItem('forwardedSubmissions');
              localStorage.setItem('forwardedSubmissions', JSON.stringify(serializable.slice(-50)));
            } catch (err) {
              console.error("❌ App: Failed to save even after clearing:", err);
            }
          }
        }
      });
    } else if (storageType === 'localstorage') {
      // Save to localStorage
      try {
        const jsonString = JSON.stringify(serializable);
        localStorage.setItem('forwardedSubmissions', jsonString);
        console.log("💾 App: Saved to localStorage:", forwardedSubmissions.length);
        console.log("   - JSON size:", (jsonString.length / 1024).toFixed(2), "KB");
      } catch (error) {
        console.error("❌ App: Error saving to localStorage:", error);
        if (error.name === 'QuotaExceededError') {
          console.warn("⚠️ App: localStorage quota exceeded, trying IndexedDB");
          // Try IndexedDB as fallback
          saveToIndexedDB(serializable).then(() => {
            setStorageType('indexeddb');
            console.log("✅ App: Successfully saved to IndexedDB");
          }).catch(e => {
            console.error("❌ App: Failed to save to IndexedDB:", e);
            try {
              localStorage.removeItem('forwardedSubmissions');
              localStorage.setItem('forwardedSubmissions', JSON.stringify(serializable.slice(-50)));
            } catch (err) {
              console.error("❌ App: Failed to save even after clearing:", err);
            }
          });
        }
      }
    }
  }, [forwardedSubmissions, storageType]);
  
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

  // Make clearAllWorks available globally for console access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.clearAllWorks = async () => {
        try {
          await clearAllWorks();
          setForwardedSubmissions([]);
          alert('✅ All works data cleared successfully from localStorage and IndexedDB!');
          console.log('✅ All works cleared. Please refresh the page.');
        } catch (error) {
          console.error('❌ Error clearing works:', error);
          alert('❌ Error clearing works data. Check console for details.');
        }
      };
      console.log('💡 Tip: You can clear all works by calling window.clearAllWorks() in the console');
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.clearAllWorks;
      }
    };
  }, []);

  // Initialize storage and load data on mount
  useEffect(() => {
    const initializeStorage = async () => {
      // Check if user is authenticated
      if (isAuthenticated()) {
        const storedUser = getUser();
        if (storedUser) {
          setUser(storedUser);
        }
      }
      
      // Try to initialize IndexedDB and load data
      try {
        await initDB();
        const indexedData = await loadFromIndexedDB();
        
        if (indexedData && indexedData.length > 0) {
          console.log("✅ App: Loaded from IndexedDB:", indexedData.length, "items");
          setForwardedSubmissions(indexedData);
          setStorageType('indexeddb');
        } else {
          // Check localStorage and migrate if data exists
          const stored = localStorage.getItem('forwardedSubmissions');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.length > 0) {
              console.log("📦 App: Found data in localStorage, migrating to IndexedDB:", parsed.length);
              await migrateFromLocalStorage();
              setForwardedSubmissions(parsed);
              setStorageType('indexeddb');
            } else {
              console.log("📦 App: No data to load");
            }
          } else {
            console.log("📦 App: No data in storage");
          }
        }
      } catch (error) {
        console.error("❌ App: Error initializing IndexedDB, using localStorage:", error);
        // Fallback to localStorage
        try {
          const stored = localStorage.getItem('forwardedSubmissions');
          if (stored) {
            const parsed = JSON.parse(stored);
            console.log("📦 App: Loaded from localStorage (fallback):", parsed.length);
            setForwardedSubmissions(parsed);
            setStorageType('localstorage');
          }
        } catch (e) {
          console.error("❌ App: Error loading from localStorage:", e);
        }
      }
      
      // Log storage info
      try {
        const storageInfo = await getStorageInfo();
        if (storageInfo) {
          console.log("💾 Storage Info:", {
            quota: (storageInfo.quota / 1024 / 1024).toFixed(2) + " MB",
            usage: (storageInfo.usage / 1024 / 1024).toFixed(2) + " MB",
            available: (storageInfo.available / 1024 / 1024).toFixed(2) + " MB",
            percentage: storageInfo.percentage + "%"
          });
        }
      } catch (error) {
        console.log("⚠️ App: Could not get storage info");
      }
    };
    
    initializeStorage();
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
