import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'rowlab-default-secret';

/**
 * Middleware to verify JWT token
 * Sets req.user if token is valid
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware to optionally check for auth
 * Sets req.user if token exists and is valid, but doesn't require it
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Token invalid, but we don't require auth
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
};

/**
 * Generate JWT token for user
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};
