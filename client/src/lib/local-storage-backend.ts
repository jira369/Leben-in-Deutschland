// Local storage backend for Capacitor native app
// Implements the same API surface as server/storage.ts but uses localStorage
import { OFFICIAL_TEST_QUESTION_COUNT, OFFICIAL_PASS_THRESHOLD, shuffleArray } from "@shared/constants";

interface Question {
  id: number;
  text: string;
  answers: string[];
  correctAnswer: number;
  explanation: string | null;
  category: string | null;
  difficulty: string | null;
  hasImage: boolean | null;
  imagePath: string | null;
}

interface StoredQuizSession {
  id: number;
  type: string;
  practiceType: string | null;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  percentage: number;
  passed: boolean;
  timeSpent: number | null;
  questionResults: { questionId: number; selectedAnswer: number; isCorrect: boolean }[] | null;
  createdAt: string;
}

interface StoredUserSettings {
  id: number;
  selectedState: string | null;
  hasSelectedState: boolean;
  timerEnabled: boolean;
}

interface StoredIncorrectAnswer {
  id: number;
  questionId: number;
  selectedAnswer: number;
  correctAnswer: number;
  createdAt: string;
}

const KEYS = {
  SESSIONS: 'lid_sessions',
  SETTINGS: 'lid_settings',
  INCORRECT: 'lid_incorrect',
  MARKED: 'lid_marked',
  NEXT_SESSION_ID: 'lid_next_sid',
  NEXT_INCORRECT_ID: 'lid_next_iid',
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export class LocalStorageBackend {
  private questions: Question[] = [];
  private loaded = false;

  async ensureQuestions(): Promise<void> {
    if (this.loaded) return;
    const mod = await import('../data/questions-data.json');
    const data = mod.default as Record<string, unknown>[];
    this.questions = data.map((q: Record<string, unknown>, index: number) => ({
      id: index + 1,
      text: q.text as string,
      answers: q.answers as string[],
      correctAnswer: q.correctAnswer as number,
      explanation: (q.explanation as string) || null,
      category: (q.category as string) || null,
      difficulty: (q.difficulty as string) || null,
      hasImage: (q.hasImage as boolean) ?? false,
      imagePath: (q.imagePath as string) || null,
    }));
    this.loaded = true;
  }

  // ===== Questions =====

  async getAllQuestions(): Promise<Question[]> {
    await this.ensureQuestions();
    return this.questions;
  }

  async getQuestionsByFilter(options: {
    category?: string;
    search?: string;
    limit?: number;
    random?: boolean;
    excludeIds?: number[];
    theme?: string;
    state?: string;
  }): Promise<Question[]> {
    await this.ensureQuestions();
    let filtered = [...this.questions];

    if (options.category) {
      if (options.category === 'Bundesweit') {
        filtered = filtered.filter(q => q.category === 'Bundesweit');
      } else if (options.category !== 'all') {
        filtered = filtered.filter(q => q.category === options.category);
      }
    }

    if (options.state && options.state !== 'Bundesweit') {
      if (!options.category || options.category === 'all') {
        filtered = filtered.filter(
          q => q.category === 'Bundesweit' || q.category === options.state,
        );
      }
    }

    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter(q => q.text.toLowerCase().includes(searchLower));
    }

    if (options.theme) {
      filtered = filtered.filter(q => {
        const text = q.text.toLowerCase();
        switch (options.theme) {
          case 'geschichte':
            return (
              text.includes('geschichte') || text.includes('nationalsozialismus') ||
              text.includes('ns-zeit') || text.includes('1933') || text.includes('1945') ||
              text.includes('krieg') || text.includes('ddr') || text.includes('demokratisch') ||
              text.includes('demokratie') || text.includes('verfolgung') ||
              text.includes('holocaust') || text.includes('widerstand')
            );
          case 'verfassung':
            return (
              text.includes('grundgesetz') || text.includes('verfassung') ||
              text.includes('rechtsstaatlichkeit') || text.includes('gewaltenteilung') ||
              text.includes('parlament') || text.includes('bundestag') ||
              text.includes('bundesrat') || text.includes('verfassungsgericht') ||
              text.includes('grundrechte') || text.includes('menschenrechte')
            );
          case 'mensch-gesellschaft':
            return (
              text.includes('religion') || text.includes('glaube') ||
              text.includes('gleichberechtigung') || text.includes('toleranz') ||
              text.includes('familie') || text.includes('ehe') || text.includes('frauen') ||
              text.includes('männer') || text.includes('diskriminierung') ||
              text.includes('integration') || text.includes('kultur')
            );
          case 'staat-buerger':
            return (
              text.includes('wahl') || text.includes('wählen') || text.includes('partei') ||
              text.includes('bürger') || text.includes('bürgerpflicht') ||
              text.includes('steuern') || text.includes('sozialversicherung') ||
              text.includes('personalausweis') || text.includes('pass') ||
              text.includes('meldepflicht')
            );
          default:
            return false;
        }
      });
    }

    if (options.excludeIds && options.excludeIds.length > 0) {
      const excludeSet = new Set(options.excludeIds);
      filtered = filtered.filter(q => !excludeSet.has(q.id));
    }

    if (options.random) {
      filtered = shuffleArray(filtered);
    }

    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  // ===== Quiz Sessions =====

  async createQuizSession(data: Record<string, unknown>): Promise<StoredQuizSession> {
    const sessions = getItem<StoredQuizSession[]>(KEYS.SESSIONS, []);
    const nextId = getItem<number>(KEYS.NEXT_SESSION_ID, 1);

    const session: StoredQuizSession = {
      id: nextId,
      type: data.type as string,
      practiceType: (data.practiceType as string) || null,
      totalQuestions: data.totalQuestions as number,
      correctAnswers: data.correctAnswers as number,
      incorrectAnswers: data.incorrectAnswers as number,
      percentage: data.percentage as number,
      passed: data.passed as boolean,
      timeSpent: (data.timeSpent as number) || null,
      questionResults: (data.questionResults as StoredQuizSession['questionResults']) || null,
      createdAt: new Date().toISOString(),
    };

    sessions.push(session);
    setItem(KEYS.SESSIONS, sessions);
    setItem(KEYS.NEXT_SESSION_ID, nextId + 1);

    return session;
  }

  async getRecentQuizSessions(limit = 10): Promise<StoredQuizSession[]> {
    const sessions = getItem<StoredQuizSession[]>(KEYS.SESSIONS, []);
    return sessions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async getQuizSessionStats(): Promise<{
    totalTests: number;
    averageScore: number;
    bestScore: number;
    totalStudyTime: number;
  }> {
    const sessions = getItem<StoredQuizSession[]>(KEYS.SESSIONS, []);
    const fullTests = sessions.filter(s => s.type === 'full' && s.totalQuestions === OFFICIAL_TEST_QUESTION_COUNT);

    if (fullTests.length === 0) {
      return { totalTests: 0, averageScore: 0, bestScore: 0, totalStudyTime: 0 };
    }

    const scores = fullTests.map(s => s.percentage);
    return {
      totalTests: fullTests.length,
      averageScore: Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length),
      bestScore: Math.max(...scores),
      totalStudyTime: fullTests.reduce((sum, s) => sum + (s.timeSpent || 0), 0),
    };
  }

  async clearAllQuizSessions(): Promise<void> {
    setItem(KEYS.SESSIONS, []);
  }

  // ===== User Settings =====

  async getUserSettings(): Promise<StoredUserSettings> {
    return getItem<StoredUserSettings>(KEYS.SETTINGS, {
      id: 1,
      selectedState: null,
      hasSelectedState: false,
      timerEnabled: true,
    });
  }

  async updateUserSettings(settings: Partial<StoredUserSettings>): Promise<StoredUserSettings> {
    const current = await this.getUserSettings();
    const updated = { ...current, ...settings };
    setItem(KEYS.SETTINGS, updated);
    return updated;
  }

  // ===== Detailed Stats =====

  async getDetailedStats(selectedState?: string): Promise<{
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    totalTests: number;
    testsPassedCount: number;
    testsPassedPercentage: number;
  }> {
    await this.ensureQuestions();
    const sessions = getItem<StoredQuizSession[]>(KEYS.SESSIONS, []);

    let totalQuestions: number;
    if (selectedState && selectedState !== 'Bundesweit') {
      totalQuestions = this.questions.filter(
        q => q.category === 'Bundesweit' || q.category === selectedState,
      ).length;
    } else {
      totalQuestions = this.questions.filter(q => q.category === 'Bundesweit').length;
    }

    const correctAnswers = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    const incorrectAnswers = sessions.reduce((sum, s) => sum + s.incorrectAnswers, 0);

    const fullTests = sessions.filter(s => s.type === 'full' && s.totalQuestions === OFFICIAL_TEST_QUESTION_COUNT);
    const totalTests = fullTests.length;
    const testsPassedCount = fullTests.filter(s => s.passed).length;
    const testsPassedPercentage = totalTests > 0
      ? Math.round((testsPassedCount / totalTests) * 100)
      : 0;

    return {
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      totalTests,
      testsPassedCount,
      testsPassedPercentage,
    };
  }

  async getUniqueQuestionsAnswered(): Promise<number> {
    const sessions = getItem<StoredQuizSession[]>(KEYS.SESSIONS, []);
    const uniqueIds = new Set<number>();
    for (const session of sessions) {
      if (session.questionResults) {
        for (const result of session.questionResults) {
          uniqueIds.add(result.questionId);
        }
      }
    }
    return uniqueIds.size;
  }

  // ===== Incorrect Answers =====

  async addIncorrectAnswer(data: Record<string, unknown>): Promise<StoredIncorrectAnswer> {
    const incorrect = getItem<StoredIncorrectAnswer[]>(KEYS.INCORRECT, []);
    const nextId = getItem<number>(KEYS.NEXT_INCORRECT_ID, 1);

    const record: StoredIncorrectAnswer = {
      id: nextId,
      questionId: data.questionId as number,
      selectedAnswer: data.selectedAnswer as number,
      correctAnswer: data.correctAnswer as number,
      createdAt: new Date().toISOString(),
    };

    incorrect.push(record);
    setItem(KEYS.INCORRECT, incorrect);
    setItem(KEYS.NEXT_INCORRECT_ID, nextId + 1);

    return record;
  }

  async getIncorrectQuestions(filter?: { state?: string }): Promise<Question[]> {
    await this.ensureQuestions();
    const incorrect = getItem<StoredIncorrectAnswer[]>(KEYS.INCORRECT, []);
    const questionIds = new Set(incorrect.map(ia => ia.questionId));

    let result = this.questions.filter(q => questionIds.has(q.id));

    if (filter?.state && filter.state !== 'Bundesweit') {
      result = result.filter(q => q.category === 'Bundesweit' || q.category === filter.state);
    } else if (filter?.state === 'Bundesweit') {
      result = result.filter(q => q.category === 'Bundesweit');
    }

    return result;
  }

  async getIncorrectAnswersCount(): Promise<number> {
    const incorrect = getItem<StoredIncorrectAnswer[]>(KEYS.INCORRECT, []);
    return new Set(incorrect.map(ia => ia.questionId)).size;
  }

  async clearIncorrectAnswers(): Promise<void> {
    setItem(KEYS.INCORRECT, []);
  }

  async removeIncorrectAnswersByQuestionId(questionId: number): Promise<void> {
    const incorrect = getItem<StoredIncorrectAnswer[]>(KEYS.INCORRECT, []);
    setItem(KEYS.INCORRECT, incorrect.filter(ia => ia.questionId !== questionId));
  }

  // ===== Marked Questions =====

  async addMarkedQuestion(questionId: number): Promise<{ id: number; questionId: number; createdAt: string }> {
    const marked = getItem<number[]>(KEYS.MARKED, []);
    if (!marked.includes(questionId)) {
      marked.push(questionId);
      setItem(KEYS.MARKED, marked);
    }
    return { id: questionId, questionId, createdAt: new Date().toISOString() };
  }

  async removeMarkedQuestion(questionId: number): Promise<void> {
    const marked = getItem<number[]>(KEYS.MARKED, []);
    setItem(KEYS.MARKED, marked.filter(id => id !== questionId));
  }

  async getMarkedQuestions(filter?: { state?: string }): Promise<Question[]> {
    await this.ensureQuestions();
    const marked = new Set(getItem<number[]>(KEYS.MARKED, []));

    let result = this.questions.filter(q => marked.has(q.id));

    if (filter?.state && filter.state !== 'Bundesweit') {
      result = result.filter(q => q.category === 'Bundesweit' || q.category === filter.state);
    } else if (filter?.state === 'Bundesweit') {
      result = result.filter(q => q.category === 'Bundesweit');
    }

    return result;
  }

  async getMarkedQuestionsCount(): Promise<number> {
    return getItem<number[]>(KEYS.MARKED, []).length;
  }

  async isQuestionMarked(questionId: number): Promise<boolean> {
    return getItem<number[]>(KEYS.MARKED, []).includes(questionId);
  }

  async clearAllMarkedQuestions(): Promise<void> {
    setItem(KEYS.MARKED, []);
  }
}
