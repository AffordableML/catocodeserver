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

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        console.log('User signed in');
    } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        // Only redirect if not already on homepage or auth pages
        const currentPage = window.location.pathname;
        if (!currentPage.includes('index.html') && 
            !currentPage.includes('login.html') && 
            !currentPage.includes('register.html') &&
            !currentPage.includes('editor.html') &&
            !currentPage.includes('view.html') &&
            !currentPage.includes('gallery.html') &&
            !currentPage.includes('profile.html') &&
            currentPage !== '/') {
            window.location.href = '/';
        }
    }
});
