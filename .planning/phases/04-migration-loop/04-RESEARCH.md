# Phase 4: Migration Loop - Research

**Researched:** 2026-01-23
**Domain:** Coach features migration - CRUD operations, rich text editing, availability management, and fleet inventory
**Confidence:** HIGH

## Summary

Phase 4 migrates coach-specific features from V1 to V2, focusing on Team Whiteboard (rich text daily communications), Fleet Management (shells and oars inventory with CRUD operations), and Athlete Availability (calendar grid for scheduling). This phase completes the migration loop by ensuring all V1 features have V2 equivalents, with coach/admin contexts fully functional.

The standard approach uses TanStack Query mutations for CRUD operations with optimistic updates and cache invalidation, react-hook-form + Zod for form validation (Zod already installed), @uiw/react-md-editor for whiteboard markdown editing (lightweight at 4.6 kB gzipped), and a custom availability grid built with CSS Grid (no calendar library needed - simple day/slot matrix). The existing Prisma schema already has Shell, OarSet, Whiteboard, and Availability models with proper relationships and enums.

Backend follows the established express-validator pattern from Phase 3, with CRUD endpoints for fleet resources, whiteboard endpoints (get latest, CRUD operations), and availability view/edit endpoints with team-wide aggregation. All endpoints use team isolation middleware and standard error response format.

**Primary recommendation:** Use TanStack Query mutations with optimistic updates for CRUD, add react-hook-form + @hookform/resolvers for type-safe forms with Zod, use @uiw/react-md-editor for whiteboard (lightweight markdown), and build custom availability grid with CSS Grid (simpler than calendar libraries for slot-based scheduling).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TanStack Query | v5 (installed) | CRUD mutations with cache invalidation | De facto standard for server-state mutations. Handles optimistic updates, rollback on error, and automatic cache invalidation. |
| react-hook-form | ^7.71.1 | Form state management | Industry standard for performant React forms. Uses uncontrolled inputs to minimize re-renders. 8,305+ projects use it. |
| @hookform/resolvers | ^3.x | Zod integration for react-hook-form | Official resolvers package for schema validation. Connects Zod schemas to react-hook-form. |
| Zod | ^4.3.4 (installed) | Form validation schemas | Already installed. Type-safe validation with TypeScript inference. Standard for React + TypeScript projects. |
| @uiw/react-md-editor | ^4.x | Markdown editor for whiteboard | Lightweight (4.6 kB gzipped), no CodeMirror/Monaco dependencies. Native textarea-based with GFM support. |
| CSS Grid | Native | Availability calendar grid | Native browser support for day/slot matrix layout. No library needed for simple slot-based grids. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| express-validator | ^7.3.1 (installed) | API validation | Backend CRUD endpoint validation. Already used in Phase 3 patterns. |
| axios | ^1.13.2 (installed) | HTTP client | Use in TanStack Query mutationFn. Better error handling than fetch. |
| Framer Motion | ^11.18.2 (installed) | Modal animations | Modal enter/exit transitions for CRUD forms. Already used throughout V2. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @uiw/react-md-editor | MDXEditor | MDXEditor is 851 kB gzipped (185x larger) with inline rendering issues. Overkill for simple daily whiteboard posts. |
| Custom availability grid | react-big-calendar, FullCalendar | Calendar libraries are heavy and designed for events, not slot-based availability (morning/evening only). CSS Grid is simpler. |
| react-hook-form | Formik | Formik is older, less performant (controlled inputs everywhere), and has less momentum. react-hook-form is the 2026 standard. |
| TanStack Query mutations | Manual axios + state | Hand-rolled mutations miss optimistic updates, rollback on error, cache invalidation, and retry logic. Not worth reinventing. |

**Installation:**
```bash
npm install react-hook-form @hookform/resolvers @uiw/react-md-editor
```

## Architecture Patterns

### Recommended Project Structure
```
src/v2/
├── pages/
│   ├── CoachWhiteboard.tsx         # Whiteboard view at /beta/coach/whiteboard
│   ├── CoachFleet.tsx              # Fleet management at /beta/coach/fleet
│   └── CoachAvailability.tsx       # Team availability at /beta/coach/availability
├── components/
│   ├── whiteboard/
│   │   ├── WhiteboardView.tsx      # Display latest whiteboard
│   │   ├── WhiteboardEditor.tsx    # Markdown editor modal
│   │   └── WhiteboardHistory.tsx   # Past whiteboards list
│   ├── fleet/
│   │   ├── ShellsTable.tsx         # Shells list with actions
│   │   ├── OarsTable.tsx           # Oar sets list with actions
│   │   ├── ShellForm.tsx           # Add/edit shell modal form
│   │   └── OarSetForm.tsx          # Add/edit oar set modal form
│   ├── availability/
│   │   ├── AvailabilityGrid.tsx    # Team availability matrix
│   │   ├── AvailabilityCell.tsx    # Single athlete/day cell
│   │   └── AvailabilityEditor.tsx  # Edit athlete availability
│   └── common/
│       ├── CrudModal.tsx           # Reusable modal wrapper
│       └── FormField.tsx           # react-hook-form field wrapper
├── hooks/
│   ├── useWhiteboards.ts           # TanStack Query hooks for whiteboard
│   ├── useShells.ts                # CRUD hooks for shells
│   ├── useOarSets.ts               # CRUD hooks for oar sets
│   └── useAvailability.ts          # Availability view/edit hooks
server/
├── routes/v1/
│   ├── whiteboards.js              # Whiteboard CRUD + latest endpoint
│   ├── shells.js                   # Shell CRUD endpoints (may exist)
│   ├── oarSets.js                  # Oar set CRUD endpoints (may exist)
│   └── availability.js             # Availability view/edit endpoints
└── middleware/
    └── auth.js                     # Team isolation + role checks (COACH, OWNER)
```

### Pattern 1: TanStack Query CRUD Mutations with Optimistic Updates

**What:** useMutation for create/update/delete operations with optimistic UI updates and automatic rollback on error.

**When to use:** For all CRUD operations (fleet, whiteboard, availability). Provides instant feedback while server processes request.

**Example:**
```typescript
// Source: https://tanstack.com/query/v5/docs/react/guides/optimistic-updates
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface Shell {
  id: string;
  name: string;
  boatClass: string;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED';
}

// Custom hook for shell CRUD
export function useShells(teamId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['shells', teamId];

  // Fetch shells
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await axios.get(`/api/v1/teams/${teamId}/shells`);
      return response.data.data;
    },
  });

  // Create shell mutation with optimistic update
  const createMutation = useMutation({
    mutationFn: async (newShell: Omit<Shell, 'id'>) => {
      const response = await axios.post(`/api/v1/teams/${teamId}/shells`, newShell);
      return response.data.data;
    },
    onMutate: async (newShell) => {
      // Cancel outgoing refetches (don't overwrite optimistic update)
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousShells = queryClient.getQueryData<Shell[]>(queryKey);

      // Optimistically update cache
      queryClient.setQueryData<Shell[]>(queryKey, (old = []) => [
        ...old,
        { ...newShell, id: 'temp-' + Date.now() }, // Temporary ID
      ]);

      // Return context with snapshot
      return { previousShells };
    },
    onError: (err, newShell, context) => {
      // Rollback on error
      if (context?.previousShells) {
        queryClient.setQueryData(queryKey, context.previousShells);
      }
    },
    onSettled: () => {
      // Refetch to ensure server state is synced
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Update shell mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Shell> & { id: string }) => {
      const response = await axios.put(`/api/v1/teams/${teamId}/shells/${id}`, updates);
      return response.data.data;
    },
    onMutate: async (updatedShell) => {
      await queryClient.cancelQueries({ queryKey });
      const previousShells = queryClient.getQueryData<Shell[]>(queryKey);

      queryClient.setQueryData<Shell[]>(queryKey, (old = []) =>
        old.map(shell => shell.id === updatedShell.id ? { ...shell, ...updatedShell } : shell)
      );

      return { previousShells };
    },
    onError: (err, updatedShell, context) => {
      if (context?.previousShells) {
        queryClient.setQueryData(queryKey, context.previousShells);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Delete shell mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/v1/teams/${teamId}/shells/${id}`);
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousShells = queryClient.getQueryData<Shell[]>(queryKey);

      queryClient.setQueryData<Shell[]>(queryKey, (old = []) =>
        old.filter(shell => shell.id !== deletedId)
      );

      return { previousShells };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousShells) {
        queryClient.setQueryData(queryKey, context.previousShells);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    shells: query.data,
    isLoading: query.isLoading,
    error: query.error,
    createShell: createMutation.mutate,
    updateShell: updateMutation.mutate,
    deleteShell: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
```

**Why this works:**
- Instant UI feedback (optimistic update)
- Automatic rollback on error
- Server sync on success (invalidateQueries)
- Single source of truth (TanStack Query cache)

### Pattern 2: react-hook-form + Zod for Type-Safe Forms

**What:** Uncontrolled form inputs with Zod schema validation and TypeScript inference.

**When to use:** For all CRUD forms (shell form, oar set form, whiteboard editor, availability editor).

**Example:**
```typescript
// Source: https://react-hook-form.com/get-started
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Zod schema for shell form
const shellSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  boatClass: z.enum(['1x', '2-', '2x', '4-', '4x', '4+', '8+'], {
    errorMap: () => ({ message: 'Invalid boat class' }),
  }),
  type: z.enum(['RACING', 'TRAINING', 'RECREATIONAL']),
  weightClass: z.enum(['LIGHTWEIGHT', 'HEAVYWEIGHT', 'OPEN']),
  rigging: z.enum(['STARBOARD', 'PORT', 'BUCKET']),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED']),
  notes: z.string().max(500).optional(),
});

// Infer TypeScript type from Zod schema
type ShellFormData = z.infer<typeof shellSchema>;

interface ShellFormProps {
  initialData?: ShellFormData;
  onSubmit: (data: ShellFormData) => void;
  isSubmitting: boolean;
}

function ShellForm({ initialData, onSubmit, isSubmitting }: ShellFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ShellFormData>({
    resolver: zodResolver(shellSchema),
    defaultValues: initialData || {
      status: 'AVAILABLE',
      type: 'RACING',
      weightClass: 'OPEN',
      rigging: 'STARBOARD',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-txt-primary">
          Shell Name
        </label>
        <input
          {...register('name')}
          id="name"
          type="text"
          className="mt-1 block w-full rounded-md border-bdr-primary bg-surface px-3 py-2"
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Boat class select */}
      <div>
        <label htmlFor="boatClass" className="block text-sm font-medium text-txt-primary">
          Boat Class
        </label>
        <select
          {...register('boatClass')}
          id="boatClass"
          className="mt-1 block w-full rounded-md border-bdr-primary bg-surface px-3 py-2"
          disabled={isSubmitting}
        >
          <option value="">Select...</option>
          <option value="1x">1x (Single)</option>
          <option value="2-">2- (Pair)</option>
          <option value="2x">2x (Double)</option>
          <option value="4-">4- (Four)</option>
          <option value="4x">4x (Quad)</option>
          <option value="4+">4+ (Coxed Four)</option>
          <option value="8+">8+ (Eight)</option>
        </select>
        {errors.boatClass && (
          <p className="mt-1 text-sm text-red-600">{errors.boatClass.message}</p>
        )}
      </div>

      {/* Status select */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-txt-primary">
          Status
        </label>
        <select
          {...register('status')}
          id="status"
          className="mt-1 block w-full rounded-md border-bdr-primary bg-surface px-3 py-2"
          disabled={isSubmitting}
        >
          <option value="AVAILABLE">Available</option>
          <option value="IN_USE">In Use</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="RETIRED">Retired</option>
        </select>
      </div>

      {/* Notes textarea */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-txt-primary">
          Notes (optional)
        </label>
        <textarea
          {...register('notes')}
          id="notes"
          rows={3}
          className="mt-1 block w-full rounded-md border-bdr-primary bg-surface px-3 py-2"
          disabled={isSubmitting}
        />
        {errors.notes && (
          <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
        )}
      </div>

      {/* Submit button */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2 rounded-md border border-bdr-primary"
          disabled={isSubmitting}
        >
          Reset
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-accent-primary text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Shell'}
        </button>
      </div>
    </form>
  );
}
```

**Why this works:**
- Uncontrolled inputs minimize re-renders (performance)
- Zod schema provides validation + TypeScript types
- Single source of truth for validation rules
- Error messages from schema, not duplicated in JSX

### Pattern 3: @uiw/react-md-editor for Whiteboard

**What:** Lightweight markdown editor with live preview for daily whiteboard posts.

**When to use:** For whiteboard content editing (coach posts daily workout/announcements).

**Example:**
```typescript
// Source: https://uiwjs.github.io/react-md-editor/
import MDEditor from '@uiw/react-md-editor';
import { useState } from 'react';

interface WhiteboardEditorProps {
  initialContent?: string;
  onSave: (content: string) => void;
  isSaving: boolean;
}

function WhiteboardEditor({ initialContent = '', onSave, isSaving }: WhiteboardEditorProps) {
  const [content, setContent] = useState(initialContent);

  const handleSave = () => {
    if (content.trim()) {
      onSave(content);
    }
  };

  return (
    <div className="space-y-4">
      <MDEditor
        value={content}
        onChange={(val) => setContent(val || '')}
        height={400}
        preview="live" // Side-by-side edit and preview
        textareaProps={{
          placeholder: 'Enter today\'s whiteboard content (markdown supported)...',
        }}
      />

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setContent(initialContent)}
          className="px-4 py-2 rounded-md border border-bdr-primary"
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 rounded-md bg-accent-primary text-white"
          disabled={isSaving || !content.trim()}
        >
          {isSaving ? 'Posting...' : 'Post Whiteboard'}
        </button>
      </div>
    </div>
  );
}

// Usage with TanStack Query mutation
function WhiteboardPage() {
  const { data: whiteboard, isLoading } = useQuery({
    queryKey: ['whiteboard', 'latest'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/whiteboards/latest');
      return response.data.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await axios.post('/api/v1/whiteboards', {
        content,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whiteboard'] });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Daily Whiteboard</h1>
      {whiteboard ? (
        <WhiteboardView whiteboard={whiteboard} onEdit={() => setIsEditing(true)} />
      ) : (
        <WhiteboardEditor onSave={(content) => mutation.mutate(content)} isSaving={mutation.isPending} />
      )}
    </div>
  );
}
```

**Why this works:**
- Lightweight (4.6 kB gzipped)
- Native textarea (no CodeMirror/Monaco)
- GitHub Flavored Markdown support
- Live preview side-by-side

### Pattern 4: CSS Grid Availability Matrix

**What:** Simple day/athlete grid for availability slot selection (morning/evening).

**When to use:** For team-wide availability calendar view (coach sees all athletes at once).

**Example:**
```typescript
// Source: CSS Grid patterns
import { useState } from 'react';

type AvailabilitySlot = 'AVAILABLE' | 'UNAVAILABLE' | 'MAYBE' | 'NOT_SET';

interface AvailabilityData {
  athleteId: string;
  athleteName: string;
  dates: {
    date: string; // YYYY-MM-DD
    morningSlot: AvailabilitySlot;
    eveningSlot: AvailabilitySlot;
  }[];
}

interface AvailabilityGridProps {
  data: AvailabilityData[];
  startDate: Date;
  numDays: number;
}

function AvailabilityGrid({ data, startDate, numDays }: AvailabilityGridProps) {
  // Generate date range
  const dates = Array.from({ length: numDays }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    return date;
  });

  const getSlotClass = (slot: AvailabilitySlot) => {
    switch (slot) {
      case 'AVAILABLE':
        return 'bg-green-100 border-green-500';
      case 'UNAVAILABLE':
        return 'bg-red-100 border-red-500';
      case 'MAYBE':
        return 'bg-yellow-100 border-yellow-500';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `200px repeat(${numDays}, minmax(80px, 1fr))`,
        }}
      >
        {/* Header row: Athlete name + dates */}
        <div className="sticky left-0 bg-surface font-semibold p-2 border-b border-bdr-primary">
          Athlete
        </div>
        {dates.map((date) => (
          <div key={date.toISOString()} className="text-center p-2 border-b border-bdr-primary">
            <div className="text-xs text-txt-secondary">
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className="text-sm font-medium">
              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
        ))}

        {/* Athlete rows */}
        {data.map((athlete) => (
          <>
            {/* Athlete name (sticky left column) */}
            <div className="sticky left-0 bg-surface p-2 border-b border-bdr-primary font-medium">
              {athlete.athleteName}
            </div>

            {/* Availability cells */}
            {dates.map((date) => {
              const dateStr = date.toISOString().split('T')[0];
              const dayData = athlete.dates.find((d) => d.date === dateStr);

              return (
                <div key={dateStr} className="flex flex-col gap-0.5 p-1 border-b border-bdr-primary">
                  {/* Morning slot */}
                  <div
                    className={`p-1 rounded text-xs text-center border ${getSlotClass(dayData?.morningSlot || 'NOT_SET')}`}
                    title="Morning"
                  >
                    AM
                  </div>
                  {/* Evening slot */}
                  <div
                    className={`p-1 rounded text-xs text-center border ${getSlotClass(dayData?.eveningSlot || 'NOT_SET')}`}
                    title="Evening"
                  >
                    PM
                  </div>
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
```

**Why this works:**
- CSS Grid handles sticky columns natively
- Simple slot-based model (morning/evening only)
- No calendar library needed (not event-based)
- Color coding for quick scanning

### Pattern 5: Backend CRUD Endpoints with express-validator

**What:** RESTful CRUD endpoints following Phase 3 patterns with validation and team isolation.

**When to use:** For all backend API endpoints (shells, oars, whiteboards, availability).

**Example:**
```javascript
// Source: Existing patterns from server/routes/activities.js
import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticateToken, teamIsolation, requireRole } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: errors.array() },
    });
  }
  next();
};

// GET /api/v1/teams/:teamId/shells
router.get(
  '/:teamId',
  authenticateToken,
  teamIsolation,
  async (req, res) => {
    try {
      const shells = await prisma.shell.findMany({
        where: { teamId: req.params.teamId },
        orderBy: { name: 'asc' },
      });

      res.json({ success: true, data: shells });
    } catch (error) {
      logger.error('Get shells error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to load shells' },
      });
    }
  }
);

// POST /api/v1/teams/:teamId/shells
router.post(
  '/:teamId',
  authenticateToken,
  teamIsolation,
  requireRole(['COACH', 'OWNER']), // Only coaches can create
  [
    body('name').isString().trim().notEmpty().withMessage('Name is required'),
    body('boatClass').isIn(['1x', '2-', '2x', '4-', '4x', '4+', '8+']).withMessage('Invalid boat class'),
    body('type').isIn(['RACING', 'TRAINING', 'RECREATIONAL']).withMessage('Invalid type'),
    body('weightClass').isIn(['LIGHTWEIGHT', 'HEAVYWEIGHT', 'OPEN']).withMessage('Invalid weight class'),
    body('rigging').isIn(['STARBOARD', 'PORT', 'BUCKET']).withMessage('Invalid rigging'),
    body('status').isIn(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED']).optional(),
    body('notes').isString().optional(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const shell = await prisma.shell.create({
        data: {
          teamId: req.params.teamId,
          name: req.body.name,
          boatClass: req.body.boatClass,
          type: req.body.type,
          weightClass: req.body.weightClass,
          rigging: req.body.rigging,
          status: req.body.status || 'AVAILABLE',
          notes: req.body.notes,
        },
      });

      res.status(201).json({ success: true, data: shell });
    } catch (error) {
      if (error.code === 'P2002') {
        // Unique constraint violation
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE_SHELL', message: 'A shell with this name already exists' },
        });
      }

      logger.error('Create shell error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to create shell' },
      });
    }
  }
);

// PUT /api/v1/teams/:teamId/shells/:shellId
router.put(
  '/:teamId/:shellId',
  authenticateToken,
  teamIsolation,
  requireRole(['COACH', 'OWNER']),
  [
    param('shellId').isUUID().withMessage('Invalid shell ID'),
    body('name').isString().trim().optional(),
    body('boatClass').isIn(['1x', '2-', '2x', '4-', '4x', '4+', '8+']).optional(),
    body('status').isIn(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED']).optional(),
    body('notes').isString().optional(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const shell = await prisma.shell.update({
        where: {
          id: req.params.shellId,
          teamId: req.params.teamId, // Ensure shell belongs to team
        },
        data: req.body,
      });

      res.json({ success: true, data: shell });
    } catch (error) {
      if (error.code === 'P2025') {
        // Record not found
        return res.status(404).json({
          success: false,
          error: { code: 'SHELL_NOT_FOUND', message: 'Shell not found' },
        });
      }

      logger.error('Update shell error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update shell' },
      });
    }
  }
);

// DELETE /api/v1/teams/:teamId/shells/:shellId
router.delete(
  '/:teamId/:shellId',
  authenticateToken,
  teamIsolation,
  requireRole(['COACH', 'OWNER']),
  [param('shellId').isUUID().withMessage('Invalid shell ID')],
  validateRequest,
  async (req, res) => {
    try {
      await prisma.shell.delete({
        where: {
          id: req.params.shellId,
          teamId: req.params.teamId,
        },
      });

      res.json({ success: true, data: null });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: { code: 'SHELL_NOT_FOUND', message: 'Shell not found' },
        });
      }

      logger.error('Delete shell error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to delete shell' },
      });
    }
  }
);

export default router;
```

**Why this works:**
- express-validator for input validation
- Team isolation middleware ensures data security
- Role-based access control (COACH, OWNER only)
- Standard error response format (from Phase 3)
- Prisma handles unique constraints and relations

### Anti-Patterns to Avoid

- **Using controlled inputs everywhere:** react-hook-form uses uncontrolled inputs by default. Don't wrap every input with useState - it defeats the performance benefits.
- **Heavy calendar libraries for simple slot grids:** FullCalendar, react-big-calendar are designed for event scheduling. For simple slot-based availability (morning/evening), CSS Grid is simpler and lighter.
- **Client-side form validation only:** Always validate on server with express-validator. Client-side validation (Zod) is for UX, not security.
- **Manual cache invalidation:** Don't manually refetch after mutations. Use TanStack Query's invalidateQueries in onSettled callback for automatic sync.
- **Storing form state in Zustand:** react-hook-form manages form state. Don't duplicate it in global state - only send final data to server.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom input validators | Zod + react-hook-form | Zod provides schema validation + TypeScript inference. react-hook-form handles form state with minimal re-renders. Hand-rolled validation is verbose and error-prone. |
| CRUD mutations | Manual axios + setState | TanStack Query useMutation | Mutations handle optimistic updates, rollback on error, cache invalidation, retry logic, and loading states. Hand-rolled solutions miss these edge cases. |
| Markdown editing | Custom textarea + parser | @uiw/react-md-editor | Markdown parsing, syntax highlighting, live preview, and toolbar are complex. @uiw is lightweight (4.6 kB) and handles all of this. |
| Modal management | Context + useState | Local state + Framer Motion | Modals are scoped to pages. No need for global context. Local state + Framer Motion AnimatePresence is sufficient. |
| Role-based access control | Custom middleware | requireRole middleware | Express middleware for role checking is a solved pattern. Don't reinvent - follow existing auth.js patterns. |

**Key insight:** CRUD operations have standard patterns - don't build custom abstractions. React Hook Form + Zod + TanStack Query mutations is the 2026 standard stack. The only custom logic needed is business rules (validation schemas, deduplication heuristics).

## Common Pitfalls

### Pitfall 1: Mutating Cache Data Directly

**What goes wrong:** Attempting to write directly to TanStack Query cache by mutating data in place, causing subtle bugs where UI doesn't update or updates incorrectly.

**Why it happens:** queryClient.setQueryData requires immutable updates - mutating objects in place doesn't trigger re-renders.

**How to avoid:**
```typescript
// BAD: Mutating in place
queryClient.setQueryData(['shells'], (old) => {
  old.push(newShell); // Mutation!
  return old;
});

// GOOD: Immutable update
queryClient.setQueryData(['shells'], (old = []) => [...old, newShell]);
```

**Warning signs:** Optimistic updates don't appear in UI, or UI updates but data is stale after refresh.

### Pitfall 2: Callback Execution with Component Unmounting

**What goes wrong:** Callbacks passed to mutate() don't fire if component unmounts before mutation completes.

**Why it happens:** TanStack Query unsubscribes mutation observers when components unmount.

**How to avoid:**
- Put critical logic in useMutation options (onSuccess, onError, onSettled), not in mutate() callbacks
- Use onSettled in useMutation for cleanup/refetch logic that must always run

**Warning signs:** Toast notifications don't show, navigation doesn't happen after form submit.

### Pitfall 3: Controlled Inputs in react-hook-form

**What goes wrong:** Performance degrades when using controlled inputs (value + onChange) with react-hook-form, causing sluggish typing.

**Why it happens:** react-hook-form uses uncontrolled inputs by default. Adding value/onChange props makes them controlled, triggering re-renders on every keystroke.

**How to avoid:**
```typescript
// BAD: Controlled input (defeats react-hook-form performance)
const [name, setName] = useState('');
<input value={name} onChange={(e) => setName(e.target.value)} {...register('name')} />

// GOOD: Uncontrolled input (let react-hook-form manage it)
<input {...register('name')} />
```

**Warning signs:** Typing in forms feels sluggish, especially in large forms or slow devices.

### Pitfall 4: CSS Grid Dense Packing for Availability Grid

**What goes wrong:** Using grid-auto-flow: dense causes availability cells to reorder, breaking athlete/date alignment.

**Why it happens:** Dense packing fills gaps by moving items out of DOM order.

**How to avoid:**
- Don't use grid-auto-flow: dense for availability grids (strict row/column alignment required)
- Use explicit grid-template-columns and grid-template-rows

**Warning signs:** Availability slots appear in wrong columns, athlete names don't align with dates.

### Pitfall 5: Server-Side Validation Missing

**What goes wrong:** Client-side Zod validation passes, but server rejects request with validation errors.

**Why it happens:** Client-side validation is not a security boundary. Server must validate independently.

**How to avoid:**
1. Always use express-validator on server for same validation rules as Zod
2. Keep Zod schemas and express-validator rules in sync
3. Consider codegen tool to generate validators from Zod schemas (e.g., zod-to-json-schema)

**Warning signs:** 400 errors from server even though form passed client-side validation.

### Pitfall 6: Whiteboard Date Uniqueness Not Enforced

**What goes wrong:** Multiple whiteboards created for same date, causing confusion about which is "latest."

**Why it happens:** Prisma schema has unique constraint on [teamId, date], but client doesn't check before POST.

**How to avoid:**
1. Use upsert on server (update if exists, create if not)
2. Check for existing whiteboard before showing "Create" form
3. UI should show "Edit today's whiteboard" not "Create new" if one exists

**Warning signs:** Multiple whiteboards appear for same date, users confused about which to read.

## Code Examples

Verified patterns from official sources:

### Reusable CRUD Modal Pattern

```typescript
// Source: Compound component pattern for modals
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X } from '@phosphor-icons/react';

interface CrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function CrudModal({ isOpen, onClose, title, children }: CrudModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal panel */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-surface p-6 text-left align-middle shadow-xl transition-all border border-bdr-primary">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-xl font-semibold text-txt-primary">
                    {title}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1 hover:bg-surface-hover transition-colors"
                  >
                    <X size={20} className="text-txt-secondary" />
                  </button>
                </div>

                {/* Content */}
                <div>{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// Usage
function FleetManagementPage() {
  const [isShellModalOpen, setIsShellModalOpen] = useState(false);
  const [editingShell, setEditingShell] = useState<Shell | null>(null);

  return (
    <>
      <button onClick={() => setIsShellModalOpen(true)}>Add Shell</button>

      <CrudModal
        isOpen={isShellModalOpen}
        onClose={() => {
          setIsShellModalOpen(false);
          setEditingShell(null);
        }}
        title={editingShell ? 'Edit Shell' : 'Add Shell'}
      >
        <ShellForm
          initialData={editingShell}
          onSubmit={(data) => {
            // Handle create/update
            setIsShellModalOpen(false);
          }}
        />
      </CrudModal>
    </>
  );
}
```

### Whiteboard Latest Endpoint Pattern

```javascript
// Source: Date-based querying with Prisma
import express from 'express';
import { authenticateToken, teamIsolation } from '../middleware/auth.js';

const router = express.Router();

// GET /api/v1/teams/:teamId/whiteboards/latest
// Returns the most recent whiteboard (typically today's)
router.get(
  '/:teamId/latest',
  authenticateToken,
  teamIsolation,
  async (req, res) => {
    try {
      const whiteboard = await prisma.whiteboard.findFirst({
        where: { teamId: req.params.teamId },
        orderBy: { date: 'desc' },
        include: {
          author: {
            select: { id: true, name: true },
          },
        },
      });

      if (!whiteboard) {
        return res.status(404).json({
          success: false,
          error: { code: 'NO_WHITEBOARD', message: 'No whiteboard found' },
        });
      }

      res.json({ success: true, data: whiteboard });
    } catch (error) {
      logger.error('Get latest whiteboard error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to load whiteboard' },
      });
    }
  }
);

// POST /api/v1/teams/:teamId/whiteboards
// Create or update whiteboard for a specific date (upsert pattern)
router.post(
  '/:teamId',
  authenticateToken,
  teamIsolation,
  requireRole(['COACH', 'OWNER']),
  [
    body('date').isISO8601().toDate().withMessage('Valid date required (YYYY-MM-DD)'),
    body('content').isString().trim().notEmpty().withMessage('Content is required'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const whiteboard = await prisma.whiteboard.upsert({
        where: {
          teamId_date: {
            teamId: req.params.teamId,
            date: req.body.date,
          },
        },
        update: {
          content: req.body.content,
          authorId: req.user.userId,
          updatedAt: new Date(),
        },
        create: {
          teamId: req.params.teamId,
          date: req.body.date,
          content: req.body.content,
          authorId: req.user.userId,
        },
        include: {
          author: {
            select: { id: true, name: true },
          },
        },
      });

      res.status(201).json({ success: true, data: whiteboard });
    } catch (error) {
      logger.error('Create/update whiteboard error', { error: error.message });
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to save whiteboard' },
      });
    }
  }
);

export default router;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Formik for forms | react-hook-form | 2022-2023 | react-hook-form uses uncontrolled inputs for better performance. Less re-renders, simpler API. Formik still works but momentum shifted. |
| Manual form validation | Zod + react-hook-form | 2023-2024 | Zod provides schema-first validation with TypeScript inference. Single source of truth for validation rules. |
| CodeMirror/Monaco for markdown | Lightweight editors (@uiw, react-md-editor) | 2023-2024 | CodeMirror/Monaco are heavy (500+ kB). For simple markdown editing, lightweight editors are preferred (4-10 kB). |
| Calendar libraries for slots | Custom CSS Grid | 2024-present | Calendar libraries (FullCalendar, react-big-calendar) are designed for events. For slot-based scheduling (AM/PM only), CSS Grid is simpler. |
| Manual CRUD state management | TanStack Query mutations | 2022-2023 | TanStack Query handles optimistic updates, rollback, cache invalidation automatically. Manual approaches miss edge cases. |

**Deprecated/outdated:**
- **Formik:** Still maintained but react-hook-form is the 2026 standard. Better performance, simpler API, better TypeScript support.
- **Yup validation:** Still works but Zod is preferred for TypeScript projects (better inference, more expressive schemas).

## Open Questions

Things that couldn't be fully resolved:

1. **Availability Time Window Tolerance**
   - What we know: Availability uses day-based slots (morning/evening). Need to decide cutoff times.
   - What's unclear: What time is "morning" vs "evening"? Is 3 PM morning or evening?
   - Recommendation: Use standard cutoffs - Morning: 5 AM - 12 PM, Evening: 12 PM - 10 PM. Make configurable per team in settings if needed.

2. **Whiteboard Markdown Features**
   - What we know: @uiw/react-md-editor supports GitHub Flavored Markdown.
   - What's unclear: Should we enable all GFM features (tables, task lists, etc.) or keep it simple?
   - Recommendation: Enable full GFM. Coaches may want tables for workout schedules or task lists for pre-practice checklist.

3. **Fleet Equipment Status Workflow**
   - What we know: Shells/oars have status enum (AVAILABLE, IN_USE, MAINTENANCE, RETIRED).
   - What's unclear: Should status change automatically (e.g., IN_USE when assigned to lineup), or manual only?
   - Recommendation: Manual only for V2. Automatic status tracking requires lineup integration (Phase 4+).

4. **Availability Default Schedule**
   - What we know: Schema has DefaultSchedule model (weekly pattern).
   - What's unclear: Should availability editor pre-fill from default schedule, or start blank?
   - Recommendation: Pre-fill from default schedule but allow override. Saves coaches time for athletes with regular schedules.

## Sources

### Primary (HIGH confidence)
- [TanStack Query v5 Mutations Documentation](https://tanstack.com/query/v5/docs/react/guides/mutations) - Mutation patterns, optimistic updates
- [TanStack Query Optimistic Updates Guide](https://tanstack.com/query/v5/docs/react/guides/optimistic-updates) - Cache management patterns
- [react-hook-form Official Documentation](https://react-hook-form.com/get-started) - Form state management, validation
- [@hookform/resolvers Documentation](https://github.com/react-hook-form/resolvers) - Zod integration for react-hook-form
- [Zod Documentation](https://zod.dev) - Schema validation and TypeScript inference
- [@uiw/react-md-editor GitHub](https://github.com/uiwjs/react-md-editor) - Markdown editor features and usage
- [Express Validator Documentation](https://express-validator.github.io/docs/) - Server-side validation patterns

### Secondary (MEDIUM confidence)
- [LogRocket: Deep Dive into TanStack Query Mutations](https://blog.logrocket.com/deep-dive-mutations-tanstack-query/) - Mutation best practices and pitfalls
- [Contentful: React Hook Form + Zod Validation](https://www.contentful.com/blog/react-hook-form-validation-zod/) - Integration patterns
- [FreeCodeCamp: Form Validation with Zod](https://www.freecodecamp.org/news/react-form-validation-zod-react-hook-form/) - Zod schema patterns
- [Strapi: Top 5 Markdown Editors for React](https://strapi.io/blog/top-5-markdown-editors-for-react) - Editor comparison (2026)
- [Bundlephobia: @uiw/react-md-editor](https://bundlephobia.com/package/@uiw/react-md-editor) - Bundle size verification (4.6 kB)
- [Atomic Object: TanStack Query Reusable Patterns](https://spin.atomicobject.com/tanstack-query-reusable-patterns/) - CRUD mutation patterns
- [TkDodo's Blog: Concurrent Optimistic Updates](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query) - Advanced optimistic update patterns

### Tertiary (LOW confidence)
- [DEV Community: React Form Best Practices](https://daily.dev/blog/form-on-react-best-practices) - General form patterns
- [Medium: Optimizing Form Handling](https://medium.com/cstech/optimizing-form-handling-in-react-maximizing-performance-ee8904f33a99) - Performance considerations
- [Croct Blog: Best React Modal Libraries 2026](https://blog.croct.com/post/best-react-modal-dialog-libraries) - Modal patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - TanStack Query, react-hook-form, Zod, @uiw/react-md-editor are industry standards with official documentation
- Architecture: HIGH - CRUD patterns verified with official docs and Phase 3 backend patterns already established
- Pitfalls: MEDIUM - Based on official TanStack Query docs and community GitHub issues (common mutation mistakes)

**Research date:** 2026-01-23
**Valid until:** ~30 days (stable ecosystem - React Hook Form, TanStack Query, Zod have mature APIs)

**Notes:**
- Prisma schema already has all required models (Shell, OarSet, Whiteboard, Availability, DefaultSchedule). Zero new models needed.
- Zod is already installed (v4.3.4). Only need react-hook-form + @hookform/resolvers.
- express-validator is already installed and used in Phase 3 backend patterns. Backend follows established conventions.
- @uiw/react-md-editor is lightweight (4.6 kB gzipped) compared to alternatives (MDXEditor: 851 kB).
- Phase 3 established TanStack Query patterns (useQuery for reads). Phase 4 extends with useMutation for writes.
