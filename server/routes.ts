import type { Express } from "express";
import { createServer, type Server } from "http";
import nodemailer from "nodemailer";
import { storage } from "./storage";
import { insertQuestionSchema, insertQuizSessionSchema, insertUserSettingsSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all questions
  app.get("/api/questions", async (req, res) => {
    try {
      const questions = await storage.getAllQuestions();
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  // Get random questions for quiz
  app.get("/api/questions/random/:count", async (req, res) => {
    try {
      const count = parseInt(req.params.count);
      if (isNaN(count) || count <= 0) {
        return res.status(400).json({ error: "Invalid count parameter" });
      }

      const state = req.query.state as string;
      const mode = req.query.mode as string;
      const category = req.query.category as string;
      const chronological = req.query.chronological === 'true';

      let questions = [];

      if (mode === "mistakes") {
        // Practice mode with incorrect questions only
        questions = await storage.getIncorrectQuestions({ state });
      } else if (mode === "marked") {
        // Practice mode with marked questions only
        questions = await storage.getMarkedQuestions({ state });
      } else if (mode === "all") {
        // Practice mode with all questions (filtered by state if provided)
        questions = await storage.getQuestionsByFilter({
          state: state,
          // If state is provided, getQuestionsByFilter handles the logic (Federal + State)
          // If no state, it returns all federal questions if we set category='Bundesweit' or similar
          // But 'all' mode usually implies all available questions for the user context.
          category: state ? undefined : 'Bundesweit'
        });
      } else if (category) {
        // Category-specific practice with thematic filtering
        if (["Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hessen", "Mecklenburg-Vorpommern", "Niedersachsen", "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland", "Sachsen", "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen"].includes(category)) {
          // State-specific questions
          questions = await storage.getQuestionsByFilter({ category });
        } else if (category === "bundesweit") {
          questions = await storage.getQuestionsByFilter({ category: "Bundesweit" });
        } else {
          // Thematic categorization
          questions = await storage.getQuestionsByFilter({ theme: category, category: "Bundesweit" });
        }
      } else if (state && state !== "Bundesweit") {
        // Get state-specific quiz (30 federal + 3 state)
        // We need to fetch them separately to ensure the ratio 30:3
        const federalQuestions = await storage.getQuestionsByFilter({
          category: "Bundesweit",
          limit: 30,
          random: true
        });
        const stateQuestions = await storage.getQuestionsByFilter({
          category: state,
          limit: 3,
          random: true
        });
        questions = [...federalQuestions, ...stateQuestions];
      } else {
        // Get all federal questions (random)
        questions = await storage.getQuestionsByFilter({
          category: "Bundesweit",
          limit: count,
          random: true
        });
      }

      // Apply sorting
      if (chronological) {
        questions.sort((a, b) => a.id - b.id);
      } else if (!state || state === "Bundesweit") {
        // If we haven't already randomized (e.g. for specific state quiz we did)
        // But for 'mistakes', 'marked', 'all', 'category' we fetched without random limit usually
        // except for the last else block.
        // Let's just shuffle to be safe if not chronological, unless it was already a random fetch
        if (mode === "mistakes" || mode === "marked" || mode === "all" || category) {
          questions.sort(() => Math.random() - 0.5);
        }
      }

      // Limit the result if it's not a specific state quiz (which is fixed 33)
      // and if we fetched more than needed (e.g. mode=all fetches all)
      // But wait, mode=all usually means "practice all questions", not "get N random questions from all".
      // The route is /random/:count.
      // If mode is 'all', 'mistakes', 'marked', usually the user wants to practice ALL of them, 
      // but the frontend might be requesting a batch.
      // However, the original code for 'mistakes' returned ALL incorrect questions.
      // The original code for 'all' returned ALL questions.
      // The :count parameter seems to be ignored for these modes in the original code!
      // I will preserve that behavior.

      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  // Create quiz session (save results)
  app.post("/api/quiz-sessions", async (req, res) => {
    try {
      const validatedData = insertQuizSessionSchema.parse(req.body);
      const session = await storage.createQuizSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid session data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create quiz session" });
    }
  });

  // Get recent quiz sessions
  app.get("/api/quiz-sessions/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const sessions = await storage.getRecentQuizSessions(limit);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent sessions" });
    }
  });

  // Get quiz statistics
  app.get("/api/quiz-sessions/stats", async (req, res) => {
    try {
      const stats = await storage.getQuizSessionStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quiz statistics" });
    }
  });

  // Get user settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getUserSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update user settings
  app.patch("/api/settings", async (req, res) => {
    try {
      const validatedData = insertUserSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateUserSettings(validatedData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid settings data", details: error.errors });
      }
      console.error("Settings update error:", error);
      res.status(500).json({ error: "Failed to update settings", details: error.message });
    }
  });

  // Clear state-specific data when state changes
  app.post("/api/clear-state-data", async (req, res) => {
    try {
      const { newState } = req.body;
      // For now, we'll just return success since we handle state filtering at query time
      res.json({ success: true, message: "State data cleared successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear state data" });
    }
  });

  // Load questions from Excel data
  app.post("/api/questions/load-from-excel", async (req, res) => {
    try {
      const existingQuestions = await storage.getAllQuestions();
      if (existingQuestions.length > 0) {
        return res.json({ message: "Questions already exist", count: existingQuestions.length });
      }

      // Load questions from the processed Excel data
      const fs = await import('fs');
      const questionsData = JSON.parse(fs.readFileSync('questions-data.json', 'utf8'));

      const processedQuestions = questionsData.map((q: any) => ({
        text: q.text,
        answers: q.answers,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        category: q.category,
        difficulty: q.difficulty,
        hasImage: q.hasImage,
        imagePath: q.imagePath
      }));

      const questions = await storage.createManyQuestions(processedQuestions);
      res.status(201).json({ message: "Excel questions loaded", count: questions.length });
    } catch (error) {
      console.error('Error loading Excel questions:', error);
      res.status(500).json({ error: "Failed to load Excel questions" });
    }
  });

  // Initialize with sample questions if none exist (fallback)
  app.post("/api/questions/initialize", async (req, res) => {
    try {
      const existingQuestions = await storage.getAllQuestions();
      if (existingQuestions.length > 0) {
        return res.json({ message: "Questions already exist", count: existingQuestions.length });
      }

      // Try to load from Excel first
      try {
        const fs = await import('fs');
        const questionsData = JSON.parse(fs.readFileSync('questions-data.json', 'utf8'));

        const processedQuestions = questionsData.map((q: any) => ({
          text: q.text,
          answers: q.answers,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
          category: q.category,
          difficulty: q.difficulty,
          hasImage: q.hasImage,
          imagePath: q.imagePath
        }));

        const questions = await storage.createManyQuestions(processedQuestions);
        return res.status(201).json({ message: "Excel questions loaded", count: questions.length });
      } catch (excelError) {
        console.log('Excel data not available, using sample questions');
      }

      // Fallback to sample questions
      const sampleQuestions = [
        {
          text: "Wie viele Bundesländer hat die Bundesrepublik Deutschland?",
          answers: ["14", "15", "16", "17"],
          correctAnswer: 2,
          explanation: "Deutschland hat 16 Bundesländer: Baden-Württemberg, Bayern, Berlin, Brandenburg, Bremen, Hamburg, Hessen, Mecklenburg-Vorpommern, Niedersachsen, Nordrhein-Westfalen, Rheinland-Pfalz, Saarland, Sachsen, Sachsen-Anhalt, Schleswig-Holstein und Thüringen.",
          category: "Geschichte und Verfassung",
          difficulty: "mittel",
          hasImage: false,
          imagePath: null
        },
        {
          text: "In welchem Jahr wurde das Grundgesetz der Bundesrepublik Deutschland verkündet?",
          answers: ["1948", "1949", "1950", "1951"],
          correctAnswer: 1,
          explanation: "Das Grundgesetz wurde am 23. Mai 1949 verkündet und trat am 24. Mai 1949 in Kraft.",
          category: "Geschichte und Verfassung",
          difficulty: "mittel",
          hasImage: false,
          imagePath: null
        },
        {
          text: "Welche Farben hat die deutsche Flagge?",
          answers: ["Schwarz-Rot-Gold", "Schwarz-Weiß-Rot", "Rot-Weiß-Blau", "Blau-Weiß-Rot"],
          correctAnswer: 0,
          explanation: "Die deutsche Flagge zeigt die Farben Schwarz-Rot-Gold in horizontalen Streifen.",
          category: "Symbole",
          difficulty: "leicht",
          hasImage: false,
          imagePath: null
        }
      ];

      const questions = await storage.createManyQuestions(sampleQuestions);
      res.status(201).json({ message: "Sample questions initialized", count: questions.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to initialize questions" });
    }
  });

  // Get detailed statistics
  app.get("/api/quiz-sessions/detailed-stats", async (req, res) => {
    try {
      const selectedState = req.query.state as string;
      const stats = await storage.getDetailedStats(selectedState);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch detailed statistics" });
    }
  });

  // Get unique questions answered count
  app.get("/api/quiz-sessions/unique-questions", async (req, res) => {
    try {
      const count = await storage.getUniqueQuestionsAnswered();
      res.json({ uniqueQuestionsAnswered: count });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unique questions count" });
    }
  });

  // Add incorrect answer
  app.post("/api/incorrect-answers", async (req, res) => {
    try {
      const { insertIncorrectAnswerSchema } = await import("@shared/schema");
      const validatedData = insertIncorrectAnswerSchema.parse(req.body);
      const incorrectAnswer = await storage.addIncorrectAnswer(validatedData);
      res.status(201).json(incorrectAnswer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to add incorrect answer" });
    }
  });

  // Get incorrect questions for practice
  app.get("/api/incorrect-questions", async (req, res) => {
    try {
      const selectedState = req.query.state as string;
      const questions = await storage.getIncorrectQuestions({ state: selectedState });
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch incorrect questions" });
    }
  });

  // Get count of incorrect answers
  app.get("/api/incorrect-answers/count", async (req, res) => {
    try {
      const count = await storage.getIncorrectAnswersCount();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch incorrect answers count" });
    }
  });

  // Clear all incorrect answers
  app.delete("/api/incorrect-answers", async (req, res) => {
    try {
      await storage.clearIncorrectAnswers();
      res.json({ message: "Incorrect answers cleared" });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear incorrect answers" });
    }
  });

  // Remove incorrect answer for specific question (when answered correctly)
  app.delete("/api/incorrect-answers/question/:questionId", async (req, res) => {
    try {
      const questionId = parseInt(req.params.questionId);
      if (isNaN(questionId)) {
        return res.status(400).json({ error: "Invalid question ID" });
      }

      // This will be implemented in storage to remove all incorrect answers for this question
      await storage.removeIncorrectAnswersByQuestionId(questionId);
      res.json({ message: "Incorrect answers for question removed" });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove incorrect answers for question" });
    }
  });

  // Mark/unmark question
  app.post("/api/marked-questions", async (req, res) => {
    try {
      const { questionId } = req.body;
      if (!questionId || typeof questionId !== 'number') {
        return res.status(400).json({ error: "Valid questionId is required" });
      }

      const isMarked = await storage.isQuestionMarked(questionId);

      if (isMarked) {
        await storage.removeMarkedQuestion(questionId);
        res.json({ marked: false });
      } else {
        await storage.addMarkedQuestion(questionId);
        res.json({ marked: true });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle question mark" });
    }
  });

  // Get marked questions for practice
  app.get("/api/marked-questions", async (req, res) => {
    try {
      const selectedState = req.query.state as string;
      const questions = await storage.getMarkedQuestions({ state: selectedState });
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch marked questions" });
    }
  });

  // Get marked questions count
  app.get("/api/marked-questions/count", async (req, res) => {
    try {
      const count = await storage.getMarkedQuestionsCount();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch marked questions count" });
    }
  });

  // Check if question is marked
  app.get("/api/marked-questions/:questionId", async (req, res) => {
    try {
      const questionId = parseInt(req.params.questionId);
      if (isNaN(questionId)) {
        return res.status(400).json({ error: "Invalid questionId" });
      }

      const isMarked = await storage.isQuestionMarked(questionId);
      res.json({ marked: isMarked });
    } catch (error) {
      res.status(500).json({ error: "Failed to check if question is marked" });
    }
  });

  // Reset all statistics
  app.post("/api/reset-statistics", async (req, res) => {
    try {
      // Clear all quiz sessions
      await storage.clearAllQuizSessions();

      // Clear all incorrect answers
      await storage.clearIncorrectAnswers();

      // Clear all marked questions
      await storage.clearAllMarkedQuestions();

      res.json({
        success: true,
        message: "Alle Statistiken wurden erfolgreich zurückgesetzt"
      });
    } catch (error) {
      console.error('Failed to reset statistics:', error);
      res.status(500).json({
        error: "Fehler beim Zurücksetzen der Statistiken"
      });
    }
  });

  // Bug report endpoint
  app.post("/api/bug-report", async (req, res) => {
    try {
      const bugReportSchema = z.object({
        description: z.string().min(1, "Bug description is required"),
        timestamp: z.string(),
        userAgent: z.string().optional(),
        url: z.string().optional(),
      });

      const { description, timestamp, userAgent, url } = bugReportSchema.parse(req.body);

      // HTML-escape user input to prevent XSS in email clients
      const escapeHtml = (str: string) =>
        str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

      // Create transporter for sending emails
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER || 'noreply@example.com',
          pass: process.env.GMAIL_PASS || 'password'
        }
      });

      // Email content
      const mailOptions = {
        from: process.env.GMAIL_USER || 'noreply@example.com',
        to: 'dacvudinh@gmail.com',
        subject: '🐛 Bug-Report von Einbürgerungstest App',
        html: `
          <h2>Neuer Bug-Report</h2>
          <p><strong>Zeitpunkt:</strong> ${new Date(timestamp).toLocaleString('de-DE')}</p>
          <p><strong>URL:</strong> ${escapeHtml(url || 'Nicht verfügbar')}</p>
          <p><strong>User Agent:</strong> ${escapeHtml(userAgent || 'Nicht verfügbar')}</p>

          <h3>Bug-Beschreibung:</h3>
          <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
            ${escapeHtml(description).replace(/\n/g, '<br>')}
          </div>
          
          <hr>
          <small>Automatisch gesendet von der Einbürgerungstest App</small>
        `
      };

      // Send email
      await transporter.sendMail(mailOptions);

      res.json({
        success: true,
        message: "Bug-Report erfolgreich gesendet"
      });
    } catch (error) {
      console.error('Failed to send bug report:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Ungültige Bug-Report-Daten",
          details: error.errors
        });
      }
      res.status(500).json({
        error: "Fehler beim Senden des Bug-Reports"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
