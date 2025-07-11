import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  CheckCircle, 
  XCircle, 
  BookOpen, 
  Target, 
  Trophy,
  ArrowLeft,
  TrendingUp,
  Activity,
  Clock
} from "lucide-react";
import { formatDuration } from "@/lib/quiz-logic";
import { Progress } from "@/components/ui/progress";
import { UserSettings, QuizSession } from "@shared/schema";

interface DetailedStats {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalTests: number;
  testsPassedCount: number;
  testsPassedPercentage: number;
}

export default function Statistics() {
  const { data: userSettings } = useQuery<UserSettings>({
    queryKey: ['/api/settings'],
  });

  const { data: stats, isLoading } = useQuery<DetailedStats>({
    queryKey: ['/api/quiz-sessions/detailed-stats', userSettings?.selectedState],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userSettings?.selectedState) {
        params.append('state', userSettings.selectedState);
      }
      const response = await fetch(`/api/quiz-sessions/detailed-stats?${params}`);
      if (!response.ok) throw new Error('Failed to fetch detailed stats');
      return response.json();
    },
    enabled: !!userSettings,
  });

  const { data: recentSessions } = useQuery<QuizSession[]>({
    queryKey: ['/api/quiz-sessions/recent'],
  });

  const { data: uniqueQuestionsData } = useQuery<{ uniqueQuestionsAnswered: number }>({
    queryKey: ['/api/quiz-sessions/unique-questions'],
  });

  // Calculate total available questions based on selected state
  // 300 federal questions + 10 state-specific questions = 310 total
  const totalAvailableQuestions = userSettings?.selectedState ? 310 : 300;
  
  // Use the actual count of unique questions answered from the backend
  const questionsAnswered = uniqueQuestionsData?.uniqueQuestionsAnswered || 0;
  
  // Calculate accuracy based on correct answers vs total answers (not unique questions)
  // Convert strings to numbers first to avoid string concatenation
  const correctAnswersNum = parseInt(stats?.correctAnswers?.toString() || '0', 10);
  const incorrectAnswersNum = parseInt(stats?.incorrectAnswers?.toString() || '0', 10);
  const totalAnswersGiven = correctAnswersNum + incorrectAnswersNum;
  
  const accuracyPercentage = totalAnswersGiven > 0 
    ? Math.round((correctAnswersNum / totalAnswersGiven) * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Statistiken werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Lernstatistiken</h1>
                  <p className="text-sm text-muted-foreground">Verfolgen Sie Ihren Fortschritt beim Einbürgerungstest</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Main Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Questions Answered Correctly */}
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">
                Fragen richtig beantwortet
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-200">
                {correctAnswersNum}
              </div>
              <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                {accuracyPercentage}% Genauigkeit
              </p>
            </CardContent>
          </Card>

          {/* Questions Answered Incorrectly */}
          <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">
                Fragen falsch beantwortet
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700 dark:text-red-200">
                {incorrectAnswersNum}
              </div>
              <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                Übungsbedarf identifiziert
              </p>
            </CardContent>
          </Card>

          {/* Total Questions Practiced */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Fragen geübt
              </CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-200">
                {questionsAnswered}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                von {totalAvailableQuestions} verfügbaren Fragen
              </p>
            </CardContent>
          </Card>

          {/* Tests Taken */}
          <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">
                Tests gemacht
              </CardTitle>
              <Target className="h-4 w-4 text-purple-600 dark:text-purple-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-200">
                {stats?.totalTests || 0}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-300 mt-1">
                Vollständige Testdurchläufe
              </p>
            </CardContent>
          </Card>

          {/* Tests Passed */}
          <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Tests bestanden
              </CardTitle>
              <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-200">
                {stats?.testsPassedPercentage || 0}%
              </div>
              <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                {stats?.testsPassedCount || 0} von {stats?.totalTests || 0} Tests
              </p>
            </CardContent>
          </Card>

          {/* Overall Progress */}
          <Card className="bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                Gesamtfortschritt
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-200">
                {Math.round((questionsAnswered / totalAvailableQuestions) * 100)}%
              </div>
              <Progress 
                value={(questionsAnswered / totalAvailableQuestions) * 100} 
                className="mt-2 h-2"
              />
              <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-1">
                aller Fragen bearbeitet
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Leistungsübersicht
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Richtige Antworten</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {correctAnswersNum} ({accuracyPercentage}%)
                  </span>
                </div>
                <Progress 
                  value={accuracyPercentage} 
                  className="h-2"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Falsche Antworten</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {incorrectAnswersNum} ({100 - accuracyPercentage}%)
                  </span>
                </div>
                <Progress 
                  value={100 - accuracyPercentage} 
                  className="h-2"
                />
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Erfolgsquote</span>
                  <span className="text-lg font-bold text-primary">
                    {accuracyPercentage}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Basierend auf {totalAnswersGiven} beantworteten Fragen
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Test Success Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Testerfolg
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-6">
                <div className="text-4xl font-bold text-primary mb-2">
                  {stats?.testsPassedPercentage || 0}%
                </div>
                <p className="text-muted-foreground mb-4">bestandene Tests</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-600 dark:text-green-400">Bestanden:</span>
                    <span className="font-semibold text-foreground">{stats?.testsPassedCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600 dark:text-red-400">Nicht bestanden:</span>
                    <span className="font-semibold text-foreground">
                      {(stats?.totalTests || 0) - (stats?.testsPassedCount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="text-muted-foreground">Gesamt:</span>
                    <span className="font-semibold text-foreground">{stats?.totalTests || 0}</span>
                  </div>
                </div>
              </div>

              {(stats?.totalTests || 0) > 0 && (
                <div className="pt-4">
                  <p className="text-sm text-muted-foreground text-center">
                    {(stats?.testsPassedPercentage || 0) >= 50 
                      ? "Gute Leistung! Setzen Sie das regelmäßige Üben fort."
                      : "Üben Sie weiter, um Ihre Erfolgschancen zu verbessern."
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        {recentSessions && recentSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Letzte Aktivitäten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSessions.slice(0, 5).map((session: any, index: number) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 dark:bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        session.passed ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-foreground">
                            {session.type === 'full' 
                              ? 'Volltest' 
                              : session.practiceType 
                                ? `Übungstest ${session.practiceType}`
                                : 'Übungstest'
                            }
                          </p>
                          {session.timeSpent && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDuration(session.timeSpent)}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.createdAt).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-foreground">
                        {session.correctAnswers}/{session.totalQuestions}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.percentage}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link href="/quiz?type=full">
            <Button size="lg" className="w-full sm:w-auto">
              Neuen Test starten
            </Button>
          </Link>
          <Link href="/practice">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <BookOpen className="mr-2 h-4 w-4" />
              Üben
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}