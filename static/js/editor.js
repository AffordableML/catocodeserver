// Pixel Art & Animation Editor

// Canvas settings
let canvasWidth = 32;
let canvasHeight = 32;
let pixelSize = 16;

// Animation frames
let frames = [];
let currentFrameIndex = 0;
let isPlaying = false;
let playInterval = null;
let fps = 10;

// Drawing state
let currentTool = 'pen';
let currentColor = '#000000';
let isDrawing = false;

// Canvas elements
const canvas = document.getElementById('pixel-canvas');
const ctx = canvas.getContext('2d');

// Import state
let importedImage = null;

// Default color palette
const defaultPalette = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00',
    '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85929E'
];

function init() {
    // Initialize with one empty frame
    frames.push(createEmptyFrame());
    
    setupCanvas();
    setupColorPalette();
    setupEventListeners();
    updateTimeline();
    drawCurrentFrame();
}

function createEmptyFrame() {
    return new Array(canvasWidth * canvasHeight).fill('#FFFFFF');
}

function setupCanvas() {
    canvas.width = canvasWidth * pixelSize;
    canvas.height = canvasHeight * pixelSize;
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
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
    
    // FPS input
    document.getElementById('fps-input').addEventListener('change', (e) => {
        fps = parseInt(e.target.value) || 10;
        if (isPlaying) {
            stopPlay();
            startPlay();
        }
    });
    
    // Import button
    document.getElementById('import-btn').addEventListener('click', () => {
        document.getElementById('file-input').click();
    });
    
    document.getElementById('file-input').addEventListener('change', handleFileSelect);
    
    // Export buttons
    document.getElementById('export-png-btn').addEventListener('click', exportPNG);
    document.getElementById('export-gif-btn').addEventListener('click', exportGIF);
}

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
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
    const currentFrame = frames[currentFrameIndex];
    
    switch (currentTool) {
        case 'pen':
            currentFrame[index] = currentColor;
            drawCurrentFrame();
            break;
        case 'eraser':
            currentFrame[index] = '#FFFFFF';
            drawCurrentFrame();
            break;
        case 'fill':
            if (isDrawing) {
                floodFill(x, y, currentFrame[index], currentColor);
                isDrawing = false;
            }
            break;
        case 'eyedropper':
            setColor(currentFrame[index]);
            break;
    }
}

function stopDrawing() {
    isDrawing = false;
}

function floodFill(x, y, targetColor, fillColor) {
    if (targetColor === fillColor) return;
    
    const currentFrame = frames[currentFrameIndex];
    const stack = [[x, y]];
    const visited = new Set();
    
    while (stack.length > 0) {
        const [cx, cy] = stack.pop();
        const key = `${cx},${cy}`;
        
        if (visited.has(key)) continue;
        if (cx < 0 || cx >= canvasWidth || cy < 0 || cy >= canvasHeight) continue;
        
        const index = cy * canvasWidth + cx;
        if (currentFrame[index] !== targetColor) continue;
        
        visited.add(key);
        currentFrame[index] = fillColor;
        
        stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    
    drawCurrentFrame();
}

function drawCurrentFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const currentFrame = frames[currentFrameIndex];
    
    // Draw pixels
    for (let y = 0; y < canvasHeight; y++) {
        for (let x = 0; x < canvasWidth; x++) {
            const index = y * canvasWidth + x;
            ctx.fillStyle = currentFrame[index];
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

function setTool(tool) {
    currentTool = tool;
    
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
    if (!confirm(`Resize canvas to ${width}x${height}? This will clear all frames.`)) {
        return;
    }
    
    canvasWidth = width;
    canvasHeight = height;
    
    const maxSize = 512;
    pixelSize = Math.floor(maxSize / Math.max(width, height));
    
    frames = [createEmptyFrame()];
    currentFrameIndex = 0;
    
    setupCanvas();
    updateTimeline();
    drawCurrentFrame();
}

function clearCanvas() {
    if (!confirm('Clear current frame?')) return;
    
    frames[currentFrameIndex] = createEmptyFrame();
    drawCurrentFrame();
}

// Timeline functions
function toggleTimeline() {
    const content = document.getElementById('timeline-content');
    const icon = document.getElementById('timeline-toggle-icon');
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    } else {
        content.classList.add('hidden');
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }
}

function updateTimeline() {
    const timeline = document.getElementById('timeline');
    const frameCount = document.getElementById('frame-count');
    
    frameCount.textContent = frames.length;
    
    timeline.innerHTML = frames.map((frame, index) => `
        <div onclick="selectFrame(${index})" 
            class="frame-thumb ${index === currentFrameIndex ? 'ring-4 ring-[#20ffad]' : ''} 
            w-24 h-24 border-2 border-black rounded-lg cursor-pointer bg-checkered flex items-center justify-center overflow-hidden neo-btn">
            <canvas id="thumb-${index}" width="${canvasWidth}" height="${canvasHeight}" 
                style="image-rendering: pixelated; max-width: 100%; max-height: 100%;"></canvas>
        </div>
    `).join('');
    
    // Draw thumbnails
    frames.forEach((frame, index) => {
        const thumbCanvas = document.getElementById(`thumb-${index}`);
        if (thumbCanvas) {
            const thumbCtx = thumbCanvas.getContext('2d');
            for (let y = 0; y < canvasHeight; y++) {
                for (let x = 0; x < canvasWidth; x++) {
                    const pixelIndex = y * canvasWidth + x;
                    thumbCtx.fillStyle = frame[pixelIndex];
                    thumbCtx.fillRect(x, y, 1, 1);
                }
            }
        }
    });
}

function selectFrame(index) {
    if (isPlaying) stopPlay();
    currentFrameIndex = index;
    updateTimeline();
    drawCurrentFrame();
}

function addFrame() {
    frames.push(createEmptyFrame());
    currentFrameIndex = frames.length - 1;
    updateTimeline();
    drawCurrentFrame();
}

function duplicateFrame() {
    // Create a copy of the current frame
    const currentFrame = frames[currentFrameIndex];
    const duplicatedFrame = [...currentFrame];
    
    // Insert after current frame
    frames.splice(currentFrameIndex + 1, 0, duplicatedFrame);
    currentFrameIndex = currentFrameIndex + 1;
    
    updateTimeline();
    drawCurrentFrame();
}

function deleteFrame() {
    if (frames.length === 1) {
        alert('Cannot delete the last frame!');
        return;
    }
    
    if (!confirm('Delete current frame?')) return;
    
    frames.splice(currentFrameIndex, 1);
    currentFrameIndex = Math.max(0, currentFrameIndex - 1);
    updateTimeline();
    drawCurrentFrame();
}

function togglePlay() {
    if (isPlaying) {
        stopPlay();
    } else {
        startPlay();
    }
}

function startPlay() {
    if (frames.length === 1) return;
    
    isPlaying = true;
    document.getElementById('play-btn').innerHTML = '<i class="fas fa-stop mr-1"></i>Stop';
    
    const delay = 1000 / fps; // Convert FPS to milliseconds
    
    playInterval = setInterval(() => {
        currentFrameIndex = (currentFrameIndex + 1) % frames.length;
        drawCurrentFrame();
    }, delay);
}

function stopPlay() {
    isPlaying = false;
    clearInterval(playInterval);
    document.getElementById('play-btn').innerHTML = '<i class="fas fa-play mr-1"></i>Play';
    updateTimeline();
}

// Import functions
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            importedImage = img;
            
            // Set default values
            document.getElementById('slice-cols').value = 1;
            document.getElementById('slice-rows').value = 1;
            
            // Show modal and update preview
            document.getElementById('import-modal').classList.remove('hidden');
            updateImportPreview();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function updateImportPreview() {
    if (!importedImage) return;
    
    const cols = parseInt(document.getElementById('slice-cols').value) || 1;
    const rows = parseInt(document.getElementById('slice-rows').value) || 1;
    
    const frameWidth = Math.floor(importedImage.width / cols);
    const frameHeight = Math.floor(importedImage.height / rows);
    const totalFrames = cols * rows;
    
    // Update info
    document.getElementById('frame-width-display').textContent = frameWidth;
    document.getElementById('frame-height-display').textContent = frameHeight;
    document.getElementById('total-frames-display').textContent = totalFrames;
    
    // Draw preview with grid
    const previewCanvas = document.getElementById('import-preview-canvas');
    previewCanvas.width = importedImage.width;
    previewCanvas.height = importedImage.height;
    const previewCtx = previewCanvas.getContext('2d');
    
    // Draw image
    previewCtx.drawImage(importedImage, 0, 0);
    
    // Draw grid
    previewCtx.strokeStyle = '#ff6b6b';
    previewCtx.lineWidth = 2;
    
    // Vertical lines
    for (let i = 1; i < cols; i++) {
        previewCtx.beginPath();
        previewCtx.moveTo(i * frameWidth, 0);
        previewCtx.lineTo(i * frameWidth, importedImage.height);
        previewCtx.stroke();
    }
    
    // Horizontal lines
    for (let i = 1; i < rows; i++) {
        previewCtx.beginPath();
        previewCtx.moveTo(0, i * frameHeight);
        previewCtx.lineTo(importedImage.width, i * frameHeight);
        previewCtx.stroke();
    }
}

function confirmImport() {
    const cols = parseInt(document.getElementById('slice-cols').value) || 1;
    const rows = parseInt(document.getElementById('slice-rows').value) || 1;
    
    if (!importedImage) return;
    
    const frameWidth = Math.floor(importedImage.width / cols);
    const frameHeight = Math.floor(importedImage.height / rows);
    
    if (frameWidth === 0 || frameHeight === 0) {
        alert('Invalid frame size!');
        return;
    }
    
    // Create temporary canvas to extract pixels
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // Clear existing frames
    frames = [];
    canvasWidth = frameWidth;
    canvasHeight = frameHeight;
    
    // Adjust pixel size
    const maxSize = 512;
    pixelSize = Math.floor(maxSize / Math.max(frameWidth, frameHeight));
    
    // Extract frames
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            tempCanvas.width = frameWidth;
            tempCanvas.height = frameHeight;
            
            tempCtx.drawImage(
                importedImage,
                col * frameWidth, row * frameHeight, frameWidth, frameHeight,
                0, 0, frameWidth, frameHeight
            );
            
            // Extract pixel data
            const imageData = tempCtx.getImageData(0, 0, frameWidth, frameHeight);
            const frame = [];
            
            for (let i = 0; i < imageData.data.length; i += 4) {
                const r = imageData.data[i];
                const g = imageData.data[i + 1];
                const b = imageData.data[i + 2];
                const a = imageData.data[i + 3];
                
                if (a < 128) {
                    frame.push('#FFFFFF');
                } else {
                    frame.push(rgbToHex(r, g, b));
                }
            }
            
            frames.push(frame);
        }
    }
    
    currentFrameIndex = 0;
    setupCanvas();
    updateTimeline();
    drawCurrentFrame();
    cancelImport();
}

function cancelImport() {
    document.getElementById('import-modal').classList.add('hidden');
    importedImage = null;
    document.getElementById('file-input').value = '';
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// Export functions
function exportPNG() {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvasWidth * frames.length;
    exportCanvas.height = canvasHeight;
    const exportCtx = exportCanvas.getContext('2d');
    
    frames.forEach((frame, frameIndex) => {
        for (let y = 0; y < canvasHeight; y++) {
            for (let x = 0; x < canvasWidth; x++) {
                const index = y * canvasWidth + x;
                exportCtx.fillStyle = frame[index];
                exportCtx.fillRect(frameIndex * canvasWidth + x, y, 1, 1);
            }
        }
    });
    
    const link = document.createElement('a');
    link.download = 'spritesheet.png';
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
}

function exportGIF() {
    if (frames.length === 1) {
        alert('Add more frames to create an animated GIF!');
        return;
    }
    
    const interval = 1 / fps; // Convert FPS to seconds per frame
    
    // Create image array for gifshot
    const images = frames.map(frame => {
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = canvasWidth;
        frameCanvas.height = canvasHeight;
        const frameCtx = frameCanvas.getContext('2d');
        
        for (let y = 0; y < canvasHeight; y++) {
            for (let x = 0; x < canvasWidth; x++) {
                const index = y * canvasWidth + x;
                frameCtx.fillStyle = frame[index];
                frameCtx.fillRect(x, y, 1, 1);
            }
        }
        
        return frameCanvas.toDataURL('image/png');
    });
    
    // Create GIF using gifshot
    gifshot.createGIF({
        images: images,
        gifWidth: canvasWidth,
        gifHeight: canvasHeight,
        interval: interval,
        numFrames: frames.length,
        frameDuration: 1,
        sampleInterval: 1
    }, function(obj) {
        if (!obj.error) {
            const link = document.createElement('a');
            link.download = 'animation.gif';
            link.href = obj.image;
            link.click();
        } else {
            alert('Error creating GIF: ' + obj.error);
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
