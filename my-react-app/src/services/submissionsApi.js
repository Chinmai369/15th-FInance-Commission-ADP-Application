// submissionsApi.js - API service for Neon database operations
import { apiRequest } from './api.js';

/**
 * Get all submissions from Neon database
 * @returns {Promise<Array>} Array of submissions
 */
export const getSubmissions = async () => {
  try {
    const response = await apiRequest('/submissions', {
      method: 'GET'
    });
    
    if (response.success && response.submissions) {
      console.log(`✅ Loaded ${response.submissions.length} submissions from Neon database`);
      return response.submissions;
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error loading submissions from database:', error);
    // Return empty array on error (fallback to local storage)
    return [];
  }
};

/**
 * Save a single submission to Neon database
 * @param {Object} submission - Submission object to save
 * @returns {Promise<boolean>} Success status
 */
export const saveSubmission = async (submission) => {
  try {
    const response = await apiRequest('/submissions', {
      method: 'POST',
      body: JSON.stringify({ submission })
    });
    
    if (response.success) {
      console.log(`✅ Saved submission ${submission.id} to Neon database`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error saving submission to database:', error);
    return false;
  }
};

/**
 * Save multiple submissions to Neon database (bulk)
 * @param {Array} submissions - Array of submission objects
 * @returns {Promise<boolean>} Success status
 */
export const saveBulkSubmissions = async (submissions) => {
  try {
    const response = await apiRequest('/submissions/bulk', {
      method: 'POST',
      body: JSON.stringify({ submissions })
    });
    
    if (response.success) {
      console.log(`✅ Saved ${submissions.length} submissions to Neon database`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error saving bulk submissions to database:', error);
    return false;
  }
};

/**
 * Delete a submission from Neon database
 * @param {string} submissionId - ID of submission to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteSubmission = async (submissionId) => {
  try {
    const response = await apiRequest(`/submissions/${submissionId}`, {
      method: 'DELETE'
    });
    
    if (response.success) {
      console.log(`✅ Deleted submission ${submissionId} from Neon database`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error deleting submission from database:', error);
    return false;
  }
};

/**
 * Get a single submission by ID from Neon database
 * @param {string} submissionId - ID of submission to fetch
 * @returns {Promise<Object|null>} Submission object or null
 */
export const getSubmissionById = async (submissionId) => {
  try {
    const response = await apiRequest(`/submissions/${submissionId}`, {
      method: 'GET'
    });
    
    if (response.success && response.submission) {
      return response.submission;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error fetching submission from database:', error);
    return null;
  }
};

