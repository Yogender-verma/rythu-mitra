// ==============================================================================
// INDEXED DB MANAGER FOR RYTHU MITRA OFFLINE DIAGNOSTIC HISTORY
// ==============================================================================
const DB_NAME = "RythuMitraOfflineDB";
const DB_VERSION = 1;
const STORE_NAME = "scans";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("created_at", "created_at", { unique: false });
        store.createIndex("crop", "crop", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save a scan result to IndexedDB
async function idbSaveScan(scan) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const scanWithTimestamp = {
        ...scan,
        id: scan.id || "offline_" + Date.now(),
        created_at: scan.created_at || new Date().toISOString()
      };
      const req = store.put(scanWithTimestamp);
      req.onsuccess = () => resolve(scanWithTimestamp);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("[IndexedDB] Save scan error:", e);
  }
}

// Get all stored scans from IndexedDB
async function idbGetAllScans() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result || [];
        // Sort descending by created_at
        list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("[IndexedDB] Get scans error:", e);
    return [];
  }
}

// Pre-cache voice note audio into Cache Storage API for offline playback
async function cacheAudioForOffline(audioUrl) {
  if (!audioUrl || !("caches" in window)) return;
  try {
    const cache = await caches.open("rythu-mitra-pwa-v1");
    const response = await fetch(audioUrl);
    if (response.ok) {
      await cache.put(audioUrl, response);
      console.log("[IndexedDB/Cache] Cached audio for offline use:", audioUrl);
    }
  } catch (e) {
    console.warn("[Cache] Audio offline caching skipped:", e);
  }
}

window.idbSaveScan = idbSaveScan;
window.idbGetAllScans = idbGetAllScans;
window.cacheAudioForOffline = cacheAudioForOffline;
