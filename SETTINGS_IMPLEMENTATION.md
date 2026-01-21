# Settings Persistence Implementation

## Overview
Implemented full settings persistence for RowLab, replacing the fake timeout-based save with real backend API integration.

## Changes Made

### 1. Database Schema (prisma/schema.prisma)
Added `UserSettings` model:
```prisma
model UserSettings {
  id                 String   @id @default(uuid())
  userId             String   @unique
  emailNotifications Boolean  @default(true)
  pushNotifications  Boolean  @default(false)
  darkMode           Boolean  @default(true)
  compactView        Boolean  @default(false)
  autoSave           Boolean  @default(true)
  firstName          String?
  lastName           String?
  role               String?
  avatar             String?  @db.Text
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_settings")
}
```

Added relation to User model:
```prisma
model User {
  // ... existing fields
  settings UserSettings?
}
```

### 2. Backend Service (server/services/settingsService.js)
Created settings service with three functions:
- `getSettings(userId)` - Fetch user settings, create defaults if none exist
- `updateSettings(userId, updates)` - Update user settings with partial updates
- `deleteSettings(userId)` - Delete settings (for account deletion)

### 3. Backend Routes (server/routes/settings.js)
Created REST API endpoints:
- `GET /api/v1/settings` - Get current user settings
- `PATCH /api/v1/settings` - Update settings (accepts partial updates)

Features:
- Authentication required via JWT token
- Field whitelisting for security
- Proper error handling and logging
- Returns standardized JSON responses

### 4. Server Registration (server/index.js)
- Added settings routes import
- Registered `/api/v1/settings` endpoint with rate limiting

### 5. Frontend Integration (src/pages/SettingsPage.jsx)
Updated SettingsPage component:
- Added `useAuthStore` for authentication
- Implemented `loadSettings()` to fetch settings on mount
- Replaced fake `handleSave()` with real API call
- Added loading state with spinner
- Added error message display
- Integrated with existing form state management

New features:
- Settings load automatically when page opens
- Real-time save with success/error feedback
- Proper loading states during API calls
- Error messages displayed to user

## API Usage

### Get Settings
```bash
GET /api/v1/settings
Authorization: Bearer <access_token>
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "userId": "...",
    "emailNotifications": true,
    "pushNotifications": false,
    "darkMode": true,
    "compactView": false,
    "autoSave": true,
    "firstName": "John",
    "lastName": "Doe",
    "role": "Head Coach",
    "avatar": null,
    "createdAt": "2024-01-20T...",
    "updatedAt": "2024-01-20T..."
  }
}
```

### Update Settings
```bash
PATCH /api/v1/settings
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "firstName": "Jane",
  "darkMode": false,
  "emailNotifications": false
}
```

Response:
```json
{
  "success": true,
  "data": { ... } // Updated settings object
}
```

## Testing

Run the test information script:
```bash
node test-settings-api.js
```

Or test manually:
1. Start the server: `npm run dev`
2. Login via web UI
3. Navigate to Settings page (/settings)
4. Make changes to any settings
5. Click "Save Changes"
6. Verify settings persist across page reloads

## Security Features

1. JWT authentication required for all endpoints
2. Field whitelisting prevents updating protected fields
3. User can only access their own settings
4. Rate limiting applied to prevent abuse
5. Proper error handling without exposing internals

## Database

Settings are stored in the `user_settings` table with:
- One-to-one relationship with users
- Automatic timestamps
- Cascade deletion when user is deleted
- Default values for all boolean preferences

## Files Modified
- `/home/swd/RowLab/prisma/schema.prisma` - Added UserSettings model
- `/home/swd/RowLab/server/services/settingsService.js` - NEW
- `/home/swd/RowLab/server/routes/settings.js` - NEW
- `/home/swd/RowLab/server/index.js` - Added settings route registration
- `/home/swd/RowLab/src/pages/SettingsPage.jsx` - Integrated API calls

## Next Steps (Optional Enhancements)

1. Add optimistic updates for better UX
2. Implement debounced auto-save
3. Add settings validation
4. Add team-level settings
5. Add settings import/export
6. Add settings reset to defaults
7. Add settings change history/audit log
