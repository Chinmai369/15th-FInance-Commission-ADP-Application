import React from 'react';
import jsPDF from 'jspdf';

/**
 * CDMA Approval PDF Generator Component
 * Generates a professional PDF document in official government certificate format
 */
export const generateCDMAApprovalPDF = async (submission, timeline, ulbName = "") => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15; // Outer margin
  const sectionPadding = 5; // Internal padding inside each section border
  const bottomMargin = 20; // Space reserved at bottom for footer
  let yPosition = margin;
  
  // Helper function to check if we need a new page
  const checkPageBreak = (requiredHeight) => {
    if (yPosition + requiredHeight > pageHeight - bottomMargin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to format currency
  const fmtINR = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
      .format(n || 0)
      .replace("INR", "₹");

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "-";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Kolkata'
      });
    } catch (e) {
      return timestamp;
    }
  };

  // Helper function to get file URL
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

  // Helper function to convert image to base64
  const imageToBase64 = (file) => {
    return new Promise((resolve) => {
      if (!file) {
        resolve(null);
        return;
      }

      const url = getFileUrl(file);
      if (!url) {
        resolve(null);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        try {
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          resolve(base64);
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  // Helper function to load logo from public folder
  const loadLogo = () => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        try {
          const base64 = canvas.toDataURL('image/jpeg', 0.9);
          resolve(base64);
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = '/ap-logo.jpeg';
    });
  };

  // Helper function to get clean filename
  const getCleanFileName = (file, defaultName) => {
    if (!file) return '';
    
    if (file instanceof File) {
      return file.name;
    }
    
    if (typeof file === 'string') {
      // If it's a data URL or blob URL, use default name
      if (file.startsWith('data:') || file.startsWith('blob:')) {
        return defaultName;
      }
      
      // If it's a long string (likely encoded), use default
      if (file.length > 100) {
        return defaultName;
      }
      
      // Try to extract filename from path
      if (file.includes('/')) {
        const parts = file.split('/');
        const lastPart = parts[parts.length - 1].split('?')[0];
        if (lastPart.includes('.') && lastPart.length < 100) {
          return lastPart;
        }
      }
      
      if (file.includes('\\')) {
        const parts = file.split('\\');
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('.') && lastPart.length < 100) {
          return lastPart;
        }
      }
      
      // If it's a short string that might be a filename
      if (file.length < 50 && file.includes('.')) {
        return file;
      }
      
      // Default fallback
      return defaultName;
    }
    
    return '';
  };

  // Helper function to get clean name (not encoded)
  const getCleanName = (name) => {
    if (!name) return '-';
    if (typeof name !== 'string') return String(name);
    
    // If it looks like encoded data (long, no spaces, special chars)
    if (name.length > 50 || (!name.includes(' ') && name.length > 20 && /[A-Za-z0-9+/=]{20,}/.test(name))) {
      return '-';
    }
    
    return name;
  };

  // Header Section - Certificate Style
  doc.setFillColor(255, 255, 255);
  const headerHeight = 35;
  doc.rect(0, 0, pageWidth, headerHeight, 'F');
  
  // Load and add AP Logo
  try {
    const logoBase64 = await loadLogo();
    if (logoBase64) {
      const logoSize = 20;
      const logoX = margin + 3;
      const logoY = 5;
      doc.addImage(logoBase64, 'JPEG', logoX, logoY, logoSize, logoSize);
    }
  } catch (e) {
    console.log('Logo not loaded:', e);
  }
  
  // Government Title - Times font for formal certificate look
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('GOVERNMENT OF ANDHRA PRADESH', pageWidth / 2, 12, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('times', 'normal');
  doc.text('15th Finance Commission', pageWidth / 2, 18, { align: 'center' });
  
  if (ulbName) {
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.text(ulbName.toUpperCase(), pageWidth / 2, 24, { align: 'center' });
  }
  
  // Decorative header bottom border - double line for certificate look
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(0, headerHeight - 2, pageWidth, headerHeight - 2);
  doc.setLineWidth(0.3);
  doc.line(0, headerHeight, pageWidth, headerHeight);
  
  yPosition = headerHeight + 10; // More space after header
  
  // Certificate Title - Formal certificate style
  doc.setFontSize(16);
  doc.setFont('times', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('CDMA APPROVED WORK CERTIFICATE', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8; // Equal spacing
  
  // Introductory Statement - Certificate format
  doc.setFontSize(9);
  doc.setFont('times', 'italic');
  doc.setTextColor(60, 60, 60);
  const introText = "This is to certify that the following work has been verified and approved by CDMA (Commissioner & Director of Municipal Administration)";
  const introLines = doc.splitTextToSize(introText, pageWidth - margin * 2);
  doc.text(introLines, pageWidth / 2, yPosition, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  
  yPosition += introLines.length * 4 + 8; // Equal line spacing (4mm per line) + spacing

  // Work Details Section
  const workDetailsY = yPosition;
  
  // Title background
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, workDetailsY, pageWidth - margin * 2, 6, 'F');
  
  // Title - Times font for certificate look
  doc.setFontSize(11);
  doc.setFont('times', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('WORK DETAILS', margin + sectionPadding, workDetailsY + 4.5);
  
  // Title separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(margin, workDetailsY + 6, pageWidth - margin, workDetailsY + 6);
  
  yPosition = workDetailsY + 9;
  
  const details = [
    { label: 'Year', value: submission.year || "-" },
    { label: 'Installment', value: submission.installment || "-" },
    { label: 'Grant Type', value: submission.grantType || "-" },
    { label: 'Proposal', value: submission.program || "-" },
    { label: 'CR Number', value: submission.crNumber || "-" },
    { label: 'CR Date', value: formatDate(submission.crDate) },
    { label: 'Sector', value: submission.sector || "-" },
    { label: 'Work Name', value: submission.proposal || "-" },
    { label: 'Estimated Cost', value: fmtINR(Math.round(submission.cost || 0)) },
    { label: 'Locality', value: submission.locality || "-" },
    { label: 'Latitude/Longitude', value: submission.latlong || "-" },
    { label: 'Priority', value: submission.priority || "-" },
  ];

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  const leftColX = margin + sectionPadding;
  const rightColX = pageWidth / 2 + sectionPadding;
  const labelWidth = 35;
  const valueWidth = 55;
  const lineSpacing = 4; // Equal spacing between all lines (4mm)
  let currentY = yPosition;
  let isLeftCol = true;
  let maxY = currentY;

  details.forEach((item, index) => {
    const currentX = isLeftCol ? leftColX : rightColX;
    
    // Label - Times font for certificate look
    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(`${item.label}:`, currentX, currentY);
    
    // Value - Times font
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    const valueText = String(item.value || '-');
    const valueLines = doc.splitTextToSize(valueText, valueWidth);
    const valueY = currentY;
    doc.text(valueLines, currentX + labelWidth, valueY);
    
    // Calculate height needed for this item - use equal line spacing
    const itemHeight = Math.max(lineSpacing, valueLines.length * lineSpacing);
    const itemBottomY = valueY + itemHeight;
    
    if (itemBottomY > maxY) {
      maxY = itemBottomY;
    }
    
    // Move to next position with equal spacing
    if (isLeftCol) {
      isLeftCol = false;
    } else {
      isLeftCol = true;
      currentY = maxY + lineSpacing; // Equal spacing between rows
      maxY = currentY;
    }
  });

  // Draw border after calculating content height (title bar 6mm + content + bottom padding)
  // Ensure proper bottom padding - add sectionPadding after the last content item
  // The last row ends at maxY, so we add sectionPadding to create space down to the border
  const workDetailsContentBottom = maxY + sectionPadding;
  const workDetailsHeight = workDetailsContentBottom - workDetailsY;
  
  // Draw border - this will include the bottom padding space
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.rect(margin, workDetailsY, pageWidth - margin * 2, workDetailsHeight);
  
  // Update yPosition with proper spacing after work details section
  yPosition = workDetailsY + workDetailsHeight + 5; // 5mm spacing between sections

  // Combined Work Image & Attached Documents Section
  checkPageBreak(60); // Check if we need new page for combined section
  const combinedSectionY = yPosition;
  
  // Title background
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, combinedSectionY, pageWidth - margin * 2, 6, 'F');
  
  // Title - Times font for certificate look
  doc.setFontSize(11);
  doc.setFont('times', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('WORK IMAGE & ATTACHED DOCUMENTS', margin + sectionPadding, combinedSectionY + 4.5);
  
  // Title separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(margin, combinedSectionY + 6, pageWidth - margin, combinedSectionY + 6);
  
  yPosition = combinedSectionY + 9;
  let sectionContentBottom = yPosition;
  
  // Work Image (if available)
  if (submission.workImage) {
    try {
      const base64Image = await imageToBase64(submission.workImage);
      if (base64Image) {
        const imgWidth = 30;
        const imgHeight = 20;
        const imgX = pageWidth / 2 - imgWidth / 2;
        const imgY = yPosition;
        
        doc.addImage(base64Image, 'JPEG', imgX, imgY, imgWidth, imgHeight);
        sectionContentBottom = imgY + imgHeight + 4; // 4mm spacing after image
        yPosition = sectionContentBottom;
      }
    } catch (e) {
      doc.setFontSize(8);
      doc.setFont('times', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text('Image not available', pageWidth / 2, yPosition + 10, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      sectionContentBottom = yPosition + 10 + 4;
      yPosition = sectionContentBottom;
    }
  }
  
  // Attached Documents
  if (yPosition === combinedSectionY + 9) {
    // No image, start documents at section start
    yPosition = combinedSectionY + 9;
  } else {
    // Image was added, add spacing before documents
    yPosition += 4;
  }

  doc.setFontSize(8);
  doc.setFont('times', 'normal');
  
  const documents = [
    { name: 'Estimation Report', file: submission.detailedReport, defaultName: 'estimation-report.pdf' },
    { name: 'Committee Report', file: submission.committeeReport, defaultName: 'committee-report.pdf' },
    { name: 'Council Resolution', file: submission.councilResolution, defaultName: 'council-resolution.pdf' }
  ];

  const docLineSpacing = 4; // Equal spacing
  let docX = margin + sectionPadding;
  let maxContentY = yPosition;
  
  documents.forEach((docItem) => {
    const fileName = getCleanFileName(docItem.file, docItem.defaultName);
    const isUploaded = !!docItem.file;
    
    // Document name
    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(`${docItem.name}:`, docX, yPosition);
    
    // File name
    if (fileName) {
      doc.setFont('times', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      const displayName = fileName.length > 25 ? fileName.substring(0, 22) + '...' : fileName;
      doc.text(displayName, docX, yPosition + docLineSpacing);
    }
    
    // Status
    doc.setFontSize(7);
    doc.setFont('times', 'normal');
    if (isUploaded) {
      doc.setTextColor(0, 128, 0);
      doc.text('Uploaded: Yes', docX, yPosition + docLineSpacing * 2);
      doc.text('Verified: Yes', docX, yPosition + docLineSpacing * 3);
    } else {
      doc.setTextColor(150, 150, 150);
      doc.text('Uploaded: No', docX, yPosition + docLineSpacing * 2);
      doc.text('Verified: No', docX, yPosition + docLineSpacing * 3);
    }
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    
    // Track maximum Y position for this column (last line is at yPosition + docLineSpacing * 3)
    const itemBottomY = yPosition + docLineSpacing * 3;
    if (itemBottomY > maxContentY) {
      maxContentY = itemBottomY;
    }
    
    docX += 58;
  });

  // Calculate actual height needed for combined section (title 6mm + content + bottom padding)
  const combinedContentBottom = Math.max(sectionContentBottom, maxContentY) + sectionPadding;
  const combinedSectionHeight = combinedContentBottom - combinedSectionY;
  
  // Draw border around combined section
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.rect(margin, combinedSectionY, pageWidth - margin * 2, combinedSectionHeight);
  
  // Update yPosition with proper spacing after combined section
  yPosition = combinedSectionY + combinedSectionHeight + 5; // 5mm spacing after section

  // Verification Timeline Section
  checkPageBreak(50); // Check if we need new page for timeline (estimate)
  const timelineY = yPosition;
  let timelineContentHeight = 0;
  
  // Title background
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, timelineY, pageWidth - margin * 2, 6, 'F');
  
  // Title - Times font for certificate look
  doc.setFontSize(11);
  doc.setFont('times', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('VERIFICATION TIMELINE', margin + sectionPadding, timelineY + 4.5);
  
  // Title separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(margin, timelineY + 6, pageWidth - margin, timelineY + 6);
  
  yPosition = timelineY + 9;
  const timelineStartY = yPosition;
  let timelineEndY = timelineStartY;

  if (timeline) {
    const timelineItems = [];

    // Engineer (Step 1)
    if (timeline.forwardedFrom && timeline.forwardedFrom.name) {
      timelineItems.push({
        step: 1,
        designation: "Engineer",
        name: getCleanName(timeline.forwardedFrom.name),
        timestamp: timeline.forwardedFrom.timestamp
      });
    }

    // Commissioner (Step 2)
    if (timeline.verifiedBy) {
      timelineItems.push({
        step: 2,
        designation: "Commissioner",
        name: getCleanName(timeline.verifiedBy.name || "-"),
        timestamp: timeline.verifiedBy.timestamp
      });
    }

    // EEPH (Step 3)
    if (timeline.eephVerifiedBy) {
      timelineItems.push({
        step: 3,
        designation: "EEPH",
        name: getCleanName(timeline.eephVerifiedBy.name || "-"),
        timestamp: timeline.eephVerifiedBy.timestamp
      });
    }

    // SEPH (Step 4)
    let sephVerification = null;
    if (timeline.sephVerifiedBy) {
      sephVerification = timeline.sephVerifiedBy;
    } else if (submission.sephVerifiedBy) {
      sephVerification = submission.sephVerifiedBy;
    } else if (submission.status === "SEPH Approved" && submission.verifiedBy && 
               (submission.verifiedBy.designation?.toLowerCase().includes("seph") || 
                !submission.verifiedBy.designation?.toLowerCase().includes("encph"))) {
      sephVerification = submission.verifiedBy;
    }
    
    if (sephVerification) {
      timelineItems.push({
        step: 4,
        designation: "SEPH",
        name: getCleanName(sephVerification.name || sephVerification.designation || "-"),
        timestamp: sephVerification.timestamp
      });
    }

    // ENCPH (Step 5)
    let encphVerification = null;
    if (timeline.encphVerifiedBy) {
      encphVerification = timeline.encphVerifiedBy;
    } else if (submission.encphVerifiedBy) {
      encphVerification = submission.encphVerifiedBy;
    } else if ((submission.status === "Forwarded to CDMA" || submission.status === "ENCPH Approved") && 
               submission.verifiedBy && 
               (submission.verifiedBy.designation?.toLowerCase().includes("encph") ||
                (!submission.verifiedBy.designation?.toLowerCase().includes("cdma") &&
                 !submission.verifiedBy.designation?.toLowerCase().includes("seph")))) {
      encphVerification = submission.verifiedBy;
    }
    
    if (encphVerification) {
      timelineItems.push({
        step: 5,
        designation: "ENCPH",
        name: getCleanName(encphVerification.name || encphVerification.designation || "-"),
        timestamp: encphVerification.timestamp
      });
    }

    // CDMA (Step 6)
    if (submission.verifiedBy && submission.verifiedBy.name) {
      timelineItems.push({
        step: 6,
        designation: "CDMA",
        name: getCleanName(submission.verifiedBy.name),
        timestamp: submission.verifiedBy.timestamp
      });
    }

    // Sort by step (descending - newest first)
    timelineItems.sort((a, b) => b.step - a.step);

    doc.setFontSize(8);
    doc.setFont('times', 'normal');

    timelineItems.forEach((item, index) => {
      // Check if we need a new page before drawing this item
      if (yPosition + 8 > pageHeight - bottomMargin && index > 0) {
        // Draw border for current page
        const currentPageContentBottom = timelineEndY + sectionPadding;
        const currentPageHeight = currentPageContentBottom - timelineY;
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.3);
        doc.rect(margin, timelineY, pageWidth - margin * 2, currentPageHeight);
        
        // Start new page
        doc.addPage();
        yPosition = margin;
        timelineY = margin;
        
          // Redraw title on new page - Times font
          doc.setFillColor(245, 245, 245);
          doc.rect(margin, timelineY, pageWidth - margin * 2, 6, 'F');
          doc.setFontSize(11);
          doc.setFont('times', 'bold');
          doc.setTextColor(50, 50, 50);
          doc.text('VERIFICATION TIMELINE', margin + sectionPadding, timelineY + 4.5);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.line(margin, timelineY + 6, pageWidth - margin, timelineY + 6);
        
        yPosition = timelineY + 9;
        timelineStartY = yPosition;
        timelineEndY = timelineStartY;
      }

      // Step number circle - proper spacing from left border
      const circleX = margin + sectionPadding + 2;
      const circleY = yPosition;
      const circleRadius = 3.5; // Slightly larger for better visibility
      
      // Set color based on step
      if (item.step === 6) doc.setFillColor(128, 0, 128); // Purple for CDMA
      else if (item.step === 5 || item.step === 4) doc.setFillColor(128, 0, 128); // Purple for ENCPH/SEPH
      else if (item.step === 3) doc.setFillColor(255, 165, 0); // Orange for EEPH
      else if (item.step === 2) doc.setFillColor(0, 128, 0); // Green for Commissioner
      else doc.setFillColor(70, 130, 180); // Blue for Engineer
      
      doc.circle(circleX, circleY, circleRadius, 'F');
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.2);
      doc.circle(circleX, circleY, circleRadius);
      
      // Step number in circle
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(item.step.toString(), circleX, circleY + 1, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);

      // Verification text - proper spacing from circle, clean formatting
      const textX = circleX + circleRadius + 5; // 5mm gap after circle for clean spacing
      const textWidth = pageWidth - textX - margin - sectionPadding; // Available width for text
      const timelineLineSpacing = 4; // Equal spacing between timeline items
      
      // Build the text parts
      const designationName = `${item.designation} ${item.name}`;
      const timestampPart = item.timestamp ? ` at ${formatTimestamp(item.timestamp)}` : '';
      
      // Render "Verified by " in normal font - Times
      doc.setFont('times', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      const verifiedByText = 'Verified by ';
      doc.text(verifiedByText, textX, yPosition);
      
      // Get actual width of "Verified by " using jsPDF's internal method
      const verifiedByWidth = doc.getTextWidth(verifiedByText);
      const nameX = textX + verifiedByWidth;
      const availableNameWidth = textWidth - verifiedByWidth;
      
      // Render designation and name in bold - check if it fits
      doc.setFont('times', 'bold');
      const designationNameLines = doc.splitTextToSize(designationName, availableNameWidth);
      doc.text(designationNameLines[0], nameX, yPosition);
      
      let currentY = yPosition;
      
      if (designationNameLines.length > 1) {
        // Name wrapped to next line
        currentY = yPosition + timelineLineSpacing;
        doc.setFont('times', 'bold');
        doc.text(designationNameLines[1], textX, currentY);
        
        // Add timestamp after wrapped name if present
        if (item.timestamp) {
          const nameWidth = doc.getTextWidth(designationNameLines[1]);
          doc.setFont('times', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(100, 100, 100);
          doc.text(timestampPart, textX + nameWidth, currentY);
          doc.setFontSize(8);
          doc.setTextColor(0, 0, 0);
        }
        timelineEndY = currentY + timelineLineSpacing;
      } else {
        // Single line for designation/name, add timestamp on same line
        if (item.timestamp) {
          const nameWidth = doc.getTextWidth(designationNameLines[0]);
          doc.setFont('times', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(100, 100, 100);
          doc.text(timestampPart, nameX + nameWidth, yPosition);
          doc.setFontSize(8);
          doc.setTextColor(0, 0, 0);
        }
        timelineEndY = yPosition + timelineLineSpacing;
      }

      // Equal spacing between items
      yPosition = timelineEndY + timelineLineSpacing;
    });
  }

  // Calculate final timeline height (title 6mm + content + bottom padding)
  const timelineContentBottom = timelineEndY + sectionPadding;
  const timelineHeight = timelineContentBottom - timelineY;
  
  // Draw timeline border
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.rect(margin, timelineY, pageWidth - margin * 2, timelineHeight);

  // Update yPosition with proper spacing after timeline
  yPosition = timelineY + timelineHeight + 5; // 5mm spacing after timeline

  // Acknowledgement Section
  checkPageBreak(30); // Check if we need new page for acknowledgement
  const ackY = yPosition;
  const minAckHeight = 20; // Minimum height including title and padding
  
  // Title background
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, ackY, pageWidth - margin * 2, 6, 'F');
  
  // Title - Times font for certificate look
  doc.setFontSize(11);
  doc.setFont('times', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('ACKNOWLEDGEMENT', margin + sectionPadding, ackY + 4.5);
  
  // Title separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(margin, ackY + 6, pageWidth - margin, ackY + 6);
  
  yPosition = ackY + 9;
  let ackContentBottom = yPosition;
  let ackMainTextBottom = yPosition;

  const ackLineSpacing = 4; // Equal spacing
  
  if (submission.verifiedBy && submission.verifiedBy.name) {
    doc.setFontSize(9);
    doc.setFont('times', 'normal');
    
    const cleanName = getCleanName(submission.verifiedBy.name);
    const acknowledgementText = `The above works are checked and verified by ${submission.verifiedBy.designation || "CDMA"} ${cleanName}`;
    const timestampText = submission.verifiedBy.timestamp 
      ? ` at ${formatTimestamp(submission.verifiedBy.timestamp)}`
      : "";

    const fullText = acknowledgementText + timestampText;
    // Text width should account for left padding and space for authority block on right
    // Reserve space for authority block (about 45mm from right)
    const authorityBlockWidth = 45;
    const textWidth = pageWidth - margin - sectionPadding - authorityBlockWidth - sectionPadding;
    const lines = doc.splitTextToSize(fullText, textWidth);
    doc.text(lines, margin + sectionPadding, yPosition);
    
    // Calculate actual content bottom (lines * equal line spacing)
    ackMainTextBottom = yPosition + (lines.length * ackLineSpacing);
    ackContentBottom = ackMainTextBottom + sectionPadding;
  } else {
    // Even if no content, ensure minimum height (title 6mm + content area + bottom padding)
    ackMainTextBottom = yPosition + ackLineSpacing;
    ackContentBottom = ackMainTextBottom + sectionPadding;
  }
  
  // Authority Section (Right side) - properly aligned within acknowledgement section
  const authorityX = pageWidth - margin - sectionPadding;
  const authorityY = ackY + 9; // Start at same Y as main text
  
  doc.setFontSize(8);
  doc.setFont('times', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('CDMA', authorityX, authorityY, { align: 'right' });
  
  doc.setFontSize(7);
  doc.setFont('times', 'normal');
  doc.text('Commissioner & Director', authorityX, authorityY + ackLineSpacing, { align: 'right' });
  doc.text('of Municipal Administration', authorityX, authorityY + ackLineSpacing * 2, { align: 'right' });
  doc.text('Government of Andhra Pradesh', authorityX, authorityY + ackLineSpacing * 3, { align: 'right' });
  
  // Authority block height - using equal spacing
  const authorityBottom = authorityY + (ackLineSpacing * 4); // 4 lines with equal spacing
  
  // Calculate final height - use the maximum of main text bottom or authority bottom
  const maxContentBottom = Math.max(ackMainTextBottom, authorityBottom);
  const finalAckContentBottom = maxContentBottom + sectionPadding;
  const ackHeight = Math.max(minAckHeight, finalAckContentBottom - ackY);
  
  // Draw acknowledgement border
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.rect(margin, ackY, pageWidth - margin * 2, ackHeight);
  
  // Update yPosition after acknowledgement
  yPosition = ackY + ackHeight;

  // Footer Note - Times font
  const footerY = pageHeight - 10;
  doc.setFontSize(7);
  doc.setFont('times', 'italic');
  doc.setTextColor(100, 100, 100);
  const footerNote = "Note: This certificate is generated electronically and can be verified using the registration details mentioned above.";
  const footerLines = doc.splitTextToSize(footerNote, pageWidth - margin * 2);
  doc.text(footerLines, pageWidth / 2, footerY, { align: 'center' });
  
  // Generation date
  doc.setFontSize(7);
  doc.setFont('times', 'normal');
  doc.text('Generated on ' + new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  }), pageWidth / 2, footerY + 5, { align: 'center' });

  // Save PDF
  const fileName = `CDMA_Approval_${submission.crNumber || submission.id}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
};

export default generateCDMAApprovalPDF;
