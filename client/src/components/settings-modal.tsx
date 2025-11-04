import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserSettings } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { RefreshCw } from "lucide-react";

const GERMAN_STATES = [
  { code: "Baden-Württemberg", name: "Baden-Württemberg" },
  { code: "Bayern", name: "Bayern" },
  { code: "Berlin", name: "Berlin" },
  { code: "Brandenburg", name: "Brandenburg" },
  { code: "Bremen", name: "Bremen" },
  { code: "Hamburg", name: "Hamburg" },
  { code: "Hessen", name: "Hessen" },
  { code: "Mecklenburg-Vorpommern", name: "Mecklenburg-Vorpommern" },
  { code: "Niedersachsen", name: "Niedersachsen" },
  { code: "NRW", name: "Nordrhein-Westfalen" },
  { code: "Rheinland-Pfalz", name: "Rheinland-Pfalz" },
  { code: "Saarland", name: "Saarland" },
  { code: "Sachsen", name: "Sachsen" },
  { code: "Sachsen-Anhalt", name: "Sachsen-Anhalt" },
  { code: "Schleswig-Holstein", name: "Schleswig-Holstein" },
  { code: "Thüringen", name: "Thüringen" }
];

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  
  const { data: settings } = useQuery<UserSettings>({
    queryKey: ['/api/settings'],
  });

  const [localSettings, setLocalSettings] = useState<Partial<UserSettings>>({});

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<UserSettings>) => {
      // Check if state has changed
      const stateChanged = newSettings.selectedState && newSettings.selectedState !== settings?.selectedState;
      
      const res = await apiRequest('PATCH', '/api/settings', newSettings);
      
      // If state changed, clear state-specific data
      if (stateChanged) {
        await apiRequest('POST', '/api/clear-state-data', { newState: newSettings.selectedState });
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marked-questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/incorrect-answers'] });
      toast({
        title: "Einstellungen gespeichert",
        description: "Ihre Präferenzen wurden erfolgreich aktualisiert.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  });

  const currentSettings = { ...settings, ...localSettings };

  const handleSave = () => {
    // Filter out dark mode setting as it's handled locally
    const backendSettings = Object.fromEntries(
      Object.entries(localSettings).filter(([key]) => key !== 'theme')
    );
    updateSettings.mutate(backendSettings);
  };

  const handleClearCache = async () => {
    try {
      // Clear Service Worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // Clear IndexedDB (React Query)
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
          console.log('IndexedDB clear failed (non-critical):', error);
        }
      }
      
      // Clear localStorage (preserving theme)
      const theme = localStorage.getItem('theme');
      localStorage.clear();
      if (theme) localStorage.setItem('theme', theme);
      
      toast({
        title: "Cache geleert",
        description: "Die App wird neu geladen, um die neueste Version zu erhalten.",
      });
      
      // Force HARD reload with cache-busting
      setTimeout(() => {
        window.location.href = window.location.href.split('?')[0] + '?v=3.2.0&t=' + Date.now();
      }, 1000);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Cache konnte nicht geleert werden.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Einstellungen</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Bundesland
            </Label>
            <Select
              value={currentSettings.selectedState || ""}
              onValueChange={(value) => 
                setLocalSettings(prev => ({ ...prev, selectedState: value, hasSelectedState: true }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Bundesland auswählen" />
              </SelectTrigger>
              <SelectContent>
                {GERMAN_STATES.map((state) => (
                  <SelectItem key={state.code} value={state.code}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-4">
              Wählen Sie Ihr Bundesland für spezifische Fragen
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="darkmode" className="text-sm font-medium">
                  Dark Mode
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Dunkles Design für die App aktivieren
                </p>
              </div>
              <Switch
                id="darkmode"
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="timer" className="text-sm font-medium">
                  Timer aktivieren
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Zeigt die verbleibende Zeit für den Test an (60 Minuten)
                </p>
              </div>
              <Switch
                id="timer"
                checked={currentSettings.timerEnabled ?? true}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, timerEnabled: checked }))
                }
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClearCache}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Cache leeren & App aktualisieren
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Nutzen Sie dies, wenn Sie die neueste Version der App sehen möchten
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            {updateSettings.isPending ? "Speichern..." : "Speichern"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
