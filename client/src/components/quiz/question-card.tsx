import { Question } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Image, X } from "lucide-react";
import { AnswerFeedback } from "./answer-feedback";
import { useState } from "react";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  selectedAnswer?: number;
  showFeedback?: boolean;
  immediateFeedback?: boolean;
  onAnswerSelect: (answerIndex: number) => void;
}

export function QuestionCard({
  question,
  questionNumber,
  selectedAnswer,
  showFeedback = false,
  immediateFeedback = true,
  onAnswerSelect
}: QuestionCardProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const hasSelectedAnswer = selectedAnswer !== undefined;
  const isCorrect = selectedAnswer !== undefined && selectedAnswer + 1 === question.correctAnswer;

  return (
    <Card className="rounded-2xl shadow-lg mb-6">
      <CardContent className="p-8">
        <div className="mb-6">
          <div className="flex items-start space-x-4 mb-4">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-primary font-semibold text-sm">{questionNumber}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-foreground leading-relaxed hyphenate">
                {question.text}
              </h3>
            </div>
          </div>
          
          {question.hasImage && question.imagePath && (
            <div className="mt-4 mb-6">
              <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
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
                      Bild zu Frage {questionNumber}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="mt-4 flex justify-center overflow-auto">
                    <img 
                      src={`/attached_assets/${question.imagePath}`}
                      alt={`Bild zu Frage ${questionNumber}`}
                      className="max-w-full max-h-[70vh] object-contain rounded-lg border border-border shadow-sm"
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
        </div>

        <RadioGroup
          key={question.id}
          value={selectedAnswer?.toString() || ""}
          onValueChange={hasSelectedAnswer ? undefined : (value) => onAnswerSelect(parseInt(value))}
          className="space-y-3"
        >
          {question.answers.map((answer, index) => (
            <Label
              key={index}
              className={`flex items-center p-4 rounded-xl border-2 transition-all duration-200 group ${
                hasSelectedAnswer ? 'cursor-default' : 'cursor-pointer'
              } ${
                selectedAnswer === index
                  ? 'border-primary bg-primary/5'
                  : hasSelectedAnswer 
                    ? 'border-border bg-muted/50' 
                    : 'border-border hover:border-primary/30 hover:bg-primary/5'
              }`}
            >
              <RadioGroupItem
                value={index.toString()}
                disabled={hasSelectedAnswer}
                className="w-5 h-5 text-primary border-border focus:ring-primary focus:ring-2"
              />
              <span className={`ml-4 font-medium hyphenate ${
                selectedAnswer === index 
                  ? 'text-primary' 
                  : hasSelectedAnswer 
                    ? 'text-muted-foreground' 
                    : 'text-foreground group-hover:text-primary'
              }`}>
                {answer}
              </span>
            </Label>
          ))}
        </RadioGroup>

        {showFeedback && hasSelectedAnswer && immediateFeedback && (
          <AnswerFeedback
            isCorrect={isCorrect}
            correctAnswer={question.answers[question.correctAnswer - 1]}
            explanation={question.explanation || undefined}
          />
        )}
      </CardContent>
    </Card>
  );
}
