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
    let currentPreviewPath = 'index.html'; // Track what's being previewed
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
    const renderFileTree = () => { /* ... (no changes here) ... */ };
    const createTreeHtml = (node) => { /* ... (no changes here) ... */ };
    const attachTreeEventListeners = () => { /* ... (no changes here) ... */ };
    const handleDeleteFile = (path) => { /* ... (no changes here) ... */ };
    newFileBtn.addEventListener('click', () => { /* ... (no changes here) ... */ });
    newFolderBtn.addEventListener('click', () => { /* ... (no changes here) ... */ });
    uploadBtn.addEventListener('click', () => uploadInput.click());

    /**
     * **FIXED FUNCTION**
     * Handles file uploads, correcting the 'isText' ReferenceError.
     */
    uploadInput.addEventListener('change', (e) => {
        for (const file of e.target.files) {
            // **THE FIX**: Define `isText` here, in the correct scope.
            const isText = textFileExtensions.includes(file.name.split('.').pop());
            const reader = new FileReader();

            reader.onload = (event) => {
                // Now, `event.target.result` will be either a string or an ArrayBuffer,
                // depending on which `readAs...` method was called below.
                files.push({ 
                    path: file.name, 
                    content: isText ? event.target.result : new Uint8Array(event.target.result) 
                });
                renderFileTree();
                debouncedUpdatePreview();
            };

            // Call the appropriate reader method based on the `isText` check.
            if (isText) {
                reader.readAsText(file);
            } else {
                reader.readAsArrayBuffer(file);
            }
        }
        e.target.value = ''; // Clear the input for the next upload.
    });

    // --- PREVIEW & CONSOLE LOGIC ---
    const consoleHijackScript = `<!-- ... (no changes here) ... -->`;
    function updatePreview(entrypointPath) { /* ... (no changes here) ... */ }
    window.addEventListener('message', (event) => { /* ... (no changes here) ... */ });
    clearConsoleBtn.addEventListener('click', () => { /* ... (no changes here) ... */ });
    tabButtons.forEach(button => { /* ... (no changes here) ... */ });

    // --- SHARING LOGIC ---
    shareBtn.addEventListener('click', async () => { /* ... (no changes here) ... */ });
    copyLinkBtn.addEventListener('click', () => { /* ... (no changes here) ... */ });
    modalCloseBtn.addEventListener('click', () => { /* ... (no changes here) ... */ });

    // --- INITIALIZATION ---
    files.push(/* ... (no changes here) ... */);
    setActiveFile('index.html');
    updatePreview('index.html');
});


// To keep the code clean, the unchanged functions are collapsed. Here is the full, copy-paste ready code:
document.addEventListener('DOMContentLoaded', () => {
    const editor=ace.edit("editor");editor.setTheme("ace/theme/tomorrow_night");editor.session.setMode("ace/mode/html");editor.setFontSize(14);editor.setOptions({fontFamily:"Roboto Mono",enableBasicAutocompletion:!0,enableLiveAutocompletion:!0});const fileTreeContainer=document.getElementById("file-tree"),newFileBtn=document.getElementById("new-file-btn"),newFolderBtn=document.getElementById("new-folder-btn"),uploadBtn=document.getElementById("upload-file-btn"),uploadInput=document.getElementById("upload-input"),shareBtn=document.getElementById("share-btn"),previewFrame=document.getElementById("preview-frame"),editorEl=document.getElementById("editor"),editorPlaceholder=document.getElementById("editor-placeholder"),shareModal=document.getElementById("share-modal"),shareLinkInput=document.getElementById("share-link-input"),copyLinkBtn=document.getElementById("copy-link-btn"),modalCloseBtn=document.getElementById("modal-close-btn"),consoleOutput=document.getElementById("console-output"),clearConsoleBtn=document.getElementById("clear-console-btn"),tabButtons=document.querySelectorAll(".pc-tab-btn"),tabPanels=document.querySelectorAll(".pc-panel");let files=[],activeFilePath=null,currentPreviewPath="index.html";const textFileExtensions=["html","css","js","json","md","txt","svg","xml"];function debounce(e,t){let n;return(...o)=>{clearTimeout(n),n=setTimeout(()=>e.apply(this,o),t)}}const mimetypes={guess:e=>{const t=e.split(".").pop();return{css:"text/css",js:"application/javascript",jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",gif:"image/gif",svg:"image/svg+xml"}[t]||"application/octet-stream"}},debouncedUpdatePreview=debounce(()=>updatePreview(currentPreviewPath),300);const getFileByPath=e=>files.find(t=>t.path===e),getModeForFilename=e=>{const t=e.split(".").pop();return`ace/mode/${{html:"html",css:"css",js:"javascript",json:"json",md:"markdown",xml:"xml",svg:"svg"}[t]||"text"}`},setActiveFile=e=>{if(activeFilePath===e)return;if(activeFilePath){const t=getFileByPath(activeFilePath);t&&"string"==typeof t.content&&(t.content=editor.getValue())}const t=getFileByPath(e);activeFilePath=e,t?(editorPlaceholder.style.display="none",editorEl.style.display="block","string"==typeof t.content?(editor.setValue(t.content,-1),editor.session.setMode(getModeForFilename(t.path)),editor.setReadOnly(!1)):(editor.setValue(`Binary file: ${t.path}\nCannot be edited.`,-1),editor.setReadOnly(!0))):(editorEl.style.display="none",editorPlaceholder.style.display="flex"),e&&e.endsWith(".html")&&updatePreview(e),renderFileTree()};editor.session.on("change",()=>{const e=getFileByPath(activeFilePath);e&&"string"==typeof e.content&&(e.content=editor.getValue(),debouncedUpdatePreview())});const renderFileTree=()=>{const e={};[...files].sort((e,t)=>e.path.localeCompare(t.path)).forEach(t=>{let n=e;t.path.split("/").forEach((e,o)=>{n[e]||(n[e]=o===t.path.split("/").length-1?{_isFile:!0,path:t.path}:{}),n=n[e]})}),fileTreeContainer.innerHTML=createTreeHtml(e),attachTreeEventListeners()},createTreeHtml=e=>{let t="<ul>";for(const n of Object.keys(e)){const o=e[n],a=o._isFile,l=a?"fa-file-alt":"fa-folder",s=o.path||"",c=s&&s===activeFilePath?"active":"";t+=`<li><div class="tree-item ${c}" data-path="${s}" data-is-file="${!!a}"><span class="tree-item-name"><i class="fas ${l}"></i> <span>${n}</span></span>${a?`<button class="delete-btn" title="Delete file" data-path="${s}"><i class="fas fa-trash-alt"></i></button>`:""}</div>`,a||(t+=createTreeHtml(o)),t+="</li>"}return t+"</ul>"},attachTreeEventListeners=()=>{document.querySelectorAll('.tree-item[data-is-file="true"]').forEach(e=>{e.querySelector(".tree-item-name").addEventListener("click",()=>setActiveFile(e.dataset.path))}),document.querySelectorAll(".delete-btn").forEach(e=>{e.addEventListener("click",t=>{t.stopPropagation(),handleDeleteFile(e.dataset.path)})})},handleDeleteFile=e=>{confirm(`Are you sure you want to delete ${e}?`)&&(files=files.filter(t=>t.path!==e),activeFilePath===e&&setActiveFile(null),updatePreview(currentPreviewPath===e?"index.html":currentPreviewPath),renderFileTree())};newFileBtn.addEventListener("click",()=>{const e=prompt("Enter new file path (e.g., 'about.html' or 'js/app.js'):");e&&!getFileByPath(e)?(files.push({path:e,content:""}),setActiveFile(e)):e&&alert("A file with that name already exists.")}),newFolderBtn.addEventListener("click",()=>alert("To create a folder, create a new file with a path, e.g., 'images/new.svg'")),uploadBtn.addEventListener("click",()=>uploadInput.click()),uploadInput.addEventListener("change",e=>{for(const t of e.target.files){const n=textFileExtensions.includes(t.name.split(".").pop()),o=new FileReader;o.onload=e=>{files.push({path:t.name,content:n?e.target.result:new Uint8Array(e.target.result)}),renderFileTree(),debouncedUpdatePreview()},n?o.readAsText(t):o.readAsArrayBuffer(t)}e.target.value=""});const consoleHijackScript=`\n        <script>\n            const _console = {};\n            ['log', 'warn', 'error', 'info'].forEach(level => {\n                const original = console[level];\n                _console[level] = original;\n                console[level] = (...args) => {\n                    try {\n                        const message = args.map(arg => {\n                            if (arg instanceof Error) return arg.stack;\n                            if (typeof arg === 'object' && arg !== null) return JSON.stringify(arg, null, 2);\n                            return String(arg);\n                        }).join(' ');\n                        window.parent.postMessage({ source: 'catocode-console', level, message }, '*');\n                    } catch (e) {\n                         window.parent.postMessage({ source: 'catocode-console', level: 'error', message: 'Error logging to console.' }, '*');\n                    }\n                    original.apply(console, args);\n                };\n            });\n            window.addEventListener('error', e => {\n                console.error(e.message, 'at', e.filename + ':' + e.lineno);\n            });\n        <\/script>\n    `;function updatePreview(e){if(currentPreviewPath=e,!getFileByPath(e)||!e.endsWith(".html"))return void(previewFrame.srcdoc=`<div style="font-family: sans-serif; padding: 2rem;"><h2>Preview Error</h2><p>Could not find <strong>${e||"an entry file"}</strong>. Please create an HTML file.</p></div>`);let t=getFileByPath(e).content.replace("<head>",`<head>${consoleHijackScript}`);const n=new Map;for(const o of files){const a=new Blob([o.content],{type:mimetypes.guess(o.path)});n.set(o.path,URL.createObjectURL(a))}n.forEach((e,n)=>{const o=new RegExp(`(src|href)=["'](./)?${n}["']`,"gi");t=t.replace(o,`$1="${e}"`)}),previewFrame.onload=()=>{const e=previewFrame.contentDocument||previewFrame.contentWindow.document;e.body.addEventListener("click",e=>{const t=e.target.closest("a");if(t&&t.href){e.preventDefault();const n=new URL(t.href),o=n.pathname.startsWith("/")?n.pathname.substring(1):n.pathname;getFileByPath(o)&&(updatePreview(o),setActiveFile(o))}}),n.forEach(e=>URL.revokeObjectURL(e))},previewFrame.srcdoc=t}window.addEventListener("message",e=>{if("catocode-console"===e.data.source){const{level:t,message:n}=e.data,o=document.createElement("div");o.className=`log-msg log-${t}`,o.textContent=n,consoleOutput.appendChild(o),consoleOutput.scrollTop=consoleOutput.scrollHeight}}),clearConsoleBtn.addEventListener("click",()=>{consoleOutput.innerHTML=""}),tabButtons.forEach(e=>{e.addEventListener("click",()=>{tabButtons.forEach(e=>e.classList.remove("active")),tabPanels.forEach(e=>e.classList.remove("active")),e.classList.add("active"),document.getElementById(e.dataset.target).classList.add("active")})}),shareBtn.addEventListener("click",async()=>{activeFilePath&&(getFileByPath(activeFilePath).content=editor.getValue());const e=await Promise.all(files.map(async e=>{let t;return t="string"==typeof e.content?btoa(unescape(encodeURIComponent(e.content))):btoa(String.fromCharCode.apply(null,e.content)),{path:e.path,content_b64:t}})),t=await fetch("/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({files:e})}),n=await t.json();n.share_link&&(shareLinkInput.value=n.share_link,shareModal.style.display="flex")}),copyLinkBtn.addEventListener("click",()=>{shareLinkInput.select(),document.execCommand("copy"),copyLinkBtn.innerHTML='<i class="fas fa-check"></i>',setTimeout(()=>{copyLinkBtn.innerHTML='<i class="fas fa-copy"></i>'},2e3)}),modalCloseBtn.addEventListener("click",()=>{shareModal.style.display="none"}),files.push({path:"index.html",content:'<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>My Awesome Site</title>\n    <link rel="stylesheet" href="style.css">\n    <script src="app.js" defer><\/script>\n</head>\n<body>\n    <h1>Hello from CatoCode!</h1>\n    <p>The file browser and uploads are working again!</p>\n    <p>Click this link to navigate: <a href="about.html">About Us</a>.</p>\n</body>\n</html>'},{path:"about.html",content:"<h1>About Page</h1><p>This is the about page. It has its own content.</p><p><a href=\"index.html\">Go back home</a></p>"},{path:"style.css",content:"body { \n    font-family: sans-serif; \n    background-color: #f0f0f0; \n    padding: 2rem;\n    line-height: 1.6;\n}\na { color: #007acc; }"},{path:"app.js",content:'console.log("Hello from app.js!");\nconsole.warn("This is a warning.");\n\n// This will throw an error, which will also be caught and logged.\n// foo.bar(); \n'}),setActiveFile("index.html"),updatePreview("index.html")});
