// src/config/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxybgqkmcogbeuybaphi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4eWJncWttY29nYmV1eWJhcGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTkzNzYsImV4cCI6MjA5MjkzNTM3Nn0.j6_tPGfYq9ATIhOlhrWZur_c-JIB6h5a6YedJ8ufis4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'smarttax-auth'
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Storage buckets
export const storage = {
  documents: supabase.storage.from('documents'),
  reports: supabase.storage.from('reports'),
  crsp: supabase.storage.from('crsp'),
  profiles: supabase.storage.from('profiles')
};

// Helper to check if user is authenticated
export const isAuthenticated = () => {
  return !!supabase.auth.getSession();
};

// Helper to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export default supabase;