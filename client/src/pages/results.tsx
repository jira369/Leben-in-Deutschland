import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, RotateCcw, BookOpen, Share, CheckCircle, XCircle, ChevronDown } from "lucide-react";
import { QuizResults } from "@shared/schema";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatTime } from "@/lib/quiz-logic";
import { useQuery } from "@tanstack/react-query";

export default function Results() {
  const [, params] = useLocation();
  const [showDetails, setShowDetails] = useState(false);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [quizType, setQuizType] = useState<'full' | 'practice'>('full');

  // Get quiz statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/quiz-sessions/stats'],
  });

  useEffect(() => {
    // Get results from location state, URL params, or localStorage
    const state = (window.history.state as any)?.state;
    if (state?.results) {
      setResults(state.results);
      setQuizType(state.type || 'full');
      return;
    }

    // Fallback to localStorage
    const storedResults = localStorage.getItem('quiz-results');
    if (storedResults) {
      try {
        const parsed = JSON.parse(storedResults);
        setResults(parsed.results);
        setQuizType(parsed.type || 'full');
        // Clear localStorage after reading
        localStorage.removeItem('quiz-results');
      } catch (error) {
        console.error('Failed to parse stored quiz results:', error);
      }
    }
  }, []);

  if (!results) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Keine Ergebnisse gefunden.</p>
            <Link href="/">
              <Button className="mt-4">
                Zurück
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isFullTest = quizType === 'full' && results.total === 33;
  const passedTest = results.passed;
  // German citizenship test requires 17 out of 33 questions correct
  const requiredScore = results.total === 33 ? 17 : Math.ceil(results.total * 0.51);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <Card className="rounded-2xl shadow-lg p-8 mb-6 text-center">
          <CardContent className="p-0">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="text-green-500 text-3xl h-12 w-12" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {isFullTest ? 'Test abgeschlossen!' : 'Übung abgeschlossen!'}
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              {isFullTest 
                ? (passedTest ? 'Herzlichen Glückwunsch zu Ihrem Ergebnis' : 'Üben Sie weiter für bessere Ergebnisse')
                : 'Herzlichen Glückwunsch zu Ihrem Übungsergebnis'
              }
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
              <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-6">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{results.correct}</div>
                <p className="text-green-700 dark:text-green-300 font-medium">Richtige Antworten</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-6">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">{results.incorrect}</div>
                <p className="text-red-700 dark:text-red-300 font-medium">Falsche Antworten</p>
              </div>
              <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-6">
                <div className="text-3xl font-bold text-primary mb-2">{results.percentage}%</div>
                <p className="text-primary font-medium">Erfolgsquote</p>
              </div>
            </div>

            {isFullTest && (
              <div className={`p-6 rounded-xl border ${
                passedTest 
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center justify-center space-x-3 mb-2">
                  {passedTest ? (
                    <CheckCircle className="text-green-500 dark:text-green-400 text-xl h-6 w-6" />
                  ) : (
                    <XCircle className="text-red-500 dark:text-red-400 text-xl h-6 w-6" />
                  )}
                  <span className={`text-xl font-semibold ${
                    passedTest ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                  }`}>
                    {passedTest ? 'Einbürgerungstest bestanden!' : 'Einbürgerungstest nicht bestanden'}
                  </span>
                </div>
                <p className={passedTest ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                  {passedTest 
                    ? `Sie haben den Einbürgerungstest erfolgreich bestanden! Für das Bestehen sind mindestens ${requiredScore} von ${results.total} Fragen richtig zu beantworten.`
                    : `Sie haben den Einbürgerungstest nicht bestanden. Sie benötigen mindestens ${requiredScore} richtige Antworten von ${results.total} Fragen. Üben Sie weiter und versuchen Sie es erneut.`
                  }
                </p>
                {results.timeSpent > 0 && (
                  <p className={`text-sm mt-2 ${passedTest ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    Benötigte Zeit: {formatTime(results.timeSpent)}
                  </p>
                )}
              </div>
            )}
            
            {!isFullTest && results.timeSpent > 0 && (
              <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20">
                <p className="text-sm text-primary text-center">
                  Übungszeit: {formatTime(results.timeSpent)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Results */}
        <Card className="bg-card rounded-2xl shadow-lg p-6 mb-6">
          <CardContent className="p-0">
            <Collapsible open={showDetails} onOpenChange={setShowDetails}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between mb-6 cursor-pointer">
                  <h3 className="text-xl font-semibold text-foreground">Detaillierte Ergebnisse</h3>
                  <Button variant="ghost" size="sm">
                    <ChevronDown className={`mr-1 h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                    Details {showDetails ? 'ausblenden' : 'anzeigen'}
                  </Button>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-3">
                {results.questionResults.map((result, index) => (
                  <div key={result.questionId} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        result.isCorrect ? 'bg-green-100 dark:bg-green-950/30' : 'bg-red-100 dark:bg-red-950/30'
                      }`}>
                        {result.isCorrect ? (
                          <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Frage {index + 1}</p>
                        <p className="text-sm text-muted-foreground">{result.question.text}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${
                        result.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {result.isCorrect ? 'Richtig' : 'Falsch'}
                      </span>
                      {!result.isCorrect && (
                        <>
                          <p className="text-xs text-muted-foreground">
                            Ihre Antwort: {result.question.answers[result.selectedAnswer]}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Richtig: {result.question.answers[result.question.correctAnswer - 1]}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Actions and Statistics */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-card rounded-2xl shadow-lg p-6">
            <CardContent className="p-0">
              <h4 className="text-lg font-semibold text-foreground mb-4">Nächste Schritte</h4>
              <div className="space-y-4">
                <Link href={`/quiz?type=${quizType}`}>
                  <Button className="w-full mb-1">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {isFullTest ? 'Neuen Test starten' : 'Neue Übung starten'}
                  </Button>
                </Link>
                <Link href="/practice-mistakes">
                  <Button variant="outline" className="w-full">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Fehler üben
                  </Button>
                </Link>
                <Button variant="outline" className="w-full">
                  <Share className="mr-2 h-4 w-4" />
                  Ergebnis teilen
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card rounded-2xl shadow-lg p-6">
            <CardContent className="p-0">
              <h4 className="text-lg font-semibold text-foreground mb-4">Lernstatistiken</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tests absolviert</span>
                  <span className="font-semibold text-foreground">{stats?.totalTests || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Durchschnittliche Punktzahl</span>
                  <span className="font-semibold text-foreground">{stats?.averageScore || 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Beste Punktzahl</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">{stats?.bestScore || 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Lernzeit gesamt</span>
                  <span className="font-semibold text-foreground">
                    {stats?.totalStudyTime ? formatTime(stats.totalStudyTime) : '0:00'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline" size="lg">
              Zurück
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
