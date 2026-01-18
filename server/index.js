import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import cookieParser from 'cookie-parser';

// Routes
import authRoutes from './routes/auth.js';
import teamRoutes from './routes/teams.js';
import athleteRoutes from './routes/athletes.js';
import inviteRoutes from './routes/invites.js';
import lineupRoutes from './routes/lineups.js';
import lineupRoutesV1 from './routes/v1/lineups.js';
import ergDataRoutes from './routes/ergData.js';
import ergTestRoutes from './routes/ergTests.js';
import aiRoutes from './routes/ai.js';
import importRoutes from './routes/import.js';
import workoutRoutes from './routes/workouts.js';
import concept2Routes from './routes/concept2.js';
import boatConfigRoutes from './routes/boatConfigs.js';
import shellRoutes from './routes/v1/shells.js';
import seatRaceRoutes from './routes/seatRaces.js';
import rankingsRoutes from './routes/rankings.js';
import { getStorageInfo } from './utils/storageMonitor.js';
import { verifyToken, authenticateToken } from './middleware/auth.js';

// Security & Logging
import {
  securityHeaders,
  corsOptions,
  globalLimiter,
  authLimiter,
  aiLimiter,
  apiLimiter,
} from './middleware/security.js';
import logger, { requestLogger, errorLogger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy for rate limiting behind reverse proxy (nginx, cloudflare, etc.)
// Setting to 1 trusts the first proxy
app.set('trust proxy', 1);

// Security middleware
app.use(securityHeaders);
app.use(corsOptions);
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing (for refresh tokens)
app.use(cookieParser());

// Request logging
app.use(requestLogger);

// API v1 Routes (new multi-tenant)
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/teams', apiLimiter, teamRoutes);
app.use('/api/v1/athletes', apiLimiter, athleteRoutes);
app.use('/api/v1/invites', apiLimiter, inviteRoutes);
app.use('/api/v1/erg-tests', apiLimiter, ergTestRoutes);
app.use('/api/v1/import', apiLimiter, importRoutes);
app.use('/api/v1/workouts', apiLimiter, workoutRoutes);
app.use('/api/v1/concept2', apiLimiter, concept2Routes);
app.use('/api/v1/boat-configs', apiLimiter, boatConfigRoutes);
app.use('/api/v1/shells', apiLimiter, shellRoutes);
app.use('/api/v1/lineups', apiLimiter, lineupRoutesV1);
app.use('/api/v1/seat-races', apiLimiter, seatRaceRoutes);
app.use('/api/v1/rankings', apiLimiter, rankingsRoutes);
app.use('/api/v1/ai', apiLimiter, aiRoutes);

// Legacy API Routes (will be migrated to v1)
app.use('/api/auth', authLimiter, authRoutes); // Keep for backward compatibility
app.use('/api/lineups', apiLimiter, lineupRoutes);
app.use('/api/erg-tests', apiLimiter, ergDataRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);

/**
 * CSV Data endpoint
 * Serves the combined athlete CSV file (Last Name, First Name, Country, Side)
 */
app.get('/api/data/athletes.csv', async (req, res) => {
  const csvPath = path.join(__dirname, '../data/athletes.csv');

  try {
    await fs.access(csvPath);
    res.setHeader('Content-Type', 'text/csv');
    res.sendFile(csvPath);
  } catch (err) {
    console.error('CSV file not found:', err);
    res.status(404).json({ error: 'Athletes CSV not found' });
  }
});

/**
 * Flags API endpoint
 * Serves country flag images - prioritizes SVG from /home/swd/Rowing/Flags_SVG/
 * Falls back to PNG from /home/swd/Rowing/Flags/
 */
app.get('/api/flags/:countryCode', async (req, res) => {
  const { countryCode } = req.params;
  // Remove any extension if already provided in URL and normalize to uppercase
  const baseCode = countryCode.replace(/\.(png|svg)$/i, '').toUpperCase();

  // Try SVG first
  const svgPath = path.join('/home/swd/Rowing/Flags_SVG', `${baseCode}.svg`);
  try {
    await fs.access(svgPath);
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.sendFile(svgPath);
  } catch (err) {
    // SVG not found, try PNG
  }

  // Fall back to PNG
  const pngPath = path.join('/home/swd/Rowing/Flags', `${baseCode}.png`);
  try {
    await fs.access(pngPath);
    return res.sendFile(pngPath);
  } catch (err) {
    console.error(`Flag not found: ${baseCode} (tried SVG and PNG)`, err.message);
    res.status(404).json({ error: 'Flag not found' });
  }
});

/**
 * Headshots API endpoint
 * Serves athlete headshots from /home/swd/Rowing/Roster_Headshots_cropped/
 * Tries multiple file extensions (.jpg, .jpeg, .png, .webp) and case variations
 */
app.get('/api/headshots/:filename', async (req, res) => {
  const { filename } = req.params;
  const baseDir = '/home/swd/Rowing/Roster_Headshots_cropped';

  // Remove any extension from filename if provided
  const baseName = filename.replace(/\.(jpg|jpeg|png|webp)$/i, '');

  // Try different extensions
  const extensions = ['jpg', 'jpeg', 'png', 'webp'];

  // Try different case variations
  const nameVariations = [
    baseName, // Original (usually capitalized)
    baseName.toLowerCase(), // lowercase
    baseName.charAt(0).toUpperCase() + baseName.slice(1).toLowerCase() // Capitalized
  ];

  for (const name of nameVariations) {
    for (const ext of extensions) {
      const filePath = path.join(baseDir, `${name}.${ext}`);

      try {
        await fs.access(filePath);
        // File exists, send it
        return res.sendFile(filePath);
      } catch (err) {
        // File doesn't exist with this combination, try next
        continue;
      }
    }
  }

  // No file found with any extension or case variation
  // Return 404 so frontend can use placeholder
  res.status(404).json({ error: 'Headshot not found' });
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

/**
 * Storage monitoring endpoint (admin only)
 */
app.get('/api/admin/storage', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const storageInfo = await getStorageInfo();
    res.json(storageInfo);
  } catch (err) {
    console.error('Storage info error:', err);
    res.status(500).json({ error: 'Failed to get storage info' });
  }
});

/**
 * In production, serve the built React app
 */
if (NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');

  // Serve static files from dist
  app.use(express.static(distPath));

  // Serve data files
  app.use('/data', express.static(path.join(__dirname, '..', 'data')));

  // Serve images
  app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images')));

  // All other routes serve index.html (SPA)
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Error logging middleware
app.use(errorLogger);

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal server error' : err.message,
    message: NODE_ENV === 'development' ? err.message : undefined,
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  logger.info('RowLab Server Started', {
    environment: NODE_ENV,
    port: PORT,
    url: `http://localhost:${PORT}`,
  });

  // ASCII banner for visibility
  console.log(`
╔══════════════════════════════════════════════╗
║           RowLab Server Started              ║
╠══════════════════════════════════════════════╣
║  Environment: ${NODE_ENV.padEnd(30)}║
║  Port:        ${PORT.toString().padEnd(30)}║
║  URL:         http://localhost:${PORT.toString().padEnd(21)}║
║  Security:    Helmet + Rate Limiting         ║
╚══════════════════════════════════════════════╝
  `);
});

export default app;
