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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
    updateSettings.mutate(localSettings);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Einstellungen</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
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
            <p className="text-xs text-gray-500 mt-1">
              Wählen Sie Ihr Bundesland für spezifische Fragen
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Test-Modus
            </Label>
            <RadioGroup
              value={currentSettings.testMode || 'full'}
              onValueChange={(value) => 
                setLocalSettings(prev => ({ ...prev, testMode: value as 'full' | 'practice' }))
              }
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full">Vollständiger Test (33 Fragen)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="practice" id="practice" />
                <Label htmlFor="practice">Übungsmodus (10 Fragen)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="timer" className="text-sm font-medium text-gray-700">
                  Timer aktivieren
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Zeigt die verbleibende Zeit für den Test an
                </p>
              </div>
              <Switch
                id="timer"
                checked={currentSettings.timerEnabled || false}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, timerEnabled: checked }))
                }
              />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Button 
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="w-full"
          >
            {updateSettings.isPending ? "Speichern..." : "Einstellungen speichern"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
