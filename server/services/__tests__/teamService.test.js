/**
 * Team Service Tests
 * Tests for team ownership transfer race condition fixes
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../../db/connection.js';
import { updateMemberRole, removeMember, createTeam } from '../teamService.js';

describe('Team Service - Ownership Race Condition', () => {
  let testTeam;
  let owner1, owner2, coach, athlete;

  beforeEach(async () => {
    // Create test users
    owner1 = await prisma.user.create({
      data: {
        email: 'owner1@test.com',
        name: 'Owner One',
        passwordHash: 'hash',
      },
    });

    owner2 = await prisma.user.create({
      data: {
        email: 'owner2@test.com',
        name: 'Owner Two',
        passwordHash: 'hash',
      },
    });

    coach = await prisma.user.create({
      data: {
        email: 'coach@test.com',
        name: 'Coach',
        passwordHash: 'hash',
      },
    });

    athlete = await prisma.user.create({
      data: {
        email: 'athlete@test.com',
        name: 'Athlete',
        passwordHash: 'hash',
      },
    });

    // Create a test team with owner1 as the initial owner
    const team = await createTeam({
      name: 'Test Team',
      userId: owner1.id,
      isPublic: false,
    });

    testTeam = await prisma.team.findUnique({
      where: { id: team.id },
      include: { members: true },
    });

    // Add additional members
    await prisma.teamMember.create({
      data: {
        userId: owner2.id,
        teamId: testTeam.id,
        role: 'OWNER',
      },
    });

    await prisma.teamMember.create({
      data: {
        userId: coach.id,
        teamId: testTeam.id,
        role: 'COACH',
      },
    });

    await prisma.teamMember.create({
      data: {
        userId: athlete.id,
        teamId: testTeam.id,
        role: 'ATHLETE',
      },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.teamMember.deleteMany({
      where: { teamId: testTeam.id },
    });
    await prisma.team.delete({
      where: { id: testTeam.id },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [owner1.id, owner2.id, coach.id, athlete.id] },
      },
    });
  });

  describe('updateMemberRole', () => {
    it('should allow demoting an owner when there are multiple owners', async () => {
      // Should succeed because owner2 exists
      const result = await updateMemberRole(
        testTeam.id,
        owner1.id, // target: demote owner1
        'COACH',
        owner2.id // requester: owner2
      );

      expect(result.role).toBe('COACH');

      // Verify in database
      const member = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId: owner1.id, teamId: testTeam.id } },
      });
      expect(member.role).toBe('COACH');
    });

    it('should prevent demoting the last owner', async () => {
      // First demote owner2 to COACH
      await updateMemberRole(testTeam.id, owner2.id, 'COACH', owner1.id);

      // Now try to demote owner1 (the last owner)
      await expect(
        updateMemberRole(testTeam.id, owner1.id, 'COACH', owner1.id)
      ).rejects.toThrow('Cannot demote the last team owner');

      // Verify owner1 is still an owner
      const member = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId: owner1.id, teamId: testTeam.id } },
      });
      expect(member.role).toBe('OWNER');
    });

    it('should handle concurrent demotion attempts atomically', async () => {
      // Simulate race condition: both owners try to demote each other simultaneously
      const promises = [
        updateMemberRole(testTeam.id, owner2.id, 'COACH', owner1.id),
        updateMemberRole(testTeam.id, owner1.id, 'COACH', owner2.id),
      ];

      // One should succeed, one should fail
      const results = await Promise.allSettled(promises);

      const succeeded = results.filter((r) => r.status === 'fulfilled');
      const failed = results.filter((r) => r.status === 'rejected');

      expect(succeeded.length).toBe(1);
      expect(failed.length).toBe(1);
      expect(failed[0].reason.message).toContain('Cannot demote the last team owner');

      // Verify exactly one owner remains
      const ownerCount = await prisma.teamMember.count({
        where: { teamId: testTeam.id, role: 'OWNER' },
      });
      expect(ownerCount).toBe(1);
    });

    it('should allow promoting a member to owner', async () => {
      const result = await updateMemberRole(
        testTeam.id,
        coach.id,
        'OWNER',
        owner1.id
      );

      expect(result.role).toBe('OWNER');
    });

    it('should not allow self role change', async () => {
      await expect(
        updateMemberRole(testTeam.id, owner1.id, 'COACH', owner1.id)
      ).rejects.toThrow('Cannot change your own role');
    });
  });

  describe('removeMember', () => {
    it('should allow removing a non-owner member', async () => {
      await removeMember(testTeam.id, athlete.id, owner1.id);

      const member = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId: athlete.id, teamId: testTeam.id } },
      });
      expect(member).toBeNull();
    });

    it('should prevent removing the last owner', async () => {
      // First demote owner2 to COACH
      await updateMemberRole(testTeam.id, owner2.id, 'COACH', owner1.id);

      // Now try to remove owner1 (the last owner)
      await expect(
        removeMember(testTeam.id, owner1.id, owner1.id)
      ).rejects.toThrow('Cannot remove the last team owner');

      // Verify owner1 still exists
      const member = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId: owner1.id, teamId: testTeam.id } },
      });
      expect(member).not.toBeNull();
    });

    it('should allow removing an owner when multiple owners exist', async () => {
      // Should succeed because owner2 exists
      await removeMember(testTeam.id, owner1.id, owner2.id);

      const member = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId: owner1.id, teamId: testTeam.id } },
      });
      expect(member).toBeNull();
    });

    it('should handle concurrent owner removal attempts atomically', async () => {
      // Simulate race condition: both owners try to remove each other simultaneously
      const promises = [
        removeMember(testTeam.id, owner2.id, owner1.id),
        removeMember(testTeam.id, owner1.id, owner2.id),
      ];

      // One should succeed, one should fail
      const results = await Promise.allSettled(promises);

      const succeeded = results.filter((r) => r.status === 'fulfilled');
      const failed = results.filter((r) => r.status === 'rejected');

      expect(succeeded.length).toBe(1);
      expect(failed.length).toBe(1);
      expect(failed[0].reason.message).toContain('Cannot remove the last team owner');

      // Verify exactly one owner remains
      const ownerCount = await prisma.teamMember.count({
        where: { teamId: testTeam.id, role: 'OWNER' },
      });
      expect(ownerCount).toBe(1);
    });

    it('should allow owner to remove themselves if other owners exist', async () => {
      // owner1 removes themselves
      await removeMember(testTeam.id, owner1.id, owner1.id);

      const member = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId: owner1.id, teamId: testTeam.id } },
      });
      expect(member).toBeNull();

      // Verify owner2 still exists
      const owner2Member = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId: owner2.id, teamId: testTeam.id } },
      });
      expect(owner2Member).not.toBeNull();
      expect(owner2Member.role).toBe('OWNER');
    });

    it('should not allow coaches to remove owners', async () => {
      await expect(
        removeMember(testTeam.id, owner1.id, coach.id)
      ).rejects.toThrow('Coaches cannot remove other coaches or owners');
    });

    it('should not allow coaches to remove other coaches', async () => {
      // Add another coach
      const coach2 = await prisma.user.create({
        data: {
          email: 'coach2@test.com',
          name: 'Coach Two',
          passwordHash: 'hash',
        },
      });

      await prisma.teamMember.create({
        data: {
          userId: coach2.id,
          teamId: testTeam.id,
          role: 'COACH',
        },
      });

      await expect(
        removeMember(testTeam.id, coach2.id, coach.id)
      ).rejects.toThrow('Coaches cannot remove other coaches or owners');

      // Cleanup
      await prisma.teamMember.delete({
        where: { userId_teamId: { userId: coach2.id, teamId: testTeam.id } },
      });
      await prisma.user.delete({ where: { id: coach2.id } });
    });

    it('should allow coaches to remove athletes', async () => {
      await removeMember(testTeam.id, athlete.id, coach.id);

      const member = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId: athlete.id, teamId: testTeam.id } },
      });
      expect(member).toBeNull();
    });
  });
});
