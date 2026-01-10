document.addEventListener('DOMContentLoaded', () => {
    // --- ACE EDITOR SETUP ---
    const editor = ace.edit("editor");
    editor.setTheme("ace/theme/tomorrow_night");
    editor.session.setMode("ace/mode/html");
    editor.setFontSize(14);
    editor.setOptions({
        fontFamily: "Roboto Mono",
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
    });

    // --- DOM ELEMENTS ---
    const fileTreeContainer = document.getElementById('file-tree');
    const newFileBtn = document.getElementById('new-file-btn');
    const newFolderBtn = document.getElementById('new-folder-btn');
    const uploadBtn = document.getElementById('upload-file-btn');
    const uploadInput = document.getElementById('upload-input');
    const shareBtn = document.getElementById('share-btn');
    const previewFrame = document.getElementById('preview-frame');
    const editorEl = document.getElementById('editor');
    const editorPlaceholder = document.getElementById('editor-placeholder');
    // Share Modal
    const shareModal = document.getElementById('share-modal'),
          shareLinkInput = document.getElementById('share-link-input'),
          copyLinkBtn = document.getElementById('copy-link-btn'),
          modalCloseBtn = document.getElementById('modal-close-btn');
    // Console
    const consoleOutput = document.getElementById('console-output');
    const clearConsoleBtn = document.getElementById('clear-console-btn');
    const tabButtons = document.querySelectorAll('.pc-tab-btn');
    const tabPanels = document.querySelectorAll('.pc-panel');

    // --- STATE MANAGEMENT ---
    let files = []; // { path: string, content: string | Uint8Array }
    let activeFilePath = null;
    let currentPreviewPath = 'index.html';
    const textFileExtensions = ['html', 'css', 'js', 'json', 'md', 'txt', 'svg', 'xml'];

    // --- UTILITIES ---
    function debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }
    const mimetypes = {
        guess: (path) => {
            const ext = path.split('.').pop();
            const types = { css: 'text/css', js: 'application/javascript', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', svg: 'image/svg+xml' };
            return types[ext] || 'application/octet-stream';
        }
    };
    
    const debouncedUpdatePreview = debounce(() => updatePreview(currentPreviewPath), 300);

    // --- CORE FUNCTIONS ---
    const getFileByPath = path => files.find(f => f.path === path);
    const getModeForFilename = filename => {
        const ext = filename.split('.').pop();
        const modes = { html: 'html', css: 'css', js: 'javascript', json: 'json', md: 'markdown', xml: 'xml', svg: 'svg' };
        return `ace/mode/${modes[ext] || 'text'}`;
    };

    const setActiveFile = (path) => {
        if (activeFilePath === path) return;
        if (activeFilePath) {
            const oldFile = getFileByPath(activeFilePath);
            if (oldFile && typeof oldFile.content === 'string') {
                oldFile.content = editor.getValue();
            }
        }
        const fileToLoad = getFileByPath(path);
        activeFilePath = path;
        if (!fileToLoad) {
            editorEl.style.display = 'none';
            editorPlaceholder.style.display = 'flex';
        } else {
            editorPlaceholder.style.display = 'none';
            editorEl.style.display = 'block';
            if (typeof fileToLoad.content === 'string') {
                editor.setValue(fileToLoad.content, -1);
                editor.session.setMode(getModeForFilename(fileToLoad.path));
                editor.setReadOnly(false);
            } else {
                editor.setValue(`Binary file: ${fileToLoad.path}\nCannot be edited.`, -1);
                editor.setReadOnly(true);
            }
        }
        if (path && path.endsWith('.html')) {
            updatePreview(path);
        }
        renderFileTree();
    };

    editor.session.on('change', () => {
        const activeFile = getFileByPath(activeFilePath);
        if (activeFile && typeof activeFile.content === 'string') {
            activeFile.content = editor.getValue();
            debouncedUpdatePreview();
        }
    });

    // --- FILE TREE & ACTIONS ---
    const renderFileTree = () => {
        const tree = {};
        [...files].sort((a, b) => a.path.localeCompare(b.path)).forEach(file => {
            let currentLevel = tree;
            const pathComponents = file.path.split('/');
            pathComponents.forEach((part, index) => {
                if (!currentLevel[part]) {
                    const isFile = index === pathComponents.length - 1;
                    currentLevel[part] = isFile ? { _isFile: true, path: file.path } : {};
                }
                currentLevel = currentLevel[part];
            });
        });
        fileTreeContainer.innerHTML = createTreeHtml(tree);
        attachTreeEventListeners();
    };

    const createTreeHtml = (node) => {
        let html = '<ul>';
        for (const key of Object.keys(node)) {
            const childNode = node[key];
            const isFile = childNode._isFile;
            const icon = isFile ? 'fa-file-alt' : 'fa-folder';
            const path = childNode.path || '';
            const activeClass = (path && path === activeFilePath) ? 'active' : '';
            html += `<li><div class="tree-item ${activeClass}" data-path="${path}" data-is-file="${!!isFile}"><span class="tree-item-name"><i class="fas ${icon}"></i> <span>${key}</span></span>${isFile ? `<button class="delete-btn" title="Delete file" data-path="${path}"><i class="fas fa-trash-alt"></i></button>` : ''}</div>`;
            if (!isFile) html += createTreeHtml(childNode);
            html += '</li>';
        }
        return html + '</ul>';
    };

    const attachTreeEventListeners = () => {
        document.querySelectorAll('.tree-item[data-is-file="true"]').forEach(el => {
            el.querySelector('.tree-item-name').addEventListener('click', () => setActiveFile(el.dataset.path));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleDeleteFile(btn.dataset.path);
            });
        });
    };

    const handleDeleteFile = (path) => {
        if (confirm(`Are you sure you want to delete ${path}?`)) {
            files = files.filter(f => f.path !== path);
            if (activeFilePath === path) setActiveFile(null);
            updatePreview(currentPreviewPath === path ? 'index.html' : currentPreviewPath);
            renderFileTree();
        }
    };

    newFileBtn.addEventListener('click', () => {
        const path = prompt("Enter new file path (e.g., 'about.html' or 'js/app.js'):");
        if (path && !getFileByPath(path)) {
            files.push({ path, content: '' });
            setActiveFile(path);
        } else if (path) {
            alert('A file with that name already exists.');
        }
    });

    newFolderBtn.addEventListener('click', () => {
        alert("To create a folder, create a new file with a path, e.g., 'images/new.svg'");
    });

    uploadBtn.addEventListener('click', () => uploadInput.click());

    uploadInput.addEventListener('change', (e) => {
        const filesToUpload = e.target.files;
        if (!filesToUpload || filesToUpload.length === 0) {
            return;
        }

        uploadBtn.disabled = true;
        uploadBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Uploading...`;

        let filesProcessed = 0;
        const totalFiles = filesToUpload.length;

        const onFileProcessed = () => {
            filesProcessed++;
            if (filesProcessed === totalFiles) {
                renderFileTree();
                debouncedUpdatePreview();
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = `<i class="fas fa-upload"></i> Upload`;
            }
        };

        for (const file of filesToUpload) {
            const isText = textFileExtensions.includes(file.name.split('.').pop());
            const reader = new FileReader();

            reader.onload = (event) => {
                files.push({
                    path: file.name,
                    content: isText ? event.target.result : new Uint8Array(event.target.result)
                });
                onFileProcessed();
            };

            reader.onerror = () => {
                console.error(`Error reading file: ${file.name}`);
                alert(`Could not read the file: ${file.name}`);
                onFileProcessed();
            };

            if (isText) {
                reader.readAsText(file);
            } else {
                reader.readAsArrayBuffer(file);
            }
        }
        uploadInput.value = null;
    });

    // --- PREVIEW & CONSOLE LOGIC ---
    const consoleHijackScript = `<script>const _console={};['log','warn','error','info'].forEach(level=>{const original=console[level];_console[level]=original;console[level]=(...args)=>{try{const message=args.map(arg=>{if(arg instanceof Error)return arg.stack;if(typeof arg==='object'&&arg!==null)return JSON.stringify(arg,null,2);return String(arg)}).join(' ');window.parent.postMessage({source:'catocode-console',level,message},'*')}catch(e){window.parent.postMessage({source:'catocode-console',level:'error',message:'Error logging to console.'},'*')}original.apply(console,args)}});window.addEventListener('error',e=>{console.error(e.message,'at',e.filename+':'+e.lineno)})<\/script>`;

    function updatePreview(entrypointPath) {
        currentPreviewPath = entrypointPath;
        const entryFile = getFileByPath(entrypointPath);
        if (!entryFile || !entrypointPath.endsWith('.html')) {
            previewFrame.srcdoc = `<div style="font-family: sans-serif; padding: 2rem;"><h2>Preview Error</h2><p>Could not find <strong>${entrypointPath || 'an entry file'}</strong>. Please create an HTML file.</p></div>`;
            return;
        }
        let htmlContent = entryFile.content.replace('<head>', `<head>${consoleHijackScript}`);
        const blobUrls = new Map();
        for (const file of files) {
            const blob = new Blob([file.content], { type: mimetypes.guess(file.path) });
            blobUrls.set(file.path, URL.createObjectURL(blob));
        }
        blobUrls.forEach((blobUrl, path) => {
            const pathRegex = new RegExp(`(src|href)=["'](./)?${path}["']`, 'gi');
            htmlContent = htmlContent.replace(pathRegex, `$1="${blobUrl}"`);
        });
        previewFrame.onload = () => {
            const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
            iframeDoc.body.addEventListener('click', (e) => {
                const link = e.target.closest('a');
                if (link && link.href) {
                    e.preventDefault();
                    const targetUrl = new URL(link.href);
                    const targetPath = targetUrl.pathname.startsWith('/') ? targetUrl.pathname.substring(1) : targetUrl.pathname;
                    if (getFileByPath(targetPath)) {
                        updatePreview(targetPath);
                        setActiveFile(targetPath);
                    }
                }
            });
            blobUrls.forEach(url => URL.revokeObjectURL(url));
        };
        previewFrame.srcdoc = htmlContent;
    }

    window.addEventListener('message', (event) => {
        if (event.data.source === 'catocode-console') {
            const { level, message } = event.data;
            const msgEl = document.createElement('div');
            msgEl.className = `log-msg log-${level}`;
            msgEl.textContent = message;
            consoleOutput.appendChild(msgEl);
            consoleOutput.scrollTop = consoleOutput.scrollHeight;
        }
    });

    clearConsoleBtn.addEventListener('click', () => { consoleOutput.innerHTML = ''; });

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(button.dataset.target).classList.add('active');
        });
    });

    // --- SHARING LOGIC (FIXED) ---
    /**
     * A robust, chunk-based converter for turning a Uint8Array into a Base64 string.
     * This avoids "Maximum call stack size exceeded" errors on large files.
     */
    function uint8ArrayToBase64(bytes) {
        const CHUNK_SIZE = 0x8000; // 32k chunks
        let binary = '';
        for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
            const chunk = bytes.subarray(i, i + CHUNK_SIZE);
            binary += String.fromCharCode.apply(null, chunk);
        }
        return btoa(binary);
    }

    shareBtn.addEventListener('click', async () => {
        if (activeFilePath) {
            const activeFile = getFileByPath(activeFilePath);
            if(activeFile && typeof activeFile.content === 'string') {
                activeFile.content = editor.getValue();
            }
        }
        
        const payload = files.map(file => {
            let content_b64;
            if (typeof file.content === 'string') {
                const utf8Bytes = new TextEncoder().encode(file.content);
                content_b64 = uint8ArrayToBase64(utf8Bytes);
            } else { // Is Uint8Array
                content_b64 = uint8ArrayToBase64(file.content);
            }
            return { path: file.path, content_b64 };
        });

        try {
            const response = await fetch('/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: payload })
            });

            if (!response.ok) {
                // This will catch the 500 error and provide a better message
                throw new Error(`Server responded with an error: ${response.status}`);
            }

            const data = await response.json();
            if (data.share_link) {
                shareLinkInput.value = data.share_link;
                shareModal.style.display = 'flex';
            }
        } catch (error) {
            console.error("Could not share project:", error);
            alert("Sharing failed. The server might be down or there was an error processing your files. Check the developer console for more info.");
        }
    });

    copyLinkBtn.addEventListener('click', () => {
        shareLinkInput.select();
        document.execCommand('copy');
        copyLinkBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => { copyLinkBtn.innerHTML = '<i class="fas fa-copy"></i>'; }, 2000);
    });

    modalCloseBtn.addEventListener('click', () => {
        shareModal.style.display = 'none';
    });

    // --- INITIALIZATION ---
    files.push(
        { path: 'index.html', content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>My Awesome Site</title>\n    <link rel="stylesheet" href="style.css">\n    <script src="app.js" defer><\/script>\n</head>\n<body>\n    <h1>Hello from CatoCode!</h1>\n    <p>All bugs are fixed! You can upload files without issue.</p>\n    <p>Click this link to navigate: <a href="about.html">About Us</a>.</p>\n</body>\n</html>` },
        { path: 'about.html', content: '<h1>About Page</h1><p>This is the about page. It has its own content.</p><p><a href="index.html">Go back home</a></p>' },
        { path: 'style.css', content: `body { \n    font-family: sans-serif; \n    background-color: #f0f0f0; \n    padding: 2rem;\n    line-height: 1.6;\n}\na { color: #007acc; }` },
        { path: 'app.js', content: `console.log("Hello from app.js!");\nconsole.warn("This is a warning.");\n\n// Try uploading an image and referencing it!\n// For example: <img src="my-image.png">\n` }
    );

    setActiveFile('index.html');
    updatePreview('index.html');
});