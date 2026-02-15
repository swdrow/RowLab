import express from 'express';
import { param, validationResult } from 'express-validator';
import prisma from '../db/connection.js';
import logger from '../utils/logger.js';
import { escapeHtml, escapeHtmlAttr } from '../utils/htmlEscape.js';

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

/**
 * GET /api/v1/share-cards/athlete/:athleteId
 * Generates an Open Graph HTML card for sharing an athlete's profile
 * 
 * Security: All user-provided data is escaped with escapeHtml() before HTML interpolation
 * to prevent XSS attacks via malicious athlete names or other fields.
 */
router.get(
  '/athlete/:athleteId',
  [param('athleteId').isString().notEmpty()],
  validateRequest,
  async (req, res) => {
    try {
      const { athleteId } = req.params;

      // Fetch athlete data
      const athlete = await prisma.athlete.findUnique({
        where: { id: athleteId },
        include: {
          team: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!athlete) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Athlete Not Found</title>
              <meta property="og:title" content="Athlete Not Found" />
              <meta property="og:description" content="The requested athlete profile could not be found." />
            </head>
            <body>
              <h1>Athlete Not Found</h1>
            </body>
          </html>
        `);
      }

      // Escape all user-provided fields to prevent XSS
      const athleteName = escapeHtml(`${athlete.firstName} ${athlete.lastName}`);
      const teamName = escapeHtml(athlete.team?.name || 'RowLab Team');
      const side = escapeHtml(athlete.side || 'Unknown');
      const weight = athlete.weight ? escapeHtml(`${athlete.weight}kg`) : '';
      
      // Build description with escaped data
      const description = `${athleteName} - ${side} side rower${weight ? `, ${weight}` : ''} from ${teamName}`;

      // Generate OG HTML with all data properly escaped
      const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${athleteName} - RowLab</title>
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:type" content="profile" />
    <meta property="og:title" content="${athleteName}" />
    <meta property="og:description" content="${escapeHtmlAttr(description)}" />
    <meta property="og:site_name" content="RowLab" />
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${athleteName}" />
    <meta name="twitter:description" content="${escapeHtmlAttr(description)}" />
    
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 800px;
        margin: 50px auto;
        padding: 20px;
        background: #0a0a0a;
        color: #e5e5e5;
      }
      .card {
        background: linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 30px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      }
      h1 {
        margin: 0 0 10px 0;
        color: #ffffff;
        font-size: 2rem;
      }
      .team {
        color: #a0a0a0;
        font-size: 1.1rem;
        margin-bottom: 20px;
      }
      .stats {
        display: flex;
        gap: 20px;
        margin-top: 20px;
      }
      .stat {
        background: rgba(255, 255, 255, 0.05);
        padding: 15px;
        border-radius: 8px;
        flex: 1;
      }
      .stat-label {
        color: #a0a0a0;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .stat-value {
        color: #ffffff;
        font-size: 1.5rem;
        font-weight: 600;
        margin-top: 5px;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${athleteName}</h1>
      <div class="team">${teamName}</div>
      <div class="stats">
        <div class="stat">
          <div class="stat-label">Side</div>
          <div class="stat-value">${side}</div>
        </div>
        ${weight ? `
        <div class="stat">
          <div class="stat-label">Weight</div>
          <div class="stat-value">${weight}</div>
        </div>
        ` : ''}
      </div>
    </div>
  </body>
</html>
      `;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);

    } catch (error) {
      logger.error('Share card generation error', {
        error: error.message,
        stack: error.stack,
        athleteId: req.params.athleteId,
      });
      
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Error</title>
          </head>
          <body>
            <h1>Error generating share card</h1>
            <p>An error occurred while generating the athlete share card.</p>
          </body>
        </html>
      `);
    }
  }
);

export default router;
