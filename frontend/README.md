# Frontend Documentation

Repository: [https://github.com/lana-sinokrot/front-end-final](https://github.com/lana-sinokrot/front-end-final)

## Technology Stack

- React 18
- React Router v6
- React Bootstrap
- CSS3 with custom styling
- WeatherAPI integration

## Project Structure

```
frontend/
├── public/
├── src/
│   ├── assets/          # Images and static assets
│   ├── components/      # React components
│   ├── services/        # API services
│   ├── styles/          # CSS styles
│   ├── App.js          # Main App component
│   └── index.js        # Entry point
└── package.json
```

## Components

### Core Components

1. `Home.js`
   - Landing page with hero section
   - Report button with authentication check
   - Responsive layout with Bootstrap

2. `Header.js`
   - Navigation bar with React Bootstrap
   - Authentication status display
   - Weather widget integration
   - Admin/User dashboard links

3. `Dashboard.js`
   - User's report listing
   - Report actions (view, edit, delete)
   - Welcome message with user's name
   - Report status tracking

4. `AdminDashboard.js`
   - Admin-specific report management
   - Report status updates
   - Admin comments functionality

### Authentication Components

1. `Login.js`
   - User login form
   - Error handling
   - Authentication token management

2. `Register.js`
   - User registration form
   - Input validation
   - Automatic login after registration

### Report Components

1. `Report.js`
   - Incident report form
   - File upload support
   - Multiple incident types
   - Progress tracking for uploads

2. `ViewReport.js`
   - Detailed report view
   - Status display
   - Submission date formatting

3. `EditReport.js`
   - Report modification
   - Existing data pre-fill
   - File attachment management

4. `FileUpload.js`
   - Drag and drop support
   - File type validation
   - Size restrictions (5MB limit)
   - Progress indicator

5. `DeleteConfirmationModal.js`
   - Report deletion confirmation
   - Type-specific messaging
   - Action confirmation

### Route Protection

1. `ProtectedRoute.js`
   - Authentication verification
   - Login redirect
   - Route protection wrapper

2. `AdminRoute.js`
   - Admin access verification
   - Authorization check
   - Admin-only route protection

## Services

### `auth.service.js`
- Login/logout functionality
- Token management
- User session handling

### `weather.service.js`
- WeatherAPI.com integration
- Current weather display
- 5-minute auto-refresh

## Environment Variables

Create a `.env` file in the frontend root:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WEATHER_API_KEY=37f557b7d3464cccb6c161816251006
```

## Available Scripts

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Security Features

1. Authentication
   - JWT token handling
   - Protected routes
   - Session management

2. File Upload Security
   - File type validation
   - Size restrictions (5MB limit)
   - Secure file handling

3. Input Validation
   - Form validation
   - Data sanitization
   - Error handling

## API Integration

### Backend API
- Base URL: `http://localhost:5000/api`
- Authentication: JWT tokens
- Endpoints documented in backend README

### Weather API
- Provider: WeatherAPI.com
- Endpoint: `https://api.weatherapi.com/v1`
- Auto-refresh: Every 5 minutes

## State Management

- Local component state using React hooks
- Context API for auth state
- Local storage for persistence

## Responsive Design

- Mobile-first approach
- Breakpoints:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

## Best Practices

1. Code Organization
   - Component-based architecture
   - Service abstraction
   - Consistent naming

2. Performance
   - Lazy loading
   - Image optimization
   - Code splitting

3. Accessibility
   - ARIA labels
   - Keyboard navigation
   - Color contrast

## Contributing

1. Follow the component structure
2. Maintain consistent styling
3. Document new features
4. Add appropriate tests
5. Follow React best practices
