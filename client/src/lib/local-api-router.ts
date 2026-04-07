// Local API router for Capacitor native app
// Routes API calls to LocalStorageBackend instead of the Express server

import { LocalStorageBackend } from './local-storage-backend';
import { shuffleArray } from '@shared/constants';

let backend: LocalStorageBackend | null = null;

function getBackend(): LocalStorageBackend {
  if (!backend) {
    backend = new LocalStorageBackend();
  }
  return backend;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function matchRoute(pathname: string, pattern: string): Record<string, string> | null {
  const pathParts = pathname.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);

  if (pathParts.length !== patternParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

const GERMAN_STATES = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg',
  'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen',
  'Rheinland-Pfalz', 'Saarland', 'Sachsen', 'Sachsen-Anhalt',
  'Schleswig-Holstein', 'Thüringen',
];

export async function handleLocalRequest(url: string, init?: RequestInit): Promise<Response> {
  const parsedUrl = new URL(url, 'http://localhost');
  const pathname = parsedUrl.pathname;
  const searchParams = parsedUrl.searchParams;
  const method = init?.method?.toUpperCase() || 'GET';
  const body = init?.body ? JSON.parse(init.body as string) : undefined;
  const storage = getBackend();

  try {
    // ===== GET routes =====
    if (method === 'GET') {
      if (pathname === '/api/questions') {
        return jsonResponse(await storage.getAllQuestions());
      }

      let params;

      if ((params = matchRoute(pathname, '/api/questions/random/:count'))) {
        const count = parseInt(params.count);
        const state = searchParams.get('state') || undefined;
        const mode = searchParams.get('mode') || undefined;
        const category = searchParams.get('category') || undefined;
        const chronological = searchParams.get('chronological') === 'true';

        let questions: { id: number }[];

        if (mode === 'mistakes') {
          questions = await storage.getIncorrectQuestions({ state });
        } else if (mode === 'marked') {
          questions = await storage.getMarkedQuestions({ state });
        } else if (mode === 'unplayed') {
          // Get all questions not yet answered
          const allQ = await storage.getQuestionsByFilter({
            state,
            category: state ? undefined : 'Bundesweit',
          });
          const answered = await storage.getUniqueQuestionIds();
          questions = allQ.filter(q => !answered.has(q.id));
        } else if (mode === 'all') {
          questions = await storage.getQuestionsByFilter({
            state,
            category: state ? undefined : 'Bundesweit',
          });
        } else if (category) {
          if (GERMAN_STATES.includes(category)) {
            questions = await storage.getQuestionsByFilter({ category });
          } else if (category === 'bundesweit') {
            questions = await storage.getQuestionsByFilter({ category: 'Bundesweit' });
          } else {
            questions = await storage.getQuestionsByFilter({ theme: category, category: 'Bundesweit' });
          }
        } else if (state && state !== 'Bundesweit') {
          const federal = await storage.getQuestionsByFilter({ category: 'Bundesweit', limit: 30, random: true });
          const stateQ = await storage.getQuestionsByFilter({ category: state, limit: 3, random: true });
          questions = [...federal, ...stateQ];
        } else {
          questions = await storage.getQuestionsByFilter({ category: 'Bundesweit', limit: count, random: true });
        }

        // Apply sorting
        if (chronological) {
          questions.sort((a, b) => a.id - b.id);
        } else if (mode === 'mistakes' || mode === 'marked' || mode === 'all' || mode === 'unplayed' || category) {
          questions = shuffleArray(questions);
        }

        return jsonResponse(questions);
      }

      if (pathname === '/api/questions/unplayed/count') {
        const state = searchParams.get('state') || undefined;
        const allQ = await storage.getQuestionsByFilter({
          state,
          category: state ? undefined : 'Bundesweit',
        });
        const answered = await storage.getUniqueQuestionIds();
        const count = allQ.filter(q => !answered.has(q.id)).length;
        return jsonResponse({ count });
      }

      if (pathname === '/api/quiz-sessions/recent') {
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
        return jsonResponse(await storage.getRecentQuizSessions(limit));
      }

      if (pathname === '/api/quiz-sessions/stats') {
        return jsonResponse(await storage.getQuizSessionStats());
      }

      if (pathname === '/api/quiz-sessions/detailed-stats') {
        const state = searchParams.get('state') || undefined;
        return jsonResponse(await storage.getDetailedStats(state));
      }

      if (pathname === '/api/quiz-sessions/unique-questions') {
        const count = await storage.getUniqueQuestionsAnswered();
        return jsonResponse({ uniqueQuestionsAnswered: count });
      }

      if (pathname === '/api/settings') {
        return jsonResponse(await storage.getUserSettings());
      }

      if (pathname === '/api/incorrect-questions') {
        const state = searchParams.get('state') || undefined;
        return jsonResponse(await storage.getIncorrectQuestions({ state }));
      }

      if (pathname === '/api/incorrect-answers/count') {
        const count = await storage.getIncorrectAnswersCount();
        return jsonResponse({ count });
      }

      // Must check /count before /:questionId
      if (pathname === '/api/marked-questions/count') {
        const count = await storage.getMarkedQuestionsCount();
        return jsonResponse({ count });
      }

      if (pathname === '/api/marked-questions') {
        const state = searchParams.get('state') || undefined;
        return jsonResponse(await storage.getMarkedQuestions({ state }));
      }

      if ((params = matchRoute(pathname, '/api/marked-questions/:questionId'))) {
        const questionId = parseInt(params.questionId);
        const marked = await storage.isQuestionMarked(questionId);
        return jsonResponse({ marked });
      }
    }

    // ===== POST routes =====
    if (method === 'POST') {
      if (pathname === '/api/quiz-sessions') {
        const session = await storage.createQuizSession(body);
        return jsonResponse(session, 201);
      }

      if (pathname === '/api/incorrect-answers') {
        const result = await storage.addIncorrectAnswer(body);
        return jsonResponse(result, 201);
      }

      if (pathname === '/api/marked-questions') {
        const { questionId } = body;
        const isMarked = await storage.isQuestionMarked(questionId);
        if (isMarked) {
          await storage.removeMarkedQuestion(questionId);
          return jsonResponse({ marked: false });
        } else {
          await storage.addMarkedQuestion(questionId);
          return jsonResponse({ marked: true });
        }
      }

      if (pathname === '/api/reset-statistics') {
        await storage.clearAllQuizSessions();
        await storage.clearIncorrectAnswers();
        await storage.clearAllMarkedQuestions();
        return jsonResponse({ success: true, message: 'Alle Statistiken wurden erfolgreich zurückgesetzt' });
      }

      if (pathname === '/api/clear-state-data') {
        return jsonResponse({ success: true, message: 'State data cleared successfully' });
      }

      if (pathname === '/api/questions/initialize') {
        const questions = await storage.getAllQuestions();
        return jsonResponse({ message: 'Questions loaded', count: questions.length });
      }

      if (pathname === '/api/bug-report') {
        // In native app, bug reports are handled via mailto: link in the UI
        return jsonResponse({ success: true, message: 'Bug-Report gesendet' });
      }
    }

    // ===== PATCH routes =====
    if (method === 'PATCH') {
      if (pathname === '/api/settings') {
        const settings = await storage.updateUserSettings(body);
        return jsonResponse(settings);
      }
    }

    // ===== DELETE routes =====
    if (method === 'DELETE') {
      if (pathname === '/api/incorrect-answers') {
        await storage.clearIncorrectAnswers();
        return jsonResponse({ message: 'Incorrect answers cleared' });
      }

      let params;
      if ((params = matchRoute(pathname, '/api/incorrect-answers/question/:questionId'))) {
        const questionId = parseInt(params.questionId);
        await storage.removeIncorrectAnswersByQuestionId(questionId);
        return jsonResponse({ message: 'Incorrect answers for question removed' });
      }
    }

    return jsonResponse({ error: `Route not found: ${method} ${pathname}` }, 404);
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}
