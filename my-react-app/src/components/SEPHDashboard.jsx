import Header from "./Header";
import SidebarMenu from "./SidebarMenu";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PreviewModal from "./PreviewModal";

export default function SEPHDashboard({
  user,
  logout,
  forwardedSubmissions,
  setForwardedSubmissions,
}) {
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
  const [pendingList, setPendingList] = useState([]);
  const [approvedList, setApprovedList] = useState([]);
  const [forwardedList, setForwardedList] = useState([]);
  const [rejectedList, setRejectedList] = useState([]);

  const [previewSubmission, setPreviewSubmission] = useState(null);
  const [editable, setEditable] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [saveBanner, setSaveBanner] = useState("");
  const [approveBanner, setApproveBanner] = useState("");
  const [rejectBanner, setRejectBanner] = useState("");

  const [dept, setDept] = useState("");
  const [section, setSection] = useState("");
  const [forwardRemarks, setForwardRemarks] = useState("");

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
  const [forwardSuccess, setForwardSuccess] = useState("");

  const [showRejectPanel, setShowRejectPanel] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [showApprovePanel, setShowApprovePanel] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [approveRemarks, setApproveRemarks] = useState("");
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [selectedView, setSelectedView] = useState("pending"); // For card-based navigation

  // Multiple selection states
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [bulkRejectRemarks, setBulkRejectRemarks] = useState("");
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false);
  const [bulkApproveRemarks, setBulkApproveRemarks] = useState("");
  const [showBulkForwardModal, setShowBulkForwardModal] = useState(false);
  const [bulkApprovedItems, setBulkApprovedItems] = useState([]);
  const [forwardConfirmed, setForwardConfirmed] = useState(false);
  const [showBulkPreviewModal, setShowBulkPreviewModal] = useState(false);
  const [bulkPreviewSubmissions, setBulkPreviewSubmissions] = useState([]);

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

  const sectionMap = {
    "Administration": ["ENCPH Department"],
  };

  useEffect(() => {
    const pending = forwardedSubmissions.filter(
      (s) => {
        const status = (s.status || "").trim();
        const section = (s.forwardedTo?.section || "").trim();
        
        // Exclude already processed tasks
        const isProcessed = ["SEPH Approved", "SEPH Rejected", "ENCPH Rejected"].includes(status);
        if (isProcessed) return false;
        
        // Match status or section to SEPH
        const statusLower = status.toLowerCase();
        const sectionLower = section.toLowerCase();
        
        // Check if forwarded to SEPH by status
        if (statusLower.includes("forwarded to seph")) return true;
        
        // Check if forwarded to SEPH by section (exact match or contains)
        if (sectionLower === "seph" || sectionLower.includes("seph")) return true;
        
        // Check if status starts with "forwarded to" and section matches SEPH
        if (statusLower.startsWith("forwarded to") && (sectionLower === "seph" || sectionLower.includes("seph"))) return true;
        
        return false;
      }
    );
    setPendingList(pending);
    const approved = forwardedSubmissions.filter((s) => s.status === "SEPH Approved");
    setApprovedList(approved);
    const forwarded = forwardedSubmissions.filter((s) => {
      const status = (s.status || "").trim();
      const section = (s.forwardedTo?.section || "").trim();
      const statusLower = status.toLowerCase();
      const sectionLower = section.toLowerCase();
      return (
        statusLower.includes("forwarded to encph") ||
        sectionLower.includes("encph")
      );
    });
    setForwardedList(forwarded);
    const rejected = forwardedSubmissions.filter(
      (s) => s.status === "SEPH Rejected" || s.status === "ENCPH Rejected"
    );
    setRejectedList(rejected);
  }, [forwardedSubmissions]);

  // Helper functions for view
  const getListForView = (view) => {
    let list = [];
    switch (view) {
      case "pending":
        list = pendingList;
        break;
      case "allWorks":
        list = forwardedSubmissions.filter(s => {
          const status = (s.status || "").trim().toLowerCase();
          const section = (s.forwardedTo?.section || "").trim().toLowerCase();
          return status.includes("forwarded to seph") || section === "seph" || 
                 status.includes("seph approved") || status.includes("seph rejected") ||
                 status.includes("forwarded to encph") || section.includes("encph");
        });
        break;
      case "forwarded":
        list = forwardedList;
        break;
      case "rejected":
        list = rejectedList.filter(s => s.status === "SEPH Rejected");
        break;
      case "sentBackRejected":
        list = forwardedSubmissions.filter(s => s.status === "ENCPH Rejected");
        break;
      case "noOfCrs":
        list = forwardedSubmissions.filter(s => {
          const status = (s.status || "").trim().toLowerCase();
          const section = (s.forwardedTo?.section || "").trim().toLowerCase();
          return status.includes("forwarded to seph") || section === "seph" || 
                 status.includes("seph approved") || status.includes("seph rejected") ||
                 status.includes("forwarded to encph") || section.includes("encph");
        });
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
        return "Pending Works";
      case "allWorks":
        return "All Works";
      case "forwarded":
        return "Forwarded Tasks";
      case "rejected":
        return "Rejected Tasks";
      case "sentBackRejected":
        return "Sent Back Rejected List";
      case "noOfCrs":
        return "All Works (by CR Number)";
      default:
        return "Pending Works";
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
    return list.filter((item) => {
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

  useEffect(() => {
    return () => {
      urlCache.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

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
  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    if (logoutCallback) {
      await logoutCallback();
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
        showLogoutConfirmation(async () => {
          if (logout) {
            await logout();
          }
          navigate("/", { replace: true });
        });
        window.history.pushState(null, "", window.location.pathname);
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [location.pathname, logout, navigate]);

  // Extra: Intercept navigation to '/' with a prompt, not just popstate
  useEffect(() => {
    if (
      location.pathname === "/" &&
      window.history.state &&
      document.referrer && !document.referrer.includes("/login")
    ) {
      showLogoutConfirmation(async () => {
        if (logout) {
          await logout();
        }
        navigate("/", { replace: true });
      });
      window.history.go(1);
    }
  }, [location.pathname, logout, navigate]);

  // --- Modal ---
  const openPreview = (sub) => {
    // Get fresh submission from forwardedSubmissions to ensure we have all files
    const freshSub = forwardedSubmissions.find((f) => f.id === sub.id) || sub;
    
    console.log("🔍 SEPH openPreview - Original sub:", sub);
    console.log("🔍 SEPH openPreview - Fresh sub from array:", freshSub);
    console.log("🔍 SEPH openPreview - Files check:", {
      workImage: freshSub.workImage instanceof File,
      detailedReport: freshSub.detailedReport instanceof File,
      committeeReport: freshSub.committeeReport instanceof File,
      councilResolution: freshSub.councilResolution instanceof File,
      workImageExists: !!freshSub.workImage,
      detailedReportExists: !!freshSub.detailedReport,
      committeeReportExists: !!freshSub.committeeReport,
      councilResolutionExists: !!freshSub.councilResolution,
    });
    console.log("🔍 SEPH openPreview - File Details:", {
      workImage: freshSub.workImage ? (freshSub.workImage instanceof File ? `File: ${freshSub.workImage.name}` : typeof freshSub.workImage) : 'null',
      detailedReport: freshSub.detailedReport ? (freshSub.detailedReport instanceof File ? `File: ${freshSub.detailedReport.name}` : typeof freshSub.detailedReport) : 'null',
      committeeReport: freshSub.committeeReport ? (freshSub.committeeReport instanceof File ? `File: ${freshSub.committeeReport.name}` : typeof freshSub.committeeReport) : 'null',
      councilResolution: freshSub.councilResolution ? (freshSub.councilResolution instanceof File ? `File: ${freshSub.councilResolution.name}` : typeof freshSub.councilResolution) : 'null',
    });
    console.log("🔍 SEPH openPreview - Original sub Files:", {
      workImage: sub.workImage ? (sub.workImage instanceof File ? `File: ${sub.workImage.name}` : typeof sub.workImage) : 'null',
      detailedReport: sub.detailedReport ? (sub.detailedReport instanceof File ? `File: ${sub.detailedReport.name}` : typeof sub.detailedReport) : 'null',
      committeeReport: sub.committeeReport ? (sub.committeeReport instanceof File ? `File: ${sub.committeeReport.name}` : typeof sub.committeeReport) : 'null',
      councilResolution: sub.councilResolution ? (sub.councilResolution instanceof File ? `File: ${sub.councilResolution.name}` : typeof sub.councilResolution) : 'null',
    });
    
    // Ensure we preserve files - check if files exist in original sub and merge
    const mergedSub = {
      ...freshSub,
      // Preserve files from original if they exist there but not in fresh
      workImage: freshSub.workImage || sub.workImage || null,
      detailedReport: freshSub.detailedReport || sub.detailedReport || null,
      committeeReport: freshSub.committeeReport || sub.committeeReport || null,
      councilResolution: freshSub.councilResolution || sub.councilResolution || null,
    };
    
    setPreviewSubmission(mergedSub);
    setEditable({
      sector: mergedSub.sector || "",
      proposal: mergedSub.proposal || "",
      cost: mergedSub.cost || 0,
      locality: mergedSub.locality || "",
      latlong: mergedSub.latlong || "",
      priority: mergedSub.priority || "",
      crNumber: mergedSub.crNumber || "",
      crDate: mergedSub.crDate || "",
      remarks: mergedSub.remarks || "",
      workImage: mergedSub.workImage || null,
      detailedReport: mergedSub.detailedReport || null,
      committeeReport: mergedSub.committeeReport || null,
      councilResolution: mergedSub.councilResolution || null,
      // Add selection details
      year: mergedSub.year || mergedSub.selection?.year || "",
      installment: mergedSub.installment || mergedSub.selection?.installment || "",
      grantType: mergedSub.grantType || mergedSub.selection?.grantType || "",
      program: mergedSub.program || mergedSub.selection?.program || "",
    });
    setModalOpen(true);
  };

  const saveEdits = () => {
    if (!previewSubmission) return;
    setForwardedSubmissions((prev) =>
      prev.map((f) =>
        f.id === previewSubmission.id
          ? { 
              ...f, 
              ...editable, 
              remarks: editable.remarks,
              // Preserve files if they exist in editable, otherwise keep original
              workImage: editable.workImage || f.workImage,
              detailedReport: editable.detailedReport || f.detailedReport,
              committeeReport: editable.committeeReport || f.committeeReport,
              councilResolution: editable.councilResolution || f.councilResolution,
              // Preserve selection details
              year: editable.year || f.year,
              installment: editable.installment || f.installment,
              grantType: editable.grantType || f.grantType,
              program: editable.program || f.program,
              selection: {
                year: editable.year || f.selection?.year || f.year || "",
                installment: editable.installment || f.selection?.installment || f.installment || "",
                grantType: editable.grantType || f.selection?.grantType || f.grantType || "",
                program: editable.program || f.selection?.program || f.program || ""
              }
            }
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
    setShowApprovePanel(false);
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
      const currentSub = prev.find((f) => f.id === previewSubmission.id);
      const updated = prev.map((f) =>
        f.id === previewSubmission.id 
          ? { 
              ...f, 
              status: "SEPH Approved", 
              remarks: approveRemarks || "",
              verifiedBy: dataToUse ? {
                name: dataToUse.verifiedPersonName,
                designation: dataToUse.verifiedPersonDesignation,
                timestamp: dataToUse.verificationTimestamp
              } : null,
              // Explicitly set sephVerifiedBy when SEPH approves
              sephVerifiedBy: dataToUse ? {
                name: dataToUse.verifiedPersonName,
                designation: dataToUse.verifiedPersonDesignation,
                timestamp: dataToUse.verificationTimestamp
              } : null,
              // Preserve previous verifications
              commissionerVerifiedBy: currentSub?.commissionerVerifiedBy || f.commissionerVerifiedBy,
              eephVerifiedBy: currentSub?.eephVerifiedBy || f.eephVerifiedBy
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
    // Close preview modal and show forward section
    setShowPreviewModal(false);
    setShowApprovePanel(true);
    setApprovalConfirmed(true);
    setDept("");
    setSection("");
    setForwardRemarks("");
    setApproveBanner("Work approved successfully by SEPH.");
    setTimeout(() => setApproveBanner(""), 1500);
  };

  // --- Reject ---
  const reject = (subId) => {
    const sub = forwardedSubmissions.find((f) => f.id === subId);
    if (!sub) return;
    // Close any other panels first
    setShowApprovePanel(false);
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

    setForwardedSubmissions((prev) =>
      prev.map((f) =>
        f.id === previewSubmission.id
          ? { ...f, status: "SEPH Rejected", remarks: rejectRemarks, rejectedBy: "SEPH" }
          : f
      )
    );
    setRejectBanner("Work rejected and sent back to EEPH.");
    setTimeout(() => {
      setRejectBanner("");
      setShowRejectPanel(false);
      setPreviewSubmission(null);
      setRejectRemarks("");
    }, 1500);
  };

  // --- Forward ---
  const forwardApprovedToDept = () => {
    if (!dept || !section || !previewSubmission) {
      showAlert("Select department and section", "error");
      return;
    }
    if (!forwardConfirmed) {
      showAlert("Please check 'Scrutinized and Recommended' before forwarding", "error");
      return;
    }
     setForwardedSubmissions((prev) => {
      // Get current submission from array to preserve files
      const currentSub = prev.find((f) => f.id === previewSubmission.id);
      
      const updated = prev.map((f) =>
        f.id === previewSubmission.id
          ? {
              ...f,
              forwardedTo: {
                department: dept,
                section,
              },
              status: "Forwarded to ENCPH",
              // Preserve all verifications
              commissionerVerifiedBy: currentSub?.commissionerVerifiedBy || f.commissionerVerifiedBy,
              eephVerifiedBy: currentSub?.eephVerifiedBy || f.eephVerifiedBy,
              sephVerifiedBy: currentSub?.sephVerifiedBy || (currentSub?.verifiedBy && currentSub?.status === "SEPH Approved" ? currentSub.verifiedBy : f.sephVerifiedBy),
              // Explicitly preserve all file properties - check multiple sources
              workImage: previewSubmission.workImage || f.workImage || currentSub?.workImage || null,
              detailedReport: previewSubmission.detailedReport || f.detailedReport || currentSub?.detailedReport || null,
              committeeReport: previewSubmission.committeeReport || f.committeeReport || currentSub?.committeeReport || null,
              councilResolution: previewSubmission.councilResolution || f.councilResolution || currentSub?.councilResolution || null,
            }
          : f
      );
      
      // Debug: Log files after forwarding
      const forwardedSub = updated.find((f) => f.id === previewSubmission.id);
      console.log("✅ SEPH forwarded to ENCPH - Files check:", {
        id: forwardedSub?.id,
        hasCommitteeReport: !!forwardedSub?.committeeReport,
        hasCouncilResolution: !!forwardedSub?.councilResolution,
        committeeReportType: forwardedSub?.committeeReport ? (typeof forwardedSub.committeeReport) : 'null',
        councilResolutionType: forwardedSub?.councilResolution ? (typeof forwardedSub.councilResolution) : 'null',
      });
      
      return updated;
    });
    // Close modal immediately
    setShowApprovePanel(false);
    setApprovalConfirmed(false);
    setApproveRemarks("");
    setPreviewSubmission(null);
    setDept("");
    setSection("");
    setForwardRemarks("");
    
    // Show alert message (auto-dismisses after 3 seconds)
    showAlert("Task is forwarded successfully", "success");
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
    const eligibleItems = currentList.filter(s => !isActionDisabled(s.status)).map(s => s.id);
    
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

    // Get all selected submissions and show preview first
    const selectedSubmissions = forwardedSubmissions.filter((f) => 
      selectedItems.includes(f.id)
    );
    
    if (selectedSubmissions.length === 0) {
      showAlert("Selected items not found.", "error");
      return;
    }

    setBulkPreviewSubmissions(selectedSubmissions);
    setShowBulkPreviewModal(true);
  };

  const confirmBulkApprove = () => {
    // Validate that Verification Note is filled
    if (!bulkApproveRemarks || bulkApproveRemarks.trim() === "") {
      showAlert("Please enter Verification Note before approving.", "error");
      return;
    }

    const count = selectedItems.length;

    // First, approve the items
    setForwardedSubmissions((prev) => {
      return prev.map((f) => {
        if (selectedItems.includes(f.id)) {
          return { 
            ...f, 
            status: "SEPH Approved", 
            remarks: bulkApproveRemarks,
            // Preserve files
            workImage: f.workImage,
            detailedReport: f.detailedReport,
            committeeReport: f.committeeReport,
            councilResolution: f.councilResolution,
          };
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
    
    // Open forwarding modal
    setShowBulkForwardModal(true);
    setDept("");
    setSection("");
    setForwardRemarks("");
    setApproveBanner(`${count} work(s) approved successfully by SEPH.`);
    setTimeout(() => setApproveBanner(""), 3000);
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
            status: "SEPH Rejected", 
            remarks: bulkRejectRemarks, 
            rejectedBy: "SEPH",
            // Preserve files
            workImage: f.workImage,
            detailedReport: f.detailedReport,
            committeeReport: f.committeeReport,
            councilResolution: f.councilResolution,
          };
        }
        return f;
      });
    });

    setSelectedItems([]);
    setBulkRejectRemarks("");
    setShowBulkRejectModal(false);
    setRejectBanner(`${count} work(s) rejected and sent back to EEPH.`);
    setTimeout(() => setRejectBanner(""), 3000);
  };

  const forwardBulkApprovedToDept = () => {
    if (!dept || !section || bulkApprovedItems.length === 0) {
      showAlert("Select department and section", "error");
      return;
    }
    if (!forwardConfirmed) {
      showAlert("Please check 'Scrutinized and Recommended' before forwarding", "error");
      return;
    }

    const count = bulkApprovedItems.length;

    setForwardedSubmissions((prev) => {
      return prev.map((f) => {
        if (bulkApprovedItems.includes(f.id)) {
          const currentSub = prev.find((sub) => sub.id === f.id);
          return {
            ...f,
            forwardedTo: {
              department: dept,
              section,
            },
            status: "Forwarded to ENCPH",
            // Preserve all verifications
            commissionerVerifiedBy: currentSub?.commissionerVerifiedBy || f.commissionerVerifiedBy,
            eephVerifiedBy: currentSub?.eephVerifiedBy || f.eephVerifiedBy,
            sephVerifiedBy: currentSub?.sephVerifiedBy || (currentSub?.verifiedBy && currentSub?.status === "SEPH Approved" ? currentSub.verifiedBy : f.sephVerifiedBy),
            // Explicitly preserve all file properties
            workImage: f.workImage || currentSub?.workImage || null,
            detailedReport: f.detailedReport || currentSub?.detailedReport || null,
            committeeReport: f.committeeReport || currentSub?.committeeReport || null,
            councilResolution: f.councilResolution || currentSub?.councilResolution || null,
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
    ["SEPH Approved", "SEPH Rejected"].includes(status);

  const [selectedMenuItem, setSelectedMenuItem] = useState("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(true);

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
  ];

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 w-full bg-white shadow-md z-50 p-6 pb-0">
        <Header
          title="15th Finance Commission"
          user={user}
          onLogout={(e) => {
            if (e) {
              e.preventDefault();
              e.stopPropagation();
            }
            showLogoutConfirmation(async () => {
              if (logout) {
                await logout();
              }
              navigate("/", { replace: true });
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
            <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="font-semibold text-gray-700 mb-4">SEPH Dashboard</h2>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {/* No. of CR's */}
            <div 
              onClick={() => setSelectedView("noOfCrs")}
              className={`bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-pointer hover:bg-blue-100 transition ${selectedView === "noOfCrs" ? "ring-2 ring-blue-500" : ""}`}
            >
              <div className="text-sm text-blue-600 font-bold mb-1">No. of CR's</div>
              <div className="text-xl font-bold text-blue-700">
                {(() => {
                  // Use the same data source as getListForView("noOfCrs")
                  const crList = getListForView("noOfCrs");
                  const groupedByCR = {};
                  crList.forEach((s) => {
                    const crKey = (s.crNumber || "").trim().toUpperCase() || "__NO_CR__";
                    if (!groupedByCR[crKey]) groupedByCR[crKey] = [];
                    groupedByCR[crKey].push(s);
                  });
                  // Exclude "__NO_CR__" from count (same as table logic)
                  return Object.keys(groupedByCR).filter(key => key !== "__NO_CR__").length;
                })()}
              </div>
            </div>

            {/* No. of Works */}
            <div 
              onClick={() => setSelectedView("allWorks")}
              className={`bg-purple-50 border border-purple-200 rounded-lg p-3 cursor-pointer hover:bg-purple-100 transition ${selectedView === "allWorks" ? "ring-2 ring-purple-500" : ""}`}
            >
              <div className="text-sm text-purple-600 font-bold mb-1">No. of Works</div>
              <div className="text-xl font-bold text-purple-700">
                {forwardedSubmissions.filter(s => {
                  const status = (s.status || "").trim().toLowerCase();
                  const section = (s.forwardedTo?.section || "").trim().toLowerCase();
                  return status.includes("forwarded to seph") || section === "seph" || 
                         status.includes("seph approved") || status.includes("seph rejected") ||
                         status.includes("forwarded to encph") || section.includes("encph");
                }).length}
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

            {/* No. of Rejected */}
            <div 
              onClick={() => setSelectedView("rejected")}
              className={`bg-red-50 border border-red-200 rounded-lg p-3 cursor-pointer hover:bg-red-100 transition ${selectedView === "rejected" ? "ring-2 ring-red-500" : ""}`}
            >
              <div className="text-sm text-red-600 font-bold mb-1">No. of Rejected</div>
              <div className="text-xl font-bold text-red-700">
                {rejectedList.filter(s => s.status === "SEPH Rejected").length}
              </div>
            </div>

            {/* Sent Back Rejected List */}
            <div 
              onClick={() => setSelectedView("sentBackRejected")}
              className={`bg-orange-50 border border-orange-200 rounded-lg p-3 cursor-pointer hover:bg-orange-100 transition ${selectedView === "sentBackRejected" ? "ring-2 ring-orange-500" : ""}`}
            >
              <div className="text-sm text-orange-600 font-bold mb-1 whitespace-nowrap">Sent Back Rejected List</div>
              <div className="text-xl font-bold text-orange-700">
                {forwardedSubmissions.filter(s => s.status === "ENCPH Rejected").length}
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
            const filteredList = applyFilters(currentList);
            const viewTitle = getViewTitle(selectedView);
            const uniqueSectors = getUniqueSectors(currentList);
            const uniqueStatuses = getUniqueStatuses(currentList);
            
            const showActions = selectedView === "pending";
            return (
              <>
                <h3 className="text-sm text-gray-600 mb-4">{viewTitle}</h3>
                
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
                                  const eligibleItems = filteredList.filter(s => !isActionDisabled(s.status)).map(s => s.id);
                                  return eligibleItems.length > 0 && eligibleItems.every(id => selectedItems.includes(id));
                                })()}
                                onChange={handleSelectAll}
                                className="cursor-pointer"
                              />
                            </th>
                          )}
                          <th className="p-2 text-left whitespace-nowrap text-xs">S.No</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs">Year</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs">Installment</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs">GrantType</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs">Proposal</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs">
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
                          <th className="p-2 text-left whitespace-nowrap text-xs">
                            <div className="flex items-center gap-1">
                              <span>CR Date</span>
                              <button
                                onClick={() => toggleFilter('crDate')}
                                className="text-xs "
                                title="Filter by CR Date"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="11" cy="11" r="8"></circle>
                                  <path d="m21 21-4.35-4.35"></path>
                                </svg>
                              </button>
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
                          <th className="p-2 text-left whitespace-nowrap text-xs">
                            <div className="flex items-center gap-1">
                              <span>Sector</span>
                              <button
                                onClick={() => toggleFilter('sector')}
                                className="text-xs "
                                title="Filter by Sector"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="11" cy="11" r="8"></circle>
                                  <path d="m21 21-4.35-4.35"></path>
                                </svg>
                              </button>
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
                          <th className="p-2 text-left text-xs">
                            <div className="flex items-center gap-1">
                              <span>WorkName</span>
                              <button
                                onClick={() => toggleFilter('proposal')}
                                className="text-xs "
                                title="Filter by WorkName"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="11" cy="11" r="8"></circle>
                                  <path d="m21 21-4.35-4.35"></path>
                                </svg>
                              </button>
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
                          <th className="p-2 text-left whitespace-nowrap text-xs">
                            <div className="flex items-center gap-1">
                              <span>Cost</span>
                              <button
                                onClick={() => toggleFilter('cost')}
                                className="text-xs "
                                title="Filter by Cost"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="11" cy="11" r="8"></circle>
                                  <path d="m21 21-4.35-4.35"></path>
                                </svg>
                              </button>
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
                          <th className="p-2 text-left whitespace-nowrap text-xs">
                            <div className="flex items-center gap-1">
                              <span>Locality</span>
                              <button
                                onClick={() => toggleFilter('locality')}
                                className="text-xs "
                                title="Filter by Locality"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="11" cy="11" r="8"></circle>
                                  <path d="m21 21-4.35-4.35"></path>
                                </svg>
                              </button>
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
                          <th className="p-2 text-left whitespace-nowrap text-xs">
                            <div className="flex items-center gap-1">
                              <span>Lat/Long</span>
                              <button
                                onClick={() => toggleFilter('latLong')}
                                className="text-xs "
                                title="Filter by Lat/Long"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="11" cy="11" r="8"></circle>
                                  <path d="m21 21-4.35-4.35"></path>
                                </svg>
                              </button>
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
                          <th className="p-2 text-left whitespace-nowrap text-xs">
                            <div className="flex items-center gap-1">
                              <span>Priority</span>
                              <button
                                onClick={() => toggleFilter('priority')}
                                className="text-xs "
                                title="Filter by Priority"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="11" cy="11" r="8"></circle>
                                  <path d="m21 21-4.35-4.35"></path>
                                </svg>
                              </button>
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
                          <th className="p-2 text-left whitespace-nowrap text-xs">Work Image</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs">Estimation Report</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs">Committee Report</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs">Council Resolution</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs">
                            <div className="flex items-center gap-1">
                              <span>Status</span>
                              <button
                                onClick={() => toggleFilter('status')}
                                className="text-xs "
                                title="Filter by Status"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="11" cy="11" r="8"></circle>
                                  <path d="m21 21-4.35-4.35"></path>
                                </svg>
                              </button>
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
                              {(filters.crNumber || filters.crDate || filters.sector || filters.status || filters.proposal || filters.cost || filters.locality || filters.latLong || filters.priority) && (
                                <button
                                  onClick={() => {
                                    setFilters({ crNumber: "", crDate: "", sector: "", status: "", proposal: "", cost: "", locality: "", latLong: "", priority: "" });
                                    setActiveFilters({ crNumber: false, crDate: false, sector: false, status: false, proposal: false, cost: false, locality: false, latLong: false, priority: false });
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 px-1 ml-1"
                                  title="Clear Filters"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </th>
                          {selectedView === "pending" && <th className="p-2 text-left text-xs">Actions</th>}
                          {(selectedView === "rejected" || selectedView === "sentBackRejected") && <th className="p-2 text-left text-xs">Remarks</th>}
                  </tr>
                </thead>
                <tbody>
                        {(() => {
                          // Show "No results found" message if filteredList is empty
                          if (filteredList.length === 0) {
                            const columnCount = showActions ? 16 : (selectedView === "rejected" || selectedView === "sentBackRejected") ? 15 : 14;
                            return (
                              <tr>
                                <td colSpan={columnCount} className="p-8 text-center text-gray-500 text-sm">
                                  No results found. Please try different search criteria.
                                </td>
                              </tr>
                            );
                          }

                          if (selectedView === "noOfCrs") {
                            // Group by CR number for CR view
                            const groupedByCR = {};
                            filteredList.forEach((s) => {
                              const crKey = (s.crNumber || "").trim().toUpperCase() || "__NO_CR__";
                              if (!groupedByCR[crKey]) {
                                groupedByCR[crKey] = [];
                              }
                              groupedByCR[crKey].push(s);
                            });
                            
                            const crGroups = Object.values(groupedByCR).filter(group => {
                              // Filter out groups with __NO_CR__ key
                              const firstItem = group[0];
                              const crKey = (firstItem.crNumber || "").trim().toUpperCase() || "__NO_CR__";
                              return crKey !== "__NO_CR__";
                            });
                            
                            // If no groups found, show message
                            if (crGroups.length === 0) {
                              const columnCount = showActions ? 16 : (selectedView === "rejected" || selectedView === "sentBackRejected") ? 15 : 14;
                              return (
                                <tr>
                                  <td colSpan={columnCount} className="p-8 text-center text-gray-500 text-sm">
                                    No results found. Please try different search criteria.
                                  </td>
                                </tr>
                              );
                            }
                            
                            let globalSerial = 0;
                            
                            return crGroups.map((group) => {
                              return group.map((s, idxInGroup) => {
                                const isFirstInGroup = idxInGroup === 0;
                                if (isFirstInGroup) globalSerial++;
                                const canSelect = !isActionDisabled(s.status);
                                return (
                                  <tr key={s.id} className="border-b hover:bg-gray-50">
                                    {showActions && isFirstInGroup && (
                                      <td className="p-2 align-top border-r border-gray-300" rowSpan={group.length}>
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
                                      <FilePreview file={s.detailedReport} defaultName="estimation-report.pdf" />
                                    </td>
                                    <td className="p-2 text-xs align-top">
                                      <FilePreview file={s.committeeReport} defaultName="committee-report.pdf" />
                                    </td>
                                    <td className="p-2 text-xs align-top">
                                      <FilePreview file={s.councilResolution} defaultName="council-resolution.pdf" />
                                    </td>
                                    <td className="p-2 text-xs align-top">{s.status || "Pending"}</td>
                                  </tr>
                                );
                              });
                            }).flat();
                          } else if (selectedView === "allWorks") {
                            // For allWorks view, show serial number for every row
                            return filteredList.map((s, i) => (
                              <tr key={s.id} className="border-b hover:bg-gray-50">
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
                                <td className="p-2 text-xs align-top">{s.status || "Pending"}</td>
                              </tr>
                            ));
                          } else {
                            // For other views (pending, forwarded, rejected, sentBackRejected), show serial number for every row
                            return filteredList.map((s, i) => {
                              const canSelect = !isActionDisabled(s.status);
                              return (
                              <tr key={s.id} className="border-b hover:bg-gray-50">
                                {showActions && (
                                  <td className="p-2 align-top border-r border-gray-300">
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
                                  <FilePreview file={s.detailedReport} defaultName="estimation-report.pdf" />
                                </td>
                                <td className="p-2 text-xs align-top">
                                  <FilePreview file={s.committeeReport} defaultName="committee-report.pdf" />
                                </td>
                                <td className="p-2 text-xs align-top">
                                  <FilePreview file={s.councilResolution} defaultName="council-resolution.pdf" />
                                </td>
                                <td className="p-2 text-xs align-top">{s.status || "Pending"}</td>
                                {selectedView === "pending" && (
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
                                        disabled={isActionDisabled(s.status)}
                                        className={`px-2 py-1 text-xs rounded ${
                                          s.status === "SEPH Approved"
                                            ? "bg-gray-300"
                                            : "bg-green-600 text-white"
                                        }`}
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => reject(s.id)}
                                        disabled={s.status === "SEPH Rejected"}
                                        className={`px-2 py-1 text-xs rounded ${
                                          s.status === "SEPH Rejected"
                                            ? "bg-gray-300"
                                            : "bg-red-600 text-white"
                                        }`}
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  </td>
                                )}
                                {(selectedView === "rejected" || selectedView === "sentBackRejected") && (
                                  <td className="p-2 text-xs text-gray-600 max-w-xs truncate align-top" title={s.remarks || "-"}>{s.remarks || "-"}</td>
                                )}
                              </tr>
                            );
                            });
                          }
                        })()}
                </tbody>
              </table>
            </div>
              </>
            );
          })()}

          {/* Approve Remarks Modal */}
          {/* Preview Modal for Approval */}
          {showPreviewModal && previewSubmission && (() => {
            // Build timeline data for SEPH
            // Step 1: Engineer (who forwarded)
            // Step 2: Commissioner (who verified - from submission data)
            // Step 3: EEPH (who verified - if status is EEPH Approved)
            // Step 4: SEPH (current user - will be added when checkbox is clicked)
            const status = previewSubmission.status || "";
            const isEEPHApproved = status === "EEPH Approved" || (status && status.toLowerCase().includes("eeph approved"));
            const isForwardedToSEPH = status === "Forwarded to SEPH" || (status && status.toLowerCase().includes("forwarded to seph"));
            
            // EEPH verification can be in eephVerifiedBy (preserved when forwarding) or verifiedBy (if status is EEPH Approved)
            const eephVerification = previewSubmission.eephVerifiedBy ? {
              name: previewSubmission.eephVerifiedBy.name || previewSubmission.eephVerifiedBy.designation || "EEPH",
              timestamp: previewSubmission.eephVerifiedBy.timestamp || null
            } : (isEEPHApproved && previewSubmission.verifiedBy ? {
              name: previewSubmission.verifiedBy.name || previewSubmission.verifiedBy.designation || "EEPH",
              timestamp: previewSubmission.verifiedBy.timestamp || null
            } : (isForwardedToSEPH && previewSubmission.verifiedBy ? {
              // If forwarded to SEPH, verifiedBy might still contain EEPH's info
              name: previewSubmission.verifiedBy.name || previewSubmission.verifiedBy.designation || "EEPH",
              timestamp: previewSubmission.verifiedBy.timestamp || null
            } : null));
            
            // Commissioner verification - prioritize commissionerVerifiedBy
            // When status is "Forwarded to SEPH" or "EEPH Approved", verifiedBy contains EEPH's info, so we must use commissionerVerifiedBy
            // Also check if verifiedBy has Commissioner designation as a fallback
            let commissionerVerification = null;
            
            if (previewSubmission.commissionerVerifiedBy) {
              commissionerVerification = {
                name: previewSubmission.commissionerVerifiedBy.name || previewSubmission.commissionerVerifiedBy.designation || "Ramesh",
                timestamp: previewSubmission.commissionerVerifiedBy.timestamp || null
              };
            } else if (previewSubmission.verifiedBy && previewSubmission.status === "Approved") {
              // Only use verifiedBy if status is "Approved" (Commissioner's approval)
              const designation = (previewSubmission.verifiedBy.designation || "").toLowerCase();
              if (designation.includes("commissioner") && 
                  !designation.includes("eeph") && 
                  !designation.includes("seph") && 
                  !designation.includes("encph") && 
                  !designation.includes("cdma")) {
                commissionerVerification = {
                  name: previewSubmission.verifiedBy.name || previewSubmission.verifiedBy.designation || "Ramesh",
                  timestamp: previewSubmission.verifiedBy.timestamp || null
                };
              }
            }
            
            // If still not found but workflow has passed Commissioner, default to "Ramesh"
            if (!commissionerVerification) {
              const statusLower = status.toLowerCase();
              if (statusLower.includes("forwarded to seph") || 
                  statusLower.includes("forwarded to encph") || 
                  statusLower.includes("forwarded to cdma") ||
                  statusLower.includes("eeph approved") ||
                  statusLower.includes("seph approved") ||
                  statusLower.includes("encph approved")) {
                commissionerVerification = {
                  name: "Ramesh",
                  timestamp: null
                };
              }
            }
            
            console.log("🔍 SEPH Commissioner Verification Debug:", {
              hasCommissionerVerifiedBy: !!previewSubmission.commissionerVerifiedBy,
              commissionerVerifiedBy: previewSubmission.commissionerVerifiedBy,
              verifiedBy: previewSubmission.verifiedBy,
              isEEPHApproved,
              isForwardedToSEPH,
              commissionerVerification
            });
            
            const timelineData = {
              forwardedFrom: previewSubmission.forwardedBy || previewSubmission.forwardedDate ? {
                name: previewSubmission.forwardedBy || "Engineer",
                timestamp: previewSubmission.forwardedDate || null
              } : null,
              // Commissioner verification
              verifiedBy: commissionerVerification,
              // EEPH verification (if status shows EEPH Approved)
              eephVerifiedBy: eephVerification,
              // Current user (SEPH) will be added dynamically when checkbox is clicked
              currentUser: null
            };
            
            console.log("🔍 SEPH Timeline Data Result:", timelineData);

            // Convert single submission to array format for PreviewModal
            const submissionArray = [previewSubmission];

            // Build selection data from submission
            const selectionData = previewSubmission.selection ? {
              year: previewSubmission.selection.year || "",
              installment: previewSubmission.selection.installment || "",
              grantType: previewSubmission.selection.grantType || "",
              program: previewSubmission.selection.program || ""
            } : {
              year: previewSubmission.year || "",
              installment: previewSubmission.installment || "",
              grantType: previewSubmission.grantType || "",
              program: previewSubmission.program || ""
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

          {/* Bulk Preview Modal */}
          {showBulkPreviewModal && bulkPreviewSubmissions.length > 0 && (() => {
            // Calculate total cost
            const totalCost = bulkPreviewSubmissions.reduce((sum, sub) => sum + (sub.cost || 0), 0);
            
            // Get unique CRs (group by CR number and date)
            const crGroups = {};
            bulkPreviewSubmissions.forEach((sub) => {
              const crKey = `${sub.crNumber || 'no-cr'}_${sub.crDate || 'no-date'}`;
              if (!crGroups[crKey]) {
                crGroups[crKey] = {
                  crNumber: sub.crNumber || "",
                  crDate: sub.crDate || "",
                  submissions: []
                };
              }
              crGroups[crKey].submissions.push(sub);
            });
            
            // Get selection data from first submission
            const firstSub = bulkPreviewSubmissions[0];
            const selectionData = firstSub.selection ? {
              year: firstSub.selection.year || "",
              installment: firstSub.selection.installment || "",
              grantType: firstSub.selection.grantType || "",
              program: firstSub.selection.program || ""
            } : {
              year: firstSub.year || "",
              installment: firstSub.installment || "",
              grantType: firstSub.grantType || "",
              program: firstSub.program || ""
            };

            // Build timeline data for bulk preview
            // Extract Commissioner verification - prioritize commissionerVerifiedBy
            let foundCommissionerVerification = null;
            
            // First, search for commissionerVerifiedBy in all submissions (most reliable)
            for (const sub of bulkPreviewSubmissions) {
              if (sub.commissionerVerifiedBy) {
                const name = sub.commissionerVerifiedBy.name || sub.commissionerVerifiedBy.designation;
                if (name) {
                  foundCommissionerVerification = {
                    name: name,
                    timestamp: sub.commissionerVerifiedBy.timestamp || null
                  };
                  break;
                }
              }
            }
            
            // If not found, check verifiedBy for Commissioner data (only if status is "Approved")
            if (!foundCommissionerVerification) {
              for (const sub of bulkPreviewSubmissions) {
                if (sub.verifiedBy && sub.status === "Approved") {
                  const designation = (sub.verifiedBy.designation || "").toLowerCase();
                  if (designation.includes("commissioner") && 
                      !designation.includes("eeph") && 
                      !designation.includes("seph") && 
                      !designation.includes("encph") && 
                      !designation.includes("cdma")) {
                    foundCommissionerVerification = {
                      name: sub.verifiedBy.name || sub.verifiedBy.designation || "Ramesh",
                      timestamp: sub.verifiedBy.timestamp || null
                    };
                    break;
                  }
                }
              }
            }
            
            // If still not found but workflow has passed Commissioner (status indicates it), default to "Ramesh"
            if (!foundCommissionerVerification) {
              const status = firstSub.status || "";
              const statusLower = status.toLowerCase();
              // If status indicates it's past Commissioner approval, default to "Ramesh"
              if (statusLower.includes("forwarded to seph") || 
                  statusLower.includes("forwarded to encph") || 
                  statusLower.includes("forwarded to cdma") ||
                  statusLower.includes("eeph approved") ||
                  statusLower.includes("seph approved") ||
                  statusLower.includes("encph approved")) {
                foundCommissionerVerification = {
                  name: "Ramesh",
                  timestamp: null
                };
              }
            }
            
            // Extract EEPH verification
            let foundEEPHVerification = null;
            for (const sub of bulkPreviewSubmissions) {
              if (sub.eephVerifiedBy) {
                foundEEPHVerification = {
                  name: sub.eephVerifiedBy.name || sub.eephVerifiedBy.designation || "EEPH",
                  timestamp: sub.eephVerifiedBy.timestamp || null
                };
                break;
              }
            }
            
            const timelineData = {
              forwardedFrom: firstSub.forwardedBy || firstSub.forwardedDate ? {
                name: firstSub.forwardedBy || "Engineer",
                timestamp: firstSub.forwardedDate || null
              } : null,
              verifiedBy: foundCommissionerVerification,
              eephVerifiedBy: foundEEPHVerification,
              sephVerifiedBy: null, // Will be added when checkbox is checked
              forwardingTo: null
            };

            return (
              <PreviewModal
                isOpen={showBulkPreviewModal}
                onClose={() => {
                  setShowBulkPreviewModal(false);
                  setBulkPreviewSubmissions([]);
                }}
                onConfirm={(verificationData) => {
                  // Store verification data
                  setVerificationData(verificationData);
                  
                  // Close preview
                  setShowBulkPreviewModal(false);
                  
                  // Proceed with approval and show forward modal
                  const count = selectedItems.length;
                  
                  // Approve the items
                  setForwardedSubmissions((prev) => {
                    return prev.map((f) => {
                      if (selectedItems.includes(f.id)) {
                        return { 
                          ...f, 
                          status: "SEPH Approved", 
                          remarks: bulkApproveRemarks || "",
                          verifiedBy: verificationData ? {
                            name: verificationData.verifiedPersonName,
                            designation: verificationData.verifiedPersonDesignation,
                            timestamp: verificationData.verificationTimestamp
                          } : null,
                          // Preserve files
                          workImage: f.workImage,
                          detailedReport: f.detailedReport,
                          committeeReport: f.committeeReport,
                          councilResolution: f.councilResolution,
                        };
                      }
                      return f;
                    });
                  });

                  // Store the approved item IDs for forwarding
                  setBulkApprovedItems([...selectedItems]);
                  setSelectedItems([]);
                  
                  // Clear preview data
                  setBulkPreviewSubmissions([]);
                  
                  // Open forwarding modal
                  setShowBulkForwardModal(true);
                  setForwardConfirmed(false);
                }}
                selection={selectionData}
                crStatus={Object.keys(crGroups).length > 0 ? "CR" : ""}
                crNumber={Object.keys(crGroups).length === 1 ? Object.values(crGroups)[0].crNumber : ""}
                crDate={Object.keys(crGroups).length === 1 ? Object.values(crGroups)[0].crDate : ""}
                numberOfWorks={bulkPreviewSubmissions.length.toString()}
                submissions={bulkPreviewSubmissions}
                totalSubmittedCost={totalCost}
                committeeFile={null}
                councilFile={null}
                isEditing={false}
                showAlert={showAlert}
                user={user}
                ulbName={user?.ulb || "Vijayawada"}
                verifiedPersonName=""
                verifiedPersonDesignation=""
                verificationWord=""
                verificationTimestamp={null}
                timeline={timelineData}
                isBulkPreview={true}
                crGroups={Object.keys(crGroups).length > 1 ? Object.values(crGroups) : null}
              />
            );
          })()}

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
                      <label className="text-sm text-gray-600 font-medium">Verification Note <span className="text-red-500">*</span></label>
                      <textarea
                        className="w-full border p-3 rounded mt-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        rows={6}
                        value={approveRemarks}
                        onChange={(e) => setApproveRemarks(e.target.value)}
                        placeholder="Enter verification note (required)..."
                        required
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
                        className="px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700"
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
              </div>
                    {forwardSuccess && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">
                        {forwardSuccess}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-4">
                      <input
                        type="checkbox"
                        id="forwardConfirmedSEPH"
                        checked={forwardConfirmed}
                        onChange={(e) => setForwardConfirmed(e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <label htmlFor="forwardConfirmedSEPH" className="text-sm text-gray-700 font-medium">
                        Scrutinized and Recommended
                      </label>
                    </div>
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
                    <p className="text-sm"><span className="font-medium">CR Number:</span> {previewSubmission.crNumber || "-"}</p>
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

          {/* Approved Table - Only show if viewing default (pending) */}
          {selectedView === "pending" && approvedList.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2 text-sm">Approved by SEPH</h4>
              <div className="overflow-auto max-h-48">
               <table className="min-w-full text-sm border-collapse">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="p-2 text-left whitespace-nowrap text-xs">S.No</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">Year</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">Installment</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">GrantType</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">Proposal</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">CR Number</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">CR Date</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">Sector</th>
                      <th className="p-2 text-left text-xs">WorkName</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">Cost</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">Locality</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">Lat/Long</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">Priority</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">Work Image</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">Estimation Report</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">Committee Report</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">Council Resolution</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedList.map((s, i) => (
                      <tr key={s.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 text-xs">{i + 1}</td>
                        <td className="p-2 text-xs">{s.crNumber || "-"}</td>
                        <td className="p-2 text-xs">{s.crDate || "-"}</td>
                        <td className="p-2 text-xs">{s.sector}</td>
                        <td className="p-2 text-xs max-w-xs truncate" title={s.proposal}>{s.proposal}</td>
                        <td className="p-2 text-xs">{fmtINR(s.cost)}</td>
                        <td className="p-2 text-xs max-w-xs truncate" title={formatLocality(s)}>{formatLocality(s) || "-"}</td>
                        <td className="p-2 text-xs max-w-xs truncate" title={s.latlong || "-"}>
                          {s.latlong ? (s.latlong.length > 20 ? s.latlong.substring(0, 20) + "..." : s.latlong) : "-"}
                        </td>
                        <td className="p-2 text-xs">{s.priority}</td>
                        <td className="p-2 text-xs">
                          <FilePreview file={s.workImage} defaultName="work-image.jpg" />
                        </td>
                        <td className="p-2 text-xs">
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
                        <td className="p-2 text-xs text-green-700">SEPH Approved</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}



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

                {/* Selection Details Section */}
                <div className="mb-4 pb-4 border-b border-gray-300">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Selection Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="text-sm text-gray-600">Year</label>
                      <select
                        className="w-full border p-2 rounded mt-1"
                        value={editable.year || ""}
                        onChange={(e) =>
                          setEditable({ ...editable, year: e.target.value })
                        }
                      >
                        <option value="">Select year</option>
                        <option>2021-22</option>
                        <option>2022-23</option>
                        <option>2023-24</option>
                        <option>2024-25</option>
                        <option>2025-26</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Installment</label>
                      <select
                        className="w-full border p-2 rounded mt-1"
                        value={editable.installment || ""}
                        onChange={(e) =>
                          setEditable({ ...editable, installment: e.target.value })
                        }
                        disabled={!editable.year}
                      >
                        <option value="">Select installment</option>
                        <option>First Installment</option>
                        <option>Second Installment</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Grant Type</label>
                      <select
                        className="w-full border p-2 rounded mt-1"
                        value={editable.grantType || ""}
                        onChange={(e) =>
                          setEditable({ ...editable, grantType: e.target.value })
                        }
                        disabled={!editable.installment}
                      >
                        <option value="">Select grant type</option>
                        <option>Untied Grant</option>
                        <option>Tied Grant</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Proposal</label>
                      <select
                        className="w-full border p-2 rounded mt-1"
                        value={editable.program || ""}
                        onChange={(e) =>
                          setEditable({ ...editable, program: e.target.value })
                        }
                        disabled={!editable.grantType}
                      >
                        <option value="">Select proposal</option>
                        <option>ADP</option>
                        <option>RADP</option>
                      </select>
                    </div>
                  </div>
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
                  {(() => {
                    const imageFile = editable.workImage || previewSubmission.workImage;
                    const imageUrl = getFileUrl(imageFile);
                    return imageUrl && (
                      <div className="md:col-span-2 mt-2">
                        <label className="text-sm text-gray-600">Work Image</label>
                        <img
                          src={imageUrl}
                          alt=""
                          className="mt-2 rounded max-h-60"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    );
                  })()}
                </div>

                {/* File uploads section */}
                <div className="mt-4 space-y-4">
                  <h4 className="font-semibold text-sm text-gray-700">Attached Files</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Work Image */}
                    <div className="border rounded p-3 bg-gray-50">
                      <label className="text-sm text-gray-700 font-medium block mb-2">Work Image</label>
                      {(() => {
                        const imgFile = editable.workImage || previewSubmission.workImage;
                        const imageUrl = getFileUrl(imgFile);
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
                    </div>

                    {/* Detailed/Estimation Report */}
                    <div className="border rounded p-3 bg-gray-50">
                      <label className="text-sm text-gray-700 font-medium block mb-2">Detailed Estimation Report</label>
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
                              📄 View Report ({reportFile instanceof File ? reportFile.name : 'file'})
                            </a>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 mb-2">No report attached</div>
                        );
                      })()}
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
                              📄 View Report ({reportFile instanceof File ? reportFile.name : 'file'})
                            </a>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 mb-2">No report attached</div>
                        );
                      })()}
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
                              📄 View Report ({reportFile instanceof File ? reportFile.name : 'file'})
                            </a>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 mb-2">No report attached</div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm text-gray-600">
                    SEPH Remarks
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
                  <label className="text-sm text-gray-600 font-medium">Verification Note <span className="text-red-500">*</span></label>
                  <textarea
                    className="w-full border p-3 rounded mt-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows={6}
                    value={bulkApproveRemarks}
                    onChange={(e) => setBulkApproveRemarks(e.target.value)}
                    placeholder="Enter verification note (required)..."
                    required
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
                    className="px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700"
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
                </div>
                {forwardSuccess && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">
                    {forwardSuccess}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    id="bulkForwardConfirmedSEPH"
                    checked={forwardConfirmed}
                    onChange={(e) => setForwardConfirmed(e.target.checked)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="bulkForwardConfirmedSEPH" className="text-sm text-gray-700 font-medium">
                    Scrutinized and Recommended
                  </label>
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
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    } text-white`}
                  >
                    Forward
                  </button>
                </div>
              </div>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
