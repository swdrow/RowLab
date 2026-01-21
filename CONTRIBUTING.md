# Contributing to RowLab

Thank you for your interest in contributing to RowLab! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [Coding Standards](#coding-standards)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive experience for everyone. Please:

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Keep discussions professional

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (check with `node --version`)
- **npm** 9+ (check with `npm --version`)
- **PostgreSQL** 14+ (or Docker)
- **Git** for version control

### Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/RowLab.git
cd RowLab
git remote add upstream https://github.com/swdrow/RowLab.git
```

---

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your local settings
```

Required variables:
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/rowlab_dev
JWT_SECRET=dev-secret-key
JWT_REFRESH_SECRET=dev-refresh-secret
```

### 3. Set Up Database

```bash
# Start PostgreSQL (if using Docker)
docker run -d --name rowlab-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=rowlab_dev \
  -p 5432:5432 postgres:14

# Run migrations
npx prisma migrate dev

# (Optional) Seed test data
npm run db:seed
```

### 4. Start Development Servers

```bash
npm run dev:full
```

This starts:
- Frontend at http://localhost:3001
- Backend at http://localhost:3002

### 5. Verify Setup

- Visit http://localhost:3001
- Create a test account
- Try the lineup builder

---

## Project Architecture

### Directory Structure

```
RowLab/
├── src/                    # React frontend
│   ├── components/
│   │   ├── ui/            # Base design system components
│   │   ├── domain/        # Domain-specific components
│   │   └── compound/      # Composite components
│   ├── pages/             # Route pages (one per route)
│   ├── store/             # Zustand state stores
│   ├── theme/             # Design tokens and theme config
│   └── utils/             # Utility functions
├── server/                 # Express backend
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic layer
│   ├── middleware/        # Express middleware
│   └── utils/             # Server utilities
├── prisma/                 # Database
│   ├── schema.prisma      # Model definitions
│   └── migrations/        # Migration history
├── docs/                   # Documentation
└── public/                 # Static assets
```

### Key Patterns

**Frontend:**
- React 18 with functional components and hooks
- Zustand for state management (one store per domain)
- TailwindCSS for styling
- @dnd-kit for drag-and-drop

**Backend:**
- Express.js with modular route files
- Service layer pattern (routes → services → database)
- Prisma ORM for database access
- JWT authentication with refresh tokens

**Database:**
- PostgreSQL with Prisma
- Multi-tenant architecture (teamId foreign keys)
- Soft deletes where appropriate

---

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for new components (gradual migration)
- Prefer functional components with hooks
- Use named exports for components
- Destructure props at function signature

```typescript
// Good
export function AthleteCard({ athlete, onSelect }: AthleteCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  // ...
}

// Avoid
export default function AthleteCard(props) {
  const isHovered = props.isHovered;
  // ...
}
```

### React Best Practices

- Use `useMemo` and `useCallback` for expensive operations
- Avoid inline object/array creation in JSX
- Keep components focused (single responsibility)
- Extract reusable logic into custom hooks

```typescript
// Good - memoized callback
const handleClick = useCallback((id: string) => {
  onSelect(id);
}, [onSelect]);

// Avoid - creates new function each render
<Button onClick={() => onSelect(id)} />
```

### Styling

- Use Tailwind utility classes
- Follow the Precision Instrument design system
- Use design tokens from `src/theme/`
- Avoid inline styles except for dynamic values

```tsx
// Good - Tailwind classes
<div className="bg-void-deep text-text-primary p-4 rounded-lg">

// Avoid - inline styles
<div style={{ backgroundColor: '#08080A', color: '#F4F4F5' }}>
```

### API Routes

- Use consistent response format
- Validate input with express-validator
- Handle errors with try/catch
- Log errors with Winston

```javascript
// Good
router.post('/athletes', authenticate, async (req, res) => {
  try {
    const athlete = await athleteService.create(req.body, req.user.teamId);
    res.status(201).json({ success: true, data: athlete });
  } catch (error) {
    logger.error('Failed to create athlete', { error, userId: req.user.id });
    res.status(500).json({ success: false, error: 'Failed to create athlete' });
  }
});
```

### Database

- Use Prisma for all database operations
- Include proper indexes for query performance
- Validate teamId on all queries (multi-tenant security)
- Use transactions for multi-step operations

```javascript
// Good - team isolation
const athletes = await prisma.athlete.findMany({
  where: { teamId: req.user.teamId },  // Always filter by team
});

// Avoid - no team isolation (security risk!)
const athletes = await prisma.athlete.findMany();
```

---

## Making Changes

### Branch Naming

Use descriptive branch names:

```
feature/add-lineup-export      # New feature
fix/athlete-search-crash       # Bug fix
docs/api-reference             # Documentation
refactor/extract-boat-config   # Code refactoring
```

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

Examples:
```
feat(lineup): add CSV export functionality
fix(auth): handle expired refresh tokens correctly
docs(api): document athlete endpoints
refactor(store): extract common fetch logic
```

### Testing

Before submitting:

```bash
# Run linter
npm run lint

# Run type checking
npm run typecheck

# Run tests
npm test

# Build to verify no errors
npm run build
```

---

## Pull Request Process

### 1. Prepare Your Changes

- Ensure all tests pass
- Update documentation if needed
- Add tests for new functionality
- Follow coding standards

### 2. Create Pull Request

- Fill out the PR template completely
- Link related issues
- Add screenshots for UI changes
- Request review from maintainers

### 3. PR Template

```markdown
## Summary
Brief description of changes

## Changes
- List of specific changes

## Testing
- How to test the changes
- Test cases covered

## Screenshots
(if applicable)

## Related Issues
Closes #123
```

### 4. Review Process

- Maintainers will review within 3-5 business days
- Address feedback promptly
- Keep PR focused and small when possible
- Squash commits before merge

---

## Issue Guidelines

### Bug Reports

Include:
- **Description**: What went wrong?
- **Steps to reproduce**: How to trigger the bug
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: Browser, OS, Node version
- **Screenshots/logs**: If applicable

### Feature Requests

Include:
- **Problem statement**: What problem does this solve?
- **Proposed solution**: How should it work?
- **Alternatives considered**: Other approaches
- **Use case**: Who benefits and how?

### Good First Issues

Look for issues labeled `good first issue` for beginner-friendly tasks. These typically:
- Have clear requirements
- Touch limited code areas
- Include guidance in comments

---

## Questions?

- Check existing [documentation](docs/)
- Search [existing issues](https://github.com/swdrow/RowLab/issues)
- Open a [discussion](https://github.com/swdrow/RowLab/discussions)

---

Thank you for contributing to RowLab!
