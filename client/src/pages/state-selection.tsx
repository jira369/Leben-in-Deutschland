import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const GERMAN_STATES = [
  { code: "Baden-Württemberg", name: "Baden-Württemberg", capital: "Stuttgart" },
  { code: "Bayern", name: "Bayern", capital: "München" },
  { code: "Berlin", name: "Berlin", capital: "Berlin" },
  { code: "Brandenburg", name: "Brandenburg", capital: "Potsdam" },
  { code: "Bremen", name: "Bremen", capital: "Bremen" },
  { code: "Hamburg", name: "Hamburg", capital: "Hamburg" },
  { code: "Hessen", name: "Hessen", capital: "Wiesbaden" },
  { code: "Mecklenburg-Vorpommern", name: "Mecklenburg-Vorpommern", capital: "Schwerin" },
  { code: "Niedersachsen", name: "Niedersachsen", capital: "Hannover" },
  { code: "NRW", name: "Nordrhein-Westfalen", capital: "Düsseldorf" },
  { code: "Rheinland-Pfalz", name: "Rheinland-Pfalz", capital: "Mainz" },
  { code: "Saarland", name: "Saarland", capital: "Saarbrücken" },
  { code: "Sachsen", name: "Sachsen", capital: "Dresden" },
  { code: "Sachsen-Anhalt", name: "Sachsen-Anhalt", capital: "Magdeburg" },
  { code: "Schleswig-Holstein", name: "Schleswig-Holstein", capital: "Kiel" },
  { code: "Thüringen", name: "Thüringen", capital: "Erfurt" }
];

export default function StateSelection() {
  const [, setLocation] = useLocation();
  const [selectedState, setSelectedState] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveStateMutation = useMutation({
    mutationFn: async (state: string) => {
      const response = await apiRequest("PATCH", "/api/settings", {
        selectedState: state,
        hasSelectedState: true
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Bundesland gespeichert",
        description: "Ihre Auswahl wurde erfolgreich gespeichert.",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Beim Speichern ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    },
  });

  const handleStateSelect = (stateCode: string) => {
    setSelectedState(stateCode);
  };

  const handleContinue = () => {
    if (selectedState) {
      saveStateMutation.mutate(selectedState);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bundesland auswählen
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Wählen Sie das Bundesland aus, in dem Sie leben. Dies beeinflusst die 
            Bundesland-spezifischen Fragen in Ihrem Einbürgerungstest.
          </p>
        </div>

        {/* Information Card */}
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">i</span>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Warum ist diese Auswahl wichtig?
                </h3>
                <p className="text-blue-800 text-sm leading-relaxed">
                  Der Einbürgerungstest besteht aus 33 Fragen: 30 bundesweite Fragen zu Geschichte, 
                  Politik und Gesellschaft Deutschlands sowie 3 spezifische Fragen zu Ihrem Bundesland. 
                  Diese Auswahl stellt sicher, dass Sie die richtigen Fragen für Ihr Bundesland erhalten.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* State Selection Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Wählen Sie Ihr Bundesland</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {GERMAN_STATES.map((state) => (
                <button
                  key={state.code}
                  onClick={() => handleStateSelect(state.code)}
                  className={`p-4 text-left border rounded-lg transition-all duration-200 hover:shadow-md ${
                    selectedState === state.code
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`font-medium ${
                        selectedState === state.code ? "text-primary" : "text-gray-900"
                      }`}>
                        {state.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Hauptstadt: {state.capital}
                      </p>
                    </div>
                    {selectedState === state.code && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <ChevronRight className="h-3 w-3 text-white rotate-90" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Continue Button */}
            <div className="mt-8 flex justify-center">
              <Button 
                onClick={handleContinue}
                disabled={!selectedState || saveStateMutation.isPending}
                size="lg"
                className="px-8"
              >
                {saveStateMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Speichern...
                  </>
                ) : (
                  <>
                    Auswahl bestätigen
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Legal Notice */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Diese Auswahl kann später in den Einstellungen geändert werden.
          </p>
        </div>
      </main>
    </div>
  );
}