-- ============================================
-- 15th FC ADP Application - Complete Database Schema
-- MySQL Database Schema
-- ============================================
-- This schema includes:
-- 1. Core Transactional Tables
-- 2. Master Data Tables
-- 3. Workflow & Audit Tables
-- ============================================

-- ============================================
-- CORE TRANSACTIONAL TABLES
-- ============================================

-- Table: submissions
-- Purpose: Store all work submissions with complete details
CREATE TABLE IF NOT EXISTS submissions (
  id VARCHAR(255) PRIMARY KEY,
  
  -- Basic Work Information
  sector VARCHAR(100) NOT NULL,
  proposal TEXT NOT NULL,
  locality VARCHAR(200),
  area VARCHAR(200),
  ward_no VARCHAR(50),
  latlong VARCHAR(100), -- Latitude, Longitude coordinates
  
  -- Financial Information
  cost DECIMAL(15, 2) NOT NULL,
  priority INTEGER DEFAULT 0,
  
  -- Grant & Program Information
  year VARCHAR(20),
  installment VARCHAR(50),
  grant_type VARCHAR(100),
  program VARCHAR(200),
  
  -- Council Resolution Information
  cr_number VARCHAR(100),
  cr_date DATE,
  cr_status VARCHAR(20), -- 'CR' or empty
  
  -- File Attachments (stored as Base64 or file paths)
  work_image TEXT, -- Base64 encoded image or file path
  detailed_report TEXT, -- Base64 encoded PDF or file path
  committee_report TEXT, -- Base64 encoded PDF or file path
  council_resolution TEXT, -- Base64 encoded PDF or file path
  
  -- Workflow Status
  status VARCHAR(100) NOT NULL DEFAULT 'Pending Review',
  remarks TEXT,
  rejected_by VARCHAR(100), -- Username or role who rejected
  
  -- Forwarding Information
  forwarded_to JSON, -- { department: string, section: string }
  forwarded_from JSON, -- { name: string, timestamp: timestamp }
  
  -- Verification Information (stored as JSON for flexibility)
  verified_by JSON, -- { name: string, designation: string, timestamp: timestamp }
  commissioner_verified_by JSON, -- { name: string, designation: string, timestamp: timestamp }
  eeph_verified_by JSON, -- { name: string, designation: string, timestamp: timestamp }
  seph_verified_by JSON, -- { name: string, designation: string, timestamp: timestamp }
  encph_verified_by JSON, -- { name: string, designation: string, timestamp: timestamp }
  cdma_verified_by JSON, -- { name: string, designation: string, timestamp: timestamp }
  
  -- Complete submission data as JSON (for backward compatibility and flexibility)
  data JSON NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(100), -- Username who created the submission
  
  -- Constraints
  CONSTRAINT submissions_cost_check CHECK (cost >= 0),
  CONSTRAINT submissions_priority_check CHECK (priority >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Core table storing all work submissions with complete workflow information';

-- Indexes for submissions table
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_created_at ON submissions(created_at);
CREATE INDEX idx_submissions_sector ON submissions(sector);
CREATE INDEX idx_submissions_year ON submissions(year);
CREATE INDEX idx_submissions_installment ON submissions(installment);
CREATE INDEX idx_submissions_grant_type ON submissions(grant_type);
CREATE INDEX idx_submissions_ward_no ON submissions(ward_no);
CREATE INDEX idx_submissions_created_by ON submissions(created_by);

-- ============================================
-- USER MANAGEMENT TABLES
-- ============================================

-- Table: users
-- Purpose: Store user authentication and profile information
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- Should be hashed with bcrypt
  role VARCHAR(50) NOT NULL,
  mobile VARCHAR(20) UNIQUE,
  email VARCHAR(255),
  full_name VARCHAR(200),
  designation VARCHAR(200),
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User authentication and profile information';

-- Indexes for users table
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_mobile ON users(mobile);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Table: otp_storage
-- Purpose: Store OTP codes for mobile authentication
CREATE TABLE IF NOT EXISTS otp_storage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mobile VARCHAR(20) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  user_id INT,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='OTP codes for mobile authentication (temporary storage)';

-- Indexes for otp_storage table
CREATE INDEX idx_otp_storage_mobile ON otp_storage(mobile);
CREATE INDEX idx_otp_storage_expires_at ON otp_storage(expires_at);
CREATE INDEX idx_otp_storage_user_id ON otp_storage(user_id);

-- ============================================
-- WORKFLOW & AUDIT TABLES
-- ============================================

-- Table: submission_verifications
-- Purpose: Track all verification and approval actions in the workflow
CREATE TABLE IF NOT EXISTS submission_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id VARCHAR(255) NOT NULL,
  verified_by_user_id INT,
  verified_by_name VARCHAR(200) NOT NULL,
  verified_by_designation VARCHAR(200),
  verification_role VARCHAR(50) NOT NULL, -- 'Commissioner', 'EEPH', 'SEPH', 'ENCPH', 'CDMA'
  action_type VARCHAR(50) NOT NULL, -- 'Approved', 'Rejected', 'Forwarded'
  status_before VARCHAR(100),
  status_after VARCHAR(100) NOT NULL,
  remarks TEXT,
  forwarded_to_department VARCHAR(100),
  forwarded_to_section VARCHAR(100),
  verification_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit trail of all verification and approval actions';

-- Indexes for submission_verifications table
CREATE INDEX idx_submission_verifications_submission_id ON submission_verifications(submission_id);
CREATE INDEX idx_submission_verifications_user_id ON submission_verifications(verified_by_user_id);
CREATE INDEX idx_submission_verifications_role ON submission_verifications(verification_role);
CREATE INDEX idx_submission_verifications_action_type ON submission_verifications(action_type);
CREATE INDEX idx_submission_verifications_timestamp ON submission_verifications(verification_timestamp);

-- Table: submission_audit_log
-- Purpose: Track all changes to submissions for audit purposes
CREATE TABLE IF NOT EXISTS submission_audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id VARCHAR(255) NOT NULL,
  changed_by_user_id INT,
  changed_by_username VARCHAR(100),
  action VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'FILE_UPLOAD'
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  change_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Complete audit log of all changes to submissions';

-- Indexes for submission_audit_log table
CREATE INDEX idx_submission_audit_log_submission_id ON submission_audit_log(submission_id);
CREATE INDEX idx_submission_audit_log_user_id ON submission_audit_log(changed_by_user_id);
CREATE INDEX idx_submission_audit_log_action ON submission_audit_log(action);
CREATE INDEX idx_submission_audit_log_timestamp ON submission_audit_log(change_timestamp);

-- ============================================
-- MASTER DATA TABLES
-- ============================================

-- Table: sectors
-- Purpose: Master data for work sectors
CREATE TABLE IF NOT EXISTS sectors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Master data for work sectors';

-- Indexes for sectors table
CREATE INDEX idx_sectors_code ON sectors(code);
CREATE INDEX idx_sectors_is_active ON sectors(is_active);

-- Table: departments
-- Purpose: Master data for departments
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Master data for departments';

-- Indexes for departments table
CREATE INDEX idx_departments_code ON departments(code);
CREATE INDEX idx_departments_is_active ON departments(is_active);

-- Table: sections
-- Purpose: Master data for sections (linked to departments)
CREATE TABLE IF NOT EXISTS sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_department_section (department_id, code),
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Master data for sections (linked to departments)';

-- Indexes for sections table
CREATE INDEX idx_sections_department_id ON sections(department_id);
CREATE INDEX idx_sections_code ON sections(code);
CREATE INDEX idx_sections_is_active ON sections(is_active);

-- Table: years
-- Purpose: Master data for financial years
CREATE TABLE IF NOT EXISTS years (
  id INT AUTO_INCREMENT PRIMARY KEY,
  year_code VARCHAR(20) UNIQUE NOT NULL,
  year_name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT years_date_range CHECK (end_date > start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Master data for financial years';

-- Indexes for years table
CREATE INDEX idx_years_year_code ON years(year_code);
CREATE INDEX idx_years_is_active ON years(is_active);
CREATE INDEX idx_years_is_current ON years(is_current);

-- Table: installments
-- Purpose: Master data for installments
CREATE TABLE IF NOT EXISTS installments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  installment_code VARCHAR(50) UNIQUE NOT NULL,
  installment_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Master data for installments';

-- Indexes for installments table
CREATE INDEX idx_installments_code ON installments(installment_code);
CREATE INDEX idx_installments_is_active ON installments(is_active);

-- Table: grant_types
-- Purpose: Master data for grant types
CREATE TABLE IF NOT EXISTS grant_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Master data for grant types';

-- Indexes for grant_types table
CREATE INDEX idx_grant_types_code ON grant_types(code);
CREATE INDEX idx_grant_types_is_active ON grant_types(is_active);

-- Table: programs
-- Purpose: Master data for programs/proposals
CREATE TABLE IF NOT EXISTS programs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  grant_type_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (grant_type_id) REFERENCES grant_types(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Master data for programs/proposals';

-- Indexes for programs table
CREATE INDEX idx_programs_code ON programs(code);
CREATE INDEX idx_programs_grant_type_id ON programs(grant_type_id);
CREATE INDEX idx_programs_is_active ON programs(is_active);

-- Table: roles
-- Purpose: Master data for user roles
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSON, -- Store role permissions as JSON
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Master data for user roles';

-- Indexes for roles table
CREATE INDEX idx_roles_code ON roles(code);
CREATE INDEX idx_roles_is_active ON roles(is_active);

-- Table: workflow_statuses
-- Purpose: Master data for workflow statuses
CREATE TABLE IF NOT EXISTS workflow_statuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status_category VARCHAR(50), -- 'PENDING', 'APPROVED', 'REJECTED', 'FORWARDED', 'COMPLETED'
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Master data for workflow statuses';

-- Indexes for workflow_statuses table
CREATE INDEX idx_workflow_statuses_code ON workflow_statuses(code);
CREATE INDEX idx_workflow_statuses_category ON workflow_statuses(status_category);
CREATE INDEX idx_workflow_statuses_is_active ON workflow_statuses(is_active);

-- Table: wards
-- Purpose: Master data for wards (optional)
CREATE TABLE IF NOT EXISTS wards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ward_number VARCHAR(50) UNIQUE NOT NULL,
  ward_name VARCHAR(200),
  locality VARCHAR(200),
  area VARCHAR(200),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Master data for wards (optional)';

-- Indexes for wards table
CREATE INDEX idx_wards_ward_number ON wards(ward_number);
CREATE INDEX idx_wards_is_active ON wards(is_active);

-- Table: localities
-- Purpose: Master data for localities (optional)
CREATE TABLE IF NOT EXISTS localities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  ward_id INT,
  area VARCHAR(200),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ward_id) REFERENCES wards(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Master data for localities (optional)';

-- Indexes for localities table
CREATE INDEX idx_localities_code ON localities(code);
CREATE INDEX idx_localities_ward_id ON localities(ward_id);
CREATE INDEX idx_localities_is_active ON localities(is_active);

-- ============================================
-- INITIAL MASTER DATA (Optional - Seed Data)
-- ============================================

-- Insert default sectors
INSERT IGNORE INTO sectors (code, name, display_order) VALUES
  ('SWM_LQM', 'SWM/LQM', 1),
  ('WATER_SUPPLY', 'Water Supply', 2),
  ('UGD_DRAINS', 'UGD Drains', 3),
  ('CC_DRAINS', 'CC Drains', 4),
  ('CC_ROADS', 'CC Roads', 5),
  ('BT_ROADS', 'BT Roads', 6),
  ('SLAUGHTER_HOUSES', 'Construction of Slaughter Houses', 7),
  ('PARKS', 'Development of Parks', 8),
  ('OPEN_SPACES', 'Protection of Open Spaces', 9),
  ('BURIAL_GROUNDS', 'Burial grounds & Crematoriums', 10),
  ('SCHOOLS', 'Repairs to Municipal Schools', 11),
  ('HEALTH_CLINICS', 'Urban Health Clinics', 12),
  ('GREENERY', 'Greenery', 13),
  ('STREET_LIGHTING', 'Street Lighting', 14),
  ('CC_CHARGES', 'CC Charges', 15),
  ('EESL_DUES', 'EESL Dues', 16),
  ('ABC_ARV', 'ABC & ARV Activities', 17),
  ('SOLAR_PANELS', 'Solar Panels', 18),
  ('CB', 'CB', 19),
  ('IEC', 'IEC', 20);

-- Insert default departments
INSERT IGNORE INTO departments (code, name, display_order) VALUES
  ('ADMIN', 'Administration', 1);

-- Insert default sections (linked to Administration department)
INSERT IGNORE INTO sections (department_id, code, name, display_order)
SELECT d.id, 'SEPH', 'SEPH', 1
FROM departments d WHERE d.code = 'ADMIN';

INSERT IGNORE INTO sections (department_id, code, name, display_order)
SELECT d.id, 'ENCPH', 'ENCPH Department', 2
FROM departments d WHERE d.code = 'ADMIN';

-- Insert default roles
INSERT IGNORE INTO roles (code, name, description) VALUES
  ('ENGINEER', 'Engineer', 'Admin/Engineer role for creating submissions'),
  ('COMMISSIONER', 'Commissioner', 'Commissioner role for initial approval'),
  ('EEPH', 'EEPH', 'Executive Engineer Public Health role'),
  ('SEPH', 'SEPH', 'Superintending Engineer Public Health role'),
  ('ENCPH', 'ENCPH', 'Executive Engineer Public Health role'),
  ('CDMA', 'CDMA', 'CDMA role for final approval and certificate generation');

-- Insert default workflow statuses
INSERT IGNORE INTO workflow_statuses (code, name, status_category, display_order) VALUES
  ('PENDING_REVIEW', 'Pending Review', 'PENDING', 1),
  ('APPROVED', 'Approved', 'APPROVED', 2),
  ('REJECTED', 'Rejected', 'REJECTED', 3),
  ('EEPH_APPROVED', 'EEPH Approved', 'APPROVED', 4),
  ('EEPH_REJECTED', 'EEPH Rejected', 'REJECTED', 5),
  ('SEPH_APPROVED', 'SEPH Approved', 'APPROVED', 6),
  ('SEPH_REJECTED', 'SEPH Rejected', 'REJECTED', 7),
  ('ENCPH_APPROVED', 'ENCPH Approved', 'APPROVED', 8),
  ('ENCPH_REJECTED', 'ENCPH Rejected', 'REJECTED', 9),
  ('FORWARDED_TO_EEPH', 'Forwarded to EEPH', 'FORWARDED', 10),
  ('FORWARDED_TO_SEPH', 'Forwarded to SEPH', 'FORWARDED', 11),
  ('FORWARDED_TO_ENCPH', 'Forwarded to ENCPH', 'FORWARDED', 12),
  ('FORWARDED_TO_CDMA', 'Forwarded to CDMA', 'FORWARDED', 13),
  ('CDMA_APPROVED', 'CDMA Approved', 'APPROVED', 14),
  ('COMPLETED', 'Completed', 'COMPLETED', 15);

-- ============================================
-- VIEWS (Optional - for easier querying)
-- ============================================

-- View: submission_details
-- Purpose: Comprehensive view of submissions with related master data
CREATE OR REPLACE VIEW submission_details AS
SELECT 
  s.*,
  sec.name AS sector_name,
  d.name AS department_name,
  sec2.name AS section_name,
  y.year_name,
  inst.installment_name,
  gt.name AS grant_type_name,
  p.name AS program_name,
  ws.name AS status_name,
  ws.status_category
FROM submissions s
LEFT JOIN sectors sec ON s.sector = sec.code
LEFT JOIN workflow_statuses ws ON s.status = ws.code
LEFT JOIN departments d ON JSON_UNQUOTE(JSON_EXTRACT(s.forwarded_to, '$.department')) = d.code
LEFT JOIN sections sec2 ON JSON_UNQUOTE(JSON_EXTRACT(s.forwarded_to, '$.section')) = sec2.code AND sec2.department_id = d.id
LEFT JOIN years y ON s.year = y.year_code
LEFT JOIN installments inst ON s.installment = inst.installment_code
LEFT JOIN grant_types gt ON s.grant_type = gt.code
LEFT JOIN programs p ON s.program = p.code;

-- ============================================
-- END OF SCHEMA
-- ============================================
