# Jarvis Mobile - Architecture Documentation

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile Clients                        │
│  ┌──────────────┐              ┌──────────────┐        │
│  │  iOS App     │              │ Android App  │        │
│  │  (React      │              │ (React       │        │
│  │   Native)    │              │  Native)     │        │
│  └──────┬───────┘              └──────┬───────┘        │
│         │                              │                │
│         └──────────────┬───────────────┘                │
└────────────────────────┼────────────────────────────────┘
                         │
                         │ HTTPS/REST
                         │ JWT Bearer Token
                         │
┌────────────────────────▼────────────────────────────────┐
│              Backend API (claude-dash)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Next.js API Routes (77+)              │  │
│  │  • /api/auth/* - Authentication                  │  │
│  │  • /api/ai/* - AI Chat & NLP                     │  │
│  │  • /api/tasks/* - Task Management                │  │
│  │  • /api/habits/* - Habit Tracking                │  │
│  │  • /api/calendar/* - Calendar Sync               │  │
│  │  • /api/finance/* - Financial Data               │  │
│  └──────────────────────────────────────────────────┘  │
│                         │                                │
│  ┌──────────────────────▼──────────────────────────┐   │
│  │           Business Logic Layer                   │   │
│  │  • AI Integration (Claude/GPT)                   │   │
│  │  • Google Calendar API                           │   │
│  │  • Email Processing                              │   │
│  │  • Automation Rules                              │   │
│  └──────────────────────┬──────────────────────────┘   │
└─────────────────────────┼──────────────────────────────┘
                          │
                          │ Prisma ORM
                          │
┌─────────────────────────▼──────────────────────────────┐
│              PostgreSQL Database                        │
│  • 22 Data Models                                       │
│  • Users, Tasks, Projects, Habits                       │
│  • Calendar Events, Finances                            │
│  • AI Chat History                                      │
└─────────────────────────────────────────────────────────┘
```

## Mobile App Architecture

### Component Hierarchy

```
App.tsx
├── SafeAreaProvider
├── QueryClientProvider (React Query)
└── PaperProvider (UI Theme)
    └── RootNavigator
        ├── AuthStack (if not authenticated)
        │   ├── LoginScreen
        │   └── RegisterScreen
        └── MainTabs (if authenticated)
            ├── DashboardScreen
            ├── AIChatScreen
            ├── TasksScreen
            ├── HabitsScreen
            ├── CalendarScreen
            ├── FinanceScreen
            └── SettingsScreen
```

### State Management

We use multiple state management strategies:

1. **Global State (Zustand)**
   - Authentication state (`authStore.ts`)
   - User preferences
   - App configuration

2. **Server State (React Query)**
   - API data fetching
   - Caching and synchronization
   - Optimistic updates

3. **Local State (useState)**
   - Component-specific state
   - Form inputs
   - UI state (modals, loading)

4. **Persistent Storage**
   - **SecureStore:** Sensitive data (JWT tokens)
   - **AsyncStorage:** User data, cache, preferences

### Data Flow

```
User Action
    ↓
Component
    ↓
Service Function (API call)
    ↓
Axios Client (with interceptors)
    ↓
Backend API
    ↓
Response
    ↓
Update Store/Query Cache
    ↓
Re-render Component
```

## Authentication Flow

### Login Flow

```
1. User enters email/password
2. LoginScreen validates form
3. authStore.login() called
4. authApi.login() sends POST /api/auth/login
5. Backend validates credentials
6. Backend returns { user, tokens: { accessToken, refreshToken } }
7. Save tokens to SecureStore
8. Save user to AsyncStorage
9. Update authStore (user, isAuthenticated: true)
10. RootNavigator detects auth change
11. Navigate to MainNavigator
```

### Session Restoration

```
App Launch
    ↓
authStore.restoreSession()
    ↓
Load tokens from SecureStore
Load user from AsyncStorage
    ↓
If tokens exist:
    ↓
Verify token with GET /api/auth/sessions
    ↓
If valid: Set authenticated state
If invalid: Clear data, show login
```

### Token Refresh

```
API Request
    ↓
Axios Request Interceptor adds Authorization header
    ↓
Backend processes request
    ↓
If 401 Unauthorized:
    ↓
Axios Response Interceptor catches error
    ↓
Call refreshToken() with refresh token
    ↓
Backend returns new access token
    ↓
Save new token
    ↓
Retry original request with new token
```

## API Client Architecture

### Axios Client Configuration

```typescript
// Base configuration
baseURL: 'http://localhost:800'
timeout: 30000
headers: { 'Content-Type': 'application/json' }

// Request Interceptor
- Add Authorization: Bearer <token>

// Response Interceptor
- Handle 401 errors (token refresh)
- Transform errors to ApiError format
- Log errors to Sentry (future)
```

### API Service Pattern

Each feature has its own API service:

- `auth.api.ts` - Authentication
- `ai.api.ts` - AI chat
- `tasks.api.ts` - Tasks (TODO)
- `habits.api.ts` - Habits (TODO)
- `calendar.api.ts` - Calendar (TODO)
- `finance.api.ts` - Finance (TODO)

Example structure:

```typescript
export const featureApi = {
  getItems: async (): Promise<Item[]> => {
    return await apiService.get('/api/items');
  },

  createItem: async (data: CreateItemRequest): Promise<Item> => {
    return await apiService.post('/api/items', data);
  },

  updateItem: async (id: string, data: UpdateItemRequest): Promise<Item> => {
    return await apiService.put(`/api/items/${id}`, data);
  },

  deleteItem: async (id: string): Promise<void> => {
    return await apiService.delete(`/api/items/${id}`);
  },
};
```

## Navigation Architecture

### Navigation Structure

```
RootNavigator (Stack)
├── If isAuthenticated:
│   └── MainNavigator (Bottom Tabs)
│       ├── Dashboard
│       ├── AIChat
│       ├── Tasks
│       ├── Habits
│       ├── Calendar
│       ├── Finance
│       └── Settings
└── If NOT isAuthenticated:
    ├── Login
    └── Register
```

### Navigation State Management

- Navigation state is managed by React Navigation
- Auth state triggers navigation changes automatically
- No manual navigation after login/logout
- Deep linking support (future)

## Storage Architecture

### Storage Hierarchy

```
SecureStore (Encrypted)
├── auth_token (JWT access token)
└── refresh_token (JWT refresh token)

AsyncStorage (Plain)
├── user_data (User object)
├── cache_tasks (Cached task data)
├── cache_habits (Cached habit data)
├── cache_finance (Cached finance data)
└── app_preferences (User preferences)
```

### Cache Strategy

```typescript
setCacheData(key, data, expirationMinutes)
    ↓
Store: {
  data: <actual data>,
  timestamp: <current time>,
  expiration: <time + minutes>
}
    ↓
getCacheData(key)
    ↓
Check if expired → If yes: delete, return null
                 → If no: return data
```

## Offline Mode Architecture (Future)

### Sync Queue

```
User performs action while offline
    ↓
Action stored in local queue
    ↓
Display optimistic update
    ↓
When online:
    ↓
Process queue in order
    ↓
For each action:
  - Send to backend
  - If success: remove from queue
  - If conflict: prompt user
  - If error: retry or keep in queue
```

### Data Syncing

```
App comes online
    ↓
Fetch server changes since last sync
    ↓
Compare with local changes
    ↓
Merge strategies:
  - Server wins (for read-only data)
  - Client wins (for user edits)
  - Prompt user (for conflicts)
    ↓
Update local cache
    ↓
Upload pending changes
```

## Security Architecture

### Token Security

- Access tokens stored in SecureStore (hardware-backed encryption)
- Refresh tokens stored in SecureStore
- Tokens never logged or exposed
- Auto-logout on token expiration

### API Security

- All API calls use HTTPS in production
- JWT tokens in Authorization header
- No sensitive data in URL parameters
- Request/response validation

### Local Storage Security

- Sensitive data → SecureStore (encrypted)
- Non-sensitive data → AsyncStorage (plain)
- Clear all data on logout
- No personal data in crash reports

## Performance Optimization

### React Query Caching

```typescript
{
  staleTime: 5 * 60 * 1000,  // Data fresh for 5 minutes
  gcTime: 30 * 60 * 1000,    // Cache kept for 30 minutes
  retry: 2,                   // Retry failed requests twice
}
```

### Image Optimization

- Use Expo's optimized image component
- Lazy load images
- Cache images locally

### List Optimization

- Use FlatList with `keyExtractor`
- Implement `getItemLayout` for long lists
- Use `removeClippedSubviews` on Android

## Error Handling

### Error Hierarchy

```
ApiError
├── NetworkError (no connection)
├── AuthError (401, 403)
├── ValidationError (400)
├── ServerError (500+)
└── UnknownError (catch-all)
```

### Error Handling Flow

```
Error occurs
    ↓
Catch in try/catch
    ↓
Transform to ApiError
    ↓
Log to console (dev)
Log to Sentry (prod)
    ↓
Show user-friendly message
    ↓
Provide retry action if applicable
```

## Future Enhancements

### Phase 4: Native Features

- Voice input with expo-speech
- Camera integration for AI vision
- Push notifications with expo-notifications
- Biometric auth with expo-local-authentication
- Background location tracking (future)

### Phase 5: Advanced Features

- Offline sync queue
- Conflict resolution
- Background task processing
- Widget support (iOS/Android)
- App shortcuts
- Share extension

### Phase 6: Analytics & Monitoring

- Sentry for error tracking
- Analytics for user behavior
- Performance monitoring
- Crash reporting

## Development Guidelines

### Code Organization

- One component per file
- Colocate related files
- Use TypeScript strictly
- Follow React Native best practices

### Naming Conventions

- Components: PascalCase (e.g., `LoginScreen.tsx`)
- Services: camelCase with .api suffix (e.g., `auth.api.ts`)
- Types: PascalCase (e.g., `User`, `Task`)
- Constants: UPPER_CASE (e.g., `API_BASE_URL`)

### Testing Strategy (Future)

- Unit tests with Jest
- Component tests with React Native Testing Library
- E2E tests with Detox
- API mocking with MSW

---

**Last Updated:** December 7, 2025
**Status:** Phase 1-3 Complete, Phase 4 In Progress
