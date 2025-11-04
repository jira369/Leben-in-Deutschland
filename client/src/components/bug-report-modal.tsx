import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Bug, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BugReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BugReportModal({ open, onOpenChange }: BugReportModalProps) {
  const [bugDescription, setBugDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bugDescription.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte beschreiben Sie den Bug",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest('POST', '/api/bug-report', {
        description: bugDescription,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });

      toast({
        title: "Bug-Report gesendet",
        description: "Vielen Dank für Ihr Feedback! Der Bug-Report wurde erfolgreich übermittelt.",
      });

      setBugDescription("");
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit bug report:', error);
      toast({
        title: "Fehler beim Senden",
        description: "Der Bug-Report konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-w-[95vw]">
        <DialogHeader className="text-left space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <Bug className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 flex-shrink-0" />
            Bug melden
          </DialogTitle>
          <DialogDescription className="text-left text-sm sm:text-base leading-relaxed">
            Beschreiben Sie den Bug, den Sie gefunden haben. Ihr Feedback hilft uns, die App zu verbessern.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 mt-2">
          <div className="space-y-3">
            <Label 
              htmlFor="bug-description" 
              className="text-sm sm:text-base font-semibold text-foreground"
            >
              Bug-Beschreibung
            </Label>
            <Textarea
              id="bug-description"
              placeholder="Beschreiben Sie hier den Bug, den Sie gefunden haben..."
              value={bugDescription}
              onChange={(e) => setBugDescription(e.target.value)}
              rows={6}
              className="resize-none text-sm sm:text-base leading-relaxed min-h-[120px] sm:min-h-[150px]"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto h-11 sm:h-10 text-sm sm:text-base"
            >
              Abbrechen
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !bugDescription.trim()}
              className="w-full sm:w-auto h-11 sm:h-10 text-sm sm:text-base"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Bug-Report senden
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}