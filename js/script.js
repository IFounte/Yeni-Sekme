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
        bgImageBlur: 0,
        fontFamily: "'Inter', sans-serif",
        clockSize: 96,
        clockWeight: '600',
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
        contentAlign: 'center',
        clockPosition: 'above',
        linksPosition: 'below-search',
        searchWidth: 560,
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
    // LocalStorage Helpers
    // ========================================
    function loadSettings() {
        try {
            const saved = localStorage.getItem('newTabSettings');
            settings = saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
        } catch {
            settings = { ...DEFAULTS };
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem('newTabSettings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Settings could not be saved:', e);
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

    function renderQuickLinks() {
        DOM.quickLinks.innerHTML = '';
        settings.quickLinks.forEach((link, index) => {
            const el = document.createElement('a');
            el.className = 'quick-link';
            el.href = link.url;
            el.title = link.name;

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
            editBtn.className = 'quick-link-edit';
            editBtn.innerHTML = '<i class="fas fa-pen"></i>';
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

    function openEditLinkModal(index) {
        const link = settings.quickLinks[index];
        $('#edit-link-name').value = link.name;
        $('#edit-link-url').value = link.url;
        $('#edit-link-index').value = index;
        openModal('edit-link-modal');
    }

    // ========================================
    // Apply Settings to UI
    // ========================================
    function applyBackground() {
        DOM.bgOverlay.style.backgroundImage = '';
        DOM.bgOverlay.style.opacity = '';
        DOM.bgOverlay.style.filter = '';

        if (settings.bgType === 'solid') {
            DOM.body.style.background = settings.bgColor;
            DOM.bgOverlay.style.display = 'none';
        } else if (settings.bgType === 'gradient') {
            const dir = settings.gradientDirection;
            if (dir === 'circle') {
                DOM.body.style.background = `radial-gradient(circle, ${settings.gradientStart}, ${settings.gradientEnd})`;
            } else {
                DOM.body.style.background = `linear-gradient(${dir}, ${settings.gradientStart}, ${settings.gradientEnd})`;
            }
            DOM.bgOverlay.style.display = 'none';
        } else if (settings.bgType === 'image' && settings.bgImage) {
            DOM.body.style.background = settings.bgColor;
            DOM.bgOverlay.style.display = 'block';
            DOM.bgOverlay.style.backgroundImage = `url(${settings.bgImage})`;
            DOM.bgOverlay.style.opacity = settings.bgImageOpacity / 100;
            DOM.bgOverlay.style.filter = `blur(${settings.bgImageBlur}px)`;
            // Scale slightly to prevent blur edge artifacts
            if (settings.bgImageBlur > 0) {
                DOM.bgOverlay.style.transform = 'scale(1.05)';
            } else {
                DOM.bgOverlay.style.transform = '';
            }
        } else {
            DOM.body.style.background = settings.bgColor;
            DOM.bgOverlay.style.display = 'none';
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
        document.documentElement.style.setProperty('--font-family', settings.fontFamily);
        document.documentElement.style.setProperty('--clock-size', settings.clockSize + 'px');
        document.documentElement.style.setProperty('--clock-weight', settings.clockWeight);
    }

    function applyLayout() {
        DOM.mainContent.style.justifyContent = settings.contentAlign;

        // Clock position
        const searchContainer = DOM.searchContainer;
        const clockContainer = DOM.clockContainer;
        const linksContainer = DOM.quickLinksContainer;

        if (settings.clockPosition === 'below') {
            searchContainer.parentNode.insertBefore(searchContainer, clockContainer);
        } else {
            searchContainer.parentNode.insertBefore(clockContainer, searchContainer);
        }

        // Links position
        if (settings.linksPosition === 'bottom') {
            linksContainer.style.position = 'fixed';
            linksContainer.style.bottom = '60px';
            linksContainer.style.left = '50%';
            linksContainer.style.transform = 'translateX(-50%)';
        } else {
            linksContainer.style.position = '';
            linksContainer.style.bottom = '';
            linksContainer.style.left = '';
            linksContainer.style.transform = '';
        }

        // Search width
        document.documentElement.style.setProperty('--search-width', settings.searchWidth + 'px');

        // Date visibility
        DOM.dateContainer.style.display = settings.showDate ? '' : 'none';
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
        // Background
        setBgTypeActive(settings.bgType);
        $('#bg-color').value = settings.bgColor;
        $('#bg-color-text').value = settings.bgColor;
        $('#gradient-start').value = settings.gradientStart;
        $('#gradient-start-text').value = settings.gradientStart;
        $('#gradient-end').value = settings.gradientEnd;
        $('#gradient-end-text').value = settings.gradientEnd;
        $('#gradient-direction').value = settings.gradientDirection;
        $('#bg-image-opacity').value = settings.bgImageOpacity;
        $('#bg-image-opacity-value').textContent = settings.bgImageOpacity + '%';
        $('#bg-image-blur').value = settings.bgImageBlur;
        $('#bg-image-blur-value').textContent = settings.bgImageBlur + 'px';

        if (settings.bgImage) {
            $('#bg-preview-img').src = settings.bgImage;
            $('#bg-image-preview').classList.remove('hidden');
            $('#file-upload-area').classList.add('hidden');
        }

        // Font
        $('#font-family').value = settings.fontFamily;
        $('#clock-size').value = settings.clockSize;
        $('#clock-size-value').textContent = settings.clockSize + 'px';
        $('#clock-weight').value = settings.clockWeight;
        $('#show-greeting').checked = settings.showGreeting;
        $('#time-format-24').checked = settings.timeFormat24;
        $('#show-seconds').checked = settings.showSeconds;

        // Colors
        const colorFields = [
            ['clock-color', 'clockColor'],
            ['greeting-color', 'greetingColor'],
            ['search-bg-color', 'searchBgColor'],
            ['search-border-color', 'searchBorderColor'],
            ['search-text-color', 'searchTextColor'],
            ['link-bg-color', 'linkBgColor'],
            ['link-text-color', 'linkTextColor'],
            ['date-color', 'dateColor'],
            ['accent-color', 'accentColor'],
        ];

        colorFields.forEach(([id, key]) => {
            $(`#${id}`).value = settings[key];
            $(`#${id}-text`).value = settings[key];
        });

        // Layout
        $('#content-align').value = settings.contentAlign;
        $('#clock-position').value = settings.clockPosition;
        $('#links-position').value = settings.linksPosition;
        $('#search-width').value = settings.searchWidth;
        $('#search-width-value').textContent = settings.searchWidth + 'px';
        $('#show-date').checked = settings.showDate;
    }

    function setBgTypeActive(type) {
        $$('.bg-type-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.bgType === type));
        $('#bg-solid-options').classList.toggle('hidden', type !== 'solid');
        $('#bg-gradient-options').classList.toggle('hidden', type !== 'gradient');
        $('#bg-image-options').classList.toggle('hidden', type !== 'image');
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
        DOM.settingsBtn.addEventListener('click', () => {
            populateSettingsPanel();
            openModal('settings-overlay');
        });

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

        // Background image
        $('#bg-image-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    settings.bgImage = ev.target.result;
                    settings.bgType = 'image';
                    setBgTypeActive('image');
                    $('#bg-preview-img').src = ev.target.result;
                    $('#bg-image-preview').classList.remove('hidden');
                    $('#file-upload-area').classList.add('hidden');
                    applyBackground();
                    saveSettings();
                };
                reader.readAsDataURL(file);
            }
        });

        // Drag and drop
        const uploadArea = $('#file-upload-area');
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
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    settings.bgImage = ev.target.result;
                    settings.bgType = 'image';
                    setBgTypeActive('image');
                    $('#bg-preview-img').src = ev.target.result;
                    $('#bg-image-preview').classList.remove('hidden');
                    uploadArea.classList.add('hidden');
                    applyBackground();
                    saveSettings();
                };
                reader.readAsDataURL(file);
            }
        });

        $('#remove-bg-image').addEventListener('click', () => {
            settings.bgImage = null;
            settings.bgType = 'solid';
            setBgTypeActive('solid');
            $('#bg-image-preview').classList.add('hidden');
            $('#file-upload-area').classList.remove('hidden');
            $('#bg-image-input').value = '';
            applyBackground();
            saveSettings();
        });

        $('#bg-image-opacity').addEventListener('input', (e) => {
            settings.bgImageOpacity = parseInt(e.target.value);
            $('#bg-image-opacity-value').textContent = settings.bgImageOpacity + '%';
            applyBackground();
            saveSettings();
        });

        $('#bg-image-blur').addEventListener('input', (e) => {
            settings.bgImageBlur = parseInt(e.target.value);
            $('#bg-image-blur-value').textContent = settings.bgImageBlur + 'px';
            applyBackground();
            saveSettings();
        });

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

        $('#clock-size').addEventListener('input', (e) => {
            settings.clockSize = parseInt(e.target.value);
            $('#clock-size-value').textContent = settings.clockSize + 'px';
            applyFont();
            saveSettings();
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

        // ---- Layout settings ----
        $('#content-align').addEventListener('change', (e) => {
            settings.contentAlign = e.target.value;
            applyLayout();
            saveSettings();
        });

        $('#clock-position').addEventListener('change', (e) => {
            settings.clockPosition = e.target.value;
            applyLayout();
            saveSettings();
        });

        $('#links-position').addEventListener('change', (e) => {
            settings.linksPosition = e.target.value;
            applyLayout();
            saveSettings();
        });

        $('#search-width').addEventListener('input', (e) => {
            settings.searchWidth = parseInt(e.target.value);
            $('#search-width-value').textContent = settings.searchWidth + 'px';
            applyLayout();
            saveSettings();
        });

        $('#show-date').addEventListener('change', (e) => {
            settings.showDate = e.target.checked;
            applyLayout();
            saveSettings();
        });

        // Reset all
        $('#reset-all-btn').addEventListener('click', () => {
            if (confirm('Tüm ayarlar sıfırlanacak. Emin misiniz?')) {
                localStorage.removeItem('newTabSettings');
                settings = { ...DEFAULTS };
                applyAllSettings();
                populateSettingsPanel();
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
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function darkenColor(hex, percent) {
        const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - Math.round(255 * percent / 100));
        const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - Math.round(255 * percent / 100));
        const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - Math.round(255 * percent / 100));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    // ========================================
    // Initialize
    // ========================================
    function init() {
        loadSettings();
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
