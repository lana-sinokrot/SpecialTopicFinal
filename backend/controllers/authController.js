const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { first_name, last_name, email, password } = req.body;
  
  // Validate input
  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({
      message: 'All fields are required'
    });
  }

  try {
    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const result = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING user_id, first_name, last_name, email',
      [first_name, last_name, email, hashedPassword]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        user_id: result.rows[0].user_id,
        email: result.rows[0].email
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send success response
    res.status(201).json({
      token,
      user_id: result.rows[0].user_id,
      first_name: result.rows[0].first_name,
      last_name: result.rows[0].last_name,
      email: result.rows[0].email
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error during registration' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const userResult = await pool.query(
      'SELECT user_id, email, password, first_name, last_name FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        user_id: user.user_id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send response
    res.json({
      token,
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
