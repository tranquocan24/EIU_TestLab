# Online Exam System - Backend

## Description

NestJS backend for the Online Exam System with PostgreSQL and Prisma ORM.

## Tech Stack

- NestJS 10
- Prisma 5
- PostgreSQL
- JWT Authentication
- Socket.IO for real-time features
- Redis for caching

## Installation

```bash
npm install
```

## Database Setup

1. Ensure PostgreSQL is running (port 15432 from docker)
2. Update `.env` with your database credentials
3. Run Prisma migrations:

```bash
npx prisma migrate dev --name init
```

4. (Optional) Seed the database:

```bash
npx prisma db seed
```

## Running the app

```bash
# development
npm run start:dev

# production mode
npm run build
npm run start:prod
```

## API Endpoints

### Auth
- POST `/auth/register` - Register new user
- POST `/auth/login` - Login user

### Users
- GET `/users` - Get all users (protected)

### Exams
- GET `/exams` - Get all exams
- GET `/exams/:id` - Get exam by ID
- POST `/exams` - Create exam (Teacher/Admin only)
- PUT `/exams/:id` - Update exam (Teacher/Admin only)
- DELETE `/exams/:id` - Delete exam (Teacher/Admin only)

### Questions
- POST `/questions` - Create question (Teacher/Admin only)
- GET `/questions/exam/:examId` - Get questions by exam
- PUT `/questions/:id` - Update question (Teacher/Admin only)
- DELETE `/questions/:id` - Delete question (Teacher/Admin only)

### Attempts
- POST `/attempts/start` - Start exam attempt
- PUT `/attempts/:id/answer` - Submit answer
- PUT `/attempts/:id/submit` - Submit exam
- GET `/attempts/my-attempts` - Get user's attempts
- GET `/attempts/:id` - Get attempt details
- GET `/attempts/exam/:examId` - Get exam attempts

## Prisma Studio

```bash
npm run prisma:studio
```

## Environment Variables

```
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
REDIS_HOST="localhost"
REDIS_PORT=6379
FRONTEND_URL="http://localhost:3000"
PORT=4000
```
