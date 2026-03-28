import {
  questions, quizSessions, userSettings, incorrectAnswers, markedQuestions,
  type Question, type InsertQuestion,
  type QuizSession, type InsertQuizSession,
  type UserSettings, type InsertUserSettings,
  type IncorrectAnswer, type InsertIncorrectAnswer,
  type MarkedQuestion, type InsertMarkedQuestion
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, inArray, or, ilike, not } from "drizzle-orm";

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

  // Filtered Questions
  getQuestionsByFilter(options: {
    category?: string;
    search?: string;
    limit?: number;
    random?: boolean;
    excludeIds?: number[];
    theme?: string;
    state?: string;
  }): Promise<Question[]>;

  // Optimized Stats
  getUniqueQuestionsAnswered(): Promise<number>;

  // Incorrect Answers Management
  addIncorrectAnswer(incorrectAnswer: InsertIncorrectAnswer): Promise<IncorrectAnswer>;
  getIncorrectQuestions(filter?: { state?: string }): Promise<Question[]>;
  getIncorrectAnswersCount(): Promise<number>;
  clearIncorrectAnswers(): Promise<void>;
  removeIncorrectAnswersByQuestionId(questionId: number): Promise<void>;

  // Marked Questions Management
  addMarkedQuestion(questionId: number): Promise<MarkedQuestion>;
  removeMarkedQuestion(questionId: number): Promise<void>;
  getMarkedQuestions(filter?: { state?: string }): Promise<Question[]>;
  getMarkedQuestionsCount(): Promise<number>;
  isQuestionMarked(questionId: number): Promise<boolean>;

  // Reset Statistics
  clearAllQuizSessions(): Promise<void>;
  clearAllMarkedQuestions(): Promise<void>;
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
    // Only count full tests (type='full'), not practice sessions
    const fullTestSessions = Array.from(this.quizSessions.values())
      .filter(session => session.type === 'full' && session.totalQuestions === 33);

    if (fullTestSessions.length === 0) {
      return {
        totalTests: 0,
        averageScore: 0,
        bestScore: 0,
        totalStudyTime: 0
      };
    }

    const totalTests = fullTestSessions.length;
    const scores = fullTestSessions.map(s => s.percentage);
    const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    const bestScore = Math.max(...scores);
    const totalStudyTime = fullTestSessions.reduce((sum, session) => sum + (session.timeSpent || 0), 0);

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

    // Calculate stats from all quiz sessions (practice and full tests for answers)
    const allSessions = Array.from(this.quizSessions.values());
    const correctAnswers = allSessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    const incorrectAnswers = allSessions.reduce((sum, s) => sum + s.incorrectAnswers, 0);

    // But only count full tests for test statistics
    const fullTestSessions = allSessions.filter(s => s.type === 'full');
    const totalTests = fullTestSessions.length;
    const testsPassedCount = fullTestSessions.filter(s => s.passed).length;
    const testsPassedPercentage = totalTests > 0
      ? Math.round((testsPassedCount / totalTests) * 100)
      : 0;

    return {
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      totalTests,
      testsPassedCount,
      testsPassedPercentage
    };
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
    let filtered = Array.from(this.questions.values());

    if (options.category) {
      if (options.category === "Bundesweit") {
        filtered = filtered.filter(q => q.category === "Bundesweit");
      } else if (options.category !== "all") {
        filtered = filtered.filter(q => q.category === options.category);
      }
    }

    if (options.state && options.state !== "Bundesweit") {
      // If state is provided, we might want to include federal questions too depending on logic,
      // but here we'll assume strict filtering if category wasn't set, or combined.
      // For simplicity in MemStorage, let's just filter by category if it matches state
      if (!options.category) {
        filtered = filtered.filter(q => q.category === "Bundesweit" || q.category === options.state);
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
          case "geschichte":
            return text.includes("geschichte") || text.includes("nationalsozialismus") || text.includes("ns-zeit") ||
              text.includes("1933") || text.includes("1945") || text.includes("krieg") || text.includes("ddr") ||
              text.includes("demokratisch") || text.includes("demokratie") || text.includes("verfolgung") ||
              text.includes("holocaust") || text.includes("widerstand");
          case "verfassung":
            return text.includes("grundgesetz") || text.includes("verfassung") || text.includes("rechtsstaatlichkeit") ||
              text.includes("gewaltenteilung") || text.includes("parlament") || text.includes("bundestag") ||
              text.includes("bundesrat") || text.includes("verfassungsgericht") || text.includes("grundrechte") ||
              text.includes("menschenrechte");
          case "mensch-gesellschaft":
            return text.includes("religion") || text.includes("glaube") || text.includes("gleichberechtigung") ||
              text.includes("toleranz") || text.includes("familie") || text.includes("ehe") || text.includes("frauen") ||
              text.includes("männer") || text.includes("diskriminierung") || text.includes("integration") || text.includes("kultur");
          case "staat-buerger":
            return text.includes("wahl") || text.includes("wählen") || text.includes("partei") || text.includes("bürger") ||
              text.includes("bürgerpflicht") || text.includes("steuern") || text.includes("sozialversicherung") ||
              text.includes("personalausweis") || text.includes("pass") || text.includes("meldepflicht");
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
      filtered = this.shuffleArray(filtered);
    }

    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  // Placeholder implementations for MemStorage - would use a Map in real implementation
  async addIncorrectAnswer(incorrectAnswer: InsertIncorrectAnswer): Promise<IncorrectAnswer> {
    // In memory implementation would need a Map here
    throw new Error("MemStorage doesn't support incorrect answers tracking");
  }

  async getIncorrectQuestions(filter?: { state?: string }): Promise<Question[]> {
    return [];
  }

  async getIncorrectAnswersCount(): Promise<number> {
    return 0;
  }

  async clearIncorrectAnswers(): Promise<void> {
    // No-op for MemStorage
  }

  async removeIncorrectAnswersByQuestionId(questionId: number): Promise<void> {
    // No-op for MemStorage
  }

  async getUniqueQuestionsAnswered(): Promise<number> {
    const sessions = Array.from(this.quizSessions.values());
    const uniqueQuestionIds = new Set<number>();

    sessions.forEach(session => {
      if (session.questionResults) {
        session.questionResults.forEach((result: { questionId: number }) => {
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

  async getMarkedQuestions(filter?: { state?: string }): Promise<Question[]> {
    return [];
  }

  async getMarkedQuestionsCount(): Promise<number> {
    return 0;
  }

  async isQuestionMarked(questionId: number): Promise<boolean> {
    return false;
  }

  async clearAllQuizSessions(): Promise<void> {
    this.quizSessions.clear();
  }

  async clearAllMarkedQuestions(): Promise<void> {
    // No-op for MemStorage (doesn't support marked questions)
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
    // Only count full tests (type='full'), not practice sessions
    const stats = await db
      .select({
        totalTests: sql<number>`COUNT(*)`,
        averageScore: sql<number>`COALESCE(AVG(${quizSessions.percentage}), 0)`,
        bestScore: sql<number>`COALESCE(MAX(${quizSessions.percentage}), 0)`,
        totalStudyTime: sql<number>`COALESCE(SUM(${quizSessions.timeSpent}), 0)`
      })
      .from(quizSessions)
      .where(and(eq(quizSessions.type, 'full'), eq(quizSessions.totalQuestions, 33)));

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
          selectedState: null,
          hasSelectedState: false
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
          selectedState: settings.selectedState ?? null,
          hasSelectedState: settings.hasSelectedState ?? false
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

    // Get correct/incorrect answers from ALL sessions (practice and full tests)
    const allSessionStats = await db
      .select({
        totalCorrectAnswers: sql<number>`COALESCE(SUM(${quizSessions.correctAnswers}), 0)`,
        totalIncorrectAnswers: sql<number>`COALESCE(SUM(${quizSessions.incorrectAnswers}), 0)`
      })
      .from(quizSessions);

    // Get test stats only from FULL TESTS (type='full')
    const fullTestStats = await db
      .select({
        totalTests: sql<number>`COUNT(*)`,
        testsPassedCount: sql<number>`COUNT(CASE WHEN ${quizSessions.passed} = true THEN 1 END)`
      })
      .from(quizSessions)
      .where(and(eq(quizSessions.type, 'full'), eq(quizSessions.totalQuestions, 33)));

    const allStats = allSessionStats[0];
    const fullStats = fullTestStats[0];

    const totalTests = fullStats?.totalTests || 0;
    const testsPassedCount = fullStats?.testsPassedCount || 0;
    const testsPassedPercentage = totalTests > 0
      ? Math.round((testsPassedCount / totalTests) * 100)
      : 0;

    return {
      totalQuestions,
      correctAnswers: allStats?.totalCorrectAnswers || 0,
      incorrectAnswers: allStats?.totalIncorrectAnswers || 0,
      totalTests,
      testsPassedCount,
      testsPassedPercentage
    };
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
    const conditions = [];

    if (options.category) {
      if (options.category === "Bundesweit") {
        conditions.push(eq(questions.category, "Bundesweit"));
      } else if (options.category !== "all") {
        conditions.push(eq(questions.category, options.category));
      }
    }

    if (options.state && options.state !== "Bundesweit") {
      // If a state is selected, we usually want questions from that state OR federal questions
      // But if category is strictly set (e.g. to a specific state), we respect that.
      // If category is 'all' or undefined, we might want to filter by state context.
      if (!options.category || options.category === 'all') {
        conditions.push(or(
          eq(questions.category, "Bundesweit"),
          eq(questions.category, options.state)
        ));
      }
    }

    if (options.search) {
      conditions.push(ilike(questions.text, `%${options.search}%`));
    }

    if (options.theme) {
      const themeConditions = [];
      switch (options.theme) {
        case "geschichte":
          themeConditions.push(
            ilike(questions.text, "%geschichte%"), ilike(questions.text, "%nationalsozialismus%"),
            ilike(questions.text, "%ns-zeit%"), ilike(questions.text, "%1933%"),
            ilike(questions.text, "%1945%"), ilike(questions.text, "%krieg%"),
            ilike(questions.text, "%ddr%"), ilike(questions.text, "%demokratisch%"),
            ilike(questions.text, "%demokratie%"), ilike(questions.text, "%verfolgung%"),
            ilike(questions.text, "%holocaust%"), ilike(questions.text, "%widerstand%")
          );
          break;
        case "verfassung":
          themeConditions.push(
            ilike(questions.text, "%grundgesetz%"), ilike(questions.text, "%verfassung%"),
            ilike(questions.text, "%rechtsstaatlichkeit%"), ilike(questions.text, "%gewaltenteilung%"),
            ilike(questions.text, "%parlament%"), ilike(questions.text, "%bundestag%"),
            ilike(questions.text, "%bundesrat%"), ilike(questions.text, "%verfassungsgericht%"),
            ilike(questions.text, "%grundrechte%"), ilike(questions.text, "%menschenrechte%")
          );
          break;
        case "mensch-gesellschaft":
          themeConditions.push(
            ilike(questions.text, "%religion%"), ilike(questions.text, "%glaube%"),
            ilike(questions.text, "%gleichberechtigung%"), ilike(questions.text, "%toleranz%"),
            ilike(questions.text, "%familie%"), ilike(questions.text, "%ehe%"),
            ilike(questions.text, "%frauen%"), ilike(questions.text, "%männer%"),
            ilike(questions.text, "%diskriminierung%"), ilike(questions.text, "%integration%"),
            ilike(questions.text, "%kultur%")
          );
          break;
        case "staat-buerger":
          themeConditions.push(
            ilike(questions.text, "%wahl%"), ilike(questions.text, "%wählen%"),
            ilike(questions.text, "%partei%"), ilike(questions.text, "%bürger%"),
            ilike(questions.text, "%bürgerpflicht%"), ilike(questions.text, "%steuern%"),
            ilike(questions.text, "%sozialversicherung%"), ilike(questions.text, "%personalausweis%"),
            ilike(questions.text, "%pass%"), ilike(questions.text, "%meldepflicht%")
          );
          break;
      }
      if (themeConditions.length > 0) {
        conditions.push(or(...themeConditions));
      }
    }

    if (options.excludeIds && options.excludeIds.length > 0) {
      conditions.push(not(inArray(questions.id, options.excludeIds)));
    }

    let query = db.select().from(questions);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    if (options.random) {
      query = query.orderBy(sql`RANDOM()`);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    return await query;
  }

  async addIncorrectAnswer(incorrectAnswer: InsertIncorrectAnswer): Promise<IncorrectAnswer> {
    const [inserted] = await db
      .insert(incorrectAnswers)
      .values(incorrectAnswer)
      .returning();
    return inserted;
  }

  async getIncorrectQuestions(filter?: { state?: string }): Promise<Question[]> {
    // Optimized query using JOIN instead of two separate queries
    let query = db
      .selectDistinct({
        id: questions.id,
        text: questions.text,
        answers: questions.answers,
        correctAnswer: questions.correctAnswer,
        explanation: questions.explanation,
        category: questions.category,
        difficulty: questions.difficulty,
        hasImage: questions.hasImage,
        imagePath: questions.imagePath
      })
      .from(questions)
      .innerJoin(incorrectAnswers, eq(questions.id, incorrectAnswers.questionId));

    const conditions = [];

    if (filter?.state && filter.state !== "Bundesweit") {
      conditions.push(or(
        eq(questions.category, "Bundesweit"),
        eq(questions.category, filter.state)
      ));
    } else {
      // Default behavior if no state specified or Bundesweit: usually we show all or just federal?
      // The original code showed all if no state, or filtered by state.
      // If state is Bundesweit, original code filtered to Bundesweit.
      if (filter?.state === "Bundesweit") {
        conditions.push(eq(questions.category, "Bundesweit"));
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query;
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

  async removeIncorrectAnswersByQuestionId(questionId: number): Promise<void> {
    await db
      .delete(incorrectAnswers)
      .where(eq(incorrectAnswers.questionId, questionId));
  }

  async getUniqueQuestionsAnswered(): Promise<number> {
    // Optimized using SQL to count distinct question IDs from the JSONB array
    // This avoids fetching all session data into memory
    try {
      const result = await db.execute(sql`
        SELECT COUNT(DISTINCT (elem->>'questionId')::int) as count
        FROM ${quizSessions}, jsonb_array_elements(COALESCE(${quizSessions.questionResults}, '[]'::jsonb)) as elem
      `);
      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error("Error counting unique questions:", error);
      // Fallback to old method if SQL fails (e.g. if JSON structure is different)
      return 0;
    }
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

  async getMarkedQuestions(filter?: { state?: string }): Promise<Question[]> {
    // Optimized query using JOIN
    let query = db
      .select({
        id: questions.id,
        text: questions.text,
        answers: questions.answers,
        correctAnswer: questions.correctAnswer,
        explanation: questions.explanation,
        category: questions.category,
        difficulty: questions.difficulty,
        hasImage: questions.hasImage,
        imagePath: questions.imagePath
      })
      .from(questions)
      .innerJoin(markedQuestions, eq(questions.id, markedQuestions.questionId));

    const conditions = [];

    if (filter?.state && filter.state !== "Bundesweit") {
      conditions.push(or(
        eq(questions.category, "Bundesweit"),
        eq(questions.category, filter.state)
      ));
    } else if (filter?.state === "Bundesweit") {
      conditions.push(eq(questions.category, "Bundesweit"));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query;
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

  async clearAllQuizSessions(): Promise<void> {
    await db.delete(quizSessions);
  }

  async clearAllMarkedQuestions(): Promise<void> {
    await db.delete(markedQuestions);
  }
}

export const storage = new DatabaseStorage();
