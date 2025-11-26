import Header from "./Header";
import React, { useEffect, useMemo, useRef, useState } from "react";
import SidebarMenu from "./SidebarMenu";
import { useLocation, useNavigate } from "react-router-dom";
import PreviewModal from "./PreviewModal";

export default function CommissionerDashboard({
  user,
  logout,
  forwardedSubmissions,
  setForwardedSubmissions,
}) {
  // Log when component mounts or props change
  console.log("🔍 Commissioner: Component render/update");
  console.log("   - forwardedSubmissions prop:", forwardedSubmissions);
  console.log("   - forwardedSubmissions length:", forwardedSubmissions?.length || 0);
  console.log("   - forwardedSubmissions type:", typeof forwardedSubmissions);
  console.log("   - forwardedSubmissions is array:", Array.isArray(forwardedSubmissions));
  const fmtINR = (n) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    })
      .format(n || 0)
      .replace("INR", "₹");

  // Helper function to get file URL (handles both File objects and URL strings)
  const getFileUrl = (file) => {
    if (!file) return null;
    if (file instanceof File) {
      return URL.createObjectURL(file);
    }
    if (typeof file === 'string') {
      return file;
    }
    return null;
  };

  // Helper function to check if file is an image
  const isImageFile = (file) => {
    if (!file) return false;
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
    
    if (file instanceof File) {
      const fileName = file.name || '';
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      return imageExtensions.includes(ext) || imageMimeTypes.includes(file.type);
    } else if (typeof file === 'string') {
      if (file.startsWith('data:')) {
        const matches = file.match(/data:([^;]+);/);
        if (matches) {
          const mimeType = matches[1].toLowerCase();
          return imageMimeTypes.some(imgType => mimeType.includes(imgType.split('/')[1]));
        }
      }
      const ext = file.split('.').pop()?.toLowerCase() || '';
      return imageExtensions.includes(ext);
    }
    
    return false;
  };

  // Helper function to get file info (name, size, type)
  const getFileInfo = (file, defaultName = "document") => {
    if (!file) return null;
    
    let fileName = defaultName;
    let fileSize = null;
    let fileType = "PDF";
    
    if (file instanceof File) {
      fileName = file.name || defaultName;
      fileSize = file.size;
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      
      if (isImageFile(file)) {
        fileType = 'IMAGE';
      } else if (ext === 'pdf') {
        fileType = 'PDF';
      } else if (['doc', 'docx'].includes(ext)) {
        fileType = 'DOC';
      } else {
        fileType = ext.toUpperCase() || 'FILE';
      }
    } else if (typeof file === 'string') {
      if (file.startsWith('data:')) {
        const matches = file.match(/data:([^;]+);/);
        if (matches) {
          const mimeType = matches[1].toLowerCase();
          if (mimeType.includes('pdf')) {
            fileType = 'PDF';
          } else if (mimeType.includes('image')) {
            fileType = 'IMAGE';
          } else if (mimeType.includes('document') || mimeType.includes('msword')) {
            fileType = 'DOC';
          } else {
            fileType = 'FILE';
          }
        }
        fileSize = Math.round((file.length * 3) / 4);
      } else {
        const ext = file.split('.').pop()?.toLowerCase() || '';
        if (isImageFile(file)) {
          fileType = 'IMAGE';
        } else if (ext === 'pdf') {
          fileType = 'PDF';
        } else if (['doc', 'docx'].includes(ext)) {
          fileType = 'DOC';
        } else {
          fileType = ext.toUpperCase() || 'FILE';
        }
      }
      fileName = defaultName;
    }
    
    return { fileName, fileSize, fileType };
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // File Preview Component
  const FilePreview = ({ file, defaultName = "document.pdf" }) => {
    const [imageError, setImageError] = useState(false);
    
    if (!file) {
      return <span className="text-gray-400 text-xs">No file</span>;
    }
    
    const fileInfo = getFileInfo(file, defaultName);
    const fileUrl = getFileUrl(file);
    const isImage = isImageFile(file) && !imageError;
    
    const handleClick = (e) => {
      e.preventDefault();
      if (fileUrl) {
        window.open(fileUrl, '_blank');
      }
    };
    
    if (isImage && fileUrl) {
      return (
        <div 
          onClick={handleClick}
          className="bg-white rounded shadow-sm border border-gray-200 p-1 cursor-pointer hover:shadow-md transition-shadow max-w-[70px] overflow-hidden"
        >
          <img 
            src={fileUrl} 
            alt={fileInfo.fileName}
            className="w-full h-16 object-cover rounded mb-1"
            onError={() => setImageError(true)}
          />
          <div className="text-[8px] font-medium text-gray-900 truncate" title={fileInfo.fileName}>
            {fileInfo.fileName}
          </div>
        </div>
      );
    }
    
    return (
      <div 
        onClick={handleClick}
        className="bg-white rounded shadow-sm border border-gray-200 p-1 cursor-pointer hover:shadow-md transition-shadow max-w-[70px]"
      >
        <div className={`w-full h-8 rounded mb-1 overflow-hidden relative flex items-center justify-center ${
          fileInfo.fileType === 'PDF' 
            ? 'bg-gradient-to-br from-red-100 to-red-200' 
            : fileInfo.fileType === 'DOC' || fileInfo.fileType === 'DOCX'
            ? 'bg-gradient-to-br from-blue-100 to-blue-200'
            : 'bg-gradient-to-br from-gray-100 to-gray-200'
        }`}>
          <div className={`text-[10px] font-bold ${
            fileInfo.fileType === 'PDF' 
              ? 'text-red-600' 
              : fileInfo.fileType === 'DOC' || fileInfo.fileType === 'DOCX'
              ? 'text-blue-600'
              : 'text-gray-700'
          }`}>
            {fileInfo.fileType}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-[8px] font-medium text-gray-900 truncate" title={fileInfo.fileName}>
            {fileInfo.fileName}
          </div>
          {fileInfo.fileSize && (
            <div className="text-[7px] text-gray-500">
              {formatFileSize(fileInfo.fileSize)}
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- States ---

  const [previewSubmission, setPreviewSubmission] = useState(null);
  const [editable, setEditable] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [showForwardPanel, setShowForwardPanel] = useState(false);
  const [dept, setDept] = useState("");
  const [section, setSection] = useState("");
  const [forwardRemarks, setForwardRemarks] = useState("");
  const [forwardSuccess, setForwardSuccess] = useState("");

  // Logout modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutCallback, setLogoutCallback] = useState(null);
  
  // Alert modal state
  const [alertModal, setAlertModal] = useState({ show: false, message: "", type: "info" });
  
  // Function to show custom alert
  const showAlert = (message, type = "info") => {
    setAlertModal({ show: true, message, type });
    
    // Auto-dismiss success messages after 3 seconds (no OK button needed)
    if (type === "success") {
      setTimeout(() => {
        setAlertModal({ show: false, message: "", type: "info" });
      }, 3000);
    }
  };
  
  // Function to close alert
  const closeAlert = () => {
    setAlertModal({ show: false, message: "", type: "info" });
  };

  const [saveBanner, setSaveBanner] = useState("");
  const [approveBanner, setApproveBanner] = useState("");
  const [rejectBanner, setRejectBanner] = useState("");

  const [showRejectPanel, setShowRejectPanel] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [showApprovePanel, setShowApprovePanel] = useState(false);
  
  // Multiple selection states
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [bulkRejectRemarks, setBulkRejectRemarks] = useState("");
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false);
  const [bulkApproveRemarks, setBulkApproveRemarks] = useState("");
  const [approveRemarks, setApproveRemarks] = useState("");
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [forwardConfirmed, setForwardConfirmed] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [showBulkForwardModal, setShowBulkForwardModal] = useState(false);
  const [bulkApprovedItems, setBulkApprovedItems] = useState([]);
  const [previewVerified, setPreviewVerified] = useState(false);
const [commissionerVerifiedAt, setCommissionerVerifiedAt] = useState(null);
  
  // View state for card-based navigation
  const [selectedView, setSelectedView] = useState("pending");

  // Menu state
  const [selectedMenuItem, setSelectedMenuItem] = useState("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  // Add Position Modal state
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [positionRole, setPositionRole] = useState("");
  const [positionLevel, setPositionLevel] = useState("");
  const [positionName, setPositionName] = useState("");
  const [positions, setPositions] = useState([]);

  // User Assign Modal state
  const [showUserAssignModal, setShowUserAssignModal] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState(null);
  const [userAssignRole, setUserAssignRole] = useState("");
  const [userAssignUser, setUserAssignUser] = useState("");

  const menuItems = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      id: "reports", 
      label: "Reports", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      id: "gos", 
      label: "GO's", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      id: "circular", 
      label: "Circular & Proceedings", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      )
    },
    { 
      id: "guidelines", 
      label: "Guidelines", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    { 
      id: "workflow", 
      label: "Work Flow Management", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
  ];

  // Filter state
  const [filters, setFilters] = useState({
    crNumber: "",
    crDate: "",
    sector: "",
    status: "",
    proposal: "",
    cost: "",
    locality: "",
    latLong: "",
    priority: "",
  });

  // State to track which filter inputs are visible
  const [activeFilters, setActiveFilters] = useState({
    crNumber: false,
    crDate: false,
    sector: false,
    status: false,
    proposal: false,
    cost: false,
    locality: false,
    latLong: false,
    priority: false,
  });

  // Toggle filter input visibility
  const toggleFilter = (columnName) => {
    setActiveFilters(prev => ({
      ...prev,
      [columnName]: !prev[columnName]
    }));
  };

  const urlCache = useRef([]);

  // Clear selection when view changes
  useEffect(() => {
    setSelectedItems([]);
  }, [selectedView]);

  const sectionMap = {
    
    Administration:["EEPH","SEPH","ENCPH"]
    
  };

  const navigate = useNavigate();
  const location = useLocation();

  // Always add dummy entry upon entering dashboard route
  useEffect(() => {
    if (location.pathname !== "/") {
      window.history.pushState(null, "", window.location.pathname);
    }
  }, [location.pathname]);

  // Helper function to show logout confirmation modal
  const showLogoutConfirmation = (callback) => {
    setLogoutCallback(() => callback);
    setShowLogoutModal(true);
  };

  // Handle logout confirmation
  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    if (logoutCallback) {
      logoutCallback();
      setLogoutCallback(null);
    }
  };

  // Handle logout cancel
  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
    setLogoutCallback(null);
  };

  // Intercept back navigation reliably
  useEffect(() => {
    const handler = (event) => {
      if (location.pathname !== "/") {
        showLogoutConfirmation(() => {
          logout?.();
          navigate("/", { replace: true });
        });
        window.history.pushState(null, "", window.location.pathname);
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [location.pathname, logout, navigate]);

  // Log when forwardedSubmissions prop changes
  useEffect(() => {
    console.log("🔄 Commissioner: forwardedSubmissions prop changed");
    console.log("   - Count:", forwardedSubmissions?.length || 0);
    console.log("   - All submissions:");
    (forwardedSubmissions || []).forEach((s, idx) => {
      console.log(`      ${idx + 1}. ID: ${s.id}, Status: "${s.status}", Proposal: ${(s.proposal || 'N/A').substring(0, 40)}`);
    });
  }, [forwardedSubmissions]);

  // --- Calculate lists using useMemo for reactive updates ---
  const pendingList = useMemo(() => {
    console.log("🔍 Commissioner: Starting pendingList calculation");
    console.log("   - forwardedSubmissions type:", typeof forwardedSubmissions);
    console.log("   - forwardedSubmissions is array:", Array.isArray(forwardedSubmissions));
    console.log("   - Total forwardedSubmissions:", forwardedSubmissions?.length || 0);
    
    // Safety check: ensure forwardedSubmissions is an array
    if (!forwardedSubmissions || !Array.isArray(forwardedSubmissions)) {
      console.log("   ⚠️ WARNING: forwardedSubmissions is not an array, returning empty list");
      return [];
    }
    
    // Log all submissions with their statuses
    forwardedSubmissions.forEach((s, idx) => {
      console.log(`   - Submission ${idx + 1}:`, {
        id: s.id,
        status: s.status,
        statusType: typeof s.status,
        statusLength: s.status?.length,
        proposal: s.proposal?.substring(0, 50) || "N/A"
      });
    });
    
    // Pending list: includes works with "Pending Review" status and excludes processed works
    const pending = forwardedSubmissions.filter(
      (s) => {
        const status = (s.status || "").trim();
        const statusLower = status.toLowerCase();
        
        console.log("🔍 Commissioner: Filtering submission:", {
          id: s.id,
          originalStatus: s.status,
          trimmedStatus: status,
          statusLower: statusLower
        });
        
        // Include works with "Pending Review" status (from Admin)
        if (status === "Pending Review") {
          console.log("   ✅ INCLUDED: Status is 'Pending Review'");
          return true;
        }
        
        // Also check case-insensitive match
        if (statusLower === "pending review") {
          console.log("   ✅ INCLUDED: Status is 'pending review' (case-insensitive)");
          return true;
        }
        
        // Exclude Commissioner rejected works from pending
        if (status === "Rejected") {
          // Exclude if rejected by Commissioner
          const isCommissionerRejected = !s.rejectedBy || 
                                         s.rejectedBy === "Commissioner" || 
                                         s.rejectedBy === user?.username ||
                                         s.rejectedBy === "Ramesh";
          console.log("   ❌ EXCLUDED: Status is 'Rejected', isCommissionerRejected:", isCommissionerRejected);
          return !isCommissionerRejected;
        }
        
        // Exclude other processed statuses
        const isProcessed = ["Approved", "EEPH Rejected", "SEPH Rejected", "ENCPH Rejected"].includes(status) ||
                           status.startsWith("Forwarded to");
        if (isProcessed) {
          console.log("   ❌ EXCLUDED: Status is processed:", status);
        } else {
          console.log("   ✅ INCLUDED: Status is not processed");
        }
        return !isProcessed;
      }
    );
    
    const pendingReviewCount = forwardedSubmissions.filter(s => {
      const status = (s.status || "").trim();
      return status === "Pending Review" || status.toLowerCase() === "pending review";
    }).length;
    
    console.log("📊 Commissioner Pending list recalculated:");
    console.log("   - Total submissions:", forwardedSubmissions.length);
    console.log("   - Pending count:", pending.length);
    console.log("   - Pending Review count:", pendingReviewCount);
    console.log("   - Pending details:");
    pending.forEach((s, idx) => {
      console.log(`      ${idx + 1}. ID: ${s.id}, Status: "${s.status}", Proposal: ${(s.proposal || 'N/A').substring(0, 40)}`);
    });
    
    return pending;
  }, [forwardedSubmissions, user]);

  const selfRejectedList = useMemo(() => {
    // Self Rejected: Commissioner rejected tasks
    return forwardedSubmissions.filter((s) => 
      s.status === "Rejected" && (
        !s.rejectedBy || 
        s.rejectedBy === "Commissioner" || 
        s.rejectedBy === user?.username ||
        s.rejectedBy === "Ramesh"
      )
    );
  }, [forwardedSubmissions, user]);

  const approvedList = useMemo(() => {
    return forwardedSubmissions.filter((s) => s.status === "Approved");
  }, [forwardedSubmissions]);

  const forwardedList = useMemo(() => {
    return forwardedSubmissions.filter((s) => s.status?.startsWith("Forwarded to"));
  }, [forwardedSubmissions]);

  const rejectedList = useMemo(() => {
    // Rejected list: includes only EEPH rejected works (for "Sent back REJECTED LIST" card)
    return forwardedSubmissions.filter((s) => 
      s.status === "EEPH Rejected"
    );
  }, [forwardedSubmissions]);

  const eephRejectedList = useMemo(() => {
    return forwardedSubmissions.filter((s) => s.status === "EEPH Rejected");
  }, [forwardedSubmissions]);

  // Calculate unique CR count using the same logic as the table
  const uniqueCRCount = useMemo(() => {
    // Use the same data source as getListForView("noOfCrs") - which returns forwardedSubmissions
    const crList = forwardedSubmissions;
    const groupedByCR = {};
    crList.forEach((s) => {
      const crKey = (s.crNumber || "").trim().toUpperCase() || "__NO_CR__";
      if (!groupedByCR[crKey]) {
        groupedByCR[crKey] = [];
      }
      groupedByCR[crKey].push(s);
    });
    // Exclude "__NO_CR__" from count (same as table logic)
    return Object.keys(groupedByCR).filter(key => key !== "__NO_CR__").length;
  }, [forwardedSubmissions]);

  // Helper function to get the list for selected view
  const getListForView = (view) => {
    console.log("🔍 Commissioner: getListForView called with view:", view);
    console.log("   - pendingList length:", pendingList.length);
    let list = [];
    switch (view) {
      case "pending":
        list = pendingList;
        console.log("   - Returning pendingList, count:", list.length);
        break;
      case "allWorks":
        list = forwardedSubmissions;
        break;
      case "approved":
        list = [...approvedList, ...forwardedList];
        break;
      case "forwarded":
        list = forwardedList;
        break;
      case "selfRejected":
        list = selfRejectedList;
        break;
      case "sentBackRejected":
        list = rejectedList;
        break;
      case "noOfCrs":
        list = forwardedSubmissions; // All works for CR view
        break;
      default:
        list = pendingList;
    }
    // Sort by priority in ascending order
    return [...list].sort((a, b) => {
      const priorityA = Number(a.priority) || 0;
      const priorityB = Number(b.priority) || 0;
      return priorityA - priorityB;
    });
  };

  const getViewTitle = (view) => {
    switch (view) {
      case "pending":
        return "Pending / Approval Tasks";
      case "allWorks":
        return "All Works";
      case "approved":
        return "Approved & Forwarded Tasks";
      case "forwarded":
        return "Forwarded Tasks";
      case "selfRejected":
        return "Self Rejected Tasks";
      case "sentBackRejected":
        return "Sent back REJECTED LIST";
      case "noOfCrs":
        return "All Works (by CR Number)";
      default:
        return "Pending / Approval Tasks";
    }
  };

  // Helper function to format locality display
  const formatLocality = (item) => {
    if (!item) return "";
    const parts = [];
    if (item.area) parts.push(item.area);
    if (item.locality) parts.push(item.locality);
    if (item.wardNo) parts.push(`Ward No: ${item.wardNo}`);
    // If all parts exist, join them; otherwise return what's available or just locality
    if (parts.length > 0) {
      return parts.join(", ");
    }
    // Fallback to just locality if nothing else exists
    return item.locality || "-";
  };

  // Filter function to apply filters to list
  const applyFilters = (list) => {
    console.log("🔍 Commissioner: applyFilters called");
    console.log("   - Input list count:", list.length);
    console.log("   - Active filters:", JSON.stringify(filters));
    const filtered = list.filter((item) => {
      // CR Number filter
      if (filters.crNumber && !(item.crNumber || "").toLowerCase().includes(filters.crNumber.toLowerCase())) {
        return false;
      }
      // CR Date filter
      if (filters.crDate && !(item.crDate || "").toLowerCase().includes(filters.crDate.toLowerCase())) {
        return false;
      }
      // Sector filter
      if (filters.sector && item.sector !== filters.sector) {
        return false;
      }
      // Status filter
      if (filters.status && item.status !== filters.status) {
        return false;
      }
      // Proposal filter
      if (filters.proposal && !(item.proposal || "").toLowerCase().includes(filters.proposal.toLowerCase())) {
        return false;
      }
      // Cost filter
      if (filters.cost) {
        const costStr = fmtINR(item.cost || 0).toLowerCase();
        if (!costStr.includes(filters.cost.toLowerCase())) {
          return false;
        }
      }
      // Locality filter
      const localityStr = formatLocality(item).toLowerCase();
      if (filters.locality && !localityStr.includes(filters.locality.toLowerCase())) {
        return false;
      }
      // Lat/Long filter
      const latLongStr = (item.latlong || "").toLowerCase();
      if (filters.latLong && !latLongStr.includes(filters.latLong.toLowerCase())) {
        return false;
      }
      // Priority filter
      if (filters.priority && !(item.priority || "").toString().includes(filters.priority)) {
        return false;
      }
      return true;
    });
    console.log("   - Output filtered count:", filtered.length);
    return filtered;
  };

  // Get unique sectors and statuses for filter dropdowns
  const getUniqueSectors = (list) => {
    const sectors = new Set();
    list.forEach(item => {
      if (item.sector) sectors.add(item.sector);
    });
    return Array.from(sectors).sort();
  };

  const getUniqueStatuses = (list) => {
    const statuses = new Set();
    list.forEach(item => {
      if (item.status) statuses.add(item.status);
    });
    return Array.from(statuses).sort();
  };

  // cleanup object URLs
  useEffect(() => {
    return () => {
      urlCache.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  // --- Modal ---
  const openPreview = (sub) => {
    // Get fresh submission from forwardedSubmissions to ensure we have all files
    const freshSub = forwardedSubmissions.find((f) => f.id === sub.id) || sub;
    
    console.log("🔍 Commissioner openPreview - Original sub:", sub);
    console.log("🔍 Commissioner openPreview - Fresh sub from array:", freshSub);
    console.log("🔍 Commissioner openPreview - Files check:", {
      workImage: freshSub.workImage instanceof File,
      detailedReport: freshSub.detailedReport instanceof File,
      committeeReport: freshSub.committeeReport instanceof File,
      councilResolution: freshSub.councilResolution instanceof File,
    });
    
    setPreviewSubmission(freshSub);
    setEditable({
      sector: freshSub.sector || "",
      proposal: freshSub.proposal || "",
      cost: freshSub.cost || 0,
      locality: freshSub.locality || "",
      latlong: freshSub.latlong || "",
      priority: freshSub.priority || "",
      crNumber: freshSub.crNumber || "",
      crDate: freshSub.crDate || "",
      remarks: freshSub.remarks || "",
      workImage: freshSub.workImage || null,
      detailedReport: freshSub.detailedReport || null,
      committeeReport: freshSub.committeeReport || null,
      councilResolution: freshSub.councilResolution || null,
    });
    setModalOpen(true);
  };

  const saveEdits = () => {
    if (!previewSubmission) return;
    setForwardedSubmissions((prev) =>
      prev.map((f) =>
        f.id === previewSubmission.id
          ? { ...f, ...editable, remarks: editable.remarks }
          : f
      )
    );
    setSaveBanner("Changes saved successfully.");
    setTimeout(() => setSaveBanner(""), 1500);
    setModalOpen(false);
  };

  // --- Approve ---
  const approve = (subId) => {
    const sub = forwardedSubmissions.find((f) => f.id === subId);
    if (!sub) return;
    // Close any other panels first
    setShowRejectPanel(false);
    setShowForwardPanel(false);
    setForwardConfirmed(false);
    setModalOpen(false);
    // Open preview modal instead of approval panel
    setPreviewSubmission(sub);
    setShowPreviewModal(true);
    setApproveRemarks("");
    setApprovalConfirmed(false);
    setVerificationData(null);
  };

  const confirmApprove = (verificationDataParam = null) => {
    if (!previewSubmission) return;
    // Use passed verification data or fall back to state
    const dataToUse = verificationDataParam || verificationData;
    
    // Require verification data from preview modal
    if (!dataToUse) {
      alert("Please verify in the preview modal before approving");
      return;
    }
    
    // Store verification data in state for later use
    if (verificationDataParam) {
      setVerificationData(verificationDataParam);
    }
    
    setForwardedSubmissions((prev) => {
      const updated = prev.map((f) =>
        f.id === previewSubmission.id 
          ? { 
              ...f, 
              status: "Approved", 
              remarks: approveRemarks || "",
              verifiedBy: dataToUse ? {
                name: dataToUse.verifiedPersonName,
                designation: dataToUse.verifiedPersonDesignation,
                timestamp: dataToUse.verificationTimestamp
              } : null
            } 
          : f
      );
      // Find the updated submission to set as preview
      const updatedSub = updated.find((f) => f.id === previewSubmission.id);
      if (updatedSub) {
        setPreviewSubmission(updatedSub);
      }
      return updated;
    });
    // Close preview modal and show forwarding modal as popup
    setShowPreviewModal(false);
    setShowApprovePanel(true);
    setApprovalConfirmed(true);
    setShowForwardPanel(false);
    setDept("");
    setSection("");
    setForwardRemarks("");
    setForwardConfirmed(false);
    setApproveBanner("Work approved successfully.");
    setTimeout(() => setApproveBanner(""), 1500);
  };

  // --- Reject ---
  const reject = (subId) => {
    const sub = forwardedSubmissions.find((f) => f.id === subId);
    if (!sub) return;
    // Close any other panels first
    setShowApprovePanel(false);
    setShowForwardPanel(false);
    setForwardConfirmed(false);
    setModalOpen(false);
    // Open rejection panel
    setPreviewSubmission(sub);
    setShowRejectPanel(true);
    setRejectRemarks("");
  };

  const confirmReject = () => {
    if (!rejectRemarks || !previewSubmission) {
      showAlert("Please enter remarks before rejecting.", "error");
      return;
    }

    console.log("🔴 Commissioner rejecting task:", {
      taskId: previewSubmission.id,
      currentStatus: previewSubmission.status,
      remarks: rejectRemarks
    });

    setForwardedSubmissions((prev) => {
      const updated = prev.map((f) => {
        if (f.id === previewSubmission.id) {
          const updatedItem = { 
            ...f, 
            status: "Rejected", 
            remarks: rejectRemarks, 
            rejectedBy: "Commissioner" 
          };
          console.log("🔴 Updated item:", updatedItem);
          return updatedItem;
        }
        return f;
      });
      
      console.log("🔴 Updated submissions count:", updated.length);
      console.log("🔴 Rejected items in updated array:", updated.filter(s => s.status === "Rejected" && s.rejectedBy === "Commissioner"));
      
      // Update previewSubmission to reflect the new status
      const updatedSub = updated.find((f) => f.id === previewSubmission.id);
      if (updatedSub) {
        setPreviewSubmission(updatedSub);
      }
      return updated;
    });
    
    setRejectBanner("Work rejected successfully.");
    setTimeout(() => {
      setRejectBanner("");
      setShowRejectPanel(false);
      setPreviewSubmission(null);
      setRejectRemarks("");
    }, 1500);
  };

  // --- Multiple Selection Functions ---
  const handleSelectItem = (itemId) => {
    setSelectedItems((prev) => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    const currentList = getListForView(selectedView);
    const eligibleItems = currentList.filter(s => {
      const isCommissionerRejected = s.status === "Rejected" && 
        (!s.rejectedBy || s.rejectedBy === "Commissioner" || s.rejectedBy === user?.username);
      return !isActionDisabled(s.status) || isCommissionerRejected;
    }).map(s => s.id);
    
    if (selectedItems.length === eligibleItems.length && eligibleItems.length > 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems(eligibleItems);
    }
  };

  const handleBulkApprove = () => {
    if (selectedItems.length === 0) {
      showAlert("Please select at least one item to approve.", "error");
      return;
    }

    // Open approval remarks modal
    setShowBulkApproveModal(true);
    setBulkApproveRemarks("");
  };

  const confirmBulkApprove = () => {
    
    const count = selectedItems.length;

    // First, approve the items
    setForwardedSubmissions((prev) => {
      return prev.map((f) => {
        if (selectedItems.includes(f.id)) {
          return { ...f, status: "Approved", remarks: bulkApproveRemarks || "" };
        }
        return f;
      });
    });

    // Store the approved item IDs for forwarding
    setBulkApprovedItems([...selectedItems]);
    setSelectedItems([]);
    
    // Close approval modal
    setShowBulkApproveModal(false);
    setBulkApproveRemarks("");
 // Reset for next time
    
    // Open forwarding modal
    setShowBulkForwardModal(true);
    setDept("");
    setSection("");
    setForwardRemarks("");
    setForwardConfirmed(false);
  };

  const handleBulkReject = () => {
    if (selectedItems.length === 0) {
      showAlert("Please select at least one item to reject.", "error");
      return;
    }

    setShowBulkRejectModal(true);
  };

  const confirmBulkReject = () => {
    if (!bulkRejectRemarks) {
      showAlert("Please enter remarks before rejecting.", "error");
      return;
    }

    const count = selectedItems.length;

    setForwardedSubmissions((prev) => {
      return prev.map((f) => {
        if (selectedItems.includes(f.id)) {
          return { 
            ...f, 
            status: "Rejected", 
            remarks: bulkRejectRemarks, 
            rejectedBy: "Commissioner" 
          };
        }
        return f;
      });
    });

    setSelectedItems([]);
    setBulkRejectRemarks("");
    setShowBulkRejectModal(false);
    setRejectBanner(`${count} work(s) rejected successfully.`);
    setTimeout(() => setRejectBanner(""), 3000);
  };

  // --- Forward ---
  const forwardApprovedToDept = () => {
    if (!dept || !section || !previewSubmission) {
      showAlert("Select department and section", "error");
      return;
    }
    if (!forwardConfirmed) {
      alert("Please check the confirmation checkbox before forwarding");
      return;
    }

    const newStatus = `Forwarded to ${section}`;
    
    console.log("📤 Commissioner forwarding task:", {
      taskId: previewSubmission.id,
      dept,
      section,
      newStatus,
      forwardedTo: {
        department: dept,
        section,
        remarks: forwardRemarks,
      }
    });

    setForwardedSubmissions((prev) => {
      console.log("📤 Commissioner: setForwardedSubmissions callback called");
      console.log("   - Previous count:", prev.length);
      console.log("   - Preview submission ID:", previewSubmission.id);
      console.log("   - New status:", newStatus);
      console.log("   - Section:", section);
      console.log("   - Department:", dept);
      
      // Get current submission from array
      const currentSub = prev.find((f) => f.id === previewSubmission.id);
      console.log("   - Current submission found:", !!currentSub);
      console.log("   - Current submission status:", currentSub?.status);
      
      // Log files before forwarding
      console.log("📤 Commissioner forwarding - Files check:", {
        fromCurrentSub: {
          workImage: currentSub?.workImage instanceof File,
          detailedReport: currentSub?.detailedReport instanceof File,
          committeeReport: currentSub?.committeeReport instanceof File,
          councilResolution: currentSub?.councilResolution instanceof File,
        },
        fromPreview: {
          workImage: previewSubmission.workImage instanceof File,
          detailedReport: previewSubmission.detailedReport instanceof File,
          committeeReport: previewSubmission.committeeReport instanceof File,
          councilResolution: previewSubmission.councilResolution instanceof File,
        }
      });
      
      const updated = prev.map((f) =>
        f.id === previewSubmission.id
          ? {
              ...f,
              forwardedTo: {
                department: dept,
                section,
                remarks: forwardRemarks,
                timestamp: new Date().toISOString(),
              },
              status: newStatus,
              // Explicitly preserve all file properties - check multiple sources
              workImage: previewSubmission.workImage || f.workImage || currentSub?.workImage || null,
              detailedReport: previewSubmission.detailedReport || f.detailedReport || currentSub?.detailedReport || null,
              committeeReport: previewSubmission.committeeReport || f.committeeReport || currentSub?.committeeReport || null,
              councilResolution: previewSubmission.councilResolution || f.councilResolution || currentSub?.councilResolution || null,
            }
          : f
      );
      
      // Log files after forwarding
      const forwardedSub = updated.find((f) => f.id === previewSubmission.id);
      console.log("✅ Commissioner forwarded - Files after:", {
        workImage: forwardedSub?.workImage instanceof File,
        detailedReport: forwardedSub?.detailedReport instanceof File,
        committeeReport: forwardedSub?.committeeReport instanceof File,
        councilResolution: forwardedSub?.councilResolution instanceof File,
      });
      
      console.log("✅ Commissioner forwarded - Final submission details:", {
        id: forwardedSub?.id,
        status: forwardedSub?.status,
        forwardedTo: forwardedSub?.forwardedTo,
        section: forwardedSub?.forwardedTo?.section,
        department: forwardedSub?.forwardedTo?.department,
        willAppearInEEPH: forwardedSub?.status?.toLowerCase().includes("forwarded to eeph") || 
                         forwardedSub?.forwardedTo?.section?.toLowerCase() === "eeph"
      });
      
      console.log("✅ Commissioner: Updated array count:", updated.length);
      console.log("   - All statuses in updated array:", updated.map(u => ({ id: u.id, status: u.status, section: u.forwardedTo?.section })));
      
      return updated;
    });

    // Update previewSubmission with new status
    setPreviewSubmission({
      ...previewSubmission,
      forwardedTo: {
        department: dept,
        section,
        remarks: forwardRemarks,
      },
      status: newStatus,
    });

    // Close modal immediately
      setShowForwardPanel(false);
    setForwardConfirmed(false);
    setShowApprovePanel(false);
    setApprovalConfirmed(false);
    setForwardConfirmed(false);
      setPreviewSubmission(null);
      setDept("");
      setSection("");
      setForwardRemarks("");
    setApproveRemarks("");
     setPreviewVerified(false);
  setCommissionerVerifiedAt(null);
    
    // Reset forwardConfirmed when closing
    setForwardConfirmed(false);
    
    // Show alert message (auto-dismisses after 3 seconds)
    showAlert("Task is forwarded successfully", "success");
  };

  // --- Bulk Forward ---
  const forwardBulkApprovedToDept = () => {
    if (!dept || !section || bulkApprovedItems.length === 0) {
      showAlert("Select department and section", "error");
      return;
    }
    if (!forwardConfirmed) {
      alert("Please check the confirmation checkbox before forwarding");
      return;
    }

    const newStatus = `Forwarded to ${section}`;
    const count = bulkApprovedItems.length;

    setForwardedSubmissions((prev) => {
      return prev.map((f) => {
        if (bulkApprovedItems.includes(f.id)) {
          return {
            ...f,
            forwardedTo: {
              department: dept,
              section,
              remarks: forwardRemarks,
            },
            status: newStatus,
          };
        }
        return f;
      });
    });

    // Close modal and clear state
    setShowBulkForwardModal(false);
    setBulkApprovedItems([]);
    setDept("");
    setSection("");
    setForwardRemarks("");
    setForwardConfirmed(false);
    
    // Show alert message (auto-dismisses after 3 seconds)
    showAlert("Task is forwarded successfully", "success");
  };


  const renderFileLinks = (sub) => {
    const files = [];
    if (sub.detailedReport)
      files.push({ label: "Detailed Report", file: sub.detailedReport });
    if (sub.committeeReport)
      files.push({ label: "Committee Report", file: sub.committeeReport });
    if (sub.councilResolution)
      files.push({ label: "Council Resolution", file: sub.councilResolution });

    return files.map((f, i) => {
      const url = URL.createObjectURL(f.file);
      urlCache.current.push(url);
      return (
        <div key={i}>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            {f.label}
          </a>
        </div>
      );
    });
  };

  const isActionDisabled = (status) =>
    status === "Approved" ||
    status?.startsWith("Forwarded to");

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 w-full bg-white shadow-md z-50 p-6 pb-0">
        <Header
          title="15th Finance Commission"
          user={user}
          onLogout={() => {
            showLogoutConfirmation(() => {
              logout?.();
              window.location.href = "/";
            });
          }}
        />
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 transform transition-all">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
            </div>
            <div className="text-gray-600 mb-6">
              <p className="mb-2">Are you sure you want to logout?</p>
              <p>You will need to login again to access the dashboard.</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleLogoutCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {alertModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]" onClick={closeAlert}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 transform transition-all" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start mb-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                alertModal.type === "success" ? "bg-green-100" :
                alertModal.type === "error" ? "bg-red-100" :
                alertModal.type === "warning" ? "bg-yellow-100" :
                "bg-blue-100"
              }`}>
                {alertModal.type === "success" ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : alertModal.type === "error" ? (
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : alertModal.type === "warning" ? (
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-semibold mb-2 ${
                  alertModal.type === "success" ? "text-green-900" :
                  alertModal.type === "error" ? "text-red-900" :
                  alertModal.type === "warning" ? "text-yellow-900" :
                  "text-blue-900"
                }`}>
                  {alertModal.type === "success" ? "Success" :
                   alertModal.type === "error" ? "Error" :
                   alertModal.type === "warning" ? "Warning" :
                   "Information"}
                </h3>
                <div className="text-gray-700 whitespace-pre-line">
                  {alertModal.message}
                </div>
              </div>
            </div>
            {/* Only show OK button for non-success messages */}
            {alertModal.type !== "success" && (
              <div className="flex justify-end">
                <button
                  onClick={closeAlert}
                  className={`px-4 py-2 text-white rounded-md hover:opacity-90 transition-colors font-medium ${
                    alertModal.type === "error" ? "bg-red-600 hover:bg-red-700" :
                    alertModal.type === "warning" ? "bg-yellow-600 hover:bg-yellow-700" :
                    "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  OK
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="flex items-start relative pt-20 overflow-x-hidden">
        <SidebarMenu
          menuItems={menuItems}
          selectedMenuItem={selectedMenuItem}
          onMenuItemSelect={setSelectedMenuItem}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
        />

        {/* Main Content Area */}
        <div className={`flex-1 p-6 pt-4 transition-all duration-300 min-w-0 ${isMenuOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="max-w-[95%] mx-auto">
            {/* Work Flow Management Content */}
            {selectedMenuItem === "workflow" ? (
              <div className="bg-white p-6 rounded-xl shadow border">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold text-gray-700">
                    Work Flow Management
                  </h2>
                  <button 
                    onClick={() => setShowAddPositionModal(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Add Position
                  </button>
                </div>

                {/* Positions Table */}
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-3 text-left text-sm font-semibold text-gray-700">S.No</th>
                        <th className="border border-gray-300 p-3 text-left text-sm font-semibold text-gray-700">Position Name</th>
                        <th className="border border-gray-300 p-3 text-left text-sm font-semibold text-gray-700">Level</th>
                        <th className="border border-gray-300 p-3 text-left text-sm font-semibold text-gray-700">Emp code</th>
                        <th className="border border-gray-300 p-3 text-left text-sm font-semibold text-gray-700">Emp name</th>
                        <th className="border border-gray-300 p-3 text-left text-sm font-semibold text-gray-700">User Assign</th>
                        <th className="border border-gray-300 p-3 text-left text-sm font-semibold text-gray-700">Remove Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="border border-gray-300 p-4 text-center text-gray-500">
                            No positions added yet. Click "Add Position" to add a new position.
                          </td>
                        </tr>
                      ) : (
                        positions.map((position, index) => (
                          <tr key={position.id} className="hover:bg-gray-50">
                            <td className="border border-gray-300 p-3 text-sm">{index + 1}</td>
                            <td className="border border-gray-300 p-3 text-sm">{position.name}</td>
                            <td className="border border-gray-300 p-3 text-sm">{position.level}</td>
                            <td className="border border-gray-300 p-3 text-sm">{position.empCode || "-"}</td>
                            <td className="border border-gray-300 p-3 text-sm">{position.empName || "-"}</td>
                            <td className="border border-gray-300 p-3 text-sm">
                              <button 
                                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                onClick={() => {
                                  setSelectedPositionId(position.id);
                                  setUserAssignRole(position.role);
                                  setUserAssignUser("");
                                  setShowUserAssignModal(true);
                                }}
                              >
                                User Assign
                              </button>
                            </td>
                            <td className="border border-gray-300 p-3 text-sm">
                              <button 
                                className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to remove this position?")) {
                                    setPositions(positions.filter(p => p.id !== position.id));
                                    showAlert("Position removed successfully!", "success");
                                  }
                                }}
                              >
                                Remove Position
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="font-semibold text-gray-700 mb-4">
            Commissioner Dashboard
          </h2>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {/* No. of CR's */}
            <div 
              onClick={() => setSelectedView("noOfCrs")}
              className={`bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-pointer hover:bg-blue-100 transition ${selectedView === "noOfCrs" ? "ring-2 ring-blue-500" : ""}`}
            >
              <div className="text-sm text-blue-600 font-bold mb-1">No. of CR's</div>
              <div className="text-xl font-bold text-blue-700">
                {uniqueCRCount}
              </div>
            </div>

            {/* No. of Works */}
            <div 
              onClick={() => setSelectedView("allWorks")}
              className={`bg-purple-50 border border-purple-200 rounded-lg p-3 cursor-pointer hover:bg-purple-100 transition ${selectedView === "allWorks" ? "ring-2 ring-purple-500" : ""}`}
            >
              <div className="text-sm text-purple-600 font-bold mb-1">No. of Works</div>
              <div className="text-xl font-bold text-purple-700">
                {forwardedSubmissions.length}
              </div>
            </div>

            {/* No. of Pending */}
            <div 
              onClick={() => setSelectedView("pending")}
              className={`bg-yellow-50 border border-yellow-200 rounded-lg p-3 cursor-pointer hover:bg-yellow-100 transition ${selectedView === "pending" ? "ring-2 ring-yellow-500" : ""}`}
            >
              <div className="text-sm text-yellow-600 font-bold mb-1">No. of Pending</div>
              <div className="text-xl font-bold text-yellow-700">
                {pendingList.length}
              </div>
            </div>

            {/* No. of Forwarded */}
            <div 
              onClick={() => setSelectedView("forwarded")}
              className={`bg-indigo-50 border border-indigo-200 rounded-lg p-3 cursor-pointer hover:bg-indigo-100 transition ${selectedView === "forwarded" ? "ring-2 ring-indigo-500" : ""}`}
            >
              <div className="text-sm text-indigo-600 font-bold mb-1">No. of Forwarded</div>
              <div className="text-xl font-bold text-indigo-700">
                {forwardedList.length}
              </div>
            </div>

            {/* Self Rejected */}
            <div 
              onClick={() => setSelectedView("selfRejected")}
              className={`bg-orange-50 border border-orange-200 rounded-lg p-3 cursor-pointer hover:bg-orange-100 transition ${selectedView === "selfRejected" ? "ring-2 ring-orange-500" : ""}`}
            >
              <div className="text-sm text-orange-600 font-bold mb-1">Self Rejected</div>
              <div className="text-xl font-bold text-orange-700">
                {selfRejectedList.length}
              </div>
            </div>

            {/* Sent back REJECTED LIST */}
            <div 
              onClick={() => setSelectedView("sentBackRejected")}
              className={`bg-red-50 border border-red-200 rounded-lg p-3 cursor-pointer hover:bg-red-100 transition ${selectedView === "sentBackRejected" ? "ring-2 ring-red-500" : ""}`}
            >
              <div className="text-sm text-orange-600 font-bold mb-1 whitespace-nowrap">Sent Back Rejected List</div>
              <div className="text-xl font-bold text-red-700">
                {rejectedList.length}
              </div>
            </div>
          </div>

          {/* banners */}
          {forwardSuccess && (
            <div className="mb-4 p-4 bg-green-500 text-white rounded-lg shadow-lg text-center font-semibold text-base animate-pulse">
              {forwardSuccess}
            </div>
          )}
          {saveBanner && (
            <div className="p-2 bg-blue-50 border border-blue-200 text-blue-700 rounded mb-2">
              {saveBanner}
            </div>
          )}
          {approveBanner && (
            <div className="p-2 bg-green-50 border border-green-200 text-green-700 rounded mb-2">
              {approveBanner}
            </div>
          )}
          {rejectBanner && (
            <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded mb-2">
              {rejectBanner}
            </div>
          )}

          {/* Dynamic Table based on selected view */}
          {(() => {
            const currentList = getListForView(selectedView);
            console.log("🔍 Commissioner: Rendering table");
            console.log("   - selectedView:", selectedView);
            console.log("   - currentListCount:", currentList.length);
            console.log("   - currentListStatuses:", currentList.map(s => s.status).join(", "));
            console.log("   - activeFilters:", JSON.stringify(filters));
            const filteredList = applyFilters(currentList);
            console.log("🔍 Commissioner: After applyFilters");
            console.log("   - filteredListCount:", filteredList.length);
            console.log("   - filteredListStatuses:", filteredList.map(s => s.status).join(", "));
            console.log("   - filteredListIds:", filteredList.map(s => s.id).join(", "));
            const showActions = selectedView === "pending";
            const uniqueSectors = getUniqueSectors(currentList);
            const uniqueStatuses = getUniqueStatuses(currentList);
            
            return (
              <>
          <h3 className="text-sm text-gray-600 mb-4">
                  {getViewTitle(selectedView)}
          </h3>
                
                {/* Bulk Action Buttons */}
                {showActions && filteredList.length > 0 && (
                  <div className="mb-3 flex gap-2 items-center">
                    <button
                      onClick={handleBulkApprove}
                      disabled={selectedItems.length === 0}
                      className={`px-4 py-2 text-xs rounded ${
                        selectedItems.length === 0
                          ? "bg-gray-300 cursor-not-allowed text-gray-500"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      Approve Selected ({selectedItems.length})
                    </button>
                    <button
                      onClick={handleBulkReject}
                      disabled={selectedItems.length === 0}
                      className={`px-4 py-2 text-xs rounded ${
                        selectedItems.length === 0
                          ? "bg-gray-300 cursor-not-allowed text-gray-500"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                    >
                      Reject Selected ({selectedItems.length})
                    </button>
                    {selectedItems.length > 0 && (
                      <button
                        onClick={() => setSelectedItems([])}
                        className="px-3 py-2 text-xs rounded bg-gray-400 text-white hover:bg-gray-500"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>
                )}

                <div className="overflow-auto max-h-80">
              <table className="min-w-full text-sm border-collapse border border-gray-300">
                <thead className="bg-gray-100 border-b border-gray-300">
  <tr>
                          {showActions && (
                            <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">
                              <input
                                type="checkbox"
                                checked={(() => {
                                  const eligibleItems = filteredList.filter(s => {
                                    const isCommissionerRejected = s.status === "Rejected" && 
                                      (!s.rejectedBy || s.rejectedBy === "Commissioner" || s.rejectedBy === user?.username);
                                    return !isActionDisabled(s.status) || isCommissionerRejected;
                                  }).map(s => s.id);
                                  return eligibleItems.length > 0 && eligibleItems.every(id => selectedItems.includes(id));
                                })()}
                                onChange={handleSelectAll}
                                className="cursor-pointer"
                              />
                            </th>
                          )}
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">S.No</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">Year</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">Installment</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">GrantType</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">Proposal</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span>CR Number</span>
                                <button
                                  onClick={() => toggleFilter('crNumber')}
                                  className="text-xs"
                                  title="Filter by CR Number"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                  </svg>
                                </button>
                              </div>
                              {activeFilters.crNumber && (
                                <input
                                  type="text"
                                  value={filters.crNumber}
                                  onChange={(e) => setFilters({ ...filters, crNumber: e.target.value })}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full border p-0.5 rounded text-xs"
                                  placeholder="Search..."
                                  autoFocus
                                />
                              )}
                            </div>
                          </th>
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span>CR Date</span>
                                <button
                                  onClick={() => toggleFilter('crDate')}
                                  className="text-xs"
                                  title="Filter by CR Date"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                  </svg>
                                </button>
                              </div>
                              {activeFilters.crDate && (
                                <input
                                  type="text"
                                  value={filters.crDate}
                                  onChange={(e) => setFilters({ ...filters, crDate: e.target.value })}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full border p-0.5 rounded text-xs"
                                  placeholder="Search..."
                                  autoFocus
                                />
                              )}
                            </div>
                          </th>
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span>Sector</span>
                                <button
                                  onClick={() => toggleFilter('sector')}
                                  className="text-xs"
                                  title="Filter by Sector"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                  </svg>
                                </button>
                              </div>
                              {activeFilters.sector && (
                                <select
                                  value={filters.sector}
                                  onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full border p-0.5 rounded text-xs"
                                  autoFocus
                                >
                                  <option value="">All</option>
                                  {uniqueSectors.map(sector => (
                                    <option key={sector} value={sector}>{sector}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </th>
                          <th className="p-2 text-left text-xs border-r border-gray-300">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span>WorkName</span>
                                <button
                                  onClick={() => toggleFilter('proposal')}
                                  className="text-xs"
                                  title="Filter by WorkName"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                  </svg>
                                </button>
                              </div>
                              {activeFilters.proposal && (
                                <input
                                  type="text"
                                  value={filters.proposal}
                                  onChange={(e) => setFilters({ ...filters, proposal: e.target.value })}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full border p-0.5 rounded text-xs"
                                  placeholder="Search..."
                                  autoFocus
                                />
                              )}
                            </div>
                          </th>
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span>Cost</span>
                                <button
                                  onClick={() => toggleFilter('cost')}
                                  className="text-xs"
                                  title="Filter by Cost"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                  </svg>
                                </button>
                              </div>
                              {activeFilters.cost && (
                                <input
                                  type="text"
                                  value={filters.cost}
                                  onChange={(e) => setFilters({ ...filters, cost: e.target.value })}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full border p-0.5 rounded text-xs"
                                  placeholder="Search..."
                                  autoFocus
                                />
                              )}
                            </div>
                          </th>
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span>Locality</span>
                                <button
                                  onClick={() => toggleFilter('locality')}
                                  className="text-xs"
                                  title="Filter by Locality"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                  </svg>
                                </button>
                              </div>
                              {activeFilters.locality && (
                                <input
                                  type="text"
                                  value={filters.locality}
                                  onChange={(e) => setFilters({ ...filters, locality: e.target.value })}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full border p-0.5 rounded text-xs"
                                  placeholder="Search..."
                                  autoFocus
                                />
                              )}
                            </div>
                          </th>
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span>Lat/Long</span>
                                <button
                                  onClick={() => toggleFilter('latLong')}
                                  className="text-xs"
                                  title="Filter by Lat/Long"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                  </svg>
                                </button>
                              </div>
                              {activeFilters.latLong && (
                                <input
                                  type="text"
                                  value={filters.latLong}
                                  onChange={(e) => setFilters({ ...filters, latLong: e.target.value })}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full border p-0.5 rounded text-xs"
                                  placeholder="Search..."
                                  autoFocus
                                />
                              )}
                            </div>
                          </th>
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span>Priority</span>
                                <button
                                  onClick={() => toggleFilter('priority')}
                                  className="text-xs"
                                  title="Filter by Priority"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                  </svg>
                                </button>
                              </div>
                              {activeFilters.priority && (
                                <input
                                  type="text"
                                  value={filters.priority}
                                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full border p-0.5 rounded text-xs"
                                  placeholder="Search..."
                                  autoFocus
                                />
                              )}
                            </div>
                          </th>
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">Work Image</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">Estimation Report</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">Committee Report</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">Council Resolution</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span>Status</span>
                                <button
                                  onClick={() => toggleFilter('status')}
                                  className="text-xs"
                                  title="Filter by Status"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                  </svg>
                                </button>
                                {(filters.crNumber || filters.crDate || filters.sector || filters.status || filters.proposal || filters.cost || filters.locality || filters.latLong || filters.priority) && (
                                  <button
                                    onClick={() => {
                                      setFilters({ crNumber: "", crDate: "", sector: "", status: "", proposal: "", cost: "", locality: "", latLong: "", priority: "" });
                                      setActiveFilters({ crNumber: false, crDate: false, sector: false, status: false, proposal: false, cost: false, locality: false, latLong: false, priority: false });
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 px-1"
                                    title="Clear Filters"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                              {activeFilters.status && (
                                <select
                                  value={filters.status}
                                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full border p-0.5 rounded text-xs"
                                  autoFocus
                                >
                                  <option value="">All</option>
                                  {uniqueStatuses.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </th>
                          {showActions && <th className="p-2 text-left border-r border-gray-300">Actions</th>}
                          {!showActions && (selectedView === "selfRejected" || selectedView === "sentBackRejected") && (
                            <th className="p-2 text-left text-xs">Remarks</th>
                          )}
                        </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Show "No results found" message if filteredList is empty
                    if (filteredList.length === 0) {
                      const columnCount = showActions ? 16 : (selectedView === "selfRejected" || selectedView === "sentBackRejected") ? 16 : 15;
                      return (
                        <tr>
                          <td colSpan={columnCount} className="p-8 text-center text-gray-500 text-sm">
                            No results found. Please try different search criteria.
                          </td>
                        </tr>
                      );
                    }

                    // Views that should show serial number for every row: allWorks, pending, forwarded, selfRejected, sentBackRejected
                    const viewsWithSerialNumbers = ["allWorks", "pending", "forwarded", "selfRejected", "sentBackRejected"];
                    
                    if (viewsWithSerialNumbers.includes(selectedView)) {
                            return filteredList.map((s, i) => {
                              const isCommissionerRejected = s.status === "Rejected" && 
                                (!s.rejectedBy || s.rejectedBy === "Commissioner" || s.rejectedBy === user?.username);
                              const canSelect = !isActionDisabled(s.status) || isCommissionerRejected;
                              return (
                                <tr key={s.id} className="border-b border-gray-300 hover:bg-gray-50">
                                  {showActions && (
                                    <td className="p-2 text-xs align-top">
                                      <input
                                        type="checkbox"
                                        checked={selectedItems.includes(s.id)}
                                        onChange={() => handleSelectItem(s.id)}
                                        disabled={!canSelect}
                                        className="cursor-pointer"
                                      />
                                    </td>
                                  )}
                                  <td className="p-2 text-xs align-top">{i + 1}</td>
                                  <td className="p-2 text-xs align-top">{s.year || "-"}</td>
                                  <td className="p-2 text-xs align-top">{s.installment || "-"}</td>
                                  <td className="p-2 text-xs align-top">{s.grantType || "-"}</td>
                                  <td className="p-2 text-xs align-top">{s.program || "-"}</td>
                                  <td className="p-2 text-xs align-top">{s.crNumber || "-"}</td>
                                  <td className="p-2 text-xs align-top">{s.crDate || "-"}</td>
                                  <td className="p-2 text-xs align-top">{s.sector}</td>
                                  <td className="p-2 text-xs max-w-xs truncate align-top" title={s.proposal}>{s.proposal}</td>
                                  <td className="p-2 text-xs align-top">{fmtINR(s.cost)}</td>
                                  <td className="p-2 text-xs max-w-xs truncate align-top" title={formatLocality(s)}>{formatLocality(s) || "-"}</td>
                                  <td className="p-2 text-xs max-w-xs truncate align-top" title={s.latlong || "-"}>
                                    {s.latlong ? (s.latlong.length > 20 ? s.latlong.substring(0, 20) + "..." : s.latlong) : "-"}
                                  </td>
                                  <td className="p-2 text-xs align-top">{s.priority}</td>
                                  <td className="p-2 text-xs align-top">
                                    <FilePreview file={s.workImage} defaultName="work-image.jpg" />
                                  </td>
                                  <td className="p-2 text-xs align-top">
                                    {s.detailedReport ? (
                                      <FilePreview file={s.detailedReport} defaultName="estimation-report.pdf" />
                                    ) : null}
                                  </td>
                                  <td className="p-2 text-xs align-top">
                                    <FilePreview file={s.committeeReport} defaultName="committee-report.pdf" />
                                  </td>
                                  <td className="p-2 text-xs align-top">
                                    <FilePreview file={s.councilResolution} defaultName="council-resolution.pdf" />
                                  </td>
                                  <td className="p-2 text-xs align-top">
                                    {selectedView === "pending" && isCommissionerRejected ? (
                                      <span className="text-orange-600">Rejected (Re-review)</span>
                                    ) : selectedView === "selfRejected" || selectedView === "sentBackRejected" ? (
                                      <span className="text-red-700">
                                        {s.rejectedBy 
                                          ? `Rejected by ${s.rejectedBy}` 
                                          : s.status === "EEPH Rejected" 
                                          ? "Rejected by EEPH"
                                          : s.status === "SEPH Rejected"
                                          ? "Rejected by SEPH"
                                          : s.status === "ENCPH Rejected"
                                          ? "Rejected by ENCPH"
                                          : s.status === "Rejected"
                                          ? "Rejected by Commissioner"
                                          : s.status}
                                      </span>
                                    ) : selectedView === "approved" ? (
                                      <span className="text-green-700">{s.status}</span>
                                    ) : (
                                      s.status || "Pending"
                                    )}
                                  </td>
                                  {showActions && (
                                    <td className="p-2 align-top">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openPreview(s)}
                            className="px-2 py-1 bg-indigo-600 text-white rounded text-xs"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => approve(s.id)}
                                          disabled={isActionDisabled(s.status) && !isCommissionerRejected}
                            className={`px-2 py-1 text-xs rounded ${
                              s.status === "Approved"
                                ? "bg-gray-300"
                                : "bg-green-600 text-white"
                            }`}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => reject(s.id)}
                                          disabled={false}
                                          className="px-2 py-1 text-xs rounded bg-red-600 text-white"
                                        >
                                          Reject
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                  {!showActions && (selectedView === "selfRejected" || selectedView === "sentBackRejected") && (
                                    <td className="p-2 text-xs text-gray-600 max-w-xs truncate align-top" title={s.remarks || "-"}>{s.remarks || "-"}</td>
                                  )}
                                </tr>
                              );
                            });
                          }
                          
                          // For other views (like "noOfCrs", "approved"), group by CR number (case-insensitive, trimmed)
                          const groupedByCR = {};
                          filteredList.forEach((s) => {
                            const crKey = (s.crNumber || "").trim().toUpperCase() || "__NO_CR__";
                            if (!groupedByCR[crKey]) {
                              groupedByCR[crKey] = [];
                            }
                            groupedByCR[crKey].push(s);
                          });
                          
                          // Filter out groups with __NO_CR__ key (same as card count logic)
                          const crGroups = Object.values(groupedByCR).filter(group => {
                            const firstItem = group[0];
                            const crKey = (firstItem.crNumber || "").trim().toUpperCase() || "__NO_CR__";
                            return crKey !== "__NO_CR__";
                          });
                          
                          // If no groups found, show message
                          if (crGroups.length === 0) {
                            const columnCount = showActions ? 16 : (selectedView === "selfRejected" || selectedView === "sentBackRejected") ? 16 : 15;
                            return (
                              <tr>
                                <td colSpan={columnCount} className="p-8 text-center text-gray-500 text-sm">
                                  No results found. Please try different search criteria.
                                </td>
                              </tr>
                            );
                          }
                          
                          let globalSerial = 0;
                          
                          return crGroups.map((group, groupIdx) => {
                            return group.map((s, idxInGroup) => {
                              const isFirstInGroup = idxInGroup === 0;
                              if (isFirstInGroup) globalSerial++;
                              const isCommissionerRejected = s.status === "Rejected" && 
                                (!s.rejectedBy || s.rejectedBy === "Commissioner" || s.rejectedBy === user?.username);
                              const canSelect = !isActionDisabled(s.status) || isCommissionerRejected;
                              return (
                                <tr key={s.id} className="border-b border-gray-300 hover:bg-gray-50">
                                  {showActions && (
                                    <td className="p-2 text-xs align-top">
                                      <input
                                        type="checkbox"
                                        checked={selectedItems.includes(s.id)}
                                        onChange={() => handleSelectItem(s.id)}
                                        disabled={!canSelect}
                                        className="cursor-pointer"
                                      />
                                    </td>
                                  )}
                                  <td className="p-2 text-xs align-top">{isFirstInGroup ? globalSerial : ""}</td>
                                  {isFirstInGroup ? (
                                    <td className="p-2 border-r border-gray-300" rowSpan={group.length} style={{ verticalAlign: 'middle' }}>
                                      {s.year || "-"}
                                    </td>
                                  ) : null}
                                  {isFirstInGroup ? (
                                    <td className="p-2 border-r border-gray-300" rowSpan={group.length} style={{ verticalAlign: 'middle' }}>
                                      {s.installment || "-"}
                                    </td>
                                  ) : null}
                                  {isFirstInGroup ? (
                                    <td className="p-2 border-r border-gray-300" rowSpan={group.length} style={{ verticalAlign: 'middle' }}>
                                      {s.grantType || "-"}
                                    </td>
                                  ) : null}
                                  {isFirstInGroup ? (
                                    <td className="p-2 border-r border-gray-300" rowSpan={group.length} style={{ verticalAlign: 'middle' }}>
                                      {s.program || "-"}
                                    </td>
                                  ) : null}
                                  <td className="p-2 text-xs align-top">{isFirstInGroup ? (s.crNumber || "-") : ""}</td>
                                  <td className="p-2 text-xs align-top">{isFirstInGroup ? (s.crDate || "-") : ""}</td>
                                  <td className="p-2 text-xs align-top">{isFirstInGroup ? s.sector : ""}</td>
                                  <td className="p-2 text-xs max-w-xs truncate align-top" title={s.proposal}>{s.proposal}</td>
                                  <td className="p-2 text-xs align-top">{fmtINR(s.cost)}</td>
                                  <td className="p-2 text-xs max-w-xs truncate align-top" title={formatLocality(s)}>{formatLocality(s) || "-"}</td>
                                  <td className="p-2 text-xs max-w-xs truncate align-top" title={s.latlong || "-"}>
                                    {s.latlong ? (s.latlong.length > 20 ? s.latlong.substring(0, 20) + "..." : s.latlong) : "-"}
                                  </td>
                                  <td className="p-2 text-xs align-top">{s.priority}</td>
                                  <td className="p-2 text-xs align-top">
                                    <FilePreview file={s.workImage} defaultName="work-image.jpg" />
                                  </td>
                                  <td className="p-2 text-xs align-top">
                                    {s.detailedReport ? (
                                      <FilePreview file={s.detailedReport} defaultName="estimation-report.pdf" />
                                    ) : null}
                                  </td>
                                  <td className="p-2 text-xs align-top">
                                    <FilePreview file={s.committeeReport} defaultName="committee-report.pdf" />
                                  </td>
                                  <td className="p-2 text-xs align-top">
                                    <FilePreview file={s.councilResolution} defaultName="council-resolution.pdf" />
                                  </td>
                                  <td className="p-2 text-xs align-top">
                                    {selectedView === "pending" && isCommissionerRejected ? (
                                      <span className="text-orange-600">Rejected (Re-review)</span>
                                    ) : selectedView === "selfRejected" || selectedView === "sentBackRejected" ? (
                                      <span className="text-red-700">
                                        {s.rejectedBy 
                                          ? `Rejected by ${s.rejectedBy}` 
                                          : s.status === "EEPH Rejected" 
                                          ? "Rejected by EEPH"
                                          : s.status === "SEPH Rejected"
                                          ? "Rejected by SEPH"
                                          : s.status === "ENCPH Rejected"
                                          ? "Rejected by ENCPH"
                                          : s.status === "Rejected"
                                          ? "Rejected by Commissioner"
                                          : s.status}
                                      </span>
                                    ) : selectedView === "approved" ? (
                                      <span className="text-green-700">{s.status}</span>
                                    ) : (
                                      s.status || "Pending"
                                    )}
                                  </td>
                                  {showActions && (
                                    <td className="p-2 align-top">
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => openPreview(s)}
                                          className="px-2 py-1 bg-indigo-600 text-white rounded text-xs"
                                        >
                                          Review
                                        </button>
                                        <button
                                          onClick={() => approve(s.id)}
                                          disabled={isActionDisabled(s.status) && !isCommissionerRejected}
                            className={`px-2 py-1 text-xs rounded ${
                                            s.status === "Approved"
                                ? "bg-gray-300"
                                              : "bg-green-600 text-white"
                                          }`}
                                        >
                                          Approve
                                        </button>
                                        <button
                                          onClick={() => reject(s.id)}
                                          disabled={false}
                                          className="px-2 py-1 text-xs rounded bg-red-600 text-white"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                                  )}
                                  {!showActions && (selectedView === "selfRejected" || selectedView === "sentBackRejected") && (
                                    <td className="p-2 text-xs text-gray-600 max-w-xs truncate align-top" title={s.remarks || "-"}>{s.remarks || "-"}</td>
                                  )}
                    </tr>
                              );
                            });
                          }).flat();
                        })()}
                </tbody>
              </table>
            </div>
              </>
            );
          })()}

          {/* Forward panel */}
          {showForwardPanel && previewSubmission && previewSubmission.status === "Approved" && (
            <div className="bg-white border rounded-xl shadow p-5 mt-6">
              <h4 className="font-semibold mb-3">
                Forward Approved Work to Department
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Department</label>
                  <select
                    className="w-full border p-2 rounded mt-1"
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                  >
                    <option value="">Select department</option>
                    {Object.keys(sectionMap).map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Section</label>
                  <select
                    className="w-full border p-2 rounded mt-1"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    disabled={!dept}
                  >
                    <option value="">Select section</option>
                    {dept &&
                      sectionMap[dept].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Remarks</label>
                  <input
                    className="w-full border p-2 rounded mt-1"
                    value={forwardRemarks}
                    onChange={(e) => setForwardRemarks(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="forwardConfirmedPanel"
                  checked={forwardConfirmed}
                  onChange={(e) => setForwardConfirmed(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="forwardConfirmedPanel" className="text-sm text-gray-700 font-medium">
                  Confirm Forwarding
                </label>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={forwardApprovedToDept}
                  disabled={!dept || !section || !forwardConfirmed}
                  className={`px-4 py-2 rounded ${
                    !dept || !section || !forwardConfirmed
                      ? "bg-gray-400 cursor-not-allowed text-gray-600"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  Forward
                </button>
              </div>
              {forwardSuccess && (
                <div className="mt-2 text-green-700 text-sm">
                  {forwardSuccess}
                </div>
              )}
            </div>
          )}

          {/* Approve Remarks Modal */}
          {showApprovePanel && previewSubmission && (
            <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
              <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 overflow-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-lg">
                    {approvalConfirmed ? "Forward Approved Work to Department" : "Approve Work"}
                  </h4>
                  <button
                    onClick={() => {
                      setShowApprovePanel(false);
                      setApproveRemarks("");
                      setApprovalConfirmed(false);
                      setForwardConfirmed(false);
                      setPreviewSubmission(null);
                      setDept("");
                      setSection("");
                      setForwardRemarks("");
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    ✕
                  </button>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Work Details:</p>
                  <div className="bg-gray-50 p-3 rounded mb-4">
                    <p className="text-sm"><span className="font-medium">CR Number:</span> {previewSubmission.crNumber || "-"}</p>
                    <p className="text-sm"><span className="font-medium">Sector:</span> {previewSubmission.sector}</p>
                    <p className="text-sm"><span className="font-medium">Proposal:</span> {previewSubmission.proposal}</p>
                    <p className="text-sm"><span className="font-medium">Cost:</span> {fmtINR(previewSubmission.cost)}</p>
                  </div>
                </div>
                
                {!approvalConfirmed ? (
                  <>
              <div>
                      <label className="text-sm text-gray-600 font-medium">Remarks (Optional)</label>
                <textarea
                        className="w-full border p-3 rounded mt-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        rows={6}
                        value={approveRemarks}
                        onChange={(e) => setApproveRemarks(e.target.value)}
                        placeholder="Enter remarks for approval (optional)..."
                      />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={() => {
                          setShowApprovePanel(false);
                          setApproveRemarks("");
                          setApprovalConfirmed(false);
                          setPreviewSubmission(null);
                        }}
                        className="px-5 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmApprove}
                        className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                      >
                        Confirm Approval
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {approveBanner && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">
                        {approveBanner}
                      </div>
                    )}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-600 font-medium">Department</label>
                        <select
                          className="w-full border p-3 rounded mt-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          value={dept}
                          onChange={(e) => setDept(e.target.value)}
                        >
                          <option value="">Select department</option>
                          {Object.keys(sectionMap).map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 font-medium">Section</label>
                        <select
                          className="w-full border p-3 rounded mt-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          value={section}
                          onChange={(e) => setSection(e.target.value)}
                          disabled={!dept}
                        >
                          <option value="">Select section</option>
                          {dept &&
                            sectionMap[dept].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 font-medium">Remarks (Optional)</label>
                        <textarea
                          className="w-full border p-3 rounded mt-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={4}
                          value={forwardRemarks}
                          onChange={(e) => setForwardRemarks(e.target.value)}
                          placeholder="Enter remarks for forwarding (optional)..."
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <input
                          type="checkbox"
                          id="forwardConfirmed"
                          checked={forwardConfirmed}
                          onChange={(e) => setForwardConfirmed(e.target.checked)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <label htmlFor="forwardConfirmed" className="text-sm text-gray-700 font-medium">
                          Confirm Forwarding
                        </label>
                      </div>
                    </div>
                    {forwardSuccess && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">
                        {forwardSuccess}
                      </div>
                    )}
                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={() => {
                          setShowApprovePanel(false);
                          setApproveRemarks("");
                          setApprovalConfirmed(false);
                          setForwardConfirmed(false);
                          setPreviewSubmission(null);
                          setDept("");
                          setSection("");
                          setForwardRemarks("");
                        }}
                        className="px-5 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={forwardApprovedToDept}
                        disabled={!dept || !section || !forwardConfirmed}
                        className={`px-5 py-2 rounded ${
                          !dept || !section || !forwardConfirmed
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        } text-white`}
                      >
                        Forward
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Reject Remarks Modal */}
          {showRejectPanel && previewSubmission && (
            <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
              <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-lg">Reject Work</h4>
                  <button
                    onClick={() => {
                      setShowRejectPanel(false);
                      setRejectRemarks("");
                      setPreviewSubmission(null);
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    ✕
                  </button>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Work Details:</p>
                  <div className="bg-gray-50 p-3 rounded mb-4">
                    <p className="text-sm"><span className="font-medium">Sector:</span> {previewSubmission.sector}</p>
                    <p className="text-sm"><span className="font-medium">Proposal:</span> {previewSubmission.proposal}</p>
                    <p className="text-sm"><span className="font-medium">Cost:</span> {fmtINR(previewSubmission.cost)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Remarks (Required)</label>
                  <textarea
                    className="w-full border p-3 rounded mt-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={6}
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  placeholder="Please enter reason for rejection..."
                    required
                />
              </div>
                <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRejectPanel(false);
                    setRejectRemarks("");
                    setPreviewSubmission(null);
                  }}
                    className="px-5 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReject}
                    className="px-5 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Submit Rejection
                </button>
              </div>
              </div>
            </div>
          )}

          {/* Preview Modal for Approval */}
          {showPreviewModal && previewSubmission && (() => {
            // Build timeline data
            const timelineData = {
              forwardedFrom: previewSubmission.forwardedBy || previewSubmission.forwardedDate ? {
                name: previewSubmission.forwardedBy || "Engineer",
                timestamp: previewSubmission.forwardedDate || null
              } : null,
              verifiedBy: verificationData ? {
                name: user?.username || "Commissioner",
                timestamp: verificationData.verificationTimestamp || new Date().toISOString()
              } : (approvalConfirmed && previewSubmission.verifiedBy ? {
                name: user?.username || "Commissioner",
                timestamp: previewSubmission.verifiedBy?.timestamp || new Date().toISOString()
              } : null),
              forwardingTo: (approvalConfirmed && section) || previewSubmission.forwardedTo?.section ? {
                section: previewSubmission.forwardedTo?.section || section,
                name: "", // EEPH name if available
                timestamp: previewSubmission.forwardedTo?.timestamp || null
              } : null
            };

            // Convert single submission to array format for PreviewModal
            const submissionArray = [previewSubmission];

            // Build selection data from submission (if available)
            // Check multiple possible locations for selection data
            const selectionData = previewSubmission.selection ? {
              year: previewSubmission.selection.year || "",
              installment: previewSubmission.selection.installment || "",
              grantType: previewSubmission.selection.grantType || "",
              program: previewSubmission.selection.program || ""
            } : {
              year: previewSubmission.year || "",
              installment: previewSubmission.installment || "",
              grantType: previewSubmission.grantType || "",
              program: previewSubmission.program || "" // Don't use proposal - it's different from program
            };

            return (
              <PreviewModal
                isOpen={showPreviewModal}
                onClose={() => {
                  setShowPreviewModal(false);
                  setVerificationData(null);
                  setPreviewSubmission(null);
                }}
                onConfirm={(data) => {
                  // Pass verification data directly to confirmApprove
                  confirmApprove(data);
                }}
                selection={selectionData}
                crStatus={previewSubmission.crNumber ? "CR" : ""}
                crNumber={previewSubmission.crNumber || ""}
                crDate={previewSubmission.crDate || ""}
                numberOfWorks=""
                submissions={submissionArray}
                totalSubmittedCost={previewSubmission.cost || 0}
                committeeFile={previewSubmission.committeeReport || null}
                councilFile={previewSubmission.councilResolution || null}
                isEditing={false}
                showAlert={showAlert}
                user={user}
                ulbName={user?.ulb || "Vijayawada"}
                verifiedPersonName={verificationData?.verifiedPersonName || ""}
                verifiedPersonDesignation={verificationData?.verifiedPersonDesignation || ""}
                verificationWord={verificationData?.verificationWord || ""}
                verificationTimestamp={verificationData?.verificationTimestamp || null}
                timeline={timelineData}
              />
            );
          })()}

          {/* Bulk Approve Modal */}
          {showBulkApproveModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
              <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-lg">Approve {selectedItems.length} Selected Work(s)</h4>
                  <button
                    onClick={() => {
                      setShowBulkApproveModal(false);
                      setBulkApproveRemarks("");
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    ✕
                  </button>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">You are about to approve {selectedItems.length} work(s).</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Remarks (Optional)</label>
                  <textarea
                    className="w-full border p-3 rounded mt-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows={6}
                    value={bulkApproveRemarks}
                    onChange={(e) => setBulkApproveRemarks(e.target.value)}
                    placeholder="Enter remarks for approval (optional)..."
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowBulkApproveModal(false);
                      setBulkApproveRemarks("");
                    }}
                    className="px-5 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmBulkApprove}
                    className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    Confirm Approval
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Reject Modal */}
          {showBulkRejectModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
              <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-lg">Reject {selectedItems.length} Selected Work(s)</h4>
                  <button
                    onClick={() => {
                      setShowBulkRejectModal(false);
                      setBulkRejectRemarks("");
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    ✕
                  </button>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">You are about to reject {selectedItems.length} work(s).</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Remarks (Required)</label>
                  <textarea
                    className="w-full border p-3 rounded mt-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={6}
                    value={bulkRejectRemarks}
                    onChange={(e) => setBulkRejectRemarks(e.target.value)}
                    placeholder="Please enter reason for rejection (will be applied to all selected items)..."
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowBulkRejectModal(false);
                      setBulkRejectRemarks("");
                    }}
                    className="px-5 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmBulkReject}
                    className="px-5 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Submit Rejection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Forward Modal */}
          {showBulkForwardModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
              <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 overflow-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-lg">Forward {bulkApprovedItems.length} Approved Work(s) to Department</h4>
                  <button
                    onClick={() => {
                      setShowBulkForwardModal(false);
                      setBulkApprovedItems([]);
                      setDept("");
                      setSection("");
                      setForwardRemarks("");
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    ✕
                  </button>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">You are about to forward {bulkApprovedItems.length} approved work(s).</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Department</label>
                    <select
                      className="w-full border p-3 rounded mt-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      value={dept}
                      onChange={(e) => setDept(e.target.value)}
                    >
                      <option value="">Select department</option>
                      {Object.keys(sectionMap).map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Section</label>
                    <select
                      className="w-full border p-3 rounded mt-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      disabled={!dept}
                    >
                      <option value="">Select section</option>
                      {dept &&
                        sectionMap[dept].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Remarks (Optional)</label>
                    <textarea
                      className="w-full border p-3 rounded mt-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      rows={4}
                      value={forwardRemarks}
                      onChange={(e) => setForwardRemarks(e.target.value)}
                      placeholder="Enter remarks for forwarding (optional)..."
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      id="bulkForwardConfirmed"
                      checked={forwardConfirmed}
                      onChange={(e) => setForwardConfirmed(e.target.checked)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="bulkForwardConfirmed" className="text-sm text-gray-700 font-medium">
                      Confirm Forwarding
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowBulkForwardModal(false);
                      setBulkApprovedItems([]);
                      setDept("");
                      setSection("");
                      setForwardRemarks("");
                      setForwardConfirmed(false);
                    }}
                    className="px-5 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={forwardBulkApprovedToDept}
                    disabled={!dept || !section || !forwardConfirmed}
                    className={`px-5 py-2 rounded ${
                      !dept || !section || !forwardConfirmed
                        ? "bg-gray-400 cursor-not-allowed text-gray-600"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    Forward
                  </button>
                </div>
              </div>
            </div>
          )}

              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {modalOpen && previewSubmission && (
          <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow max-w-4xl w-full p-6 overflow-auto max-h-[90vh]">
              <div className="flex justify-between mb-4">
                <h3 className="font-semibold text-lg">
                  Work Details Review
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1 bg-red-500 text-white rounded"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {["sector", "proposal", "cost", "locality", "priority"].map(
                  (field) => (
                    <div key={field}>
                      <label className="text-sm text-gray-600 capitalize">
                        {field}
                      </label>
                      <input
                        className="w-full border p-2 rounded mt-1"
                        value={editable[field]}
                        onChange={(e) =>
                          setEditable({ ...editable, [field]: e.target.value })
                        }
                      />
                    </div>
                  )
                )}
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Latitude/Longitude or Google Maps URL</label>
                  <textarea
                    className="w-full border p-2 rounded mt-1"
                    value={editable.latlong || ""}
                    onChange={(e) =>
                      setEditable({ ...editable, latlong: e.target.value })
                    }
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">CR Number</label>
                  <input
                    className="w-full border p-2 rounded mt-1"
                    value={editable.crNumber || ""}
                    onChange={(e) =>
                      setEditable({ ...editable, crNumber: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">CR Date</label>
                  <input
                    type="date"
                    className="w-full border p-2 rounded mt-1"
                    value={editable.crDate || ""}
                    onChange={(e) =>
                      setEditable({ ...editable, crDate: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* File uploads section */}
              <div className="mt-4 space-y-4">
                <h4 className="font-semibold text-sm text-gray-700">Attached Files</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Work Image */}
                  <div className="border rounded p-3 bg-gray-50">
                    <label className="text-sm text-gray-700 font-medium block mb-2">Work Image</label>
                    {(() => {
                      const imageFile = editable.workImage || previewSubmission.workImage;
                      const imageUrl = getFileUrl(imageFile);
                      return imageUrl ? (
                      <div className="mb-2">
                        <img
                            src={imageUrl}
                          alt="Work"
                          className="rounded max-h-40 border"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'block';
                            }
                          }}
                        />
                        <div style={{display: 'none'}} className="text-sm text-gray-500">Image preview unavailable</div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 mb-2">No image attached</div>
                      );
                    })()}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setEditable({ ...editable, workImage: file });
                        }
                      }}
                      className="w-full border p-2 rounded text-sm bg-white"
                    />
                  </div>

                  {/* Detailed/Estimation Report */}
                  <div className="border rounded p-3 bg-gray-50">
                    <label className="text-sm text-gray-700 font-medium block mb-2">Estimation Report</label>
                    {(() => {
                      const reportFile = editable.detailedReport || previewSubmission.detailedReport;
                      const reportUrl = getFileUrl(reportFile);
                      return reportUrl ? (
                      <div className="mb-2">
                        <a
                            href={reportUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline text-sm hover:text-blue-800"
                        >
                            📄 View Current Report ({reportFile instanceof File ? reportFile.name : 'file'})
                        </a>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 mb-2">No report attached</div>
                      );
                    })()}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setEditable({ ...editable, detailedReport: file });
                        }
                      }}
                      className="w-full border p-2 rounded text-sm bg-white"
                    />
                  </div>

                  {/* Committee Report */}
                  <div className="border rounded p-3 bg-gray-50">
                    <label className="text-sm text-gray-700 font-medium block mb-2">Committee Report</label>
                    {(() => {
                      const reportFile = editable.committeeReport || previewSubmission.committeeReport;
                      const reportUrl = getFileUrl(reportFile);
                      return reportUrl ? (
                      <div className="mb-2">
                        <a
                            href={reportUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline text-sm hover:text-blue-800"
                        >
                            📄 View Current Report ({reportFile instanceof File ? reportFile.name : 'file'})
                        </a>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 mb-2">No report attached</div>
                      );
                    })()}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setEditable({ ...editable, committeeReport: file });
                        }
                      }}
                      className="w-full border p-2 rounded text-sm bg-white"
                    />
                  </div>

                  {/* Council Resolution Report */}
                  <div className="border rounded p-3 bg-gray-50">
                    <label className="text-sm text-gray-700 font-medium block mb-2">Council Resolution Report</label>
                    {(() => {
                      const reportFile = editable.councilResolution || previewSubmission.councilResolution;
                      const reportUrl = getFileUrl(reportFile);
                      return reportUrl ? (
                      <div className="mb-2">
                        <a
                            href={reportUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline text-sm hover:text-blue-800"
                        >
                            📄 View Current Report ({reportFile instanceof File ? reportFile.name : 'file'})
                        </a>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 mb-2">No report attached</div>
                      );
                    })()}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setEditable({ ...editable, councilResolution: file });
                        }
                      }}
                      className="w-full border p-2 rounded text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm text-gray-600">
                  Commissioner Remarks
                </label>
                <textarea
                  className="w-full border p-2 rounded mt-1"
                  value={editable.remarks}
                  onChange={(e) =>
                    setEditable({ ...editable, remarks: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={saveEdits}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Position Modal */}
        {showAddPositionModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 overflow-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Add Position</h3>
                <button
                  onClick={() => {
                    setShowAddPositionModal(false);
                    setPositionRole("");
                    setPositionLevel("");
                    setPositionName("");
                  }}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 font-medium block mb-2">
                    Select Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={positionRole}
                    onChange={(e) => setPositionRole(e.target.value)}
                  >
                    <option value="">Select Level</option>
                    <option value="EEPH">EEPH</option>
                    <option value="SEPH">SEPH</option>
                    <option value="ENCPH">ENCPH</option>
                    <option value="CDMA">CDMA</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-600 font-medium block mb-2">
                    Select Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={positionLevel}
                    onChange={(e) => setPositionLevel(e.target.value)}
                  >
                    <option value="">Select Role</option>
                    <option value="middlelvelofficer-1">middlelvelofficer-1</option>
                    <option value="middlelevelofficer-2">middlelevelofficer-2</option>
                    <option value="middlelevelofficer-3">middlelevelofficer-3</option>
                    <option value="middlelevelofficer-4">middlelevelofficer-4</option>
                    <option value="middlelevelofficer-5">middlelevelofficer-5</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-600 font-medium block mb-2">
                    Position Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter Position Name"
                    value={positionName}
                    onChange={(e) => setPositionName(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddPositionModal(false);
                    setPositionRole("");
                    setPositionLevel("");
                    setPositionName("");
                  }}
                  className="px-5 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (positionRole && positionLevel && positionName) {
                      // Add position to the array
                      const newPosition = {
                        id: Date.now(), // Unique ID
                        role: positionRole,
                        level: positionLevel,
                        name: positionName,
                        empCode: "",
                        empName: ""
                      };
                      setPositions([...positions, newPosition]);
                      showAlert("Position added successfully!", "success");
                      setShowAddPositionModal(false);
                      setPositionRole("");
                      setPositionLevel("");
                      setPositionName("");
                    } else {
                      showAlert("Please fill in all required fields", "error");
                    }
                  }}
                  className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Assign Modal */}
        {showUserAssignModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 overflow-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">User Assign</h3>
                <button
                  onClick={() => {
                    setShowUserAssignModal(false);
                    setSelectedPositionId(null);
                    setUserAssignRole("");
                    setUserAssignUser("");
                  }}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 font-medium block mb-2">
                    Select Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={userAssignRole}
                    onChange={(e) => setUserAssignRole(e.target.value)}
                  >
                    <option value="">Select Role</option>
                    <option value="middlelvelofficer-1">middlelvelofficer-1</option>
                    <option value="middlelevelofficer-2">middlelevelofficer-2</option>
                    <option value="middlelevelofficer-3">middlelevelofficer-3</option>
                    <option value="middlelevelofficer-4">middlelevelofficer-4</option>
                    <option value="middlelevelofficer-5">middlelevelofficer-5</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-600 font-medium block mb-2">
                    Select Employee <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={userAssignUser}
                    onChange={(e) => setUserAssignUser(e.target.value)}
                    disabled={!userAssignRole}
                  >
                    <option value="">Select Employee</option>
                    {userAssignRole && (
                      <>
                        <option value="EMP001|John Doe">John Doe (EMP001)</option>
                        <option value="EMP002|Jane Smith">Jane Smith (EMP002)</option>
                        <option value="EMP003|Robert Johnson">Robert Johnson (EMP003)</option>
                        <option value="EMP004|Emily Davis">Emily Davis (EMP004)</option>
                        <option value="EMP005|Michael Wilson">Michael Wilson (EMP005)</option>
                        <option value="EMP006|Sarah Brown">Sarah Brown (EMP006)</option>
                        <option value="EMP007|David Miller">David Miller (EMP007)</option>
                        <option value="EMP008|Lisa Anderson">Lisa Anderson (EMP008)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowUserAssignModal(false);
                    setSelectedPositionId(null);
                    setUserAssignRole("");
                    setUserAssignUser("");
                  }}
                  className="px-5 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (userAssignRole && userAssignUser) {
                      // Update the position with user assignment
                      const selectedPosition = positions.find(p => p.id === selectedPositionId);
                      if (selectedPosition) {
                        // Extract employee code and name from user selection
                        // Format: "EMP001|John Doe"
                        const [empCode, empName] = userAssignUser.split("|");
                        
                        setPositions(positions.map(p => 
                          p.id === selectedPositionId 
                            ? { ...p, empCode, empName }
                            : p
                        ));
                        showAlert("User assigned successfully!", "success");
                        setShowUserAssignModal(false);
                        setSelectedPositionId(null);
                        setUserAssignRole("");
                        setUserAssignUser("");
                      }
                    } else {
                      showAlert("Please fill in all required fields", "error");
                    }
                  }}
                  className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
