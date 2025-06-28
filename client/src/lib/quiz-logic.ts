import { Question, QuizResults, QuizState } from "@shared/schema";

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function calculateResults(quizState: QuizState): QuizResults {
  let correct = 0;
  let incorrect = 0;
  const questionResults: QuizResults['questionResults'] = [];

  Object.keys(quizState.selectedAnswers).forEach(questionIndexStr => {
    const questionIndex = parseInt(questionIndexStr);
    const question = quizState.questions[questionIndex];
    const selectedAnswer = quizState.selectedAnswers[questionIndex];
    
    if (question && selectedAnswer !== undefined) {
      const isCorrect = selectedAnswer === question.correctAnswer;
      
      if (isCorrect) {
        correct++;
      } else {
        incorrect++;
      }

      questionResults.push({
        questionId: question.id,
        selectedAnswer,
        isCorrect,
        question
      });
    }
  });

  const total = correct + incorrect;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  // German citizenship test: Need 17 out of 33 questions correct to pass
  const passed = total === 33 ? correct >= 17 : correct >= Math.ceil(total * 0.51);
  const timeSpent = Math.floor((Date.now() - quizState.startTime) / 1000);

  return {
    correct,
    incorrect,
    total,
    percentage,
    passed,
    timeSpent,
    questionResults
  };
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function getQuizTypeQuestions(questions: Question[], type: 'full' | 'practice', shuffle: boolean = true): Question[] {
  let selectedQuestions = [...questions];
  
  if (shuffle) {
    selectedQuestions = shuffleArray(selectedQuestions);
  }
  
  if (type === 'practice') {
    selectedQuestions = selectedQuestions.slice(0, 10);
  } else {
    selectedQuestions = selectedQuestions.slice(0, 33);
  }
  
  return selectedQuestions;
}

export async function fetchQuestionsForQuiz(count: number, selectedState?: string): Promise<Question[]> {
  const params = new URLSearchParams({ count: count.toString() });
  if (selectedState && selectedState !== "Bundesweit") {
    params.append('state', selectedState);
  }
  
  const response = await fetch(`/api/questions/random/${count}?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch questions');
  }
  
  return response.json();
}
