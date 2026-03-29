import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App";
import "./index.css";

// App version for cache management
const APP_VERSION = __APP_VERSION__;
const VERSION_KEY = "app-version";

// Force clear all caches on version mismatch
async function clearAllCaches() {
  // Clear Service Worker caches
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
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
    } catch (error) {
    }
  }

}

// Clear localStorage if app version has changed
async function checkAndClearCache() {
  const storedVersion = localStorage.getItem(VERSION_KEY);

  if (storedVersion !== APP_VERSION) {

    // Clear ALL caches (Service Worker, HTTP Cache, etc.)
    await clearAllCaches();

    // Clear all localStorage except settings and native app data
    const keysToPreserve: string[] = [];
    // In native app, preserve all local storage data (quiz sessions, settings, etc.)
    if (Capacitor.isNativePlatform()) {
      const allKeys = Object.keys(localStorage);
      keysToPreserve.push(...allKeys.filter(k => k.startsWith('lid_')));
    }
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
    }
  }
}

// Check version and clear cache if needed

// CRITICAL: Always unregister old service workers to force update
// This ensures stuck users on old versions can update

// Register Service Worker for PWA (skip in native app - not needed)
if ('serviceWorker' in navigator && import.meta.env.PROD && !Capacitor.isNativePlatform()) {
  window.addEventListener('load', () => {
    // Add version parameter to force reload of SW script
    navigator.serviceWorker.register(`/sw.js?v=${APP_VERSION}`)
      .then((registration) => {

        // Check for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((registrationError) => {
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
