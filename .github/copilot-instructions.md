<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a NestJS application with the following architecture:

## Project Structure
- **Authentication**: JWT-based auth with session management in cookies
- **Database**: PostgreSQL with TypeORM ORM
- **User Management**: Extended user profiles with academic information
- **Security**: bcrypt password hashing, HTTP-only cookies for sessions

## Key Features
- Session-based authentication with JWT tokens
- User registration and login
- Extended user profile management (academic/educational data)
- Docker support with PostgreSQL container

## Coding Standards
- Use TypeScript with strict typing
- Follow NestJS patterns (modules, services, controllers)
- Use class-validator for DTO validation
- Implement proper error handling with custom exceptions
- Use TypeORM entities with proper relations

## Security Practices
- Always hash passwords with bcrypt
- Use HTTP-only cookies for session keys
- Validate all input with class-validator
- Implement proper JWT token expiration
- Use guards for route protection
