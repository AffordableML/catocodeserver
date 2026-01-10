document.addEventListener('DOMContentLoaded', () => {
    let currentProjectId = PROJECT_DATA.id;
    let selectedTile = 1;
    let levels = {};
    let currentLevelName = 'level1.json';
    let config = { gravity: 0.5, jumpPower: 12, speed: 4, ui: { title: PROJECT_DATA.name, btnColor: "#6366f1", titleColor: "#ffffff", skipTitle: false, css: "" }, levelBackgrounds: {} };
    let assets = {};
    let textures = {};
    let tileMetadata = {};

    const canvas = document.getElementById('level-canvas');
    const ctx = canvas.getContext('2d');
    const TILE_SIZE = 32;
    const ROWS = 22; const COLS = 100; // 3200x704
    canvas.width = 3200; canvas.height = 704;
    canvas.width = 3200; canvas.height = 704;
    ctx.imageSmoothingEnabled = false;

    // --- TABS ---
    document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active state
            document.querySelectorAll('[data-tab]').forEach(b => {
                b.classList.remove('border-b-2', 'border-primary', 'text-primary');
                b.classList.add('border-transparent', 'text-gray-500');
            });
            document.querySelectorAll('.tab-content').forEach(d => d.classList.add('hidden'));

            // Set active
            btn.classList.remove('border-transparent', 'text-gray-500');
            btn.classList.add('border-b-2', 'border-primary', 'text-primary');
            const target = btn.getAttribute('data-tab');
            document.getElementById(`tab-${target}`).classList.remove('hidden');
        });
    });

    // --- HELPER: Init empty level ---
    function initLevel(name) {
        let arr = [];
        for (let r = 0; r < ROWS; r++) {
            let row = [];
            for (let c = 0; c < COLS; c++) row.push(0);
            arr.push(row);
        }
        levels[name] = arr;
    }

    // --- DRAWING ---
    window.drawGrid = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background logic
        const bgImg = config.levelBackgrounds?.[currentLevelName];
        if (bgImg && textures[bgImg]) {
            document.getElementById('canvas-wrapper').style.backgroundImage = `url(${textures[bgImg].src})`;
        } else if (textures.background) {
            document.getElementById('canvas-wrapper').style.backgroundImage = `url(${textures.background.src})`;
        } else {
            document.getElementById('canvas-wrapper').style.backgroundImage = 'linear-gradient(to bottom, #bae6fd 0%, #e0f2fe 100%)';
        }

        ctx.strokeStyle = "rgba(0,0,0,0.05)"; ctx.lineWidth = 1; ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += TILE_SIZE) { ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); }
        for (let y = 0; y <= canvas.height; y += TILE_SIZE) { ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); }
        ctx.stroke();

        if (!levels[currentLevelName]) {
            console.warn(`Level ${currentLevelName} not found, initializing...`);
            initLevel(currentLevelName);
        }

        const currentData = levels[currentLevelName];

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const id = currentData[r][c];
                if (id === 0) continue;
                const x = c * TILE_SIZE; const y = r * TILE_SIZE;

                const meta = tileMetadata[`${currentLevelName}_${r}_${c}`];
                let drawn = false;

                if (meta && meta.texture && textures[meta.texture]) {
                    ctx.drawImage(textures[meta.texture], x, y, TILE_SIZE, TILE_SIZE);
                    drawn = true;
                }

                if (!drawn) {
                    if (id === 1) { if (textures.block_ground) ctx.drawImage(textures.block_ground, x, y, TILE_SIZE, TILE_SIZE); else { ctx.fillStyle = '#334155'; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE); } }
                    else if (id === 2) { if (textures.block_lava) ctx.drawImage(textures.block_lava, x, y, TILE_SIZE, TILE_SIZE); else { ctx.fillStyle = '#ef4444'; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE); } }
                    else if (id === 3) { if (textures.coin) ctx.drawImage(textures.coin, x, y, TILE_SIZE, TILE_SIZE); else { ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(x + 16, y + 16, 8, 0, Math.PI * 2); ctx.fill(); } }
                    else if (id === 9) { ctx.fillStyle = '#22c55e'; ctx.fillRect(x + 8, y + 8, 16, 16); }
                    else if (id === 8) { if (textures.goal) ctx.drawImage(textures.goal, x, y, TILE_SIZE, TILE_SIZE); else { ctx.fillStyle = '#a855f7'; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE); ctx.fillStyle = '#fff'; ctx.fillText('GOAL', x + 2, y + 20); } }
                    else if (id === 5) { if (textures.checkpoint) ctx.drawImage(textures.checkpoint, x, y, TILE_SIZE, TILE_SIZE); else { ctx.fillStyle = '#6ee7b7'; ctx.fillRect(x + 10, y + 10, 12, 22); } }
                    else if (id === 4) { if (textures.enemy) ctx.drawImage(textures.enemy, x, y, TILE_SIZE, TILE_SIZE); else { ctx.fillStyle = '#ec4899'; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE); } }
                    else if (id === 99) { ctx.strokeStyle = 'red'; ctx.lineWidth = 2; ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE); ctx.fillStyle = 'rgba(255,0,0,0.1)'; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE); }
                }
            }
        }
    };

    // --- INTERACTION ---
    let isDrawing = false;
    canvas.addEventListener('mousedown', (e) => { isDrawing = true; handleDraw(e); });
    canvas.addEventListener('mousemove', (e) => { if (isDrawing) handleDraw(e); });
    window.addEventListener('mouseup', () => isDrawing = false);

    function handleDraw(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const c = Math.floor(((e.clientX - rect.left) * scaleX) / TILE_SIZE);
        const r = Math.floor(((e.clientY - rect.top) * scaleY) / TILE_SIZE);

        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
            const currentData = levels[currentLevelName];
            if (e.buttons === 2 || e.ctrlKey) currentData[r][c] = 0;
            else currentData[r][c] = selectedTile;
            drawGrid();
        }
    }
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    // --- UI EXPORTS ---
    window.selectTile = function (id) {
        selectedTile = id;
        const palette = document.getElementById('tile-palette').children;
        for (let el of palette) el.classList.remove('ring-4', 'ring-indigo-400');
        if (window.event && window.event.currentTarget) window.event.currentTarget.classList.add('ring-4', 'ring-indigo-400');
    };

    window.setPick = function (color) {
        document.getElementById('pixel-color').value = color;
        if (color === 'transparent') window.pixelTransparent = true; else window.pixelTransparent = false;
    };

    // --- ASSETS ---
    function addAssetToUI(name, src, type) {
        const div = document.createElement('div');
        div.className = "flex flex-col items-center p-2 border rounded bg-gray-50 relative group cursor-pointer hover:bg-gray-100";
        let content = '';
        if (type === 'image') content = `<img src="${src}" class="w-8 h-8 mb-1 object-contain">`;
        else content = `<i class="fas fa-volume-up text-2xl text-gray-400 mb-1"></i>`;

        div.innerHTML = `${content}<span class="text-[10px] truncate w-full text-center">${name}</span><button class="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100" onclick="deleteAsset('${name}', this)">×</button>`;

        div.onclick = (e) => {
            if (e.target.tagName !== 'BUTTON' && e.target.parentElement.tagName !== 'BUTTON') {
                if (name.includes('ground')) selectTile(1);
                else if (name.includes('lava')) selectTile(2);
                else if (name.includes('coin')) selectTile(3);
                else if (name.includes('goal')) selectTile(8);
                else if (name.includes('enemy')) selectTile(4);
                else if (name.includes('trigger')) selectTile(99);
            }
        };

        document.getElementById('custom-assets-list').appendChild(div);
    }

    window.deleteAsset = (name, el) => {
        if (confirm('Delete?')) { delete assets[name]; el.parentNode.remove(); }
    };

    function applyTexture(name, img) {
        if (name === 'block_ground') { textures.block_ground = img; document.getElementById('tex-ground').src = img.src; document.getElementById('tex-ground').classList.remove('hidden'); }
        if (name === 'block_lava') { textures.block_lava = img; document.getElementById('tex-lava').src = img.src; document.getElementById('tex-lava').classList.remove('hidden'); }
        if (name === 'coin') { textures.coin = img; document.getElementById('tex-coin').src = img.src; document.getElementById('tex-coin').classList.remove('hidden'); }
        if (name === 'goal') { textures.goal = img; document.getElementById('tex-goal').src = img.src; document.getElementById('tex-goal').classList.remove('hidden'); }
        if (name === 'checkpoint') { textures.checkpoint = img; document.getElementById('tex-checkpoint').src = img.src; document.getElementById('tex-checkpoint').classList.remove('hidden'); }
        if (name === 'enemy') { textures.enemy = img; document.getElementById('tex-enemy').src = img.src; document.getElementById('tex-enemy').classList.remove('hidden'); }
        if (name === 'background') textures.background = img;
    }

    // --- UPLOAD HANDLER ---
    document.getElementById('import-sprite').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const b64 = evt.target.result.split(',')[1];
            assets[file.name] = b64;

            if (file.type.startsWith('image')) {
                const img = new Image(); img.src = evt.target.result;
                const name = file.name.split('.')[0];
                textures[name] = img;
                addAssetToUI(name, img.src, 'image');
                applyTexture(name, img);
                drawGrid();
            } else {
                addAssetToUI(file.name, null, 'audio');
            }
            alert("Uploaded: " + file.name);
        };
        reader.readAsDataURL(file);
    });

    document.getElementById('import-ui-bg').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const b64 = evt.target.result.split(',')[1];
            assets['title_screen.png'] = b64;
            alert('Title Screen background updated!');
        };
        reader.readAsDataURL(file);
    });

    document.getElementById('lvl-bg-img').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const b64 = evt.target.result.split(',')[1];
            const name = `bg_${currentLevelName.split('.')[0]}.png`;
            assets[name] = b64;
            if (!config.levelBackgrounds) config.levelBackgrounds = {};
            config.levelBackgrounds[currentLevelName] = name;

            const img = new Image(); img.src = evt.target.result;
            textures[name] = img;
            drawGrid();
        };
        reader.readAsDataURL(file);
    });

    // --- CONTEXT MENU & TRIGGERS ---
    let contextTarget = null;
    canvas.addEventListener('contextmenu', e => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height;
        const c = Math.floor(((e.clientX - rect.left) * scaleX) / TILE_SIZE);
        const r = Math.floor(((e.clientY - rect.top) * scaleY) / TILE_SIZE);

        contextTarget = { r, c };
        const menu = document.getElementById('context-menu');
        menu.style.display = 'block';
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';
    });
    window.addEventListener('click', () => document.getElementById('context-menu').style.display = 'none');

    document.getElementById('ctx-texture').onclick = () => {
        const name = prompt("Enter asset name for this block (e.g. my_rock):");
        if (name) {
            const key = `${currentLevelName}_${contextTarget.r}_${contextTarget.c}`;
            if (!tileMetadata[key]) tileMetadata[key] = {};
            tileMetadata[key].texture = name;
            drawGrid();
        }
    };

    document.getElementById('ctx-clear').onclick = () => {
        levels[currentLevelName][contextTarget.r][contextTarget.c] = 0;
        delete tileMetadata[`${currentLevelName}_${contextTarget.r}_${contextTarget.c}`];
        drawGrid();
    };

    let editingTriggerKey = null;
    let tempEvents = [];
    document.getElementById('ctx-trigger').onclick = () => {
        const key = `${currentLevelName}_${contextTarget.r}_${contextTarget.c}`;
        editingTriggerKey = key;
        const meta = tileMetadata[key] || {};
        tempEvents = meta.events || [];
        renderEventList();
        document.getElementById('trigger-modal').classList.remove('hidden');
    };
    window.closeTriggerModal = () => document.getElementById('trigger-modal').classList.add('hidden');

    window.addEvent = () => {
        const type = document.getElementById('event-type').value;
        const val = document.getElementById('event-val').value;
        tempEvents.push({ type, value: val });
        renderEventList();
    };

    window.saveTriggerData = () => {
        if (!tileMetadata[editingTriggerKey]) tileMetadata[editingTriggerKey] = {};
        tileMetadata[editingTriggerKey].events = tempEvents;
        levels[currentLevelName][contextTarget.r][contextTarget.c] = 99;
        closeTriggerModal();
        drawGrid();
    };

    function renderEventList() {
        const list = document.getElementById('event-list');
        list.innerHTML = tempEvents.map((ev, i) => `
            <div class="flex justify-between bg-white p-2 border rounded text-xs">
                <span><b>${ev.type}</b>: ${ev.value}</span>
                <button class="text-red-500" onclick="tempEvents.splice(${i},1); renderEventList()">x</button>
            </div>
        `).join('');
    }

    // --- PIXEL EDITOR ---
    const pixelGrid = document.getElementById('pixel-canvas');
    let pixelData = new Array(256).fill('transparent');
    let isPaintingPixel = false;
    for (let i = 0; i < 256; i++) { const div = document.createElement('div'); div.className = 'pixel-cell bg-transparent border border-gray-100'; div.addEventListener('mousedown', () => { isPaintingPixel = true; paintPixel(i, div); }); div.addEventListener('mouseover', () => { if (isPaintingPixel) paintPixel(i, div); }); pixelGrid.appendChild(div); }
    window.addEventListener('mouseup', () => isPaintingPixel = false);
    function paintPixel(i, div) { if (window.pixelTransparent) { div.style.backgroundColor = 'transparent'; pixelData[i] = 'transparent'; } else { const c = document.getElementById('pixel-color').value; div.style.backgroundColor = c; pixelData[i] = c; } }
    document.getElementById('pixel-save').onclick = async () => {
        const name = document.getElementById('pixel-name').value || 'asset_' + Date.now();
        const pCanvas = document.createElement('canvas'); pCanvas.width = 16; pCanvas.height = 16; const pCtx = pCanvas.getContext('2d');
        pixelData.forEach((col, i) => { if (col !== 'transparent') { pCtx.fillStyle = col; pCtx.fillRect(i % 16, Math.floor(i / 16), 1, 1); } });
        const b64 = pCanvas.toDataURL().split(',')[1]; assets[name + '.png'] = b64;
        addAssetToUI(name, pCanvas.toDataURL(), 'image'); const img = new Image(); img.src = pCanvas.toDataURL(); applyTexture(name, img); drawGrid(); alert(`Saved ${name}!`);
    };

    // --- SAVE ---
    async function performSave(publish, visibility) {
        config.description = document.getElementById('pub-desc').value; // Use modal desc if publishing
        if (!publish) config.description = ""; // Or keep existing
        config.ui = {
            title: document.getElementById('ui-title').value,
            titleColor: document.getElementById('ui-title-color').value,
            btnColor: document.getElementById('ui-btn-color').value,
            skipTitle: document.getElementById('ui-skip').checked,
            css: document.getElementById('ui-css').value
        };
        config.tileMetadata = tileMetadata;
        config.levels = Object.keys(levels).sort();

        const payload = [
            { path: 'game_config.json', content_b64: btoa(JSON.stringify(config)) }
        ];

        for (let [lvl, data] of Object.entries(levels)) {
            payload.push({ path: lvl, content_b64: btoa(JSON.stringify(data)) });
        }

        for (let [path, b64] of Object.entries(assets)) {
            payload.push({ path: path, content_b64: b64 });
        }

        const body = { files: payload, description: config.description };
        if (publish && visibility) body.visibility = visibility;

        const res = await fetch(`/api/project/${currentProjectId}/save`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (res.ok) alert(publish ? 'Published!' : 'Saved!');
        else {
            const data = await res.json();
            alert('Error: ' + data.error);
        }
    }

    document.getElementById('save-btn').onclick = () => performSave(false);
    document.getElementById('publish-btn').onclick = () => {
        // Pre-fill desc if exists
        document.getElementById('publish-modal').classList.remove('hidden');
    };
    document.getElementById('confirm-publish').onclick = () => {
        performSave(true, document.getElementById('pub-vis').value);
        document.getElementById('publish-modal').classList.add('hidden');
    };

    // --- LOAD ---
    (async () => {
        const res = await fetch(`/api/project/${currentProjectId}/files`);
        const files = await res.json();
        const cfg = files.find(f => f.path === 'game_config.json');
        if (cfg) {
            config = JSON.parse(cfg.content);
            if (config.tileMetadata) tileMetadata = config.tileMetadata;
            if (config.ui) {
                document.getElementById('ui-title').value = config.ui.title || '';
                document.getElementById('ui-title-color').value = config.ui.titleColor || '#ffffff';
                document.getElementById('ui-btn-color').value = config.ui.btnColor || '#6366f1';
                document.getElementById('ui-skip').checked = config.ui.skipTitle || false;
                document.getElementById('ui-css').value = config.ui.css || '';
            }
            if (config.levelBackgrounds) {
                // loaded by default config obj
            }
            document.getElementById('conf-gravity').value = config.gravity || 0.5;
            document.getElementById('conf-jump').value = config.jumpPower || 12;
            document.getElementById('conf-speed').value = config.speed || 4;
        }
        files.forEach(f => {
            if (f.path.match(/^level\d+\.json$/)) levels[f.path] = JSON.parse(f.content);
            if (f.is_asset) {
                assets[f.path] = f.content;
                if (f.path.endsWith('.png') || f.path.endsWith('.jpg')) {
                    const img = new Image();
                    img.src = `data:image/png;base64,${f.content}`;
                    const name = f.path.split('.')[0];
                    textures[name] = img;
                    applyTexture(name, img);
                    addAssetToUI(name, img.src, 'image');
                } else if (f.path.endsWith('.mp3') || f.path.endsWith('.wav')) {
                    addAssetToUI(f.path, null, 'audio');
                }
            }
        });

        if (Object.keys(levels).length === 0) initLevel('level1.json');

        const levelSelect = document.getElementById('level-select');
        Object.keys(levels).sort().forEach(name => {
            const opt = document.createElement('option'); opt.value = name; opt.innerText = name;
            levelSelect.appendChild(opt);
        });

        drawGrid();
    })();
});