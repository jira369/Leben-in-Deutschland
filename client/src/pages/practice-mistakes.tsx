import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, BookOpen, RotateCcw } from "lucide-react";
import { Question } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function PracticeMistakes() {
  const [, setLocation] = useLocation();
  
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Fehler werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/practice">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Zurück
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Fehler üben</h1>
                <p className="text-gray-600 mt-1">
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
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Alle löschen
                </Button>
              )}
            </div>
          </div>
        </div>

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
                <div className="text-sm text-gray-600">
                  Falsche Antworten gesamt
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {incorrectQuestions.length}
                </div>
                <div className="text-sm text-gray-600">
                  Verschiedene Fragen
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {incorrectQuestions.length > 0 ? Math.round((incorrectQuestions.length / 460) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">
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
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Keine Fehler gefunden
              </h2>
              <p className="text-gray-600 mb-6">
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
                        <p className="text-gray-900 mb-4 leading-relaxed">
                          {question.text}
                        </p>
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