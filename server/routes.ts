import type { Express } from "express";
import { createServer, type Server } from "http";
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
      
      if (mode === "all") {
        // Practice mode with all questions (300 federal + 10 state-specific)
        const allQuestions = await storage.getAllQuestions();
        const shuffled = allQuestions.sort(() => Math.random() - 0.5);
        res.json(shuffled);
      } else if (category) {
        // Category-specific practice with thematic filtering
        const allQuestions = await storage.getAllQuestions();
        let categoryQuestions = [];
        
        if (category === "bundesweit") {
          categoryQuestions = allQuestions.filter(q => q.category === "Bundesweit");
        } else if (["Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hessen", "Mecklenburg-Vorpommern", "Niedersachsen", "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland", "Sachsen", "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen"].includes(category)) {
          // State-specific questions
          categoryQuestions = allQuestions.filter(q => q.category === category);
        } else {
          // Thematic categorization based on keywords
          const federalQuestions = allQuestions.filter(q => q.category === "Bundesweit");
          
          categoryQuestions = federalQuestions.filter(q => {
            const text = q.text.toLowerCase();
            switch (category) {
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
        
        // Check if chronological order is requested
        const chronological = req.query.chronological === 'true';
        
        if (chronological) {
          // Sort by ID for chronological order
          categoryQuestions.sort((a, b) => a.id - b.id);
        } else {
          // Shuffle for random order
          categoryQuestions.sort(() => Math.random() - 0.5);
        }
        
        res.json(categoryQuestions);
      } else if (state && state !== "Bundesweit") {
        // Get state-specific quiz (30 federal + 3 state)
        const questions = await storage.getRandomQuestionsForState(30, state);
        res.json(questions);
      } else {
        // Get all federal questions
        const questions = await storage.getRandomQuestions(count);
        res.json(questions);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch random questions" });
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
      res.status(500).json({ error: "Failed to update settings" });
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
      const stats = await storage.getDetailedStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch detailed statistics" });
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
      const questions = await storage.getIncorrectQuestions();
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

  const httpServer = createServer(app);
  return httpServer;
}
