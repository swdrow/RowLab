# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| 1.x     | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in RowLab, please report it responsibly.

### How to Report

1. **Do not** open a public GitHub issue for security vulnerabilities
2. Email security concerns to: security@rowlab.app (or the maintainer's email)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 1 week
- **Resolution timeline**: Depends on severity
  - Critical: 24-72 hours
  - High: 1-2 weeks
  - Medium: 2-4 weeks
  - Low: Next release

### Responsible Disclosure

We request that you:
- Give us reasonable time to fix the issue before public disclosure
- Not access or modify other users' data
- Act in good faith

We commit to:
- Acknowledge your report promptly
- Keep you informed of progress
- Credit you in the fix (unless you prefer anonymity)

## Security Measures

### Authentication

- JWT tokens with short expiration (15 minutes)
- Secure refresh token rotation
- Password hashing with bcrypt (12 rounds)
- Rate limiting on authentication endpoints

### Authorization

- Role-based access control (OWNER, COACH, ATHLETE)
- Multi-tenant isolation via teamId verification
- API endpoint authorization middleware

### Data Protection

- HTTPS-only in production
- Helmet security headers
- CORS restrictions
- Input validation on all endpoints
- SQL injection prevention via Prisma ORM

### Infrastructure

- Environment variables for secrets
- No secrets in version control
- Database encryption at rest (PostgreSQL)
- Regular dependency updates

## Known Security Considerations

### Current Priorities

See [ROADMAP.md](ROADMAP.md) for P0 security issues being addressed:

1. Team ownership verification on telemetry routes
2. Null checks before Stripe API calls
3. Input validation gaps

### Security Best Practices for Self-Hosting

If self-hosting RowLab:

1. Use strong, unique secrets for JWT_SECRET and JWT_REFRESH_SECRET
2. Run behind a reverse proxy (nginx) with HTTPS
3. Keep dependencies updated (`npm audit`)
4. Enable PostgreSQL encryption
5. Use firewall rules to restrict database access
6. Regularly backup your database

## Dependency Security

We use:
- `npm audit` for vulnerability scanning
- Dependabot for automated updates
- Regular manual reviews

To check for vulnerabilities:
```bash
npm audit
```

## Questions?

For general security questions (not vulnerabilities), open a GitHub discussion.
