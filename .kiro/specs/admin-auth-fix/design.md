# Design Document

## Overview

The admin authentication fix addresses issues in the existing authentication system by ensuring proper admin user creation, robust login flow, secure session validation, and effective debugging tools. The solution builds upon the existing MongoDB/JWT architecture while fixing potential gaps in the authentication chain.

## Architecture

The authentication system follows a standard JWT-based approach:

```
Client (Debug/Login) → Netlify Functions → MongoDB Atlas → JWT Token → Session Validation
```

### Key Components:
- **MongoDB Atlas**: User storage with bcrypt password hashing
- **JWT Tokens**: 7-day expiration with user ID payload
- **Netlify Functions**: Serverless authentication endpoints
- **Client Storage**: localStorage for token persistence
- **Debug Tools**: Real-time authentication status monitoring

## Components and Interfaces

### 1. Admin User Management
- **create-admin-user.js**: Script for creating/updating admin users
- **User Model**: MongoDB schema with password hashing and validation
- **Database Connection**: Centralized connection management

### 2. Authentication Endpoints
- **auth-login.js**: POST endpoint for credential validation and token generation
- **admin-validate.js**: GET endpoint for session validation and permission checking
- **JWT Utilities**: Token generation and verification functions

### 3. Client-Side Authentication
- **localStorage Management**: Token and user info persistence
- **Debug Interface**: Real-time authentication status and testing tools
- **Error Handling**: User-friendly error messages and status indicators

### 4. Security Layer
- **Password Hashing**: bcrypt with salt rounds
- **JWT Verification**: Signature validation and expiration checking
- **Role-Based Access**: Admin role verification for protected routes
- **Account Status**: Active/inactive user state management

## Data Models

### User Schema
```javascript
{
  name: String (required, max 50 chars),
  email: String (required, unique, lowercase),
  password: String (required, min 6 chars, hashed),
  role: String (enum: ['customer', 'admin']),
  isActive: Boolean (default: true),
  lastLogin: Date,
  // ... other fields
}
```

### JWT Payload
```javascript
{
  userId: ObjectId,
  iat: Number (issued at),
  exp: Number (expiration)
}
```

### Authentication Response
```javascript
{
  success: Boolean,
  message: String,
  data: {
    user: Object (without password),
    token: String (JWT),
    isAdmin: Boolean
  }
}
```

## Error Handling

### Authentication Errors
- **401 Unauthorized**: Invalid credentials, expired tokens, inactive accounts
- **403 Forbidden**: Valid user but insufficient permissions (non-admin)
- **400 Bad Request**: Missing required fields, invalid input format
- **500 Server Error**: Database connection issues, JWT signing failures

### Client-Side Error Handling
- **Network Errors**: Retry mechanisms and user feedback
- **Token Expiration**: Automatic logout and redirect to login
- **Validation Failures**: Clear error messages and suggested actions
- **Debug Information**: Detailed error logging for troubleshooting

## Testing Strategy

### Unit Testing (Optional)
- Password hashing and comparison functions
- JWT token generation and verification
- User model validation methods
- Database connection utilities

### Integration Testing (Optional)
- End-to-end authentication flow
- Token validation across different endpoints
- Admin user creation and login process
- Error handling for various failure scenarios

### Manual Testing
- Debug interface for real-time testing
- Login flow verification with valid/invalid credentials
- Session validation testing with different token states
- Admin portal access verification

### Security Testing
- Password strength validation
- JWT token security (expiration, signature)
- Role-based access control verification
- Session management security