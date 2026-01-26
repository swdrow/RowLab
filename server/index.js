import 'dotenv/config';
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
import stravaRoutes from './routes/strava.js';
import fitImportRoutes from './routes/fitImport.js';
import boatConfigRoutes from './routes/boatConfigs.js';
import shellRoutes from './routes/v1/shells.js';
import oarSetRoutes from './routes/v1/oarSets.js';
import seatRaceRoutes from './routes/seatRaces.js';
import ratingsRoutes from './routes/ratings.js';
import rankingsRoutes from './routes/rankings.js';
import advancedRankingRoutes from './routes/advancedRanking.js';
import regattaRoutes from './routes/regattas.js';
import teamRankingsRoutes from './routes/teamRankings.js';
import externalTeamsRoutes from './routes/externalTeams.js';
import announcementRoutes from './routes/announcements.js';
import telemetryRoutes from './routes/telemetry.js';
import combinedScoringRoutes from './routes/combinedScoring.js';
import aiLineupRoutes from './routes/aiLineup.js';
import subscriptionRoutes from './routes/subscriptions.js';
import settingsRoutes from './routes/settings.js';
import calendarRoutes from './routes/calendar.js';
import waterSessionRoutes from './routes/waterSessions.js';
import healthRoutes from './routes/health.js';
import backgroundSyncRoutes from './routes/backgroundSync.js';
import trainingPlanRoutes from './routes/trainingPlans.js';
import dashboardPreferencesRoutes from './routes/dashboardPreferences.js';
import activitiesRoutes from './routes/activities.js';
import whiteboardRoutes from './routes/whiteboards.js';
import availabilityRoutes from './routes/availability.js';
import attendanceRoutes from './routes/attendance.js';
import sessionRoutes from './routes/sessions.js';
import { getStorageInfo } from './utils/storageMonitor.js';
import { startBackgroundSync } from './services/backgroundSyncService.js';
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

// Health checks (no auth, for Docker/k8s)
app.use('/api/health', healthRoutes);
app.use('/health', healthRoutes);

// API v1 Routes (new multi-tenant)
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/teams', apiLimiter, teamRoutes);
app.use('/api/v1/athletes', apiLimiter, athleteRoutes);
app.use('/api/v1/invites', apiLimiter, inviteRoutes);
app.use('/api/v1/erg-tests', apiLimiter, ergTestRoutes);
app.use('/api/v1/import', apiLimiter, importRoutes);
app.use('/api/v1/workouts', apiLimiter, workoutRoutes);
app.use('/api/v1/concept2', apiLimiter, concept2Routes);
app.use('/api/v1/strava', apiLimiter, stravaRoutes);
app.use('/api/v1/fit', apiLimiter, fitImportRoutes);
app.use('/api/v1/boat-configs', apiLimiter, boatConfigRoutes);
app.use('/api/v1/shells', apiLimiter, shellRoutes);
app.use('/api/v1/oar-sets', apiLimiter, oarSetRoutes);
app.use('/api/v1/lineups', apiLimiter, lineupRoutesV1);
app.use('/api/v1/seat-races', apiLimiter, seatRaceRoutes);
app.use('/api/v1/ratings', apiLimiter, ratingsRoutes);
app.use('/api/v1/rankings', apiLimiter, rankingsRoutes);
app.use('/api/v1/advanced-ranking', apiLimiter, advancedRankingRoutes);
app.use('/api/v1/regattas', apiLimiter, regattaRoutes);
app.use('/api/v1/team-rankings', apiLimiter, teamRankingsRoutes);
app.use('/api/v1/external-teams', apiLimiter, externalTeamsRoutes);
app.use('/api/v1/announcements', apiLimiter, announcementRoutes);
app.use('/api/v1/telemetry', apiLimiter, telemetryRoutes);
app.use('/api/v1/combined-scoring', apiLimiter, combinedScoringRoutes);
app.use('/api/v1/ai-lineup', apiLimiter, aiLineupRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes); // No limiter - webhook needs raw body
app.use('/api/v1/settings', apiLimiter, settingsRoutes);
app.use('/api/v1/calendar', apiLimiter, calendarRoutes);
app.use('/api/v1/water-sessions', apiLimiter, waterSessionRoutes);
app.use('/api/v1/admin/sync', apiLimiter, backgroundSyncRoutes);
app.use('/api/v1/ai', apiLimiter, aiRoutes);
app.use('/api/v1/training-plans', apiLimiter, trainingPlanRoutes);
app.use('/api/v1/dashboard-preferences', apiLimiter, dashboardPreferencesRoutes);
app.use('/api/v1/activities', apiLimiter, activitiesRoutes);
app.use('/api/v1/whiteboards', apiLimiter, whiteboardRoutes);
app.use('/api/v1/availability', apiLimiter, availabilityRoutes);
app.use('/api/v1/attendance', apiLimiter, attendanceRoutes);
app.use('/api/v1/sessions', apiLimiter, sessionRoutes);

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
    logger.warn('CSV file not found', { error: err.message });
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
    logger.debug('Flag not found', { code: baseCode, error: err.message });
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
    logger.error('Storage info error', { error: err.message, stack: err.stack });
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

// Database health check function
async function checkDatabaseHealth() {
  try {
    const { prisma } = await import('./db/connection.js');

    // Check if we can connect
    await prisma.$queryRaw`SELECT 1`;

    // Check if admin user exists
    const adminUser = await prisma.user.findFirst({
      where: { isAdmin: true }
    });

    if (!adminUser) {
      logger.warn('No admin user found - run: npm run db:seed');
      return { healthy: true, hasAdmin: false };
    }

    logger.info('Database healthy', { adminUser: adminUser.email });
    return { healthy: true, hasAdmin: true };
  } catch (err) {
    logger.error('Database health check failed', { error: err.message, stack: err.stack });
    return { healthy: false, error: err.message };
  }
}

// Start server
app.listen(PORT, async () => {
  logger.info('RowLab Server Started', {
    environment: NODE_ENV,
    port: PORT,
    url: `http://localhost:${PORT}`,
  });

  // Check database health on startup
  const dbHealth = await checkDatabaseHealth();

  // Start background sync jobs in production
  let syncStatus = 'Disabled';
  if (NODE_ENV === 'production' && dbHealth.healthy) {
    try {
      startBackgroundSync();
      syncStatus = '✓ Running';
    } catch (err) {
      logger.error('Failed to start background sync', { error: err.message });
      syncStatus = '✗ Error';
    }
  }

  // ASCII banner for visibility
  console.log(`
╔══════════════════════════════════════════════╗
║           RowLab Server Started              ║
╠══════════════════════════════════════════════╣
║  Environment: ${NODE_ENV.padEnd(30)}║
║  Port:        ${PORT.toString().padEnd(30)}║
║  URL:         http://localhost:${PORT.toString().padEnd(21)}║
║  Security:    Helmet + Rate Limiting         ║
║  Database:    ${(dbHealth.healthy ? (dbHealth.hasAdmin ? '✓ Healthy' : '⚠ No Admin') : '✗ Error').padEnd(30)}║
║  Background:  ${syncStatus.padEnd(30)}║
╚══════════════════════════════════════════════╝
  `);
});

export default app;
