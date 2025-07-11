import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Play, ArrowLeft, Users, Building, Flag, Globe, Scale, Heart, RotateCcw, Shuffle } from "lucide-react";
import { Question, UserSettings } from "@shared/schema";
import { useMarkedQuestions } from "@/hooks/use-marked-questions";

// Thematic groupings of questions based on content analysis
const getThematicCategories = (questions: Question[]) => {
  // Keywords for categorizing questions thematically
  const categories = [
    {
      id: "geschichte",
      name: "Geschichte und Verantwortung", 
      icon: BookOpen,
      description: "Deutsche Geschichte, NS-Zeit, Demokratie",
      color: "bg-blue-500",
      keywords: ["Geschichte", "Nationalsozialismus", "NS-Zeit", "1933", "1945", "Krieg", "DDR", "demokratisch", "Demokratie", "Verfolgung", "Holocaust", "Widerstand"]
    },
    {
      id: "verfassung",
      name: "Verfassungsprinzipien",
      icon: Scale, 
      description: "Grundgesetz, Rechtsstaatlichkeit, Gewaltenteilung",
      color: "bg-green-500",
      keywords: ["Grundgesetz", "Verfassung", "Rechtsstaatlichkeit", "Gewaltenteilung", "Parlament", "Bundestag", "Bundesrat", "Verfassungsgericht", "Grundrechte", "Menschenrechte"]
    },
    {
      id: "mensch-gesellschaft", 
      name: "Mensch und Gesellschaft",
      icon: Users,
      description: "Religionsfreiheit, Gleichberechtigung, Toleranz", 
      color: "bg-purple-500",
      keywords: ["Religion", "Glaube", "Gleichberechtigung", "Toleranz", "Familie", "Ehe", "Frauen", "Männer", "Diskriminierung", "Integration", "Kultur"]
    },
    {
      id: "staat-buerger",
      name: "Staat und Bürger", 
      icon: Building,
      description: "Wahlen, Parteien, Bürgerpflichten",
      color: "bg-orange-500", 
      keywords: ["Wahl", "wählen", "Partei", "Bürger", "Bürgerpflicht", "Steuern", "Sozialversicherung", "Personalausweis", "Pass", "Meldepflicht"]
    },
    {
      id: "bundesweit",
      name: "Bundesweite Fragen",
      icon: Globe,
      description: "Allgemeine Fragen zu Deutschland", 
      color: "bg-indigo-500",
      keywords: [] // All federal questions
    }
  ];

  return categories.map(cat => {
    let matchingQuestions;
    if (cat.id === "bundesweit") {
      matchingQuestions = questions.filter(q => q.category === "Bundesweit");
    } else {
      matchingQuestions = questions.filter(q => 
        q.category === "Bundesweit" && 
        cat.keywords.some(keyword => 
          q.text.toLowerCase().includes(keyword.toLowerCase())
        )
      );
    }
    
    return {
      ...cat,
      questionCount: matchingQuestions.length,
      questions: matchingQuestions
    };
  }).filter(cat => cat.questionCount > 0);
};

export default function Practice() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch user settings to get selected state
  const { data: userSettings } = useQuery<UserSettings>({
    queryKey: ['/api/settings'],
  });

  // Fetch all questions
  const { data: allQuestions = [], isLoading } = useQuery<Question[]>({
    queryKey: ['/api/questions'],
  });

  // Get marked questions data
  const { markedQuestionsCount } = useMarkedQuestions();

  // Calculate thematic categories based on all questions
  const thematicCategories = getThematicCategories(allQuestions);

  const startCategoryPractice = (categoryId: string) => {
    const category = thematicCategories.find(cat => cat.id === categoryId);
    if (!category || category.questions.length === 0) {
      return;
    }
    // Start a practice quiz with the category questions
    window.location.href = `/quiz?type=practice&category=${categoryId}`;
  };

  const federalQuestions = allQuestions.filter(q => q.category === "Bundesweit");
  const stateQuestions = userSettings?.selectedState 
    ? allQuestions.filter(q => q.category === userSettings.selectedState)
    : [];



  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lade Übungsfragen...</p>
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
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Übungsmodus</h1>
                  <p className="text-sm text-muted-foreground">Gezielt üben nach Kategorien</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mistakes Practice Section */}
        <Card className="mb-8 border-2 border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-red-500 p-3 rounded-lg">
                  <RotateCcw className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-foreground">Fehler üben</CardTitle>
                  <p className="text-muted-foreground mt-1">
                    Wiederhole Fragen, die du zuvor falsch beantwortet hast
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <Link href="/practice-mistakes" className="w-full sm:w-40">
                  <Button 
                    variant="outline" 
                    className="w-full h-10 border-red-600 text-red-700 hover:bg-red-100 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Fehler ansehen
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Marked Questions Practice Section */}
        <Card className="mb-8 border-2 border-yellow-200 dark:border-yellow-800 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-500 p-3 rounded-lg">
                  <Flag className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-foreground">Markierte Fragen</CardTitle>
                  <p className="text-muted-foreground mt-1">
                    Übe mit deinen {markedQuestionsCount} markierten Fragen
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <Link href="/practice-marked" className="w-full sm:w-40">
                  <Button 
                    variant="outline" 
                    className="w-full h-10 border-yellow-600 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-400 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Markierte ansehen
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* All Questions Practice */}
        <Card className="mb-8 border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500 p-3 rounded-lg">
                  <Play className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-foreground">Alle Fragen üben</CardTitle>
                  <p className="text-muted-foreground mt-1">
                    Bundesweite Fragen ({federalQuestions.length}) + 
                    {userSettings?.selectedState && stateQuestions.length > 0 
                      ? ` ${userSettings.selectedState} (${stateQuestions.length})`
                      : " Bundeslandspezifische Fragen"
                    }
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <Link href="/quiz?type=practice&mode=all">
                  <Button size="lg" className="w-full h-10 bg-blue-600 hover:bg-blue-700">
                    <Shuffle className="h-4 w-4 mr-2" />
                    Zufällig üben
                  </Button>
                </Link>
                <Link href="/quiz?type=practice&mode=all&chronological=true">
                  <Button size="lg" variant="outline" className="w-full h-10 border-blue-600 text-blue-700 hover:bg-blue-100 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20">
                    Chronologisch üben
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-card dark:bg-card rounded-lg border border-border">
                <Globe className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{federalQuestions.length}</div>
                <div className="text-sm text-muted-foreground">Bundesweite Fragen</div>
              </div>
              {userSettings?.selectedState && stateQuestions.length > 0 && (
                <div className="text-center p-4 bg-card dark:bg-card rounded-lg border border-border">
                  <Flag className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">{stateQuestions.length}</div>
                  <div className="text-sm text-muted-foreground">{userSettings.selectedState}</div>
                </div>
              )}
              <div className="text-center p-4 bg-card dark:bg-card rounded-lg border border-border">
                <Heart className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">
                  {federalQuestions.length + stateQuestions.length}
                </div>
                <div className="text-sm text-muted-foreground">Gesamt verfügbar</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Practice */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Nach Kategorien üben</h2>
          <p className="text-muted-foreground">Wählen Sie einen spezifischen Bereich zum gezielten Üben</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {thematicCategories.map((category) => {
            const IconComponent = category.icon;
            
            return (
              <Card key={category.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`${category.color} p-2 rounded-lg`}>
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {category.questionCount} Fragen
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">{category.description}</p>
                  <div className="flex flex-col gap-2">
                    <Link href={`/quiz?type=practice&category=${category.id}`}>
                      <Button 
                        className="w-full h-10" 
                        variant="outline"
                        disabled={category.questionCount === 0}
                      >
                        {category.questionCount > 0 && <Shuffle className="h-4 w-4 mr-2" />}
                        {category.questionCount > 0 ? "Zufällig üben" : "Keine Fragen verfügbar"}
                      </Button>
                    </Link>
                    {category.questionCount > 0 && (
                      <Link href={`/quiz?type=practice&category=${category.id}&chronological=true`}>
                        <Button 
                          className="w-full h-10" 
                          variant="secondary"
                        >
                          Chronologisch üben
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bundesland Specific */}
        {userSettings?.selectedState && stateQuestions.length > 0 && (
          <Card className="mt-8 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-500 p-2 rounded-lg">
                    <Flag className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-foreground">
                      {userSettings.selectedState} - Spezielle Fragen
                    </CardTitle>
                    <Badge variant="secondary">{stateQuestions.length} Fragen</Badge>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-col gap-2 sm:min-w-[10rem]">
                  <Link href={`/quiz?type=practice&category=${userSettings?.selectedState || 'Bundesweit'}`}>
                    <Button 
                      variant="outline" 
                      className="w-full h-10 border-green-600 text-green-700 hover:bg-green-100 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/20"
                    >
                      <Shuffle className="h-4 w-4 mr-2" />
                      Zufällig üben
                    </Button>
                  </Link>
                  <Link href={`/quiz?type=practice&category=${userSettings?.selectedState || 'Bundesweit'}&chronological=true`}>
                    <Button 
                      variant="secondary" 
                      className="w-full h-10 border-green-600 text-green-700 hover:bg-green-100 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/20"
                    >
                      Chronologisch üben
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Spezielle Fragen für Ihr Bundesland {userSettings.selectedState}. 
                Diese Fragen können im echten Test als Teil der 3 bundeslandspezifischen Fragen erscheinen.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}