import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../db/connection.js';
import { generateAccessToken, generateRefreshToken } from './tokenService.js';
import logger from '../utils/logger.js';

/**
 * Configure Google OAuth strategy
 */
export function configureGoogleStrategy(passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/v1/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email found in Google profile'), null);
          }

          // Check if user already exists
          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { googleId: profile.id },
                { email: { equals: email, mode: 'insensitive' } },
              ],
            },
            include: {
              memberships: {
                include: { team: true },
              },
            },
          });

          if (user) {
            // Update Google ID if not set
            if (!user.googleId) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.id, provider: 'google' },
                include: {
                  memberships: {
                    include: { team: true },
                  },
                },
              });
            }
            return done(null, user);
          }

          // New user - must have a valid invite
          const invitation = await prisma.invitation.findFirst({
            where: {
              email: { equals: email, mode: 'insensitive' },
              status: 'pending',
              expiresAt: { gt: new Date() },
            },
            include: {
              team: true,
              athlete: true,
            },
          });

          if (!invitation) {
            return done(new Error('No valid invitation found for this email'), null);
          }

          // Create new user
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
              googleId: profile.id,
              provider: 'google',
              status: 'active',
            },
            include: {
              memberships: {
                include: { team: true },
              },
            },
          });

          // Link athlete to user if invitation has athleteId
          if (invitation.athleteId) {
            await prisma.athlete.update({
              where: { id: invitation.athleteId },
              data: { userId: user.id, isManaged: false },
            });
          }

          // Create team membership
          await prisma.teamMember.create({
            data: {
              userId: user.id,
              teamId: invitation.teamId,
              role: 'ATHLETE',
            },
          });

          // Mark invitation as claimed
          await prisma.invitation.update({
            where: { id: invitation.id },
            data: { status: 'claimed' },
          });

          // Refresh user with memberships
          user = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
              memberships: {
                include: { team: true },
              },
            },
          });

          logger.info('Google OAuth user created', { userId: user.id, email: user.email });
          return done(null, user);
        } catch (error) {
          logger.error('Google OAuth error', { error: error.message });
          return done(error, null);
        }
      }
    )
  );
}

/**
 * Find or create user from Google OAuth
 * This is called after successful OAuth callback
 */
export async function handleGoogleOAuth(profile) {
  const email = profile.emails?.[0]?.value;
  if (!email) {
    throw new Error('No email found in Google profile');
  }

  // Check if user already exists
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { googleId: profile.id },
        { email: { equals: email, mode: 'insensitive' } },
      ],
    },
    include: {
      memberships: {
        include: { team: true },
      },
    },
  });

  if (user) {
    // Update Google ID if not set
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.id, provider: 'google' },
        include: {
          memberships: {
            include: { team: true },
          },
        },
      });
    }
    return user;
  }

  // New user - must have a valid invite
  const invitation = await prisma.invitation.findFirst({
    where: {
      email: { equals: email, mode: 'insensitive' },
      status: 'pending',
      expiresAt: { gt: new Date() },
    },
    include: {
      team: true,
      athlete: true,
    },
  });

  if (!invitation) {
    throw new Error('No valid invitation found for this email');
  }

  // Create new user
  user = await prisma.user.create({
    data: {
      email,
      name: profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
      googleId: profile.id,
      provider: 'google',
      status: 'active',
    },
    include: {
      memberships: {
        include: { team: true },
      },
    },
  });

  // Link athlete to user if invitation has athleteId
  if (invitation.athleteId) {
    await prisma.athlete.update({
      where: { id: invitation.athleteId },
      data: { userId: user.id, isManaged: false },
    });
  }

  // Create team membership
  await prisma.teamMember.create({
    data: {
      userId: user.id,
      teamId: invitation.teamId,
      role: 'ATHLETE',
    },
  });

  // Mark invitation as claimed
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { status: 'claimed' },
  });

  // Refresh user with memberships
  user = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      memberships: {
        include: { team: true },
      },
    },
  });

  logger.info('Google OAuth user created', { userId: user.id, email: user.email });
  return user;
}

/**
 * Generate tokens and format user response for OAuth login
 */
export async function generateOAuthResponse(user) {
  const firstMembership = user.memberships[0];
  const activeTeamId = firstMembership?.teamId || null;
  const activeTeamRole = firstMembership?.role || null;

  const accessToken = generateAccessToken(user, activeTeamId, activeTeamRole);
  const { token: refreshToken } = await generateRefreshToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      isAdmin: user.isAdmin,
    },
    teams: user.memberships.map((m) => ({
      id: m.team.id,
      name: m.team.name,
      slug: m.team.slug,
      role: m.role,
    })),
    activeTeamId,
    accessToken,
    refreshToken,
  };
}
