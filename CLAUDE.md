# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**spektr** is a JVM-based project (indicated by the Java .gitignore configuration).

This repository is a Java Maven project with Spring Boot as backend and TypeScript as frontend.

**Project Goal**: Create a GUI for managing captive portal vendor configurations where users can:
- Add new captive portal vendor configurations (model and firmware)
- Upload vendor captive portal information (redirect URL, RADIUS auth/accounting, query params, walled garden config, MAC auth, logout support, etc.)
- Save configuration versions and export as PDF summaries
- Create new versions on top of previous ones (immutable versioning - no deletion of previous versions)
- Manage personal vendor integrations with optional sharing to other users

## Build Commands

### Backend (Spring Boot)
```bash
# Build the project
mvn clean install

# Run the application
mvn spring-boot:run

# Run tests
mvn test

# Package as JAR
mvn package
```

### Frontend (React + TypeScript)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server (http://localhost:3000)
npm start

# Build for production
npm run build
```

### Running Full Stack
```bash
# Terminal 1 - Backend
mvn spring-boot:run

# Terminal 2 - Frontend
cd frontend && npm start
```

## Database Configuration

The application uses PostgreSQL for both development and production.

**Setup PostgreSQL:**
```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create development database and user
createdb spektr_dev
createuser spektr_dev
psql -d spektr_dev -c "ALTER USER spektr_dev WITH PASSWORD 'spektr_dev';"
psql -d spektr_dev -c "GRANT ALL PRIVILEGES ON DATABASE spektr_dev TO spektr_dev;"

# For production, create separate database
createdb spektr
createuser spektr_user
```

**Development (default):**
```bash
# Database: spektr_dev
# User: spektr_dev / Password: spektr_dev
mvn spring-boot:run
```

**Production:**
```bash
# Configure credentials in .env (copy from .env.example)
# Then run with prod profile:
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

**Important**: Vendor configuration data is stored as JSONB in PostgreSQL, providing flexibility for different vendor-specific fields while maintaining relational integrity for users, versioning, and sharing.

## Authentication

The application uses session-based authentication with Spring Security:

- **Registration**: POST `/api/auth/register` - Create new user account
- **Login**: POST `/api/auth/login` - Authenticate and create session
- **Current User**: GET `/api/auth/me` - Get authenticated user info
- **Logout**: POST `/api/auth/logout` - End session

Frontend routes:
- `/login` - Login page
- `/register` - Registration page
- `/home` - Home page (requires authentication)

## Vendor Configuration API

All vendor endpoints require authentication.

### Endpoints

- **POST** `/api/vendors` - Create new vendor configuration
  - Body: `VendorConfigurationRequest` with `vendorName`, `vendorData` (Vendor object), optional `description` and `parentVersionId`
  - Returns: `VendorConfigurationResponse`

- **GET** `/api/vendors/my` - Get all configurations owned by current user
  - Returns: List of `VendorConfigurationResponse`

- **GET** `/api/vendors/shared` - Get all configurations shared with current user
  - Returns: List of `VendorConfigurationResponse`

- **GET** `/api/vendors/all` - Get all accessible configurations (owned + shared)
  - Returns: List of `VendorConfigurationResponse`

- **GET** `/api/vendors/{id}` - Get specific configuration by ID
  - Returns: `VendorConfigurationResponse`

- **GET** `/api/vendors/history/{vendorName}` - Get version history for a vendor
  - Returns: List of `VendorConfigurationResponse` ordered by version

- **POST** `/api/vendors/share` - Share configuration with other users
  - Body: `ShareConfigurationRequest` with `configurationId` and `usernames` set
  - Returns: `VendorConfigurationResponse`

- **DELETE** `/api/vendors/{id}` - Soft delete configuration (owner only)
  - Returns: Success message

### Vendor Data Structure

The `Vendor` class (stored as JSONB) contains:
- `name` - Vendor name
- `revisionsCount` - Number of revisions
- `revisions` - Map of `VendorIntegrationSnapshot` objects containing:
  - `operator` - Who created it
  - `timestamp` - When created
  - `model` - Device model
  - `firmwareVersion` - Firmware version
  - `radius` - RADIUS configuration (auth/accounting)
  - `captivePortal` - Captive portal settings (URLs, query params)
  - `walledGarden` - Walled garden configuration
  - `loginMethods` - Supported login methods

### Versioning

- Each configuration has a version number (auto-incremented)
- New versions can be created based on existing ones using `parentVersionId`
- Versions are immutable (soft delete only)
- Version history is tracked through parent-child relationships

## Repository Structure

```
spektr/
├── src/main/java/com/spektr/
│   ├── config/          # Spring configuration classes
│   ├── controller/      # REST API controllers
│   ├── model/           # JPA entities (Configuration, Vendor, User, etc.)
│   ├── repository/      # JPA repositories
│   ├── service/         # Business logic layer
│   ├── dto/             # Data Transfer Objects
│   ├── exception/       # Custom exceptions
│   ├── security/        # Security configuration
│   └── util/            # Utility classes (PDF generation, etc.)
├── src/main/resources/
│   ├── application.properties  # Spring Boot configuration
│   ├── static/          # Static resources
│   └── templates/       # Templates (if needed)
├── src/test/java/       # Test classes
├── frontend/
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── services/    # API service layer
│   │   ├── types/       # TypeScript type definitions
│   │   └── utils/       # Utility functions
│   └── public/          # Static assets
└── pom.xml              # Maven configuration
```

## Key Technologies

- **Backend**: Spring Boot 3.2.0, Java 17
- **Database**: PostgreSQL with JSONB support
- **JSONB Mapping**: Hypersistence Utils for Hibernate JSONB types
- **Security**: Spring Security with session-based authentication
- **PDF Generation**: iText7
- **Frontend**: React 18 with TypeScript, React Router for navigation
- **Build Tool**: Maven
