import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Flag, AlertTriangle } from "lucide-react";
import { useQuiz } from "@/hooks/use-quiz";
import { useMarkedQuestions } from "@/hooks/use-marked-questions";
import { ProgressBar } from "@/components/quiz/progress-bar";
import { QuestionCard } from "@/components/quiz/question-card";
import { Timer } from "@/components/quiz/timer";
import { QuizResults } from "@shared/schema";

export default function Quiz() {
  const [, setLocation] = useLocation();
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null);
  const [quizType, setQuizType] = useState<'full' | 'practice'>('full');
  const [isExiting, setIsExiting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const isMounted = useRef(true);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  const {
    quizState,
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

  const { isQuestionMarked, toggleMark } = useMarkedQuestions();

  // Parse URL params and start quiz in a single effect to avoid race condition
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const type = searchParams.get('type') as 'full' | 'practice' | null;
    const resolvedType = (type === 'full' || type === 'practice') ? type : 'full';

    setQuizType(resolvedType);
    if (!isQuizActive && !quizResults) {
      startQuiz(resolvedType);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFinishQuiz = useCallback(async () => {
    setIsExiting(true);
    exitTimerRef.current = setTimeout(async () => {
      if (!isMounted.current) return;
      const results = await finishQuiz(quizType);
      if (results && isMounted.current) {
        setQuizResults(results);
        localStorage.setItem('quiz-results', JSON.stringify({ results, type: quizType }));
        setLocation('/results');
      }
    }, 500);
  }, [quizType, finishQuiz, setLocation]);

  const handleExitRequest = () => {
    setShowExitConfirm(true);
  };

  const handleExitQuiz = useCallback(async () => {
    setShowExitConfirm(false);
    const answersGiven = quizState ? Object.keys(quizState.selectedAnswers).length : 0;

    setIsExiting(true);
    exitTimerRef.current = setTimeout(async () => {
      if (!isMounted.current) return;

      if (quizType === 'full') {
        // Testsimulation: discard all data — as if the test never happened
        resetQuiz();
        setLocation('/');
        return;
      }

      // Übungsmodus: save results if questions were answered
      if (answersGiven > 1) {
        const results = await finishQuiz(quizType);
        if (results && isMounted.current) {
          setQuizResults(results);
          localStorage.setItem('quiz-results', JSON.stringify({ results, type: quizType }));
          setLocation('/results');
          return;
        }
      }

      if (isMounted.current) {
        resetQuiz();
        setLocation('/');
      }
    }, 500);
  }, [quizState, quizType, finishQuiz, resetQuiz, setLocation]);

  if (!isQuizActive || !quizState || !currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Test wird geladen...</p>
        </div>
      </div>
    );
  }

  const isLastQuestion = quizState.currentQuestionIndex === quizState.questions.length - 1;
  const hasSelectedCurrentAnswer = selectedAnswer !== undefined;

  return (
    <motion.div 
      className="min-h-screen bg-background"
      initial={{ opacity: 1 }}
      animate={{ 
        opacity: isExiting ? 0 : 1,
        scale: isExiting ? 0.95 : 1
      }}
      transition={{ 
        duration: 0.5,
        ease: "easeInOut"
      }}
    >
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ProgressBar
            currentQuestion={quizState.currentQuestionIndex + 1}
            totalQuestions={quizState.questions.length}
            progress={progress}
            onExit={handleExitRequest}
            quizType={quizType}
            startTime={quizState.startTime}
            onTimeUp={handleFinishQuiz}
            timerEnabled={settings?.timerEnabled ?? true}
          />
        </motion.div>

        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <QuestionCard
            question={currentQuestion}
            questionNumber={quizState.currentQuestionIndex + 1}
            selectedAnswer={selectedAnswer}
            showFeedback={hasSelectedCurrentAnswer && quizType === 'practice'}
            immediateFeedback={quizType === 'practice'}
            onAnswerSelect={selectAnswer}
          />

        </motion.div>

        {/* Fixed navigation at bottom of screen */}
        <motion.div 
          className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="max-w-4xl mx-auto p-4">
            <div className="flex justify-between items-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  onClick={previousQuestion}
                  disabled={!canGoPrevious || isExiting}
                  className="px-4 py-3 h-12"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Zurück
                </Button>
              </motion.div>
              
              <div className="flex items-center space-x-3">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button 
                    variant="ghost" 
                    className="px-3 py-3 h-12"
                    onClick={() => currentQuestion && toggleMark(currentQuestion.id)}
                    disabled={isExiting}
                  >
                    <Flag className={`h-5 w-5 ${
                      currentQuestion && isQuestionMarked(currentQuestion.id) 
                        ? 'fill-yellow-500 text-yellow-500' 
                        : ''
                    }`} />
                  </Button>
                </motion.div>
              </div>

              {isLastQuestion ? (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleFinishQuiz}
                    className="px-4 py-3 h-12"
                    disabled={!hasSelectedCurrentAnswer || isExiting}
                  >
                    {isExiting 
                      ? 'Wird beendet...' 
                      : (quizType === 'full' ? 'Test beenden' : 'Übung beenden')
                    }
                  </Button>
                </motion.div>
              ) : (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={nextQuestion}
                    disabled={(quizType === 'full' ? !hasSelectedCurrentAnswer : !canGoNext) || isExiting}
                    className="px-4 py-3 h-12"
                  >
                    Weiter
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {quizType === 'full' ? 'Test beenden?' : 'Übung beenden?'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {quizType === 'full'
              ? `Sie haben ${quizState ? Object.keys(quizState.selectedAnswers).length : 0} von ${quizState?.questions.length || 33} Fragen beantwortet. Unbeantwortete Fragen werden als falsch gewertet.`
              : 'Möchten Sie die Übung wirklich beenden?'
            }
          </p>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowExitConfirm(false)}>
              Weiter üben
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleExitQuiz}>
              Beenden
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
