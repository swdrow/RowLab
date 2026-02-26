import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { generateShareCard, getShareCard, deleteShareCard } from '../services/shareCardService.js';
import { AppError } from '../utils/errors.js';

const router = express.Router();

/** Escape HTML special characters to prevent XSS in OG meta tags */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * POST /api/v1/share-cards/generate
 * Generate a new share card
 */
router.post('/generate', authenticateToken, async (req, res, next) => {
  try {
    const { workoutId, cardType, format, options, teamId } = req.body;

    // Validation
    if (!cardType) {
      throw new AppError(400, 'VALIDATION_FAILED', 'cardType is required');
    }

    if (!format) {
      throw new AppError(400, 'VALIDATION_FAILED', 'format is required');
    }

    const validCardTypes = [
      'erg_summary',
      'erg_summary_alt',
      'erg_charts',
      'pr_celebration',
      'regatta_result',
      'regatta_summary',
      'season_recap',
      'team_leaderboard',
    ];

    if (!validCardTypes.includes(cardType)) {
      throw new AppError(
        400,
        'VALIDATION_FAILED',
        `Invalid cardType. Must be one of: ${validCardTypes.join(', ')}`
      );
    }

    const validFormats = ['1:1', '9:16'];
    if (!validFormats.includes(format)) {
      throw new AppError(
        400,
        'VALIDATION_FAILED',
        `Invalid format. Must be one of: ${validFormats.join(', ')}`
      );
    }

    // For most card types, workoutId is required
    const workoutRequiredTypes = ['erg_summary', 'erg_charts', 'pr_celebration', 'regatta_result'];
    if (workoutRequiredTypes.includes(cardType) && !workoutId) {
      throw new AppError(
        400,
        'VALIDATION_FAILED',
        `workoutId is required for ${cardType} card type`
      );
    }

    // Generate the card
    const result = await generateShareCard({
      workoutId: workoutId || null,
      cardType,
      format,
      options: options || {},
      userId: req.user.id,
      teamId: teamId || null,
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    // Handle specific errors by converting to AppError
    if (error instanceof AppError) {
      return next(error);
    }

    if (error.message === 'Workout not found') {
      return next(new AppError(404, 'NOT_FOUND', error.message));
    }

    if (error.message?.includes('Python service')) {
      return next(
        new AppError(
          503,
          'SERVICE_UNAVAILABLE',
          'Share card rendering service unavailable. Please try again later.'
        )
      );
    }

    next(new AppError(500, 'SERVER_ERROR', error.message || 'Failed to generate share card'));
  }
});

/**
 * GET /api/v1/share-cards/:shareId
 * Get share card metadata (public endpoint - no auth)
 */
router.get('/:shareId', async (req, res, next) => {
  try {
    const { shareId } = req.params;

    const shareCard = await getShareCard(shareId);

    res.json({ success: true, data: shareCard });
  } catch (error) {
    if (error.message === 'Share card not found') {
      return next(new AppError(404, 'NOT_FOUND', error.message));
    }

    if (error.message === 'Share card has expired') {
      return next(new AppError(410, 'NOT_FOUND', error.message));
    }

    next(new AppError(500, 'SERVER_ERROR', 'Failed to retrieve share card'));
  }
});

/**
 * GET /api/v1/share-cards/og/:shareId
 * Get OpenGraph HTML for social crawlers
 *
 * Social crawlers (Facebook, Twitter, Slack, Discord, etc.) don't execute JavaScript,
 * so we need to serve pre-rendered HTML with OG meta tags for link previews.
 * NOTE: This is a non-JSON endpoint -- returns HTML, not envelope.
 */
router.get('/og/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;

    // Fetch card metadata
    const shareCard = await getShareCard(shareId);
    const card = shareCard; // getShareCard returns the raw Prisma record

    // Construct URLs
    const baseUrl = process.env.BASE_URL || 'https://oarbit.net';
    const ogImageUrl = card.url.startsWith('http') ? card.url : `${baseUrl}${card.url}`;
    const ogUrl = `${baseUrl}/share/${card.id}`;
    const ogTitle = escapeHtml(
      card.metadata?.athleteName
        ? `${card.metadata.athleteName} - ${card.metadata.workoutTitle || 'Workout'} | oarbit`
        : 'Workout Share Card | oarbit'
    );
    const ogDescription = escapeHtml(
      card.metadata?.description || `Check out this ${card.cardType.replace(/_/g, ' ')} from oarbit`
    );
    const ogImageHeight = card.format === '1:1' ? '2160' : '3840';

    // Serve OG-tagged HTML with redirect to React SPA
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ogTitle}</title>
  <meta name="description" content="${ogDescription}">

  <!-- OpenGraph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${ogTitle}" />
  <meta property="og:description" content="${ogDescription}" />
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="og:image:width" content="2160" />
  <meta property="og:image:height" content="${ogImageHeight}" />
  <meta property="og:url" content="${ogUrl}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${ogTitle}" />
  <meta name="twitter:description" content="${ogDescription}" />
  <meta name="twitter:image" content="${ogImageUrl}" />

  <!-- Redirect to React SPA for real browsers -->
  <meta http-equiv="refresh" content="0;url=/share/${card.id}" />
</head>
<body>
  <p>Redirecting to share page...</p>
  <a href="/share/${card.id}">Click here if not redirected</a>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    // OG endpoint returns HTML errors (not JSON) for crawlers
    if (error.message === 'Share card not found') {
      return res.status(404).send('<h1>Share card not found</h1>');
    }

    if (error.message === 'Share card has expired') {
      return res.status(410).send('<h1>Share card has expired</h1>');
    }

    res.status(500).send('<h1>Error loading share card</h1>');
  }
});

/**
 * DELETE /api/v1/share-cards/:shareId
 * Delete a share card (requires ownership)
 */
router.delete('/:shareId', authenticateToken, async (req, res, next) => {
  try {
    const { shareId } = req.params;

    const result = await deleteShareCard(shareId, req.user.id);

    res.json({ success: true, data: result });
  } catch (error) {
    if (error.message === 'Share card not found') {
      return next(new AppError(404, 'NOT_FOUND', error.message));
    }

    if (error.message?.includes('Unauthorized')) {
      return next(new AppError(403, 'FORBIDDEN', error.message));
    }

    next(new AppError(500, 'SERVER_ERROR', 'Failed to delete share card'));
  }
});

export default router;
