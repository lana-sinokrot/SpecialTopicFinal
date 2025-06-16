const jwt = require('jsonwebtoken');

const ADMIN_EMAIL = 'admin@htu.edu.jo';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  // Special handling for admin token
  if (token === 'admin-token') {
    req.user = {
      user_id: 'admin',
      email: ADMIN_EMAIL
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token.' });
  }
};

// Helper function to check if user is admin
const isAdmin = (email) => email === ADMIN_EMAIL;

module.exports = { authenticateToken, isAdmin };