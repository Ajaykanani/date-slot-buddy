import { createClient } from '@supabase/supabase-js';
import { environment } from '@/environments/environment.development';

// Initialize Supabase client
const supabaseUrl = environment.supabaseUrl;
const supabaseAnonKey = environment.supabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for Supabase database
export interface BookingRow {
  id: string;
  dates: string[]; // Array of date strings in ISO format
  full_name: string;
  phone: string;
  price: number;
  details: string;
  created_at: string;
  updated_at: string;
}

