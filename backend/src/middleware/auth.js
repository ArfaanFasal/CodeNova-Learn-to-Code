import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET;

export function authUser(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    User.findById(decoded.userId)
      .then((user) => {
        if (!user) return res.status(401).json({ error: 'User not found' });
        if (user.isBlocked) return res.status(403).json({ error: 'Account is blocked' });
        req.user = user;
        next();
      })
      .catch(() => res.status(401).json({ error: 'Invalid token' }));
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function authAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_ADMIN_SECRET);
    Admin.findById(decoded.adminId)
      .then((admin) => {
        if (!admin) return res.status(401).json({ error: 'Admin not found' });
        req.admin = admin;
        next();
      })
      .catch(() => res.status(401).json({ error: 'Invalid token' }));
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
