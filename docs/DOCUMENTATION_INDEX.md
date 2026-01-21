# RowLab Documentation Index

Complete technical documentation for RowLab v2.0 - A multi-tenant rowing team management platform.

## Documentation Structure

```
docs/
├── README.md                          # Main documentation entry point
├── DOCUMENTATION_INDEX.md             # This file
│
├── api/                               # REST API Documentation
│   ├── README.md                      # API overview, standards, conventions
│   ├── authentication.md              # Auth endpoints and JWT flow
│   └── athletes.md                    # Athletes API reference
│
├── database/                          # Database Schema
│   └── README.md                      # Schema overview, Prisma, migrations
│
├── services/                          # Backend Services
│   └── README.md                      # Service layer architecture
│
└── components/                        # React Components
    └── README.md                      # Component architecture, patterns

```

## Quick Navigation

### For New Developers
1. Start with [Main README](./README.md) - Project overview and setup
2. Review [System Architecture](./README.md#key-concepts)
3. Set up local environment following [Quick Start](./README.md#quick-start-for-developers)
4. Explore [API Documentation](./api/README.md) to understand endpoints
5. Review [Database Schema](./database/README.md) for data models

### For Frontend Developers
1. [Component Documentation](./components/README.md) - React architecture
2. [Design System](./components/README.md#design-system) - UI components and patterns
3. [State Management](./components/README.md#state-management) - Zustand stores
4. [API Documentation](./api/README.md) - Backend integration

### For Backend Developers
1. [Services Documentation](./services/README.md) - Business logic layer
2. [Database Schema](./database/README.md) - Data models and relationships
3. [API Documentation](./api/README.md) - Route handlers and validation
4. [Authentication](./api/authentication.md) - JWT and security

### For API Consumers
1. [API Overview](./api/README.md) - Base URL, versioning, conventions
2. [Authentication API](./api/authentication.md) - Login, tokens, permissions
3. [Athletes API](./api/athletes.md) - Manage athlete profiles
4. [API Standards](./api/README.md#response-format) - Response formats, errors, pagination

## Documentation Coverage

### ✅ Completed Documentation

#### Main Documentation
- [x] [README.md](./README.md) - Complete project overview
  - Quick start guide
  - Project structure
  - Key concepts (multi-tenancy, RBAC, data models)
  - API standards overview
  - Development workflow

#### API Documentation (api/)
- [x] [API README](./api/README.md) - Comprehensive API guide
  - Base URL and versioning
  - Authentication requirements
  - Request/response formats
  - Error codes and handling
  - Rate limiting
  - Pagination and filtering
  - Complete endpoint index

- [x] [Authentication API](./api/authentication.md) - Full auth documentation
  - Register, login, logout endpoints
  - Token refresh flow
  - Team switching
  - Middleware documentation
  - Security considerations
  - Client implementation examples

- [x] [Athletes API](./api/athletes.md) - Complete athletes endpoint reference
  - List, get, create, update, delete
  - Search and filtering
  - Bulk import
  - Data model
  - Business rules
  - Usage examples

#### Database Documentation (database/)
- [x] [Database README](./database/README.md) - Comprehensive schema guide
  - Technology stack (PostgreSQL + Prisma)
  - Schema organization (28 models across 8 domains)
  - Multi-tenancy design
  - Entity relationships
  - Indexes and constraints
  - Migration management
  - Performance monitoring
  - Security considerations

#### Services Documentation (services/)
- [x] [Services README](./services/README.md) - Service layer architecture
  - Service layer pattern
  - Design principles
  - Service categories (11 service types)
  - Common patterns (error handling, team isolation, transactions)
  - Testing strategies
  - Performance optimization

#### Component Documentation (components/)
- [x] [Components README](./components/README.md) - Frontend architecture
  - Technology stack (React 18, Zustand, Tailwind)
  - Project structure
  - Precision Instrument design system
  - Component categories
  - State management patterns
  - Custom hooks
  - Performance optimization
  - Accessibility guidelines

### 📝 Additional Documentation Needed

The following documentation files are referenced but not yet created. These can be added as the project evolves:

#### API Documentation (api/)
- [ ] erg-tests.md - Erg test management endpoints
- [ ] lineups.md - Lineup builder endpoints
- [ ] seat-racing.md - Seat racing session endpoints
- [ ] racing.md - Regatta and race endpoints
- [ ] teams.md - Team management and invitations
- [ ] subscriptions.md - Billing and Stripe integration
- [ ] webhooks.md - Webhook event documentation

#### Database Documentation (database/)
- [ ] core-models.md - User, Team, TeamMember detailed docs
- [ ] athlete-models.md - Athlete, Concept2Auth
- [ ] performance-models.md - ErgTest, Workout, Telemetry
- [ ] lineup-models.md - Lineup, Shell, BoatConfig
- [ ] racing-models.md - Regatta, Race, RaceResult
- [ ] seat-racing-models.md - SeatRaceSession, ELO ratings
- [ ] communication-models.md - Announcements
- [ ] billing-models.md - Subscriptions, Stripe
- [ ] migrations.md - Migration history and procedures

#### Services Documentation (services/)
- [ ] auth-service.md - Authentication service details
- [ ] token-service.md - JWT token management
- [ ] athlete-service.md - Athlete business logic
- [ ] erg-test-service.md - Erg test operations
- [ ] lineup-service.md - Lineup management
- [ ] elo-rating-service.md - ELO calculation algorithms
- [ ] margin-calculation-service.md - Performance differentials
- [ ] ai-services.md - Claude API integration
- [ ] csv-import-service.md - Bulk import logic
- [ ] concept2-service.md - Concept2 API integration

#### Component Documentation (components/)
- [ ] design-system.md - Complete design system guide
- [ ] athletes.md - Athlete component details
- [ ] lineups.md - Lineup builder components
- [ ] performance.md - Performance visualization
- [ ] boat-display.md - Boat visualization components
- [ ] state-management.md - Zustand store details

#### Architecture Documentation (architecture/)
- [ ] system.md - System architecture overview
- [ ] multi-tenancy.md - Multi-tenant implementation
- [ ] authentication.md - Auth architecture
- [ ] security.md - Security best practices
- [ ] performance.md - Performance optimization strategies

#### Additional Documentation
- [ ] CHANGELOG.md - Version history
- [ ] MIGRATION.md - Version migration guides
- [ ] CONTRIBUTING.md - Contribution guidelines
- [ ] DEPLOYMENT.md - Deployment procedures

## Documentation Statistics

### Current Coverage
- **Total Documentation Files**: 8 created
- **Lines of Documentation**: ~4,500 lines
- **API Endpoints Documented**: 12+ endpoints
- **Database Models Covered**: 28 models (overview level)
- **Services Documented**: 11 service categories
- **Components Documented**: 10+ component groups

### Documentation Quality
- ✅ Code examples included
- ✅ Request/response samples
- ✅ Error handling documented
- ✅ Business rules explained
- ✅ Usage examples provided
- ✅ Testing guidance included

## How to Use This Documentation

### Reading Path for Different Roles

**New Developer (Full Stack)**
```
1. docs/README.md (30 min)
2. docs/api/README.md (20 min)
3. docs/database/README.md (20 min)
4. docs/services/README.md (15 min)
5. docs/components/README.md (20 min)
Total: ~2 hours
```

**Frontend Engineer**
```
1. docs/README.md (focus on Quick Start)
2. docs/components/README.md
3. docs/api/README.md (client perspective)
4. docs/api/athletes.md (example implementation)
Total: ~1.5 hours
```

**Backend Engineer**
```
1. docs/README.md (focus on Architecture)
2. docs/database/README.md
3. docs/services/README.md
4. docs/api/authentication.md
Total: ~1.5 hours
```

**DevOps/Infrastructure**
```
1. docs/README.md (focus on Deployment)
2. docs/database/README.md (connection management)
3. docs/api/README.md (security, rate limiting)
Total: ~1 hour
```

### Finding Specific Information

**"How do I authenticate API requests?"**
→ [API Authentication](./api/authentication.md)

**"What's the database schema?"**
→ [Database Schema](./database/README.md)

**"How do I create an athlete?"**
→ [Athletes API](./api/athletes.md#create-athlete)

**"What's the multi-tenant architecture?"**
→ [Main README - Multi-Tenancy](./README.md#multi-tenant-architecture)

**"How do I build a custom component?"**
→ [Components Documentation](./components/README.md#component-patterns)

**"Where's the service layer logic?"**
→ [Services Documentation](./services/README.md)

## Contributing to Documentation

### Documentation Standards

1. **Format**: Markdown (.md)
2. **Structure**: Clear headings, table of contents for long docs
3. **Code Examples**: Include request/response samples
4. **Completeness**: Cover happy path + error cases
5. **Maintenance**: Update docs when code changes

### Adding New Documentation

1. Follow the existing structure in `docs/`
2. Update this index file
3. Cross-reference related documentation
4. Include "Last Updated" date
5. Add examples for complex topics

### Documentation Style Guide

- Use clear, concise language
- Include practical examples
- Document the "why" not just the "what"
- Use tables for structured data
- Include error cases and edge conditions
- Provide code snippets for common tasks
- Link to related documentation

## Maintenance

### Regular Updates Needed
- [ ] API endpoint changes
- [ ] New features and components
- [ ] Database schema migrations
- [ ] Breaking changes and deprecations
- [ ] Security updates
- [ ] Performance optimizations

### Documentation Review Schedule
- **Weekly**: Update for new features
- **Monthly**: Review accuracy and completeness
- **Quarterly**: Major documentation overhaul if needed
- **Releases**: Update version-specific docs

## Support & Feedback

### Reporting Documentation Issues
- Missing information
- Outdated examples
- Broken links
- Unclear explanations

**Where to Report:**
- GitHub Issues with label `documentation`
- Pull requests with corrections welcome

### Requesting Documentation
- Open GitHub issue with label `docs-request`
- Describe what documentation is needed
- Explain use case and audience

## Next Steps

### Priority Documentation Tasks

1. **High Priority** (Next Sprint):
   - [ ] Complete remaining API endpoint docs (erg-tests, lineups, seat-racing)
   - [ ] Database model detail pages
   - [ ] Deployment guide

2. **Medium Priority** (Next Month):
   - [ ] Service layer detail docs
   - [ ] Component usage examples
   - [ ] Testing documentation

3. **Low Priority** (Future):
   - [ ] Video tutorials
   - [ ] Interactive API playground
   - [ ] Architecture diagrams (Mermaid)

### Documentation Roadmap

**v2.1**: Complete API and database documentation
**v2.2**: Add architecture guides and diagrams
**v2.3**: Create video tutorials and examples
**v2.4**: Interactive documentation site

---

## Summary

This documentation provides a solid foundation for:
- ✅ Understanding RowLab's architecture
- ✅ Getting started with development
- ✅ Integrating with the API
- ✅ Understanding the database schema
- ✅ Building React components
- ✅ Implementing service layer logic

**Total Documentation Created**: 8 comprehensive files (~4,500 lines)

**Documentation Quality**: Production-ready with examples, error handling, and best practices

**Next Steps**: Expand API endpoint coverage and add detailed service/component docs as project evolves

---

**Documentation Version**: 1.0
**Last Updated**: 2026-01-19
**Project Version**: 2.0.0
