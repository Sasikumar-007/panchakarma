import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ecnvqliessxiowtduowj.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjbnZxbGllc3N4aW93dGR1b3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNzEyNjIsImV4cCI6MjA4Nzg0NzI2Mn0.dWKAtmPdJGklO6n9nBqd349KRdpsb07IolaP-Ezpg0M';

export const supabase = createClient(supabaseUrl, supabaseKey);
