const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'enviroment.env') });

// Ensure all connection parameters are strings
const pool = new Pool({
  user: String(process.env.DB_USER || 'postgres'),
  host: String(process.env.DB_HOST || 'localhost'),
  database: String(process.env.DB_NAME || 'incidentdb'),
  password: String(process.env.DB_PASSWORD || '0000'),
  port: parseInt(process.env.DB_PORT || '5432', 10),
  ssl: false
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Database connection successful');
    console.log('Connection details:');
    console.log('Database:', process.env.DB_NAME);
    console.log('User:', process.env.DB_USER);
    console.log('Host:', process.env.DB_HOST);
    console.log('Port:', process.env.DB_PORT);
    
    // Test if tables exist
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Creating database tables...');
      // Create tables if they don't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          user_id SERIAL PRIMARY KEY,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          email VARCHAR(150) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS reports (
          report_id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
          incident_date DATE,
          incident_time TIME,
          location TEXT,
          submission_date DATE,
          incident_type VARCHAR(50),
          description TEXT,
          witnesses TEXT,
          status VARCHAR(50) DEFAULT 'Pending',
          admin_comment TEXT
        );

        CREATE TABLE IF NOT EXISTS attachments (
          attachment_id SERIAL PRIMARY KEY,
          report_id INTEGER REFERENCES reports(report_id) ON DELETE CASCADE,
          file_path TEXT
        );
      `);
      console.log('Database tables created successfully');
    } else {
      // Check if we need to remove the is_admin column
      const columnCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'users' 
          AND column_name = 'is_admin'
        );
      `);
      
      if (columnCheck.rows[0].exists) {
        console.log('Removing is_admin column from users table...');
        await client.query('ALTER TABLE users DROP COLUMN IF EXISTS is_admin;');
        console.log('is_admin column removed successfully');
      } else {
        console.log('Database tables already exist with correct schema');
      }
    }
    
    client.release();
  } catch (err) {
    console.error('Database connection error:', err.message);
    console.error('Connection details:');
    console.error('Database:', process.env.DB_NAME);
    console.error('User:', process.env.DB_USER);
    console.error('Host:', process.env.DB_HOST);
    console.error('Port:', process.env.DB_PORT);
    
    if (err.message.includes('does not exist')) {
      try {
        // Try to create the database
        const pgPool = new Pool({
          user: String(process.env.DB_USER || 'postgres'),
          host: String(process.env.DB_HOST || 'localhost'),
          database: 'postgres', // Connect to default postgres database
          password: String(process.env.DB_PASSWORD || '0000'),
          port: parseInt(process.env.DB_PORT || '5432', 10),
          ssl: false
        });
        
        const client = await pgPool.connect();
        await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
        client.release();
        console.log(`Database ${process.env.DB_NAME} created successfully`);
        
        // Retry the connection
        testConnection();
      } catch (createErr) {
        console.error('Error creating database:', createErr.message);
      }
    }
  }
};

// Run the connection test
testConnection();

// Add error handler for unexpected pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool; 