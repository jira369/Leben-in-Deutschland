import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
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
    setIsExiting(true);
    // Small delay to show exit animation
    setTimeout(async () => {
      const results = await finishQuiz(quizType);
      if (results) {
        setQuizResults(results);
        // Store results in localStorage for reliable access
        localStorage.setItem('quiz-results', JSON.stringify({ results, type: quizType }));
        setLocation('/results');
      }
    }, 500); // 500ms delay for animation
  };

  const handleExitQuiz = async () => {
    const answersGiven = quizState ? Object.keys(quizState.selectedAnswers).length : 0;
    
    setIsExiting(true);
    // Small delay to show exit animation
    setTimeout(async () => {
      // For practice mode: show results if more than 1 question answered
      if (quizType === 'practice' && answersGiven > 1) {
        const results = await finishQuiz(quizType);
        if (results) {
          setQuizResults(results);
          localStorage.setItem('quiz-results', JSON.stringify({ results, type: quizType }));
          setLocation('/results');
          return;
        }
      }
      
      // For full test: always show results if any questions answered
      if (quizType === 'full' && answersGiven > 0) {
        const results = await finishQuiz(quizType);
        if (results) {
          setQuizResults(results);
          localStorage.setItem('quiz-results', JSON.stringify({ results, type: quizType }));
          setLocation('/results');
          return;
        }
      }
      
      // If no questions answered (or only 1 in practice), go back to previous page
      resetQuiz();
      setLocation('/');
    }, 500); // 500ms delay for animation
  };

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
            onExit={handleExitQuiz}
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
    </motion.div>
  );
}
