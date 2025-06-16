# Backend Documentation

Repository: [https://github.com/lana-sinokrot/back-end-final](https://github.com/lana-sinokrot/back-end-final)

## Technology Stack

- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- Bcrypt for password hashing
- Multer for file uploads
- CORS

## Project Structure

```
backend/
├── config/           # Database configuration
├── controllers/      # Route controllers
├── middleware/      # Auth middleware
├── routes/          # API routes
├── uploads/         # File upload directory
├── enviroment.env   # Environment variables
├── schema.sql       # Database schema
└── server.js        # Server entry point
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);
```

### Reports Table
```sql
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
```

### Attachments Table
```sql
CREATE TABLE attachments (
  attachment_id SERIAL PRIMARY KEY,
  report_id INTEGER REFERENCES reports(report_id) ON DELETE CASCADE,
  file_path TEXT
);
```

## API Endpoints

### Authentication

#### POST /api/auth/register
- Register a new user
- Body:
```json
{
  "first_name": "string",
  "last_name": "string",
  "email": "string",
  "password": "string"
}
```

#### POST /api/auth/login
- Login user
- Body:
```json
{
  "email": "string",
  "password": "string"
}
```

### Reports

#### GET /api/reports
- Get all reports for authenticated user
- Headers: `Authorization: Bearer {token}`

#### POST /api/reports
- Create new report
- Headers: `Authorization: Bearer {token}`
- Body:
```json
{
  "incident_date": "YYYY-MM-DD",
  "incident_time": "HH:mm",
  "location": "string",
  "incident_type": "string",
  "description": "string",
  "witnesses": "string"
}
```

### Users

#### GET /api/users/me
- Get current user's data
- Headers: `Authorization: Bearer {token}`

## Environment Variables

Create an `enviroment.env` file in the backend root:

```env
# Server Configuration
PORT=5000

# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=incidentdb
DB_PASSWORD=your_password
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your_jwt_secret
```

## Available Scripts

```bash
# Install dependencies
npm install

# Start server
npm start
```

## Security Features

1. Authentication
   - JWT token validation
   - Password hashing with bcrypt
   - Protected routes

2. Data Protection
   - CORS configuration
   - Input validation
   - Secure file uploads 