import { Router } from 'express';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// Pre-load fonts at startup
let displayFont, bodyFont;
async function loadFonts() {
  displayFont = await readFile(resolve(__dirname, '../assets/fonts/Syne-Bold.ttf'));
  bodyFont = await readFile(resolve(__dirname, '../assets/fonts/Inter-Regular.ttf'));
}
loadFonts().catch((err) => console.warn('OG fonts not loaded:', err.message));

/**
 * Template: atmospheric dark space theme with oarbit branding
 * Uses void-deep background gradient, warm text (#e8e0d4), and accent-teal highlights
 */
function defaultTemplate(title, subtitle) {
  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 80px',
        background: 'linear-gradient(135deg, #0e0e1c 0%, #151528 50%, #0e0e1c 100%)',
        color: '#e8e0d4',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              fontSize: '64px',
              fontFamily: 'Display',
              fontWeight: 700,
              marginBottom: '16px',
              lineHeight: 1.1,
            },
            children: title || 'oarbit',
          },
        },
        subtitle
          ? {
              type: 'div',
              props: {
                style: {
                  fontSize: '28px',
                  fontFamily: 'Inter',
                  color: '#a09888',
                  marginTop: '8px',
                },
                children: subtitle,
              },
            }
          : null,
        {
          type: 'div',
          props: {
            style: {
              fontSize: '20px',
              fontFamily: 'Inter',
              color: '#3bb8c4',
              marginTop: 'auto',
            },
            children: 'oarbit \u2022 your training orbit',
          },
        },
      ].filter(Boolean),
    },
  };
}

const templates = {
  default: () => defaultTemplate('oarbit', 'Your personal training orbit'),
  dashboard: () => defaultTemplate('Dashboard', 'Personal training overview'),
  workouts: () => defaultTemplate('Workouts', 'Training log & performance'),
  profile: () => defaultTemplate('Athlete Profile', 'Performance stats & achievements'),
  team: () => defaultTemplate('Team', 'Roster, lineups & coaching tools'),
};

router.get('/:route?', async (req, res) => {
  try {
    if (!displayFont || !bodyFont) {
      // Serve static fallback if fonts not loaded
      return res.redirect('/og-image.png');
    }

    const route = req.params.route || 'default';
    const templateFn = templates[route] || templates.default;
    const template = templateFn();

    const svg = await satori(template, {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Display', data: displayFont, weight: 700, style: 'normal' },
        { name: 'Inter', data: bodyFont, weight: 400, style: 'normal' },
      ],
    });

    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    const png = resvg.render().asPng();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.send(Buffer.from(png));
  } catch (err) {
    console.error('OG image generation error:', err);
    res.redirect('/og-image.png'); // Fallback to static
  }
});

export default router;
