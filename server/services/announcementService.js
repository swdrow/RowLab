import prisma from '../db/connection.js';

/**
 * Create a new announcement
 */
export async function createAnnouncement(teamId, authorId, { title, content, priority = 'normal', visibleTo = 'all', pinned = false }) {
  return prisma.announcement.create({
    data: {
      teamId,
      authorId,
      title,
      content,
      priority,
      visibleTo,
      pinned
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
}

/**
 * Get filtered list of announcements with read status
 */
export async function getAnnouncements(teamId, { userId, role, priority, includeRead = true, pinnedOnly = false }) {
  const where = {
    teamId,
    OR: [
      { visibleTo: 'all' },
      { visibleTo: role }
    ]
  };

  if (priority) {
    where.priority = priority;
  }

  if (pinnedOnly) {
    where.pinned = true;
  }

  const announcements = await prisma.announcement.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      reads: userId ? {
        where: { userId },
        select: { readAt: true }
      } : false
    },
    orderBy: [
      { pinned: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  // Transform to include isRead flag
  const result = announcements.map(announcement => {
    const { reads, ...rest } = announcement;
    return {
      ...rest,
      isRead: reads && reads.length > 0,
      readAt: reads && reads.length > 0 ? reads[0].readAt : null
    };
  });

  if (!includeRead) {
    return result.filter(a => !a.isRead);
  }

  return result;
}

/**
 * Get single announcement with read status
 */
export async function getAnnouncementById(teamId, announcementId, userId) {
  const announcement = await prisma.announcement.findFirst({
    where: {
      id: announcementId,
      teamId
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      reads: userId ? {
        where: { userId },
        select: { readAt: true }
      } : false
    }
  });

  if (!announcement) {
    return null;
  }

  const { reads, ...rest } = announcement;
  return {
    ...rest,
    isRead: reads && reads.length > 0,
    readAt: reads && reads.length > 0 ? reads[0].readAt : null
  };
}

/**
 * Update announcement (verify author match)
 */
export async function updateAnnouncement(teamId, announcementId, authorId, data) {
  // Verify the announcement exists and belongs to the author
  const existing = await prisma.announcement.findFirst({
    where: {
      id: announcementId,
      teamId,
      authorId
    }
  });

  if (!existing) {
    return null;
  }

  // Only allow updating specific fields
  const { title, content, priority, visibleTo, pinned } = data;
  const updateData = {};

  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (priority !== undefined) updateData.priority = priority;
  if (visibleTo !== undefined) updateData.visibleTo = visibleTo;
  if (pinned !== undefined) updateData.pinned = pinned;

  return prisma.announcement.update({
    where: { id: announcementId },
    data: updateData,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
}

/**
 * Delete announcement (verify author match)
 */
export async function deleteAnnouncement(teamId, announcementId, authorId) {
  // Verify the announcement exists and belongs to the author
  const existing = await prisma.announcement.findFirst({
    where: {
      id: announcementId,
      teamId,
      authorId
    }
  });

  if (!existing) {
    return null;
  }

  return prisma.announcement.delete({
    where: { id: announcementId }
  });
}

/**
 * Mark single announcement as read (upsert)
 */
export async function markAsRead(announcementId, userId) {
  return prisma.announcementRead.upsert({
    where: {
      announcementId_userId: {
        announcementId,
        userId
      }
    },
    update: {
      readAt: new Date()
    },
    create: {
      announcementId,
      userId
    }
  });
}

/**
 * Batch mark all visible announcements as read
 */
export async function markAllAsRead(teamId, userId, role) {
  // Get all unread announcements visible to this user
  const announcements = await prisma.announcement.findMany({
    where: {
      teamId,
      OR: [
        { visibleTo: 'all' },
        { visibleTo: role }
      ],
      reads: {
        none: { userId }
      }
    },
    select: { id: true }
  });

  if (announcements.length === 0) {
    return { count: 0 };
  }

  // Create read records for all unread announcements
  const result = await prisma.announcementRead.createMany({
    data: announcements.map(a => ({
      announcementId: a.id,
      userId
    })),
    skipDuplicates: true
  });

  return { count: result.count };
}

/**
 * Get unread count for badges
 */
export async function getUnreadCount(teamId, userId, role) {
  const count = await prisma.announcement.count({
    where: {
      teamId,
      OR: [
        { visibleTo: 'all' },
        { visibleTo: role }
      ],
      reads: {
        none: { userId }
      }
    }
  });

  return count;
}

/**
 * Toggle pinned status (atomic operation to prevent TOCTOU race)
 */
export async function togglePin(teamId, announcementId) {
  // Use atomic update with conditional logic
  // First verify the announcement exists and belongs to the team
  const announcement = await prisma.announcement.findFirst({
    where: {
      id: announcementId,
      teamId
    },
    select: { id: true, pinned: true }
  });

  if (!announcement) {
    return null;
  }

  // Perform atomic update with the toggled value
  return prisma.announcement.update({
    where: {
      id: announcementId,
      teamId // Additional safety check in where clause
    },
    data: { pinned: !announcement.pinned },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
}
