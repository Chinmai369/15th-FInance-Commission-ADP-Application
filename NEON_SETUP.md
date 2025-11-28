# Neon Database Setup Guide

This guide will help you connect your 15th FC ADP application to Neon cloud database.

## Prerequisites

1. A Neon account (sign up at https://neon.tech)
2. A Neon project with a database created
3. Your Neon database connection string

## Step 1: Get Your Neon Connection String

1. Log in to your Neon dashboard: https://console.neon.tech
2. Select your project
3. Go to the "Connection Details" section
4. Copy your connection string (it looks like: `postgresql://username:password@host/database?sslmode=require`)

## Step 2: Create Environment File

1. In the root directory of your project, create a `.env` file (if it doesn't exist)
2. Add your Neon connection string:

```env
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
```

**Important:** Never commit the `.env` file to version control. It contains sensitive credentials.

## Step 3: Initialize Database Schema

1. Open your Neon SQL Editor in the dashboard
2. Copy the contents of `Server/schema.sql`
3. Paste and run it in the SQL Editor
4. This will create the necessary tables and indexes

Alternatively, the schema will be automatically created when you start the server (if it doesn't exist).

## Step 4: Install Dependencies

Dependencies are already installed, but if you need to reinstall:

```bash
npm install @neondatabase/serverless dotenv
```

## Step 5: Start the Server

```bash
npm start
```

The server will:
- Connect to your Neon database
- Test the connection
- Automatically create tables if they don't exist
- Start listening on port 5000

## Step 6: Verify Connection

1. Check the server console for:
   - `✅ Neon database connection successful`
   - `✅ Database schema initialized`

2. The frontend will automatically:
   - Load submissions from Neon database when authenticated
   - Save new submissions to Neon database
   - Fall back to IndexedDB/localStorage if Neon is unavailable

## API Endpoints

The following endpoints are now available:

- `GET /api/submissions` - Get all submissions (requires authentication)
- `POST /api/submissions` - Save a single submission (requires authentication)
- `POST /api/submissions/bulk` - Save multiple submissions (requires authentication)
- `GET /api/submissions/:id` - Get a submission by ID (requires authentication)
- `DELETE /api/submissions/:id` - Delete a submission (requires authentication)

## Data Storage Priority

The application uses the following storage priority:

1. **Neon Database** (Primary) - Used when user is authenticated
2. **IndexedDB** (Backup) - Local browser storage
3. **localStorage** (Fallback) - Final fallback if IndexedDB fails

## Troubleshooting

### Connection Failed

- Verify your `DATABASE_URL` in `.env` is correct
- Check that your Neon database is running
- Ensure SSL mode is enabled (`?sslmode=require`)

### Schema Not Created

- Manually run `Server/schema.sql` in Neon SQL Editor
- Check server logs for error messages

### Data Not Syncing

- Check browser console for errors
- Verify you're authenticated (Neon sync only works when logged in)
- Check server logs for database errors

## Migration from Local Storage

If you have existing data in IndexedDB or localStorage:

1. Log in to the application
2. The app will automatically attempt to sync local data to Neon
3. Check the browser console for sync status messages

## Security Notes

- Never expose your `DATABASE_URL` in client-side code
- Use environment variables for all sensitive data
- Keep your `.env` file in `.gitignore`
- Rotate database passwords regularly

