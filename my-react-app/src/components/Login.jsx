import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, validateUsername } from "../services/api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verifyingUsername, setVerifyingUsername] = useState(false);
  const [usernameVerified, setUsernameVerified] = useState(false);
  const navigate = useNavigate();

  // Handle username verification
  const handleVerifyUsername = async () => {
    if (!username || username.trim() === "") {
      setUsernameError("Username is required");
      return;
    }

    setVerifyingUsername(true);
    setUsernameError("");
    setUsernameVerified(false);

    try {
      console.log("🔍 LOGIN COMPONENT: Calling validateUsername with:", username);
      const result = await validateUsername(username);
      console.log("🔍 LOGIN COMPONENT: Validation result:", result);
      
      // Check if result is valid
      if (result && result.valid === true) {
        console.log("✅ LOGIN COMPONENT: Username is valid");
        setUsernameVerified(true);
        setUsernameError("");
      } else if (result && result.valid === false) {
        console.log("❌ LOGIN COMPONENT: Username is invalid");
        setUsernameVerified(false);
        setUsernameError(result.message || "Invalid username");
      } else {
        // valid is null or undefined - don't show error, but don't mark as verified
        console.log("⚠️ LOGIN COMPONENT: Validation result unclear, not showing error");
        setUsernameVerified(false);
        setUsernameError("");
      }
    } catch (error) {
      console.error("❌ LOGIN COMPONENT: Verification error:", error);
      setUsernameVerified(false);
      if (error.message && !error.message.includes("Failed to fetch")) {
        setUsernameError("Invalid username");
      } else {
        setUsernameError("Unable to verify username. Please try again.");
      }
    } finally {
      setVerifyingUsername(false);
    }
  };

  // Reset verification when username changes
  const handleUsernameChange = (e) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    // Reset verification state when username changes
    if (usernameVerified) {
      setUsernameVerified(false);
      setPassword(""); // Clear password when username changes
    }
    setUsernameError(""); // Clear error when user starts typing
  };

  const handleLogin = async () => {
    // Clear any previous errors
    setPasswordError("");
    
    // Check if username is verified
    if (!usernameVerified) {
      setUsernameError("Please verify your username first");
      return;
    }
    
    if (!password) {
      setPasswordError("Password is required");
      console.log("⚠️ LOGIN: Validation failed - missing password");
      return;
    }

    setLoading(true);

    try {
      // Call backend API for authentication
      const response = await login(username, password);

      if (response.success && response.user) {
        const { role, username: user } = response.user;
        
        console.log("🔄 LOGIN COMPONENT: Updating app state and redirecting...");
        console.log("   - Redirecting to:", role === "engineer" ? "/admin" : `/${role}`);
        
        onLogin({ role, username: user }); // ✅ Update app state

        // ✅ Redirect based on user role
        switch (role) {
          case "engineer":
            navigate("/admin");
            break;
          case "Commissioner":
            navigate("/commissioner");
            break;
          case "eeph":
            navigate("/eeph");
            break;
          case "seph":
            navigate("/seph");
            break;
          case "encph":
            navigate("/encph");
            break;
          case "cdma":
            navigate("/cdma");
            break;
          default:
            navigate("/");
            break;
        }
      }
    } catch (error) {
      // Get the specific error message from backend
      // Backend returns: "Invalid username" or "Invalid password"
      console.log("❌ LOGIN COMPONENT: Error caught");
      console.log("   - Full error object:", error);
      console.log("   - error.message:", error?.message);
      console.log("   - error.originalMessage:", error?.originalMessage);
      console.log("   - error.errorData:", error?.errorData);
      console.log("   - error.errorData?.message:", error?.errorData?.message);
      
      // Priority order: error.message > error.originalMessage > error.errorData.message
      let errorMessage = null;
      
      // Priority 1: Check error.message (should have the backend message)
      if (error?.message && error.message.trim() !== "") {
        errorMessage = error.message;
        console.log("   ✓ Using error.message:", errorMessage);
      }
      // Priority 2: Check error.originalMessage
      else if (error?.originalMessage && error.originalMessage.trim() !== "") {
        errorMessage = error.originalMessage;
        console.log("   ✓ Using error.originalMessage:", errorMessage);
      }
      // Priority 3: Check error.errorData.message
      else if (error?.errorData?.message && error.errorData.message.trim() !== "") {
        errorMessage = error.errorData.message;
        console.log("   ✓ Using error.errorData.message:", errorMessage);
      }
      
      // Display error in the appropriate field
      if (errorMessage) {
        if (errorMessage.toLowerCase().includes("username")) {
          setUsernameError(errorMessage);
        } else if (errorMessage.toLowerCase().includes("password")) {
          setPasswordError(errorMessage);
        }
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-amber-100 to-yellow-100 p-6 font-sans">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-md p-8 transition-all hover:-translate-y-1">
        {/* Government Seal */}
        <div className="flex justify-center mb-4">
         <img
  src="/ap-logo.jpeg"
  alt="Government Seal"
  className="w-20 h-20 object-contain"
/>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 leading-tight">
            15th Finance Commission
          </h1>
          <p className="text-gray-500 text-sm">Government of Andhra Pradesh</p>
        </div>


        {/* Login Form */}
        <div className="space-y-5">
          <div>
            <label className="text-gray-700 text-sm font-medium">Username</label>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  usernameError ? "border-red-500 bg-red-50" : usernameVerified ? "border-green-500 bg-green-50" : "border-gray-300"
                }`}
                placeholder="Enter username"
                autoComplete="username"
                disabled={verifyingUsername}
              />
              <button
                type="button"
                onClick={handleVerifyUsername}
                disabled={verifyingUsername || !username.trim() || usernameVerified}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md transition-all whitespace-nowrap"
              >
                {verifyingUsername ? "Verifying..." : usernameVerified ? "Verified" : "Verify"}
              </button>
            </div>
            {usernameError && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <span>⚠</span>
                {usernameError}
              </p>
            )}
            {usernameVerified && !usernameError && (
              <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                <span>✓</span>
                Username verified
              </p>
            )}
          </div>

          {usernameVerified && (
            <div>
              <label className="text-gray-700 text-sm font-medium">Password</label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    // Clear error when user starts typing
                    setPasswordError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading && usernameVerified) {
                      handleLogin();
                    }
                  }}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    passwordError ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <span>⚠</span>
                  {passwordError}
                </p>
              )}
            </div>
          )}

          {/* Remember / Forgot - Only show if username is verified */}
          {usernameVerified && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="accent-blue-600" />
                <span>Remember me</span>
              </label>
              <a href="#" className="text-blue-600 hover:underline">
                Forgot password?
              </a>
            </div>
          )}

          {/* Login Button - Only show if username is verified */}
          {usernameVerified && (
            <button
              onClick={handleLogin}
              disabled={loading || !password.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg shadow-md transition-all"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
