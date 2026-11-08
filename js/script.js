/* ================================================
   Yeni Sekme - Main JavaScript
   ================================================ */

(function () {
    'use strict';

    // ========================================
    // Search Engines Configuration
    // ========================================
    const SEARCH_ENGINES = {
        google: {
            name: 'Google',
            url: 'https://www.google.com/search?q=',
            icon: 'https://www.google.com/favicon.ico'
        },
        brave: {
            name: 'Brave',
            url: 'https://search.brave.com/search?q=',
            icon: 'https://brave.com/static-assets/images/brave-favicon.png'
        },
        bing: {
            name: 'Bing',
            url: 'https://www.bing.com/search?q=',
            icon: 'https://www.bing.com/favicon.ico'
        },
        yandex: {
            name: 'Yandex',
            url: 'https://yandex.com/search/?text=',
            icon: 'https://yandex.com/favicon.ico'
        }
    };

    // ========================================
    // Default Settings
    // ========================================
    const DEFAULTS = {
        searchEngine: 'google',
        bgType: 'solid',
        bgColor: '#0a0a1a',
        gradientStart: '#0a0a1a',
        gradientEnd: '#1a1a3e',
        gradientDirection: 'to bottom',
        bgImage: null,
        bgImageOpacity: 100,
        bgBlur: 0,
        fontFamily: "'Inter', sans-serif",
        clockSize: 96,
        clockWeight: '600',
        greetingSize: 20,
        searchScale: 100,
        searchWidth: 560,
        linksScale: 100,
        dateSize: 15,
        showGreeting: true,
        timeFormat24: true,
        showSeconds: false,
        clockColor: '#ffffff',
        greetingColor: '#a0a0b8',
        searchBgColor: '#1a1a2e',
        searchBorderColor: '#2a2a4a',
        searchTextColor: '#e0e0e8',
        linkBgColor: '#1a1a2e',
        linkTextColor: '#c0c0d0',
        dateColor: '#a0a0b8',
        accentColor: '#6c63ff',
        clockVertical: 28,
        clockHorizontal: 50,
        searchVertical: 48,
        searchHorizontal: 50,
        linksVertical: 64,
        linksHorizontal: 50,
        dateVertical: 95,
        dateHorizontal: 8,
        showDate: true,
        quickLinks: []
    };

    // ========================================
    // State
    // ========================================
    let settings = {};
    let clockInterval = null;

    // ========================================
    // DOM References
    // ========================================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const DOM = {
        body: $('body'),
        bgOverlay: $('#bg-overlay'),
        mainContent: $('#main-content'),
        clock: $('#clock'),
        greeting: $('#greeting'),
        clockContainer: $('#clock-container'),
        searchContainer: $('#search-container'),
        searchInput: $('#search-input'),
        searchBtn: $('#search-btn'),
        searchWrapper: $('#search-wrapper'),
        engineBtn: $('#engine-btn'),
        engineIcon: $('#engine-icon'),
        engineSelector: $('#engine-selector'),
        engineDropdown: $('#engine-dropdown'),
        quickLinks: $('#quick-links'),
        quickLinksContainer: $('#quick-links-container'),
        addLinkBtn: $('#add-link-btn'),
        dateContainer: $('#date-container'),
        dateEl: $('#date'),
        settingsBtn: $('#settings-btn'),
        settingsOverlay: $('#settings-overlay'),
        settingsPanel: $('#settings-panel'),
        // Modals
        linkModal: $('#link-modal'),
        editLinkModal: $('#edit-link-modal'),
    };

    // ========================================
    // IndexedDB for Persistent Background Images (Unlimited storage)
    // ========================================
    const DB_NAME = 'ZenTabCustomDB';
    const DB_STORE = 'customBgStore';

    function openDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function saveBgImageToDB(dataUrl) {
        try {
            const db = await openDB();
            const tx = db.transaction(DB_STORE, 'readwrite');
            tx.objectStore(DB_STORE).put(dataUrl, 'savedWallpaper');
            return new Promise((res, rej) => {
                tx.oncomplete = () => res();
                tx.onerror = () => rej(tx.error);
            });
        } catch (e) {
            console.error('Error saving image to IndexedDB:', e);
        }
    }

    async function loadBgImageFromDB() {
        try {
            const db = await openDB();
            const tx = db.transaction(DB_STORE, 'readonly');
            const req = tx.objectStore(DB_STORE).get('savedWallpaper');
            return new Promise((res, rej) => {
                req.onsuccess = () => res(req.result || null);
                req.onerror = () => rej(req.error);
            });
        } catch (e) {
            console.error('Error loading image from IndexedDB:', e);
            return null;
        }
    }

    async function clearBgImageFromDB() {
        try {
            const db = await openDB();
            const tx = db.transaction(DB_STORE, 'readwrite');
            tx.objectStore(DB_STORE).delete('savedWallpaper');
        } catch (e) {
            console.error('Error clearing image from IndexedDB:', e);
        }
    }

    // ========================================
    // LocalStorage Helpers (Configuration)
    // ========================================
    function loadSettings() {
        try {
            const saved = localStorage.getItem('newTabSettings');
            const parsed = saved ? JSON.parse(saved) : {};
            settings = Object.assign(JSON.parse(JSON.stringify(DEFAULTS)), parsed);
            if (!Array.isArray(settings.quickLinks)) {
                settings.quickLinks = [];
            }
        } catch {
            settings = JSON.parse(JSON.stringify(DEFAULTS));
        }
    }

    function saveSettings() {
        try {
            // Keep background image in IndexedDB to avoid exceeding localStorage 5MB quota
            const settingsToSave = { ...settings };
            delete settingsToSave.bgImage;
            localStorage.setItem('newTabSettings', JSON.stringify(settingsToSave));
        } catch (e) {
            console.warn('Settings could not be saved to localStorage:', e);
        }
    }

    // ========================================
    // Clock & Date
    // ========================================
    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        let seconds = now.getSeconds();

        let timeStr = '';
        if (settings.timeFormat24) {
            timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        } else {
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            timeStr = `${hours}:${String(minutes).padStart(2, '0')} ${ampm}`;
        }

        if (settings.showSeconds) {
            const secStr = String(seconds).padStart(2, '0');
            if (settings.timeFormat24) {
                timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${secStr}`;
            } else {
                const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
                const h12 = now.getHours() % 12 || 12;
                timeStr = `${h12}:${String(minutes).padStart(2, '0')}:${secStr} ${ampm}`;
            }
        }

        DOM.clock.textContent = timeStr;

        // Greeting
        if (settings.showGreeting) {
            const hour = now.getHours();
            let greetMsg = '';
            if (hour >= 5 && hour < 12) greetMsg = 'Günaydın';
            else if (hour >= 12 && hour < 18) greetMsg = 'İyi Öğlenler';
            else if (hour >= 18 && hour < 22) greetMsg = 'İyi Akşamlar';
            else greetMsg = 'İyi Geceler';
            DOM.greeting.textContent = greetMsg;
            DOM.greeting.style.display = '';
        } else {
            DOM.greeting.style.display = 'none';
        }
    }

    function updateDate() {
        const now = new Date();
        const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

        const dayName = days[now.getDay()];
        const day = now.getDate();
        const month = months[now.getMonth()];
        const year = now.getFullYear();

        DOM.dateEl.textContent = `${dayName}, ${day} ${month} ${year}`;
    }

    function startClock() {
        updateClock();
        updateDate();
        if (clockInterval) clearInterval(clockInterval);
        clockInterval = setInterval(() => {
            updateClock();
            updateDate();
        }, 1000);
    }

    // ========================================
    // Search Engine
    // ========================================
    function setSearchEngine(engine) {
        settings.searchEngine = engine;
        const engineData = SEARCH_ENGINES[engine];
        DOM.engineIcon.src = engineData.icon;
        DOM.engineIcon.alt = engineData.name;

        // Update active state in dropdown
        $$('.engine-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.engine === engine);
        });

        saveSettings();
    }

    function performSearch() {
        const query = DOM.searchInput.value.trim();
        if (!query) return;

        // Check if it's a URL
        const urlPattern = /^(https?:\/\/|www\.)/i;
        const domainPattern = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/;

        if (urlPattern.test(query)) {
            window.location.href = query.startsWith('http') ? query : `https://${query}`;
        } else if (domainPattern.test(query)) {
            window.location.href = `https://${query}`;
        } else {
            const engineUrl = SEARCH_ENGINES[settings.searchEngine].url;
            window.location.href = engineUrl + encodeURIComponent(query);
        }
    }

    // ========================================
    // Quick Links
    // ========================================
    function getFaviconUrl(url) {
        try {
            const urlObj = new URL(url);
            return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
        } catch {
            return '';
        }
    }

    let draggedIndex = null;
    let isDraggingLink = false;

    function renderQuickLinks() {
        DOM.quickLinks.innerHTML = '';
        settings.quickLinks.forEach((link, index) => {
            const el = document.createElement('a');
            el.className = 'quick-link';
            el.href = link.url;
            el.title = link.name;
            el.draggable = true;
            el.dataset.index = index;

            // Drag & Drop for reordering
            el.addEventListener('dragstart', (e) => {
                draggedIndex = index;
                isDraggingLink = true;
                el.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', index);
            });

            el.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            el.addEventListener('dragenter', (e) => {
                e.preventDefault();
                if (draggedIndex !== null && draggedIndex !== index) {
                    el.classList.add('drag-over');
                }
            });

            el.addEventListener('dragleave', () => {
                el.classList.remove('drag-over');
            });

            el.addEventListener('drop', (e) => {
                e.preventDefault();
                el.classList.remove('drag-over');
                if (draggedIndex !== null && draggedIndex !== index) {
                    const item = settings.quickLinks.splice(draggedIndex, 1)[0];
                    settings.quickLinks.splice(index, 0, item);
                    saveSettings();
                    renderQuickLinks();
                }
            });

            el.addEventListener('dragend', () => {
                el.classList.remove('dragging');
                $$('.quick-link').forEach(q => q.classList.remove('drag-over'));
                draggedIndex = null;
                setTimeout(() => {
                    isDraggingLink = false;
                }, 80);
            });

            el.addEventListener('click', (e) => {
                if (isDraggingLink) {
                    e.preventDefault();
                }
            });

            const iconDiv = document.createElement('div');
            iconDiv.className = 'quick-link-icon';

            const favicon = getFaviconUrl(link.url);
            if (favicon) {
                const img = document.createElement('img');
                img.src = favicon;
                img.alt = link.name;
                img.onerror = () => {
                    img.remove();
                    iconDiv.textContent = link.name.charAt(0).toUpperCase();
                    iconDiv.style.color = 'var(--accent-color)';
                    iconDiv.style.fontWeight = '600';
                };
                iconDiv.appendChild(img);
            } else {
                iconDiv.textContent = link.name.charAt(0).toUpperCase();
                iconDiv.style.color = 'var(--accent-color)';
                iconDiv.style.fontWeight = '600';
            }

            const nameSpan = document.createElement('span');
            nameSpan.className = 'quick-link-name';
            nameSpan.textContent = link.name;

            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'quick-link-edit';
            editBtn.title = 'Düzenle';
            editBtn.draggable = false;
            editBtn.innerHTML = '<i class="fas fa-pen"></i>';
            
            // Prevent drag triggers so clicking edit never drags the card
            editBtn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
            editBtn.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            }, { passive: true });
            editBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openEditLinkModal(index);
            });

            el.appendChild(iconDiv);
            el.appendChild(nameSpan);
            el.appendChild(editBtn);
            DOM.quickLinks.appendChild(el);
        });
    }

    function addQuickLink(name, url) {
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }
        settings.quickLinks.push({ name, url });
        saveSettings();
        renderQuickLinks();
    }

    function updateQuickLink(index, name, url) {
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }
        settings.quickLinks[index] = { name, url };
        saveSettings();
        renderQuickLinks();
    }

    function deleteQuickLink(index) {
        settings.quickLinks.splice(index, 1);
        saveSettings();
        renderQuickLinks();
    }

    // ========================================
    // Modals
    // ========================================
    function openModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('active');
        }
    }

    function closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    function updateMoveButtons(index) {
        const leftBtn = $('#move-link-left-btn');
        const rightBtn = $('#move-link-right-btn');
        const total = (settings.quickLinks && settings.quickLinks.length) || 0;
        if (leftBtn) {
            const isFirst = (index <= 0);
            leftBtn.disabled = isFirst;
            leftBtn.style.opacity = isFirst ? '0.4' : '1';
            leftBtn.style.cursor = isFirst ? 'not-allowed' : 'pointer';
        }
        if (rightBtn) {
            const isLast = (index >= total - 1);
            rightBtn.disabled = isLast;
            rightBtn.style.opacity = isLast ? '0.4' : '1';
            rightBtn.style.cursor = isLast ? 'not-allowed' : 'pointer';
        }
    }

    function openEditLinkModal(index) {
        index = parseInt(index);
        if (isNaN(index) || !settings.quickLinks || !settings.quickLinks[index]) {
            console.warn('Geçersiz link indeksi:', index);
            return;
        }
        const link = settings.quickLinks[index];
        const nameInput = $('#edit-link-name');
        const urlInput = $('#edit-link-url');
        const indexInput = $('#edit-link-index');
        if (nameInput) nameInput.value = link.name || '';
        if (urlInput) urlInput.value = link.url || '';
        if (indexInput) indexInput.value = index;
        updateMoveButtons(index);
        openModal('edit-link-modal');
    }

    // ========================================
    // Apply Settings to UI
    // ========================================
    function applyBackground() {
        const blurVal = settings.bgBlur || 0;
        document.documentElement.style.setProperty('--bg-blur', `${blurVal}px`);
        DOM.bgOverlay.style.display = 'block';
        DOM.bgOverlay.style.filter = 'none';
        DOM.bgOverlay.style.transform = 'none';

        if (settings.bgType === 'solid') {
            DOM.body.style.background = settings.bgColor;
            DOM.bgOverlay.style.background = settings.bgColor;
            DOM.bgOverlay.style.backgroundImage = '';
            DOM.bgOverlay.style.opacity = '1';
        } else if (settings.bgType === 'gradient') {
            const dir = settings.gradientDirection;
            const grad = dir === 'circle'
                ? `radial-gradient(circle, ${settings.gradientStart}, ${settings.gradientEnd})`
                : `linear-gradient(${dir}, ${settings.gradientStart}, ${settings.gradientEnd})`;
            DOM.body.style.background = settings.gradientStart;
            DOM.bgOverlay.style.background = grad;
            DOM.bgOverlay.style.backgroundImage = '';
            DOM.bgOverlay.style.opacity = '1';
        } else if (settings.bgType === 'image' && settings.bgImage) {
            DOM.body.style.background = settings.bgColor;
            DOM.bgOverlay.style.background = `${settings.bgColor} url(${settings.bgImage}) center/cover no-repeat`;
            DOM.bgOverlay.style.opacity = (settings.bgImageOpacity ?? 100) / 100;
        } else {
            DOM.body.style.background = settings.bgColor;
            DOM.bgOverlay.style.background = settings.bgColor;
            DOM.bgOverlay.style.backgroundImage = '';
            DOM.bgOverlay.style.opacity = '1';
        }
    }

    function applyColors() {
        const root = document.documentElement;
        root.style.setProperty('--clock-color', settings.clockColor);
        root.style.setProperty('--greeting-color', settings.greetingColor);
        root.style.setProperty('--search-bg', hexToRgba(settings.searchBgColor, 0.8));
        root.style.setProperty('--search-border', hexToRgba(settings.searchBorderColor, 0.6));
        root.style.setProperty('--search-text', settings.searchTextColor);
        root.style.setProperty('--link-bg', hexToRgba(settings.linkBgColor, 0.7));
        root.style.setProperty('--link-text', settings.linkTextColor);
        root.style.setProperty('--date-color', settings.dateColor);
        root.style.setProperty('--accent-color', settings.accentColor);
        root.style.setProperty('--accent-hover', darkenColor(settings.accentColor, 15));
    }

    function applyFont() {
        const root = document.documentElement;
        root.style.setProperty('--font-family', settings.fontFamily);
        root.style.setProperty('--clock-size', (settings.clockSize || 96) + 'px');
        root.style.setProperty('--clock-weight', settings.clockWeight || '600');
        root.style.setProperty('--greeting-size', (settings.greetingSize || 20) + 'px');
        root.style.setProperty('--search-scale', ((settings.searchScale || 100) / 100));
        root.style.setProperty('--search-width', (settings.searchWidth || 560) + 'px');
        root.style.setProperty('--links-scale', ((settings.linksScale || 100) / 100));
        root.style.setProperty('--date-size', (settings.dateSize || 15) + 'px');
    }

    function applyLayout() {
        // Individual percentage-based vertical and horizontal positions
        if (DOM.clockContainer) {
            DOM.clockContainer.style.top = `${settings.clockVertical ?? 28}%`;
            DOM.clockContainer.style.left = `${settings.clockHorizontal ?? 50}%`;
        }
        if (DOM.searchContainer) {
            DOM.searchContainer.style.top = `${settings.searchVertical ?? 48}%`;
            DOM.searchContainer.style.left = `${settings.searchHorizontal ?? 50}%`;
        }
        if (DOM.quickLinksContainer) {
            DOM.quickLinksContainer.style.top = `${settings.linksVertical ?? 64}%`;
            DOM.quickLinksContainer.style.left = `${settings.linksHorizontal ?? 50}%`;
        }
        if (DOM.dateContainer) {
            DOM.dateContainer.style.top = `${settings.dateVertical ?? 95}%`;
            DOM.dateContainer.style.left = `${settings.dateHorizontal ?? 8}%`;
            DOM.dateContainer.style.bottom = 'auto';
            DOM.dateContainer.style.display = settings.showDate ? '' : 'none';
        }
    }

    function applyAllSettings() {
        applyBackground();
        applyColors();
        applyFont();
        applyLayout();
        setSearchEngine(settings.searchEngine);
        renderQuickLinks();
    }

    // ========================================
    // Populate Settings Panel
    // ========================================
    function populateSettingsPanel() {
        try {
            // Background
            setBgTypeActive(settings.bgType || 'solid');
            
            const bgColor = settings.bgColor || '#0a0a1a';
            if ($('#bg-color')) $('#bg-color').value = bgColor;
            if ($('#bg-color-text')) $('#bg-color-text').value = bgColor;
            
            const gradStart = settings.gradientStart || '#0a0a1a';
            if ($('#gradient-start')) $('#gradient-start').value = gradStart;
            if ($('#gradient-start-text')) $('#gradient-start-text').value = gradStart;
            
            const gradEnd = settings.gradientEnd || '#1a1a3e';
            if ($('#gradient-end')) $('#gradient-end').value = gradEnd;
            if ($('#gradient-end-text')) $('#gradient-end-text').value = gradEnd;
            
            if ($('#gradient-direction')) $('#gradient-direction').value = settings.gradientDirection || 'to bottom';
            
            const bgOpacity = settings.bgImageOpacity ?? 100;
            if ($('#bg-image-opacity')) $('#bg-image-opacity').value = bgOpacity;
            if ($('#bg-image-opacity-value')) $('#bg-image-opacity-value').textContent = bgOpacity + '%';
            
            const bgBlur = settings.bgBlur || 0;
            if ($('#bg-blur')) $('#bg-blur').value = bgBlur;
            if ($('#bg-blur-value')) $('#bg-blur-value').textContent = bgBlur + 'px';

            const previewImg = $('#bg-preview-img');
            const previewDiv = $('#bg-image-preview');
            const uploadArea = $('#file-upload-area');
            if (settings.bgImage && previewImg && previewDiv && uploadArea) {
                previewImg.src = settings.bgImage;
                previewDiv.classList.remove('hidden');
                uploadArea.classList.add('hidden');
            } else if (previewDiv && uploadArea) {
                previewDiv.classList.add('hidden');
                uploadArea.classList.remove('hidden');
            }

            // Sizes
            if ($('#clock-size')) {
                $('#clock-size').value = settings.clockSize || 96;
                $('#clock-size-value').textContent = (settings.clockSize || 96) + 'px';
            }
            if ($('#greeting-size')) {
                $('#greeting-size').value = settings.greetingSize || 20;
                $('#greeting-size-value').textContent = (settings.greetingSize || 20) + 'px';
            }
            if ($('#search-scale')) {
                $('#search-scale').value = settings.searchScale || 100;
                $('#search-scale-value').textContent = '%' + (settings.searchScale || 100);
            }
            if ($('#search-width')) {
                $('#search-width').value = settings.searchWidth || 560;
                $('#search-width-value').textContent = (settings.searchWidth || 560) + 'px';
            }
            if ($('#links-scale')) {
                $('#links-scale').value = settings.linksScale || 100;
                $('#links-scale-value').textContent = '%' + (settings.linksScale || 100);
            }
            if ($('#date-size')) {
                $('#date-size').value = settings.dateSize || 15;
                $('#date-size-value').textContent = (settings.dateSize || 15) + 'px';
            }

            // Font
            if ($('#font-family')) $('#font-family').value = settings.fontFamily || "'Inter', sans-serif";
            if ($('#clock-weight')) $('#clock-weight').value = settings.clockWeight || '600';
            if ($('#show-greeting')) $('#show-greeting').checked = settings.showGreeting ?? true;
            if ($('#time-format-24')) $('#time-format-24').checked = settings.timeFormat24 ?? true;
            if ($('#show-seconds')) $('#show-seconds').checked = settings.showSeconds ?? false;

            // Colors
            const colorFields = [
                ['clock-color', 'clockColor', '#ffffff'],
                ['greeting-color', 'greetingColor', '#a0a0b8'],
                ['search-bg-color', 'searchBgColor', '#1a1a2e'],
                ['search-border-color', 'searchBorderColor', '#2a2a4a'],
                ['search-text-color', 'searchTextColor', '#e0e0e8'],
                ['link-bg-color', 'linkBgColor', '#1a1a2e'],
                ['link-text-color', 'linkTextColor', '#c0c0d0'],
                ['date-color', 'dateColor', '#a0a0b8'],
                ['accent-color', 'accentColor', '#6c63ff'],
            ];

            colorFields.forEach(([id, key, defaultColor]) => {
                const val = settings[key] || defaultColor;
                const cInput = $(`#${id}`);
                const tInput = $(`#${id}-text`);
                if (cInput) cInput.value = val;
                if (tInput) tInput.value = val;
            });

            // Positions
            const posConfigs = [
                ['clock-vertical', 'clockVertical', 28, '%'],
                ['clock-horizontal', 'clockHorizontal', 50, '%'],
                ['search-vertical', 'searchVertical', 48, '%'],
                ['search-horizontal', 'searchHorizontal', 50, '%'],
                ['links-vertical', 'linksVertical', 64, '%'],
                ['links-horizontal', 'linksHorizontal', 50, '%'],
                ['date-vertical', 'dateVertical', 95, '%'],
                ['date-horizontal', 'dateHorizontal', 8, '%'],
            ];

            posConfigs.forEach(([id, key, defaultVal, unit]) => {
                const el = $(`#${id}`);
                const valEl = $(`#${id}-value`);
                if (el) {
                    const val = settings[key] ?? defaultVal;
                    el.value = val;
                    if (valEl) valEl.textContent = val + unit;
                }
            });

            if ($('#show-date')) $('#show-date').checked = settings.showDate ?? true;
        } catch (err) {
            console.error('populateSettingsPanel error:', err);
        }
    }

    function setBgTypeActive(type) {
        $$('.bg-type-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.bgType === type));
        const solid = $('#bg-solid-options');
        const grad = $('#bg-gradient-options');
        const img = $('#bg-image-options');
        if (solid) solid.classList.toggle('hidden', type !== 'solid');
        if (grad) grad.classList.toggle('hidden', type !== 'gradient');
        if (img) img.classList.toggle('hidden', type !== 'image');
    }

    // ========================================
    // Event Listeners
    // ========================================
    function setupEventListeners() {
        // Search
        DOM.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') performSearch();
        });
        DOM.searchBtn.addEventListener('click', performSearch);

        // Engine selector
        DOM.engineBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            DOM.engineSelector.classList.toggle('open');
        });

        $$('.engine-option').forEach(opt => {
            opt.addEventListener('click', () => {
                setSearchEngine(opt.dataset.engine);
                DOM.engineSelector.classList.remove('open');
            });
        });

        // Close engine dropdown on outside click
        document.addEventListener('click', (e) => {
            if (!DOM.engineSelector.contains(e.target)) {
                DOM.engineSelector.classList.remove('open');
            }
        });

        // Add Link
        DOM.addLinkBtn.addEventListener('click', () => {
            $('#link-name').value = '';
            $('#link-url').value = '';
            openModal('link-modal');
        });

        $('#save-link-btn').addEventListener('click', () => {
            const name = $('#link-name').value.trim();
            const url = $('#link-url').value.trim();
            if (name && url) {
                addQuickLink(name, url);
                closeModal('link-modal');
            }
        });

        // Edit Link
        $('#update-link-btn').addEventListener('click', () => {
            const index = parseInt($('#edit-link-index').value);
            const name = $('#edit-link-name').value.trim();
            const url = $('#edit-link-url').value.trim();
            if (name && url) {
                updateQuickLink(index, name, url);
                closeModal('edit-link-modal');
            }
        });

        $('#delete-link-btn').addEventListener('click', () => {
            const index = parseInt($('#edit-link-index').value);
            deleteQuickLink(index);
            closeModal('edit-link-modal');
        });

        // Move link left / right (preserve inputs if edited)
        $('#move-link-left-btn').addEventListener('click', () => {
            const idx = parseInt($('#edit-link-index').value);
            if (!isNaN(idx) && idx > 0 && settings.quickLinks[idx]) {
                const currentName = $('#edit-link-name').value.trim();
                const currentUrl = $('#edit-link-url').value.trim();
                if (currentName) settings.quickLinks[idx].name = currentName;
                if (currentUrl) settings.quickLinks[idx].url = currentUrl.startsWith('http') ? currentUrl : 'https://' + currentUrl;

                const item = settings.quickLinks.splice(idx, 1)[0];
                settings.quickLinks.splice(idx - 1, 0, item);
                saveSettings();
                renderQuickLinks();
                $('#edit-link-index').value = idx - 1;
                updateMoveButtons(idx - 1);
            }
        });

        $('#move-link-right-btn').addEventListener('click', () => {
            const idx = parseInt($('#edit-link-index').value);
            if (!isNaN(idx) && idx < settings.quickLinks.length - 1 && settings.quickLinks[idx]) {
                const currentName = $('#edit-link-name').value.trim();
                const currentUrl = $('#edit-link-url').value.trim();
                if (currentName) settings.quickLinks[idx].name = currentName;
                if (currentUrl) settings.quickLinks[idx].url = currentUrl.startsWith('http') ? currentUrl : 'https://' + currentUrl;

                const item = settings.quickLinks.splice(idx, 1)[0];
                settings.quickLinks.splice(idx + 1, 0, item);
                saveSettings();
                renderQuickLinks();
                $('#edit-link-index').value = idx + 1;
                updateMoveButtons(idx + 1);
            }
        });

        // Modal close buttons
        $$('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                closeModal(btn.dataset.modal);
            });
        });

        // Close modals on overlay click
        $$('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                }
            });
        });

        // Close modal on button with data-modal
        $$('.btn-secondary[data-modal]').forEach(btn => {
            btn.addEventListener('click', () => {
                closeModal(btn.dataset.modal);
            });
        });

        // Settings button
        if (DOM.settingsBtn) {
            DOM.settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                    populateSettingsPanel();
                } catch (err) {
                    console.error('Settings populate error:', err);
                }
                openModal('settings-overlay');
            });
        }

        // Settings tabs
        $$('.settings-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                $$('.settings-tab').forEach(t => t.classList.remove('active'));
                $$('.settings-tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                $(`#tab-${tab.dataset.tab}`).classList.add('active');
            });
        });

        // ---- Background settings ----
        $$('.bg-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                settings.bgType = btn.dataset.bgType;
                setBgTypeActive(settings.bgType);
                applyBackground();
                saveSettings();
            });
        });

        // Solid color
        syncColorPickers('bg-color', (val) => {
            settings.bgColor = val;
            applyBackground();
            saveSettings();
        });

        // Gradient
        syncColorPickers('gradient-start', (val) => {
            settings.gradientStart = val;
            applyBackground();
            saveSettings();
        });

        syncColorPickers('gradient-end', (val) => {
            settings.gradientEnd = val;
            applyBackground();
            saveSettings();
        });

        $('#gradient-direction').addEventListener('change', (e) => {
            settings.gradientDirection = e.target.value;
            applyBackground();
            saveSettings();
        });

        // Background image processing with IndexedDB persistence
        const uploadArea = $('#file-upload-area');

        function processBgImage(file) {
            if (!file || !file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const dataUrl = ev.target.result;
                settings.bgImage = dataUrl;
                settings.bgType = 'image';
                setBgTypeActive('image');
                $('#bg-preview-img').src = dataUrl;
                $('#bg-image-preview').classList.remove('hidden');
                uploadArea.classList.add('hidden');
                applyBackground();
                saveSettings();
                await saveBgImageToDB(dataUrl);
            };
            reader.readAsDataURL(file);
        }

        $('#bg-image-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) processBgImage(file);
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--accent-color)';
            uploadArea.style.background = 'rgba(108, 99, 255, 0.1)';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '';
            uploadArea.style.background = '';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '';
            uploadArea.style.background = '';
            const file = e.dataTransfer.files[0];
            if (file) processBgImage(file);
        });

        $('#remove-bg-image').addEventListener('click', async () => {
            settings.bgImage = null;
            settings.bgType = 'solid';
            setBgTypeActive('solid');
            $('#bg-image-preview').classList.add('hidden');
            uploadArea.classList.remove('hidden');
            $('#bg-image-input').value = '';
            applyBackground();
            saveSettings();
            await clearBgImageFromDB();
        });

        $('#bg-image-opacity').addEventListener('input', (e) => {
            settings.bgImageOpacity = parseInt(e.target.value);
            $('#bg-image-opacity-value').textContent = settings.bgImageOpacity + '%';
            applyBackground();
            saveSettings();
        });

        if ($('#bg-blur')) {
            $('#bg-blur').addEventListener('input', (e) => {
                settings.bgBlur = parseInt(e.target.value);
                $('#bg-blur-value').textContent = settings.bgBlur + 'px';
                applyBackground();
                saveSettings();
            });
        }

        // Preset backgrounds
        $$('.preset-item').forEach(item => {
            item.addEventListener('click', () => {
                settings.bgType = 'gradient';
                settings.gradientStart = item.dataset.start;
                settings.gradientEnd = item.dataset.end;
                settings.gradientDirection = item.dataset.dir;
                setBgTypeActive('gradient');
                $('#gradient-start').value = settings.gradientStart;
                $('#gradient-start-text').value = settings.gradientStart;
                $('#gradient-end').value = settings.gradientEnd;
                $('#gradient-end-text').value = settings.gradientEnd;
                $('#gradient-direction').value = settings.gradientDirection;

                $$('.preset-item').forEach(p => p.classList.remove('active'));
                item.classList.add('active');

                applyBackground();
                saveSettings();
            });
        });

        // ---- Font settings ----
        $('#font-family').addEventListener('change', (e) => {
            settings.fontFamily = e.target.value;
            applyFont();
            saveSettings();
        });

        // ---- Sizes settings ----
        const sizeConfigs = [
            ['clock-size', 'clockSize', 'px', false],
            ['greeting-size', 'greetingSize', 'px', false],
            ['search-scale', 'searchScale', '%', true],
            ['search-width', 'searchWidth', 'px', false],
            ['links-scale', 'linksScale', '%', true],
            ['date-size', 'dateSize', 'px', false],
        ];

        sizeConfigs.forEach(([id, key, unit, prefixUnit]) => {
            const input = $(`#${id}`);
            const valEl = $(`#${id}-value`);
            if (input) {
                input.addEventListener('input', (e) => {
                    const val = parseInt(e.target.value);
                    settings[key] = val;
                    if (valEl) valEl.textContent = prefixUnit ? (unit + val) : (val + unit);
                    applyFont();
                    saveSettings();
                });
            }
        });

        $('#clock-weight').addEventListener('change', (e) => {
            settings.clockWeight = e.target.value;
            applyFont();
            saveSettings();
        });

        $('#show-greeting').addEventListener('change', (e) => {
            settings.showGreeting = e.target.checked;
            updateClock();
            saveSettings();
        });

        $('#time-format-24').addEventListener('change', (e) => {
            settings.timeFormat24 = e.target.checked;
            updateClock();
            saveSettings();
        });

        $('#show-seconds').addEventListener('change', (e) => {
            settings.showSeconds = e.target.checked;
            updateClock();
            saveSettings();
        });

        // ---- Color settings ----
        const colorMappings = [
            ['clock-color', 'clockColor', applyColors],
            ['greeting-color', 'greetingColor', applyColors],
            ['search-bg-color', 'searchBgColor', applyColors],
            ['search-border-color', 'searchBorderColor', applyColors],
            ['search-text-color', 'searchTextColor', applyColors],
            ['link-bg-color', 'linkBgColor', applyColors],
            ['link-text-color', 'linkTextColor', applyColors],
            ['date-color', 'dateColor', applyColors],
            ['accent-color', 'accentColor', applyColors],
        ];

        colorMappings.forEach(([id, key, applyFn]) => {
            syncColorPickers(id, (val) => {
                settings[key] = val;
                applyFn();
                saveSettings();
            });
        });

        $('#reset-colors-btn').addEventListener('click', () => {
            const colorKeys = ['clockColor', 'greetingColor', 'searchBgColor', 'searchBorderColor',
                'searchTextColor', 'linkBgColor', 'linkTextColor', 'dateColor', 'accentColor'];
            colorKeys.forEach(key => {
                settings[key] = DEFAULTS[key];
            });
            applyColors();
            populateSettingsPanel();
            saveSettings();
        });

        // ---- Positions settings ----
        const posInputConfigs = [
            ['clock-vertical', 'clockVertical'],
            ['clock-horizontal', 'clockHorizontal'],
            ['search-vertical', 'searchVertical'],
            ['search-horizontal', 'searchHorizontal'],
            ['links-vertical', 'linksVertical'],
            ['links-horizontal', 'linksHorizontal'],
            ['date-vertical', 'dateVertical'],
            ['date-horizontal', 'dateHorizontal'],
        ];

        posInputConfigs.forEach(([id, key]) => {
            const input = $(`#${id}`);
            const valEl = $(`#${id}-value`);
            if (input) {
                input.addEventListener('input', (e) => {
                    const val = parseInt(e.target.value);
                    settings[key] = val;
                    if (valEl) valEl.textContent = `${val}%`;
                    applyLayout();
                    saveSettings();
                });
            }
        });

        $('#show-date').addEventListener('change', (e) => {
            settings.showDate = e.target.checked;
            applyLayout();
            saveSettings();
        });

        // Reset all
        $('#reset-all-btn').addEventListener('click', async () => {
            if (confirm('Tüm ayarlar sıfırlanacak. Emin misiniz?')) {
                localStorage.removeItem('newTabSettings');
                await clearBgImageFromDB();
                settings = JSON.parse(JSON.stringify(DEFAULTS));
                applyAllSettings();
                populateSettingsPanel();
            }
        });

        // Right edge detection for settings button
        let settingsTimeout = null;
        document.addEventListener('mousemove', (e) => {
            const isNearRightEdge = e.clientX >= (window.innerWidth - 140);
            if (isNearRightEdge || (DOM.settingsBtn && DOM.settingsBtn.matches(':hover'))) {
                if (DOM.settingsBtn) DOM.settingsBtn.classList.add('visible');
                if (settingsTimeout) clearTimeout(settingsTimeout);
            } else {
                if (settingsTimeout) clearTimeout(settingsTimeout);
                settingsTimeout = setTimeout(() => {
                    if (DOM.settingsBtn && !DOM.settingsBtn.matches(':hover')) {
                        DOM.settingsBtn.classList.remove('visible');
                    }
                }, 600);
            }
        });

        // Keyboard shortcut to focus search
        document.addEventListener('keydown', (e) => {
            // Focus search on typing if no modal is open and no input is focused
            const activeTag = document.activeElement.tagName.toLowerCase();
            const isModalOpen = document.querySelector('.modal-overlay.active');

            if (!isModalOpen && activeTag !== 'input' && activeTag !== 'textarea' && activeTag !== 'select') {
                if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    DOM.searchInput.focus();
                }
            }

            // Escape to close modals
            if (e.key === 'Escape') {
                $$('.modal-overlay.active').forEach(m => m.classList.remove('active'));
            }
        });

        // Enter in link modals
        $('#link-name').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') $('#link-url').focus();
        });
        $('#link-url').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') $('#save-link-btn').click();
        });
        $('#edit-link-name').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') $('#edit-link-url').focus();
        });
        $('#edit-link-url').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') $('#update-link-btn').click();
        });
    }

    // ========================================
    // Helper: Sync color picker & text input
    // ========================================
    function syncColorPickers(baseId, onChange) {
        const colorInput = $(`#${baseId}`);
        const textInput = $(`#${baseId}-text`);

        colorInput.addEventListener('input', (e) => {
            const val = e.target.value;
            textInput.value = val;
            onChange(val);
        });

        textInput.addEventListener('input', (e) => {
            let val = e.target.value.trim();
            if (!val.startsWith('#')) val = '#' + val;
            if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                colorInput.value = val;
                onChange(val);
            }
        });

        textInput.addEventListener('blur', (e) => {
            let val = e.target.value.trim();
            if (!val.startsWith('#')) val = '#' + val;
            if (!/^#[0-9a-fA-F]{6}$/.test(val)) {
                textInput.value = colorInput.value;
            }
        });
    }

    // ========================================
    // Color Utility Functions
    // ========================================
    function hexToRgba(hex, alpha) {
        if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return `rgba(26, 26, 46, ${alpha})`;
        let cleanHex = hex.trim();
        if (cleanHex.length === 4) {
            cleanHex = '#' + cleanHex[1] + cleanHex[1] + cleanHex[2] + cleanHex[2] + cleanHex[3] + cleanHex[3];
        }
        if (cleanHex.length !== 7) return `rgba(26, 26, 46, ${alpha})`;
        const r = parseInt(cleanHex.slice(1, 3), 16) || 0;
        const g = parseInt(cleanHex.slice(3, 5), 16) || 0;
        const b = parseInt(cleanHex.slice(5, 7), 16) || 0;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function darkenColor(hex, percent) {
        if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return '#5a52e0';
        let cleanHex = hex.trim();
        if (cleanHex.length === 4) {
            cleanHex = '#' + cleanHex[1] + cleanHex[1] + cleanHex[2] + cleanHex[2] + cleanHex[3] + cleanHex[3];
        }
        if (cleanHex.length !== 7) return '#5a52e0';
        const r = Math.max(0, (parseInt(cleanHex.slice(1, 3), 16) || 0) - Math.round(255 * percent / 100));
        const g = Math.max(0, (parseInt(cleanHex.slice(3, 5), 16) || 0) - Math.round(255 * percent / 100));
        const b = Math.max(0, (parseInt(cleanHex.slice(5, 7), 16) || 0) - Math.round(255 * percent / 100));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    // ========================================
    // Initialize
    // ========================================
    async function init() {
        loadSettings();

        // Load custom background image from IndexedDB
        try {
            const savedImage = await loadBgImageFromDB();
            if (savedImage) {
                settings.bgImage = savedImage;
            }
        } catch (e) {
            console.warn('Could not load background image from IndexedDB:', e);
        }

        applyAllSettings();
        startClock();
        setupEventListeners();

        // Focus search input after a brief delay
        setTimeout(() => {
            DOM.searchInput.focus();
        }, 300);
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
