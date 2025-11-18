import CONFIG from "../config.js";

// Token management
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

// Get stored token
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Get stored user
export const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

// Save token and user to localStorage
export const setAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Clear auth data (logout)
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// API request wrapper with automatic token attachment
export const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${CONFIG.API_BASE_URL}${endpoint}`;
  console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // If response is not JSON, use status text
        errorData = { message: response.statusText || `HTTP ${response.status}` };
      }

      // If token is invalid or expired, clear auth
      if (response.status === 401 || response.status === 403) {
        clearAuth();
        // Get the specific error message from backend
        // Backend returns: "Invalid username" or "Invalid password"
        const errorMessage = errorData && errorData.message ? errorData.message : "Authentication failed";
        
        console.log("🔍 API Error - Status:", response.status);
        console.log("🔍 API Error - errorData:", errorData);
        console.log("🔍 API Error - errorData.message:", errorData?.message);
        console.log("🔍 API Error - Final Message to throw:", errorMessage);
        
        // Create error with the EXACT message from backend
        const error = new Error(errorMessage);
        error.status = response.status;
        error.errorData = errorData;
        error.originalMessage = errorData?.message; // Store original message
        throw error;
      }
      // Include detailed error information if available
      const errorMessage = errorData.error 
        ? `${errorData.message || "Request failed"}: ${errorData.error}`
        : errorData.message || "Request failed";
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Handle network errors specifically
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.error("❌ Network Error: Failed to connect to server");
      console.error("   - Check if server is running on:", CONFIG.API_BASE_URL);
      console.error("   - Check CORS configuration");
      throw new Error("Unable to connect to server. Please ensure the server is running and accessible.");
    }
    
    // Re-throw other errors
    console.error("API Request Error:", error);
    throw error;
  }
};

// Login API call
export const login = async (username, password) => {
  console.log("\n");
  console.log("═══════════════════════════════════════════════════");
  console.log("🔐 FRONTEND: LOGIN REQUEST INITIATED");
  console.log("📝 Username:", username);
  console.log("🔑 Password:", "***");
  console.log("⏰ Request Time:", new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  
  try {
    const response = await apiRequest("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    if (response.success && response.token) {
      setAuth(response.token, response.user);
      
      console.log("✅ FRONTEND: LOGIN SUCCESSFUL");
      console.log("   - User:", response.user.username);
      console.log("   - Role:", response.user.role);
      console.log("   - Token received:", response.token.substring(0, 50) + "...");
      console.log("   - Token stored in localStorage");
      console.log("⏰ Login Time:", new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
      console.log("═══════════════════════════════════════════════════");
      console.log("\n");
      
      return response;
    }

    throw new Error(response.message || "Login failed");
  } catch (error) {
    console.log("❌ FRONTEND: LOGIN FAILED");
    console.log("   - Error message:", error.message);
    console.log("   - Error type:", error.constructor.name);
    console.log("   - Full error:", error);
    console.log("   - Error.errorData:", error.errorData);
    console.log("═══════════════════════════════════════════════════");
    console.log("\n");
    // Always preserve the error message - re-throw the same error
    // This ensures "Invalid username" or "Invalid password" is preserved
    throw error;
  }
};

// Validate username API call (for real-time validation)
export const validateUsername = async (username) => {
  console.log("🔍 FRONTEND: VALIDATE USERNAME REQUEST");
  console.log("   - Username:", username);
  
  try {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const url = `${CONFIG.API_BASE_URL}/validate-username`;
    console.log("   - URL:", url);
    
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ username }),
    });

    console.log("   - Response status:", response.status);
    console.log("   - Response ok:", response.ok);

    // Parse response regardless of status
    let data;
    try {
      const text = await response.text();
      console.log("   - Response text:", text);
      data = JSON.parse(text);
      console.log("   - Parsed data:", data);
    } catch (parseError) {
      console.error("❌ Error parsing validation response:", parseError);
      console.error("   - Response text might not be JSON");
      // If JSON parsing fails, don't show error - let user try login
      return { success: false, valid: null, message: "" };
    }
    
    // Check response status first
    if (!response.ok) {
      console.log("   - Response not OK, status:", response.status);
      // Even if response is not OK, check if we got valid data
      if (data && typeof data.valid === 'boolean') {
        return {
          success: data.valid,
          valid: data.valid,
          message: data.message || (data.valid ? "Username is valid" : "Invalid username")
        };
      }
      // If no valid data, return null to not show error
      return { success: false, valid: null, message: "" };
    }
    
    // Explicitly check if valid is false
    if (data.valid === false) {
      console.log("   - Result: Invalid username");
      return { success: false, valid: false, message: data.message || "Invalid username" };
    }
    
    // If valid is true, return success
    if (data.valid === true) {
      console.log("   - Result: Valid username");
      return { success: true, valid: true, message: data.message || "Username is valid" };
    }
    
    // If valid property doesn't exist or is undefined, don't show error
    console.log("   - Result: No valid property found, returning null");
    return { success: false, valid: null, message: "" };
  } catch (error) {
    console.error("❌ VALIDATE USERNAME ERROR:", error);
    console.error("   - Error name:", error.name);
    console.error("   - Error message:", error.message);
    
    // For validation endpoints, treat errors as invalid input
    // Check if it's a network error
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.log("   - Network error detected, returning null");
      // Network error - don't show validation error, let user try login
      return { success: false, valid: null, message: "" };
    }
    // For other errors, return invalid username
    console.log("   - Other error, returning invalid username");
    return { success: false, valid: false, message: "Invalid username" };
  }
};

// Verify token API call
export const verifyToken = async () => {
  try {
    const response = await apiRequest("/verify", {
      method: "GET",
    });
    return response;
  } catch (error) {
    clearAuth();
    throw error;
  }
};

// Logout API call (with server-side logging)
export const logout = async () => {
  const token = getToken();
  const user = getUser();
  
  console.log("\n");
  console.log("═══════════════════════════════════════════════════");
  console.log("🚪 FRONTEND: LOGOUT REQUEST INITIATED");
  
  if (user) {
    console.log("👤 User:", user.username);
    console.log("🎭 Role:", user.role);
  }
  
  console.log("⏰ Request Time:", new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  
  // Call logout endpoint if token exists
  if (token) {
    try {
      const response = await apiRequest("/logout", {
        method: "POST",
      });
      
      console.log("✅ FRONTEND: LOGOUT SUCCESSFUL");
      console.log("   - Server confirmed logout");
      if (response.logoutTime) {
        console.log("   - Logout Time:", response.logoutTime);
      }
    } catch (error) {
      // Even if server call fails, clear local auth
      console.log("⚠️ FRONTEND: Logout API error (clearing local auth anyway)");
      console.log("   - Error:", error.message);
    }
  } else {
    console.log("ℹ️  FRONTEND: No token found, clearing local auth");
  }
  
  // Clear auth data from localStorage
  clearAuth();
  
  console.log("   - Local storage cleared");
  console.log("   - Session terminated");
  console.log("⏰ Client Logout Time:", new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  console.log("═══════════════════════════════════════════════════");
  console.log("\n");
};

