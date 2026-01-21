# Phase 8: Scale Implementation Plan

## Overview
Implement scaling features: Docker packaging, subscription billing, and mobile-ready API enhancements.

**Note**: iOS app and PM5 Bluetooth are tracked separately in the mobile roadmap.

---

## Tasks

### Task 1: Docker Configuration
**Files**: `Dockerfile`, `docker-compose.yml`, `.dockerignore`

#### Dockerfile (Multi-stage build)
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3002
CMD ["node", "server/index.js"]
```

#### docker-compose.yml
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3002:3002"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/rowlab
      - NODE_ENV=production
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=rowlab
      - POSTGRES_PASSWORD=password

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

**Verification**: `docker-compose build && docker-compose up -d`

---

### Task 2: Environment Configuration
**File**: `server/config/index.js`

Centralized configuration with validation:
- Database URL
- Redis URL
- JWT secrets
- Stripe keys
- Email provider keys
- Feature flags

**Verification**: Config loads without errors

---

### Task 3: Subscription Models (Prisma)
**File**: `prisma/schema.prisma`

Add subscription-related models:

```prisma
model Subscription {
  id                  String   @id @default(uuid())
  teamId              String   @unique
  stripeCustomerId    String?  @unique
  stripeSubscriptionId String? @unique
  plan                String   @default("free") // free, starter, pro, enterprise
  status              String   @default("active") // active, past_due, canceled, trialing
  currentPeriodStart  DateTime?
  currentPeriodEnd    DateTime?
  cancelAtPeriodEnd   Boolean  @default(false)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@map("subscriptions")
}

model SubscriptionEvent {
  id              String   @id @default(uuid())
  subscriptionId  String
  eventType       String   // created, updated, canceled, payment_failed
  stripeEventId   String?  @unique
  data            Json?
  createdAt       DateTime @default(now())

  @@map("subscription_events")
}
```

**Verification**: `npx prisma migrate dev --name add_subscriptions`

---

### Task 4: Stripe Service
**File**: `server/services/stripeService.js`

Functions:
- `createCustomer(teamId, email)` - Create Stripe customer
- `createCheckoutSession(teamId, priceId, successUrl, cancelUrl)` - Checkout
- `createPortalSession(customerId, returnUrl)` - Billing portal
- `getSubscription(teamId)` - Get current subscription
- `cancelSubscription(teamId, atPeriodEnd)` - Cancel subscription
- `handleWebhook(event)` - Process Stripe webhooks

Plan limits:
```javascript
const PLAN_LIMITS = {
  free: { athletes: 15, coaches: 1, features: ['basic'] },
  starter: { athletes: 30, coaches: 3, features: ['basic', 'ergData'] },
  pro: { athletes: 100, coaches: 10, features: ['all'] },
  enterprise: { athletes: -1, coaches: -1, features: ['all', 'api'] },
};
```

**Verification**: `node --check server/services/stripeService.js`

---

### Task 5: Subscription Routes
**File**: `server/routes/subscriptions.js`

Endpoints:
- `GET /` - Get team's subscription status
- `GET /plans` - List available plans with pricing
- `POST /checkout` - Create Stripe checkout session
- `POST /portal` - Create billing portal session
- `POST /webhook` - Stripe webhook handler (no auth)
- `POST /cancel` - Cancel subscription (OWNER only)

**Verification**: `node --check server/routes/subscriptions.js`

---

### Task 6: Plan Enforcement Middleware
**File**: `server/middleware/planLimits.js`

Middleware to enforce plan limits:
```javascript
export const checkPlanLimit = (limitType) => async (req, res, next) => {
  const teamId = req.user.teamId;
  const subscription = await getTeamSubscription(teamId);
  const limits = PLAN_LIMITS[subscription.plan];

  if (limitType === 'athletes') {
    const count = await prisma.athlete.count({ where: { teamId } });
    if (limits.athletes !== -1 && count >= limits.athletes) {
      return res.status(403).json({
        error: 'Plan limit reached',
        limit: limits.athletes,
        current: count,
        upgrade: true
      });
    }
  }
  // Similar for coaches, features
  next();
};

export const requireFeature = (feature) => async (req, res, next) => {
  const subscription = await getTeamSubscription(req.user.teamId);
  const features = PLAN_LIMITS[subscription.plan].features;

  if (!features.includes('all') && !features.includes(feature)) {
    return res.status(403).json({
      error: 'Feature not available on current plan',
      feature,
      upgrade: true
    });
  }
  next();
};
```

Apply to relevant routes.

**Verification**: `node --check server/middleware/planLimits.js`

---

### Task 7: Subscription Store
**File**: `src/store/subscriptionStore.js`

State: subscription, plans, loading, error
Actions: fetchSubscription, fetchPlans, createCheckout, openPortal, cancelSubscription

---

### Task 8: Billing Page Component
**File**: `src/pages/BillingPage.jsx`

Features:
- Current plan display
- Usage stats (athletes, coaches)
- Plan comparison table
- Upgrade/downgrade buttons
- Billing history link (Stripe portal)
- Cancel subscription

---

### Task 9: Upgrade Prompts
**File**: `src/components/Billing/UpgradePrompt.jsx`

Modal/banner shown when:
- Hitting plan limits
- Trying to use locked feature
- Near limit threshold (80%+)

---

### Task 10: Health Check Endpoints
**File**: `server/routes/health.js`

Endpoints:
- `GET /health` - Basic health (always returns 200 if running)
- `GET /ready` - Readiness (checks DB, Redis connections)
- `GET /metrics` - Prometheus-style metrics (optional)

---

### Task 11: API Versioning Setup
**File**: `server/routes/v2/index.js`

Prepare v2 API structure:
- Same routes, different base path
- Deprecation headers for v1
- Version negotiation via header

---

### Task 12: Rate Limiting Enhancement
**File**: `server/middleware/rateLimiting.js`

Plan-based rate limits:
```javascript
const RATE_LIMITS = {
  free: { windowMs: 60000, max: 100 },
  starter: { windowMs: 60000, max: 300 },
  pro: { windowMs: 60000, max: 1000 },
  enterprise: { windowMs: 60000, max: 5000 },
};
```

---

### Task 13: Mount Routes & Update Server
**File**: `server/index.js`

- Mount subscription routes
- Mount health routes
- Add webhook route (raw body parser)

---

### Task 14: Add Billing to Navigation
- Add route to App.jsx
- Add "Billing" link to Settings or separate nav item
- Show plan badge in header/sidebar

---

### Task 15: Documentation
**File**: `docs/self-hosted-setup.md`

Self-hosting guide:
- Prerequisites
- Docker setup
- Environment variables
- Database setup
- Stripe configuration
- Running in production

---

## Verification Checklist

- [ ] Docker image builds successfully
- [ ] docker-compose starts all services
- [ ] Prisma migrations run in Docker
- [ ] Subscription CRUD works
- [ ] Stripe checkout flow works
- [ ] Webhook handling works
- [ ] Plan limits enforced
- [ ] Health endpoints respond
- [ ] Frontend build passes

## Environment Variables Required

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENTERPRISE=price_...

# App URLs
APP_URL=https://rowlab.app
SUCCESS_URL=https://rowlab.app/billing/success
CANCEL_URL=https://rowlab.app/billing
```

## Notes

- Stripe test mode for development
- Webhook testing with Stripe CLI: `stripe listen --forward-to localhost:3002/api/v1/subscriptions/webhook`
- Consider grandfathering existing users
