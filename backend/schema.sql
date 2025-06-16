CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE reports (
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

CREATE TABLE attachments (
  attachment_id SERIAL PRIMARY KEY,
  report_id INTEGER REFERENCES reports(report_id) ON DELETE CASCADE,
  file_path TEXT
);