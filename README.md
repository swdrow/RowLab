<p align="center">
  <img src="public/images/logo.svg" alt="RowLab Logo" width="80" height="80">
</p>

<h1 align="center">RowLab</h1>

<p align="center">
  <strong>Data-Driven Lineup Optimization for Competitive Rowing</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#roadmap">Roadmap</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node">
  <img src="https://img.shields.io/badge/react-18-61dafb.svg" alt="React">
</p>

---

## The Problem

Rowing coaches spend countless hours creating boat lineups based on:

- **Institutional knowledge** that walks out the door with departing coaches
- **Erg scores** that don't account for on-water performance
- **Gut feel** and politics rather than data
- **Spreadsheets** that can't capture complex athlete relationships

The result? Suboptimal boat speed, inconsistent performance, and no systematic way to improve.

## The Solution

**RowLab** is a modern SaaS platform that transforms how rowing coaches build lineups and analyze team performance.

### Core Capabilities

| Capability | Description |
|------------|-------------|
| **Visual Lineup Builder** | Drag-and-drop interface for assigning athletes to seats across all boat classes (1x to 8+) |
| **Erg Analytics** | Track 2k, 6k, and other test results with trend visualization and Concept2 integration |
| **Seat Racing System** | Record racing pieces with Elo-based ranking algorithm for objective athlete comparisons |
| **AI Recommendations** | Local LLM-powered lineup suggestions using genetic algorithm optimization |
| **Team Benchmarking** | Compare boat speed estimates against competitors |
| **Real-time Collaboration** | Multi-user team management with role-based access control |

---

## Features

### Lineup Builder

<img src="screenshot-landing.png" alt="RowLab Lineup Builder" width="100%">

Build optimized lineups with an intuitive drag-and-drop interface:

- **Multi-boat support**: 8+, 4+, 4-, 2x, 1x configurations
- **Side preferences**: Port, starboard, or both with visual indicators
- **Athlete swapping**: Click two seats to swap athletes instantly
- **Save & export**: Persist lineups locally or export as JSON
- **Search & filter**: Find athletes quickly with real-time filtering

### Performance Analytics

Track and analyze every dimension of athlete performance:

- **Erg score tracking**: Record 2k, 6k, 500m, and 30-minute test results
- **Concept2 integration**: OAuth sync with Concept2 logbook for automatic workout import
- **Trend visualization**: Chart performance over time with Recharts
- **Side distribution**: Analyze port/starboard balance across lineups
- **Telemetry import**: Support for Empower, Peach, and NK sensor data

### Seat Racing & Rankings

Objective athlete evaluation through head-to-head racing:

- **Piece recording**: Log seat race sessions with multiple boats
- **Elo ratings**: Chess-inspired ranking system adapted for rowing
- **Margin analysis**: Calculate true speed differences accounting for conditions
- **Historical tracking**: View rating changes over the season
- **Combined scoring**: Weight erg data, seat racing, and telemetry into unified rankings

### AI-Powered Optimization

Leverage machine learning for lineup recommendations:

- **Genetic algorithm**: Optimize lineups against multiple constraints
- **Side balancing**: Ensure proper port/starboard distribution
- **Constraint handling**: Respect athlete preferences and capabilities
- **Speed prediction**: Estimate boat speed based on athlete combinations
- **Local LLM**: Ollama integration for privacy-preserving AI assistance

---

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+ (or use Docker)
- **Ollama** (optional, for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/swdrow/RowLab.git
cd RowLab

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and secrets

# Run database migrations
npx prisma migrate deploy
npx prisma generate

# Start development servers
npm run dev:full
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Access the application
open http://localhost:3001
```

See [docs/self-hosted-setup.md](docs/self-hosted-setup.md) for detailed deployment instructions.

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework with hooks and concurrent features |
| **Vite** | Fast development server with HMR |
| **TailwindCSS** | Utility-first styling with custom design system |
| **Zustand** | Lightweight state management |
| **@dnd-kit** | Accessible drag-and-drop |
| **Framer Motion** | Smooth animations and transitions |
| **Recharts** | Data visualization |
| **Three.js** | 3D boat visualization |

### Backend

| Technology | Purpose |
|------------|---------|
| **Express.js** | REST API framework |
| **PostgreSQL** | Primary database |
| **Prisma** | Type-safe ORM with migrations |
| **JWT** | Authentication with refresh tokens |
| **Helmet** | Security headers |
| **Ollama** | Local LLM inference |
| **Stripe** | Subscription billing |

### Design System: Precision Instrument

RowLab uses a custom "Precision Instrument" design system inspired by Linear and Raycast:

- **Void-deep backgrounds** (#08080A) for focused interfaces
- **Blade blue accent** (#0070F3) for primary actions
- **Port/Starboard semantics** (red/green) following maritime conventions
- **Glass morphism** with subtle backdrop blur
- **Spotlight hover effects** for interactive elements

---

## Documentation

| Document | Description |
|----------|-------------|
| [**API Reference**](docs/api/README.md) | Complete REST API documentation |
| [**Database Schema**](docs/database/README.md) | Prisma models and relationships |
| [**Component Guide**](docs/components/README.md) | React component documentation |
| [**Services Guide**](docs/services/README.md) | Backend service documentation |
| [**Self-Hosted Setup**](docs/self-hosted-setup.md) | Deployment instructions |

---

## Project Structure

```
RowLab/
├── src/                    # React frontend
│   ├── components/         # UI components
│   │   ├── ui/            # Base design system
│   │   ├── domain/        # Domain-specific (LineupBoard)
│   │   └── compound/      # Composite components
│   ├── pages/             # Route pages
│   ├── store/             # Zustand state stores
│   └── theme/             # Design tokens
├── server/                 # Express backend
│   ├── routes/            # API endpoints
│   ├── services/          # Business logic
│   └── middleware/        # Auth, rate limiting
├── prisma/                 # Database schema
│   ├── schema.prisma      # Model definitions
│   └── migrations/        # Version history
├── docs/                   # Documentation
└── public/                 # Static assets
```

---

## Roadmap

### Current Focus (v2.x)

- [x] Precision Instrument UI redesign
- [x] Multi-tenant team management
- [x] Seat racing with Elo ratings
- [x] Concept2 OAuth integration
- [ ] Stripe billing implementation
- [ ] Production security hardening

### Near Term (v3.0)

- [ ] Real-time collaboration (WebSockets)
- [ ] Mobile-responsive optimization
- [ ] Advanced telemetry import
- [ ] Race prediction ML model

### Future Vision

- [ ] React Native mobile app
- [ ] Video analysis integration
- [ ] Recruitment analytics
- [ ] Integration marketplace

See [ROADMAP.md](ROADMAP.md) for detailed planning.

---

## Development

### Scripts

```bash
# Development
npm run dev:full     # Start frontend + backend
npm run dev:tmux     # Persistent tmux session
npm stop             # Stop all servers

# Database
npm run db:migrate   # Apply migrations
npm run db:seed      # Seed test data
npm run db:studio    # Open Prisma Studio

# Production
npm run build        # Build for production
npm start            # Run production server

# Quality
npm run lint         # Run ESLint
npm run test         # Run tests
npm run typecheck    # TypeScript check
```

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/rowlab

# Authentication
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# AI (optional)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Billing (optional)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Concept2 (optional)
CONCEPT2_CLIENT_ID=...
CONCEPT2_CLIENT_SECRET=...
```

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ways to Contribute

- **Bug Reports**: Open an issue with reproduction steps
- **Feature Requests**: Describe the use case and proposed solution
- **Code**: Submit a PR following our coding standards
- **Documentation**: Improve docs, add examples, fix typos

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Market Context

### Target Audience

- **Collegiate programs**: 250+ NCAA/ACRA programs nationally
- **Club teams**: 2,000+ competitive club programs
- **High school**: Growing varsity programs

### Why RowLab?

| Traditional Approach | RowLab |
|---------------------|--------|
| Spreadsheets and paper | Modern drag-and-drop interface |
| Gut-feel decisions | Data-driven recommendations |
| Lost knowledge when coaches leave | Persistent, searchable history |
| No objective athlete comparisons | Elo-based seat racing rankings |
| Manual data entry | Concept2 sync, telemetry import |

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- **Concept2** for erg data API
- **Ollama** for local LLM inference
- **@dnd-kit** for accessible drag-and-drop
- **Linear** and **Raycast** for design inspiration

---

<p align="center">
  <strong>RowLab</strong> — Built for coaches who demand precision
</p>

<p align="center">
  <a href="https://github.com/swdrow/RowLab">GitHub</a> •
  <a href="docs/README.md">Documentation</a> •
  <a href="ROADMAP.md">Roadmap</a>
</p>
