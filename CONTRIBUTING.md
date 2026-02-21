# Contributing to oarbit

Thank you for your interest in contributing to oarbit! We welcome contributions from the community and are grateful for your support in making oarbit better for athletes and coaches worldwide.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Contributing Code](#contributing-code)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Community](#community)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please be respectful, inclusive, and considerate in all interactions. We are committed to providing a welcoming and harassment-free experience for everyone.

## Getting Started

Before you begin:

- Ensure you have [Node.js 18+](https://nodejs.org/) installed
- Familiarize yourself with [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [TanStack Router](https://tanstack.com/router/latest), and [Express.js](https://expressjs.com/)
- Read through the [README](README.md) to understand the project's purpose and architecture
- Check the [existing issues](https://github.com/swdrow/RowLab/issues) to see if your contribution is already being discussed
- For v4.0 work, familiarize yourself with our design system in `.claude/design-standard.md`

## How to Contribute

### Reporting Bugs

If you find a bug in oarbit, please help us fix it by submitting a detailed bug report.

**Before submitting a bug report:**

- Check the [existing issues](https://github.com/swdrow/RowLab/issues) to ensure the bug hasn't been reported already
- Verify you're using the latest version of oarbit
- Collect information about your environment (OS, Node version, browser version)

**How to submit a bug report:**

1. Click "New Issue" in the [GitHub Issues](https://github.com/swdrow/RowLab/issues) tab
2. Select the "Bug Report" template
3. Fill out all sections of the template with as much detail as possible
4. Include:
   - A clear, descriptive title
   - Steps to reproduce the issue
   - Expected vs. actual behavior
   - Screenshots or error messages
   - Your environment details

### Suggesting Features

We love hearing ideas for new features and improvements!

**Before suggesting a feature:**

- Check [existing issues](https://github.com/swdrow/RowLab/issues) and the [roadmap](.planning/ROADMAP.md) to see if it's already planned
- Consider whether the feature aligns with oarbit's core mission of data-driven rowing for athletes and coaches

**How to suggest a feature:**

1. Click "New Issue" in the [GitHub Issues](https://github.com/swdrow/RowLab/issues) tab
2. Select the "Feature Request" template
3. Provide:
   - A clear, descriptive title
   - The problem your feature would solve
   - A detailed description of the proposed solution
   - Any alternative solutions you've considered
   - Mockups or examples (if applicable)

### Contributing Code

We welcome code contributions! Whether it's fixing a bug, implementing a feature, or improving documentation, your help is appreciated.

**Types of contributions we're looking for:**

- Bug fixes
- Feature implementations (check the roadmap or open issues)
- Performance improvements
- Documentation improvements
- Test coverage improvements
- UI/UX enhancements

## Development Setup

### Prerequisites

- **Node.js** 18 or higher
- **PostgreSQL** 14 or higher (or use Docker)
- **Git** for version control
- **Ollama** (optional, for AI features)
- Familiarity with React 19, TanStack Router, and Tailwind CSS v4 for v4.0 work

### Setup Steps

1. **Fork the repository** on GitHub

2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/RowLab.git
   cd RowLab
   ```

3. **Add the upstream remote:**

   ```bash
   git remote add upstream https://github.com/swdrow/RowLab.git
   ```

4. **Install dependencies:**

   ```bash
   npm install
   ```

5. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Random secret for JWT tokens
   - `JWT_REFRESH_SECRET` - Random secret for refresh tokens
   - Optional: Ollama, Stripe, Concept2 credentials

6. **Set up the database:**

   ```bash
   # Run migrations
   npx prisma migrate deploy
   npx prisma generate

   # Seed test data (optional)
   npm run db:seed
   ```

7. **Start the development servers:**

   ```bash
   npm run dev:full
   ```

   This starts both the frontend (port 3001) and backend (port 8000).

8. **Verify the setup:**

   Open [http://localhost:3001](http://localhost:3001) in your browser.

### Development Scripts

```bash
# Development
npm run dev          # Frontend only (Vite dev server)
npm run server       # Backend only (Express API)
npm run dev:full     # Both frontend and backend
npm run dev:tmux     # Persistent tmux session

# Database
npm run db:migrate   # Run new migrations
npm run db:seed      # Seed test data
npm run db:reset     # Reset database and reseed
npm run db:studio    # Open Prisma Studio GUI

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check formatting without changes
npm run typecheck    # TypeScript type checking
npm run validate     # Run typecheck + lint + tests

# Testing
npm test             # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Generate coverage report
npm run test:ui      # Open Vitest UI

# Production
npm run build        # Build for production
npm start            # Run production server
```

## Coding Standards

oarbit follows strict coding standards to maintain code quality and consistency.

### TypeScript

- Use TypeScript for all new code (`.ts` or `.tsx` files)
- Define types explicitly, avoid `any` where possible
- Use interfaces for object shapes, types for unions/intersections
- Leverage Prisma types for database models

### Code Style

We use **Prettier** and **ESLint** to enforce consistent code style.

**Prettier Configuration:**

- Semi-colons: Yes
- Single quotes: Yes
- Tab width: 2 spaces
- Trailing commas: ES5
- Print width: 100 characters
- See [.prettierrc](.prettierrc) for full config

**ESLint Rules:**

- Extends: `eslint:recommended`, `@typescript-eslint/recommended`, `react/recommended`, `prettier`
- React hooks rules enforced
- No console.log (use console.warn or console.error)
- No unused variables (except prefixed with `_`)
- See [.eslintrc.cjs](.eslintrc.cjs) for full config

**Before committing:**

```bash
npm run format       # Auto-format your code
npm run lint:fix     # Auto-fix linting issues
npm run typecheck    # Verify TypeScript types
```

### File Naming Conventions

- **Components:** PascalCase (e.g., `LineupBoard.tsx`, `AthleteCard.tsx`)
- **Utilities:** camelCase (e.g., `formatTime.ts`, `apiClient.ts`)
- **Types:** PascalCase (e.g., `Athlete.ts`, `LineupTypes.ts`)
- **Tests:** Same as file being tested with `.test.ts` or `.spec.ts` suffix

### Component Structure

Follow this structure for React components:

```tsx
// 1. Imports (React, types, external libraries, internal components)
import { useState } from 'react';
import type { Athlete } from '../types/Athlete';
import { Button } from './ui/Button';

// 2. Type definitions
interface AthleteCardProps {
  athlete: Athlete;
  onSelect: (id: string) => void;
}

// 3. Component
export function AthleteCard({ athlete, onSelect }: AthleteCardProps) {
  // Hooks
  const [isHovered, setIsHovered] = useState(false);

  // Event handlers
  const handleClick = () => {
    onSelect(athlete.id);
  };

  // Render
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {athlete.name}
    </div>
  );
}
```

### Design System

oarbit (v4.0) uses Tailwind CSS v4 with a custom "Precision Instrument" design system:

- Use existing components from `src/components/ui/` where possible
- Follow the design tokens and CSS variables in `.claude/design-standard.md`
- Maintain the dark theme aesthetic with glass card components
- Use port/starboard color semantics (red/green) for rowing context
- All animations use spring physics via `src/v2/lib/animations.ts`
- Use skeleton loaders for loading states, never spinners

### API Design

- Follow RESTful conventions
- Use proper HTTP status codes
- Return consistent error formats
- Validate input with express-validator
- Use Zod for runtime type validation where appropriate

## Testing Requirements

All new features and bug fixes should include tests.

### Test Coverage

- **Minimum requirement:** 80% coverage for new code
- Focus on testing business logic and edge cases
- Test user interactions and component rendering
- Mock external dependencies (database, APIs)

### Testing Tools

- **Vitest:** Test runner and assertion library
- **@testing-library/react:** Component testing utilities
- **@testing-library/user-event:** Simulating user interactions

### Writing Tests

```typescript
// Example: Component test
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AthleteCard } from './AthleteCard';

describe('AthleteCard', () => {
  it('should call onSelect when clicked', async () => {
    const onSelect = vi.fn();
    const athlete = { id: '1', name: 'John Doe', side: 'port' };

    render(<AthleteCard athlete={athlete} onSelect={onSelect} />);

    await userEvent.click(screen.getByText('John Doe'));

    expect(onSelect).toHaveBeenCalledWith('1');
  });
});
```

### Running Tests

```bash
npm test              # Watch mode (recommended during development)
npm run test:run      # Run once
npm run test:coverage # Check coverage
npm run test:ui       # Visual test UI
```

## Pull Request Process

### Before Submitting a PR

1. **Create a feature branch:**

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes:**

   - Write clean, well-documented code
   - Follow coding standards
   - Add tests for new functionality
   - Update documentation if needed

3. **Run the validation suite:**

   ```bash
   npm run validate
   ```

   This runs type checking, linting, and tests. All must pass.

4. **Commit your changes** (see [Commit Message Guidelines](#commit-message-guidelines))

5. **Sync with upstream:**

   ```bash
   git fetch upstream
   git rebase upstream/master
   ```

6. **Push to your fork:**

   ```bash
   git push origin feature/your-feature-name
   ```

### Submitting the PR

1. Go to the [oarbit repository](https://github.com/swdrow/RowLab) on GitHub
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill out the PR template completely:
   - Describe what changes you made and why
   - Link related issues (e.g., "Closes #123")
   - Describe how you tested the changes
   - Add screenshots for UI changes
   - Note any breaking changes

### PR Review Process

- A maintainer will review your PR within 3-5 business days
- Address any requested changes promptly
- Keep the PR focused on a single feature or fix
- Be responsive to feedback and questions
- Once approved, a maintainer will merge your PR

### PR Checklist

Before submitting, ensure:

- [ ] Code follows the style guidelines
- [ ] Tests pass (`npm run test:run`)
- [ ] Linting passes (`npm run lint`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] New features include tests
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] PR description is complete

## Commit Message Guidelines

oarbit uses [Conventional Commits](https://www.conventionalcommits.org/) for clear, semantic commit history.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring (no feature change or bug fix)
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, build config)
- `ci`: CI/CD changes

### Scopes (optional)

Use scopes to indicate which part of the codebase is affected:

- `lineup`: Lineup builder features
- `athletes`: Athlete management
- `ergs`: Erg score tracking
- `seat-racing`: Seat racing system
- `analytics`: Performance analytics
- `api`: Backend API
- `ui`: UI components
- `db`: Database schema/migrations
- `auth`: Authentication

### Examples

```bash
# Feature
git commit -m "feat(lineup): add ability to swap athletes between seats"

# Bug fix
git commit -m "fix(ergs): correct 2k time calculation for sub-6 minute scores"

# Documentation
git commit -m "docs: add deployment instructions for Docker"

# Refactoring
git commit -m "refactor(api): simplify athlete query logic"

# With body
git commit -m "feat(seat-racing): implement Elo rating algorithm

- Add EloService for rating calculations
- Update seat race results to compute new ratings
- Display rating changes in UI with delta indicators"

# Breaking change
git commit -m "feat(api): change lineup endpoint response format

BREAKING CHANGE: lineup endpoint now returns nested boat objects instead of flat structure"
```

### Best Practices

- Use imperative mood ("add feature" not "added feature")
- Keep the subject line under 72 characters
- Capitalize the subject line
- Don't end the subject with a period
- Use the body to explain *what* and *why*, not *how*
- Reference issues in the footer (e.g., "Closes #123")

## Community

### Getting Help

- **Documentation:** Check [docs/](docs/) for detailed guides
- **Issues:** Search [existing issues](https://github.com/swdrow/RowLab/issues) or open a new one
- **Discussions:** Use GitHub Discussions for questions and ideas

### Recognition

All contributors will be:

- Listed in the project's contributors list
- Acknowledged in release notes for significant contributions
- Welcomed as part of the oarbit community

### License

By contributing to oarbit, you agree that your contributions will be licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

**Thank you for contributing to oarbit!** Your efforts help coaches and athletes achieve better results through data-driven decisions.
