import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import sql, { testConnection } from "./db.js";

const app = express();

const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log("⚠️ CORS: Request with no origin (allowed)");
      return callback(null, true);
    }
    
    console.log(`🌐 CORS: Checking origin: ${origin}`);
    console.log(`   - Allowed origins: ${allowedOrigins.join(', ')}`);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`;
      console.error(`❌ CORS: Origin rejected - ${origin}`);
      return callback(new Error(msg), false);
    }
    
    console.log(`✅ CORS: Origin allowed - ${origin}`);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));
// app.use(cors({
//   origin: 'http://localhost:3001',
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
// }));
app.use(express.json());

// Health check endpoint (before authentication middleware)
app.get("/api/health", (req, res) => {
  res.json({ 
    success: true, 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  if (req.method === "POST" && req.path === "/api/login") {
    console.log("⚠️ LOGIN REQUEST DETECTED - Detailed logs will follow!");
  }
  // Log CORS origin for debugging
  if (req.headers.origin) {
    console.log(`   - Origin: ${req.headers.origin}`);
  }
  next();
});

// JWT Secret Key - In production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// JWT Token expiration time (7 days)
const JWT_EXPIRATION = "7d";

// Hardcoded credentials
const CREDENTIALS = {
  // Admin Dashboard - Static mobile number for easy access
  admin: { username: "Venkatesh", password: "admin123", role: "engineer", id: 1, mobile: "9999999999" },
  commissioner: { username: "Ramesh", password: "comm123", role: "Commissioner", id: 2, mobile: "9876543211" },
  eeph: { username: "Priya", password: "eeph123", role: "eeph", id: 3, mobile: "9876543212" },
  seph: { username: "Suresh", password: "seph123", role: "seph", id: 4, mobile: "9876543213" },
  encph: { username: "Karthik", password: "encph123", role: "encph", id: 5, mobile: "9876543214" },
  cdma: { username: "Srinivas", password: "cdma123", role: "cdma", id: 6, mobile: "9876543215" },
};

// OTP storage (in-memory, expires after 5 minutes)
const OTP_STORAGE = {};

// Generate random 4-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Clean expired OTPs
const cleanExpiredOTPs = () => {
  const now = Date.now();
  Object.keys(OTP_STORAGE).forEach(mobile => {
    if (OTP_STORAGE[mobile].expiresAt < now) {
      delete OTP_STORAGE[mobile];
    }
  });
};

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  console.log("🔒 TOKEN VERIFICATION REQUEST");
  console.log("   - Endpoint:", req.path);
  console.log("   - Method:", req.method);
  
  const authHeader = req.headers["authorization"];
  console.log("   - Authorization header:", authHeader ? "present" : "missing");

  if (!authHeader) {
    console.log("❌ TOKEN VERIFICATION FAILED: No authorization header");
    console.log("═══════════════════════════════════════════════════");
    return res.status(401).json({ success: false, message: "Access token required" });
  }

  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
  console.log("   - Token extracted:", token ? "yes" : "no");
  console.log("   - Token length:", token ? token.length : 0);

  if (!token) {
    console.log("❌ TOKEN VERIFICATION FAILED: Token not found in header");
    console.log("═══════════════════════════════════════════════════");
    return res.status(401).json({ success: false, message: "Access token required" });
  }

  console.log("🔍 VERIFYING JWT TOKEN...");
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log("❌ TOKEN VERIFICATION FAILED");
      console.log("   - Error:", err.name);
      console.log("   - Message:", err.message);
      console.log("═══════════════════════════════════════════════════");
      return res.status(403).json({ success: false, message: "Invalid or expired token" });
    }
    
    console.log("✅ TOKEN VERIFICATION SUCCESSFUL");
    console.log("   - User ID:", user.id);
    console.log("   - Username:", user.username);
    console.log("   - Role:", user.role);
    console.log("   - Issued at:", new Date(user.iat * 1000).toISOString());
    if (user.exp) {
      console.log("   - Expires at:", new Date(user.exp * 1000).toISOString());
    }
    console.log("═══════════════════════════════════════════════════");
    
    req.user = user;
    next();
  });
};

// Helper function to format time for display (Indian Standard Time - IST)
const formatTime = () => {
  const now = new Date();
  
  // Get UTC components
  const utcDate = now.getUTCDate();
  const utcMonth = now.getUTCMonth();
  const utcYear = now.getUTCFullYear();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const utcSeconds = now.getUTCSeconds();
  
  // Convert to IST by adding 5 hours 30 minutes
  let istHours = utcHours + 5;
  let istMinutes = utcMinutes + 30;
  let istDate = utcDate;
  let istMonth = utcMonth;
  let istYear = utcYear;
  
  // Handle minute overflow (>= 60)
  if (istMinutes >= 60) {
    istMinutes -= 60;
    istHours += 1;
  }
  
  // Handle hour overflow (>= 24)
  if (istHours >= 24) {
    istHours -= 24;
    istDate += 1;
    
    // Handle date overflow based on month
    const daysInMonth = new Date(istYear, istMonth + 1, 0).getDate();
    if (istDate > daysInMonth) {
      istDate = 1;
      istMonth += 1;
      
      // Handle month overflow
      if (istMonth >= 12) {
        istMonth = 0;
        istYear += 1;
      }
    }
  }
  
  // Format: DD/MM/YYYY HH:MM:SS IST
  const day = String(istDate).padStart(2, '0');
  const month = String(istMonth + 1).padStart(2, '0');
  const year = String(istYear);
  const hours = String(istHours).padStart(2, '0');
  const minutes = String(istMinutes).padStart(2, '0');
  const seconds = String(utcSeconds).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds} IST`;
};

// LOGIN API with JWT (no database)
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const timestamp = formatTime();
  const isoTime = new Date().toISOString();
  
  // Force output immediately
  process.stdout.write("\n");
  console.log("═══════════════════════════════════════════════════");
  console.log("🔐 JWT LOGIN REQUEST RECEIVED");
  console.log("📝 Username:", username || "not provided");
  console.log("🔑 Password:", password ? "***" : "not provided");
  console.log("⏰ Login Time:", timestamp);
  console.log("🌐 ISO Timestamp:", isoTime);
  process.stdout.write("\n");

  try {
    if (!username || !password) {
      console.log("❌ VALIDATION FAILED: Missing username or password");
      console.log("═══════════════════════════════════════════════════");
      return res.status(400).json({ 
        success: false, 
        message: "Username and password are required" 
      });
    }

    console.log("🔍 Searching for user in credentials...");
    console.log("   - Available credentials:", Object.keys(CREDENTIALS).join(", "));
    console.log("   - Available usernames:", Object.values(CREDENTIALS).map(c => c.username).join(", "));
    console.log("   - Available mobile numbers:", Object.values(CREDENTIALS).map(c => c.mobile).join(", "));
    console.log("   - Looking for username/mobile:", username);
    console.log("   - Input trimmed:", username.trim());
    
    // Check if input is a mobile number (10 digits) or username
    const trimmedInput = username.trim();
    const isMobileNumber = /^\d{10}$/.test(trimmedInput);
    
    let userCredential;
    if (isMobileNumber) {
      // Search by mobile number
      console.log("   - Detected as mobile number");
      userCredential = Object.values(CREDENTIALS).find(
        (cred) => cred.mobile === trimmedInput
      );
    } else {
      // Search by username - case-insensitive
      console.log("   - Detected as username");
      userCredential = Object.values(CREDENTIALS).find(
        (cred) => cred.username.toLowerCase() === trimmedInput.toLowerCase()
      );
    }

    if (!userCredential) {
      console.log("❌ AUTHENTICATION FAILED: Username/Mobile not found");
      console.log("   - Attempted input:", username);
      console.log("   - Input type:", isMobileNumber ? "mobile" : "username");
      console.log("   - Available usernames:", Object.values(CREDENTIALS).map(c => c.username).join(", "));
      console.log("   - Available mobile numbers:", Object.values(CREDENTIALS).map(c => c.mobile).join(", "));
      console.log("═══════════════════════════════════════════════════");
      return res.status(401).json({ 
        success: false, 
        message: isMobileNumber ? "Invalid mobile number" : "Invalid username",
        errorType: "username"
      });
    }

    // Username exists, now check password (check password second)
    if (userCredential.password !== password) {
      console.log("❌ AUTHENTICATION FAILED: Password incorrect");
      console.log("   - Username:", username);
      console.log("   - Password mismatch");
      console.log("═══════════════════════════════════════════════════");
      return res.status(401).json({ 
        success: false, 
        message: "Invalid password",
        errorType: "password"
      });
    }

    console.log("✅ USER FOUND");
    console.log("   - User ID:", userCredential.id);
    console.log("   - Username:", userCredential.username);
    console.log("   - Role:", userCredential.role);
    
    console.log("🔨 GENERATING JWT TOKEN...");
    const tokenPayload = { 
      id: userCredential.id,
      username: userCredential.username, 
      role: userCredential.role 
    };
    console.log("   - Token payload:", JSON.stringify(tokenPayload, null, 2));
    console.log("   - Token expiration:", JWT_EXPIRATION);

    // Generate JWT token
    const token = jwt.sign(
      tokenPayload,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    console.log("✅ JWT TOKEN GENERATED SUCCESSFULLY");
    console.log("   - Token length:", token.length, "characters");
    console.log("   - Token preview:", token.substring(0, 50) + "...");
    console.log("🎉 LOGIN SUCCESSFUL");
    console.log("   - User:", userCredential.username);
    console.log("   - Role:", userCredential.role);
    console.log("   - Login Time:", timestamp);
    console.log("═══════════════════════════════════════════════════");
    
      return res.json({
        success: true,
        message: "Login successful",
      token, // JWT token
      user: {
        username: userCredential.username,
        role: userCredential.role,
      },
    });
  } catch (error) {
    console.error("❌ LOGIN ERROR OCCURRED");
    console.error("   - Error type:", error.constructor.name);
    console.error("   - Error message:", error.message);
    console.error("   - Stack trace:", error.stack);
    console.log("═══════════════════════════════════════════════════");
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Validate Username/Mobile Endpoint (for real-time validation)
app.post("/api/validate-username", (req, res) => {
  const { username } = req.body;
  
  console.log("🔍 VALIDATE USERNAME/MOBILE REQUEST");
  console.log("   - Input received:", username || "not provided");
  console.log("   - Input trimmed:", username ? username.trim() : "N/A");
  console.log("   - Available usernames:", Object.values(CREDENTIALS).map(c => c.username).join(", "));
  console.log("   - Available mobile numbers:", Object.values(CREDENTIALS).map(c => c.mobile).join(", "));
  
  try {
    if (!username || username.trim() === "") {
      console.log("   - Result: Username/Mobile is required");
      return res.status(400).json({ 
        valid: false, 
        message: "Username or mobile number is required" 
      });
    }

    const trimmedInput = username.trim();
    
    // Check if input is a mobile number (10 digits) or username
    const isMobileNumber = /^\d{10}$/.test(trimmedInput);
    
    console.log("   - Input after trim:", trimmedInput);
    console.log("   - Is mobile number (10 digits)?", isMobileNumber);
    console.log("   - All available mobile numbers:", Object.values(CREDENTIALS).map(c => `${c.username}: ${c.mobile}`).join(", "));
    
    let userCredential;
    if (isMobileNumber) {
      // Search by mobile number
      console.log("   - Detected as mobile number, searching...");
      userCredential = Object.values(CREDENTIALS).find(
        (cred) => cred.mobile === trimmedInput
      );
      console.log("   - Mobile search result:", userCredential ? `Found: ${userCredential.username}` : "Not found");
    } else {
      // Search by username (case-insensitive comparison)
      console.log("   - Detected as username, searching...");
      userCredential = Object.values(CREDENTIALS).find(
        (cred) => cred.username.toLowerCase() === trimmedInput.toLowerCase()
      );
      console.log("   - Username search result:", userCredential ? `Found: ${userCredential.username}` : "Not found");
    }

    if (!userCredential) {
      console.log("   - Result: Invalid username/mobile");
      console.log("   - Searched for:", trimmedInput);
      console.log("   - Input type:", isMobileNumber ? "mobile" : "username");
      console.log("   - Available mobiles:", Object.values(CREDENTIALS).map(c => c.mobile).join(", "));
      return res.status(200).json({ 
        valid: false, 
        message: isMobileNumber ? "Invalid mobile number" : "Invalid username" 
      });
    }

    console.log("   - Result: Valid username/mobile");
    console.log("   - Matched user:", userCredential.username);
    console.log("   - Mobile:", userCredential.mobile);
    console.log("   - Role:", userCredential.role);
    return res.status(200).json({ 
      valid: true, 
      message: isMobileNumber ? "Mobile number is valid" : "Username is valid" 
    });
  } catch (error) {
    console.error("❌ VALIDATE USERNAME/MOBILE ERROR");
    console.error("   - Error:", error.message);
    console.error("   - Stack:", error.stack);
    return res.status(500).json({ 
      valid: false, 
      message: "Server error" 
    });
  }
});

// Verify Token Endpoint (for checking if token is valid)
app.get("/api/verify", authenticateToken, (req, res) => {
  console.log("✅ TOKEN VERIFY ENDPOINT CALLED");
  console.log("   - User authenticated:", req.user.username);
  console.log("   - Role:", req.user.role);
  console.log("═══════════════════════════════════════════════════");
  
  res.json({
    success: true,
    user: req.user,
  });
});

// Send OTP Endpoint
app.post("/api/send-otp", (req, res) => {
  const { mobile } = req.body;
  const timestamp = formatTime();
  
  console.log("\n");
  console.log("═══════════════════════════════════════════════════");
  console.log("📱 SEND OTP REQUEST RECEIVED");
  console.log("   - Mobile:", mobile || "not provided");
  console.log("⏰ Request Time:", timestamp);
  
  try {
    if (!mobile || !/^\d{10}$/.test(mobile.trim())) {
      console.log("❌ VALIDATION FAILED: Invalid mobile number");
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit mobile number is required"
      });
    }

    const trimmedMobile = mobile.trim();
    
    // Check if mobile number exists in credentials
    const userCredential = Object.values(CREDENTIALS).find(
      (cred) => cred.mobile === trimmedMobile
    );

    if (!userCredential) {
      console.log("❌ MOBILE NOT FOUND");
      console.log("   - Mobile:", trimmedMobile);
      return res.status(404).json({
        success: false,
        message: "Mobile number not registered"
      });
    }

    // Clean expired OTPs
    cleanExpiredOTPs();

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP
    OTP_STORAGE[trimmedMobile] = {
      otp,
      expiresAt,
      userId: userCredential.id,
      username: userCredential.username,
      role: userCredential.role
    };

    console.log("✅ OTP GENERATED");
    console.log("   - Mobile:", trimmedMobile);
    console.log("   - OTP:", otp);
    console.log("   - Expires at:", new Date(expiresAt).toISOString());
    console.log("   - User:", userCredential.username);
    console.log("   - Role:", userCredential.role);
    console.log("═══════════════════════════════════════════════════");
    console.log("\n");

    // In production, send OTP via SMS service here
    // For now, we'll return it (in production, don't return OTP)
    res.json({
      success: true,
      message: "OTP sent successfully",
      // Remove this in production - OTP should only be sent via SMS
      // otp: otp // For testing only
    });
  } catch (error) {
    console.error("❌ SEND OTP ERROR");
    console.error("   - Error:", error.message);
    console.error("   - Stack:", error.stack);
    console.log("═══════════════════════════════════════════════════");
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Verify OTP and Login Endpoint
app.post("/api/verify-otp", (req, res) => {
  const { mobile, otp } = req.body;
  const timestamp = formatTime();
  const isoTime = new Date().toISOString();
  
  console.log("\n");
  console.log("═══════════════════════════════════════════════════");
  console.log("🔐 VERIFY OTP REQUEST RECEIVED");
  console.log("   - Mobile:", mobile || "not provided");
  console.log("   - OTP:", otp ? "***" : "not provided");
  console.log("⏰ Request Time:", timestamp);
  
  try {
    if (!mobile || !/^\d{10}$/.test(mobile.trim())) {
      console.log("❌ VALIDATION FAILED: Invalid mobile number");
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit mobile number is required"
      });
    }

    if (!otp || !/^\d{4}$/.test(otp.trim())) {
      console.log("❌ VALIDATION FAILED: Invalid OTP format");
      return res.status(400).json({
        success: false,
        message: "Valid 4-digit OTP is required"
      });
    }

    const trimmedMobile = mobile.trim();
    const trimmedOTP = otp.trim();

    // Clean expired OTPs
    cleanExpiredOTPs();

    // Check if OTP exists and is valid
    const otpData = OTP_STORAGE[trimmedMobile];

    if (!otpData) {
      console.log("❌ OTP NOT FOUND OR EXPIRED");
      return res.status(401).json({
        success: false,
        message: "OTP expired or not found. Please request a new OTP."
      });
    }

    if (otpData.expiresAt < Date.now()) {
      delete OTP_STORAGE[trimmedMobile];
      console.log("❌ OTP EXPIRED");
      return res.status(401).json({
        success: false,
        message: "OTP expired. Please request a new OTP."
      });
    }

    if (otpData.otp !== trimmedOTP) {
      console.log("❌ OTP MISMATCH");
      console.log("   - Expected:", otpData.otp);
      console.log("   - Received:", trimmedOTP);
      return res.status(401).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    // OTP is valid, get user credentials
    const userCredential = Object.values(CREDENTIALS).find(
      (cred) => cred.id === otpData.userId
    );

    if (!userCredential) {
      console.log("❌ USER NOT FOUND");
      delete OTP_STORAGE[trimmedMobile];
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Generate JWT token
    const tokenPayload = {
      id: userCredential.id,
      username: userCredential.username,
      role: userCredential.role
    };

    const token = jwt.sign(
      tokenPayload,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    // Delete OTP after successful verification
    delete OTP_STORAGE[trimmedMobile];

    console.log("✅ OTP VERIFIED SUCCESSFULLY");
    console.log("   - Mobile:", trimmedMobile);
    console.log("   - User:", userCredential.username);
    console.log("   - Role:", userCredential.role);
    console.log("   - Token generated");
    console.log("🎉 LOGIN SUCCESSFUL");
    console.log("   - Login Time:", timestamp);
    console.log("═══════════════════════════════════════════════════");
    console.log("\n");

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        username: userCredential.username,
        role: userCredential.role,
      },
    });
  } catch (error) {
    console.error("❌ VERIFY OTP ERROR");
    console.error("   - Error:", error.message);
    console.error("   - Stack:", error.stack);
    console.log("═══════════════════════════════════════════════════");
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


// Logout Endpoint - Allow logout even without valid token (for edge cases)
app.post("/api/logout", (req, res, next) => {
  // Try to authenticate, but don't fail if token is invalid
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err && user) {
        req.user = user;
      }
      // Continue even if verification fails
      next();
    });
  } else {
    next();
  }
}, (req, res) => {
  const timestamp = formatTime();
  const isoTime = new Date().toISOString();
  
  process.stdout.write("\n");
  console.log("═══════════════════════════════════════════════════");
  console.log("🚪 JWT LOGOUT REQUEST RECEIVED");
  
  if (req.user) {
    const user = req.user;
    console.log("👤 User:", user.username);
    console.log("🎭 Role:", user.role);
    console.log("🆔 User ID:", user.id);
    console.log("📝 Session Duration: Calculating...");
    
    // Calculate session duration if we have issued at time
    if (user.iat) {
      const sessionStart = new Date(user.iat * 1000);
      const sessionEnd = new Date();
      const duration = Math.floor((sessionEnd - sessionStart) / 1000); // seconds
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      const seconds = duration % 60;
      
      // Format session start and end times in IST
      const formatIST = (date) => {
        const utcDate = date.getUTCDate();
        const utcMonth = date.getUTCMonth();
        const utcYear = date.getUTCFullYear();
        const utcHours = date.getUTCHours();
        const utcMinutes = date.getUTCMinutes();
        const utcSeconds = date.getUTCSeconds();
        
        // Convert to IST by adding 5 hours 30 minutes
        let istHours = utcHours + 5;
        let istMinutes = utcMinutes + 30;
        let istDate = utcDate;
        let istMonth = utcMonth;
        let istYear = utcYear;
        
        // Handle minute overflow
        if (istMinutes >= 60) {
          istMinutes -= 60;
          istHours += 1;
        }
        
        // Handle hour overflow
        if (istHours >= 24) {
          istHours -= 24;
          istDate += 1;
          
          const daysInMonth = new Date(istYear, istMonth + 1, 0).getDate();
          if (istDate > daysInMonth) {
            istDate = 1;
            istMonth += 1;
            if (istMonth >= 12) {
              istMonth = 0;
              istYear += 1;
            }
          }
        }
        
        const day = String(istDate).padStart(2, '0');
        const month = String(istMonth + 1).padStart(2, '0');
        const year = String(istYear);
        const hours = String(istHours).padStart(2, '0');
        const mins = String(istMinutes).padStart(2, '0');
        const secs = String(utcSeconds).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${mins}:${secs} IST`;
      };
      
      console.log("   - Session started:", formatIST(sessionStart));
      console.log("   - Session ended:", formatIST(sessionEnd));
      console.log(`   - Duration: ${hours}h ${minutes}m ${seconds}s`);
    }
  } else {
    console.log("ℹ️  No valid token found (logout without session)");
  }
  
  console.log("⏰ Logout Time:", timestamp);
  console.log("🌐 ISO Timestamp:", isoTime);
  console.log("✅ LOGOUT SUCCESSFUL");
  console.log("   - Token invalidated on client side");
  console.log("   - User session cleared");
  console.log("═══════════════════════════════════════════════════");
  process.stdout.write("\n");
  
  res.json({
    success: true,
    message: "Logout successful",
    logoutTime: timestamp,
    isoTime: isoTime
  });
});

// ============================================
// SUBMISSIONS API ENDPOINTS (Neon Database - Optional)
// ============================================

// Initialize database connection on server start (optional)
let dbConnected = false;
if (sql) {
  testConnection().then(connected => {
    dbConnected = connected;
    if (connected) {
      // Initialize database schema if needed
      initializeDatabase();
    }
  }).catch(error => {
    console.warn('⚠️ Database connection test failed (optional):', error.message);
    console.log('   - Server will continue without database - using local storage only');
  });
} else {
  console.log('ℹ️  Neon database not configured - API endpoints will return 503');
  console.log('   - Application uses local storage (IndexedDB/localStorage)');
}

// Initialize database schema
const initializeDatabase = async () => {
  if (!sql) {
    console.log('ℹ️  Skipping database schema initialization (database not configured)');
    return;
  }
  
  try {
    // Check if submissions table exists, create if not
    await sql`
      CREATE TABLE IF NOT EXISTS submissions (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        status VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_submissions_data ON submissions USING GIN (data)`;
    
    console.log('✅ Database schema initialized');
  } catch (error) {
    console.error('❌ Error initializing database schema:', error.message);
  }
};

// Get all submissions
app.get("/api/submissions", authenticateToken, async (req, res) => {
  try {
    if (!sql || !dbConnected) {
      return res.status(503).json({
        success: false,
        message: "Database not configured. Application uses local storage (IndexedDB/localStorage)."
      });
    }

    const result = await sql`
      SELECT id, data, status, created_at, updated_at
      FROM submissions
      ORDER BY created_at DESC
    `;

    const submissions = result.map(row => ({
      ...row.data,
      id: row.id,
      status: row.status || row.data.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    console.log(`✅ Retrieved ${submissions.length} submissions from database`);
    
    res.json({
      success: true,
      submissions,
      count: submissions.length
    });
  } catch (error) {
    console.error("❌ Error fetching submissions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching submissions",
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Save/Update a single submission
app.post("/api/submissions", authenticateToken, async (req, res) => {
  try {
    if (!sql || !dbConnected) {
      return res.status(503).json({
        success: false,
        message: "Database not configured. Application uses local storage (IndexedDB/localStorage)."
      });
    }

    const { submission } = req.body;

    if (!submission || !submission.id) {
      return res.status(400).json({
        success: false,
        message: "Submission data with id is required"
      });
    }

    const submissionId = submission.id;
    const status = submission.status || "Pending Review";

    // Store entire submission as JSONB
    await sql`
      INSERT INTO submissions (id, data, status)
      VALUES (${submissionId}, ${JSON.stringify(submission)}::jsonb, ${status})
      ON CONFLICT (id) 
      DO UPDATE SET 
        data = ${JSON.stringify(submission)}::jsonb,
        status = ${status},
        updated_at = CURRENT_TIMESTAMP
    `;

    console.log(`✅ Saved submission ${submissionId} to database`);
    
    res.json({
      success: true,
      message: "Submission saved successfully",
      id: submissionId
    });
  } catch (error) {
    console.error("❌ Error saving submission:", error);
    res.status(500).json({
      success: false,
      message: "Error saving submission",
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Save multiple submissions (bulk)
app.post("/api/submissions/bulk", authenticateToken, async (req, res) => {
  try {
    if (!sql || !dbConnected) {
      return res.status(503).json({
        success: false,
        message: "Database not configured. Application uses local storage (IndexedDB/localStorage)."
      });
    }

    const { submissions } = req.body;

    if (!Array.isArray(submissions) || submissions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Array of submissions is required"
      });
    }

    // Use transaction for bulk insert
    const values = submissions.map(sub => ({
      id: sub.id,
      data: JSON.stringify(sub),
      status: sub.status || "Pending Review"
    }));

    // Insert all submissions
    for (const value of values) {
      await sql`
        INSERT INTO submissions (id, data, status)
        VALUES (${value.id}, ${value.data}::jsonb, ${value.status})
        ON CONFLICT (id) 
        DO UPDATE SET 
          data = ${value.data}::jsonb,
          status = ${value.status},
          updated_at = CURRENT_TIMESTAMP
      `;
    }

    console.log(`✅ Saved ${submissions.length} submissions to database`);
    
    res.json({
      success: true,
      message: `${submissions.length} submissions saved successfully`,
      count: submissions.length
    });
  } catch (error) {
    console.error("❌ Error saving bulk submissions:", error);
    res.status(500).json({
      success: false,
      message: "Error saving submissions",
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Delete a submission
app.delete("/api/submissions/:id", authenticateToken, async (req, res) => {
  try {
    if (!sql || !dbConnected) {
      return res.status(503).json({
        success: false,
        message: "Database not configured. Application uses local storage (IndexedDB/localStorage)."
      });
    }

    const { id } = req.params;

    const result = await sql`
      DELETE FROM submissions
      WHERE id = ${id}
    `;

    console.log(`✅ Deleted submission ${id} from database`);
    
    res.json({
      success: true,
      message: "Submission deleted successfully"
    });
  } catch (error) {
    console.error("❌ Error deleting submission:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting submission",
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Get submission by ID
app.get("/api/submissions/:id", authenticateToken, async (req, res) => {
  try {
    if (!sql || !dbConnected) {
      return res.status(503).json({
        success: false,
        message: "Database not configured. Application uses local storage (IndexedDB/localStorage)."
      });
    }

    const { id } = req.params;

    const result = await sql`
      SELECT id, data, status, created_at, updated_at
      FROM submissions
      WHERE id = ${id}
      LIMIT 1
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Submission not found"
      });
    }

    const row = result[0];
    const submission = {
      ...row.data,
      id: row.id,
      status: row.status || row.data.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    };

    res.json({
      success: true,
      submission
    });
  } catch (error) {
    console.error("❌ Error fetching submission:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching submission",
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

app.listen(5000, () => {
  console.log("\n");
  console.log("═══════════════════════════════════════════════════");
  console.log("✅ Server running on port 5000");
  console.log("📊 Detailed JWT logging enabled");
  console.log("🔐 Login endpoint: POST /api/login");
  console.log("🔒 Verify endpoint: GET /api/verify");
  console.log("🚪 Logout endpoint: POST /api/logout");
  console.log("📱 Send OTP endpoint: POST /api/send-otp");
  console.log("🔑 Verify OTP endpoint: POST /api/verify-otp");
  console.log("📦 Get submissions: GET /api/submissions (optional - requires DATABASE_URL)");
  console.log("💾 Save submission: POST /api/submissions (optional - requires DATABASE_URL)");
  console.log("💾 Save bulk submissions: POST /api/submissions/bulk (optional - requires DATABASE_URL)");
  console.log("🔍 Get submission by ID: GET /api/submissions/:id (optional - requires DATABASE_URL)");
  console.log("🗑️  Delete submission: DELETE /api/submissions/:id (optional - requires DATABASE_URL)");
  console.log("═══════════════════════════════════════════════════");
  console.log("💾 Storage: Using local storage (IndexedDB/localStorage)");
  console.log("   - Neon database is optional. Set DATABASE_URL in .env to enable.");
  console.log("═══════════════════════════════════════════════════");
  console.log("👤 ADMIN STATIC MOBILE NUMBER: 9999999999");
  console.log("   - Use this mobile number to login to Admin Dashboard");
  console.log("   - Username: Venkatesh");
  console.log("   - Password: admin123");
  console.log("═══════════════════════════════════════════════════");
  console.log("💡 All login/logout events will be logged with timestamps!");
  console.log("\n");
});
