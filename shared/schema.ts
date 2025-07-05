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
  hasImage: boolean("has_image").default(false),
  imagePath: text("image_path"),
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
  selectedState: text("selected_state"),
  hasSelectedState: boolean("has_selected_state").default(false),
});

export const incorrectAnswers = pgTable("incorrect_answers", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  selectedAnswer: integer("selected_answer").notNull(),
  correctAnswer: integer("correct_answer").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const markedQuestions = pgTable("marked_questions", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
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

export const insertIncorrectAnswerSchema = createInsertSchema(incorrectAnswers).omit({
  id: true,
  createdAt: true,
});

export const insertMarkedQuestionSchema = createInsertSchema(markedQuestions).omit({
  id: true,
  createdAt: true,
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type QuizSession = typeof quizSessions.$inferSelect;
export type InsertQuizSession = z.infer<typeof insertQuizSessionSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type IncorrectAnswer = typeof incorrectAnswers.$inferSelect;
export type InsertIncorrectAnswer = z.infer<typeof insertIncorrectAnswerSchema>;
export type MarkedQuestion = typeof markedQuestions.$inferSelect;
export type InsertMarkedQuestion = z.infer<typeof insertMarkedQuestionSchema>;

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
