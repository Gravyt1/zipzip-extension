const compressBtn = document.getElementById("compressBtn");
const decompressBtn = document.getElementById("decompressBtn");
const infoBtn = document.getElementById("infoBtn");
const mainBtn = document.querySelector(".mainBtn");
const attachmentArea = document.querySelector(".attachmentArea");
const infoSection = document.querySelector(".infoSection");
const fileInput = document.querySelector(".fileInput");
const selectMode = document.querySelector(".selectMode")
const dirToggle = document.getElementById("dirToggle");
const selectedFilesArea = document.querySelector(".selectedFilesArea");
const messageArea = document.getElementById("messageArea");
const messageText = document.getElementById("messageText");
const messageIcon = document.getElementById("messageIcon");
const infoTab = document.querySelector(".infoTab")

window.currentMode = 'compress';

function showMessage(text, type = 'success') {
    if (!messageArea || !messageText || !messageIcon) return;
    messageText.textContent = text;
    messageArea.classList.remove('unactive', 'error', 'success', 'warning');
    messageArea.classList.add(type);
    
    switch(type) {
        case 'success':
            messageIcon.textContent = 'check_circle';
            break;
        case 'error':
            messageIcon.textContent = 'error';
            break;
        case 'warning':
            messageIcon.textContent = 'warning';
            break;
    }
    
    setTimeout(() => {
        messageArea.classList.add('unactive');
    }, 5000);
}

function configureFileInput(mode) {
    if (mode === 'decompress') {
        fileInput.removeAttribute('multiple');
        fileInput.removeAttribute('webkitdirectory');
        fileInput.setAttribute('accept', '.zip');
        if (dirToggle) dirToggle.checked = false;
        selectMode.classList.add('unactive');
    }
    else if (mode === 'info'){
        selectMode.classList.add("unactive")
    } 
    else {
        fileInput.setAttribute('multiple', '');
        fileInput.removeAttribute('accept');
        selectMode.classList.remove('unactive');
        if (dirToggle && dirToggle.checked) {
            fileInput.setAttribute('webkitdirectory', '');
        } else {
            fileInput.removeAttribute('webkitdirectory');
        }
    }
}

function resetUI(){
    compressBtn.classList.remove("btn-active");
    decompressBtn.classList.remove("btn-active");
    infoBtn.classList.remove("btn-active");
    mainBtn.classList.remove("unactive");
    infoSection.classList.remove("unactive");
    attachmentArea.classList.remove("unactive");
    selectedFilesArea.classList.add("unactive");
    selectMode.classList.add("unactive");
    messageArea.classList.add("unactive");
    infoTab.classList.add("unactive");
}

function updateUI(mode) {
    resetUI()
    window.currentMode = mode;
    configureFileInput(mode);
    if (mode == "compress") {
        compressBtn.classList.add("btn-active");
        mainBtn.textContent = "Compress";
    }
    else if (mode == "decompress") {
        decompressBtn.classList.add("btn-active");
        mainBtn.textContent = "Decompress";
    }
    else {
        infoBtn.classList.add("btn-active");
        mainBtn.classList.add("unactive");
        infoSection.classList.add("unactive");
        infoTab.classList.remove("unactive");
        attachmentArea.classList.add("unactive");
    }
}

compressBtn.addEventListener("click", () => {
    updateUI("compress");
});

decompressBtn.addEventListener("click", () => {
    updateUI("decompress");
});

infoBtn.addEventListener("click", () => {
    updateUI("info");
});

function handleFiles(files) {
    if (files.length === 0) return;
    
    selectedFilesArea.classList.remove("unactive");

    const selectedFilesDiv = document.querySelector(".selectedFiles");
    selectedFilesDiv.innerHTML = "";
    
    Array.from(files).forEach(file => {
        const fileItem = document.createElement("p");
        const displayName = file.webkitRelativePath && file.webkitRelativePath.length ? file.webkitRelativePath : file.name;
        fileItem.textContent = `${displayName} (${(file.size / 1024).toFixed(2)} KB)`;
        fileItem.style.margin = "2px 0";
        selectedFilesDiv.appendChild(fileItem);
    });
    
    window.selectedFiles = Array.from(files);
}

attachmentArea.addEventListener("click", () => {
    fileInput.click();
})

if (dirToggle) {
    dirToggle.addEventListener('change', () => {
        if (window.currentMode === 'decompress' && dirToggle.checked) {
            dirToggle.checked = false;
            showMessage('Folder mode is not available in decompress mode', 'warning');
            return;
        }
        if (dirToggle.checked) {
            fileInput.setAttribute('webkitdirectory', '');
        } else {
            fileInput.removeAttribute('webkitdirectory');
        }
        const title = document.querySelector('.attachmentTitle');
        if (title) title.textContent = dirToggle.checked ? 'Drop folder or click to select (folder)' : 'Drop files or click to select (files)';
    });
}

fileInput.addEventListener("change", (change) => {
    const files = change.target.files;
    if (window.currentMode === 'decompress') {
        if (files.length !== 1) {
            showMessage('Please select exactly one .zip file for decompression', 'error');
            change.target.value = '';
            return;
        }
        if (!files[0].name.toLowerCase().endsWith('.zip')) {
            showMessage('Selected file must be a .zip archive', 'error');
            change.target.value = '';
            return;
        }
    }
    handleFiles(files);
});

attachmentArea.addEventListener("dragover", (dragover) => {
    dragover.preventDefault();
    dragover.stopPropagation();
});

attachmentArea.addEventListener("dragenter", (dragcenter) => {
    dragcenter.preventDefault();
    attachmentArea.style.borderColor = "var(--border-accent)";
});

attachmentArea.addEventListener("dragleave", (dragleave) => {
    dragleave.preventDefault();
    attachmentArea.style.borderColor = "var(--border-muted)";
});

attachmentArea.addEventListener("drop", (drop) => {
    drop.preventDefault();
    drop.stopPropagation();
    const files = drop.dataTransfer.files;
    if (window.currentMode === 'decompress') {
        if (files.length !== 1) {
            showMessage('Drop exactly one .zip file for decompression', 'error');
            return;
        }
        if (!files[0].name.toLowerCase().endsWith('.zip')) {
            showMessage('Dropped file must be a valid .zip archive', 'error');
            return;
        }
    }
    handleFiles(files);
});

async function compressFiles(files) {
    const zip = new JSZip();

    for (let file of files) {
        const path = file.webkitRelativePath && file.webkitRelativePath.length ? file.webkitRelativePath : file.name;
        zip.file(path, file);
    }

    const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 9 }
    });


    const first = files[0];
    const base = first && first.webkitRelativePath ? first.webkitRelativePath.split('/')[0] : 'archive';
    const filename = `${base || 'archive'}-${Date.now()}.zip`;

    downloadFile(zipBlob, filename);
}

async function decompressFiles(zipFile) {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(zipFile);
    const dirHandle = await window.showDirectoryPicker();
    function sanitizeName(name) {
        if (!name) return 'unnamed';
        const forbidden = /[<>:\"\/\\|?*\u0000-\u001F]/g;
        let s = name.replace(forbidden, '_').trim();
        s = s.replace(/[. ]+$/g, '');
        const reserved = ['CON','PRN','AUX','NUL','COM1','COM2','COM3','COM4','COM5','COM6','COM7','COM8','COM9','LPT1','LPT2','LPT3','LPT4','LPT5','LPT6','LPT7','LPT8','LPT9'];
        if (reserved.includes(s.toUpperCase())) s = s + '_file';
        if (s.length === 0) s = 'unnamed';
        return s;
    }

    for (const [relativePath, file] of Object.entries(zipContent.files)) {
        if (!file.dir) {
            try {
                const blob = await file.async("blob");

                const pathParts = relativePath.split('/').filter(p => p && p.length);
                let currentHandle = dirHandle;

                for (let i = 0; i < pathParts.length - 1; i++) {
                    const safeDir = sanitizeName(pathParts[i]);
                    currentHandle = await currentHandle.getDirectoryHandle(safeDir, { create: true });
                }

                const filename = sanitizeName(pathParts[pathParts.length - 1] || 'file');
                const fileHandle = await currentHandle.getFileHandle(filename, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
            } catch (e) {
                console.warn('Skipping file due to write error:', relativePath, e);
                showMessage(`Some files could not be written: ${relativePath}`, 'warning');
            }
        }
    }
}

function downloadFile(blob, filename) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(link.href);
}

mainBtn.addEventListener("click", async () => {
    if (!window.selectedFiles || window.selectedFiles.length === 0) {
        showMessage("Please select files before proceeding", "error");
        return;
    }
    
    const mode = compressBtn.classList.contains("btn-active") ? "compress" : "decompress";
    
    try {
        if (mode === "compress") {
            await compressFiles(window.selectedFiles);
            showMessage("Files compressed successfully!", "success");
        } else {
            if (!window.selectedFiles || window.selectedFiles.length !== 1) {
                showMessage("Please select exactly one .zip file to decompress", "error");
                return;
            }
            if (window.selectedFiles[0].name.toLowerCase().endsWith('.zip')) {
                await decompressFiles(window.selectedFiles[0]);
                showMessage("Files extracted successfully!", "success");
            } else {
                showMessage("Selected file must be a valid .zip archive", "error");
            }
        }
    } catch (error) {
        console.error('Error:', error);
        let errorMsg = 'Operation failed';
        if (error.message.includes('permission') || error.message.includes('Permission')) {
            errorMsg = 'Permission denied. Check your folder access.';
        } else if (error.message.includes('directory') || error.message.includes('path')) {
            errorMsg = 'Invalid file path or directory structure.';
        } else if (error.message.includes('cancel') || error.message.includes('Cancel')) {
            errorMsg = 'Operation cancelled by user.';
        } else if (error.message) {
            errorMsg = error.message;
        }
        showMessage(`Error: ${errorMsg}`, "error");
    }
});

