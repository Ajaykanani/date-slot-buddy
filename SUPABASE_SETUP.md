# Supabase Setup Guide for Date Slot Buddy

This guide will walk you through setting up Supabase for the Date Slot Buddy booking calendar application.

## Prerequisites

- A Supabase account (free tier is sufficient)
- Basic understanding of SQL

## Step-by-Step Setup

### Step 1: Create a Supabase Project

1. Visit [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign In"
3. Once logged in, click "New Project"
4. Fill in the following:
   - **Name**: Date Slot Buddy (or your preferred name)
   - **Database Password**: Choose a strong password (save it securely)
   - **Region**: Select the closest region to your users
   - **Pricing Plan**: Free tier is sufficient for development
5. Click "Create new project" and wait for the project to be provisioned (takes 1-2 minutes)

### Step 2: Create the Database Schema

1. In your Supabase dashboard, navigate to the **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy and paste the following SQL script:

```sql
-- Create bookings table
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dates DATE[] NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  price NUMERIC NOT NULL,
  details TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on dates for better query performance
CREATE INDEX idx_bookings_dates ON bookings USING GIN (dates);

-- Enable Row Level Security (RLS)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security needs)
CREATE POLICY "Enable read access for all users" ON bookings
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON bookings
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON bookings
  FOR DELETE USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

4. Click "Run" (or press Ctrl/Cmd + Enter)
5. You should see "Success. No rows returned" message

### Step 3: Verify Table Creation

1. Navigate to **Table Editor** in the left sidebar
2. You should see the `bookings` table listed
3. Click on it to view the table structure
4. Verify that all columns are present:
   - id (uuid)
   - dates (date[])
   - full_name (text)
   - phone (text)
   - price (numeric)
   - details (text)
   - created_at (timestamptz)
   - updated_at (timestamptz)

### Step 4: Get Your API Credentials

1. Navigate to **Project Settings** (gear icon in left sidebar)
2. Click on **API** in the settings menu
3. You'll find two important values:
   - **Project URL**: Something like `https://abcdefghijklmnop.supabase.co`
   - **anon public key**: A long JWT token starting with `eyJ...`
4. Copy both values - you'll need them in the next step

### Step 5: Configure Your React Application

#### Option A: Using Environment Variables (Recommended)

1. In your project root (`date-slot-buddy/`), create a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Replace the placeholder values with your actual Supabase credentials from Step 4

#### Option B: Direct Configuration

1. Open `src/environments/environment.development.ts`
2. Replace the placeholder values:

```typescript
export const environment = {
  supabaseUrl: "https://your-project-id.supabase.co",
  supabaseAnonKey: "your-anon-key-here",
};
```

### Step 6: Test the Application

1. Start your development server:

```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:5173` (or the URL shown in terminal)
3. Try creating a booking:
   - Select one or more consecutive dates on the calendar
   - Click "Book Selected Dates"
   - Fill in the booking form
   - Submit the form
4. Verify the booking appears in the bookings list
5. Check your Supabase dashboard:
   - Go to **Table Editor** > **bookings**
   - You should see your test booking in the table

### Step 7: Insert Sample Data (Optional)

If you want to test with some sample data, run this SQL in the SQL Editor:

```sql
INSERT INTO bookings (dates, full_name, phone, price, details)
VALUES 
  (ARRAY['2025-11-15', '2025-11-16']::DATE[], 'John Doe', '9876543210', 5000, 'Test booking 1'),
  (ARRAY['2025-11-20']::DATE[], 'Jane Smith', '9123456789', 2500, 'Test booking 2'),
  (ARRAY['2025-11-25', '2025-11-26', '2025-11-27']::DATE[], 'Bob Johnson', '9988776655', 7500, 'Test booking 3');
```

## Security Considerations

### Current Setup (Development)

The current RLS policies allow **public access** to all operations (read, insert, update, delete). This is fine for development but **NOT recommended for production**.

### Recommended Production Setup

For production, you should:

1. **Enable Authentication**:

```sql
-- Remove public policies
DROP POLICY "Enable read access for all users" ON bookings;
DROP POLICY "Enable insert access for all users" ON bookings;
DROP POLICY "Enable update access for all users" ON bookings;
DROP POLICY "Enable delete access for all users" ON bookings;

-- Create authenticated-only policies
CREATE POLICY "Authenticated users can read bookings" ON bookings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create bookings" ON bookings
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update bookings" ON bookings
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete bookings" ON bookings
  FOR DELETE TO authenticated USING (true);
```

2. **Implement Supabase Auth** in your React application
3. **Add user roles** if you need different permission levels (admin vs regular user)
4. **Enable email confirmation** for user signups
5. **Set up rate limiting** in Supabase dashboard

## Troubleshooting

### Issue: "Failed to fetch bookings"

**Possible causes:**
1. Supabase URL or Anon Key is incorrect
2. Table `bookings` doesn't exist
3. RLS policies are too restrictive

**Solutions:**
- Verify your credentials in `.env` or `environment.development.ts`
- Check the browser console for detailed error messages
- Verify the table exists in Supabase Table Editor
- Temporarily disable RLS to test: `ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;`

### Issue: "One or more selected dates are already booked" (but they're not)

**Possible cause:**
- Date format mismatch

**Solution:**
- Check the dates in the database (Table Editor)
- Ensure dates are stored in `YYYY-MM-DD` format

### Issue: CORS errors

**Possible cause:**
- Running the app from a different origin than configured

**Solution:**
- Supabase allows all origins by default
- Check **Project Settings** > **API** > **API Settings** if you need to configure allowed origins

## Next Steps

- Implement user authentication with Supabase Auth
- Add booking confirmation emails using Supabase Edge Functions
- Set up database backups
- Monitor usage in the Supabase dashboard
- Consider upgrading to a paid plan for production use

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL Array Documentation](https://www.postgresql.org/docs/current/arrays.html)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Check the Supabase logs in the dashboard
3. Refer to the [Supabase Discord](https://discord.supabase.com/) for community support

