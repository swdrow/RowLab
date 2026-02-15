/**
 * Upload Routes Tests
 * Tests for file upload with magic bytes validation
 * @vitest-environment node
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set JWT_SECRET before importing modules
process.env.JWT_SECRET = 'test-secret-key-for-upload-tests';

// Mock auth middleware to bypass authentication in tests
vi.mock('../middleware/auth.js', () => ({
  authenticateToken: (req, res, next) => {
    req.user = {
      id: 1,
      email: 'test@example.com',
      activeTeamId: 1,
      activeTeamRole: 'coach',
    };
    next();
  },
}));

// Import after setting env and mocks
const uploadsRouter = (await import('../routes/uploads.js')).default;

// Create test app
const app = express();
app.use('/api/v1/uploads', uploadsRouter);

// JWT secret for test tokens
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// Helper to create test auth token
function createTestToken(userId = 1, role = 'coach', teamId = 1) {
  return jwt.sign(
    {
      sub: userId,
      email: 'test@example.com',
      activeTeamId: teamId,
      activeTeamRole: role,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

describe('Upload Routes - Magic Bytes Validation', () => {
  const uploadDir = path.join(__dirname, '../../uploads/visit-schedules');
  const testFilesDir = path.join(__dirname, 'fixtures/uploads');
  
  beforeAll(() => {
    // Create test files directory
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }
    
    // Create a valid PDF file (minimal PDF structure with magic bytes)
    const validPDF = Buffer.from([
      0x25, 0x50, 0x44, 0x46, 0x2D, // %PDF- magic bytes
      0x31, 0x2E, 0x34, 0x0A, // 1.4\n
      0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A, // binary marker
      ...Buffer.from('1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n'),
      ...Buffer.from('2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n'),
      ...Buffer.from('3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n'),
      ...Buffer.from('xref\n0 4\n'),
      ...Buffer.from('0000000000 65535 f\n'),
      ...Buffer.from('0000000009 00000 n\n'),
      ...Buffer.from('0000000056 00000 n\n'),
      ...Buffer.from('0000000115 00000 n\n'),
      ...Buffer.from('trailer<</Size 4/Root 1 0 R>>\n'),
      ...Buffer.from('startxref\n190\n%%EOF\n'),
    ]);
    fs.writeFileSync(path.join(testFilesDir, 'valid.pdf'), validPDF);
    
    // Create a fake PDF (text file with .pdf extension)
    fs.writeFileSync(
      path.join(testFilesDir, 'fake.pdf'),
      'This is not a real PDF file, just text with .pdf extension'
    );
    
    // Create a text file
    fs.writeFileSync(
      path.join(testFilesDir, 'test.txt'),
      'This is a plain text file'
    );
  });
  
  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(testFilesDir)) {
      fs.rmSync(testFilesDir, { recursive: true, force: true });
    }
    
    // Clean up uploaded files
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(uploadDir, file));
      });
    }
  });
  
  describe('POST /visit-schedule', () => {
    let authToken;
    
    beforeEach(() => {
      authToken = createTestToken(1, 'coach');
    });
    
    it('should accept a valid PDF file with correct magic bytes', async () => {
      const response = await request(app)
        .post('/api/v1/uploads/visit-schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', path.join(testFilesDir, 'valid.pdf'));
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('url');
      expect(response.body.data).toHaveProperty('filename');
      expect(response.body.data.filename).toBe('valid.pdf');
      
      // Verify file was saved
      const uploadedFile = response.body.data.url.replace('/uploads/visit-schedules/', '');
      const filePath = path.join(uploadDir, uploadedFile);
      expect(fs.existsSync(filePath)).toBe(true);
    });
    
    it('should reject a fake PDF file (text with .pdf extension)', async () => {
      const response = await request(app)
        .post('/api/v1/uploads/visit-schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', path.join(testFilesDir, 'fake.pdf'));
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_FILE_TYPE');
      expect(response.body.error.message).toBe('File is not a valid PDF');
    });
    
    it('should reject a text file', async () => {
      const response = await request(app)
        .post('/api/v1/uploads/visit-schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', path.join(testFilesDir, 'test.txt'));
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      // This will be rejected by multer's fileFilter before magic bytes check
      expect(response.body.error.code).toBe('UPLOAD_ERROR');
    });
    
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/uploads/visit-schedule')
        .attach('file', path.join(testFilesDir, 'valid.pdf'));
      
      expect(response.status).toBe(401);
    });
    
    it('should reject when no file is provided', async () => {
      const response = await request(app)
        .post('/api/v1/uploads/visit-schedule')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_FILE');
    });
  });
});
