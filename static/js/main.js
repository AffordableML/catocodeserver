// Main JavaScript for homepage

async function loadGallery() {
    try {
        const { data: artworks, error } = await supabase
            .from('artworks')
            .select(`
                *,
                users (username),
                likes (count)
            `)
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(12);
        
        if (error) throw error;
        
        const gallery = document.getElementById('gallery-grid');
        if (!gallery) return;
        
        if (!artworks || artworks.length === 0) {
            gallery.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-images text-6xl text-slate-300 mb-4"></i>
                    <p class="text-xl font-black text-slate-600">No artworks yet</p>
                    <p class="text-slate-500 font-bold">Be the first to share!</p>
                </div>
            `;
            return;
        }
        
        gallery.innerHTML = artworks.map(artwork => `
            <a href="view.html?id=${artwork.id}" class="bg-white border-2 border-black rounded-xl overflow-hidden neo-card group">
                <div class="aspect-square bg-slate-100 flex items-center justify-center p-4">
                    ${artwork.thumbnail ? 
                        `<img src="${artwork.thumbnail}" alt="${artwork.title}" class="max-w-full max-h-full object-contain" style="image-rendering: pixelated;">` :
                        `<i class="fas fa-image text-6xl text-slate-300"></i>`
                    }
                </div>
                <div class="p-4 border-t-2 border-black">
                    <h3 class="font-black text-sm mb-2 truncate">${artwork.title}</h3>
                    <div class="flex items-center justify-between text-xs text-slate-600 font-bold">
                        <span><i class="fas fa-user mr-1"></i>${artwork.users?.username || 'Anonymous'}</span>
                        <span><i class="fas fa-heart mr-1 text-red-500"></i>${artwork.likes?.length || 0}</span>
                    </div>
                </div>
            </a>
        `).join('');
        
    } catch (error) {
        console.error('Error loading gallery:', error);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthState();
    await loadGallery();
});
