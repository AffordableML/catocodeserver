// Pixel Art Editor - Anonymous Mode

let artworkId = null;
let remixId = null;

// Canvas settings
let canvasWidth = 32;
let canvasHeight = 32;
let pixelSize = 16;
let pixels = [];

// Drawing state
let currentTool = 'pen';
let currentColor = '#000000';
let isDrawing = false;

// Canvas elements
const canvas = document.getElementById('pixel-canvas');
const ctx = canvas.getContext('2d');

// Default color palette
const defaultPalette = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00',
    '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85929E'
];

async function init() {
    // Check for remix mode
    const urlParams = new URLSearchParams(window.location.search);
    artworkId = urlParams.get('id');
    remixId = urlParams.get('remix');
    
    if (artworkId || remixId) {
        await loadArtwork(artworkId || remixId, !!remixId);
    } else {
        initCanvas();
    }
    
    setupColorPalette();
    setupEventListeners();
}

function initCanvas() {
    // Initialize pixel array
    pixels = new Array(canvasWidth * canvasHeight).fill('#FFFFFF');
    
    // Set canvas display size
    canvas.width = canvasWidth * pixelSize;
    canvas.height = canvasHeight * pixelSize;
    
    drawCanvas();
}

function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw pixels
    for (let y = 0; y < canvasHeight; y++) {
        for (let x = 0; x < canvasWidth; x++) {
            const index = y * canvasWidth + x;
            ctx.fillStyle = pixels[index];
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
    }
    
    // Draw grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvasWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(x * pixelSize, 0);
        ctx.lineTo(x * pixelSize, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= canvasHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * pixelSize);
        ctx.lineTo(canvas.width, y * pixelSize);
        ctx.stroke();
    }
}

function setupColorPalette() {
    const palette = document.getElementById('color-palette');
    palette.innerHTML = defaultPalette.map(color => `
        <button onclick="setColor('${color}')" 
            class="w-full aspect-square border-2 border-black rounded-lg neo-btn"
            style="background-color: ${color};">
        </button>
    `).join('');
}

function setupEventListeners() {
    // Color picker
    document.getElementById('color-picker').addEventListener('change', (e) => {
        setColor(e.target.value);
    });
    
    // Canvas events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    
    // Touch events
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        canvas.dispatchEvent(mouseEvent);
    });
    
    // Share button
    document.getElementById('share-btn').addEventListener('click', shareToGallery);
    
    // Export button
    document.getElementById('export-btn').addEventListener('click', exportArtwork);
}

function getPixelCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.floor((e.clientX - rect.left) * scaleX / pixelSize);
    const y = Math.floor((e.clientY - rect.top) * scaleY / pixelSize);
    
    return { x, y };
}

function startDrawing(e) {
    isDrawing = true;
    draw(e);
}

function draw(e) {
    if (!isDrawing && currentTool !== 'eyedropper') return;
    
    const { x, y } = getPixelCoords(e);
    
    if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) return;
    
    const index = y * canvasWidth + x;
    
    switch (currentTool) {
        case 'pen':
            pixels[index] = currentColor;
            drawCanvas();
            break;
        case 'eraser':
            pixels[index] = '#FFFFFF';
            drawCanvas();
            break;
        case 'fill':
            if (isDrawing) {
                floodFill(x, y, pixels[index], currentColor);
                isDrawing = false;
            }
            break;
        case 'eyedropper':
            setColor(pixels[index]);
            break;
    }
}

function stopDrawing() {
    isDrawing = false;
}

function floodFill(x, y, targetColor, fillColor) {
    if (targetColor === fillColor) return;
    
    const stack = [[x, y]];
    const visited = new Set();
    
    while (stack.length > 0) {
        const [cx, cy] = stack.pop();
        const key = `${cx},${cy}`;
        
        if (visited.has(key)) continue;
        if (cx < 0 || cx >= canvasWidth || cy < 0 || cy >= canvasHeight) continue;
        
        const index = cy * canvasWidth + cx;
        if (pixels[index] !== targetColor) continue;
        
        visited.add(key);
        pixels[index] = fillColor;
        
        stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    
    drawCanvas();
}

function setTool(tool) {
    currentTool = tool;
    
    // Update button states
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-[#20ffad]');
        btn.classList.add('bg-white');
    });
    event.target.classList.add('active', 'bg-[#20ffad]');
    event.target.classList.remove('bg-white');
}

function setColor(color) {
    currentColor = color;
    document.getElementById('color-picker').value = color;
}

function resizeCanvas(width, height) {
    if (!confirm(`Resize canvas to ${width}x${height}? This will clear your current work.`)) {
        return;
    }
    
    canvasWidth = width;
    canvasHeight = height;
    
    // Adjust pixel size for display
    const maxSize = 512;
    pixelSize = Math.floor(maxSize / Math.max(width, height));
    
    initCanvas();
}

function clearCanvas() {
    if (!confirm('Clear the entire canvas? This cannot be undone.')) {
        return;
    }
    
    pixels = new Array(canvasWidth * canvasHeight).fill('#FFFFFF');
    drawCanvas();
}

async function shareToGallery() {
    try {
        const title = document.getElementById('artwork-title').value || 'Untitled Artwork';
        
        // Generate thumbnail
        const thumbnail = generateThumbnail();
        
        const artworkData = {
            title,
            data: { pixels },
            width: canvasWidth,
            height: canvasHeight,
            thumbnail,
            is_public: true,
            user_id: null // Anonymous
        };
        
        // Create new artwork
        const { data, error } = await supabase
            .from('artworks')
            .insert([artworkData])
            .select()
            .single();
        
        if (error) throw error;
        
        artworkId = data.id;
        
        // Show share link
        const shareUrl = `${window.location.origin}/view.html?id=${artworkId}`;
        
        const copyToClipboard = confirm(
            `✅ Shared to gallery!\n\nShare link:\n${shareUrl}\n\nCopy link to clipboard?`
        );
        
        if (copyToClipboard) {
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Link copied to clipboard!');
            });
        }
        
        // Redirect to view page
        setTimeout(() => {
            window.location.href = `view.html?id=${artworkId}`;
        }, 500);
        
    } catch (error) {
        console.error('Error sharing artwork:', error);
        alert('Failed to share artwork. Please try again.');
    }
}

function generateThumbnail() {
    // Create a smaller canvas for thumbnail
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = canvasWidth;
    thumbCanvas.height = canvasHeight;
    const thumbCtx = thumbCanvas.getContext('2d');
    
    // Draw pixels without grid
    for (let y = 0; y < canvasHeight; y++) {
        for (let x = 0; x < canvasWidth; x++) {
            const index = y * canvasWidth + x;
            thumbCtx.fillStyle = pixels[index];
            thumbCtx.fillRect(x, y, 1, 1);
        }
    }
    
    return thumbCanvas.toDataURL('image/png');
}

function exportArtwork() {
    const link = document.createElement('a');
    link.download = `${document.getElementById('artwork-title').value || 'artwork'}.png`;
    
    // Create export canvas
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvasWidth;
    exportCanvas.height = canvasHeight;
    const exportCtx = exportCanvas.getContext('2d');
    
    // Draw pixels
    for (let y = 0; y < canvasHeight; y++) {
        for (let x = 0; x < canvasWidth; x++) {
            const index = y * canvasWidth + x;
            exportCtx.fillStyle = pixels[index];
            exportCtx.fillRect(x, y, 1, 1);
        }
    }
    
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
}

async function loadArtwork(id, isRemix = false) {
    try {
        const { data, error } = await supabase
            .from('artworks')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Load artwork data
        document.getElementById('artwork-title').value = isRemix ? `Remix of ${data.title}` : data.title;
        canvasWidth = data.width;
        canvasHeight = data.height;
        pixels = data.data.pixels;
        
        // Adjust pixel size
        const maxSize = 512;
        pixelSize = Math.floor(maxSize / Math.max(canvasWidth, canvasHeight));
        
        canvas.width = canvasWidth * pixelSize;
        canvas.height = canvasHeight * pixelSize;
        
        drawCanvas();
        
        if (isRemix) {
            artworkId = null; // Clear artworkId so it creates new artwork
        }
        
    } catch (error) {
        console.error('Error loading artwork:', error);
        alert('Failed to load artwork');
    }
}

// Initialize editor
document.addEventListener('DOMContentLoaded', init);
