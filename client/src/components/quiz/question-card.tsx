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
  allowAnswerChange?: boolean;
  onAnswerSelect: (answerIndex: number) => void;
}

export function QuestionCard({
  question,
  questionNumber,
  selectedAnswer,
  showFeedback = false,
  immediateFeedback = true,
  allowAnswerChange = false,
  onAnswerSelect
}: QuestionCardProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const hasSelectedAnswer = selectedAnswer !== undefined;
  const isCorrect = selectedAnswer !== undefined && selectedAnswer === question.correctAnswer;

  return (
    <Card className="rounded-2xl shadow-lg mb-6">
      <CardContent className="p-6 sm:p-8">
        <div className="mb-6 sm:mb-8">
          <div className="mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground leading-tight hyphenate">
              {question.text}
            </h3>
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
          onValueChange={hasSelectedAnswer && !allowAnswerChange ? undefined : (value) => onAnswerSelect(parseInt(value))}
          className="space-y-4 sm:space-y-5"
        >
          {question.answers.map((answer, index) => (
            <Label
              key={index}
              className={`flex items-start p-4 sm:p-5 rounded-xl border-2 transition-all duration-200 group min-w-0 ${
                hasSelectedAnswer && !allowAnswerChange ? 'cursor-default' : 'cursor-pointer'
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
                disabled={hasSelectedAnswer && !allowAnswerChange}
                className="w-5 h-5 shrink-0 mt-0.5 text-primary border-border focus:ring-primary focus:ring-2"
              />
              <span className={`ml-4 font-medium leading-relaxed hyphenate break-words min-w-0 ${
                selectedAnswer === index
                  ? 'text-primary'
                  : hasSelectedAnswer
                    ? 'text-muted-foreground'
                    : 'text-foreground group-hover:text-primary'
              }`}>
                {answer.includes('/') ? answer.split('/').reduce((acc: React.ReactNode[], part, i, arr) => {
                  if (i > 0) acc.push(<wbr key={`wbr-${i}`} />);
                  acc.push(i < arr.length - 1 ? part + '/' : part);
                  return acc;
                }, []) : answer}
              </span>
            </Label>
          ))}
        </RadioGroup>

        {hasSelectedAnswer && immediateFeedback && showFeedback && (
          <AnswerFeedback
            isCorrect={isCorrect}
            correctAnswer={question.answers[question.correctAnswer]}
            explanation={question.explanation || undefined}
          />
        )}
      </CardContent>
    </Card>
  );
}
