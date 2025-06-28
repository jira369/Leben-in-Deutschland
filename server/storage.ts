import { questions, quizSessions, userSettings, type Question, type InsertQuestion, type QuizSession, type InsertQuizSession, type UserSettings, type InsertUserSettings } from "@shared/schema";

export interface IStorage {
  // Questions
  getAllQuestions(): Promise<Question[]>;
  getRandomQuestions(count: number): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  createManyQuestions(questions: InsertQuestion[]): Promise<Question[]>;
  
  // Quiz Sessions
  createQuizSession(session: InsertQuizSession): Promise<QuizSession>;
  getRecentQuizSessions(limit?: number): Promise<QuizSession[]>;
  getQuizSessionStats(): Promise<{
    totalTests: number;
    averageScore: number;
    bestScore: number;
    totalStudyTime: number;
  }>;
  
  // User Settings
  getUserSettings(): Promise<UserSettings | undefined>;
  updateUserSettings(settings: Partial<InsertUserSettings>): Promise<UserSettings>;
}

export class MemStorage implements IStorage {
  private questions: Map<number, Question> = new Map();
  private quizSessions: Map<number, QuizSession> = new Map();
  private userSettings: UserSettings | undefined;
  private currentQuestionId = 1;
  private currentSessionId = 1;

  constructor() {
    // Initialize with default settings
    this.userSettings = {
      id: 1,
      timerEnabled: false,
      immediateFeedback: true,
      shuffleQuestions: true,
      testMode: 'full'
    };
  }

  async getAllQuestions(): Promise<Question[]> {
    return Array.from(this.questions.values());
  }

  async getRandomQuestions(count: number): Promise<Question[]> {
    const allQuestions = Array.from(this.questions.values());
    const shuffled = this.shuffleArray([...allQuestions]);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.currentQuestionId++;
    const question: Question = { ...insertQuestion, id };
    this.questions.set(id, question);
    return question;
  }

  async createManyQuestions(insertQuestions: InsertQuestion[]): Promise<Question[]> {
    const createdQuestions: Question[] = [];
    for (const insertQuestion of insertQuestions) {
      const question = await this.createQuestion(insertQuestion);
      createdQuestions.push(question);
    }
    return createdQuestions;
  }

  async createQuizSession(insertSession: InsertQuizSession): Promise<QuizSession> {
    const id = this.currentSessionId++;
    const session: QuizSession = {
      ...insertSession,
      id,
      createdAt: new Date()
    };
    this.quizSessions.set(id, session);
    return session;
  }

  async getRecentQuizSessions(limit = 10): Promise<QuizSession[]> {
    const sessions = Array.from(this.quizSessions.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    return sessions;
  }

  async getQuizSessionStats(): Promise<{
    totalTests: number;
    averageScore: number;
    bestScore: number;
    totalStudyTime: number;
  }> {
    const sessions = Array.from(this.quizSessions.values());
    
    if (sessions.length === 0) {
      return {
        totalTests: 0,
        averageScore: 0,
        bestScore: 0,
        totalStudyTime: 0
      };
    }

    const totalTests = sessions.length;
    const scores = sessions.map(s => s.percentage);
    const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    const bestScore = Math.max(...scores);
    const totalStudyTime = sessions.reduce((sum, session) => sum + (session.timeSpent || 0), 0);

    return {
      totalTests,
      averageScore,
      bestScore,
      totalStudyTime
    };
  }

  async getUserSettings(): Promise<UserSettings | undefined> {
    return this.userSettings;
  }

  async updateUserSettings(settings: Partial<InsertUserSettings>): Promise<UserSettings> {
    this.userSettings = {
      ...this.userSettings!,
      ...settings
    };
    return this.userSettings;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export const storage = new MemStorage();
