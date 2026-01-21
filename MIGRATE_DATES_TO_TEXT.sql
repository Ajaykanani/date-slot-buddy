-- Migration Script: Convert dates column from DATE[] to TEXT[]
-- This allows storing full datetime strings with time component (e.g., "2026-01-24T01:20:00+05:30")
-- Run this in your Supabase SQL Editor

-- Step 1: Add a temporary column to store datetime strings
ALTER TABLE bookings ADD COLUMN dates_new TEXT[];

-- Step 2: Migrate existing data
-- Convert old DATE format to datetime format with default time 00:00 IST
UPDATE bookings 
SET dates_new = ARRAY(
  SELECT date_value::text || 'T00:00:00+05:30'
  FROM unnest(dates) AS date_value
)
WHERE dates_new IS NULL;

-- Step 3: Drop the old DATE[] column
ALTER TABLE bookings DROP COLUMN dates;

-- Step 4: Rename the new column to dates
ALTER TABLE bookings RENAME COLUMN dates_new TO dates;

-- Step 5: Make it NOT NULL
ALTER TABLE bookings ALTER COLUMN dates SET NOT NULL;

-- Step 6: Recreate the index (if it was dropped)
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings USING GIN (dates);

-- Verification: Check that dates are now stored as TEXT[] with datetime format
-- SELECT id, dates FROM bookings LIMIT 5;
