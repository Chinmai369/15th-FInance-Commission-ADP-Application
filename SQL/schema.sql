
-- ============================================
-- MASTER TABLES
-- ============================================

-- Table: ulbs (Urban Local Bodies)
CREATE TABLE IF NOT EXISTS ulbs (
  ulb_id INT AUTO_INCREMENT PRIMARY KEY,
  ulb_name VARCHAR(200) NOT NULL,
  ulb_code VARCHAR(50) UNIQUE NOT NULL,
  district VARCHAR(100),
  state VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_ulb_code (ulb_code),
  INDEX idx_is_active (is_active)
) 

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- Hashed password
  mobile VARCHAR(20) UNIQUE, -- For OTP login
  role VARCHAR(50) NOT NULL, -- engineer, Commissioner, eeph, seph, encph, cdma
  designation VARCHAR(100), -- Engineer, Commissioner, EEPH, SEPH, ENCPH, CDMA
  ulb_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ulb_id) REFERENCES ulbs(ulb_id) ON DELETE SET NULL,
  INDEX idx_username (username),
  INDEX idx_mobile (mobile),
  INDEX idx_role (role),
  INDEX idx_ulb_id (ulb_id),
  INDEX idx_is_active (is_active)
) 

-- Table: years
CREATE TABLE IF NOT EXISTS years (
  year_id INT AUTO_INCREMENT PRIMARY KEY,
  year_value VARCHAR(20) UNIQUE NOT NULL, 
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_year_value (year_value),
  INDEX idx_is_active (is_active)
) 

-- Table: installments
CREATE TABLE IF NOT EXISTS installments (
  installment_id INT AUTO_INCREMENT PRIMARY KEY,
  installment_name VARCHAR(100) NOT NULL, -- e.g., "First Installment", "Second Installment"
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_is_active (is_active)
) 

-- Table: grant_types
CREATE TABLE IF NOT EXISTS grant_types (
  grant_type_id INT AUTO_INCREMENT PRIMARY KEY,
  grant_type_name VARCHAR(100) NOT NULL, -- e.g., "Untied Grant", "Tied Grant"
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_is_active (is_active)
) 

-- Table: proposals
CREATE TABLE IF NOT EXISTS proposals (
  proposal_id INT AUTO_INCREMENT PRIMARY KEY,
  proposal_name VARCHAR(200) NOT NULL, -- e.g., "ADP", "RADP"
  proposal_code VARCHAR(50) UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_proposal_code (proposal_code),
  INDEX idx_is_active (is_active)
) 

-- Table: sectors (Work Types)
CREATE TABLE IF NOT EXISTS sectors (
  sector_id INT AUTO_INCREMENT PRIMARY KEY,
  sector_name VARCHAR(200) NOT NULL, -- e.g., CCroads, water supply
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_is_active (is_active)
) 

-- Table: budget_allocations
CREATE TABLE IF NOT EXISTS budget_allocations (
  budget_id INT AUTO_INCREMENT PRIMARY KEY,
  ulb_id INT NOT NULL,
  year_id INT NOT NULL,
  installment_id INT NOT NULL,
  grant_type_id INT NOT NULL,
  proposal_id INT NOT NULL,
  total_budget DECIMAL(15, 2) NOT NULL,
  allocated_budget DECIMAL(15, 2) DEFAULT 0,
  remaining_budget DECIMAL(15, 2) DEFAULT 0, -- Calculated field
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ulb_id) REFERENCES ulbs(ulb_id) ON DELETE CASCADE,
  FOREIGN KEY (year_id) REFERENCES years(year_id) ON DELETE CASCADE,
  FOREIGN KEY (installment_id) REFERENCES installments(installment_id) ON DELETE CASCADE,
  FOREIGN KEY (grant_type_id) REFERENCES grant_types(grant_type_id) ON DELETE CASCADE,
  FOREIGN KEY (proposal_id) REFERENCES proposals(proposal_id) ON DELETE CASCADE,
  INDEX idx_ulb_id (ulb_id),
  INDEX idx_year_id (year_id),
  INDEX idx_installment_id (installment_id),
  INDEX idx_grant_type_id (grant_type_id),
  INDEX idx_proposal_id (proposal_id),
  UNIQUE KEY unique_budget_allocation (ulb_id, year_id, installment_id, grant_type_id, proposal_id)
) 

-- Table: sections
CREATE TABLE IF NOT EXISTS sections (
  section_id INT AUTO_INCREMENT PRIMARY KEY,
  section_name VARCHAR(100) NOT NULL, -- e.g., "EEPH", "SEPH", "ENCPH"
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_is_active (is_active)
) 

-- ============================================
-- TRANSACTION TABLES
-- ============================================

-- Table: work_submissions (Main Work Table)
CREATE TABLE IF NOT EXISTS work_submissions (
  submission_id VARCHAR(255) PRIMARY KEY,
  ulb_id INT NOT NULL,
  year_id INT NOT NULL,
  installment_id INT NOT NULL,
  grant_type_id INT NOT NULL,
  proposal_id INT NOT NULL,
  cr_status VARCHAR(20), -- "CR" or "IA"
  cr_number VARCHAR(100),
  cr_date DATE,
  sector_id INT NOT NULL,
  work_name TEXT NOT NULL, -- Work proposal name
  area TEXT,
  locality TEXT,
  ward_no VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  estimated_cost DECIMAL(15, 2) NOT NULL,
  priority INT DEFAULT 1, -- 1-5
  status VARCHAR(100) NOT NULL DEFAULT 'Pending Review', -- "Pending Review", "Approved", "Rejected", etc.
  current_forwarded_to_section_id INT,
  rejected_by VARCHAR(100), -- role/user who rejected
  remarks TEXT,
  created_by INT NOT NULL, -- Engineer who created
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ulb_id) REFERENCES ulbs(ulb_id) ON DELETE CASCADE,
  FOREIGN KEY (year_id) REFERENCES years(year_id) ON DELETE CASCADE,
  FOREIGN KEY (installment_id) REFERENCES installments(installment_id) ON DELETE CASCADE,
  FOREIGN KEY (grant_type_id) REFERENCES grant_types(grant_type_id) ON DELETE CASCADE,
  FOREIGN KEY (proposal_id) REFERENCES proposals(proposal_id) ON DELETE CASCADE,
  FOREIGN KEY (sector_id) REFERENCES sectors(sector_id) ON DELETE CASCADE,
  FOREIGN KEY (current_forwarded_to_section_id) REFERENCES sections(section_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_ulb_id (ulb_id),
  INDEX idx_year_id (year_id),
  INDEX idx_installment_id (installment_id),
  INDEX idx_grant_type_id (grant_type_id),
  INDEX idx_proposal_id (proposal_id),
  INDEX idx_sector_id (sector_id),
  INDEX idx_status (status),
  INDEX idx_created_by (created_by),
  INDEX idx_current_forwarded_to_section_id (current_forwarded_to_section_id),
  INDEX idx_created_at (created_at),
  INDEX idx_cr_number (cr_number),
  CONSTRAINT chk_priority_range CHECK (priority >= 1 AND priority <= 5)
) 

-- Table: work_files (File Attachments)
CREATE TABLE IF NOT EXISTS work_files (
  file_id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id VARCHAR(255) NOT NULL,
  file_type VARCHAR(50), -- pdf, jpg, png, etc.
  file_name VARCHAR(255),
  file_path VARCHAR(500), -- Server path or URL
  file_size BIGINT, -- bytes
  mime_type VARCHAR(100), -- application/pdf, image/jpeg
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (submission_id) REFERENCES work_submissions(submission_id) ON DELETE CASCADE,
  INDEX idx_submission_id (submission_id),
  INDEX idx_file_type (file_type),
  INDEX idx_uploaded_at (uploaded_at)
) 

-- Table: work_forwarding_details_tbl
CREATE TABLE IF NOT EXISTS work_forwarding_details_tbl (
  forwarding_id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id VARCHAR(255) NOT NULL,
  forwarded_from_user_id INT NOT NULL,
  forwarded_to_section_id INT NOT NULL,
  forwarding_remarks TEXT,
  forwarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status_before VARCHAR(100),
  status_after VARCHAR(100),
  
  FOREIGN KEY (submission_id) REFERENCES work_submissions(submission_id) ON DELETE CASCADE,
  FOREIGN KEY (forwarded_from_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (forwarded_to_section_id) REFERENCES sections(section_id) ON DELETE CASCADE,
  INDEX idx_submission_id (submission_id),
  INDEX idx_forwarded_from_user_id (forwarded_from_user_id),
  INDEX idx_forwarded_to_section_id (forwarded_to_section_id),
  INDEX idx_forwarded_at (forwarded_at)
) 

-- Table: work_verifications
CREATE TABLE IF NOT EXISTS work_verifications (
  verification_id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id VARCHAR(255) NOT NULL,
  verified_by_user_id INT NOT NULL,
  verification_role VARCHAR(50) NOT NULL, -- "Engineer", "Commissioner", "EEPH", "SEPH", "ENCPH"
  verification_status VARCHAR(50) NOT NULL, -- "Verified", "Approved", "Rejected"
  verification_remarks TEXT,
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verification_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (submission_id) REFERENCES work_submissions(submission_id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_submission_id (submission_id),
  INDEX idx_verified_by_user_id (verified_by_user_id),
  INDEX idx_verification_role (verification_role),
  INDEX idx_verification_status (verification_status),
  INDEX idx_verified_at (verified_at)
) 

-- Table: work_status_details_tbl
CREATE TABLE IF NOT EXISTS work_status_details_tbl (
  status_id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id VARCHAR(255) NOT NULL,
  old_status VARCHAR(100),
  new_status VARCHAR(100) NOT NULL,
  changed_by_user_id INT NOT NULL,
  status_change_reason TEXT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (submission_id) REFERENCES work_submissions(submission_id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_submission_id (submission_id),
  INDEX idx_changed_by_user_id (changed_by_user_id),
  INDEX idx_new_status (new_status),
  INDEX idx_changed_at (changed_at)
) 

-- Table: cr_details_tbl (CR Details)
CREATE TABLE IF NOT EXISTS cr_details_tbl (
  cr_id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id VARCHAR(255), -- nullable - if CR is for multiple works
  cr_number VARCHAR(100) UNIQUE NOT NULL,
  cr_date DATE NOT NULL,
  cr_status VARCHAR(20) NOT NULL, -- "CR" or "IA"
  total_works_in_cr INT DEFAULT 0,
  total_cost_in_cr DECIMAL(15, 2) DEFAULT 0,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (submission_id) REFERENCES work_submissions(submission_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_cr_number (cr_number),
  INDEX idx_submission_id (submission_id),
  INDEX idx_created_by (created_by),
  INDEX idx_cr_date (cr_date)
) 

-- Table: work_cr_mapping (Many-to-Many: Works to CR)
CREATE TABLE IF NOT EXISTS work_cr_mapping (
  mapping_id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id VARCHAR(255) NOT NULL,
  cr_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (submission_id) REFERENCES work_submissions(submission_id) ON DELETE CASCADE,
  FOREIGN KEY (cr_id) REFERENCES cr_details_tbl(cr_id) ON DELETE CASCADE,
  UNIQUE KEY unique_work_cr_mapping (submission_id, cr_id),
  INDEX idx_submission_id (submission_id),
  INDEX idx_cr_id (cr_id)
) 

-- Table: user_sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  session_id VARCHAR(255) PRIMARY KEY,
  user_id INT NOT NULL,
  auth_token VARCHAR(500) UNIQUE NOT NULL,
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  logout_time TIMESTAMP NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_auth_token (auth_token),
  INDEX idx_login_time (login_time),
  INDEX idx_last_activity (last_activity)
) 



