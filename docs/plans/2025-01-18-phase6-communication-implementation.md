# Phase 6: Communication Implementation Plan

## Overview
Implement team communication features including announcements, read tracking, and audience targeting.

**Note**: Announcement and AnnouncementRead models already exist in Prisma schema from Phase 1.

## Existing Schema (from prisma/schema.prisma)
```prisma
model Announcement {
  id        String   @id @default(uuid())
  teamId    String
  authorId  String
  title     String
  content   String
  priority  String   @default("normal") // normal, important, urgent
  visibleTo String   @default("all")    // all, athletes, coaches
  pinned    Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  team   Team               @relation(fields: [teamId], references: [id], onDelete: Cascade)
  author User               @relation(fields: [authorId], references: [id])
  reads  AnnouncementRead[]
}

model AnnouncementRead {
  announcementId String
  userId         String
  readAt         DateTime @default(now())

  announcement Announcement @relation(fields: [announcementId], references: [id], onDelete: Cascade)

  @@id([announcementId, userId])
}
```

---

## Tasks

### Task 1: Announcement Service
**File**: `server/services/announcementService.js`

Create service with:
- `createAnnouncement(teamId, authorId, data)` - Create new announcement
- `getAnnouncements(teamId, { userId, role, includeRead })` - Get filtered list
- `getAnnouncementById(teamId, announcementId)` - Get single with read status
- `updateAnnouncement(teamId, announcementId, data)` - Update (author/admin only)
- `deleteAnnouncement(teamId, announcementId)` - Delete (author/admin only)
- `markAsRead(announcementId, userId)` - Mark single as read
- `markAllAsRead(teamId, userId)` - Batch mark all as read
- `getUnreadCount(teamId, userId, role)` - Get unread count for badges
- `togglePin(teamId, announcementId)` - Pin/unpin announcement

Features:
- Filter by priority, visibleTo, pinned status
- Sort by pinned first, then createdAt desc
- Include read status for current user
- Role-based visibility filtering

**Verification**: `node --check server/services/announcementService.js`

---

### Task 2: Announcement Routes
**File**: `server/routes/announcements.js`

Endpoints:
- `GET /` - List announcements (filtered by role)
- `GET /unread-count` - Get unread count for badge
- `GET /:id` - Get single announcement
- `POST /` - Create announcement (COACH+ only)
- `PUT /:id` - Update announcement (author/admin only)
- `DELETE /:id` - Delete announcement (author/admin only)
- `POST /:id/read` - Mark as read
- `POST /read-all` - Mark all as read
- `POST /:id/toggle-pin` - Toggle pin status (COACH+ only)

Auth: All routes require authentication, write ops require COACH+

**Verification**: `node --check server/routes/announcements.js`

---

### Task 3: Mount Routes in Server
**File**: `server/index.js`

Add:
```javascript
import announcementRoutes from './routes/announcements.js';
// ...
app.use('/api/v1/announcements', apiLimiter, announcementRoutes);
```

**Verification**: Server starts without errors

---

### Task 4: Announcement Store
**File**: `src/store/announcementStore.js`

Zustand store with:
- State: announcements[], loading, error, unreadCount, selectedAnnouncement
- Actions: fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, markAsRead, markAllAsRead, togglePin, fetchUnreadCount
- Selectors: pinnedAnnouncements, urgentAnnouncements, filteredByPriority

**Verification**: Frontend build passes

---

### Task 5: AnnouncementCard Component
**File**: `src/components/Communication/AnnouncementCard.jsx`

Features:
- Display title, content preview (truncated), author, timestamp
- Priority badge (color-coded: normal=gray, important=yellow, urgent=red)
- Pinned indicator (pin icon)
- Unread indicator (dot or bold title)
- Click to expand/view full content
- Markdown rendering for content
- Actions dropdown (edit, delete, pin) for author/coaches

**Verification**: Frontend build passes

---

### Task 6: AnnouncementList Component
**File**: `src/components/Communication/AnnouncementList.jsx`

Features:
- List of AnnouncementCard components
- Filter tabs: All, Unread, Important, Urgent
- Empty state for no announcements
- Loading skeleton
- "Mark all as read" button
- Infinite scroll or pagination

**Verification**: Frontend build passes

---

### Task 7: AnnouncementForm Component
**File**: `src/components/Communication/AnnouncementForm.jsx`

Features:
- Title input (required)
- Content textarea with markdown preview toggle
- Priority select (normal, important, urgent)
- Audience select (all, athletes, coaches)
- Pin checkbox
- Create/Update button
- Cancel button
- Form validation

**Verification**: Frontend build passes

---

### Task 8: AnnouncementDetail Modal/Page
**File**: `src/components/Communication/AnnouncementDetail.jsx`

Features:
- Full content display with markdown rendering
- Author name and avatar
- Timestamp (created, updated if different)
- Priority and audience badges
- Edit/Delete buttons (if authorized)
- Mark as read on view (auto)
- Back/Close button

**Verification**: Frontend build passes

---

### Task 9: CommunicationPage
**File**: `src/pages/CommunicationPage.jsx`

Features:
- Header with "Communication" title and unread badge
- "New Announcement" button (COACH+ only)
- AnnouncementList as main content
- Modal for AnnouncementForm (create/edit)
- Modal for AnnouncementDetail (view)
- Responsive layout

**Verification**: Frontend build passes

---

### Task 10: Add Route to App.jsx
**File**: `src/App.jsx`

Add route:
```jsx
<Route path="communication" element={<CommunicationPage />} />
```

**Verification**: Frontend build passes

---

### Task 11: Navigation Integration
**File**: `src/components/Navigation/Sidebar.jsx` (or equivalent)

Add:
- Communication link with unread badge
- Icon (megaphone or bell)

**Verification**: Frontend build passes

---

### Task 12: Real-time Unread Badge (Optional)
If WebSocket/SSE exists, add real-time unread count updates.
Otherwise, poll on interval or refresh on focus.

---

## Verification Checklist

- [ ] All backend files pass `node --check`
- [ ] Frontend build passes
- [ ] Announcements CRUD works via API
- [ ] Read tracking persists correctly
- [ ] Role-based visibility works
- [ ] Pinned announcements appear first
- [ ] Unread count updates correctly
- [ ] Markdown renders properly

## Notes

- Markdown rendering: Use existing markdown library or add `react-markdown`
- Priority colors: Match existing design system
- Mobile-responsive design required
