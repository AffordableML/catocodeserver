// Dashboard JavaScript

let currentUser = null;

async function loadDashboard() {
    try {
        // Get current user
        currentUser = await getCurrentUser();
        
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }

        // Get user profile
        const { data: profile } = await supabase
            .from('users')
            .select('username')
            .eq('id', currentUser.id)
            .single();
        
        if (profile) {
            document.getElementById('username').textContent = profile.username;
        }

        // Load stats
        await loadStats();
        
        // Load artworks
        await loadMyArtworks();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadStats() {
    try {
        // Count artworks
        const { count: artworksCount } = await supabase
            .from('artworks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', currentUser.id);
        
        document.getElementById('artworks-count').textContent = artworksCount || 0;

        // Count public artworks
        const { count: publicCount } = await supabase
            .from('artworks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', currentUser.id)
            .eq('is_public', true);
        
        document.getElementById('public-count').textContent = publicCount || 0;

        // Count likes received
        const { data: artworks } = await supabase
            .from('artworks')
            .select('id')
            .eq('user_id', currentUser.id);
        
        if (artworks && artworks.length > 0) {
            const artworkIds = artworks.map(a => a.id);
            const { count: likesCount } = await supabase
                .from('likes')
                .select('*', { count: 'exact', head: true })
                .in('artwork_id', artworkIds);
            
            document.getElementById('likes-count').textContent = likesCount || 0;
        }

        // Count remixes
        const { count: remixesCount } = await supabase
            .from('remixes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', currentUser.id);
        
        document.getElementById('remixes-count').textContent = remixesCount || 0;

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadMyArtworks() {
    try {
        const { data: artworks, error } = await supabase
            .from('artworks')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const container = document.getElementById('my-artworks');
        
        if (!artworks || artworks.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-palette text-6xl text-slate-300 mb-4"></i>
                    <p class="text-xl font-black text-slate-600 mb-4">No artworks yet</p>
                    <a href="editor.html" class="bg-[#20ffad] text-black px-6 py-3 font-black rounded-xl border-2 border-black neo-btn inline-block">
                        Create Your First Artwork
                    </a>
                </div>
            `;
            return;
        }
        
        container.innerHTML = artworks.map(artwork => `
            <div class="bg-white border-2 border-black rounded-xl overflow-hidden neo-card">
                <a href="view.html?id=${artwork.id}" class="block aspect-square bg-slate-100 flex items-center justify-center p-4">
                    ${artwork.thumbnail ? 
                        `<img src="${artwork.thumbnail}" alt="${artwork.title}" class="max-w-full max-h-full object-contain" style="image-rendering: pixelated;">` :
                        `<i class="fas fa-image text-6xl text-slate-300"></i>`
                    }
                </a>
                <div class="p-4 border-t-2 border-black">
                    <h3 class="font-black text-sm mb-2 truncate">${artwork.title}</h3>
                    <div class="flex items-center justify-between text-xs font-bold mb-3">
                        <span class="${artwork.is_public ? 'text-green-600' : 'text-slate-400'}">
                            <i class="fas ${artwork.is_public ? 'fa-globe' : 'fa-lock'} mr-1"></i>
                            ${artwork.is_public ? 'Public' : 'Private'}
                        </span>
                        <span class="text-slate-500">${artwork.width}x${artwork.height}</span>
                    </div>
                    <div class="flex gap-2">
                        <a href="editor.html?id=${artwork.id}" class="flex-1 bg-[#4f46e5] text-white px-3 py-2 text-xs font-black rounded-lg border-2 border-black neo-btn text-center">
                            <i class="fas fa-edit"></i> Edit
                        </a>
                        <button onclick="deleteArtwork('${artwork.id}')" class="bg-red-500 text-white px-3 py-2 text-xs font-black rounded-lg border-2 border-black neo-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading artworks:', error);
    }
}

async function deleteArtwork(artworkId) {
    if (!confirm('Are you sure you want to delete this artwork?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('artworks')
            .delete()
            .eq('id', artworkId)
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        
        // Reload dashboard
        await loadStats();
        await loadMyArtworks();
        
    } catch (error) {
        console.error('Error deleting artwork:', error);
        alert('Failed to delete artwork');
    }
}

// Logout
document.getElementById('logout-btn')?.addEventListener('click', async () => {
    try {
        await signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', loadDashboard);
