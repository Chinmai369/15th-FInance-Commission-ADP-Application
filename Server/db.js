// db.js - Neon PostgreSQL Connection (Optional)
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

// Get Neon connection string from environment variable
// Format: postgresql://username:password@host/database?sslmode=require
const connectionString = process.env.DATABASE_URL;

let sql = null;

// Only create SQL client if connection string is provided
if (connectionString) {
  try {
    sql = neon(connectionString);
    console.log('📦 Neon database connection string found (optional - not required for local storage)');
  } catch (error) {
    console.warn('⚠️ Warning: Could not initialize Neon client:', error.message);
    sql = null;
  }
} else {
  console.log('ℹ️  DATABASE_URL not set - using local storage only (IndexedDB/localStorage)');
  console.log('   - Neon database is optional. To enable, set DATABASE_URL in .env file');
}

// Test connection (optional)
export const testConnection = async () => {
  if (!sql) {
    console.log('ℹ️  Neon database not configured - skipping connection test');
    return false;
  }
  
  try {
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Neon database connection successful');
    console.log('   - Current time:', result[0].current_time);
    return true;
  } catch (error) {
    console.warn('⚠️ Neon database connection failed:', error.message);
    console.log('   - Application will continue using local storage only');
    return false;
  }
};

export default sql;