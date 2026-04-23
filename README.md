# Express API

This repository currently contains the backend API for a shop application. The codebase is focused on authentication, session management, email verification, password recovery, and multi-factor authentication rather than product or checkout features.

It is built with:

- Node.js
- Express 5
- TypeScript
- MongoDB with Mongoose
- JWT authentication stored in HTTP-only cookies
- Resend for transactional email
- Speakeasy + QRCode for TOTP-based MFA

## What This Project Does

The API provides:

- User registration
- User login and logout
- Access token refresh
- Email verification
- Forgot password and password reset
- Session listing and session revocation
- MFA setup, MFA verification, and MFA login verification

Base API path: `/api/v1`

## Tech Stack

- Runtime: Node.js + Express
- Language: TypeScript
- Database: MongoDB Atlas or local MongoDB
- ODM: Mongoose
- Validation: Zod
- Authentication: JWT + Passport JWT
- Email: Resend

## Project Structure

```text
src/
  common/
    enums/         # shared enums
    interface/     # shared TypeScript interfaces
    strategies/    # Passport JWT strategy
    utils/         # JWT, cookies, bcrypt, dates, errors, helpers
    validators/    # Zod request validation
  config/          # env parsing and HTTP constants
  database/
    models/        # Mongoose models: User, Session, VerificationCode
    database.ts    # MongoDB connection
  mailers/
    templates/     # email templates
    mailer.ts      # email sending
  middleware/      # async handling, Passport, error handler
  modules/
    auth/          # register/login/refresh/logout/password/email verification
    mfa/           # MFA setup and verification
    session/       # active session APIs
    user/          # user lookup support
  index.ts         # Express app bootstrap
```

## Architecture Overview

This project follows a modular Express structure:

- `routes` define public API endpoints.
- `controllers` parse input and shape HTTP responses.
- `services` contain business logic.
- `models` persist data in MongoDB.
- `middleware` handles auth, async errors, and global error formatting.
- `common` stores reusable helpers, validators, JWT logic, and cookie utilities.

### Core Data Models

`User`
- Stores identity, hashed password, email verification state, and user preferences.
- `userPreferences` includes MFA state and secret.

`Session`
- Stores one login session per device/browser.
- Tracks `userId`, `userAgent`, `createdAt`, and `expiredAt`.
- Refresh tokens are tied to sessions.

`VerificationCode`
- Stores one-time codes for email verification and password reset.
- Includes `type`, `code`, `userId`, and expiration timestamp.

### Authentication Flow

1. User logs in with email and password.
2. If MFA is disabled, the API creates a `Session`.
3. The API signs:
   - an access token containing `userId` and `sessionId`
   - a refresh token containing `sessionId`
4. Tokens are stored in HTTP-only cookies.
5. Protected routes use Passport JWT to read the access token from cookies.
6. Refresh issues a new access token and may rotate the refresh token when the session is close to expiring.

### MFA Flow

1. Authenticated user calls MFA setup.
2. Server generates or reuses a TOTP secret and returns a QR code.
3. User verifies the setup with a TOTP code.
4. Future logins return `mfaRequired: true` until `/mfa/verify-login` is completed.

### Email Flow

- Registration creates an email verification code and sends a verification link.
- Forgot password creates a password reset code and sends a reset link.
- In development, outbound mail is redirected to `MAILER_TEST_RECEIVER`.

## API Modules

### Auth

Prefix: `/api/v1/auth`

- `POST /register`
- `POST /login`
- `POST /refresh`
- `POST /logout`
- `POST /password/forgot`
- `POST /password/reset`
- `POST /verify/email`

### MFA

Prefix: `/api/v1/mfa`

- `GET /setup`
- `POST /verify`
- `PUT /revoke`
- `POST /verify-login`

### Session

Prefix: `/api/v1/session`

- `GET /all`
- `GET /`
- `DELETE /:id`

## Environment Variables

Create a `.env` file from `.env.example`.

```env
PORT=8000
NODE_ENV=development
BASE_PATH=/api/v1

DATABASE_URL=mongodb://localhost:27017/mern-full-stack-shop
CORS_ORIGIN=http://localhost:3000

JWT_ACCESS_SECRET=replace_with_a_long_random_secret
JWT_ACCESS_TTL=15
JWT_REFRESH_SECRET=replace_with_a_different_long_random_secret
JWT_REFRESH_TTL=30
COOKIE_SECURE=false

RESEND_API_KEY=your_resend_api_key
MAILER_SENDER=your-verified-sender@example.com
MAILER_TEST_RECEIVER=your-test-inbox@example.com
```

Notes:

- `JWT_ACCESS_TTL` is treated as minutes.
- `JWT_REFRESH_TTL` is treated as days.
- `MAILER_SENDER` must be a valid email address in production.
- `MAILER_TEST_RECEIVER` is required in development because emails are redirected there.

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Then update the values in `.env`.

### 3. Start MongoDB

Use either:

- a local MongoDB instance
- MongoDB Atlas

Set `DATABASE_URL` accordingly.

### 4. Run the development server

```bash
npm run dev
```

The API will start on `http://localhost:8000` by default.

### 5. Build for production

```bash
npm run build
npm start
```

## Example Requests

Register:

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

Login:

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "password123"
  }'
```

## Current Limitations

- This repository is backend-only in its current state.
- There are no automated tests configured yet.
- Product, cart, order, and payment modules are not implemented in this folder.
- Some code still contains placeholder naming and cleanup opportunities, but the current structure is usable for auth-focused backend work.
