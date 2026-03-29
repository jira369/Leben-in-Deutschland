import { Switch, Route } from "wouter";
import { Component, useEffect, type ReactNode } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InstallPrompt } from "@/components/install-prompt";
import { isNativePlatform } from "@/lib/platform";
import { apiRequest } from "@/lib/queryClient";
import { registerTokenWithServer } from "@/lib/notifications";
import type { Question } from "@shared/schema";
import Home from "@/pages/home";
import Quiz from "@/pages/quiz";
import Results from "@/pages/results";
import Statistics from "@/pages/statistics";
import StateSelection from "@/pages/state-selection";
import Practice from "@/pages/practice";
import PracticeMistakes from "@/pages/practice-mistakes";
import PracticeMarked from "@/pages/practice-marked";
import NotFound from "@/pages/not-found";

/** Create Android notification channel + listen for FCM token refreshes */
function NotificationSetup() {
  useEffect(() => {
    if (!isNativePlatform()) return;
    let cleanup: (() => void) | undefined;

    import('@capacitor-firebase/messaging').then(({ FirebaseMessaging }) => {
      // Create notification channel for Android
      FirebaseMessaging.createChannel({
        id: 'daily_reminder',
        name: 'Tägliche Erinnerung',
        description: 'Tägliche Lern-Erinnerungen für den Einbürgerungstest',
        importance: 4,
        visibility: 1,
        sound: 'default',
        vibration: true,
        lights: true,
      }).catch(() => {});

      // Re-register token on refresh
      FirebaseMessaging.addListener('tokenReceived', async ({ token }) => {
        const storedToken = localStorage.getItem('fcm_token');
        if (storedToken) {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          await registerTokenWithServer(token, 'android', 9, 0, tz).catch(() => {});
          localStorage.setItem('fcm_token', token);
        }
      }).then(handle => { cleanup = () => handle.remove(); });
    }).catch(() => {});

    return () => cleanup?.();
  }, []);

  return null;
}

/** Ensures questions are loaded on app start, not just when quiz page mounts */
function QuestionInitializer() {
  const qc = useQueryClient();
  const { data: questions = [] } = useQuery<Question[]>({ queryKey: ['/api/questions'] });
  const init = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/questions/initialize');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/questions'] }),
  });

  useEffect(() => {
    if (questions.length === 0 && !init.isPending) {
      init.mutate();
    }
  }, [questions.length]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/results" component={Results} />
      <Route path="/statistics" component={Statistics} />
      <Route path="/state-selection" component={StateSelection} />
      <Route path="/practice" component={Practice} />
      <Route path="/practice-mistakes" component={PracticeMistakes} />
      <Route path="/practice-marked" component={PracticeMarked} />
      <Route component={NotFound} />
    </Switch>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("App error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <h1 className="text-xl font-semibold">Etwas ist schiefgelaufen</h1>
            <p className="text-muted-foreground">Bitte laden Sie die Seite neu.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Seite neu laden
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <NotificationSetup />
          <QuestionInitializer />
          <Router />
          {!isNativePlatform() && <InstallPrompt />}
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
