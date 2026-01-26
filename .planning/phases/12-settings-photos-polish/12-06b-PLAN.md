---
phase: 12-settings-photos-polish
plan: 06b
type: execute
wave: 2
depends_on: ["12-01"]
files_modified:
  - prisma/schema.prisma
  - prisma/migrations/*
  - server/routes/athletes.js
  - server/services/athleteService.js
autonomous: true

must_haves:
  truths:
    - "Coach can upload athlete photo via API endpoint"
    - "Avatar data stored as base64 in database"
    - "Existing athlete PATCH endpoint supports avatar field"
  artifacts:
    - path: "server/routes/athletes.js"
      provides: "Photo upload endpoint or avatar field in PATCH"
      contains: "avatar"
    - path: "prisma/schema.prisma"
      provides: "Avatar field on Athlete model"
      contains: "avatar.*String"
  key_links:
    - from: "server/routes/athletes.js"
      to: "prisma.athlete"
      via: "updateAthlete service call"
      pattern: "updateAthlete.*avatar|avatar.*body"
---

<objective>
Add backend API support for athlete photo upload to persist cropped images from PhotoCropper.

Purpose: Deliver PHOTO-01 backend persistence - the frontend cropping components (plan 12-06) need an API endpoint to save the cropped image data.
Output: Extended PATCH /api/v1/athletes/:id endpoint that accepts avatar field, or dedicated POST /api/v1/athletes/:id/photo endpoint.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/12-settings-photos-polish/12-01-SUMMARY.md
@server/routes/athletes.js
@server/services/athleteService.js
@prisma/schema.prisma
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add avatar field to Athlete model</name>
  <files>
    prisma/schema.prisma
  </files>
  <action>
Add avatar field to the Athlete model in prisma/schema.prisma:

```prisma
model Athlete {
  id              String   @id @default(uuid())
  teamId          String
  userId          String?
  firstName       String
  lastName        String
  email           String?
  side            String?
  canScull        Boolean  @default(false)
  canCox          Boolean  @default(false)
  isManaged       Boolean  @default(true)
  concept2UserId  String?
  weightKg        Decimal? @db.Decimal(5, 2)
  heightCm        Int?
  country         String?
  avatar          String?  @db.Text  // Base64 encoded image data
  createdAt       DateTime @default(now())
  // ... rest of fields
}
```

Key decisions:
- Use `@db.Text` for large base64 strings (can be several hundred KB)
- Nullable since not all athletes will have photos
- Store as base64 data URL (e.g., "data:image/jpeg;base64,...")

Run migration:
```bash
npx prisma migrate dev --name add_athlete_avatar
```
  </action>
  <verify>`npx prisma db push` succeeds, `npx prisma studio` shows avatar field on Athlete</verify>
  <done>Athlete model has avatar field for storing base64 photo data</done>
</task>

<task type="auto">
  <name>Task 2: Extend athlete routes/service to support avatar</name>
  <files>
    server/routes/athletes.js
    server/services/athleteService.js
  </files>
  <action>
**Option A (PREFERRED): Extend existing PATCH endpoint**

In `server/routes/athletes.js`, add avatar validation to PATCH /api/v1/athletes/:id:

```javascript
router.patch(
  '/:id',
  requireRole('OWNER', 'COACH'),
  [
    param('id').isUUID(),
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
    body('email').optional({ nullable: true }).isEmail().normalizeEmail(),
    body('side').optional().isIn(['Port', 'Starboard', 'Both', 'Cox', null]),
    body('weightKg').optional({ nullable: true }).isFloat({ min: 30, max: 200 }),
    body('heightCm').optional({ nullable: true }).isInt({ min: 100, max: 250 }),
    // ADD avatar validation:
    body('avatar')
      .optional({ nullable: true })
      .isString()
      .custom((value) => {
        if (value === null) return true;
        // Validate base64 data URL format
        if (!value.startsWith('data:image/')) {
          throw new Error('Avatar must be a valid image data URL');
        }
        // Check size (max ~500KB base64 = ~375KB image)
        if (value.length > 500000) {
          throw new Error('Avatar image too large (max 500KB)');
        }
        return true;
      }),
  ],
  validateRequest,
  async (req, res) => { ... }
);
```

In `server/services/athleteService.js`, ensure updateAthlete passes avatar through:

```javascript
export async function updateAthlete(athleteId, teamId, updates) {
  const athlete = await prisma.athlete.findFirst({
    where: { id: athleteId, teamId },
  });

  if (!athlete) throw new Error('Athlete not found');

  // Whitelist allowed fields including avatar
  const allowedFields = [
    'firstName', 'lastName', 'email', 'side',
    'weightKg', 'heightCm', 'canScull', 'canCox',
    'avatar',  // ADD THIS
  ];

  const updateData = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateData[field] = updates[field];
    }
  }

  return prisma.athlete.update({
    where: { id: athleteId },
    data: updateData,
  });
}
```

**Option B (Alternative): Dedicated photo endpoint**

If you prefer a dedicated endpoint, add to athletes.js:

```javascript
/**
 * POST /api/v1/athletes/:id/photo
 * Upload athlete photo
 */
router.post(
  '/:id/photo',
  requireRole('OWNER', 'COACH'),
  [
    param('id').isUUID(),
    body('avatar')
      .isString()
      .custom((value) => {
        if (!value.startsWith('data:image/')) {
          throw new Error('Avatar must be a valid image data URL');
        }
        if (value.length > 500000) {
          throw new Error('Avatar image too large (max 500KB)');
        }
        return true;
      }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const athlete = await updateAthlete(req.params.id, req.user.activeTeamId, {
        avatar: req.body.avatar,
      });

      res.json({
        success: true,
        data: { athlete },
      });
    } catch (error) {
      if (error.message === 'Athlete not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
        });
      }
      logger.error('Upload photo error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to upload photo' },
      });
    }
  }
);
```

Use Option A unless there's a specific reason for a dedicated endpoint.
  </action>
  <verify>
Test with curl:
```bash
# Test PATCH with avatar
curl -X PATCH http://localhost:8000/api/v1/athletes/{id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"avatar": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."}'

# Response should include avatar field
```
  </verify>
  <done>PATCH /api/v1/athletes/:id accepts avatar field, stores base64 in database</done>
</task>

</tasks>

<verification>
1. Prisma migration applies without errors
2. Athlete model has avatar field (nullable, Text type)
3. PATCH /api/v1/athletes/:id accepts avatar in request body
4. Avatar validation rejects non-data-URL strings
5. Avatar validation rejects images over 500KB
6. Saved avatar can be retrieved via GET /api/v1/athletes/:id
</verification>

<success_criteria>
- PHOTO-01 backend: API endpoint exists to persist athlete photos
- Avatar stored as base64 data URL in database
- Size validation prevents oversized uploads
- Integrates with existing athlete update flow
</success_criteria>

<output>
After completion, create `.planning/phases/12-settings-photos-polish/12-06b-SUMMARY.md`
</output>
