import express from 'express';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger.js';
import { authenticateToken, requireRole, teamIsolation } from '../middleware/auth.js';
import { aiChatLimiter } from '../middleware/security.js';
import { getPromptForModel, ROWING_EXPERT_PROMPT } from '../prompts/rowing-expert.js';
import {
  isOllamaAvailable,
  parseCSVColumns,
  matchAthleteName,
  suggestLineup,
} from '../services/aiService.js';
import prisma from '../db/connection.js';

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: errors.array() },
    });
  }
  next();
};

// Ollama configuration
const OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'phi4-mini-reasoning:3.8b';

// Get the appropriate prompt based on model size
const getSystemPrompt = (modelName) => {
  return getPromptForModel(modelName || DEFAULT_MODEL);
};

/**
 * Check Ollama status (read-only)
 * Ollama is controlled via systemd/Home Assistant, not RowLab
 */
router.get('/running', async (req, res) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${OLLAMA_ENDPOINT}/api/tags`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    res.json({ running: response.ok });
  } catch (err) {
    res.json({ running: false });
  }
});

/**
 * GET /api/v1/ai/status
 * Check Ollama availability and return provider info
 * Requires authentication and team context
 */
router.get('/status', authenticateToken, teamIsolation, async (req, res) => {
  try {
    const available = await isOllamaAvailable();

    // Get team's preferred model from database
    let preferredModel = DEFAULT_MODEL;
    if (req.team?.aiModel) {
      preferredModel = req.team.aiModel;
    }

    res.json({
      success: true,
      data: {
        provider: 'ollama',
        available,
        model: preferredModel,
      },
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      error: { code: 'AI_UNAVAILABLE', message: 'AI service unavailable' },
      fallback: 'manual',
    });
  }
});

/**
 * POST /api/v1/ai/parse-csv
 * Parse CSV columns using AI
 * Requires OWNER or COACH role
 */
router.post(
  '/parse-csv',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    body('headers').isArray({ min: 1 }).withMessage('headers must be a non-empty array'),
    body('sampleRow').isArray({ min: 1 }).withMessage('sampleRow must be a non-empty array'),
  ],
  validateRequest,
  async (req, res) => {
    const { headers, sampleRow } = req.body;

    try {
      const available = await isOllamaAvailable();
      if (!available) {
        return res.status(503).json({
          success: false,
          error: { code: 'AI_UNAVAILABLE', message: 'AI service unavailable' },
          fallback: 'manual',
        });
      }

      const mapping = await parseCSVColumns(headers, sampleRow);

      if (!mapping) {
        return res.status(503).json({
          success: false,
          error: { code: 'AI_FAILED', message: 'AI failed to parse columns' },
          fallback: 'manual',
        });
      }

      res.json({
        success: true,
        data: { mapping },
      });
    } catch (err) {
      logger.error('Parse CSV error', { error: err.message });
      res.status(503).json({
        success: false,
        error: { code: 'AI_UNAVAILABLE', message: 'AI service unavailable' },
        fallback: 'manual',
      });
    }
  }
);

/**
 * POST /api/v1/ai/match-name
 * Match athlete name using AI fuzzy matching
 * Requires OWNER or COACH role
 */
router.post(
  '/match-name',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    body('inputName')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('inputName string is required'),
    body('athletes').isArray({ min: 1 }).withMessage('athletes must be a non-empty array'),
  ],
  validateRequest,
  async (req, res) => {
    const { inputName, athletes } = req.body;

    try {
      const available = await isOllamaAvailable();
      if (!available) {
        return res.status(503).json({
          success: false,
          error: { code: 'AI_UNAVAILABLE', message: 'AI service unavailable' },
          fallback: 'manual',
        });
      }

      const matchedId = await matchAthleteName(inputName, athletes);

      res.json({
        success: true,
        data: { matchedId },
      });
    } catch (err) {
      logger.error('Match name error', { error: err.message });
      res.status(503).json({
        success: false,
        error: { code: 'AI_UNAVAILABLE', message: 'AI service unavailable' },
        fallback: 'manual',
      });
    }
  }
);

/**
 * POST /api/v1/ai/suggest-lineup
 * Get AI-powered lineup suggestion
 * Requires OWNER or COACH role
 */
router.post(
  '/suggest-lineup',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  [
    body('athletes').isArray({ min: 1 }).withMessage('athletes must be a non-empty array'),
    body('boatClass')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('boatClass string is required'),
    body('constraints').optional().isObject().withMessage('constraints must be an object'),
  ],
  validateRequest,
  async (req, res) => {
    const { athletes, boatClass, constraints } = req.body;

    try {
      const available = await isOllamaAvailable();
      if (!available) {
        return res.status(503).json({
          success: false,
          error: { code: 'AI_UNAVAILABLE', message: 'AI service unavailable' },
          fallback: 'manual',
        });
      }

      const suggestion = await suggestLineup(athletes, boatClass, constraints || {});

      if (!suggestion) {
        return res.status(503).json({
          success: false,
          error: { code: 'AI_FAILED', message: 'AI failed to generate lineup suggestion' },
          fallback: 'manual',
        });
      }

      res.json({
        success: true,
        data: { suggestion },
      });
    } catch (err) {
      logger.error('Suggest lineup error', { error: err.message });
      res.status(503).json({
        success: false,
        error: { code: 'AI_UNAVAILABLE', message: 'AI service unavailable' },
        fallback: 'manual',
      });
    }
  }
);

/**
 * Chat with AI assistant
 * Supports streaming responses
 * Requires authentication and team context
 */
router.post('/chat', authenticateToken, aiChatLimiter, teamIsolation, async (req, res) => {
  const { message, model, stream = true } = req.body;

  // Input validation
  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Message string is required' },
    });
  }

  if (message.length > 2000) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Message exceeds 2000 character limit' },
    });
  }

  // Build context from server-side data (not trusting client input)
  let contextStr = '';
  try {
    // Fetch team's athletes from database
    const athletes = await prisma.athlete.findMany({
      where: { teamId: req.teamId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        side: true,
        ergScore: true,
      },
    });

    if (athletes.length > 0) {
      const portCount = athletes.filter((a) => a.side === 'P' || a.side === 'B').length;
      const starboardCount = athletes.filter((a) => a.side === 'S' || a.side === 'B').length;
      const coxCount = athletes.filter((a) => a.side === 'Cox').length;
      contextStr += `\nRoster: ${athletes.length} athletes (${portCount} port, ${starboardCount} starboard, ${coxCount} coxswains)`;

      // Include top athletes by erg if available
      const withErg = athletes.filter((a) => a.ergScore).sort((a, b) => a.ergScore - b.ergScore);
      if (withErg.length > 0) {
        contextStr += `\nTop 5 by erg: ${withErg
          .slice(0, 5)
          .map((a) => `${a.lastName} (${a.ergScore})`)
          .join(', ')}`;
      }
    }

    // Fetch team's active lineups/boats
    const lineups = await prisma.lineup.findMany({
      where: { teamId: req.teamId },
      include: {
        boatConfig: true,
        athletes: true,
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
    });

    if (lineups.length > 0) {
      contextStr += `\nRecent lineups: ${lineups
        .map((l) => {
          const filled = l.athletes?.length || 0;
          const total = l.boatConfig?.seats || 0;
          return `${l.boatConfig?.name || 'Lineup'} (${filled}/${total} filled)`;
        })
        .join(', ')}`;
    }
  } catch (dbErr) {
    // Log but don't fail - context is optional enhancement
    logger.error('Failed to fetch context data', { error: dbErr.message });
  }

  const fullPrompt = contextStr
    ? `Current app state:${contextStr}\n\nUser question: ${message}`
    : message;

  try {
    const ollamaRes = await fetch(`${OLLAMA_ENDPOINT}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
        prompt: fullPrompt,
        system: getSystemPrompt(model),
        stream: stream,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 500,
        },
      }),
    });

    if (!ollamaRes.ok) {
      const error = await ollamaRes.text();
      logger.error('Ollama error', { error });
      return res.status(502).json({ error: 'AI service error', details: error });
    }

    if (stream) {
      // Stream response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = ollamaRes.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(Boolean);

          for (const line of lines) {
            try {
              const json = JSON.parse(line);
              if (json.response) {
                res.write(`data: ${JSON.stringify({ text: json.response, done: json.done })}\n\n`);
              }
              if (json.done) {
                res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      } finally {
        res.end();
      }
    } else {
      // Non-streaming response
      const data = await ollamaRes.json();
      res.json({ response: data.response, done: true });
    }
  } catch (err) {
    logger.error('AI chat error', { error: err.message });
    res.status(500).json({ error: 'Failed to connect to AI service', details: err.message });
  }
});

/**
 * Pull a model (admin only)
 */
router.post('/pull-model', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { model } = req.body;
  if (!model) {
    return res.status(400).json({ error: 'Model name required' });
  }

  try {
    const ollamaRes = await fetch(`${OLLAMA_ENDPOINT}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model, stream: false }),
    });

    if (ollamaRes.ok) {
      res.json({ success: true, message: `Model ${model} pulled successfully` });
    } else {
      const error = await ollamaRes.text();
      res.status(502).json({ error: 'Failed to pull model', details: error });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to connect to Ollama', details: err.message });
  }
});

/**
 * POST /api/v1/ai/set-model
 * Set the preferred AI model for the team
 * Requires OWNER or COACH role
 */
router.post(
  '/set-model',
  authenticateToken,
  teamIsolation,
  requireRole('OWNER', 'COACH'),
  async (req, res) => {
    const { model } = req.body;

    if (!model || typeof model !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'model string is required' },
      });
    }

    try {
      // Update the team's preferred AI model
      await prisma.team.update({
        where: { id: req.teamId },
        data: { aiModel: model },
      });

      res.json({
        success: true,
        data: { model },
      });
    } catch (err) {
      logger.error('Set model error', { error: err.message });
      res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to update model preference' },
      });
    }
  }
);

export default router;
