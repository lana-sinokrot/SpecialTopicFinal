const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// controllers/users.controller.js
const pool = require('../models/db'); // assuming PostgreSQL with pg

// Get user by ID (from token or route)
exports.getUserById = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const result = await pool.query(
      'SELECT user_id, first_name, last_name, email FROM users WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  const { user_id } = req.params;
  const { first_name, last_name, email, current_password, new_password } = req.body;

  try {
    // Verify that the user exists
    const userResult = await pool.query(
      'SELECT * FROM users WHERE user_id = $1',
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // If changing password, verify current password
    if (new_password) {
      const isValidPassword = await bcrypt.compare(current_password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
    }

    // Check if email is already taken by another user
    if (email !== user.email) {
      const emailExists = await pool.query(
        'SELECT * FROM users WHERE email = $1 AND user_id != $2',
        [email, user_id]
      );

      if (emailExists.rows.length > 0) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
    }

    // Prepare update query
    let updateQuery = `
      UPDATE users 
      SET first_name = $1, last_name = $2, email = $3
    `;
    let queryParams = [first_name, last_name, email];

    // If changing password, add it to the update
    if (new_password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(new_password, salt);
      updateQuery += `, password = $${queryParams.length + 1}`;
      queryParams.push(hashedPassword);
    }

    updateQuery += ` WHERE user_id = $${queryParams.length + 1} RETURNING user_id, first_name, last_name, email`;
    queryParams.push(user_id);

    // Execute update
    const result = await pool.query(updateQuery, queryParams);
    const updatedUser = result.rows[0];

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Error updating user profile' });
  }
};

module.exports = {
  getUserById,
  updateUser
}; 