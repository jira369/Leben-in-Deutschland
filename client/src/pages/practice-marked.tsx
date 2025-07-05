import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Flag, Play, Trash2, Shuffle } from "lucide-react";
import { useMarkedQuestions } from "@/hooks/use-marked-questions";

export default function PracticeMarked() {
  const { markedQuestionsData, markedQuestionsCount } = useMarkedQuestions();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/practice">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück zur Übung
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Markierte Fragen</h1>
                <p className="text-gray-600 mt-1">
                  Übe mit deinen markierten Fragen ({markedQuestionsCount} Fragen)
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {markedQuestionsCount === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Keine markierten Fragen
              </h3>
              <p className="text-gray-600 mb-6">
                Du hast noch keine Fragen markiert. Markiere Fragen während der Übung, um sie später zu wiederholen.
              </p>
              <Link href="/practice">
                <Button>
                  <Play className="mr-2 h-4 w-4" />
                  Übung starten
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Practice Options */}
            <Card className="mb-8 border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-yellow-500 p-3 rounded-lg">
                      <Flag className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900">
                        Markierte Fragen üben
                      </CardTitle>
                      <p className="text-gray-600 mt-1">
                        {markedQuestionsCount} markierte Fragen verfügbar
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link href="/quiz?type=practice&mode=marked">
                      <Button size="lg" className="w-full bg-yellow-600 hover:bg-yellow-700">
                        <Shuffle className="h-4 w-4 mr-2" />
                        Zufällig üben
                      </Button>
                    </Link>
                    <Link href="/quiz?type=practice&mode=marked&chronological=true">
                      <Button size="lg" variant="outline" className="w-full border-yellow-600 text-yellow-700 hover:bg-yellow-100">
                        Chronologisch üben
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Statistics Card */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="w-5 h-5" />
                  Markierte Fragen - Statistik
                </CardTitle>
                <CardDescription>
                  Übersicht über deine markierten Fragen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600 mb-2">
                      {markedQuestionsCount}
                    </div>
                    <div className="text-sm text-gray-600">
                      Markierte Fragen
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {markedQuestionsData.length}
                    </div>
                    <div className="text-sm text-gray-600">
                      Verschiedene Fragen
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {markedQuestionsData.length > 0 ? Math.round((markedQuestionsData.length / 460) * 100) : 0}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Anteil aller Fragen
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions List */}
            <div className="space-y-6">
              {markedQuestionsData.map((question, index) => (
                <Card key={question.id}>
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
                          <Flag className="h-4 w-4 text-yellow-500 fill-yellow-500 ml-2" />
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
      </div>
    </div>
  );
}