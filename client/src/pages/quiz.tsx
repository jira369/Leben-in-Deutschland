import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { useQuiz } from "@/hooks/use-quiz";
import { ProgressBar } from "@/components/quiz/progress-bar";
import { QuestionCard } from "@/components/quiz/question-card";
import { QuizResults } from "@shared/schema";

export default function Quiz() {
  const [, setLocation] = useLocation();
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null);
  const [quizType, setQuizType] = useState<'full' | 'practice'>('full');
  
  const {
    quizState,
    timeRemaining,
    settings,
    startQuiz,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    finishQuiz,
    resetQuiz,
    isQuizActive,
    currentQuestion,
    selectedAnswer,
    progress,
    canGoNext,
    canGoPrevious,
  } = useQuiz();

  // Get quiz type from URL params
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const type = searchParams.get('type') as 'full' | 'practice' | null;
    const mode = searchParams.get('mode'); // 'all' for practice all questions
    
    if (type && (type === 'full' || type === 'practice')) {
      setQuizType(type);
    }
  }, []);

  // Start quiz when component mounts
  useEffect(() => {
    if (!isQuizActive && !quizResults) {
      startQuiz(quizType);
    }
  }, [isQuizActive, quizResults, quizType, startQuiz]);

  const handleFinishQuiz = async () => {
    const results = await finishQuiz(quizType);
    if (results) {
      setQuizResults(results);
      // Store results in localStorage for reliable access
      localStorage.setItem('quiz-results', JSON.stringify({ results, type: quizType }));
      setLocation('/results');
    }
  };

  const handleExitQuiz = async () => {
    // If quiz is in progress, finish it first to get results
    if (quizState && Object.keys(quizState.selectedAnswers).length > 0) {
      const results = await finishQuiz(quizType);
      if (results) {
        setQuizResults(results);
        localStorage.setItem('quiz-results', JSON.stringify({ results, type: quizType }));
        setLocation('/results');
        return;
      }
    }
    resetQuiz();
    setLocation('/');
  };

  if (!isQuizActive || !quizState || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Test wird geladen...</p>
        </div>
      </div>
    );
  }

  const isLastQuestion = quizState.currentQuestionIndex === quizState.questions.length - 1;
  const hasSelectedCurrentAnswer = selectedAnswer !== undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgressBar
          currentQuestion={quizState.currentQuestionIndex + 1}
          totalQuestions={quizState.questions.length}
          progress={progress}
          timeRemaining={timeRemaining}
          onExit={handleExitQuiz}
        />

        <div className="space-y-6">
          <QuestionCard
            question={currentQuestion}
            questionNumber={quizState.currentQuestionIndex + 1}
            selectedAnswer={selectedAnswer}
            showFeedback={hasSelectedCurrentAnswer}
            immediateFeedback={settings?.immediateFeedback || false}
            onAnswerSelect={selectAnswer}
          />

          {/* Navigation - Aligned with question content */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={previousQuestion}
                disabled={!canGoPrevious}
                className="px-6 py-3"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>
              
              <div className="flex items-center space-x-3">
                <Button variant="ghost" className="px-4 py-2">
                  <Flag className="mr-2 h-4 w-4" />
                  Markieren
                </Button>
              </div>

              {isLastQuestion ? (
                <Button
                  onClick={handleFinishQuiz}
                  className="px-6 py-3"
                  disabled={!hasSelectedCurrentAnswer}
                >
                  Test beenden
                </Button>
              ) : (
                <Button
                  onClick={nextQuestion}
                  disabled={quizType === 'full' ? !hasSelectedCurrentAnswer : !canGoNext}
                  className="px-6 py-3"
                >
                  Weiter
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
