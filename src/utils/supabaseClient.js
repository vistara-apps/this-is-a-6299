import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database table names
export const TABLES = {
  USERS: 'users',
  TRADES: 'trades',
  POSITIONS: 'positions',
  SCENARIOS: 'scenarios',
  TUTORIALS: 'tutorials',
  SUBSCRIPTIONS: 'subscriptions'
};

// Helper function to handle Supabase errors
export const handleSupabaseError = (error, context = '') => {
  console.error(`Supabase Error ${context}:`, error);
  
  if (error?.message?.includes('JWT')) {
    return 'Authentication expired. Please log in again.';
  }
  
  if (error?.message?.includes('duplicate')) {
    return 'This record already exists.';
  }
  
  if (error?.message?.includes('foreign key')) {
    return 'Invalid reference to related data.';
  }
  
  return error?.message || 'An unexpected error occurred.';
};

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl !== 'https://your-project.supabase.co' && 
         supabaseAnonKey !== 'your-anon-key' &&
         supabaseUrl.includes('supabase.co');
};
