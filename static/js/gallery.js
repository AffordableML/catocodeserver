// Gallery JavaScript - Anonymous Mode

let currentFilter = 'recent';
let currentPage = 0;
const pageSize = 24;
let hasMore = true;

async function loadGallery(append = false) {
    try {
        let query = supabase
            .from('artworks')
            .select('*')
            .eq('is_public', true)
            .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);
        
        // Apply filter
        query = query.order('created_at', { ascending: false });
        
        const { data: artworks, error } = await query;
        
        if (error) throw error;
        
        // Check if there are more pages
        hasMore = artworks && artworks.length === pageSize;
        
        const gallery = document.getElementById('gallery-grid');
        const loadMoreBtn = document.getElementById('load-more-btn');
        
        if (!append) {
            gallery.innerHTML = '';
        }
        
        if (!artworks || artworks.length === 0) {
            if (!append) {
                gallery.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <i class="fas fa-images text-6xl text-slate-300 mb-4"></i>
                        <p class="text-xl font-black text-slate-600">No artworks found</p>
                        <p class="text-slate-500 font-bold">Be the first to share!</p>
                    </div>
                `;
            }
            loadMoreBtn.style.display = 'none';
            return;
        }
        
        const artworkHTML = artworks.map(artwork => `
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
                        <span><i class="fas fa-user mr-1"></i>Anonymous</span>
                        <span>${artwork.width}x${artwork.height}</span>
                    </div>
                </div>
            </a>
        `).join('');
        
        gallery.insertAdjacentHTML('beforeend', artworkHTML);
        
        // Show/hide load more button
        loadMoreBtn.style.display = hasMore ? 'block' : 'none';
        
    } catch (error) {
        console.error('Error loading gallery:', error);
    }
}

function filterGallery(filter) {
    currentFilter = filter;
    currentPage = 0;
    hasMore = true;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-[#20ffad]');
        btn.classList.add('bg-white');
    });
    event.target.classList.add('active', 'bg-[#20ffad]');
    event.target.classList.remove('bg-white');
    
    loadGallery(false);
}

// Load more button
document.getElementById('load-more-btn')?.addEventListener('click', () => {
    currentPage++;
    loadGallery(true);
});

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadGallery();
});
