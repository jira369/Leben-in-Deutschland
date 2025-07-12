import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Question, QuizState, QuizResults, UserSettings } from "@shared/schema";
import { calculateResults, getQuizTypeQuestions, fetchQuestionsForQuiz, trackIncorrectAnswers } from "@/lib/quiz-logic";
import { apiRequest } from "@/lib/queryClient";

export function useQuiz() {
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [currentQuizType, setCurrentQuizType] = useState<'full' | 'practice' | null>(null);
  const queryClient = useQueryClient();

  // Fetch all questions
  const { data: allQuestions = [], isLoading: questionsLoading } = useQuery<Question[]>({
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
    mutationFn: async (results: QuizResults & { type: string; practiceType?: string }) => {
      const res = await apiRequest('POST', '/api/quiz-sessions', {
        type: results.type,
        practiceType: results.practiceType,
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
      // Invalidate cache for all quiz session related queries
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-sessions/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-sessions/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-sessions/detailed-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-sessions'] });
    }
  });



  // Initialize questions if empty
  useEffect(() => {
    if (allQuestions.length === 0 && !questionsLoading) {
      initializeQuestions.mutate();
    }
  }, [allQuestions.length, questionsLoading]);

  const startQuiz = useCallback(async (type: 'full' | 'practice') => {
    // Get URL params to determine practice mode and category
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get('mode');
    const category = searchParams.get('category');
    
    let questionCount = type === 'full' ? 33 : 10;
    
    // For special modes, use appropriate count
    if (mode === "all") {
      questionCount = 1000; // Large number to get all questions
    } else if (mode === "mistakes" || mode === "marked") {
      questionCount = 1000; // Don't limit mistake/marked practice - get all available questions
    }
    
    const selectedState = settings?.selectedState;

    try {
      // Check for chronological ordering
      const chronological = searchParams.get('chronological') === 'true';
      
      // Fetch questions with proper mode/category parameters
      const questions = await fetchQuestionsForQuiz(
        questionCount, 
        selectedState || undefined, 
        mode || undefined, 
        category || undefined,
        chronological
      );
      
      const newQuizState: QuizState = {
        questions,
        currentQuestionIndex: 0,
        selectedAnswers: {},
        startTime: Date.now(),
      };

      // Set quiz type FIRST
      setCurrentQuizType(type);
      
      setQuizState(newQuizState);
    } catch (error) {
      console.error('Failed to start quiz:', error);
    }
  }, [settings]);

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
    
    // Determine practice type based on URL params
    let practiceType = undefined;
    if (type === 'practice') {
      const searchParams = new URLSearchParams(window.location.search);
      const mode = searchParams.get('mode');
      const category = searchParams.get('category');
      
      if (mode === 'mistakes') {
        practiceType = 'Fehler üben';
      } else if (mode === 'marked') {
        practiceType = 'Markierte üben';
      } else if (mode === 'state') {
        practiceType = 'bundeslandspezifische Fragen';
      } else if (mode === 'all') {
        practiceType = 'alle Fragen';
      } else if (category) {
        const categoryNames: Record<string, string> = {
          'geschichte': 'Geschichte',
          'verfassung': 'Verfassung und Recht',
          'mensch-gesellschaft': 'Mensch und Gesellschaft',
          'staat-buerger': 'Staat und Bürger'
        };
        practiceType = categoryNames[category] || category;
      } else {
        practiceType = 'gemischte Fragen';
      }
    }
    
    // Track incorrect answers for future practice
    try {
      await trackIncorrectAnswers(results.questionResults);
      
      // Invalidate incorrect questions cache to refresh UI
      queryClient.invalidateQueries({ queryKey: ['/api/incorrect-questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/incorrect-answers/count'] });
    } catch (error) {
      console.error('Failed to track incorrect answers:', error);
    }
    
    // Save results to backend
    try {
      await saveQuizSession.mutateAsync({ ...results, type, practiceType });
    } catch (error) {
      console.error('Failed to save quiz session:', error);
    }

    return results;
  }, [quizState, saveQuizSession]);

  const resetQuiz = useCallback(() => {
    setQuizState(null);
    setCurrentQuizType(null);
  }, []);

  return {
    quizState,
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
