// Storage shim for local testing: maps chrome.storage.local -> localStorage (Promise API)
// Only used when `chrome.storage.local` is not available (e.g., serving via http://127.0.0.1:5500/)
if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
  window.chrome = window.chrome || {};
  window.chrome.storage = window.chrome.storage || {};
  window.chrome.storage.local = {
    get: (keys) => new Promise((resolve) => {
      const result = {};
      if (typeof keys === 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          try { result[k] = JSON.parse(localStorage.getItem(k)); } catch { result[k] = localStorage.getItem(k); }
        }
      } else if (Array.isArray(keys)) {
        keys.forEach(k => {
          const v = localStorage.getItem(k);
          try { result[k] = v !== null ? JSON.parse(v) : undefined; } catch { result[k] = v; }
        });
      } else if (typeof keys === 'string') {
        const v = localStorage.getItem(keys);
        try { result[keys] = v !== null ? JSON.parse(v) : undefined; } catch { result[keys] = v; }
      } else if (typeof keys === 'object' && keys !== null) {
        Object.keys(keys).forEach(k => {
          const v = localStorage.getItem(k);
          try { result[k] = v !== null ? JSON.parse(v) : keys[k]; } catch { result[k] = v !== null ? localStorage.getItem(k) : keys[k]; }
        });
      }
      resolve(result);
    }),
    set: (items) => new Promise((resolve) => {
      Object.keys(items).forEach(k => {
        try { localStorage.setItem(k, JSON.stringify(items[k])); } catch { localStorage.setItem(k, String(items[k])); }
      });
      resolve();
    }),
    remove: (keys) => new Promise((resolve) => {
      if (Array.isArray(keys)) keys.forEach(k => localStorage.removeItem(k));
      else localStorage.removeItem(keys);
      resolve();
    })
  };
}
