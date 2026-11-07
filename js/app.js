/**
 * Özel Yeni Sekme (New Tab) - Ana Uygulama Betiği
 * Saat, tarih, Google araması, hızlı erişim kısayolları ve özelleştirme yönetimi.
 * Harici bağımlılık veya modül gerektirmez; file:/// veya eklenti ortamında sorunsuz çalışır.
 */

(function () {
  'use strict';

  // =========================================================================
  // SABİTLER VE VARSAYILANLAR
  // =========================================================================

  const DB_NAME = 'CustomNewTabDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'wallpapers';
  const WALLPAPER_KEY = 'active_wallpaper';

  const DEFAULT_SHORTCUTS = [
    { id: '1', title: 'Google', url: 'https://www.google.com' },
    { id: '2', title: 'YouTube', url: 'https://www.youtube.com' },
    { id: '3', title: 'GitHub', url: 'https://github.com' },
    { id: '4', title: 'Wikipedia', url: 'https://tr.wikipedia.org' },
    { id: '5', title: 'Reddit', url: 'https://www.reddit.com' },
    { id: '6', title: 'Twitter / X', url: 'https://x.com' }
  ];

  const PRESET_BACKGROUNDS = [
    {
      name: 'Gece Gökyüzü',
      background: 'radial-gradient(circle at 20% 20%, #1e1e38 0%, #0d0f18 100%)'
    },
    {
      name: 'Kozmik Mor',
      background: 'linear-gradient(135deg, #1f0036 0%, #120c1f 50%, #080312 100%)'
    },
    {
      name: 'Derin Okyanus',
      background: 'linear-gradient(135deg, #09203f 0%, #537895 100%)'
    },
    {
      name: 'Gün Batımı Işıltısı',
      background: 'linear-gradient(135deg, #2b1055 0%, #7597de 100%)'
    },
    {
      name: 'Zümrüt Yeşili',
      background: 'linear-gradient(135deg, #0b2b1a 0%, #16422b 50%, #08140c 100%)'
    },
    {
      name: 'Koyu Minimal',
      background: 'linear-gradient(135deg, #121316 0%, #1a1c23 100%)'
    }
  ];

  const DEFAULT_SETTINGS = {
    clockFormat24: true,
    showSeconds: false,
    overlayOpacity: 0.35,
    blurAmount: 0,
    wallpaperType: 'preset',
    gradientIndex: 0
  };

  // =========================================================================
  // DEPOLAMA YÖNETİMİ (STORAGE & INDEXEDDB)
  // =========================================================================

  const isChromeStorage =
    typeof chrome !== 'undefined' &&
    chrome.storage &&
    chrome.storage.local;

  function openDB() {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  async function saveWallpaperToDB(imageData) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(imageData, WALLPAPER_KEY);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('IndexedDB kayıt başarısız, localStorage deneniyor:', err);
      try {
        localStorage.setItem('custom_wallpaper_data', imageData);
        return true;
      } catch (localErr) {
        console.error('LocalStorage da yetersiz:', localErr);
        throw localErr;
      }
    }
  }

  async function getWallpaperFromDB() {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(WALLPAPER_KEY);
        req.onsuccess = () => {
          if (req.result) resolve(req.result);
          else resolve(localStorage.getItem('custom_wallpaper_data'));
        };
        req.onerror = () => resolve(localStorage.getItem('custom_wallpaper_data'));
      });
    } catch (err) {
      return localStorage.getItem('custom_wallpaper_data');
    }
  }

  async function removeWallpaperFromDB() {
    try {
      localStorage.removeItem('custom_wallpaper_data');
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(WALLPAPER_KEY);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('IndexedDB temizleme:', err);
    }
  }

  async function getSettings() {
    if (isChromeStorage) {
      return new Promise((resolve) => {
        chrome.storage.local.get(['settings'], (res) => {
          resolve({ ...DEFAULT_SETTINGS, ...(res.settings || {}) });
        });
      });
    } else {
      try {
        const raw = localStorage.getItem('tab_settings');
        return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
      } catch (e) {
        return { ...DEFAULT_SETTINGS };
      }
    }
  }

  async function saveSettings(newSettings) {
    const current = await getSettings();
    const updated = { ...current, ...newSettings };
    if (isChromeStorage) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ settings: updated }, () => resolve(updated));
      });
    } else {
      localStorage.setItem('tab_settings', JSON.stringify(updated));
      return updated;
    }
  }

  async function getShortcuts() {
    if (isChromeStorage) {
      return new Promise((resolve) => {
        chrome.storage.local.get(['shortcuts'], (res) => {
          resolve(res.shortcuts || DEFAULT_SHORTCUTS);
        });
      });
    } else {
      try {
        const raw = localStorage.getItem('tab_shortcuts');
        return raw ? JSON.parse(raw) : DEFAULT_SHORTCUTS;
      } catch (e) {
        return DEFAULT_SHORTCUTS;
      }
    }
  }

  async function saveShortcuts(shortcuts) {
    if (isChromeStorage) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ shortcuts }, () => resolve(shortcuts));
      });
    } else {
      localStorage.setItem('tab_shortcuts', JSON.stringify(shortcuts));
      return shortcuts;
    }
  }

  // =========================================================================
  // DOM ELEMENTLERİ
  // =========================================================================

  const clockTimeEl = document.getElementById('clock-time');
  const clockSecondsEl = document.getElementById('clock-seconds');
  const clockPeriodEl = document.getElementById('clock-period');
  const dateDisplayEl = document.getElementById('date-display');

  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');

  const shortcutsGrid = document.getElementById('shortcuts-grid');
  const shortcutDialog = document.getElementById('shortcut-dialog');
  const shortcutForm = document.getElementById('shortcut-form');
  const shortcutTitleInput = document.getElementById('shortcut-title-input');
  const shortcutUrlInput = document.getElementById('shortcut-url-input');
  const dialogTitle = document.getElementById('dialog-title');
  const cancelDialogBtn = document.getElementById('cancel-dialog-btn');

  const customizeBtn = document.getElementById('customize-btn');
  const customizeDrawer = document.getElementById('customize-drawer');
  const closeDrawerBtn = document.getElementById('close-drawer-btn');
  const drawerBackdrop = document.getElementById('drawer-backdrop');

  const wallpaperFileInput = document.getElementById('wallpaper-file-input');
  const dropZone = document.getElementById('upload-drop-zone');
  const resetWallpaperBtn = document.getElementById('reset-wallpaper-btn');
  const presetListContainer = document.getElementById('preset-list');

  const opacitySlider = document.getElementById('opacity-slider');
  const opacityValue = document.getElementById('opacity-value');
  const blurSlider = document.getElementById('blur-slider');
  const blurValue = document.getElementById('blur-value');

  const clockFormatToggle = document.getElementById('clock-format-toggle');
  const showSecondsToggle = document.getElementById('show-seconds-toggle');

  const bgLayer = document.getElementById('bg-layer');
  const bgOverlay = document.getElementById('bg-overlay');

  let currentSettings = null;
  let shortcutsList = [];
  let currentEditingId = null;

  // =========================================================================
  // SAAT VE TARİH YÖNETİMİ
  // =========================================================================

  function updateClock() {
    if (!clockTimeEl) return;
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    let period = '';
    const is24 = currentSettings ? currentSettings.clockFormat24 : true;
    if (!is24) {
      period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
    }

    const hoursStr = String(hours).padStart(2, '0');
    clockTimeEl.textContent = `${hoursStr}:${minutes}`;

    if (clockSecondsEl) {
      if (currentSettings && currentSettings.showSeconds) {
        clockSecondsEl.textContent = `:${seconds}`;
        clockSecondsEl.style.display = 'inline';
      } else {
        clockSecondsEl.style.display = 'none';
      }
    }

    if (clockPeriodEl) {
      if (!is24) {
        clockPeriodEl.textContent = ` ${period}`;
        clockPeriodEl.style.display = 'inline';
      } else {
        clockPeriodEl.style.display = 'none';
      }
    }
  }

  function updateDate() {
    if (!dateDisplayEl) return;
    const now = new Date();
    const dayName = new Intl.DateTimeFormat('tr-TR', { weekday: 'long' }).format(now);
    const dateFormatted = new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(now);

    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    dateDisplayEl.textContent = `${capitalizedDay}, ${dateFormatted}`;
  }

  // =========================================================================
  // GOOGLE ARAMA ÇUBUĞU
  // =========================================================================

  function handleSearch(e) {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;

    // URL kontrolü (örn: github.com veya https://...)
    const isUrl =
      /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i.test(query) &&
      !query.includes(' ');

    if (isUrl) {
      const targetUrl = /^https?:\/\//i.test(query) ? query : `https://${query}`;
      window.location.href = targetUrl;
      return;
    }

    // Google Araması
    window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }

  function updateSearchClearButton() {
    if (!searchClearBtn || !searchInput) return;
    if (searchInput.value.length > 0) {
      searchClearBtn.classList.add('visible');
    } else {
      searchClearBtn.classList.remove('visible');
    }
  }

  // =========================================================================
  // HIZLI ERİŞİM KISAYOLLARI
  // =========================================================================

  function normalizeUrl(url) {
    let trimmed = url.trim();
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = 'https://' + trimmed;
    }
    return trimmed;
  }

  function extractTitleFromUrl(url) {
    try {
      const parsed = new URL(normalizeUrl(url));
      const host = parsed.hostname.replace(/^www\./, '');
      return host.charAt(0).toUpperCase() + host.slice(1);
    } catch (e) {
      return 'Yeni Link';
    }
  }

  function getFaviconUrl(url) {
    try {
      const domain = new URL(normalizeUrl(url)).origin;
      return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(domain)}`;
    } catch (e) {
      return '';
    }
  }

  function renderShortcuts() {
    if (!shortcutsGrid) return;
    shortcutsGrid.innerHTML = '';

    shortcutsList.forEach((shortcut) => {
      const tile = document.createElement('div');
      tile.className = 'shortcut-tile';
      tile.dataset.id = shortcut.id;

      const link = document.createElement('a');
      link.href = shortcut.url;
      link.className = 'shortcut-link';
      link.target = '_self';

      const iconContainer = document.createElement('div');
      iconContainer.className = 'shortcut-icon-wrapper';

      const faviconUrl = getFaviconUrl(shortcut.url);
      const img = document.createElement('img');
      img.src = faviconUrl;
      img.alt = shortcut.title;
      img.className = 'shortcut-favicon';
      img.loading = 'lazy';

      img.onerror = () => {
        img.style.display = 'none';
        const fallbackBadge = document.createElement('div');
        fallbackBadge.className = 'shortcut-fallback-badge';
        fallbackBadge.textContent = (shortcut.title || 'W').charAt(0).toUpperCase();
        iconContainer.appendChild(fallbackBadge);
      };

      iconContainer.appendChild(img);

      const title = document.createElement('span');
      title.className = 'shortcut-title';
      title.textContent = shortcut.title;
      title.title = shortcut.title;

      link.appendChild(iconContainer);
      link.appendChild(title);
      tile.appendChild(link);

      // Düzenle / Sil butonları
      const actions = document.createElement('div');
      actions.className = 'shortcut-actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'shortcut-btn edit-btn';
      editBtn.title = 'Düzenle';
      editBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      `;
      editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openEditModal(shortcut);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'shortcut-btn delete-btn';
      deleteBtn.title = 'Sil';
      deleteBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      `;
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        deleteShortcut(shortcut.id);
      });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
      tile.appendChild(actions);

      shortcutsGrid.appendChild(tile);
    });

    // "+ Kısayol Ekle" Butonu
    const addTile = document.createElement('button');
    addTile.type = 'button';
    addTile.className = 'shortcut-tile add-shortcut-tile';
    addTile.title = 'Yeni Kısayol Ekle';
    addTile.innerHTML = `
      <div class="shortcut-icon-wrapper add-icon-wrapper">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>
      <span class="shortcut-title">Kısayol Ekle</span>
    `;
    addTile.addEventListener('click', openAddModal);
    shortcutsGrid.appendChild(addTile);
  }

  function openAddModal() {
    currentEditingId = null;
    dialogTitle.textContent = 'Yeni Kısayol Ekle';
    shortcutTitleInput.value = '';
    shortcutUrlInput.value = '';
    if (typeof shortcutDialog.showModal === 'function') {
      shortcutDialog.showModal();
    } else {
      shortcutDialog.setAttribute('open', '');
    }
    shortcutUrlInput.focus();
  }

  function openEditModal(shortcut) {
    currentEditingId = shortcut.id;
    dialogTitle.textContent = 'Kısayolu Düzenle';
    shortcutTitleInput.value = shortcut.title;
    shortcutUrlInput.value = shortcut.url;
    if (typeof shortcutDialog.showModal === 'function') {
      shortcutDialog.showModal();
    } else {
      shortcutDialog.setAttribute('open', '');
    }
    shortcutTitleInput.focus();
  }

  function closeModal() {
    if (typeof shortcutDialog.close === 'function') {
      shortcutDialog.close();
    } else {
      shortcutDialog.removeAttribute('open');
    }
    currentEditingId = null;
  }

  async function deleteShortcut(id) {
    shortcutsList = shortcutsList.filter((s) => s.id !== id);
    await saveShortcuts(shortcutsList);
    renderShortcuts();
  }

  async function handleShortcutSubmit(e) {
    e.preventDefault();
    let url = shortcutUrlInput.value.trim();
    if (!url) return;

    url = normalizeUrl(url);
    let title = shortcutTitleInput.value.trim();
    if (!title) {
      title = extractTitleFromUrl(url);
    }

    if (currentEditingId) {
      shortcutsList = shortcutsList.map((s) =>
        s.id === currentEditingId ? { ...s, title, url } : s
      );
    } else {
      shortcutsList.push({
        id: Date.now().toString(),
        title,
        url
      });
    }

    await saveShortcuts(shortcutsList);
    renderShortcuts();
    closeModal();
  }

  // =========================================================================
  // ÖZELLEŞTİRME VE ARKA PLAN YÖNETİMİ
  // =========================================================================

  async function applyBackground() {
    if (!currentSettings) return;

    document.documentElement.style.setProperty(
      '--overlay-opacity',
      currentSettings.overlayOpacity
    );
    document.documentElement.style.setProperty(
      '--blur-amount',
      `${currentSettings.blurAmount}px`
    );

    if (currentSettings.wallpaperType === 'custom') {
      const customImgData = await getWallpaperFromDB();
      if (customImgData) {
        bgLayer.style.background = `url("${customImgData}") center / cover no-repeat`;
        return;
      }
    }

    if (currentSettings.wallpaperType === 'preset') {
      const preset =
        PRESET_BACKGROUNDS[currentSettings.gradientIndex] || PRESET_BACKGROUNDS[0];
      bgLayer.style.background = preset.background;
      return;
    }

    bgLayer.style.background = PRESET_BACKGROUNDS[0].background;
  }

  function renderPresets() {
    if (!presetListContainer) return;
    presetListContainer.innerHTML = '';

    PRESET_BACKGROUNDS.forEach((preset, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preset-item-btn';
      btn.title = preset.name;
      btn.style.background = preset.background;

      if (
        currentSettings.wallpaperType === 'preset' &&
        currentSettings.gradientIndex === index
      ) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', async () => {
        currentSettings.wallpaperType = 'preset';
        currentSettings.gradientIndex = index;
        await saveSettings({
          wallpaperType: 'preset',
          gradientIndex: index
        });
        await applyBackground();
        highlightActivePreset(index);
      });

      presetListContainer.appendChild(btn);
    });
  }

  function highlightActivePreset(index) {
    if (!presetListContainer) return;
    const buttons = presetListContainer.querySelectorAll('.preset-item-btn');
    buttons.forEach((btn, i) => {
      if (i === index) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }

  function processImageFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Lütfen geçerli bir resim dosyası seçin (PNG, JPG, WebP vb.).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      try {
        await saveWallpaperToDB(dataUrl);
        currentSettings.wallpaperType = 'custom';
        await saveSettings({ wallpaperType: 'custom' });
        await applyBackground();
        highlightActivePreset(-1);
      } catch (err) {
        console.error('Arka plan resmi kaydedilemedi:', err);
        alert('Resim kaydedilirken bir sorun oluştu.');
      }
    };
    reader.readAsDataURL(file);
  }

  function openDrawer() {
    customizeDrawer.classList.add('open');
    drawerBackdrop.classList.add('active');
  }

  function closeDrawer() {
    customizeDrawer.classList.remove('open');
    drawerBackdrop.classList.remove('active');
  }

  // =========================================================================
  // BAŞLATMA (INIT)
  // =========================================================================

  async function init() {
    currentSettings = await getSettings();
    shortcutsList = await getShortcuts();

    // Saat ve Tarih
    updateClock();
    updateDate();
    setInterval(updateClock, 1000);
    setInterval(updateDate, 60000);

    // Arama
    if (searchForm) searchForm.addEventListener('submit', handleSearch);
    if (searchInput) {
      searchInput.addEventListener('input', updateSearchClearButton);
      searchInput.focus();
    }
    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        updateSearchClearButton();
        searchInput.focus();
      });
    }

    // Kısayollar
    renderShortcuts();
    if (shortcutForm) shortcutForm.addEventListener('submit', handleShortcutSubmit);
    if (cancelDialogBtn) cancelDialogBtn.addEventListener('click', closeModal);
    if (shortcutDialog) {
      shortcutDialog.addEventListener('click', (e) => {
        if (e.target === shortcutDialog) {
          closeModal();
        }
      });
    }

    // Özelleştirme Çekmecesi Olayları
    if (customizeBtn) customizeBtn.addEventListener('click', openDrawer);
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);

    // Resim Seçici
    if (wallpaperFileInput) {
      wallpaperFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          processImageFile(e.target.files[0]);
        }
      });
    }

    // Sürükle Bırak
    if (dropZone) {
      dropZone.addEventListener('click', () => wallpaperFileInput.click());
      ['dragenter', 'dragover'].forEach((eventName) => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropZone.classList.add('dragover');
        });
      });
      ['dragleave', 'drop'].forEach((eventName) => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropZone.classList.remove('dragover');
        });
      });
      dropZone.addEventListener('drop', (e) => {
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          processImageFile(e.dataTransfer.files[0]);
        }
      });
    }

    // Varsayılana Sıfırla
    if (resetWallpaperBtn) {
      resetWallpaperBtn.addEventListener('click', async () => {
        await removeWallpaperFromDB();
        currentSettings.wallpaperType = 'preset';
        currentSettings.gradientIndex = 0;
        await saveSettings({
          wallpaperType: 'preset',
          gradientIndex: 0
        });
        await applyBackground();
        highlightActivePreset(0);
      });
    }

    // Sürgüler
    if (opacitySlider) {
      opacitySlider.value = Math.round(currentSettings.overlayOpacity * 100);
      opacityValue.textContent = `${opacitySlider.value}%`;

      opacitySlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10) / 100;
        opacityValue.textContent = `${e.target.value}%`;
        currentSettings.overlayOpacity = val;
        document.documentElement.style.setProperty('--overlay-opacity', val);
      });

      opacitySlider.addEventListener('change', async (e) => {
        const val = parseInt(e.target.value, 10) / 100;
        await saveSettings({ overlayOpacity: val });
      });
    }

    if (blurSlider) {
      blurSlider.value = currentSettings.blurAmount;
      blurValue.textContent = `${blurSlider.value}px`;

      blurSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        blurValue.textContent = `${val}px`;
        currentSettings.blurAmount = val;
        document.documentElement.style.setProperty('--blur-amount', `${val}px`);
      });

      blurSlider.addEventListener('change', async (e) => {
        const val = parseInt(e.target.value, 10);
        await saveSettings({ blurAmount: val });
      });
    }

    // Saat Format Ayarları
    if (clockFormatToggle) {
      clockFormatToggle.checked = currentSettings.clockFormat24;
      clockFormatToggle.addEventListener('change', async (e) => {
        currentSettings.clockFormat24 = e.target.checked;
        await saveSettings({ clockFormat24: e.target.checked });
        updateClock();
      });
    }

    if (showSecondsToggle) {
      showSecondsToggle.checked = currentSettings.showSeconds;
      showSecondsToggle.addEventListener('change', async (e) => {
        currentSettings.showSeconds = e.target.checked;
        await saveSettings({ showSeconds: e.target.checked });
        updateClock();
      });
    }

    // Klavye Kısayolları (Escape ile kapatma, / ile aramaya odaklanma)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDrawer();
        closeModal();
      } else if (
        e.key === '/' &&
        document.activeElement !== searchInput &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInput.focus();
      }
    });

    // Hazır temalar ve arka planı uygula
    renderPresets();
    await applyBackground();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
