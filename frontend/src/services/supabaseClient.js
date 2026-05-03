// src/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxybgqkmcogbeuybaphi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4eWJncWttY29nYmV1eWJhcGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTkzNzYsImV4cCI6MjA5MjkzNTM3Nn0.j6_tPGfYq9ATIhOlhrWZur_c-JIB6h5a6YedJ8ufis4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const storage = {
  documents: supabase.storage.from('documents'),
  reports: supabase.storage.from('reports'),
  crsp: supabase.storage.from('crsp'),
  profiles: supabase.storage.from('profiles')
};

export default supabase;