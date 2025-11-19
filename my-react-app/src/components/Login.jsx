import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login, validateUsername, sendOTP, verifyOTP } from "../services/api";

export default function Login({ onLogin }) {
  const [loginMode, setLoginMode] = useState("username"); // "username" or "mobile"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verifyingUsername, setVerifyingUsername] = useState(false);
  const [usernameVerified, setUsernameVerified] = useState(false);
  
  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [otpSentMessage, setOtpSentMessage] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  
  const navigate = useNavigate();

  // Automatically send OTP when mobile number is verified
  useEffect(() => {
    if (usernameVerified && loginMode === "mobile" && !otpSent && !sendingOTP) {
      // Automatically send OTP when mobile is verified
      const sendOTPAuto = async () => {
        setSendingOTP(true);
        setOtpError("");
        setOtpSentMessage("");

        try {
          const response = await sendOTP(username.trim());
          if (response.success) {
            setOtpSent(true);
            setOtpSentMessage("OTP sent successfully");
            // Auto-focus first OTP input field
            setTimeout(() => {
              const firstInput = document.getElementById("otp-0");
              if (firstInput) {
                firstInput.focus();
              }
            }, 100);
          }
        } catch (error) {
          setOtpError(error.message || "Failed to send OTP. Please try again.");
        } finally {
          setSendingOTP(false);
        }
      };
      
      sendOTPAuto();
    }
  }, [usernameVerified, loginMode, username, otpSent, sendingOTP]);

  // Handle login mode change
  const handleModeChange = (mode) => {
    if (mode !== loginMode) {
      setLoginMode(mode);
      setUsername("");
      setPassword("");
      setUsernameError("");
      setPasswordError("");
      setUsernameVerified(false);
      // Reset OTP states
      setOtpSent(false);
      setSendingOTP(false);
      setOtpSentMessage("");
      setOtp(["", "", "", ""]);
      setOtpError("");
      setVerifyingOTP(false);
    }
  };

  // Handle username/mobile verification
  const handleVerifyUsername = async () => {
    if (!username || username.trim() === "") {
      setUsernameError(loginMode === "mobile" ? "Mobile number is required" : "Username is required");
      return;
    }

    // Validate mobile number format if in mobile mode
    if (loginMode === "mobile") {
      const trimmedInput = username.trim();
      if (!/^\d{10}$/.test(trimmedInput)) {
        setUsernameError("Please enter a valid 10-digit mobile number");
        return;
      }
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
        console.log("✅ LOGIN COMPONENT: Username/Mobile is valid");
        setUsernameVerified(true);
        setUsernameError("");
      } else if (result && result.valid === false) {
        console.log("❌ LOGIN COMPONENT: Username/Mobile is invalid");
        setUsernameVerified(false);
        // Use the message from backend, or show appropriate default based on mode
        const errorMsg = result.message || (loginMode === "mobile" ? "Invalid mobile number" : "Invalid username");
        setUsernameError(errorMsg);
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
        // Use appropriate error message based on login mode
        const errorMsg = loginMode === "mobile" 
          ? (error.message.includes("mobile") ? error.message : "Invalid mobile number")
          : (error.message.includes("username") ? error.message : "Invalid username");
        setUsernameError(errorMsg);
      } else {
        setUsernameError("Unable to verify. Please try again.");
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
      // Reset OTP states for mobile mode
      if (loginMode === "mobile") {
        setOtpSent(false);
        setOtpSentMessage("");
        setOtp(["", "", "", ""]);
        setOtpError("");
      }
    }
    setUsernameError(""); // Clear error when user starts typing
  };

  // Handle Send OTP
  const handleSendOTP = async () => {
    if (!usernameVerified) {
      setUsernameError("Please verify your mobile number first");
      return;
    }

    setSendingOTP(true);
    setOtpError("");
    setOtpSentMessage("");

    try {
      const response = await sendOTP(username.trim());
      if (response.success) {
        setOtpSent(true);
        setOtpSentMessage("OTP sent successfully");
      }
    } catch (error) {
      setOtpError(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setSendingOTP(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError("");

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{4}$/.test(pastedData)) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      setOtpError("");
      // Focus last input
      const lastInput = document.getElementById("otp-3");
      if (lastInput) {
        lastInput.focus();
      }
    }
  };

  const handleLogin = async () => {
    // Clear any previous errors
    setPasswordError("");
    setOtpError("");
    
    // Check if username/mobile is verified
    if (!usernameVerified) {
      setUsernameError(loginMode === "mobile" ? "Please verify your mobile number first" : "Please verify your username first");
      return;
    }

    // For mobile mode, verify OTP instead of password
    if (loginMode === "mobile") {
      const otpString = otp.join("");
      if (!otpString || otpString.length !== 4) {
        setOtpError("Please enter the 4-digit OTP");
        return;
      }

      if (!otpSent) {
        setOtpError("Please send OTP first");
        return;
      }

      setVerifyingOTP(true);

      try {
        const response = await verifyOTP(username.trim(), otpString);
        
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
        // Use the error message from backend, ensuring it's about 4-digit OTP
        let errorMessage = error.message || "Invalid OTP. Please try again.";
        // Replace any old 6-digit references with 4-digit
        errorMessage = errorMessage.replace(/6-digit/g, "4-digit").replace(/6 digit/g, "4-digit");
        setOtpError(errorMessage);
      } finally {
        setVerifyingOTP(false);
      }
      return;
    }
    
    // For username mode, use password
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
          {/* Toggle Buttons */}
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => handleModeChange("username")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                loginMode === "username"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Login with Username
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("mobile")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                loginMode === "mobile"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Login with Mobile
            </button>
          </div>

          <div>
            <label className="text-gray-700 text-sm font-medium">
              {loginMode === "mobile" ? "Mobile Number" : "Username"}
            </label>
            <div className="flex gap-2 mt-2">
              <input
                type={loginMode === "mobile" ? "tel" : "text"}
                value={username}
                onChange={handleUsernameChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && username.trim() && !usernameVerified) {
                    e.preventDefault();
                    handleVerifyUsername();
                  }
                }}
                className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  usernameError ? "border-red-500 bg-red-50" : usernameVerified ? "border-green-500 bg-green-50" : "border-gray-300"
                }`}
                placeholder={loginMode === "mobile" ? "Enter 10-digit mobile number" : "Enter username"}
                autoComplete={loginMode === "mobile" ? "tel" : "username"}
                maxLength={loginMode === "mobile" ? 10 : undefined}
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
                {loginMode === "mobile" ? "Mobile number verified" : "Username verified"}
              </p>
            )}
          </div>

          {usernameVerified && loginMode === "username" && (
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

          {/* OTP Flow for Mobile Login */}
          {usernameVerified && loginMode === "mobile" && (
            <>
              {/* Show loading message while sending OTP */}
              {sendingOTP && !otpSent && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 flex items-center gap-2">
                    <span className="text-blue-600 font-bold">⏳</span>
                    Sending OTP...
                  </p>
                </div>
              )}

              {/* OTP Sent Success Message */}
              {otpSent && otpSentMessage && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 flex items-center gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    {otpSentMessage}
                  </p>
                </div>
              )}

              {/* Show error if OTP sending failed */}
              {otpError && !otpSent && !sendingOTP && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span>⚠</span>
                  {otpError}
                </p>
              )}

              {/* OTP Input Fields - Show when OTP is sent or while sending */}
              {(otpSent || sendingOTP) && (
                <div>
                  <label className="text-gray-700 text-sm font-medium">Enter OTP</label>
                  <div className="flex gap-2 mt-2" onPaste={handleOtpPaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        disabled={sendingOTP}
                        className={`w-full h-14 text-center text-xl font-semibold border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          otpError ? "border-red-500 bg-red-50" : sendingOTP ? "border-gray-300 bg-gray-100 cursor-not-allowed" : "border-gray-300"
                        }`}
                        placeholder="0"
                      />
                    ))}
                  </div>
                  {otpError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <span>⚠</span>
                      {otpError}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Remember / Forgot - Only show if username is verified and in username mode */}
          {usernameVerified && loginMode === "username" && (
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

          {/* Login Button - Show for username mode immediately, for mobile mode only after OTP is sent */}
          {usernameVerified && (
            <>
              {loginMode === "username" && (
                <button
                  onClick={handleLogin}
                  disabled={loading || !password.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg shadow-md transition-all"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              )}
              {loginMode === "mobile" && otpSent && (
                <button
                  onClick={handleLogin}
                  disabled={verifyingOTP || otp.join("").length !== 4}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg shadow-md transition-all"
                >
                  {verifyingOTP ? "Verifying OTP..." : "Login"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
