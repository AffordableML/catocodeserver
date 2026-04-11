// Supabase Configuration
const SUPABASE_URL = 'https://bpjukhopjkbdfeuhzdvv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwanVraG9wamtiZGZldWh6ZHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk1NTYwMDAsImV4cCI6MjAyNTEzMjAwMH0';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
