import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Question, QuizState, QuizResults, UserSettings } from "@shared/schema";
import { calculateResults, getQuizTypeQuestions } from "@/lib/quiz-logic";
import { apiRequest } from "@/lib/queryClient";

export function useQuiz() {
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch all questions
  const { data: allQuestions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/questions'],
  });

  // Fetch user settings
  const { data: settings } = useQuery<UserSettings>({
    queryKey: ['/api/settings'],
  });

  // Initialize questions if empty
  const initializeQuestions = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/questions/initialize');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
    }
  });

  // Save quiz session
  const saveQuizSession = useMutation({
    mutationFn: async (results: QuizResults & { type: string }) => {
      const res = await apiRequest('POST', '/api/quiz-sessions', {
        type: results.type,
        totalQuestions: results.total,
        correctAnswers: results.correct,
        incorrectAnswers: results.incorrect,
        percentage: results.percentage,
        passed: results.passed,
        timeSpent: results.timeSpent,
        questionResults: results.questionResults.map(qr => ({
          questionId: qr.questionId,
          selectedAnswer: qr.selectedAnswer,
          isCorrect: qr.isCorrect,
        }))
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-sessions'] });
    }
  });

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  // Initialize questions if empty
  useEffect(() => {
    if (allQuestions.length === 0 && !questionsLoading) {
      initializeQuestions.mutate();
    }
  }, [allQuestions.length, questionsLoading]);

  const startQuiz = useCallback((type: 'full' | 'practice') => {
    if (allQuestions.length === 0) return;

    const shouldShuffle = settings?.shuffleQuestions ?? true;
    const questions = getQuizTypeQuestions(allQuestions, type, shouldShuffle);
    
    const newQuizState: QuizState = {
      questions,
      currentQuestionIndex: 0,
      selectedAnswers: {},
      startTime: Date.now(),
    };

    // Set timer if enabled
    if (settings?.timerEnabled && type === 'full') {
      setTimeRemaining(45 * 60); // 45 minutes for full test
      newQuizState.timeRemaining = 45 * 60;
    } else if (settings?.timerEnabled && type === 'practice') {
      setTimeRemaining(15 * 60); // 15 minutes for practice
      newQuizState.timeRemaining = 15 * 60;
    } else {
      setTimeRemaining(null);
    }

    setQuizState(newQuizState);
  }, [allQuestions, settings]);

  const selectAnswer = useCallback((answerIndex: number) => {
    if (!quizState) return;

    setQuizState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        selectedAnswers: {
          ...prev.selectedAnswers,
          [prev.currentQuestionIndex]: answerIndex
        }
      };
    });
  }, [quizState]);

  const nextQuestion = useCallback(() => {
    if (!quizState) return;

    setQuizState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        currentQuestionIndex: Math.min(prev.currentQuestionIndex + 1, prev.questions.length - 1)
      };
    });
  }, [quizState]);

  const previousQuestion = useCallback(() => {
    if (!quizState) return;

    setQuizState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        currentQuestionIndex: Math.max(prev.currentQuestionIndex - 1, 0)
      };
    });
  }, [quizState]);

  const finishQuiz = useCallback(async (type: 'full' | 'practice') => {
    if (!quizState) return null;

    const results = calculateResults(quizState);
    
    // Save results to backend
    try {
      await saveQuizSession.mutateAsync({ ...results, type });
    } catch (error) {
      console.error('Failed to save quiz session:', error);
    }

    return results;
  }, [quizState, saveQuizSession]);

  const resetQuiz = useCallback(() => {
    setQuizState(null);
    setTimeRemaining(null);
  }, []);

  return {
    quizState,
    timeRemaining,
    questionsLoading,
    settings,
    startQuiz,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    finishQuiz,
    resetQuiz,
    isQuizActive: quizState !== null,
    currentQuestion: quizState ? quizState.questions[quizState.currentQuestionIndex] : null,
    selectedAnswer: quizState ? quizState.selectedAnswers[quizState.currentQuestionIndex] : undefined,
    progress: quizState ? ((quizState.currentQuestionIndex + 1) / quizState.questions.length) * 100 : 0,
    canGoNext: quizState ? quizState.currentQuestionIndex < quizState.questions.length - 1 : false,
    canGoPrevious: quizState ? quizState.currentQuestionIndex > 0 : false,
  };
}
