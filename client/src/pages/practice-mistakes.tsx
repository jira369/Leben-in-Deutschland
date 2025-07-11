import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Trash2, BookOpen, RotateCcw, Image } from "lucide-react";
import { Question } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function PracticeMistakes() {
  const [, setLocation] = useLocation();
  const [imageModalOpen, setImageModalOpen] = useState<{ [key: number]: boolean }>({});
  
  // Fetch incorrect questions
  const { data: incorrectQuestions = [], isLoading, refetch } = useQuery<Question[]>({
    queryKey: ["/api/incorrect-questions"],
  });

  // Fetch count of incorrect answers
  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/incorrect-answers/count"],
  });

  const handleClearMistakes = async () => {
    try {
      await apiRequest("DELETE", "/api/incorrect-answers");
      refetch();
    } catch (error) {
      console.error("Failed to clear mistakes:", error);
    }
  };

  const startMistakePractice = () => {
    // Navigate to quiz with special "mistakes" mode
    setLocation("/quiz?mode=mistakes");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Fehler werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/practice">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="sm:hidden">Zurück</span>
                  <span className="hidden sm:inline">Zurück zur Übung</span>
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  <span className="sm:hidden">Fehler üben</span>
                  <span className="hidden sm:inline">Fehler üben</span>
                </h1>
                <p className="text-muted-foreground mt-1 hidden sm:block">
                  Wiederhole Fragen, die du zuvor falsch beantwortet hast
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {incorrectQuestions.length > 0 && (
                <Button
                  onClick={handleClearMistakes}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Alle löschen
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Statistics Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Fehler-Statistik
            </CardTitle>
            <CardDescription>
              Übersicht über deine falsch beantworteten Fragen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {countData?.count || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Falsche Antworten gesamt
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {incorrectQuestions.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Verschiedene Fragen
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {incorrectQuestions.length > 0 ? Math.round((incorrectQuestions.length / 460) * 100) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Anteil aller Fragen
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {incorrectQuestions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Keine Fehler gefunden
              </h2>
              <p className="text-muted-foreground mb-6">
                Du hast noch keine Fragen falsch beantwortet oder alle Fehler wurden gelöscht.
              </p>
              <Link href="/practice">
                <Button>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Übung starten
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Practice Button */}
            <div className="mb-6 text-center">
              <Button onClick={startMistakePractice} size="lg" className="w-full sm:w-auto">
                <RotateCcw className="w-4 h-4 mr-2" />
                Fehler üben ({incorrectQuestions.length} Fragen)
              </Button>
            </div>

            {/* Questions List */}
            <div className="grid gap-4">
              {incorrectQuestions.map((question, index) => (
                <Card key={question.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary">
                            Frage {question.id}
                          </Badge>
                          {question.hasImage && (
                            <Badge variant="outline">
                              Mit Bild
                            </Badge>
                          )}
                          {question.category && (
                            <Badge variant="outline">
                              {question.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-foreground mb-4 leading-relaxed">
                          {question.text}
                        </p>
                        {question.hasImage && question.imagePath && (
                          <div className="mb-4">
                            <Dialog 
                              open={imageModalOpen[question.id] || false} 
                              onOpenChange={(open) => 
                                setImageModalOpen(prev => ({ ...prev, [question.id]: open }))
                              }
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2 text-primary border-primary hover:bg-primary/5"
                                >
                                  <Image className="w-4 h-4" />
                                  Bild anzeigen
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                                <DialogHeader>
                                  <DialogTitle>
                                    Bild zu Frage {question.id}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="mt-4 flex justify-center overflow-auto">
                                  <img 
                                    src={`/attached_assets/${question.imagePath}`}
                                    alt={`Bild zu Frage ${question.id}`}
                                    className="max-w-full max-h-[70vh] object-contain rounded-lg border border-gray-200 shadow-sm"
                                    onError={(e) => {
                                      console.error(`Failed to load image: /attached_assets/${question.imagePath}`);
                                      e.currentTarget.src = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f3f4f6"/><text x="200" y="150" text-anchor="middle" font-family="Arial" font-size="16" fill="#6b7280">Bild nicht verfügbar</text></svg>')}`;
                                    }}
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                        <div className="space-y-2">
                          {question.answers.map((answer, answerIndex) => (
                            <div
                              key={answerIndex}
                              className={`p-3 rounded-md border ${
                                answerIndex + 1 === question.correctAnswer
                                  ? "bg-green-50 border-green-200 text-green-800"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {String.fromCharCode(65 + answerIndex)}:
                                </span>
                                <span>{answer}</span>
                                {answerIndex + 1 === question.correctAnswer && (
                                  <Badge className="ml-auto bg-green-600">
                                    Richtig
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {question.explanation && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-800">
                              <strong>Erklärung:</strong> {question.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}