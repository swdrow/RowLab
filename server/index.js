import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

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
  // Remove any extension if already provided in URL
  const baseCode = countryCode.replace(/\.(png|svg)$/i, '');

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║           RowLab Server Started              ║
╠══════════════════════════════════════════════╣
║  Environment: ${NODE_ENV.padEnd(30)}║
║  Port:        ${PORT.toString().padEnd(30)}║
║  URL:         http://localhost:${PORT.toString().padEnd(21)}║
╚══════════════════════════════════════════════╝
  `);

  if (NODE_ENV === 'development') {
    console.log('\nNote: In development, run "npm run dev" separately for Vite dev server');
    console.log('This server only provides the /api/headshots endpoint');
  }
});

export default app;
