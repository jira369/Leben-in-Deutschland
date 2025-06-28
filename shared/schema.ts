import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  answers: jsonb("answers").notNull().$type<string[]>(),
  correctAnswer: integer("correct_answer").notNull(),
  explanation: text("explanation"),
  category: text("category"),
  difficulty: text("difficulty"),
});

export const quizSessions = pgTable("quiz_sessions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'full' | 'practice'
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  incorrectAnswers: integer("incorrect_answers").notNull(),
  percentage: integer("percentage").notNull(),
  passed: boolean("passed").notNull(),
  timeSpent: integer("time_spent"), // in seconds
  questionResults: jsonb("question_results").$type<{
    questionId: number;
    selectedAnswer: number;
    isCorrect: boolean;
  }[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  timerEnabled: boolean("timer_enabled").default(false),
  immediateFeedback: boolean("immediate_feedback").default(true),
  shuffleQuestions: boolean("shuffle_questions").default(true),
  testMode: text("test_mode").default('full'), // 'full' | 'practice'
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertQuizSessionSchema = createInsertSchema(quizSessions).omit({
  id: true,
  createdAt: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type QuizSession = typeof quizSessions.$inferSelect;
export type InsertQuizSession = z.infer<typeof insertQuizSessionSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

// Quiz state types
export type QuizState = {
  questions: Question[];
  currentQuestionIndex: number;
  selectedAnswers: Record<number, number>;
  timeRemaining?: number;
  startTime: number;
};

export type QuizResults = {
  correct: number;
  incorrect: number;
  total: number;
  percentage: number;
  passed: boolean;
  timeSpent: number;
  questionResults: {
    questionId: number;
    selectedAnswer: number;
    isCorrect: boolean;
    question: Question;
  }[];
};
