# Requirements Document

## Introduction

This feature addresses authentication issues in the GaramDoodh admin portal system. The system currently has authentication components in place but may have issues with admin user creation, token validation, or session management that prevent proper admin access to the portal.

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want to ensure admin users can be created and stored properly in the database, so that authorized personnel can access the admin portal.

#### Acceptance Criteria

1. WHEN an admin user creation script is executed THEN the system SHALL create or update an admin user with email "admin@garamdoodh.com" and password "admin123"
2. WHEN the admin user is created THEN the system SHALL hash the password using bcrypt with salt rounds of 10
3. WHEN checking for existing admin users THEN the system SHALL update existing users rather than create duplicates
4. WHEN the admin user is saved THEN the system SHALL set role to "admin" and isActive to true

### Requirement 2

**User Story:** As an admin user, I want to login with my credentials through the authentication endpoint, so that I can access the admin portal functionality.

#### Acceptance Criteria

1. WHEN valid admin credentials are submitted to /auth-login THEN the system SHALL return a JWT token with 7-day expiration
2. WHEN invalid credentials are submitted THEN the system SHALL return an appropriate error message
3. WHEN login is successful THEN the system SHALL update the user's lastLogin timestamp
4. WHEN login response is sent THEN the system SHALL include user information and admin flag

### Requirement 3

**User Story:** As an authenticated admin, I want my session to be validated on protected routes, so that I can access admin-only functionality securely.

#### Acceptance Criteria

1. WHEN a request includes a valid Bearer token THEN the system SHALL validate the JWT signature
2. WHEN the token is valid THEN the system SHALL verify the user exists and has admin role
3. WHEN the user is inactive THEN the system SHALL reject the request with 401 status
4. WHEN validation succeeds THEN the system SHALL return admin permissions and user details

### Requirement 4

**User Story:** As a developer, I want debugging tools to troubleshoot authentication issues, so that I can quickly identify and resolve login problems.

#### Acceptance Criteria

1. WHEN accessing the debug page THEN the system SHALL display current authentication status from localStorage
2. WHEN testing login credentials THEN the system SHALL show detailed response information
3. WHEN testing session validation THEN the system SHALL display validation results
4. WHEN clearing authentication THEN the system SHALL remove all stored tokens and user data