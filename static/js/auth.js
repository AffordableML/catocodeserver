// Authentication helper functions

async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

async function signUp(email, password, username) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: username
            }
        }
    });
    
    if (error) throw error;
    
    // Create user profile
    if (data.user) {
        const { error: profileError } = await supabase
            .from('users')
            .insert([
                {
                    id: data.user.id,
                    email: email,
                    username: username
                }
            ]);
        
        if (profileError) throw profileError;
    }
    
    return data;
}

async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    
    if (error) throw error;
    return data;
}

async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

// Check auth state on page load
async function checkAuthState() {
    const user = await getCurrentUser();
    
    if (user) {
        // User is logged in
        const authButtons = document.getElementById('auth-buttons');
        const dashboardButton = document.getElementById('dashboard-button');
        
        if (authButtons) authButtons.classList.add('hidden');
        if (dashboardButton) dashboardButton.classList.remove('hidden');
        
        return user;
    }
    
    return null;
}
