// Supabase Configuration
// IMPORTANT: Replace YOUR_ANON_KEY_HERE with your actual Supabase anon key
// Get it from: Supabase Dashboard → Settings → API → anon public key

const SUPABASE_URL = 'https://bpjukhopjkbdfeuhzdvv.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';

// Initialize Supabase client
let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase initialized successfully');
} catch (error) {
    console.error('Failed to initialize Supabase:', error);
    alert('Failed to connect to database. Please check your configuration.');
}
