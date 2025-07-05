import { 
  questions, quizSessions, userSettings, incorrectAnswers, markedQuestions,
  type Question, type InsertQuestion, 
  type QuizSession, type InsertQuizSession,
  type UserSettings, type InsertUserSettings,
  type IncorrectAnswer, type InsertIncorrectAnswer,
  type MarkedQuestion, type InsertMarkedQuestion
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, inArray, or } from "drizzle-orm";

export interface IStorage {
  // Questions
  getAllQuestions(): Promise<Question[]>;
  getRandomQuestions(count: number): Promise<Question[]>;
  getRandomQuestionsForState(federalCount: number, stateCategory?: string): Promise<Question[]>;
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
  
  // Detailed Statistics
  getDetailedStats(selectedState?: string): Promise<{
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    totalTests: number;
    testsPassedCount: number;
    testsPassedPercentage: number;
  }>;
  
  // Unique Questions Count
  getUniqueQuestionsAnswered(): Promise<number>;
  
  // Incorrect Answers Management
  addIncorrectAnswer(incorrectAnswer: InsertIncorrectAnswer): Promise<IncorrectAnswer>;
  getIncorrectQuestions(): Promise<Question[]>;
  getIncorrectAnswersCount(): Promise<number>;
  clearIncorrectAnswers(): Promise<void>;
  
  // Marked Questions Management
  addMarkedQuestion(questionId: number): Promise<MarkedQuestion>;
  removeMarkedQuestion(questionId: number): Promise<void>;
  getMarkedQuestions(): Promise<Question[]>;
  getMarkedQuestionsCount(): Promise<number>;
  isQuestionMarked(questionId: number): Promise<boolean>;
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
      testMode: 'full',
      selectedState: null,
      hasSelectedState: false
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

  async getRandomQuestionsForState(federalCount: number, stateCategory?: string): Promise<Question[]> {
    const allQuestions = Array.from(this.questions.values());
    
    // Get federal questions (category: "Bundesweit")
    const federalQuestions = allQuestions.filter(q => q.category === "Bundesweit");
    const shuffledFederal = this.shuffleArray([...federalQuestions]).slice(0, federalCount);
    
    let stateQuestions: Question[] = [];
    if (stateCategory && federalCount < 33) {
      // Get state-specific questions
      const stateSpecificQuestions = allQuestions.filter(q => q.category === stateCategory);
      const stateCount = 33 - federalCount; // Remaining questions for state
      stateQuestions = this.shuffleArray([...stateSpecificQuestions]).slice(0, stateCount);
    }
    
    return [...shuffledFederal, ...stateQuestions];
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

  async getDetailedStats(selectedState?: string): Promise<{
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    totalTests: number;
    testsPassedCount: number;
    testsPassedPercentage: number;
  }> {
    const totalQuestions = this.questions.size;
    
    // Calculate stats from quiz sessions
    const sessions = Array.from(this.quizSessions.values());
    const totalTests = sessions.length;
    const testsPassedCount = sessions.filter(s => s.passed).length;
    const testsPassedPercentage = totalTests > 0 
      ? Math.round((testsPassedCount / totalTests) * 100) 
      : 0;
    
    const correctAnswers = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    const incorrectAnswers = sessions.reduce((sum, s) => sum + s.incorrectAnswers, 0);

    return {
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      totalTests,
      testsPassedCount,
      testsPassedPercentage
    };
  }

  // Placeholder implementations for MemStorage - would use a Map in real implementation
  async addIncorrectAnswer(incorrectAnswer: InsertIncorrectAnswer): Promise<IncorrectAnswer> {
    // In memory implementation would need a Map here
    throw new Error("MemStorage doesn't support incorrect answers tracking");
  }

  async getIncorrectQuestions(): Promise<Question[]> {
    return [];
  }

  async getIncorrectAnswersCount(): Promise<number> {
    return 0;
  }

  async clearIncorrectAnswers(): Promise<void> {
    // No-op for MemStorage
  }

  async getUniqueQuestionsAnswered(): Promise<number> {
    const sessions = Array.from(this.quizSessions.values());
    const uniqueQuestionIds = new Set<number>();
    
    sessions.forEach(session => {
      if (session.questionResults) {
        session.questionResults.forEach(result => {
          uniqueQuestionIds.add(result.questionId);
        });
      }
    });
    
    return uniqueQuestionIds.size;
  }

  // Marked questions methods - placeholder implementations for MemStorage
  async addMarkedQuestion(questionId: number): Promise<MarkedQuestion> {
    throw new Error("MemStorage doesn't support marked questions tracking");
  }

  async removeMarkedQuestion(questionId: number): Promise<void> {
    // No-op for MemStorage
  }

  async getMarkedQuestions(): Promise<Question[]> {
    return [];
  }

  async getMarkedQuestionsCount(): Promise<number> {
    return 0;
  }

  async isQuestionMarked(questionId: number): Promise<boolean> {
    return false;
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

export class DatabaseStorage implements IStorage {
  async getAllQuestions(): Promise<Question[]> {
    const allQuestions = await db.select().from(questions);
    return allQuestions;
  }

  async getRandomQuestions(count: number): Promise<Question[]> {
    const randomQuestions = await db
      .select()
      .from(questions)
      .orderBy(sql`RANDOM()`)
      .limit(count);
    return randomQuestions;
  }

  async getRandomQuestionsForState(federalCount: number, stateCategory?: string): Promise<Question[]> {
    // Get federal questions (category: "Bundesweit")
    const federalQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.category, 'Bundesweit'))
      .orderBy(sql`RANDOM()`)
      .limit(federalCount);
    
    let stateQuestions: Question[] = [];
    if (stateCategory && federalCount < 33) {
      // Get state-specific questions
      const stateCount = 33 - federalCount; // Remaining questions for state
      stateQuestions = await db
        .select()
        .from(questions)
        .where(eq(questions.category, stateCategory))
        .orderBy(sql`RANDOM()`)
        .limit(stateCount);
    }
    
    return [...federalQuestions, ...stateQuestions];
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db
      .insert(questions)
      .values(insertQuestion)
      .returning();
    return question;
  }

  async createManyQuestions(insertQuestions: InsertQuestion[]): Promise<Question[]> {
    const createdQuestions = await db
      .insert(questions)
      .values(insertQuestions)
      .returning();
    return createdQuestions;
  }

  async createQuizSession(insertSession: InsertQuizSession): Promise<QuizSession> {
    const [session] = await db
      .insert(quizSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getRecentQuizSessions(limit = 10): Promise<QuizSession[]> {
    const sessions = await db
      .select()
      .from(quizSessions)
      .orderBy(desc(quizSessions.createdAt))
      .limit(limit);
    return sessions;
  }

  async getQuizSessionStats(): Promise<{
    totalTests: number;
    averageScore: number;
    bestScore: number;
    totalStudyTime: number;
  }> {
    const stats = await db
      .select({
        totalTests: sql<number>`COUNT(*)`,
        averageScore: sql<number>`COALESCE(AVG(${quizSessions.percentage}), 0)`,
        bestScore: sql<number>`COALESCE(MAX(${quizSessions.percentage}), 0)`,
        totalStudyTime: sql<number>`COALESCE(SUM(${quizSessions.timeSpent}), 0)`
      })
      .from(quizSessions);

    const result = stats[0];
    return {
      totalTests: result.totalTests,
      averageScore: Math.round(result.averageScore),
      bestScore: result.bestScore,
      totalStudyTime: result.totalStudyTime
    };
  }

  async getUserSettings(): Promise<UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .limit(1);
    
    if (!settings) {
      // Create default settings if none exist
      const [newSettings] = await db
        .insert(userSettings)
        .values({
          timerEnabled: false,
          immediateFeedback: true,
          shuffleQuestions: true,
          testMode: 'full'
        })
        .returning();
      return newSettings;
    }
    
    return settings;
  }

  async updateUserSettings(settings: Partial<InsertUserSettings>): Promise<UserSettings> {
    const existingSettings = await this.getUserSettings();
    
    if (!existingSettings) {
      const [newSettings] = await db
        .insert(userSettings)
        .values({
          timerEnabled: settings.timerEnabled ?? false,
          immediateFeedback: settings.immediateFeedback ?? true,
          shuffleQuestions: settings.shuffleQuestions ?? true,
          testMode: settings.testMode ?? 'full'
        })
        .returning();
      return newSettings;
    }

    const [updatedSettings] = await db
      .update(userSettings)
      .set(settings)
      .where(eq(userSettings.id, existingSettings.id))
      .returning();
    
    return updatedSettings;
  }

  async getDetailedStats(selectedState?: string): Promise<{
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    totalTests: number;
    testsPassedCount: number;
    testsPassedPercentage: number;
  }> {
    // Get total number of questions available, filtered by state if specified
    let totalQuestionsQuery = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(questions);
    
    if (selectedState && selectedState !== "Bundesweit") {
      totalQuestionsQuery = totalQuestionsQuery.where(
        or(
          eq(questions.category, 'Bundesweit'),
          eq(questions.category, selectedState)
        )
      );
    } else {
      // Only federal questions if no state selected or "Bundesweit"
      totalQuestionsQuery = totalQuestionsQuery.where(eq(questions.category, 'Bundesweit'));
    }
    
    const totalQuestionsResult = await totalQuestionsQuery;
    const totalQuestions = totalQuestionsResult[0]?.count || 0;

    // Get aggregated stats from all quiz sessions
    const sessionStats = await db
      .select({
        totalTests: sql<number>`COUNT(*)`,
        totalCorrectAnswers: sql<number>`COALESCE(SUM(${quizSessions.correctAnswers}), 0)`,
        totalIncorrectAnswers: sql<number>`COALESCE(SUM(${quizSessions.incorrectAnswers}), 0)`,
        testsPassedCount: sql<number>`COUNT(CASE WHEN ${quizSessions.passed} = true THEN 1 END)`
      })
      .from(quizSessions);

    const stats = sessionStats[0];
    const totalTests = stats?.totalTests || 0;
    const testsPassedCount = stats?.testsPassedCount || 0;
    const testsPassedPercentage = totalTests > 0 
      ? Math.round((testsPassedCount / totalTests) * 100) 
      : 0;

    return {
      totalQuestions,
      correctAnswers: stats?.totalCorrectAnswers || 0,
      incorrectAnswers: stats?.totalIncorrectAnswers || 0,
      totalTests,
      testsPassedCount,
      testsPassedPercentage
    };
  }

  async addIncorrectAnswer(incorrectAnswer: InsertIncorrectAnswer): Promise<IncorrectAnswer> {
    const [inserted] = await db
      .insert(incorrectAnswers)
      .values(incorrectAnswer)
      .returning();
    return inserted;
  }

  async getIncorrectQuestions(): Promise<Question[]> {
    // Get unique question IDs from incorrect answers
    const incorrectQuestionIds = await db
      .selectDistinct({ questionId: incorrectAnswers.questionId })
      .from(incorrectAnswers);
    
    if (incorrectQuestionIds.length === 0) {
      return [];
    }

    const questionIds = incorrectQuestionIds.map(row => row.questionId);
    
    // Get the actual questions
    const result = await db
      .select()
      .from(questions)
      .where(inArray(questions.id, questionIds));
    
    return result;
  }

  async getIncorrectAnswersCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${incorrectAnswers.questionId})` })
      .from(incorrectAnswers);
    
    return result[0]?.count || 0;
  }

  async clearIncorrectAnswers(): Promise<void> {
    await db.delete(incorrectAnswers);
  }

  async getUniqueQuestionsAnswered(): Promise<number> {
    // Get all quiz sessions with their question results
    const sessions = await db
      .select({ questionResults: quizSessions.questionResults })
      .from(quizSessions)
      .where(sql`${quizSessions.questionResults} IS NOT NULL`);

    const uniqueQuestionIds = new Set<number>();
    
    sessions.forEach(session => {
      if (session.questionResults && Array.isArray(session.questionResults)) {
        session.questionResults.forEach((result: any) => {
          if (result && typeof result.questionId === 'number') {
            uniqueQuestionIds.add(result.questionId);
          }
        });
      }
    });
    
    return uniqueQuestionIds.size;
  }

  async addMarkedQuestion(questionId: number): Promise<MarkedQuestion> {
    const inserted = await db
      .insert(markedQuestions)
      .values({ questionId })
      .returning();
    
    return inserted[0];
  }

  async removeMarkedQuestion(questionId: number): Promise<void> {
    await db
      .delete(markedQuestions)
      .where(eq(markedQuestions.questionId, questionId));
  }

  async getMarkedQuestions(): Promise<Question[]> {
    // Get unique question IDs from marked questions
    const markedQuestionIds = await db
      .select({ questionId: markedQuestions.questionId })
      .from(markedQuestions);
    
    if (markedQuestionIds.length === 0) {
      return [];
    }

    const questionIds = markedQuestionIds.map(row => row.questionId);
    
    // Get the actual questions
    const result = await db
      .select()
      .from(questions)
      .where(inArray(questions.id, questionIds));
    
    return result;
  }

  async getMarkedQuestionsCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(markedQuestions);
    
    return result[0]?.count || 0;
  }

  async isQuestionMarked(questionId: number): Promise<boolean> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(markedQuestions)
      .where(eq(markedQuestions.questionId, questionId));
    
    return (result[0]?.count || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
