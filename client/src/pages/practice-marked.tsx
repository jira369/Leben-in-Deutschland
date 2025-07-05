import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Flag, Play, Trash2 } from "lucide-react";
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
                        <Play className="h-4 w-4 mr-2" />
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

            {/* Questions List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Alle markierten Fragen</CardTitle>
                  <Badge variant="secondary">{markedQuestionsCount} Fragen</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {markedQuestionsData.map((question, index) => (
                    <div
                      key={question.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              Frage {question.id}
                            </Badge>
                            {question.category && (
                              <Badge variant="secondary" className="text-xs">
                                {question.category}
                              </Badge>
                            )}
                            <Flag className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          </div>
                          <p className="text-gray-900 font-medium leading-relaxed">
                            {question.text}
                          </p>
                          {question.hasImage && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              📷 Mit Bild
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}