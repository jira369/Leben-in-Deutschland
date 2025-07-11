import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InstallPrompt } from "@/components/install-prompt";
import { ThemeProvider } from "@/components/theme-provider";
import Home from "@/pages/home";
import Quiz from "@/pages/quiz";
import Results from "@/pages/results";
import Statistics from "@/pages/statistics";
import StateSelection from "@/pages/state-selection";
import Practice from "@/pages/practice";
import PracticeMistakes from "@/pages/practice-mistakes";
import PracticeMarked from "@/pages/practice-marked";
import NotFound from "@/pages/not-found";

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="quiz-app-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
          <InstallPrompt />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
