import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// App version for cache management
const APP_VERSION = "3.2.0";
const VERSION_KEY = "app-version";

// Force clear all caches on version mismatch
async function clearAllCaches() {
  // Clear Service Worker caches
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('Service Worker caches cleared');
  }
  
  // Clear IndexedDB (React Query persistence)
  if ('indexedDB' in window) {
    try {
      const dbs = await window.indexedDB.databases();
      await Promise.all(
        dbs.map(db => {
          if (db.name) {
            return new Promise((resolve) => {
              const deleteRequest = window.indexedDB.deleteDatabase(db.name!);
              deleteRequest.onsuccess = () => resolve(undefined);
              deleteRequest.onerror = () => resolve(undefined);
            });
          }
          return Promise.resolve();
        })
      );
      console.log('IndexedDB cleared');
    } catch (error) {
      console.log('IndexedDB clear failed (non-critical):', error);
    }
  }
  
  console.log('All caches cleared');
}

// Clear localStorage if app version has changed
async function checkAndClearCache() {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  
  if (storedVersion !== APP_VERSION) {
    console.log(`App updated from ${storedVersion || 'unknown'} to ${APP_VERSION}`);
    
    // Clear ALL caches (Service Worker, HTTP Cache, etc.)
    await clearAllCaches();
    
    // Clear all localStorage except settings if needed
    const keysToPreserve = ['theme']; // Add any keys you want to preserve
    const preservedData: Record<string, string> = {};
    
    keysToPreserve.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) preservedData[key] = value;
    });
    
    // Clear localStorage
    localStorage.clear();
    
    // Restore preserved data
    Object.entries(preservedData).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    // Set new version
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    
    console.log('All caches and localStorage cleared for new version');
    
    // Force HARD reload to bypass all caches
    window.location.href = window.location.href.split('?')[0] + '?v=' + APP_VERSION + '&t=' + Date.now();
  }
}

// Unregister all old service workers on version mismatch
async function unregisterOldServiceWorkers() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('Old service worker unregistered');
    }
  }
}

// Check version and clear cache if needed
checkAndClearCache().catch(err => console.error('Cache check failed:', err));

// CRITICAL: Always unregister old service workers to force update
// This ensures stuck users on old versions can update
unregisterOldServiceWorkers().catch(err => console.error('SW unregister failed:', err));

// Register Service Worker for PWA with versioned URL
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    // Add version parameter to force reload of SW script
    navigator.serviceWorker.register('/sw.js?v=20251104')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Check for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                console.log('New service worker activated, reloading page...');
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
