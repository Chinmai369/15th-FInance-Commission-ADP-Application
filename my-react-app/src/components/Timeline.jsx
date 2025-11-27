import React from "react";

/**
 * Timeline Component
 * Displays the workflow verification timeline based on user role
 * 
 * @param {Object} timeline - Timeline data object
 * @param {Object} user - Current user object with role
 * @param {boolean} isVerified - Whether current user has verified (checkbox checked)
 */
export default function Timeline({ timeline, user, isVerified = false }) {
  if (!timeline) return null;

  // Get role designation for display
  const getRoleDesignation = (role) => {
    if (!role) return "";
    const roleMap = {
      "engineer": "Engineer",
      "Commissioner": "Commissioner",
      "eeph": "EEPH",
      "seph": "SEPH",
      "encph": "ENCPH",
      "cdma": "CDMA"
    };
    return roleMap[role?.toLowerCase()] || role;
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
  };

  // Build timeline items based on user role
  const buildTimelineItems = () => {
    const items = [];
    const userRole = user?.role?.toLowerCase();

    // Step 1: Engineer (Admin) - Always show as "Verified by Engineer"
    if (timeline.forwardedFrom && timeline.forwardedFrom.name && timeline.forwardedFrom.name.trim()) {
      items.push({
        step: 1,
        color: "blue",
        designation: "Engineer",
        name: timeline.forwardedFrom.name,
        timestamp: timeline.forwardedFrom.timestamp
      });
    }

    // Step 2: Commissioner - Always show if verifiedBy exists
    if (timeline.verifiedBy) {
      items.push({
        step: 2,
        color: "green",
        designation: timeline.verifiedBy.designation || "Commissioner",
        name: timeline.verifiedBy.name || "-",
        timestamp: timeline.verifiedBy.timestamp
      });
    }

    // Step 3: EEPH - Show if eephVerifiedBy exists (for SEPH, ENCPH, CDMA) OR if current user is EEPH and checkbox is checked
    // But don't show if currentUser is being added (to avoid duplicate)
    if (timeline.eephVerifiedBy && (userRole === "seph" || userRole === "encph" || userRole === "cdma")) {
      items.push({
        step: 3,
        color: "orange",
        designation: "EEPH",
        name: timeline.eephVerifiedBy.name || "-",
        timestamp: timeline.eephVerifiedBy.timestamp
      });
    }
    
    // Also show EEPH if it exists in timeline for EEPH user (when viewing their own verification)
    if (timeline.eephVerifiedBy && userRole === "eeph" && !isVerified) {
      items.push({
        step: 3,
        color: "orange",
        designation: "EEPH",
        name: timeline.eephVerifiedBy.name || "-",
        timestamp: timeline.eephVerifiedBy.timestamp
      });
    }

    // Step 4: SEPH - Show for ENCPH and CDMA
    if (timeline.sephVerifiedBy && (userRole === "encph" || userRole === "cdma")) {
      items.push({
        step: 4,
        color: "purple",
        designation: "SEPH",
        name: timeline.sephVerifiedBy.name || "-",
        timestamp: timeline.sephVerifiedBy.timestamp
      });
    }

    // Step 5: ENCPH - Show for CDMA
    if (timeline.encphVerifiedBy && userRole === "cdma") {
      items.push({
        step: 5,
        color: "purple",
        designation: "ENCPH",
        name: timeline.encphVerifiedBy.name || "-",
        timestamp: timeline.encphVerifiedBy.timestamp
      });
    }

    // Current User Verification (if checkbox is checked)
    if (isVerified && timeline.currentUser && timeline.currentUser.name) {
      // Use designation from timeline.currentUser if available, otherwise calculate from role
      const currentUserDesignation = timeline.currentUser.designation || getRoleDesignation(user?.role);
      let stepNumber = 2; // Default for Commissioner
      let color = "green";

      // Determine step number based on user role
      if (userRole === "commissioner") {
        stepNumber = 2;
        color = "green";
      } else if (userRole === "eeph") {
        stepNumber = 3;
        color = "orange";
      } else if (userRole === "seph") {
        stepNumber = 4;
        color = "purple";
      } else if (userRole === "encph") {
        stepNumber = 5;
        color = "purple";
      } else if (userRole === "cdma") {
        stepNumber = 6;
        color = "purple";
      }

      // Check if this step already exists (to avoid duplicates)
      const existingStep = items.find(item => item.step === stepNumber);
      if (!existingStep) {
        items.push({
          step: stepNumber,
          color: color,
          designation: currentUserDesignation,
          name: timeline.currentUser.name,
          timestamp: timeline.currentUser.timestamp
        });
      }
    }

    // Sort by step number (descending order: 6, 5, 4, 3, 2, 1 - newest first)
    return items.sort((a, b) => b.step - a.step);
  };

  const timelineItems = buildTimelineItems();

  if (timelineItems.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-300">
      <h4 className="text-lg font-semibold text-gray-800 mb-4">Timeline</h4>
      <div className="space-y-4">
        {timelineItems.map((item, idx) => {
          const colorClass = item.color === "purple" ? "bg-purple-500" :
                            item.color === "orange" ? "bg-orange-500" :
                            item.color === "green" ? "bg-green-500" :
                            "bg-blue-500";
          
          return (
            <div key={idx} className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full ${colorClass} flex items-center justify-center text-white text-sm font-bold`}>
                {item.step}
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm text-gray-800">
                  Verified by <span className="font-semibold">{item.designation} {item.name}</span>
                  {item.timestamp && (
                    <span className="text-gray-600 ml-2">
                      at {formatTimestamp(item.timestamp)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

