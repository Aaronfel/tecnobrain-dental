# Tecnobrain Dental Backend

A comprehensive dental clinic management system backend built with NestJS, Prisma, and PostgreSQL.

## Features

- **User Management**: Support for Admin, Clinic, and Patient user types
- **Authentication**: JWT-based authentication with role-based access control
- **Visit Management**: Complete appointment scheduling system with calendar integration
- **Clinic-Patient Relationships**: One-to-many relationship between clinics and patients
- **Time Conflict Prevention**: Automatic detection of scheduling conflicts
- **API Endpoints**: RESTful API for all operations

## User Types

- **ADMIN**: Full system access, can manage all users and visits
- **CLINIC**: Can manage their patients and schedule visits
- **PATIENT**: Can view their own visits and schedule appointments

## Database Schema

### User Model
- Basic user information (name, email, password)
- User type (ADMIN, CLINIC, PATIENT)
- Clinic assignment for patients
- Self-referential relationship for clinic-patient management

### Visit Model
- Appointment details (title, start/end time, type, status, notes)
- Relationships to patient and clinic
- Support for various visit types (Limpieza, Revisión, Empaste, etc.)

## API Endpoints

### Authentication
- `POST /users` - Register new user
- `POST /users/login` - User login

### Users
- `GET /users` - Get all users (Admin only)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `GET /users/clinic/:clinicId/patients` - Get clinic's patients

### Visits
- `POST /visits` - Create visit (Clinic/Admin only)
- `GET /visits` - Get all visits (Admin only)
- `GET /visits/occupied` - Get occupied time slots
- `GET /visits/clinic/:clinicId` - Get clinic's visits
- `GET /visits/patient/:patientId` - Get patient's visits
- `GET /visits/:id` - Get visit by ID
- `PUT /visits/:id` - Update visit
- `PUT /visits/:id/status` - Update visit status
- `DELETE /visits/:id` - Delete visit

## Setup Instructions

### Prerequisites
- Node.js >= 18.18
- PostgreSQL
- Docker (optional)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. Start the database (using Docker):
   ```bash
   npm run dev:start
   ```

5. Generate Prisma client and run migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

6. Seed the database:
   ```bash
   npm run db:seed
   ```

7. Start the development server:
   ```bash
   npm run start:dev
   ```

## Default Credentials

After seeding, you can use these credentials:

- **Admin**: admin@tecnobrain-dental.com / 123456
- **Clinic**: clinic@tecnobrain-dental.com / 123456
- **Patient 1**: patient1@example.com / 123456
- **Patient 2**: patient2@example.com / 123456
- **Patient 3**: patient3@example.com / 123456

## Development

### Available Scripts
- `npm run start:dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run db:studio` - Open Prisma Studio
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

### Docker Commands
- `npm run dev` - Start development environment with Docker
- `npm run dev:stop` - Stop development environment
- `npm run dev:logs` - View development logs

## Architecture

The application follows a modular architecture:

- **Users Module**: Handles user management and authentication
- **Visits Module**: Manages appointment scheduling and calendar integration
- **Prisma Module**: Database ORM and connection management
- **Guards**: JWT authentication and role-based authorization
- **DTOs**: Data transfer objects for request/response validation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the UNLICENSED license.
