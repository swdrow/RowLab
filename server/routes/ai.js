import express from 'express';
import { createRequire } from 'module';
import { authenticateToken, requireRole, teamIsolation } from '../middleware/auth.js';
import { getPromptForModel, ROWING_EXPERT_PROMPT } from '../prompts/rowing-expert.js';

const require = createRequire(import.meta.url);
const {
  isOllamaAvailable,
  parseCSVColumns,
  matchAthleteName,
  suggestLineup,
} = require('../services/aiService.js');

const router = express.Router();

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

    res.json({
      success: true,
      data: {
        provider: 'ollama',
        available,
        model: DEFAULT_MODEL,
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
  async (req, res) => {
    const { headers, sampleRow } = req.body;

    if (!headers || !Array.isArray(headers)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'headers array is required' },
      });
    }

    if (!sampleRow || !Array.isArray(sampleRow)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'sampleRow array is required' },
      });
    }

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
      console.error('Parse CSV error:', err);
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
  async (req, res) => {
    const { inputName, athletes } = req.body;

    if (!inputName || typeof inputName !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'inputName string is required' },
      });
    }

    if (!athletes || !Array.isArray(athletes)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'athletes array is required' },
      });
    }

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
      console.error('Match name error:', err);
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
  async (req, res) => {
    const { athletes, boatClass, constraints } = req.body;

    if (!athletes || !Array.isArray(athletes)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'athletes array is required' },
      });
    }

    if (!boatClass || typeof boatClass !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'boatClass string is required' },
      });
    }

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
      console.error('Suggest lineup error:', err);
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
 */
router.post('/chat', async (req, res) => {
  const { message, context, model, stream = true } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Build context string from app state
  let contextStr = '';
  if (context) {
    if (context.athletes?.length) {
      const portCount = context.athletes.filter(a => a.side === 'P' || a.side === 'B').length;
      const starboardCount = context.athletes.filter(a => a.side === 'S' || a.side === 'B').length;
      const coxCount = context.athletes.filter(a => a.side === 'Cox').length;
      contextStr += `\nRoster: ${context.athletes.length} athletes (${portCount} port, ${starboardCount} starboard, ${coxCount} coxswains)`;

      // Include top athletes by erg if available
      const withErg = context.athletes.filter(a => a.ergScore).sort((a, b) => a.ergScore - b.ergScore);
      if (withErg.length > 0) {
        contextStr += `\nTop 5 by erg: ${withErg.slice(0, 5).map(a => `${a.lastName} (${a.ergScore})`).join(', ')}`;
      }
    }

    if (context.activeBoats?.length) {
      contextStr += `\nActive boats: ${context.activeBoats.map(b => {
        const filled = b.seats?.filter(s => s.athlete).length || 0;
        const total = b.seats?.length || 0;
        return `${b.boatConfig?.name || 'Boat'} (${filled}/${total} filled)`;
      }).join(', ')}`;
    }
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
      console.error('Ollama error:', error);
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
    console.error('AI chat error:', err);
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

export default router;
