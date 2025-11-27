import React, { useState } from "react";
import Timeline from "./Timeline";
import MultipleWorksPreview from "./MultipleWorksPreview";

// Helper function to format currency
const fmtINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
    .format(n)
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
const FilePreview = ({ file, defaultName = "document.pdf", onClick }) => {
  const [imageError, setImageError] = useState(false);
  
  if (!file) {
    return <span className="text-gray-400 text-xs">No file</span>;
  }
  
  const fileInfo = getFileInfo(file, defaultName);
  const fileUrl = getFileUrl(file);
  const isImage = isImageFile(file) && !imageError;
  
  const handleClick = (e) => {
    e.preventDefault();
    if (fileUrl && onClick) {
      onClick(fileUrl);
    } else if (fileUrl) {
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

const PreviewModal = ({
  isOpen,
  onClose,
  onConfirm,
  selection = {},
  crStatus = "",
  crNumber = "",
  crDate = "",
  numberOfWorks = "",
  submissions = [],
  totalSubmittedCost = 0,
  committeeFile = null,
  councilFile = null,
  isEditing = false,
  showAlert = null, // Optional alert function
  user = null, // User object with username and role
  ulbName = "", // ULB (Urban Local Body) name
  verifiedPersonName = "", // Verified person name (from previous verification)
  verifiedPersonDesignation = "", // Verified person designation (from previous verification)
  verificationWord = "", // Verification word/signature (from previous verification)
  verificationTimestamp = null, // Verification timestamp (from previous verification)
  timeline = null, // Timeline data: { forwardedFrom: { name, timestamp }, verifiedBy: { name, timestamp }, forwardingTo: { name, section } }
  isBulkPreview = false, // Flag to indicate bulk preview mode
  crGroups = null, // Array of CR groups when multiple CRs exist: [{ crNumber, crDate, submissions }]
}) => {
  const [isVerified, setIsVerified] = useState(false);

  // Create dynamic timeline that updates when checkbox is checked
  const getDynamicTimeline = () => {
    if (!timeline) return null;
    
    // If checkbox is checked, add current user verification entry to timeline
    const dynamicTimeline = { ...timeline };
    
    // Use the same getDesignationFromRole function for consistency
    if (isVerified && !dynamicTimeline.currentUser && user) {
      dynamicTimeline.currentUser = {
        name: user?.username || "",
        designation: getDesignationFromRole(user?.role),
        timestamp: new Date().toISOString()
      };
    }
    
    return dynamicTimeline;
  };

  // Helper function to get designation from role
  const getDesignationFromRole = (role) => {
    if (!role) return "";
    const roleMap = {
      "engineer": "Engineer",
      "Commissioner": "Commissioner",
      "eeph": "Executive Engineer (PH)",
      "seph": "Superintending Engineer (PH)",
      "encph": "Engineer-in-Chief (PH)",
      "cdma": "Commissioner & Director of Municipal Administration"
    };
    return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Auto-populate verification fields from user if not already verified
  const getVerifierName = () => {
    if (verificationTimestamp && verifiedPersonName) {
      return verifiedPersonName; // Use stored verification data
    }
    return user?.username || "";
  };

  const getVerifierDesignation = () => {
    if (verificationTimestamp && verifiedPersonDesignation) {
      return verifiedPersonDesignation; // Use stored verification data
    }
    return getDesignationFromRole(user?.role) || "";
  };

  const getVerificationWord = () => {
    if (verificationTimestamp && verificationWord) {
      return verificationWord; // Use stored verification data
    }
    return "VERIFIED"; // Default verification word
  };

  // Reset verification when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setIsVerified(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCancel = () => {
    setIsVerified(false);
    onClose();
  };

  const handleConfirm = () => {
    if (!isVerified) {
      if (showAlert) {
        showAlert("Please check the verification checkbox before proceeding.", "error");
      } else {
        alert("Please check the verification checkbox before proceeding.");
      }
      return;
    }

    // Auto-populate verification data from user
    const verifierName = getVerifierName();
    const verifierDesignation = getVerifierDesignation();
    const verificationWordValue = getVerificationWord();

    // Validate that user information is available
    if (!verifierName.trim()) {
      if (showAlert) {
        showAlert("User information not available. Please ensure you are logged in.", "error");
      } else {
        alert("User information not available. Please ensure you are logged in.");
      }
      return;
    }

    // Create verification data with timestamp
    const verificationData = {
      verifiedPersonName: verifierName.trim(),
      verifiedPersonDesignation: verifierDesignation.trim(),
      verificationWord: verificationWordValue.trim(),
      verificationTimestamp: new Date().toISOString(),
    };

    setIsVerified(false);
    onConfirm(verificationData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-300">
          <h2 className="text-2xl font-bold text-gray-800">
            {isBulkPreview ? `Preview ${submissions.length} Work(s)` : "Preview Before Forwarding"}
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* PDF-like Preview Container */}
        <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg p-6 mb-4">
          {/* Header */}
          <div className="mb-6 pb-4 border-b-2 border-gray-400">
            <div className="flex items-center gap-4">
              {/* Logo on the left */}
              <div className="flex-shrink-0">
                <img 
                  src="/ap-logo.jpeg" 
                  alt="AP Government Logo" 
                  className="w-24 h-24 rounded object-contain"
                />
              </div>
              {/* Text content centered */}
              <div className="flex-1 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">15th Finance Commission</h2>
                <p className="text-sm text-gray-600">Government of Andhra Pradesh</p>
                <p className="text-sm text-gray-600 mt-1">Work Submission Preview</p>
                {ulbName && (
                  <p className="text-sm text-gray-600 mt-1">ULB: {ulbName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Selection Details */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-300">Selection Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Year:</span>
                <span className="ml-2 text-gray-900">{selection.year || "-"}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Installment:</span>
                <span className="ml-2 text-gray-900">{selection.installment || "-"}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Grant Type:</span>
                <span className="ml-2 text-gray-900">{selection.grantType || "-"}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Proposal:</span>
                <span className="ml-2 text-gray-900">{selection.program || "-"}</span>
              </div>
            </div>
          </div>

          {/* CR Details - Show single CR or multiple CRs */}
          {crStatus === "CR" && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-300">
                {crGroups && crGroups.length > 1 ? "CR Details (Multiple)" : "CR Details"}
              </h4>
              {crGroups && crGroups.length > 1 ? (
                // Multiple CRs - show grouped
                <div className="space-y-4">
                  {crGroups.map((group, groupIdx) => (
                    <div key={groupIdx} className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                      <div className="text-sm font-semibold text-gray-700 mb-2">
                        CR Group {groupIdx + 1} ({group.submissions.length} work{group.submissions.length > 1 ? 's' : ''})
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold text-gray-700">CR Number:</span>
                          <span className="ml-2 text-gray-900">{group.crNumber || "-"}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">CR Date:</span>
                          <span className="ml-2 text-gray-900">
                            {group.crDate ? (() => {
                              try {
                                const date = new Date(group.crDate);
                                if (!isNaN(date.getTime())) {
                                  return date.toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  });
                                }
                              } catch (e) {}
                              return group.crDate;
                            })() : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Single CR
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">CR Number:</span>
                    <span className="ml-2 text-gray-900">{crNumber || "-"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">CR Date:</span>
                    <span className="ml-2 text-gray-900">
                      {crDate ? (() => {
                        try {
                          const date = new Date(crDate);
                          if (!isNaN(date.getTime())) {
                            return date.toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            });
                          }
                        } catch (e) {}
                        return crDate;
                      })() : "-"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submissions Summary */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-300">Works Summary</h4>
            <div className="text-sm mb-3">
              <span className="font-semibold text-gray-700">Total Works Submitted:</span>
              <span className="ml-2 text-gray-900">{submissions.length + (isEditing ? 1 : 0)}</span>
            </div>
            <div className="text-sm mb-3">
              <span className="font-semibold text-gray-700">Total Estimated Cost:</span>
              <span className="ml-2 text-gray-900">{fmtINR(totalSubmittedCost)}</span>
            </div>
            
            {/* Works List - Table format for bulk preview, card format for single */}
            {isBulkPreview || submissions.length > 1 ? (
              <MultipleWorksPreview 
                submissions={submissions} 
                crGroups={crGroups}
              />
            ) : (
              <div className="mt-4">
                {submissions.map((sub, idx) => {
                  const workImageUrl = getFileUrl(sub.workImage);
                  const detailedReportUrl = getFileUrl(sub.detailedReport);
                  return (
                    <div key={sub.id || idx} className="mb-4 p-3 border border-gray-300 rounded-lg">
                      <h5 className="font-semibold text-gray-800 mb-2 text-sm">Work {idx + 1}</h5>
                      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                        <div>
                          <span className="font-semibold text-gray-700">Sector:</span>
                          <span className="ml-1 text-gray-900">{sub.sector || "-"}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Cost:</span>
                          <span className="ml-1 text-gray-900">{fmtINR(sub.cost || 0)}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Priority:</span>
                          <span className="ml-1 text-gray-900">{sub.priority || "-"}</span>
                        </div>
                      </div>
                      <div className="mb-2 text-xs">
                        <span className="font-semibold text-gray-700">Proposal:</span>
                        <span className="ml-1 text-gray-900">{sub.proposal || "-"}</span>
                      </div>
                      {workImageUrl && (
                        <div className="mb-2">
                          <span className="font-semibold text-gray-700 text-xs block mb-1">Work Image:</span>
                          <div className="border border-gray-300 rounded p-1 inline-block">
                            {isImageFile(sub.workImage) ? (
                              <img
                                src={workImageUrl}
                                alt="Work"
                                className="max-w-full max-h-32 rounded cursor-pointer hover:opacity-90"
                                onClick={() => window.open(workImageUrl, '_blank')}
                              />
                            ) : (
                              <FilePreview file={sub.workImage} defaultName="work-image.jpg" />
                            )}
                          </div>
                        </div>
                      )}
                      {detailedReportUrl && (
                        <div className="mb-2">
                          <span className="font-semibold text-gray-700 text-xs block mb-1">Estimation Report:</span>
                          <div className="flex items-center gap-2">
                            <FilePreview file={sub.detailedReport} defaultName="estimation-report.pdf" />
                            <a
                              href={detailedReportUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-xs underline"
                            >
                              View PDF
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Committee and Council Files - Show only if single CR or not bulk preview */}
          {(!isBulkPreview || !crGroups || crGroups.length === 1) && (
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-300">Attached Documents</h4>
              <div className="grid grid-cols-1 gap-4">
                {/* Committee Report */}
                {committeeFile && (
                  <div className="p-3 border border-gray-300 rounded">
                    <span className="font-semibold text-gray-700 text-sm block mb-2">Committee Report:</span>
                    <div className="flex items-center gap-2">
                      <FilePreview file={committeeFile} defaultName="committee-report.pdf" />
                      <a
                        href={getFileUrl(committeeFile)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs underline"
                      >
                        View PDF
                      </a>
                      <span className="text-green-600 text-xs">✓ Uploaded</span>
                    </div>
                  </div>
                )}
                
                {/* Council Resolution */}
                {councilFile && (
                  <div className="p-3 border border-gray-300 rounded">
                    <span className="font-semibold text-gray-700 text-sm block mb-2">Council Resolution:</span>
                    <div className="flex items-center gap-2">
                      <FilePreview file={councilFile} defaultName="council-resolution.pdf" />
                      <a
                        href={getFileUrl(councilFile)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs underline"
                      >
                        View PDF
                      </a>
                      <span className="text-green-600 text-xs">✓ Uploaded</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Acknowledgement - Show after Council Resolution */}
          <div className="mt-4 pt-4 border-t border-gray-300">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Acknowledgement</h4>
            {verificationTimestamp ? (
              <p className="text-sm text-gray-800 leading-relaxed">
                The above works are checked and verified by <span className="font-semibold">{verifiedPersonDesignation || "-"} {verifiedPersonName || "-"}</span> at{' '}
                <span className="font-semibold">
                  {new Date(verificationTimestamp).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZone: 'Asia/Kolkata'
                  })}
                </span>
              </p>
            ) : (
              <div className="text-sm text-gray-800">
                <p className="mb-2">
                  The above works are checked and verified by <span className="font-semibold">{getVerifierDesignation() || "-"} {getVerifierName() || "-"}</span> at{' '}
                  <span className="font-semibold">
                    {new Date().toLocaleString('en-IN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      timeZone: 'Asia/Kolkata'
                    })}
                  </span>
                </p>
                <p className="text-xs text-gray-600 italic">
                  * This acknowledgement will be finalized when you confirm verification below.
                </p>
              </div>
            )}
          </div>

          {/* Timeline - Show if timeline data is provided (after acknowledgement for both single and multiple works) */}
          {timeline && (
            <Timeline 
              timeline={getDynamicTimeline()} 
              user={user} 
              isVerified={isVerified}
            />
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t-2 border-gray-400 text-xs text-gray-600 text-center">
            <p>This is a preview of the submission. Please verify all details before forwarding.</p>
          </div>
        </div>

        {/* Verification Checkbox - Always show for bulk preview, hide for single if already verified */}
        <div className="mb-4 flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <input
            type="checkbox"
            id="verifyCheckbox"
            checked={isVerified}
            onChange={(e) => setIsVerified(e.target.checked)}
            disabled={!!verificationTimestamp && !isBulkPreview}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label htmlFor="verifyCheckbox" className="text-sm font-medium text-gray-700 cursor-pointer">
            I have verified all the details in the preview above and confirm that the information is correct.
          </label>
        </div>

        {/* OK and Cancel Buttons */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={handleCancel}
            className="px-6 py-2.5 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isVerified}
            className={`px-6 py-2.5 rounded-md font-medium transition-colors ${
              isVerified
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;

