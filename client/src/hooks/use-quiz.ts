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
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-sessions/unique-questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/unplayed/count'] });
    }
  });  const startQuiz = useCallback(async (type: 'full' | 'practice') => {
    // Get URL params to determine practice mode and category
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get('mode');
    const category = searchParams.get('category');
    
    let questionCount = type === 'full' ? 33 : 10;
    
    // For special modes, use appropriate count
    if (mode === "all") {
      questionCount = 1000; // Large number to get all questions
    } else if (mode === "mistakes" || mode === "marked" || mode === "unplayed") {
      questionCount = 1000;
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
      
      // Resume progress for chronological practice
      let resumeIndex = 0;
      const progressKey = chronological ? `quiz-progress-${mode || category || 'default'}` : null;
      if (progressKey) {
        try {
          const saved = localStorage.getItem(progressKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.questionIndex < questions.length) {
              resumeIndex = parsed.questionIndex;
            }
          }
        } catch {}
      }

      const newQuizState: QuizState = {
        questions,
        currentQuestionIndex: resumeIndex,
        selectedAnswers: {},
        startTime: Date.now(),
        timeRemaining: type === 'full' ? 3600 : undefined,
      };

      setCurrentQuizType(type);
      setQuizState(newQuizState);
    } catch (error) {
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
      const newIndex = Math.min(prev.currentQuestionIndex + 1, prev.questions.length - 1);

      // Save progress for chronological modes
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('chronological') === 'true') {
        const mode = searchParams.get('mode');
        const category = searchParams.get('category');
        const key = `quiz-progress-${mode || category || 'default'}`;
        localStorage.setItem(key, JSON.stringify({ questionIndex: newIndex }));
      }

      return { ...prev, currentQuestionIndex: newIndex };
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

    // Clear chronological progress on finish
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('chronological') === 'true') {
      const mode = searchParams.get('mode');
      const category = searchParams.get('category');
      localStorage.removeItem(`quiz-progress-${mode || category || 'default'}`);
    }

    const results = calculateResults(quizState);

    // Determine practice type based on URL params
    let practiceType = undefined;
    if (type === 'practice') {
      const mode = searchParams.get('mode');
      const category = searchParams.get('category');
      
      if (mode === 'mistakes') {
        practiceType = 'Fehler üben';
      } else if (mode === 'marked') {
        practiceType = 'Markierte üben';
      } else if (mode === 'state') {
        practiceType = 'Bundeslandspezifische Fragen';
      } else if (mode === 'all') {
        practiceType = 'Alle Fragen';
      } else if (mode === 'unplayed') {
        practiceType = 'Noch nicht geübte Fragen';
      } else if (category) {
        const categoryNames: Record<string, string> = {
          'geschichte': 'Geschichte',
          'verfassung': 'Verfassung und Recht',
          'mensch-gesellschaft': 'Mensch und Gesellschaft',
          'staat-buerger': 'Staat und Bürger'
        };
        practiceType = categoryNames[category] || category;
      } else {
        practiceType = 'Gemischte Fragen';
      }
    }
    
    // Track incorrect answers for future practice
    try {
      await trackIncorrectAnswers(results.questionResults);
      
      // Invalidate incorrect questions cache to refresh UI
      queryClient.invalidateQueries({ queryKey: ['/api/incorrect-questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/incorrect-answers/count'] });
    } catch (error) {
    }
    
    // Save results to backend
    try {
      await saveQuizSession.mutateAsync({ ...results, type, practiceType });
    } catch (error) {
    }

    return results;
  }, [quizState, saveQuizSession]);

  const resetQuiz = useCallback(() => {
    // Clear chronological progress
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('chronological') === 'true') {
      const mode = searchParams.get('mode');
      const category = searchParams.get('category');
      localStorage.removeItem(`quiz-progress-${mode || category || 'default'}`);
    }
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
