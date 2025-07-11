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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-red-500" />
            Bug melden
          </DialogTitle>
          <DialogDescription>
            Beschreiben Sie den Bug, den Sie gefunden haben. Ihr Feedback hilft uns, die App zu verbessern.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bug-description">Bug-Beschreibung</Label>
            <Textarea
              id="bug-description"
              placeholder="Beschreiben Sie hier den Bug, den Sie gefunden haben..."
              value={bugDescription}
              onChange={(e) => setBugDescription(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting || !bugDescription.trim()}>
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