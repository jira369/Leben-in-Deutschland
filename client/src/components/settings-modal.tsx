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
import { UserSettings } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
      const res = await apiRequest('PATCH', '/api/settings', newSettings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
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

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="feedback" className="text-sm font-medium text-gray-700">
                  Sofortiges Feedback
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Zeigt die richtige Antwort sofort nach der Auswahl
                </p>
              </div>
              <Switch
                id="feedback"
                checked={currentSettings.immediateFeedback !== false}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, immediateFeedback: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="shuffle" className="text-sm font-medium text-gray-700">
                  Fragen mischen
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Fragen in zufälliger Reihenfolge anzeigen
                </p>
              </div>
              <Switch
                id="shuffle"
                checked={currentSettings.shuffleQuestions !== false}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, shuffleQuestions: checked }))
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
