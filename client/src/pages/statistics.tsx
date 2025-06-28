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
  Activity
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DetailedStats {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalTests: number;
  testsPassedCount: number;
  testsPassedPercentage: number;
}

export default function Statistics() {
  const { data: stats, isLoading } = useQuery<DetailedStats>({
    queryKey: ['/api/quiz-sessions/detailed-stats'],
  });

  const { data: recentSessions } = useQuery({
    queryKey: ['/api/quiz-sessions/recent'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Statistiken werden geladen...</p>
        </div>
      </div>
    );
  }

  const questionsAnswered = (stats?.correctAnswers || 0) + (stats?.incorrectAnswers || 0);
  const accuracyPercentage = questionsAnswered > 0 
    ? Math.round((stats?.correctAnswers || 0) / questionsAnswered * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Lernstatistiken</h1>
            <p className="text-gray-600">Verfolgen Sie Ihren Fortschritt beim Einbürgerungstest</p>
          </div>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
          </Link>
        </div>

        {/* Main Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Questions Answered Correctly */}
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">
                Fragen richtig beantwortet
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {stats?.correctAnswers || 0}
              </div>
              <p className="text-xs text-green-600 mt-1">
                {accuracyPercentage}% Genauigkeit
              </p>
            </CardContent>
          </Card>

          {/* Questions Answered Incorrectly */}
          <Card className="bg-red-50 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">
                Fragen falsch beantwortet
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">
                {stats?.incorrectAnswers || 0}
              </div>
              <p className="text-xs text-red-600 mt-1">
                Übungsbedarf identifiziert
              </p>
            </CardContent>
          </Card>

          {/* Total Questions Practiced */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">
                Fragen geübt
              </CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                {questionsAnswered}
              </div>
              <p className="text-xs text-blue-600 mt-1">
                von 376 verfügbaren Fragen
              </p>
            </CardContent>
          </Card>

          {/* Tests Taken */}
          <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">
                Tests gemacht
              </CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">
                {stats?.totalTests || 0}
              </div>
              <p className="text-xs text-purple-600 mt-1">
                Vollständige Testdurchläufe
              </p>
            </CardContent>
          </Card>

          {/* Tests Passed */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800">
                Tests bestanden
              </CardTitle>
              <Trophy className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700">
                {stats?.testsPassedPercentage || 0}%
              </div>
              <p className="text-xs text-yellow-600 mt-1">
                {stats?.testsPassedCount || 0} von {stats?.totalTests || 0} Tests
              </p>
            </CardContent>
          </Card>

          {/* Overall Progress */}
          <Card className="bg-indigo-50 border-indigo-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-indigo-800">
                Gesamtfortschritt
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-700">
                {Math.round((questionsAnswered / 376) * 100)}%
              </div>
              <Progress 
                value={(questionsAnswered / 376) * 100} 
                className="mt-2 h-2"
              />
              <p className="text-xs text-indigo-600 mt-1">
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
                  <span className="text-sm text-gray-600">Richtige Antworten</span>
                  <span className="font-semibold text-green-600">
                    {stats?.correctAnswers || 0}
                  </span>
                </div>
                <Progress 
                  value={questionsAnswered > 0 ? (stats?.correctAnswers || 0) / questionsAnswered * 100 : 0} 
                  className="h-2"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Falsche Antworten</span>
                  <span className="font-semibold text-red-600">
                    {stats?.incorrectAnswers || 0}
                  </span>
                </div>
                <Progress 
                  value={questionsAnswered > 0 ? (stats?.incorrectAnswers || 0) / questionsAnswered * 100 : 0} 
                  className="h-2"
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Erfolgsquote</span>
                  <span className="text-lg font-bold text-primary">
                    {accuracyPercentage}%
                  </span>
                </div>
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
                <p className="text-gray-600 mb-4">bestandene Tests</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-600">Bestanden:</span>
                    <span className="font-semibold">{stats?.testsPassedCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">Nicht bestanden:</span>
                    <span className="font-semibold">
                      {(stats?.totalTests || 0) - (stats?.testsPassedCount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600">Gesamt:</span>
                    <span className="font-semibold">{stats?.totalTests || 0}</span>
                  </div>
                </div>
              </div>

              {(stats?.totalTests || 0) > 0 && (
                <div className="pt-4">
                  <p className="text-sm text-gray-600 text-center">
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
                  <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        session.passed ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-sm">
                          {session.type === 'full' ? 'Volltest' : 'Übungstest'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(session.createdAt).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        {session.correctAnswers}/{session.totalQuestions}
                      </p>
                      <p className="text-xs text-gray-500">
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
              <Target className="mr-2 h-4 w-4" />
              Neuen Test starten
            </Button>
          </Link>
          <Link href="/quiz?type=practice">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <BookOpen className="mr-2 h-4 w-4" />
              Üben
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}