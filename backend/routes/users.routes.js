// routes/user.js
const express = require('express');
const router = express.Router();
const { getUserById, updateUser } = require('../controllers/users.controller');
const authMiddleware = require('../middleware/auth');

// Authenticated user's profile
router.get('/me', authMiddleware, getUserById);
router.put('/me', authMiddleware, updateUser);

module.exports = router;
