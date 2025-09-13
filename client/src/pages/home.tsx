import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, ListChecks, TrendingUp, Play, Dumbbell, BarChart3, CheckCircle, AlertTriangle, Settings, Bug, Clock } from "lucide-react";
import { QuizSession, UserSettings } from "@shared/schema";
import { formatDuration } from "@/lib/quiz-logic";
import { SettingsModal } from "@/components/settings-modal";
import { BugReportModal } from "@/components/bug-report-modal";

export default function Home() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [, navigate] = useLocation();

  // Fetch user settings
  const { data: userSettings } = useQuery<UserSettings>({
    queryKey: ['/api/settings'],
  });

  // Fetch recent quiz sessions
  const { data: recentSessions = [] } = useQuery<QuizSession[]>({
    queryKey: ['/api/quiz-sessions/recent'],
  });

  // Fetch quiz statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/quiz-sessions/stats'],
  });

  // Check if user needs to select their bundesland
  useEffect(() => {
    if (userSettings && !userSettings.hasSelectedState) {
      navigate('/state-selection');
    }
  }, [userSettings, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <GraduationCap className="text-white text-lg" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Einbürgerungstest</h1>
                  <p className="text-sm text-muted-foreground">Übungs-App</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setBugReportOpen(true)}
              >
                <Bug className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-none mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Welcome Card */}
        <Card className="rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 mx-auto max-w-4xl">
          <CardContent className="p-0">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-2">
                Willkommen zum Einbürgerungstest
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
                Bereiten Sie sich optimal auf den deutschen Einbürgerungstest vor. 
                Üben Sie mit den offiziellen Fragen und erhalten Sie sofortiges Feedback.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
              <div className="bg-primary/5 dark:bg-primary/10 rounded-lg sm:rounded-xl p-4 sm:p-6">
                <div className="flex items-center mb-2 sm:mb-3">
                  <ListChecks className="text-primary text-lg sm:text-xl mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">310 Fragen</h3>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Alle offiziellen Fragen des Bundesamts für Migration und Flüchtlinge
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg sm:rounded-xl p-4 sm:p-6">
                <div className="flex items-center mb-2 sm:mb-3">
                  <TrendingUp className="text-green-500 text-lg sm:text-xl mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">Fortschritt verfolgen</h3>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Behalten Sie Ihre Lernfortschritte und Ergebnisse im Blick
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Link href="/quiz?type=full">
                <Button className="w-full py-4" size="lg">
                  <Play className="mr-3 h-5 w-5" />
                  <span className="hidden sm:inline">Vollständigen Test starten (33 Fragen)</span>
                  <span className="sm:hidden">Testsimulation starten</span>
                </Button>
              </Link>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/practice">
                  <Button variant="outline" className="w-full py-3" size="lg">
                    <Dumbbell className="mr-2 h-4 w-4" />
                    Fragen üben
                  </Button>
                </Link>
                <Link href="/statistics">
                  <Button variant="outline" className="w-full py-3" size="lg">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Statistiken
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Progress */}
        <Card className="rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mx-auto max-w-4xl">
          <CardContent className="p-0">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">
              Ihre letzten Ergebnisse
            </h3>
            {recentSessions.filter(session => session.type === 'full' && session.totalQuestions === 33).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Noch keine Tests absolviert.</p>
                <p className="text-sm mt-1">
                  Starten Sie Ihren ersten Test, um Ihre Fortschritte zu verfolgen.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.filter(session => session.type === 'full' && session.totalQuestions === 33).map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-muted/50 dark:bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        session.passed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-orange-100 dark:bg-orange-900/30'
                      }`}>
                        {session.passed ? (
                          <CheckCircle className="text-green-500 h-6 w-6" />
                        ) : (
                          <AlertTriangle className="text-orange-500 h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {session.type === 'full' 
                            ? 'Vollständiger Test' 
                            : session.practiceType 
                              ? `${session.practiceType} (Übung)`
                              : 'Gemischte Fragen (Übung)'
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {session.timeSpent && (
                            <>⏱ {formatDuration(session.timeSpent)}</>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {session.createdAt ? new Date(session.createdAt).toLocaleDateString('de-DE') : 'Heute'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${
                        session.passed ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        {session.correctAnswers}/{session.totalQuestions}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.passed ? 'Bestanden' : `${session.percentage}%`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <SettingsModal 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />
      
      <BugReportModal 
        open={bugReportOpen} 
        onOpenChange={setBugReportOpen} 
      />
    </div>
  );
}
