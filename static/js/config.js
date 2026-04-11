// Supabase Configuration
// IMPORTANT: Replace YOUR_ANON_KEY_HERE with your actual Supabase anon key
// Get it from: Supabase Dashboard → Settings → API → anon public key

const SUPABASE_URL = 'https://bpjukhopjkbdfeuhzdvv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwanVraG9wamtiZGZldWh6ZHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MTcwNjQsImV4cCI6MjA5MTQ5MzA2NH0.1DB3G6HkWEnxUXtoasvkH8BE356VYsKDHwLaiR2psIE';

// Initialize Supabase client (only if not already initialized)
if (typeof window.supabaseClient === 'undefined') {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase initialized successfully');
}

// Use a consistent reference
const supabase = window.supabaseClient;
