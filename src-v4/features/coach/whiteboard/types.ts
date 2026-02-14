/**
 * Whiteboard feature types.
 *
 * Matches backend Prisma schema for Whiteboard model.
 * Backend routes: GET /api/v1/whiteboards/latest, POST /api/v1/whiteboards
 */

// ---------------------------------------------------------------------------
// Whiteboard entry
// ---------------------------------------------------------------------------

export interface WhiteboardEntry {
  id: string;
  teamId: string;
  date: string; // ISO 8601 date (YYYY-MM-DD)
  content: string; // Markdown content
  authorId: string;
  author: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Mutation inputs
// ---------------------------------------------------------------------------

export interface SaveWhiteboardInput {
  date: string; // ISO 8601 date (YYYY-MM-DD)
  content: string; // Markdown content, max 50000 chars
}
