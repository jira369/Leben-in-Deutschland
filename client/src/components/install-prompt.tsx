import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`PWA install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Speichere in localStorage, dass der Nutzer das Prompt abgelehnt hat
    localStorage.setItem('installPromptDismissed', 'true');
  };

  // Prüfe ob der Nutzer das Prompt bereits abgelehnt hat
  useEffect(() => {
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (dismissed === 'true') {
      setShowInstallPrompt(false);
    }
  }, []);

  if (!showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <Download className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="font-semibold text-sm">App installieren</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Installieren Sie die Einbürgerungstest-App für schnelleren Zugriff und bessere Performance.
      </p>
      
      <div className="flex gap-2">
        <Button
          onClick={handleInstallClick}
          className="flex-1 text-sm"
          size="sm"
        >
          Installieren
        </Button>
        <Button
          variant="outline"
          onClick={handleDismiss}
          className="text-sm"
          size="sm"
        >
          Später
        </Button>
      </div>
    </div>
  );
}