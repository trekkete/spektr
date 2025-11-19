# Spektr

Captive Portal Vendor Configuration Management System

## Overview

Spektr is a web application for managing captive portal vendor configurations. It allows users to create, version, and share vendor-specific configurations with support for PDF export and comprehensive versioning.

## Features

- User authentication and registration
- Captive portal vendor configuration management
- Version control for configurations (immutable history)
- PDF export of configurations
- Multi-user support with sharing capabilities
- JSONB storage for flexible vendor-specific data

## Tech Stack

- **Backend**: Spring Boot 3.2.0, Java 17
- **Frontend**: React 18 with TypeScript
- **Database**: PostgreSQL with JSONB support
- **Security**: Spring Security with session-based authentication

## Getting Started

### Prerequisites

- Java 17 or higher
- Maven 3.6+
- Node.js 18+ and npm
- PostgreSQL (for production)

### Running the Application

1. **Start the Backend:**
   ```bash
   mvn spring-boot:run
   ```
   Backend will run on `http://localhost:8080`

2. **Start the Frontend:**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   Frontend will run on `http://localhost:3000`

3. **Access the Application:**
   - Open `http://localhost:3000` in your browser
   - Register a new account or login
   - Start managing your vendor configurations

### Database Setup

The application uses PostgreSQL for both development and production:

```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create development database
createdb spektr_dev
createuser spektr_dev
psql -d spektr_dev -c "ALTER USER spektr_dev WITH PASSWORD 'spektr_dev';"
psql -d spektr_dev -c "GRANT ALL PRIVILEGES ON DATABASE spektr_dev TO spektr_dev;"
```

## Documentation

See [CLAUDE.md](CLAUDE.md) for detailed development documentation.

## License

Apache License 2.0