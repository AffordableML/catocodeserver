// --- STATE ---
let gameData = { scenes: [{ name: "Scene 1", objects: [] }], events: [] };
let assets = [];
let editingEventId = null;
let editingSlot = null; // 'condition' or 'action'

// --- THREE.JS SCENE SETUP ---
const canvas = document.getElementById('scene-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(canvas.clientWidth / -2, canvas.clientWidth / 2, canvas.clientHeight / 2, canvas.clientHeight / -2, 1, 1000);
camera.position.z = 10;

// Grid Helper
const grid = new THREE.GridHelper(2000, 100, 0xdddddd, 0xeeeeee);
grid.rotation.x = Math.PI / 2;
scene.add(grid);

function renderScene() {
    requestAnimationFrame(renderScene);
    renderer.render(scene, camera);
}
renderScene();

// Resize Handler
new ResizeObserver(() => {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    camera.left = canvas.clientWidth / -2;
    camera.right = canvas.clientWidth / 2;
    camera.top = canvas.clientHeight / 2;
    camera.bottom = canvas.clientHeight / -2;
    camera.updateProjectionMatrix();
}).observe(canvas.parentNode);

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    // Load Project
    const res = await fetch(`/api/project/${PROJECT_ID}/load`);
    const data = await res.json();
    if (data.gameData && Object.keys(data.gameData).length > 0) gameData = data.gameData;

    // Load Assets
    if (data.assets) {
        data.assets.forEach(a => {
            const b64 = a.content;
            assets.push({ path: a.path, content: b64 });
            addAssetUI(a.path, b64);
            // Preload texture into scene if object exists
            preloadTexture(a.path, b64);
        });
    }

    // Rebuild Scene Objects
    gameData.scenes[0].objects.forEach(obj => {
        addObjectToScene(obj.asset, obj.x, obj.y);
    });

    renderEventSheet();
});

// --- ASSET MANAGER ---
function addAssetUI(name, b64) {
    const div = document.createElement('div');
    div.className = 'asset-item';
    div.draggable = true;
    div.innerHTML = `<img src="data:image/png;base64,${b64}"><span class="asset-name" title="${name}">${name}</span>`;
    div.ondragstart = (e) => {
        e.dataTransfer.setData('type', 'asset');
        e.dataTransfer.setData('name', name);
    };
    document.getElementById('asset-browser').appendChild(div);
}

const textureCache = {};
function preloadTexture(name, b64) {
    const tex = new THREE.TextureLoader().load(`data:image/png;base64,${b64}`);
    textureCache[name] = tex;
}

document.getElementById('upload-asset').addEventListener('change', (e) => {
    for (let file of e.target.files) {
        const reader = new FileReader();
        reader.onload = evt => {
            const b64 = evt.target.result.split(',')[1];
            assets.push({ path: file.name, content: b64 });
            addAssetUI(file.name, b64);
            preloadTexture(file.name, b64);
        };
        reader.readAsDataURL(file);
    }
});

// --- DRAG & DROP SCENE ---
canvas.addEventListener('dragover', e => e.preventDefault());
canvas.addEventListener('drop', e => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    const name = e.dataTransfer.getData('name');

    if (type === 'asset') {
        const rect = canvas.getBoundingClientRect();
        // Calculate scene coordinates (0,0 is center)
        const x = (e.clientX - rect.left) - canvas.clientWidth / 2;
        const y = -((e.clientY - rect.top) - canvas.clientHeight / 2);

        addObjectToScene(name, x, y);
        gameData.scenes[0].objects.push({ id: Date.now(), asset: name, x: x, y: y });
    }
});

function addObjectToScene(assetName, x, y) {
    if (!textureCache[assetName]) return;
    const mat = new THREE.SpriteMaterial({ map: textureCache[assetName] });
    const sprite = new THREE.Sprite(mat);
    // Simple scaling based on texture aspect? defaulted to 100x100 for visibility
    sprite.scale.set(64, 64, 1);
    sprite.position.set(x, y, 0);
    scene.add(sprite);
}

// --- EVENT SHEET SYSTEM ---

// 50+ Definitions
const DEFINITIONS = {
    condition: {
        'Common': [
            { id: 'start', label: 'At the beginning of the scene' },
            { id: 'always', label: 'Always (every frame)' },
            { id: 'timer', label: 'Timer "X" is greater than "Y" seconds', params: ['Timer Name', 'Seconds'] }
        ],
        'Input': [
            { id: 'key_press', label: 'Key pressed', params: ['Key (e.g. Space)'] },
            { id: 'key_down', label: 'Key is down', params: ['Key'] },
            { id: 'key_released', label: 'Key released', params: ['Key'] },
            { id: 'mouse_click', label: 'Mouse button pressed', params: ['Button (Left/Right)'] },
            { id: 'mouse_hover', label: 'Cursor is on object', params: ['Object'] }
        ],
        'Collision': [
            { id: 'collision', label: 'Object is in collision with another', params: ['Object A', 'Object B'] }
        ],
        'Objects': [
            { id: 'pos_x_compare', label: 'X position compare', params: ['Object', 'Operator (<,>,=)', 'Value'] },
            { id: 'visible', label: 'Is visible', params: ['Object'] }
        ]
        // Add 40+ more here in real app
    },
    action: {
        'Object': [
            { id: 'set_pos', label: 'Set position', params: ['Object', 'X', 'Y'] },
            { id: 'add_pos_x', label: 'Add to X position (Move)', params: ['Object', 'Value'] },
            { id: 'add_pos_y', label: 'Add to Y position', params: ['Object', 'Value'] },
            { id: 'destroy', label: 'Delete object', params: ['Object'] },
            { id: 'hide', label: 'Hide', params: ['Object'] },
            { id: 'show', label: 'Show', params: ['Object'] },
            { id: 'rotate', label: 'Rotate', params: ['Object', 'Degrees'] },
            { id: 'scale', label: 'Set Scale', params: ['Object', 'Scale'] }
        ],
        'Audio': [
            { id: 'play_sound', label: 'Play Sound', params: ['Asset Name'] },
            { id: 'stop_sound', label: 'Stop Sound', params: ['Asset Name'] }
        ],
        'Scene': [
            { id: 'change_scene', label: 'Change Scene', params: ['Scene Name'] },
            { id: 'restart', label: 'Restart Scene' },
            { id: 'bg_color', label: 'Set Background Color', params: ['Hex Code'] }
        ],
        'System': [
            { id: 'log', label: 'Log to Console', params: ['Message'] },
            { id: 'wait', label: 'Wait X seconds', params: ['Seconds'] }
        ]
    }
};

window.addEvent = () => {
    gameData.events.push({
        id: Date.now(),
        conditions: [], // List of conditions (AND)
        actions: []     // List of actions
    });
    renderEventSheet();
};

function renderEventSheet() {
    const container = document.getElementById('event-sheet');
    container.innerHTML = '';

    gameData.events.forEach(ev => {
        const row = document.createElement('div');
        row.className = 'event-row';

        // Conditions Col
        const condCol = document.createElement('div');
        condCol.className = 'event-condition';
        if (ev.conditions.length === 0) {
            condCol.innerHTML = `<span class="text-gray-400 italic text-xs">Add condition</span>`;
        } else {
            ev.conditions.forEach(c => {
                condCol.innerHTML += `<div class="event-text py-1 border-b border-gray-100 last:border-0">
                    <span class="font-bold text-orange-600">${getLabel('condition', c.type)}</span> 
                    <span class="text-gray-500 ml-1">(${c.params ? c.params.join(', ') : ''})</span>
                </div>`;
            });
        }
        condCol.onclick = () => openPicker(ev.id, 'condition');

        // Actions Col
        const actCol = document.createElement('div');
        actCol.className = 'event-action';
        if (ev.actions.length === 0) {
            actCol.innerHTML = `<span class="text-gray-400 italic text-xs">Add action</span>`;
        } else {
            ev.actions.forEach(a => {
                actCol.innerHTML += `<div class="event-text py-1 border-b border-gray-100 last:border-0">
                    <span class="font-bold text-blue-600">${getLabel('action', a.type)}</span> 
                    <span class="text-gray-500 ml-1">(${a.params ? a.params.join(', ') : ''})</span>
                </div>`;
            });
        }
        actCol.onclick = () => openPicker(ev.id, 'action');

        row.appendChild(condCol);
        row.appendChild(actCol);
        container.appendChild(row);
    });

    // Add Event Btn at bottom
    const addBtn = document.createElement('div');
    addBtn.className = 'add-event-btn';
    addBtn.innerText = '+ Add New Event';
    addBtn.onclick = window.addEvent;
    container.appendChild(addBtn);
}

function getLabel(kind, type) {
    for (const cat in DEFINITIONS[kind]) {
        const found = DEFINITIONS[kind][cat].find(x => x.id === type);
        if (found) return found.label.split('(')[0]; // Simple label
    }
    return type;
}

// --- PICKER MODAL ---
window.openPicker = (eventId, slot) => {
    editingEventId = eventId;
    editingSlot = slot;
    document.getElementById('picker-title').innerText = slot === 'condition' ? "Add Condition" : "Add Action";
    document.getElementById('picker-modal').classList.remove('hidden');

    // Render Categories
    const catContainer = document.getElementById('picker-categories');
    catContainer.innerHTML = '';
    const defs = DEFINITIONS[slot];

    Object.keys(defs).forEach(cat => {
        const btn = document.createElement('div');
        btn.className = 'p-3 hover:bg-white hover:text-blue-600 cursor-pointer text-gray-600 text-sm font-medium border-l-4 border-transparent hover:border-blue-600 transition';
        btn.innerText = cat;
        btn.onclick = () => renderOptions(slot, cat);
        catContainer.appendChild(btn);
    });

    // Render first cat by default
    renderOptions(slot, Object.keys(defs)[0]);
};

function renderOptions(slot, category) {
    const list = document.getElementById('picker-options');
    list.innerHTML = '';
    const opts = DEFINITIONS[slot][category];

    opts.forEach(opt => {
        const div = document.createElement('div');
        div.className = 'p-2 hover:bg-blue-50 cursor-pointer rounded border border-transparent hover:border-blue-100 transition';
        div.innerHTML = `<div class="font-bold text-gray-800">${opt.label}</div><div class="text-xs text-gray-400">${opt.id}</div>`;
        div.onclick = () => selectOption(opt);
        list.appendChild(div);
    });
}

function selectOption(opt) {
    let params = [];
    if (opt.params) {
        // Simple prompt for parameters (In a real app, use a modal form)
        for (let p of opt.params) {
            let val = prompt(`Enter value for ${p}:`);
            if (val === null) return; // Cancelled
            params.push(val);
        }
    }

    const event = gameData.events.find(e => e.id === editingEventId);
    if (editingSlot === 'condition') {
        event.conditions.push({ type: opt.id, params });
    } else {
        event.actions.push({ type: opt.id, params });
    }

    closePicker();
    renderEventSheet();
}

window.closePicker = () => document.getElementById('picker-modal').classList.add('hidden');

// --- RUN & SAVE ---
window.saveProject = async () => {
    // Standardized Save
    const payload = [{ path: 'data.json', content_b64: btoa(JSON.stringify({ gameData })) }];
    assets.forEach(a => payload.push({ path: a.path, content_b64: a.content }));

    const res = await fetch(`/api/project/${PROJECT_ID}/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: payload })
    });
    if (res.ok) alert('Saved!');
};

window.runGame = () => {
    saveProject().then(() => {
        const frame = document.getElementById('game-frame');
        document.getElementById('game-runtime-overlay').classList.remove('hidden');
        // In a real implementation, this would load a 'runner.html' that executes the logic
        // For this demo, we can just inject the exported HTML directly
        fetch(`/project/${PROJECT_ID}/export`).then(r => r.text()).then(html => {
            frame.srcdoc = html;
        });
    });
};

window.stopGame = () => {
    document.getElementById('game-runtime-overlay').classList.add('hidden');
    document.getElementById('game-frame').srcdoc = '';
};