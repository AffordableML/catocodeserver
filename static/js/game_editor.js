// ----------------------------------------------------------------------------
// 1. BLOCK DEFINITIONS (JSON Format to avoid constructor errors)
// ----------------------------------------------------------------------------
Blockly.defineBlocksWithJsonArray([
    // --- EVENTS ---
    {
        "type": "on_start",
        "message0": "When game starts",
        "nextStatement": null,
        "colour": "#FFD700"
    },
    {
        "type": "on_update",
        "message0": "Game Loop (forever)",
        "message1": "%1",
        "args1": [{ "type": "input_statement", "name": "DO" }],
        "colour": "#FFD700"
    },

    // --- LOOKS (Sprite Creation) ---
    {
        "type": "create_sprite",
        "message0": "Create sprite %1 from image %2 at x:%3 y:%4 size:%5",
        "args0": [
            { "type": "field_variable", "name": "VAR", "variable": "mySprite" },
            { "type": "field_input", "name": "IMG", "text": "URL" },
            { "type": "input_value", "name": "X", "check": "Number" },
            { "type": "input_value", "name": "Y", "check": "Number" },
            { "type": "input_value", "name": "SIZE", "check": "Number" }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#9966FF"
    },
    {
        "type": "set_bg",
        "message0": "Set background color %1",
        "args0": [{ "type": "field_colour", "name": "COL", "colour": "#ffffff" }],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#9966FF"
    },
    {
        "type": "show_hide",
        "message0": "%1 sprite %2",
        "args0": [
            { "type": "field_dropdown", "name": "OP", "options": [["Show", "show"], ["Hide", "hide"]] },
            { "type": "field_variable", "name": "VAR", "variable": "mySprite" }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#9966FF"
    },

    // --- MOTION ---
    {
        "type": "move_steps",
        "message0": "Move sprite %1 by %2 steps",
        "args0": [
            { "type": "field_variable", "name": "VAR", "variable": "mySprite" },
            { "type": "input_value", "name": "STEPS", "check": "Number" }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#4C97FF"
    },
    {
        "type": "change_x",
        "message0": "Change %1 x by %2",
        "args0": [
            { "type": "field_variable", "name": "VAR", "variable": "mySprite" },
            { "type": "input_value", "name": "DX", "check": "Number" }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#4C97FF"
    },
    {
        "type": "change_y",
        "message0": "Change %1 y by %2",
        "args0": [
            { "type": "field_variable", "name": "VAR", "variable": "mySprite" },
            { "type": "input_value", "name": "DY", "check": "Number" }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#4C97FF"
    },
    {
        "type": "go_to_xy",
        "message0": "Go to x:%1 y:%2 (%3)",
        "args0": [
            { "type": "input_value", "name": "X", "check": "Number" },
            { "type": "input_value", "name": "Y", "check": "Number" },
            { "type": "field_variable", "name": "VAR", "variable": "mySprite" }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#4C97FF"
    },
    {
        "type": "bounce_edge",
        "message0": "If on edge, bounce %1",
        "args0": [{ "type": "field_variable", "name": "VAR", "variable": "mySprite" }],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#4C97FF"
    },
    {
        "type": "point_direction",
        "message0": "Point %1 in direction %2",
        "args0": [
            { "type": "field_variable", "name": "VAR", "variable": "mySprite" },
            { "type": "input_value", "name": "DIR", "check": "Number" }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": "#4C97FF"
    },

    // --- SENSING ---
    {
        "type": "key_pressed",
        "message0": "Key %1 pressed?",
        "args0": [
            {
                "type": "field_dropdown", "name": "KEY", "options": [
                    ["Space", " "], ["Up", "ArrowUp"], ["Down", "ArrowDown"],
                    ["Left", "ArrowLeft"], ["Right", "ArrowRight"], ["w", "w"], ["a", "a"], ["s", "s"], ["d", "d"]
                ]
            }
        ],
        "output": "Boolean",
        "colour": "#5CB1D6"
    },
    {
        "type": "touching_sprite",
        "message0": "%1 touching %2 ?",
        "args0": [
            { "type": "field_variable", "name": "A", "variable": "mySprite" },
            { "type": "field_variable", "name": "B", "variable": "otherSprite" }
        ],
        "output": "Boolean",
        "colour": "#5CB1D6"
    },
    {
        "type": "mouse_down",
        "message0": "Mouse down?",
        "output": "Boolean",
        "colour": "#5CB1D6"
    },
    {
        "type": "mouse_x",
        "message0": "Mouse X",
        "output": "Number",
        "colour": "#5CB1D6"
    },
    {
        "type": "mouse_y",
        "message0": "Mouse Y",
        "output": "Number",
        "colour": "#5CB1D6"
    }
]);

// ----------------------------------------------------------------------------
// 2. JAVASCRIPT GENERATORS
// ----------------------------------------------------------------------------
Blockly.JavaScript['on_start'] = function (block) {
    return ''; // This code is placed in Setup by the runner
};

Blockly.JavaScript['on_update'] = function (block) {
    const code = Blockly.JavaScript.statementToCode(block, 'DO');
    return `Game.onUpdate = function() {\n${code}\n};\n`;
};

Blockly.JavaScript['create_sprite'] = function (block) {
    const varName = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
    const img = block.getFieldValue('IMG');
    const x = Blockly.JavaScript.valueToCode(block, 'X', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    const y = Blockly.JavaScript.valueToCode(block, 'Y', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    const size = Blockly.JavaScript.valueToCode(block, 'SIZE', Blockly.JavaScript.ORDER_ATOMIC) || '50';
    return `${varName} = Game.createSprite('${img}', ${x}, ${y}, ${size});\n`;
};

Blockly.JavaScript['set_bg'] = function (block) {
    const col = block.getFieldValue('COL');
    return `Game.bg = '${col}';\n`;
};

Blockly.JavaScript['show_hide'] = function (block) {
    const op = block.getFieldValue('OP');
    const varName = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
    return `if(${varName}) ${varName}.hidden = ${op === 'hide'};\n`;
};

Blockly.JavaScript['move_steps'] = function (block) {
    const varName = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
    const steps = Blockly.JavaScript.valueToCode(block, 'STEPS', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    return `if(${varName}) {
        ${varName}.x += Math.cos(${varName}.rot * Math.PI/180) * ${steps};
        ${varName}.y += Math.sin(${varName}.rot * Math.PI/180) * ${steps};
    }\n`;
};

Blockly.JavaScript['change_x'] = function (block) {
    const varName = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
    const dx = Blockly.JavaScript.valueToCode(block, 'DX', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    return `if(${varName}) ${varName}.x += ${dx};\n`;
};

Blockly.JavaScript['change_y'] = function (block) {
    const varName = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
    const dy = Blockly.JavaScript.valueToCode(block, 'DY', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    return `if(${varName}) ${varName}.y += ${dy};\n`;
};

Blockly.JavaScript['go_to_xy'] = function (block) {
    const varName = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
    const x = Blockly.JavaScript.valueToCode(block, 'X', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    const y = Blockly.JavaScript.valueToCode(block, 'Y', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    return `if(${varName}) { ${varName}.x = ${x}; ${varName}.y = ${y}; }\n`;
};

Blockly.JavaScript['point_direction'] = function (block) {
    const varName = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
    const dir = Blockly.JavaScript.valueToCode(block, 'DIR', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    return `if(${varName}) ${varName}.rot = ${dir};\n`;
};

Blockly.JavaScript['bounce_edge'] = function (block) {
    const varName = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
    return `if(${varName}) {
        if(${varName}.x < 0) { ${varName}.x=0; ${varName}.rot = 180 - ${varName}.rot; }
        if(${varName}.x > canvas.width - ${varName}.w) { ${varName}.x=canvas.width-${varName}.w; ${varName}.rot = 180 - ${varName}.rot; }
        if(${varName}.y < 0) { ${varName}.y=0; ${varName}.rot = -${varName}.rot; }
        if(${varName}.y > canvas.height - ${varName}.h) { ${varName}.y=canvas.height-${varName}.h; ${varName}.rot = -${varName}.rot; }
    }\n`;
};

Blockly.JavaScript['key_pressed'] = function (block) {
    const key = block.getFieldValue('KEY');
    return [`Game.keys['${key}']`, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript['touching_sprite'] = function (block) {
    const a = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('A'), Blockly.Variables.NAME_TYPE);
    const b = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('B'), Blockly.Variables.NAME_TYPE);
    return [`Game.isTouching(${a}, ${b})`, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript['mouse_down'] = function (block) {
    return ['Game.mouse.down', Blockly.JavaScript.ORDER_ATOMIC];
};
Blockly.JavaScript['mouse_x'] = function (block) { return ['Game.mouse.x', Blockly.JavaScript.ORDER_ATOMIC]; };
Blockly.JavaScript['mouse_y'] = function (block) { return ['Game.mouse.y', Blockly.JavaScript.ORDER_ATOMIC]; };


// ----------------------------------------------------------------------------
// 3. EDITOR & RUNTIME
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Inject Blockly
    const workspace = Blockly.inject('blockly-div', {
        toolbox: document.getElementById('toolbox'),
        scrollbars: true,
        trashcan: true,
        move: { scrollbars: true, drag: true, wheel: true },
        theme: Blockly.Themes.Dark
    });

    if (SAVED_STATE) {
        Blockly.serialization.workspaces.load(JSON.parse(SAVED_STATE), workspace);
    }

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const consoleDiv = document.getElementById('gameConsole');
    let gameInterval = null;

    // --- GAME ENGINE ---
    window.Game = {
        sprites: [],
        bg: '#ffffff',
        onUpdate: null,
        keys: {},
        mouse: { x: 0, y: 0, down: false },

        init: function () {
            this.sprites = [];
            this.bg = '#ffffff';
            this.onUpdate = null;
            // Listeners handled once
        },
        createSprite: function (url, x, y, size) {
            const s = { img: new Image(), x: x, y: y, w: size, h: size, rot: 0, hidden: false };
            s.img.src = url;
            this.sprites.push(s);
            return s;
        },
        isTouching: function (s1, s2) {
            if (!s1 || !s2) return false;
            return (s1.x < s2.x + s2.w && s1.x + s1.w > s2.x && s1.y < s2.y + s2.h && s1.y + s1.h > s2.y);
        },
        log: function (msg) {
            consoleDiv.innerHTML += `<div>> ${msg}</div>`;
            consoleDiv.scrollTop = consoleDiv.scrollHeight;
        }
    };

    // Input Listeners
    window.addEventListener('keydown', e => Game.keys[e.key] = true);
    window.addEventListener('keyup', e => Game.keys[e.key] = false);
    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        Game.mouse.x = e.clientX - rect.left;
        Game.mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mousedown', () => Game.mouse.down = true);
    window.addEventListener('mouseup', () => Game.mouse.down = false);

    // Run Button
    document.getElementById('run-btn').addEventListener('click', () => {
        if (gameInterval) cancelAnimationFrame(gameInterval);
        Game.init();
        consoleDiv.innerHTML = '<div>> Game Started</div>';

        // Generate and Run Code
        Blockly.JavaScript.INFINITE_LOOP_TRAP = null;
        const code = Blockly.JavaScript.workspaceToCode(workspace);

        try {
            eval(code); // This defines variables and setup logic

            const loop = () => {
                if (Game.onUpdate) Game.onUpdate(); // Run block logic

                // Render
                ctx.fillStyle = Game.bg;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                Game.sprites.forEach(s => {
                    if (!s.hidden && s.img.complete) {
                        ctx.save();
                        ctx.translate(s.x + s.w / 2, s.y + s.h / 2);
                        ctx.rotate(s.rot * Math.PI / 180);
                        ctx.drawImage(s.img, -s.w / 2, -s.h / 2, s.w, s.h);
                        ctx.restore();
                    }
                });

                gameInterval = requestAnimationFrame(loop);
            };
            loop();

        } catch (e) {
            Game.log(`Error: ${e.message}`);
        }
    });

    // Asset Management
    function loadAssets() {
        fetch(`/api/game/${PROJECT_ID}/assets`).then(r => r.json()).then(data => {
            if (data.success) {
                const grid = document.getElementById('asset-list');
                grid.innerHTML = '';
                data.assets.forEach(a => {
                    const el = document.createElement('div');
                    el.className = 'asset-item';
                    el.innerHTML = `<img src="${a.url}"><div class="asset-name">${a.name}</div>`;
                    el.onclick = () => {
                        // Copy URL to clipboard
                        navigator.clipboard.writeText(a.url);
                        Game.log(`Copied asset URL: ${a.name}`);
                    };
                    grid.appendChild(el);
                });
            }
        });
    }
    loadAssets();

    document.getElementById('game-upload').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const form = new FormData();
        form.append('file', file);

        const res = await fetch(`/api/game/${PROJECT_ID}/upload_asset`, { method: 'POST', body: form });
        const data = await res.json();

        if (data.success) {
            loadAssets();
            Game.log('Uploaded asset');
        } else {
            alert(data.error);
        }
    });

    // Save
    document.getElementById('save-game-btn').addEventListener('click', async () => {
        const state = JSON.stringify(Blockly.serialization.workspaces.save(workspace));
        await fetch(`/api/game/${PROJECT_ID}/save`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_state: state })
        });
        alert('Game Saved!');
    });

    // Download
    document.getElementById('download-btn').addEventListener('click', async () => {
        const code = Blockly.JavaScript.workspaceToCode(workspace);
        const res = await fetch('/api/game/compile', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "my_cato_game.html";
        a.click();
    });
});