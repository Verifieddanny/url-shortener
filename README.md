# URL Shortener API

A RESTful URL shortener service built with TypeScript, Express, and MongoDB. Features JWT authentication, click tracking, custom slugs, link expiration, and per-user analytics.

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express 5
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (jsonwebtoken) + bcrypt
- **Validation:** express-validator
- **Short Code Generation:** nanoid

## Features

- **User Authentication** — Signup and login with bcrypt password hashing and JWT tokens
- **URL Shortening** — Generate random 8-character short codes or choose custom slugs
- **Click Tracking** — Atomic click counter on every redirect using MongoDB `$inc`
- **Link Expiration** — Optional TTL with ISO 8601 dates; expired links return `410 Gone`
- **Duplicate Detection** — Returns existing short link if the URL was already shortened
- **Per-User Analytics** — View click stats, creation date, and original URL for your links
- **Authorization** — Users can only view stats for links they created (`403 Forbidden` otherwise)
- **Rate Limiting** - Users can't send above 100 requests in 15min else they get a `429 too many request`
- **Auth Rate Limiting** - Users cant send above 20 requests (to sign up or login) in 15 mins for a tighter security laye else they get a `429 too many request`

## Project Structure

```
src/
├── controllers/
│   ├── auth.ts            # Signup, login, and stats controllers
│   └── urlShortner.ts     # URL shortening, redirect, and fetch all
│   └── demo.ts            # demo URL shortening, and redirect
├── middleware/
│   └── is-auth.ts         # JWT verification middleware
├── models/
│   ├── user.ts            # User schema (name, username, email, password)
│   └── url-shortner.ts    # URL schema (longUrl, shortCode, click, creator, expiresAt)
│   └── demo.ts            # demo URL schema (longUrl, shortCode, expiresAt)
├── routes/
│   ├── auth.ts            # Auth routes with input validation
│   ├── url-shortner.ts    # Protected URL and analytics routes
│   └── root-access.ts     # Public redirect route
│   └── demo.ts            # Public demo redirect route (with temporary url shortening)
├── shared/
│   └── types.ts           # Shared TypeScript interfaces and types
└── index.ts               # App entry point, middleware setup, DB connection
tests/                     # Contains all test file ranging from middleware to controllers
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB Atlas account or local MongoDB instance

### Installation

```bash
git clone https://github.com/Verifieddanny/url-shortener.git
cd url-shortener
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```
MONGODB_URL=your_mongodb_connection_string
SECRETE_KEY=your_jwt_secret_key
BASE_URL=your_deployed_api_url  # on dev, it defaults to http://localhost:8080 is not include
```

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Running the Server

```bash
# Development (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The server runs on `http://localhost:8080` by default.

## API Reference

### Authentication

#### Sign Up

```
POST /auth/sign-up
```

| Field       | Type   | Required | Rules                                      |
|-------------|--------|----------|--------------------------------------------|
| firstName   | string | Yes      | Min 3 characters                           |
| lastName    | string | Yes      | Min 3 characters                           |
| email       | string | Yes      | Valid email, must be unique                 |
| username    | string | Yes      | Min 3 characters, unique, cannot be "settings" or "home" |
| password    | string | Yes      | Min 8 characters                           |

**Response** `201 Created`

```json
{
  "message": "user created",
  "user": "user_id"
}
```

#### Login

```
POST /auth/login
```

| Field    | Type   | Required |
|----------|--------|----------|
| username | string | Yes      |
| password | string | Yes      |

**Response** `200 OK`

```json
{
  "auth_token": "eyJhbGciOiJIUzI1NiIs...",
  "userId": "user_id"
}
```

### URL Shortening

All URL endpoints require the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

#### Shorten a URL

```
POST /shorten/shortner
```

| Field      | Type   | Required | Description                          |
|------------|--------|----------|--------------------------------------|
| url        | string | Yes      | Valid URL to shorten                 |
| customCode | string | No       | Custom slug (min 3 chars, must be unique) |
| expiresAt  | string | No       | Expiration date in ISO 8601 format   |

**Response** `201 Created`

```json
{
  "message": "Shortend Url generated",
  "newUrl": "http://localhost:8080/danny-linkedin",
  "creatorData": {
    "_id": "user_id",
    "username": "devtester"
  },
  "expiresAt": "2026-03-12T00:00:00.000Z"
}
```

If the URL already exists and hasn't expired:

**Response** `200 OK`

```json
{
  "message": "shortened url exits",
  "url": "http://localhost:8080/existing-code"
}
```

#### Redirect to Original URL

```
GET /:shortCode
```

This is a **public endpoint** (no auth required).

- **Success:** `302` redirect to the original URL. Click counter increments atomically.
- **Expired link:** `410 Gone`
- **Not found:** `404 Not Found`

#### Get Link Stats

```
GET /shorten/:shortCode
```

Returns analytics for a specific link. Only the creator can access this.

**Response** `200 OK`

```json
{
  "message": "Status Fetched",
  "data": {
    "creator": {
      "userName": "devtester",
      "userId": "user_id"
    },
    "click": 5,
    "createAt": "2026-03-04T14:16:11.245Z",
    "originalUrl": "https://github.com/Verifieddanny",
    "shortenedUrl": "http://localhost:8080/dAP4V5fR"
  }
}
```

**Response** `403 Forbidden` — if you are not the creator of the link.

#### Get All User Links

```
GET /shorten/urls/all
```

Returns all shortened URLs created by the authenticated user.

**Response** `200 OK`

```json
{
  "message": "URLs fetched",
  "total": 2,
  "urls": [
    {
      "_id": "...",
      "longUrl": "https://github.com/Verifieddanny",
      "shortCode": "dAP4V5fR",
      "click": 5,
      "creator": "user_id",
      "createdAt": "2026-03-04T14:16:11.245Z",
      "updatedAt": "2026-03-04T15:20:00.000Z"
    }
  ]
}
```

### Demo Usage

All Demo URL endpoints are public (no auth required):
**(Note)** - the url generated are temporary for 2 days (after which they are gone)
**(Note)** - the demo endpoints are ratelimited to 60 request in an hour

### Demo URL Shortening

```
POST demo/shorten
```

| Field      | Type   | Required | Description                          |
|------------|--------|----------|--------------------------------------|
| url        | string | Yes      | Valid URL to shorten                 |

**Response** `201 Created`

```json
{
  "message": "demo url created",
  "newUrl": "http://localhost:8080/demo/EvBaP",
  "expiresAt": "2026-03-12T00:00:00.000Z"
}
```

If the URL already exists and hasn't expired(in 2 days):

**Response** `200 OK`

```json
{
  "message": "url exits",
  "url": "http://localhost:8080/demo/existing-code"
}
```

#### Demo Redirect to Original URL

```
GET /demo/:shortCode
```

- **Success:** `302` redirect to the original URL. Click counter increments atomically.
- **Expired link:** `410 Gone`
- **Not found:** `404 Not Found`

## Status Codes

| Code | Meaning                                        |
|------|------------------------------------------------|
| 200  | Success                                        |
| 201  | Resource created                               |
| 302  | Redirect to original URL                       |
| 400  | Bad request                                    |
| 401  | Not authenticated (missing or invalid token)   |
| 403  | Forbidden (not authorized to access resource)  |
| 404  | Resource not found                             |
| 410  | Gone (link has expired)                        |
| 422  | Validation error                               |
| 500  | Server error                                   |

## Design Decisions

- **302 over 301 for redirects** — Prevents browser caching during development. Switch to 301 in production for faster repeat visits.
- **nanoid over UUID** — Generates cleaner 8-character codes instead of 36-character UUIDs.
- **bcrypt (12 salt rounds)** — Industry standard for password hashing with strong security.
- **JWT with 1-hour expiry** — Balances security and usability for API tokens.
- **Atomic `$inc` for click tracking** — Prevents race conditions on concurrent redirects.
- **Optional fields for customCode and expiresAt** — Core functionality works without them; power users can customize.

## Testing

Run the test suite:

```bash
npm test
```

Run a specific test suite:

```bash
npm test -- --grep "Auth Middleware"
```

23 tests covering auth middleware, signup, login, stats authorization, URL shortening, redirect, expiration, demo mode, and edge cases. Uses Mocha, Chai, and Sinon with a dedicated test database.

## License

MIT
