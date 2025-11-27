import React from "react";

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

const MultipleWorksPreview = ({ 
  submissions = [], 
  crGroups = null
}) => {
  // Sort submissions by CR number and date to group same CR works together
  const sortedSubmissions = [...submissions].sort((a, b) => {
    const crA = (a.crNumber || "") + "_" + (a.crDate || "");
    const crB = (b.crNumber || "") + "_" + (b.crDate || "");
    if (crA < crB) return -1;
    if (crA > crB) return 1;
    return 0;
  });

  const formatLocation = (sub) => {
    const parts = [];
    if (sub.wardNo) parts.push(`W${sub.wardNo}`);
    if (sub.area) parts.push(sub.area.length > 8 ? sub.area.substring(0, 8) + '...' : sub.area);
    if (sub.locality) parts.push(sub.locality.length > 8 ? sub.locality.substring(0, 8) + '...' : sub.locality);
    return parts.length > 0 ? parts.join(', ') : '-';
  };

  const formatCRDate = (crDate) => {
    if (!crDate) return "-";
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
  };

  return (
    <div className="mt-4 w-full">
      <table className="w-full text-[10px] border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-0.5 py-0.5 text-center border border-gray-300" style={{ width: '3%' }}>S.No</th>
            <th className="px-0.5 py-0.5 text-left border border-gray-300" style={{ width: '7%' }}>CR No</th>
            <th className="px-0.5 py-0.5 text-left border border-gray-300" style={{ width: '7%' }}>CR Date</th>
            <th className="px-0.5 py-0.5 text-left border border-gray-300" style={{ width: '8%' }}>Sector</th>
            <th className="px-0.5 py-0.5 text-left border border-gray-300" style={{ width: '25%' }}>Proposal</th>
            <th className="px-0.5 py-0.5 text-left border border-gray-300" style={{ width: '8%' }}>Cost</th>
            <th className="px-0.5 py-0.5 text-center border border-gray-300" style={{ width: '5%' }}>Priority</th>
            <th className="px-0.5 py-0.5 text-left border border-gray-300" style={{ width: '12%' }}>Location</th>
            <th className="px-0.5 py-0.5 text-center border border-gray-300" style={{ width: '8%' }}>Image</th>
            <th className="px-0.5 py-0.5 text-center border border-gray-300" style={{ width: '10%' }}>Report</th>
            {crGroups && crGroups.length > 1 && (
              <>
                <th className="px-0.5 py-0.5 text-center border border-gray-300" style={{ width: '5%' }}>CR</th>
                <th className="px-0.5 py-0.5 text-center border border-gray-300" style={{ width: '5%' }}>CCR</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedSubmissions.map((sub, idx) => {
            const workImageUrl = getFileUrl(sub.workImage);
            const detailedReportUrl = getFileUrl(sub.detailedReport);
            
            // Check if this row should merge with previous row (same CR number and date)
            const prevSub = idx > 0 ? sortedSubmissions[idx - 1] : null;
            const sameCR = prevSub && 
              (prevSub.crNumber || "") === (sub.crNumber || "") && 
              (prevSub.crDate || "") === (sub.crDate || "");
            
            // Count how many consecutive rows have the same CR
            let rowspan = 1;
            if (!sameCR) {
              for (let i = idx + 1; i < sortedSubmissions.length; i++) {
                const nextSub = sortedSubmissions[i];
                if ((nextSub.crNumber || "") === (sub.crNumber || "") && 
                    (nextSub.crDate || "") === (sub.crDate || "")) {
                  rowspan++;
                } else {
                  break;
                }
              }
            }
            
            return (
              <tr key={sub.id || idx} className="hover:bg-gray-50">
                <td className="px-0.5 py-0.5 border border-gray-300 text-center align-middle">{idx + 1}</td>
                {!sameCR ? (
                  <>
                    <td className="px-0.5 py-0.5 border border-gray-300 align-middle" rowSpan={rowspan > 1 ? rowspan : undefined}>
                      <div className="truncate leading-tight" title={sub.crNumber || "-"}>{sub.crNumber || "-"}</div>
                    </td>
                    <td className="px-0.5 py-0.5 border border-gray-300 align-middle" rowSpan={rowspan > 1 ? rowspan : undefined}>
                      <div className="leading-tight">{formatCRDate(sub.crDate)}</div>
                    </td>
                  </>
                ) : null}
                <td className="px-0.5 py-0.5 border border-gray-300 align-middle">
                  <div className="truncate leading-tight" title={sub.sector || "-"}>{sub.sector || "-"}</div>
                </td>
                <td className="px-0.5 py-0.5 border border-gray-300 align-middle">
                  <div className="truncate leading-tight" title={sub.proposal || "-"}>{sub.proposal || "-"}</div>
                </td>
                <td className="px-0.5 py-0.5 border border-gray-300 align-middle">
                  <div className="truncate leading-tight">{fmtINR(sub.cost || 0)}</div>
                </td>
                <td className="px-0.5 py-0.5 border border-gray-300 text-center align-middle leading-tight">{sub.priority || "-"}</td>
                <td className="px-0.5 py-0.5 border border-gray-300 align-middle">
                  <div className="truncate leading-tight" title={formatLocation(sub)}>{formatLocation(sub)}</div>
                  {sub.latlong && (
                    <div className="text-[9px] text-gray-600 truncate leading-tight" title={sub.latlong}>
                      {sub.latlong.length > 12 ? sub.latlong.substring(0, 12) + '...' : sub.latlong}
                    </div>
                  )}
                </td>
                <td className="px-0.5 py-0.5 border border-gray-300 text-center align-middle">
                  {workImageUrl ? (
                    isImageFile(sub.workImage) ? (
                      <img
                        src={workImageUrl}
                        alt="Work"
                        className="max-w-10 max-h-10 rounded cursor-pointer hover:opacity-90 mx-auto"
                        onClick={() => window.open(workImageUrl, '_blank')}
                      />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-0.5 py-0.5 border border-gray-300 text-center align-middle">
                  {detailedReportUrl ? (
                    <div 
                      onClick={() => window.open(detailedReportUrl, '_blank')}
                      className="w-8 h-8 rounded cursor-pointer hover:opacity-90 bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center border border-red-300 mx-auto"
                      title="Estimation Report"
                    >
                      <span className="text-[7px] font-bold text-red-600">PDF</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                {crGroups && crGroups.length > 1 && (
                  <>
                    <td className="px-0.5 py-0.5 border border-gray-300 text-center align-middle">
                      {sub.committeeReport ? (
                        <div 
                          onClick={() => window.open(getFileUrl(sub.committeeReport), '_blank')}
                          className="w-8 h-8 rounded cursor-pointer hover:opacity-90 bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center border border-red-300 mx-auto"
                          title="Committee Report"
                        >
                          <span className="text-[7px] font-bold text-red-600">PDF</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-0.5 py-0.5 border border-gray-300 text-center align-middle">
                      {sub.councilResolution ? (
                        <div 
                          onClick={() => window.open(getFileUrl(sub.councilResolution), '_blank')}
                          className="w-8 h-8 rounded cursor-pointer hover:opacity-90 bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center border border-red-300 mx-auto"
                          title="Council Resolution"
                        >
                          <span className="text-[7px] font-bold text-red-600">PDF</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MultipleWorksPreview;

