document.addEventListener('DOMContentLoaded', () => {
    const fontChoices = new Map([
        ['pixel', '"Press Start 2P", "Courier New", monospace'],
        ['system', 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'],
        ['arial', 'Arial, Helvetica, sans-serif'],
        ['georgia', 'Georgia, "Times New Roman", serif'],
        ['trebuchet', '"Trebuchet MS", Arial, sans-serif'],
        ['clash', '"Lilita One", sans-serif']
    ]);

    try {
        const savedFont = localStorage.getItem('gabztrt-site-font');
        const fontFamily = fontChoices.get(savedFont);
        if (fontFamily) {
            document.documentElement.dataset.siteFont = savedFont;
            document.documentElement.style.setProperty('--site-font-family', fontFamily);
        }
    } catch (error) {
        console.error('The saved font preference could not be read.', error);
    }

    const body = document.body;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const folderList = document.querySelector('#folder-list');
    const addFolderButton = document.querySelector('.add-folder-button');
    const folderSettingsError = document.querySelector('.folder-settings-error');
    const dialog = document.querySelector('.photo-dialog');
    const dialogTitle = document.querySelector('#dialog-title');
    const dialogAddFiles = document.querySelector('.dialog-add-files');
    const fileInput = document.querySelector('#folder-file-input');
    const photoGrid = document.querySelector('.photo-grid');
    const photoViewer = document.querySelector('.photo-viewer');
    const viewerImage = document.querySelector('.viewer-image');
    const viewerCaption = document.querySelector('.viewer-caption');
    const uploadStatus = document.querySelector('.upload-status');
    const zoomOutButton = document.querySelector('.zoom-out');
    const zoomResetButton = document.querySelector('.zoom-reset');
    const zoomInButton = document.querySelector('.zoom-in');
    const renameDialog = document.querySelector('#rename-dialog');
    const renameForm = document.querySelector('#rename-form');
    const renameError = document.querySelector('.rename-error');
    const folderNameInput = document.querySelector('#folder-name-input');
    const deleteDialog = document.querySelector('#delete-dialog');
    const deleteForm = document.querySelector('#delete-form');
    const deleteError = document.querySelector('.delete-error');
    const photos = [
        '1000009124.jpg',
        '1000009139.jpg',
        '1000009153.jpg',
        '1000009443.jpg',
        '1000009447.jpg',
        '1000010115.jpg',
        '1000010233.jpg',
        '1000010242.jpg'
    ];
    const databaseName = 'bunny-vault';
    const favoriteFolderId = 'favorites';
    const legacyFolderNameKey = 'bunny-vault-folder-name';
    const legacyFolderDeletedKey = 'bunny-vault-folder-deleted';
    const folderAnimations = new WeakMap();
    const photoObjectUrls = new Set();
    let databasePromise;
    let projectRootHandle;
    let folders = [];
    let activeFolder;
    let activeActionFolder;
    let uploadDirectory;
    let startTime;
    let animationFrame;
    let zoom = 1;
    let pointerFolder;
    let focusFolder;

    const setUploadStatus = (message) => {
        uploadStatus.textContent = message;
        uploadStatus.hidden = !message;
    };

    const showSettingsError = (message, error) => {
        folderSettingsError.textContent = message;
        folderSettingsError.hidden = false;
        if (renameDialog.open) {
            renameError.textContent = message;
            renameError.hidden = false;
        }
        if (deleteDialog.open) {
            deleteError.textContent = message;
            deleteError.hidden = false;
        }
        console.error(message, error);
    };

    const clearSettingsError = () => {
        folderSettingsError.textContent = '';
        folderSettingsError.hidden = true;
        renameError.textContent = '';
        renameError.hidden = true;
        deleteError.textContent = '';
        deleteError.hidden = true;
    };

    const openDatabase = () => {
        if (!databasePromise) {
            databasePromise = new Promise((resolve, reject) => {
                const request = indexedDB.open(databaseName, 1);
                request.onupgradeneeded = () => {
                    const database = request.result;
                    database.createObjectStore('settings', { keyPath: 'key' });
                    database.createObjectStore('folders', { keyPath: 'id' });
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        return databasePromise;
    };

    const transact = async (storeName, mode, action) => {
        const database = await openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(storeName, mode);
            const request = action(transaction.objectStore(storeName));
            transaction.oncomplete = () => resolve(request?.result);
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error || new Error('The folder data could not be saved.'));
        });
    };

    const getSetting = (key) => transact('settings', 'readonly', (store) => store.get(key))
        .then((record) => record?.value);

    const saveSetting = (key, value) => transact('settings', 'readwrite', (store) => store.put({ key, value }));

    const getFolderRecords = () => transact('folders', 'readonly', (store) => store.getAll());

    const saveFolder = (folder) => transact('folders', 'readwrite', (store) => store.put(folder));

    const removeFolderRecord = (id) => transact('folders', 'readwrite', (store) => store.delete(id));

    const getProjectRoot = async () => {
        if (typeof window.showDirectoryPicker !== 'function') {
            throw new Error('This browser does not support folder access. Open Bunny Vault in a browser with the File System Access API.');
        }

        if (!projectRootHandle) {
            projectRootHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            await saveSetting('projectRoot', projectRootHandle);
        }

        let permission = await projectRootHandle.queryPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
            permission = await projectRootHandle.requestPermission({ mode: 'readwrite' });
        }
        if (permission !== 'granted') {
            throw new Error('Allow read and write access to the selected ProjectPort folder to create folders and save images.');
        }

        return projectRootHandle;
    };

    const isNotFound = (error) => error && error.name === 'NotFoundError';

    const directoryExists = async (root, name) => {
        try {
            await root.getDirectoryHandle(name);
            return true;
        } catch (error) {
            if (isNotFound(error)) {
                return false;
            }
            throw error;
        }
    };

    const uniqueDirectoryName = async (root, requestedName, excludedName = '') => {
        const existingNames = new Set(
            folders
                .filter((folder) => !folder.deleted && folder.directoryName !== excludedName)
                .map((folder) => folder.directoryName?.toLocaleLowerCase())
                .filter(Boolean)
        );
        let suffix = 1;
        while (true) {
            const candidate = suffix === 1 ? requestedName : `${requestedName} (${suffix})`;
            if (!existingNames.has(candidate.toLocaleLowerCase()) && !(await directoryExists(root, candidate))) {
                return candidate;
            }
            suffix += 1;
        }
    };

    const sanitizeFolderName = (name) => name
        .trim()
        .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
        .replace(/[. ]+$/g, '')
        .slice(0, 60);

    const sanitizeFileName = (name) => name
        .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
        .replace(/[. ]+$/g, '');

    const isImageFile = (file) => file.type.startsWith('image/')
        || /\.(avif|bmp|gif|jpe?g|png|svg|tiff?|webp)$/i.test(file.name);

    const createFolderCard = (folder) => {
        const card = document.createElement('article');
        const openButton = document.createElement('button');
        const preview = document.createElement('span');
        const front = document.createElement('span');
        const label = document.createElement('span');
        const menuToggle = document.createElement('button');
        const menuIcon = document.createElement('span');
        const menu = document.createElement('div');
        const renameButton = document.createElement('button');
        const deleteButton = document.createElement('button');

        card.className = 'folder-card';
        card.dataset.folderId = folder.id;
        openButton.className = 'memory-folder';
        openButton.type = 'button';
        openButton.setAttribute('aria-haspopup', 'dialog');
        openButton.setAttribute('aria-controls', 'photo-dialog');
        openButton.setAttribute('aria-label', folder.name);
        preview.className = 'folder-preview';
        preview.setAttribute('aria-hidden', 'true');
        if (folder.id === favoriteFolderId) {
            const image = document.createElement('img');
            image.src = '../assets/pictures/vault-preview.jpg';
            image.alt = '';
            image.loading = 'lazy';
            image.decoding = 'async';
            preview.append(image);
        } else {
            preview.classList.add('folder-preview-empty');
        }
        front.className = 'folder-front';
        label.className = 'folder-name';
        label.textContent = folder.name;
        preview.append(front);
        openButton.append(preview, label);

        menuToggle.className = 'folder-menu-toggle';
        menuToggle.type = 'button';
        menuToggle.setAttribute('aria-label', `Options for ${folder.name}`);
        menuToggle.setAttribute('aria-haspopup', 'menu');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuIcon.setAttribute('aria-hidden', 'true');
        menuIcon.textContent = '⋮';
        menuToggle.append(menuIcon);

        menu.className = 'folder-menu';
        menu.id = `folder-menu-${folder.id}`;
        menu.setAttribute('role', 'menu');
        menu.setAttribute('aria-label', `${folder.name} options`);
        menu.hidden = true;
        renameButton.className = 'rename-folder';
        renameButton.type = 'button';
        renameButton.setAttribute('role', 'menuitem');
        renameButton.textContent = 'Rename';
        deleteButton.className = 'delete-folder';
        deleteButton.type = 'button';
        deleteButton.setAttribute('role', 'menuitem');
        deleteButton.textContent = 'Delete';
        menu.append(renameButton, deleteButton);
        card.append(openButton, menuToggle, menu);

        openButton.addEventListener('click', () => {
            openGallery(folder).catch((error) => showSettingsError('The folder could not be opened.', error));
        });
        menuToggle.addEventListener('click', () => {
            const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
            folderList.querySelectorAll('.folder-card').forEach((otherCard) => {
                if (otherCard !== card) {
                    closeFolderMenu(otherCard);
                }
            });
            if (isOpen) {
                closeFolderMenu(card);
                return;
            }

            menu.hidden = false;
            menuToggle.setAttribute('aria-expanded', 'true');
            card.classList.add('menu-open');
            renameButton.focus();
        });
        renameButton.addEventListener('click', () => {
            closeFolderMenu(card);
            activeActionFolder = folder;
            folderNameInput.value = folder.name;
            folderNameInput.setCustomValidity('');
            renameError.textContent = '';
            renameError.hidden = true;
            renameDialog.showModal();
            folderNameInput.focus();
            folderNameInput.select();
        });
        deleteButton.addEventListener('click', () => {
            closeFolderMenu(card);
            activeActionFolder = folder;
            deleteError.textContent = '';
            deleteError.hidden = true;
            deleteDialog.showModal();
        });
        menu.addEventListener('keydown', (event) => {
            const items = [...menu.querySelectorAll('[role="menuitem"]')];
            const currentIndex = items.indexOf(document.activeElement);
            let nextIndex;
            if (event.key === 'ArrowDown') {
                nextIndex = (currentIndex + 1) % items.length;
            } else if (event.key === 'ArrowUp') {
                nextIndex = (currentIndex - 1 + items.length) % items.length;
            } else if (event.key === 'Home') {
                nextIndex = 0;
            } else if (event.key === 'End') {
                nextIndex = items.length - 1;
            }

            if (nextIndex !== undefined) {
                event.preventDefault();
                items[nextIndex].focus();
            }
        });
        return card;
    };

    const renderFolders = () => {
        folderList.replaceChildren(...folders
            .filter((folder) => !folder.deleted)
            .map(createFolderCard));
    };

    const closeFolderMenu = (card, restoreFocus = false) => {
        const menu = card.querySelector('.folder-menu');
        const toggle = card.querySelector('.folder-menu-toggle');
        menu.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        card.classList.remove('menu-open');
        if (restoreFocus) {
            toggle.focus();
        }
    };

    const animateFolderProperty = (element, property, target, duration, easing) => {
        let animations = folderAnimations.get(element);
        if (!animations) {
            animations = new Map();
            folderAnimations.set(element, animations);
        }

        const current = getComputedStyle(element)[property];
        animations.get(property)?.cancel();
        const animation = element.animate(
            [{ [property]: current }, { [property]: target }],
            {
                duration: reduceMotion.matches ? 1 : duration,
                easing,
                fill: 'forwards'
            }
        );
        animations.set(property, animation);
    };

    const setFolderHover = (card, isHovered) => {
        if (card.classList.contains('is-hovered') === isHovered) {
            return;
        }

        const button = card.querySelector('.memory-folder');
        const previewImage = card.querySelector('.folder-preview img');
        animateFolderProperty(card, 'transform', isHovered ? 'translateY(-5px)' : 'translateY(0)', 680, 'cubic-bezier(0.16, 1, 0.3, 1)');
        animateFolderProperty(button, 'backgroundColor', isHovered ? 'rgba(255, 255, 255, 0.045)' : 'rgba(0, 0, 0, 0)', 560, 'ease-out');
        animateFolderProperty(button, 'boxShadow', isHovered ? '0 12px 28px rgba(0, 0, 0, 0.22)' : '0 0 0 rgba(0, 0, 0, 0)', 560, 'ease-out');
        if (previewImage) {
            animateFolderProperty(previewImage, 'transform', isHovered
                ? 'translate(-50%, -12px) rotate(-2deg) scale(1.02)'
                : 'translate(-50%, 14px) rotate(-3deg) scale(0.9)', 820, 'cubic-bezier(0.16, 1, 0.3, 1)');
            animateFolderProperty(previewImage, 'opacity', isHovered ? '1' : '0.84', 560, 'ease-out');
        }
        card.classList.toggle('is-hovered', isHovered);
    };

    const updateFolderHover = () => {
        if (pointerFolder && pointerFolder !== focusFolder) {
            setFolderHover(pointerFolder, true);
        } else if (focusFolder) {
            setFolderHover(focusFolder, true);
        }

        folderList.querySelectorAll('.folder-card.is-hovered').forEach((card) => {
            if (card !== pointerFolder && card !== focusFolder) {
                setFolderHover(card, false);
            }
        });
    };

    const initializeFolders = async () => {
        projectRootHandle = await getSetting('projectRoot');
        const records = await getFolderRecords();
        let legacyName = 'Favorite Memories';
        let legacyDeleted = false;
        try {
            legacyName = localStorage.getItem(legacyFolderNameKey) || legacyName;
            legacyDeleted = localStorage.getItem(legacyFolderDeletedKey) === 'true';
        } catch (error) {
            console.warn('Previously saved folder preferences could not be read.', error);
        }

        let favorite = records.find((folder) => folder.id === favoriteFolderId);
        if (!favorite) {
            favorite = {
                id: favoriteFolderId,
                name: legacyName,
                directoryName: null,
                builtin: true,
                deleted: legacyDeleted
            };
            await saveFolder(favorite);
        }

        folders = [favorite, ...records.filter((folder) => folder.id !== favoriteFolderId)];
        renderFolders();
    };

    const updateZoom = (nextZoom) => {
        zoom = Math.min(3, Math.max(1, nextZoom));
        viewerImage.style.transform = `scale(${zoom})`;
        zoomResetButton.textContent = `${Math.round(zoom * 100)}%`;
        zoomOutButton.disabled = zoom === 1;
        zoomInButton.disabled = zoom === 3;
    };

    const clearPhotoObjectUrls = () => {
        photoObjectUrls.forEach((url) => URL.revokeObjectURL(url));
        photoObjectUrls.clear();
    };

    const showPhotoGrid = () => {
        photoGrid.hidden = false;
        photoViewer.hidden = true;
        viewerImage.removeAttribute('src');
        viewerImage.alt = '';
        viewerCaption.textContent = '';
        updateZoom(1);
    };

    const openPhoto = (entry) => {
        viewerImage.src = entry.src;
        viewerImage.alt = entry.title;
        viewerCaption.textContent = entry.title;
        photoGrid.hidden = true;
        photoViewer.hidden = false;
        updateZoom(1);
    };

    const makePhotoCard = (entry) => {
        const button = document.createElement('button');
        const image = document.createElement('img');
        const label = document.createElement('span');
        button.className = 'photo-preview';
        button.type = 'button';
        button.setAttribute('aria-label', `View ${entry.title}`);
        image.src = entry.src;
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';
        label.textContent = entry.title;
        button.append(image, label);
        button.addEventListener('click', () => openPhoto(entry));
        return button;
    };

    const renderPhotoGrid = (entries) => {
        photoGrid.replaceChildren();
        if (!entries.length) {
            const emptyState = document.createElement('div');
            const icon = document.createElement('span');
            const message = document.createElement('p');
            const button = document.createElement('button');
            emptyState.className = 'empty-folder-state';
            icon.className = 'empty-folder-icon';
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = '▧';
            message.textContent = 'This folder is empty. Add your first memory.';
            button.className = 'empty-folder-add';
            button.type = 'button';
            button.innerHTML = '<span aria-hidden="true">+</span> Add Files';
            button.addEventListener('click', openFilePicker);
            emptyState.append(icon, message, button);
            photoGrid.append(emptyState);
        } else {
            photoGrid.append(...entries.map(makePhotoCard));
        }
        setUploadStatus('');
    };

    const isImageName = (name) => /\.(avif|bmp|gif|jpe?g|png|svg|tiff?|webp)$/i.test(name);

    const getPhotoEntries = async (folder) => {
        const entries = folder.builtin
            ? photos.map((filename, index) => ({
                title: `Treasure ${String(index + 1).padStart(2, '0')}`,
                src: `../assets/pictures/${filename}`
            }))
            : [];
        entries.push(...await getFolderImages(folder));
        return entries;
    };

    const getFolderImages = async (folder) => {
        if (!folder.directoryName) {
            return [];
        }

        const root = await getProjectRoot();
        const directory = await root.getDirectoryHandle(folder.directoryName);
        const entries = [];
        for await (const [name, handle] of directory.entries()) {
            if (handle.kind !== 'file') {
                continue;
            }

            const file = await handle.getFile();
            if (!file.type.startsWith('image/') && !isImageName(name)) {
                continue;
            }
            const src = URL.createObjectURL(file);
            photoObjectUrls.add(src);
            entries.push({ title: name, src });
        }
        return entries.sort((left, right) => left.title.localeCompare(right.title));
    };

    const openGallery = async (folder) => {
        clearPhotoObjectUrls();
        activeFolder = folder;
        dialogTitle.textContent = folder.name;
        const entries = await getPhotoEntries(folder);
        renderPhotoGrid(entries);
        showPhotoGrid();
        if (!dialog.open) {
            dialog.showModal();
        }
    };

    const ensureFolderDirectory = async (folder, root) => {
        const directoryName = folder.directoryName
            || (folder.builtin
                ? sanitizeFolderName(folder.name) || 'Favorite Memories'
                : await uniqueDirectoryName(root, sanitizeFolderName(folder.name) || 'New Folder'));
        const directory = await root.getDirectoryHandle(directoryName, { create: true });
        if (folder.directoryName !== directoryName) {
            folder.directoryName = directoryName;
            await saveFolder(folder);
        }
        return directory;
    };

    const openFilePicker = async () => {
        try {
            const needsProjectFolderSelection = !projectRootHandle;
            const root = await getProjectRoot();
            uploadDirectory = await ensureFolderDirectory(activeFolder, root);
            if (needsProjectFolderSelection) {
                setUploadStatus('ProjectPort is connected. Click Add Files again to choose images.');
                return;
            }
            fileInput.value = '';
            fileInput.click();
        } catch (error) {
            if (error.name !== 'AbortError') {
                const message = 'Could not access the selected ProjectPort folder. Check its permissions and try again.';
                setUploadStatus(message);
                showSettingsError(message, error);
            }
        }
    };

    const uniqueFileName = async (directory, requestedName) => {
        const safeName = sanitizeFileName(requestedName);
        if (!safeName) {
            throw new Error('An uploaded image has an invalid filename.');
        }

        const dot = safeName.lastIndexOf('.');
        const baseName = dot > 0 ? safeName.slice(0, dot) : safeName;
        const extension = dot > 0 ? safeName.slice(dot) : '';
        let suffix = 1;
        while (true) {
            const candidate = suffix === 1 ? safeName : `${baseName} (${suffix})${extension}`;
            try {
                await directory.getFileHandle(candidate);
                suffix += 1;
            } catch (error) {
                if (isNotFound(error)) {
                    return candidate;
                }
                throw error;
            }
        }
    };

    const saveSelectedImages = async () => {
        const selectedFiles = [...fileInput.files];
        const imageFiles = selectedFiles.filter(isImageFile);
        if (!imageFiles.length) {
            setUploadStatus(selectedFiles.length
                ? 'Please select image files to add.'
                : '');
            return;
        }

        let savedCount = 0;
        setUploadStatus(`Saving ${imageFiles.length} ${imageFiles.length === 1 ? 'image' : 'images'} to ${activeFolder.directoryName}…`);
        for (const file of imageFiles) {
            let writable;
            try {
                const name = await uniqueFileName(uploadDirectory, file.name);
                const handle = await uploadDirectory.getFileHandle(name, { create: true });
                writable = await handle.createWritable();
                await writable.write(file);
                await writable.close();
                savedCount += 1;
            } catch (error) {
                if (writable) {
                    await writable.abort().catch((abortError) => console.error('Could not abort the incomplete image write.', abortError));
                }
                setUploadStatus(`${savedCount} of ${imageFiles.length} images saved. Could not save ${file.name}.`);
                try {
                    renderPhotoGrid(await getPhotoEntries(activeFolder));
                    setUploadStatus(`${savedCount} of ${imageFiles.length} images saved. Could not save ${file.name}.`);
                } catch (refreshError) {
                    console.error('Could not refresh the folder after a partial upload.', refreshError);
                }
                showSettingsError('An image could not be saved to the selected folder.', error);
                return;
            }
        }

        clearSettingsError();
        setUploadStatus(`${savedCount} ${savedCount === 1 ? 'image' : 'images'} saved to ${activeFolder.directoryName}.`);
        try {
            renderPhotoGrid(await getPhotoEntries(activeFolder));
            setUploadStatus(`${savedCount} ${savedCount === 1 ? 'image' : 'images'} saved to ${activeFolder.directoryName}.`);
        } catch (error) {
            showSettingsError('Your images were saved, but the folder preview could not be refreshed.', error);
        }
    };

    const uniqueFolderId = () => `folder-${crypto.randomUUID()}`;

    const createNewFolder = async () => {
        try {
            const root = await getProjectRoot();
            const directoryName = await uniqueDirectoryName(root, 'New Folder');
            await root.getDirectoryHandle(directoryName, { create: true });
            const folder = {
                id: uniqueFolderId(),
                name: directoryName,
                directoryName,
                builtin: false,
                deleted: false
            };
            await saveFolder(folder);
            folders.push(folder);
            renderFolders();
            clearSettingsError();
        } catch (error) {
            if (error.name !== 'AbortError') {
                showSettingsError('Could not create a folder in the selected ProjectPort directory.', error);
            }
        }
    };

    const copyDirectoryContents = async (source, destination) => {
        for await (const [name, handle] of source.entries()) {
            if (handle.kind === 'directory') {
                const sourceChild = await source.getDirectoryHandle(name);
                const destinationChild = await destination.getDirectoryHandle(name, { create: true });
                await copyDirectoryContents(sourceChild, destinationChild);
            } else {
                const file = await (await source.getFileHandle(name)).getFile();
                const target = await destination.getFileHandle(name, { create: true });
                const writable = await target.createWritable();
                await writable.write(file);
                await writable.close();
            }
        }
    };

    const renameActiveFolder = async (nextName) => {
        const folder = activeActionFolder;
        const safeName = sanitizeFolderName(nextName);
        if (!safeName) {
            folderNameInput.setCustomValidity('Enter a folder name that is valid for a folder on your computer.');
            folderNameInput.reportValidity();
            return;
        }

        const duplicate = folders.some((item) => item.id !== folder.id && !item.deleted && item.name.toLocaleLowerCase() === safeName.toLocaleLowerCase());
        if (duplicate) {
            folderNameInput.setCustomValidity('A folder with that name already exists in Bunny Vault.');
            folderNameInput.reportValidity();
            return;
        }

        try {
            if (folder.directoryName && folder.directoryName !== safeName) {
                const root = await getProjectRoot();
                const directoryName = await uniqueDirectoryName(root, safeName, folder.directoryName);
                const source = await root.getDirectoryHandle(folder.directoryName);
                const destination = await root.getDirectoryHandle(directoryName, { create: true });
                await copyDirectoryContents(source, destination);
                await root.removeEntry(folder.directoryName, { recursive: true });
                folder.directoryName = directoryName;
            }
            folder.name = safeName;
            await saveFolder(folder);
            renderFolders();
            clearSettingsError();
            renameDialog.close();
        } catch (error) {
            showSettingsError('The folder could not be renamed. Its original files have been kept.', error);
        }
    };

    const deleteActiveFolder = async () => {
        const folder = activeActionFolder;
        try {
            if (folder.directoryName) {
                const root = await getProjectRoot();
                try {
                    await root.removeEntry(folder.directoryName, { recursive: true });
                } catch (error) {
                    if (!isNotFound(error)) {
                        throw error;
                    }
                }
            }

            if (folder.builtin) {
                folder.deleted = true;
                await saveFolder(folder);
            } else {
                await removeFolderRecord(folder.id);
                folders = folders.filter((item) => item.id !== folder.id);
            }
            renderFolders();
            clearSettingsError();
            deleteDialog.close();
        } catch (error) {
            showSettingsError('The folder could not be deleted. Its files have been kept.', error);
        }
    };

    const updateGlow = (elapsed = 0, moveLights = true) => {
        const phase = (elapsed / 14000) * Math.PI * 2;
        const colorProgress = (1 - Math.cos((elapsed / 12000) * Math.PI * 2)) / 2;
        const channel = (pink, white = 255) => Math.round(pink + (white - pink) * colorProgress);
        const red = channel(232);
        const green = channel(93);
        const blue = channel(158);
        const primaryX = moveLights ? 35 + Math.sin(phase) * 23 : 35;
        const primaryY = moveLights ? 35 + Math.cos(phase * 0.7) * 22 : 35;
        const secondaryX = moveLights ? 65 + Math.sin(phase + Math.PI) * 22 : 65;
        const secondaryY = moveLights ? 65 + Math.cos(phase * 0.7 + Math.PI) * 20 : 65;
        body.style.setProperty('--vault-glow', `rgba(${red}, ${green}, ${blue}, 0.62)`);
        body.style.setProperty('--vault-glow-secondary', `rgba(${red}, ${green}, ${blue}, 0.48)`);
        body.style.setProperty('--vault-glow-x', `${primaryX}%`);
        body.style.setProperty('--vault-glow-y', `${primaryY}%`);
        body.style.setProperty('--vault-glow-secondary-x', `${secondaryX}%`);
        body.style.setProperty('--vault-glow-secondary-y', `${secondaryY}%`);
    };

    const animateGlow = (time) => {
        if (startTime === undefined) {
            startTime = time;
        }
        updateGlow(time - startTime, !reduceMotion.matches);
        animationFrame = requestAnimationFrame(animateGlow);
    };

    folderList.addEventListener('pointerover', (event) => {
        const card = event.target.closest('.folder-card');
        if (card && !card.contains(event.relatedTarget)) {
            pointerFolder = card;
            updateFolderHover();
        }
    });
    folderList.addEventListener('pointerout', (event) => {
        const card = event.target.closest('.folder-card');
        if (card && !card.contains(event.relatedTarget)) {
            pointerFolder = null;
            updateFolderHover();
        }
    });
    folderList.addEventListener('focusin', (event) => {
        focusFolder = event.target.closest('.folder-card');
        updateFolderHover();
    });
    folderList.addEventListener('focusout', (event) => {
        const nextCard = event.relatedTarget?.closest('.folder-card');
        focusFolder = nextCard && folderList.contains(nextCard) ? nextCard : null;
        updateFolderHover();
    });
    addFolderButton.addEventListener('click', createNewFolder);
    dialogAddFiles.addEventListener('click', openFilePicker);
    fileInput.addEventListener('change', saveSelectedImages);
    document.querySelectorAll('.action-cancel').forEach((button) => {
        button.addEventListener('click', () => button.closest('dialog').close());
    });
    folderNameInput.addEventListener('input', () => folderNameInput.setCustomValidity(''));
    renameForm.addEventListener('submit', (event) => {
        event.preventDefault();
        renameActiveFolder(folderNameInput.value);
    });
    deleteForm.addEventListener('submit', (event) => {
        event.preventDefault();
        deleteActiveFolder();
    });
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.folder-card')) {
            folderList.querySelectorAll('.folder-card.menu-open').forEach((card) => closeFolderMenu(card));
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            folderList.querySelectorAll('.folder-card.menu-open').forEach((card) => closeFolderMenu(card, true));
        }
    });
    renameDialog.addEventListener('close', () => {
        if (activeActionFolder) {
            folderList.querySelector(`[data-folder-id="${CSS.escape(activeActionFolder.id)}"] .folder-menu-toggle`)?.focus();
        }
    });
    deleteDialog.addEventListener('close', () => {
        if (activeActionFolder && !activeActionFolder.deleted) {
            folderList.querySelector(`[data-folder-id="${CSS.escape(activeActionFolder.id)}"] .folder-menu-toggle`)?.focus();
        }
    });
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.querySelector('.viewer-back').addEventListener('click', showPhotoGrid);
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) {
            dialog.close();
        }
    });
    dialog.addEventListener('close', () => {
        clearPhotoObjectUrls();
        photoGrid.replaceChildren();
        showPhotoGrid();
        activeFolder = undefined;
        uploadDirectory = undefined;
    });
    zoomOutButton.addEventListener('click', () => updateZoom(zoom - 0.25));
    zoomResetButton.addEventListener('click', () => updateZoom(1));
    zoomInButton.addEventListener('click', () => updateZoom(zoom + 0.25));

    initializeFolders().catch((error) => showSettingsError('Bunny Vault could not load its saved folders.', error));
    animationFrame = requestAnimationFrame((time) => {
        startTime = time;
        updateGlow(0, !reduceMotion.matches);
        animationFrame = requestAnimationFrame(animateGlow);
    });
});
