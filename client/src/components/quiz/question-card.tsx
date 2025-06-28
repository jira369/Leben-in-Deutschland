import { Question } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AnswerFeedback } from "./answer-feedback";

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
  const hasSelectedAnswer = selectedAnswer !== undefined;
  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <Card className="bg-white rounded-2xl shadow-lg mb-6">
      <CardContent className="p-8">
        <div className="mb-6">
          <div className="flex items-start space-x-4 mb-4">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-primary font-semibold text-sm">{questionNumber}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 leading-relaxed">
                {question.text}
              </h3>
            </div>
          </div>
        </div>

        <RadioGroup
          value={selectedAnswer?.toString()}
          onValueChange={(value) => onAnswerSelect(parseInt(value))}
          className="space-y-3"
        >
          {question.answers.map((answer, index) => (
            <Label
              key={index}
              className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${
                selectedAnswer === index
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-primary/30 hover:bg-primary/5'
              }`}
            >
              <RadioGroupItem
                value={index.toString()}
                className="w-5 h-5 text-primary border-gray-300 focus:ring-primary focus:ring-2"
              />
              <span className={`ml-4 font-medium ${
                selectedAnswer === index ? 'text-primary' : 'text-gray-900 group-hover:text-primary'
              }`}>
                {answer}
              </span>
            </Label>
          ))}
        </RadioGroup>

        {showFeedback && hasSelectedAnswer && immediateFeedback && (
          <AnswerFeedback
            isCorrect={isCorrect}
            correctAnswer={question.answers[question.correctAnswer]}
            explanation={question.explanation}
          />
        )}
      </CardContent>
    </Card>
  );
}
