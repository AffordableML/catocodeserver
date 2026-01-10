document.addEventListener('DOMContentLoaded', () => {
    const editor = ace.edit("editor");
    editor.setTheme("ace/theme/chrome");
    editor.session.setMode("ace/mode/html");
    editor.setOptions({ fontSize: "14px" });

    const fileTree = document.getElementById('file-tree');
    const assetGrid = document.getElementById('asset-grid');
    const previewFrame = document.getElementById('preview-frame');
    const uploadInput = document.getElementById('upload-input');

    let files = [];
    let activeFile = null;

    // --- TAB SWITCHING ---
    const tabFiles = document.getElementById('tab-files');
    const tabAssets = document.getElementById('tab-assets');

    tabFiles.onclick = () => {
        fileTree.classList.remove('hidden');
        assetGrid.classList.add('hidden');
        tabFiles.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
        tabFiles.classList.remove('text-slate-500');
        tabAssets.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
        tabAssets.classList.add('text-slate-500');
    };

    tabAssets.onclick = () => {
        fileTree.classList.add('hidden');
        assetGrid.classList.remove('hidden');
        tabAssets.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
        tabAssets.classList.remove('text-slate-500');
        tabFiles.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
        tabFiles.classList.add('text-slate-500');
    };

    // --- PREVIEW ---
    const updatePreview = () => {
        const index = files.find(f => f.path === 'index.html');
        if (!index) return;
        let content = index.content;
        const urls = new Map();
        files.forEach(f => {
            let type = 'text/plain';
            if (f.path.endsWith('.css')) type = 'text/css';
            if (f.path.endsWith('.js')) type = 'application/javascript';
            if (['png', 'jpg', 'svg'].includes(f.path.split('.').pop())) type = 'image/png';

            // Handle binary content
            let blob;
            if (f.content instanceof Uint8Array) blob = new Blob([f.content], { type });
            else blob = new Blob([f.content], { type });

            urls.set(f.path, URL.createObjectURL(blob));
        });
        urls.forEach((url, path) => {
            content = content.replace(new RegExp(path, 'g'), url);
        });

        // FIXED: Inject the actual PROJECT_UID so serverless functions work in preview
        const projectUid = PROJECT_DATA.project_uid || 'demo';
        const uidScript = `<script>const PROJECT_UID="${projectUid}";</script>`;

        // Insert UID script before </head> or at start of content
        if (content.includes('</head>')) {
            content = content.replace('</head>', uidScript + '</head>');
        } else if (content.includes('<body')) {
            content = content.replace('<body', uidScript + '<body');
        } else {
            content = uidScript + content;
        }

        previewFrame.srcdoc = content;
    };

    // --- AUTO-REFRESH PREVIEW ON CHANGE ---
    let refreshTimeout;
    let hasUnsavedChanges = false;

    editor.session.on('change', () => {
        // Sync current file content
        if (activeFile && !activeFile.is_asset) {
            activeFile.content = editor.getValue();
        }
        hasUnsavedChanges = true;

        // Debounce refresh to avoid too many updates
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
            updatePreview();
        }, 500);
    });

    // Manual refresh button
    document.getElementById('refresh').onclick = () => {
        if (activeFile && !activeFile.is_asset) {
            activeFile.content = editor.getValue();
        }
        updatePreview();
    };

    // --- AUTOSAVE (every 30 seconds) ---
    async function silentSave() {
        if (!PROJECT_DATA.id || !hasUnsavedChanges) return;

        if (activeFile && !activeFile.is_asset) {
            activeFile.content = editor.getValue();
        }

        function toBase64(input) {
            if (typeof input === 'string') return btoa(unescape(encodeURIComponent(input)));
            const bin = []; const bytes = new Uint8Array(input);
            for (let i = 0; i < bytes.byteLength; i++) bin.push(String.fromCharCode(bytes[i]));
            return btoa(bin.join(''));
        }

        const payload = files.map(f => ({
            path: f.path, is_asset: f.is_asset,
            content_b64: toBase64(f.content)
        }));

        try {
            await fetch(`/api/project/${PROJECT_DATA.id}/save`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: payload })
            });
            hasUnsavedChanges = false;
            // Show subtle feedback
            const btn = document.getElementById('save-btn');
            btn.textContent = 'Saved ✓';
            btn.classList.add('bg-green-600');
            btn.classList.remove('bg-blue-600');
            setTimeout(() => {
                btn.textContent = 'Save';
                btn.classList.remove('bg-green-600');
                btn.classList.add('bg-blue-600');
            }, 2000);
        } catch (e) {
            console.error('Autosave failed:', e);
        }
    }

    // Autosave interval
    setInterval(silentSave, 30000);


    // --- EDITOR LOGIC ---
    window.openFile = (path) => {
        if (activeFile && !activeFile.is_asset) activeFile.content = editor.getValue();
        const f = files.find(x => x.path === path);
        if (!f) return;
        activeFile = f;

        if (f.is_asset) {
            editor.setValue("Binary Asset: " + f.path);
            editor.setReadOnly(true);
        } else {
            editor.setValue(f.content, -1);
            editor.setReadOnly(false);
            let mode = 'text';
            if (path.endsWith('.js')) mode = 'javascript';
            if (path.endsWith('.html')) mode = 'html';
            if (path.endsWith('.css')) mode = 'css';
            if (path.endsWith('.py')) mode = 'python';
            editor.session.setMode('ace/mode/' + mode);
        }
        renderFiles();
    };

    function renderFiles() {
        if (!fileTree) return;
        const codeFiles = files.filter(f => !f.is_asset);
        fileTree.innerHTML = codeFiles.map(f => `
            <div onclick="openFile('${f.path}')" class="flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded mb-1 ${activeFile?.path === f.path ? 'bg-white shadow text-blue-600' : 'hover:bg-slate-200'}">
                <i class="fas ${f.path.endsWith('.py') ? 'fa-server' : 'fa-file'} text-xs opacity-50"></i>
                <span class="text-sm font-bold truncate">${f.path}</span>
            </div>
        `).join('');
    }

    // FIXED: renderAssets null check
    function renderAssets() {
        if (!assetGrid) return;
        const assets = files.filter(f => f.is_asset);
        assetGrid.innerHTML = assets.map(f => {
            const url = PROJECT_DATA.id ? `/view/${PROJECT_DATA.project_uid}/${f.path}` : '#';
            return `
            <div class="bg-slate-100 p-2 rounded-lg text-center border group relative">
                <div class="h-16 flex items-center justify-center text-slate-400 text-xl"><i class="fas fa-image"></i></div>
                <div class="text-[10px] font-bold truncate">${f.path}</div>
                <button onclick="copyUrl('${url}')" class="absolute inset-0 bg-blue-600 text-white opacity-0 group-hover:opacity-100 transition rounded-lg text-[10px] font-bold">Copy URL</button>
            </div>`;
        }).join('');
    }
    window.copyUrl = (u) => { navigator.clipboard.writeText(location.origin + u); alert('URL Copied'); };

    // --- UPLOAD ---
    document.getElementById('upload-asset-btn').onclick = () => uploadInput.click();
    uploadInput.onchange = (e) => {
        const fileList = e.target.files;
        if (!fileList.length) return;

        let addedCount = 0;
        for (const file of fileList) {
            const reader = new FileReader();
            const isText = file.name.match(/\.(html|css|js|py|json|txt)$/i);
            const isImage = file.type.startsWith('image/') || file.name.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i);

            reader.onload = (evt) => {
                files.push({
                    path: file.name,
                    content: isText ? evt.target.result : new Uint8Array(evt.target.result),
                    is_asset: !isText || isImage
                });
                addedCount++;
                renderFiles();
                renderAssets();
                updatePreview();

                // Show feedback when all files processed
                if (addedCount === fileList.length) {
                    alert(`✅ Uploaded ${addedCount} file(s)!\n\nClick 'Save' to persist changes.`);
                }
            };
            isText ? reader.readAsText(file) : reader.readAsArrayBuffer(file);
        }
        // Reset input so same file can be re-uploaded
        e.target.value = '';
    };

    // --- SAVE ---
    document.getElementById('save-btn').onclick = async () => {
        if (activeFile && !activeFile.is_asset) activeFile.content = editor.getValue();

        function toBase64(input) {
            if (typeof input === 'string') return btoa(unescape(encodeURIComponent(input)));
            const bin = []; const bytes = new Uint8Array(input);
            for (let i = 0; i < bytes.byteLength; i++) bin.push(String.fromCharCode(bytes[i]));
            return btoa(bin.join(''));
        }

        const payload = files.map(f => ({
            path: f.path, is_asset: f.is_asset,
            content_b64: toBase64(f.content)
        }));

        await fetch(`/api/project/${PROJECT_DATA.id}/save`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: payload })
        });
        alert('Saved');
    };

    // --- LOAD ---
    (async () => {
        if (PROJECT_DATA.id) {
            const res = await fetch(`/api/project/${PROJECT_DATA.id}/files`);
            if (res.ok) {
                const data = await res.json();
                files = data.map(f => {
                    let content;
                    if (f.is_binary) {
                        const bin = atob(f.content);
                        const len = bin.length;
                        const bytes = new Uint8Array(len);
                        for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
                        content = bytes;
                    } else {
                        content = f.content;
                    }
                    return { path: f.path, content: content, is_asset: f.is_asset };
                });
            }
        }

        if (files.length === 0) files = [{ path: 'index.html', content: '<h1>Draft</h1>', is_asset: false }];

        renderFiles(); renderAssets();

        // Auto-select index.html
        const start = files.find(f => f.path === 'index.html') || files[0];
        if (start) openFile(start.path);

        updatePreview();
    })();

    // --- PANEL RESIZERS ---
    const sidebar = document.getElementById('sidebar');
    const previewPane = document.getElementById('preview-pane');
    const resizerLeft = document.getElementById('resizer-left');
    const resizerRight = document.getElementById('resizer-right');

    let isResizingLeft = false;
    let isResizingRight = false;

    resizerLeft.addEventListener('mousedown', (e) => {
        isResizingLeft = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });

    resizerRight.addEventListener('mousedown', (e) => {
        isResizingRight = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (isResizingLeft) {
            const newWidth = e.clientX;
            if (newWidth > 100 && newWidth < 500) {
                sidebar.style.width = newWidth + 'px';
            }
        }
        if (isResizingRight) {
            const containerWidth = window.innerWidth;
            const newWidth = containerWidth - e.clientX;
            if (newWidth > 200 && newWidth < 800) {
                previewPane.style.width = newWidth + 'px';
            }
        }
    });

    document.addEventListener('mouseup', () => {
        isResizingLeft = false;
        isResizingRight = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    });
});