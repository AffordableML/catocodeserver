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
    let folders = new Set();
    let activeFile = null;
    let isMarkdownPreview = false;

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

    // --- MARKDOWN PREVIEW ---
    window.toggleMarkdownPreview = () => {
        if (!activeFile || !activeFile.path.endsWith('.md')) return;
        
        isMarkdownPreview = !isMarkdownPreview;
        const btn = document.getElementById('md-preview-btn');
        
        if (isMarkdownPreview) {
            btn.classList.add('bg-purple-600', 'text-white');
            btn.classList.remove('bg-purple-100', 'text-purple-600');
            btn.innerHTML = '<i class="fas fa-code mr-1"></i>Edit';
            
            const html = marked.parse(activeFile.content);
            previewFrame.srcdoc = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown.min.css">
                    <style>
                        body { padding: 20px; max-width: 800px; margin: 0 auto; }
                        .markdown-body { background: transparent; }
                    </style>
                </head>
                <body class="markdown-body">
                    ${html}
                </body>
                </html>
            `;
        } else {
            btn.classList.remove('bg-purple-600', 'text-white');
            btn.classList.add('bg-purple-100', 'text-purple-600');
            btn.innerHTML = '<i class="fas fa-eye mr-1"></i>Preview';
            updatePreview();
        }
    };

    function checkMarkdownFile() {
        const btn = document.getElementById('md-preview-btn');
        if (activeFile && activeFile.path.endsWith('.md')) {
            btn.classList.remove('hidden');
        } else {
            btn.classList.add('hidden');
            isMarkdownPreview = false;
        }
    }

    // --- PREVIEW ---
    const updatePreview = () => {
        if (isMarkdownPreview) return;
        
        const index = files.find(f => f.path === 'index.html');
        if (!index) return;
        let content = index.content;
        const urls = new Map();
        files.forEach(f => {
            let type = 'text/plain';
            if (f.path.endsWith('.css')) type = 'text/css';
            if (f.path.endsWith('.js')) type = 'application/javascript';
            if (['png', 'jpg', 'svg', 'webp', 'gif'].includes(f.path.split('.').pop())) type = 'image/png';

            let blob;
            if (f.content instanceof Uint8Array) blob = new Blob([f.content], { type });
            else blob = new Blob([f.content], { type });

            urls.set(f.path, URL.createObjectURL(blob));
        });
        urls.forEach((url, path) => {
            content = content.replace(new RegExp(path, 'g'), url);
        });

        const projectUid = PROJECT_DATA.project_uid || 'demo';
        const uidScript = `<script>const PROJECT_UID="${projectUid}";</script>`;

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
        if (activeFile && !activeFile.is_asset) {
            activeFile.content = editor.getValue();
        }
        hasUnsavedChanges = true;

        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
            if (!isMarkdownPreview) updatePreview();
        }, 500);
    });

    document.getElementById('refresh').onclick = () => {
        if (activeFile && !activeFile.is_asset) {
            activeFile.content = editor.getValue();
        }
        if (isMarkdownPreview) {
            toggleMarkdownPreview();
        } else {
            updatePreview();
        }
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

    setInterval(silentSave, 30000);

    // --- EDITOR LOGIC ---
    window.openFile = (path) => {
        if (isMarkdownPreview) {
            isMarkdownPreview = false;
            const btn = document.getElementById('md-preview-btn');
            btn.classList.remove('bg-purple-600', 'text-white');
            btn.classList.add('bg-purple-100', 'text-purple-600');
            btn.innerHTML = '<i class="fas fa-eye mr-1"></i>Preview';
        }
        
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
            if (path.endsWith('.md')) mode = 'markdown';
            if (path.endsWith('.json')) mode = 'json';
            editor.session.setMode('ace/mode/' + mode);
        }
        renderFiles();
        checkMarkdownFile();
    };

    function getFileIcon(path) {
        // kept for compatibility, but we now use SVG icons via getFileSVG
        if (path.endsWith('.html')) return 'html';
        if (path.endsWith('.css')) return 'css';
        if (path.endsWith('.js')) return 'js';
        if (path.endsWith('.py')) return 'py';
        if (path.endsWith('.md')) return 'md';
        if (path.endsWith('.json')) return 'json';
        if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.gif')) return 'img';
        return 'file';
    }

        function getFileSVG(path) {
                const t = getFileIcon(path);
                if (t === 'html') return `
                        <svg width="20" height="20" viewBox="0 0 100 115" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#E34C26" d="M10 100L25 10h50L90 100L50 110z"/>
                            <path fill="#EF652A" d="M50 110L75 100h13L50 15v95z"/>
                            <text x="50" y="75" font-family="Arial, sans-serif" font-size="32" font-weight="bold" text-anchor="middle" fill="#fff">5</text>
                        </svg>`;
                if (t === 'css') return `
                        <svg width="20" height="20" viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#1572B6" d="M10 100L20 10h60L90 100L50 107z"/>
                            <path fill="#33A9DC" d="M50 107L80 100h8L50 15v92z"/>
                            <text x="50" y="70" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#fff">CSS</text>
                        </svg>`;
                if (t === 'js') return `
                        <svg width="20" height="20" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
                            <rect width="128" height="128" rx="8" fill="#F7DF1E"/>
                            <path d="M48 38h12v52h-12zM76 38h12v52h-12z" fill="#000" opacity="0"/>
                            <text x="64" y="88" font-family="Arial, Helvetica, sans-serif" font-size="56" text-anchor="middle" fill="#000" font-weight="700">JS</text>
                        </svg>`;
                if (t === 'img') return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="3" fill="#EC4899"/><path d="M4 16l4-5 3 4 5-6 4 7H4z" fill="#fff"/></svg>`;
                return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="3" fill="#E5E7EB"/><path d="M8 7h6l2 2v8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7z" fill="#9CA3AF"/></svg>`;
        }

    function getFolderStructure() {
        const root = {};
        files.filter(f => !f.is_asset).forEach(f => {
            const parts = f.path.split('/');
            let current = root;
            parts.forEach((part, i) => {
                if (i === parts.length - 1) {
                    current[part] = { __file: f };
                } else {
                    current[part] = current[part] || {};
                    current = current[part];
                }
            });
        });
        return root;
    }

    function renderFiles() {
        if (!fileTree) return;
        
        const codeFiles = files.filter(f => !f.is_asset);
        const folderSet = new Set();
        codeFiles.forEach(f => {
            const parts = f.path.split('/');
            if (parts.length > 1) {
                parts.slice(0, -1).forEach(p => folderSet.add(p));
            }
        });

        const sortedFiles = [...codeFiles].sort((a, b) => {
            const aDirs = a.path.split('/').length;
            const bDirs = b.path.split('/').length;
            if (aDirs !== bDirs) return aDirs - bDirs;
            return a.path.localeCompare(b.path);
        });

        let html = '';
        let lastDepth = 0;
        
        sortedFiles.forEach(f => {
            const depth = f.path.split('/').length - 1;
            const name = f.path.split('/').pop();
            const isActive = activeFile?.path === f.path;
            
            if (depth > lastDepth) {
                for (let i = lastDepth; i < depth; i++) {
                    html += `<div class="ml-${i * 3} pl-3 py-0.5">`;
                }
            } else if (depth < lastDepth) {
                for (let i = depth; i < lastDepth; i++) {
                    html += `</div>`;
                }
            }
            
            html += `
            <div onclick="openFile('${f.path}')" 
                 class="flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded mb-1 ml-${depth * 3} ${isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200'} file-item"
                 draggable="true"
                 data-path="${f.path}">
                <span class="inline-block" style="width:20px;display:inline-flex;align-items:center;justify-content:center">${getFileSVG(f.path)}</span>
                <span class="text-sm font-medium truncate">${name}</span>
            </div>`;
            
            lastDepth = depth;
        });

        for (let i = 0; i < lastDepth; i++) {
            html += `</div>`;
        }

        fileTree.innerHTML = html;

        // Add drag and drop handlers
        document.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('drop', handleDrop);
        });
    }

    // --- DRAG AND DROP ---
    let draggedFile = null;

    function handleDragStart(e) {
        draggedFile = e.target.dataset.path;
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDrop(e) {
        e.preventDefault();
        const targetPath = e.target.closest('.file-item')?.dataset.path;
        if (!targetPath || targetPath === draggedFile) return;

        const sourceFile = files.find(f => f.path === draggedFile);
        const targetFolder = targetPath.includes('/') ? targetPath.split('/').slice(0, -1).join('/') : '';
        
        const newPath = targetFolder ? `${targetFolder}/${sourceFile.path.split('/').pop()}` : sourceFile.path.split('/').pop();
        
        if (files.find(f => f.path === newPath)) {
            alert('A file with that name already exists in this location');
            return;
        }

        sourceFile.path = newPath;
        if (activeFile?.path === draggedFile) {
            activeFile.path = newPath;
        }
        
        renderFiles();
        hasUnsavedChanges = true;
        alert(`Moved to: ${newPath}`);
    }

    // --- CREATE FILE/FOLDER ---
    window.createNewFile = () => {
        const name = prompt('Enter file name (e.g., styles.css, app.js, README.md):');
        if (!name) return;
        
        const validExtensions = ['.html', '.css', '.js', '.py', '.md', '.json', '.txt', '.svg'];
        const ext = '.' + name.split('.').pop();
        
        if (!validExtensions.includes(ext)) {
            alert('Invalid file extension. Use: ' + validExtensions.join(', '));
            return;
        }
        
        const defaultContent = {
            '.html': '<!DOCTYPE html>\n<html>\n<head>\n    <title>New Page</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    \n</body>\n</html>',
            '.css': '/* Add your styles here */\n',
            '.js': '// Add your JavaScript here\n',
            '.py': '# Python code here\n',
            '.md': '# New Document\n\nWrite your markdown here...\n',
            '.json': '{\n    \n}\n',
            '.txt': '',
            '.svg': '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">\n    \n</svg>'
        };

        files.push({
            path: name,
            content: defaultContent[ext] || '',
            is_asset: false
        });
        
        renderFiles();
        openFile(name);
        hasUnsavedChanges = true;
    };

    window.createFolder = () => {
        alert('Folders are not supported. All files are stored in the root.');
    };

    window.deleteCurrentFile = () => {
        if (!activeFile) {
            alert('No file selected');
            return;
        }
        
        if (!confirm(`Delete "${activeFile.path}"?`)) return;
        
        files = files.filter(f => f.path !== activeFile.path);
        activeFile = null;
        editor.setValue('', -1);
        renderFiles();
        hasUnsavedChanges = true;
    };

    // --- UPLOAD WITH FOLDER SUPPORT ---
    document.getElementById('upload-asset-btn').onclick = () => uploadInput.click();
    uploadInput.onchange = (e) => {
        const fileList = e.target.files;
        if (!fileList.length) return;

        let addedCount = 0;
        for (const file of fileList) {
            const reader = new FileReader();
            const isText = file.name.match(/\.(html|css|js|py|json|txt|md|svg)$/i);
            const isImage = file.type.startsWith('image/') || file.name.match(/\.(png|jpg|jpeg|gif|webp|ico)$/i);

            reader.onload = (evt) => {
                files.push({
                    path: file.name,
                    content: isText ? evt.target.result : new Uint8Array(evt.target.result),
                    is_asset: !isText || isImage
                });
                addedCount++;
                renderFiles();
                renderAssets();
                if (!isMarkdownPreview) updatePreview();

                if (addedCount === fileList.length) {
                    alert(`✅ Uploaded ${addedCount} file(s)!\n\nClick 'Save' to persist changes.`);
                }
            };
            isText ? reader.readAsText(file) : reader.readAsArrayBuffer(file);
        }
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

        if (files.length === 0) files = [{ path: 'index.html', content: '<h1>Hello World</h1>', is_asset: false }];

        renderFiles(); renderAssets();

        const start = files.find(f => f.path === 'index.html') || files[0];
        if (start) openFile(start.path);

        if (!isMarkdownPreview) updatePreview();
    })();

    // --- ASSETS RENDERING ---
    function renderAssets() {
        if (!assetGrid) return;
        const assetFiles = files.filter(f => f.is_asset);
        assetGrid.innerHTML = '';
        if (assetFiles.length === 0) {
            assetGrid.innerHTML = '<div class="text-sm text-slate-400">No assets</div>';
            return;
        }
        assetFiles.forEach(f => {
            const el = document.createElement('div');
            el.className = 'p-2 border border-gray-200 rounded text-center bg-white cursor-pointer';
            el.style.display = 'flex'; el.style.flexDirection = 'column'; el.style.alignItems = 'center';
            el.style.justifyContent = 'center'; el.style.gap = '6px';
            // show thumbnail for common image types
            const ext = f.path.split('.').pop().toLowerCase();
            if (['png','jpg','jpeg','gif','webp','svg'].includes(ext) && !(f.content instanceof Uint8Array)) {
                const img = document.createElement('img');
                img.src = typeof f.content === 'string' ? 'data:image/'+ext+';base64,'+btoa(unescape(encodeURIComponent(f.content))) : URL.createObjectURL(new Blob([f.content]));
                img.style.maxWidth = '100%'; img.style.maxHeight = '80px'; img.style.objectFit = 'contain';
                el.appendChild(img);
            } else if (f.content instanceof Uint8Array) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(new Blob([f.content]));
                img.style.maxWidth = '100%'; img.style.maxHeight = '80px'; img.style.objectFit = 'contain';
                el.appendChild(img);
            } else {
                const icon = document.createElement('div'); icon.textContent = ext.toUpperCase(); icon.style.fontWeight='700'; el.appendChild(icon);
            }
            const name = document.createElement('div'); name.textContent = f.path; name.style.fontSize='12px'; name.style.wordBreak='break-word'; el.appendChild(name);
            el.onclick = () => { openFile(f.path); };
            assetGrid.appendChild(el);
        });
    }

    // Open preview in a new tab
    const openPreviewBtn = document.getElementById('open-preview-tab');
    if (openPreviewBtn) {
        openPreviewBtn.onclick = () => {
            const w = window.open();
            try {
                w.document.open();
                w.document.write(previewFrame.srcdoc || '<p>No preview available</p>');
                w.document.close();
            } catch (e) {
                console.error('Failed to open preview in new tab', e);
                w.close();
                alert('Unable to open preview in a new tab');
            }
        };
    }
});
