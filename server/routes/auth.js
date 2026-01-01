import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db/connection.js';
import { generateToken, verifyToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Submit account application (requires admin approval)
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, email, requestMessage } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Username, password, and name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with pending status
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        email: email || null,
        requestMessage: requestMessage || null,
        role: 'coach',
        status: 'pending',
      },
    });

    res.status(201).json({
      message: 'Registration submitted! Your application is pending approval.',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        status: user.status,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is approved
    if (user.status === 'pending') {
      return res.status(403).json({ error: 'Your account is pending approval' });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({ error: 'Your account application was not approved' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/logout
 * Client-side logout (token invalidation handled client-side)
 */
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

/**
 * GET /api/auth/verify
 * Verify token and return user info
 */
router.get('/verify', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password (requires auth)
 */
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Password change failed' });
  }
});

/**
 * GET /api/auth/applications
 * Get pending user applications (admin only)
 */
router.get('/applications', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const applications = await prisma.user.findMany({
      where: { status: 'pending' },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        requestMessage: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ applications });
  } catch (err) {
    console.error('Get applications error:', err);
    res.status(500).json({ error: 'Failed to get applications' });
  }
});

/**
 * GET /api/auth/users
 * Get all users (admin only)
 */
router.get('/users', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

/**
 * POST /api/auth/applications/:id/approve
 * Approve a user application (admin only)
 */
router.post('/applications/:id/approve', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status: 'approved' },
      select: {
        id: true,
        username: true,
        name: true,
        status: true,
      },
    });

    res.json({
      message: `User ${user.username} has been approved`,
      user,
    });
  } catch (err) {
    console.error('Approve application error:', err);
    res.status(500).json({ error: 'Failed to approve application' });
  }
});

/**
 * POST /api/auth/applications/:id/reject
 * Reject a user application (admin only)
 */
router.post('/applications/:id/reject', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status: 'rejected' },
      select: {
        id: true,
        username: true,
        name: true,
        status: true,
      },
    });

    res.json({
      message: `User ${user.username} has been rejected`,
      user,
    });
  } catch (err) {
    console.error('Reject application error:', err);
    res.status(500).json({ error: 'Failed to reject application' });
  }
});

/**
 * DELETE /api/auth/users/:id
 * Delete a user (admin only, cannot delete self)
 */
router.delete('/users/:id', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const userId = parseInt(id);

    // Cannot delete self
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
