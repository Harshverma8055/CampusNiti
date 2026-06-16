import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uqlcdkbypqqbnbhmqsba.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxbGNka2J5cHFxYm5iaG1xc2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjI1NzIsImV4cCI6MjA5MTIzODU3Mn0.8BBp35rrJy3e3mfR7_TiQHG3KDZkINBNMRHoyNUzChY';

// Use service role key if available, otherwise fall back to anon key
// Service role key bypasses RLS; anon key uses RLS policies
const serverKey = supabaseServiceKey || supabaseAnonKey;

// Server-side client (preferably with service role key)
export const supabaseAdmin = createClient(supabaseUrl, serverKey, {
    auth: { persistSession: false },
});

// Client-side / public client with anon key
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
});

// Helper to get the admin client for API routes
export function getSupabase() {
    return supabaseAdmin;
}
