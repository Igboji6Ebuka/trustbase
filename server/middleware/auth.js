import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'trustbase-super-secret-2026';

/**
 * Middleware: verify JWT from Authorization header.
 * Attaches req.user = { id, phone, is_admin } on success.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware: require admin role.
 * Must be used after requireAuth.
 */
export function requireAdmin(req, res, next) {
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export function signToken(user) {
  return jwt.sign(
    { id: user.id, phone: user.phone, name: user.name, is_admin: user.is_admin },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
