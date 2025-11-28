// db.js - Neon PostgreSQL Connection
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

// Get Neon connection string from environment variable
// Format: postgresql://username:password@host/database?sslmode=require
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('Please create a .env file with your Neon database connection string.');
  console.error('Example: DATABASE_URL=postgresql://username:password@host/database?sslmode=require');
  process.exit(1);
}

// Create Neon SQL client
const sql = neon(connectionString);

// Test connection
export const testConnection = async () => {
  try {
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Neon database connection successful');
    console.log('   - Current time:', result[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Neon database connection failed:', error.message);
    return false;
  }
};

export default sql;