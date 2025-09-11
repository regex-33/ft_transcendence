# Authentication Endpoints Integration Guide

## Directory Structure
Create the following new files in your user-service:

```
services/user-service/Router/Auth/
├── index.js        (Auth router registration)
├── sessions.js     (Session management endpoints)
└── password.js     (Password management endpoints)
```

## API Endpoints

### Session Management
- `GET /api/auth/sessions` - Get all active sessions for current user
- `DELETE /api/auth/sessions/:sessionId` - Terminate specific session
- `DELETE /api/auth/sessions` - Terminate all other sessions (keep current)

### Password Management
- `POST /api/auth/validate-password` - Check if password is correct
  ```json
  { "password": "currentPassword" }
  ```

- `POST /api/auth/change-password` - Change user password
  ```json
  { 
    "currentPassword": "oldPassword",
    "newPassword": "newPassword"
  }
  ```
<!-- curl command  current password: test@gmail.com  new: testt@gmail.com-->

<!-- curl -X POST -H "Content-Type: application/json"  -d '{"currentPassword": "test@gmail.com", "newPassword": "testt@gmail.com"}' http://localhost/api/auth/change-password -->



- `POST /api/auth/forgot-password` - Generate password reset code
  ```json
  { "email": "user@example.com" }
  ```

- `POST /api/auth/reset-password` - Reset password using code
  ```json
  { 
    "email": "user@example.com",
    "code": "123456",
    "newPassword": "newPassword"
  }
  ```

## Frontend Integration

Update your SecuritySettings component to use these new endpoints:

```typescript
// For session management
const fetchActiveSessions = async () => {
  const response = await fetch(`http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/auth/sessions`, {
    credentials: 'include'
  });
  const data = await response.json();
  setActiveSessions(data.sessions || []);
};

// For password validation
const validateCurrentPassword = async (password: string) => {
  const response = await fetch(`http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/auth/validate-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ password })
  });
  const data = await response.json();
  return data.valid;
};

// For password change
const handlePasswordReset = async (e: Event) => {
  e.preventDefault();
  
  const response = await fetch(`http://${import.meta.env.VITE_USER_SERVICE_HOST}:${import.meta.env.VITE_USER_SERVICE_PORT}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      currentPassword,
      newPassword
    }),
  });
  
  // Handle response...
};
```

## Database Considerations

### Session Model Enhancement (Optional)
Consider adding these fields to your Session model for better session tracking:

```javascript
// In services/user-service/models/Session.js
const session = (sequelize, DataTypes) => {
    const Session = sequelize.define('Session', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        SessionId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        counter: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        // ADD THESE FIELDS FOR BETTER SESSION TRACKING
        ipAddress: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        userAgent: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        deviceInfo: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    }, {
        tableName: 'sessions',
        timestamps: true,
    })

    return Session
}
```

## Security Notes

1. **Session Security**: Sessions are tied to user authentication and can only be managed by the session owner
2. **Password Validation**: Uses bcrypt for secure password comparison
3. **Reset Codes**: 6-digit codes with expiration (15 minutes)
4. **Rate Limiting**: Consider adding rate limiting to password reset endpoints
5. **Audit Logging**: All actions are logged using your existing logger system