import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// App version for cache management
const APP_VERSION = "3.0.0";
const VERSION_KEY = "app-version";

// Force clear all caches on version mismatch
async function clearAllCaches() {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('All caches cleared');
  }
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
    
    // Force reload to get fresh content
    window.location.reload();
  }
}

// Check version and clear cache if needed
checkAndClearCache().catch(err => console.error('Cache check failed:', err));

// Register Service Worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
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
