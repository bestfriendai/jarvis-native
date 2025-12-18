# Backend Integration Guide

This guide explains how to add mobile JWT authentication to the claude-dash backend.

## Current State

The claude-dash backend currently uses:
- **NextAuth** for web authentication (session-based with cookies)
- **PostgreSQL** database with Prisma ORM
- **API routes** under `/src/app/api/`

## Problem

NextAuth's session-based authentication doesn't work well for mobile apps because:
1. Mobile apps can't reliably use cookies
2. Cross-origin issues with different domains
3. Need stateless authentication for mobile

## Solution: Add JWT Authentication for Mobile

We'll add dedicated mobile authentication endpoints while keeping NextAuth for web.

## Implementation Steps

### Step 1: Install JWT Dependencies

```bash
cd /mnt/d/claude\ dash/claude-dash
npm install jsonwebtoken bcryptjs
npm install -D @types/jsonwebtoken @types/bcryptjs
```

### Step 2: Create JWT Utility

Create `/src/lib/jwt.ts`:

```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';

export interface JwtPayload {
  userId: string;
  email: string;
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m', // 15 minutes
  });
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: '7d', // 7 days
  });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}
```

### Step 3: Create Mobile Auth Endpoints

Create `/src/app/api/auth/mobile/login/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    // NOTE: You'll need to add password hashing to your User model
    // For now, this assumes you have a password field
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Return user and tokens
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          timezone: user.timezone,
          currency: user.currency,
          createdAt: user.createdAt.toISOString(),
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 900, // 15 minutes in seconds
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

Create `/src/app/api/auth/mobile/register/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, timezone, currency } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        timezone: timezone || 'America/Chicago',
        currency: currency || 'USD',
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Return user and tokens
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          timezone: user.timezone,
          currency: user.currency,
          createdAt: user.createdAt.toISOString(),
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 900,
        },
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

Create `/src/app/api/auth/mobile/refresh/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateAccessToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token required' },
        { status: 400 }
      );
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      return NextResponse.json(
        { success: false, message: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
    });

    return NextResponse.json({
      success: true,
      data: {
        accessToken,
        expiresIn: 900,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Step 4: Create Auth Middleware

Create `/src/lib/authMiddleware.ts`:

```typescript
import { NextRequest } from 'next/server';
import { verifyAccessToken, JwtPayload } from './jwt';

export function getAuthUser(request: NextRequest): JwtPayload | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  return verifyAccessToken(token);
}

export function requireAuth(request: NextRequest): JwtPayload {
  const user = getAuthUser(request);

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}
```

### Step 5: Protect Existing API Routes

Update existing API routes to accept JWT authentication:

Example for `/src/app/api/tasks/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch tasks for user
    const tasks = await prisma.task.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Step 6: Update Database Schema

Add password field to User model in `prisma/schema.prisma`:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String?  // Add this field (nullable for existing users)
  name      String?
  createdAt DateTime @default(now())
  timezone  String   @default("America/Chicago")
  currency  String   @default("USD")

  // ... existing fields
}
```

Run migration:

```bash
npx prisma migrate dev --name add_user_password
npx prisma generate
```

### Step 7: Update Environment Variables

Add to `.env`:

```env
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters
```

Generate secure secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 8: Update Mobile App Config

Update `/mnt/d/claude dash/jarvis-native/src/constants/config.ts`:

```typescript
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/mobile/login',      // Updated
    REGISTER: '/api/auth/mobile/register', // Updated
    REFRESH: '/api/auth/mobile/refresh',   // Updated
    LOGOUT: '/api/auth/logout',
    SESSION: '/api/auth/sessions',
  },
  // ... rest of endpoints
};
```

## Testing the Integration

### 1. Start Backend

```bash
cd /mnt/d/claude\ dash/claude-dash
npm run dev
```

Backend should run on `http://localhost:800`

### 2. Test Registration Endpoint

```bash
curl -X POST http://localhost:800/api/auth/mobile/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

Expected response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "name": "Test User",
      "timezone": "America/Chicago",
      "currency": "USD",
      "createdAt": "..."
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 900
    }
  }
}
```

### 3. Test Login Endpoint

```bash
curl -X POST http://localhost:800/api/auth/mobile/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 4. Test Protected Endpoint

```bash
curl -X GET http://localhost:800/api/tasks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### 5. Test Mobile App

```bash
cd /mnt/d/claude\ dash/jarvis-native
npm start
```

Then:
1. Register a new account
2. Try logging in
3. Navigate to AI Chat
4. Send a message

## Troubleshooting

### Password field missing

If you get errors about password field not existing:
1. Run `npx prisma migrate dev`
2. Restart the backend

### CORS errors

Add CORS headers to API routes:

```typescript
export async function POST(request: NextRequest) {
  const response = NextResponse.json({ /* ... */ });

  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  return response;
}
```

### Token expiration

Access tokens expire after 15 minutes. The mobile app automatically refreshes them.

## Next Steps

1. Implement all backend endpoints (tasks, habits, calendar, finance)
2. Add proper error handling
3. Add rate limiting to prevent abuse
4. Add logging for security events
5. Consider using a session table for refresh tokens
6. Add email verification
7. Add password reset flow

## Security Considerations

1. **Secrets:** Never commit JWT secrets to git
2. **HTTPS:** Always use HTTPS in production
3. **Token Storage:** Mobile app stores tokens in SecureStore (encrypted)
4. **Password Hashing:** Uses bcrypt with salt rounds of 10
5. **Token Expiration:** Short-lived access tokens, longer refresh tokens
6. **Rate Limiting:** Add in production to prevent brute force

---

**Status:** Ready for implementation
**Estimated Time:** 2-3 hours
