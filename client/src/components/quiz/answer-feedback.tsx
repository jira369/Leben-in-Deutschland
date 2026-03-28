import { CheckCircle, XCircle } from "lucide-react";

interface AnswerFeedbackProps {
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
}

export function AnswerFeedback({ isCorrect, correctAnswer, explanation }: AnswerFeedbackProps) {
  return (
    <div className={`mt-6 p-4 rounded-xl border ${
      isCorrect 
        ? 'bg-green-50 border-green-200' 
        : 'bg-red-50 border-red-200'
    } animate-in slide-in-from-top-2 duration-300`}>
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isCorrect ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {isCorrect ? (
            <CheckCircle className="h-5 w-5 text-white" />
          ) : (
            <XCircle className="h-5 w-5 text-white" />
          )}
        </div>
        <div className="flex-1">
          <p className={`font-semibold ${
            isCorrect ? 'text-green-800' : 'text-red-800'
          }`}>
            {isCorrect ? 'Richtig!' : 'Falsch!'}
          </p>
          {!isCorrect && (
            <p className="text-red-700 text-sm mt-1">
              Die richtige Antwort ist: <span className="font-semibold">{correctAnswer}</span>
            </p>
          )}
          {explanation && (
            <p className={`text-sm mt-1 ${
              isCorrect ? 'text-green-700' : 'text-red-700'
            }`}>
              {explanation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
