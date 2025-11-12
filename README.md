# Date Slot Buddy - Booking Calendar System

A modern, responsive booking calendar application built with React, TypeScript, and Supabase.

## Project info

**URL**: https://lovable.dev/projects/bd97a036-609c-45ee-9498-8a5b8983d191

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/bd97a036-609c-45ee-9498-8a5b8983d191) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Backend & Database)
- React Query (Data fetching)
- date-fns (Date manipulation)

## Supabase Setup

This application uses Supabase as its backend database. Follow these steps to configure your Supabase project:

### 1. Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project

### 2. Create the Bookings Table

In your Supabase project dashboard:

1. Go to the **SQL Editor**
2. Run the following SQL query to create the bookings table:

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

### 3. Get Your Supabase Credentials

1. Go to **Project Settings** > **API**
2. Copy your **Project URL** (e.g., `https://xxxxx.supabase.co`)
3. Copy your **anon public** key

### 4. Configure Environment Variables

Create a `.env` file in the root of your project:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Alternatively, you can directly edit the `src/environments/environment.development.ts` file and replace the placeholder values.

### 5. Security Considerations

The example RLS policies provided above allow public access to all operations. For production use, you should:

- Implement authentication (Supabase Auth)
- Restrict policies based on authenticated users
- Add additional validation and constraints
- Consider rate limiting

### Database Schema

The `bookings` table has the following structure:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| dates | DATE[] | Array of booked dates |
| full_name | TEXT | Customer's full name |
| phone | TEXT | Customer's phone number |
| price | NUMERIC | Booking price |
| details | TEXT | Additional details/notes |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Record last update timestamp |

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/bd97a036-609c-45ee-9498-8a5b8983d191) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
