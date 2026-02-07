import { create } from 'zustand';

import { getErrorMessage } from '../utils/errorUtils';

// @deprecated This store is deprecated. Use TanStack Query hooks from src/v2/hooks/ instead.
// V1 legacy code still uses this store during migration.

/**
 * Zustand store for managing announcements
 *
 * Features:
 * - CRUD operations for announcements
 * - Read/unread tracking
 * - Pin/unpin functionality
 * - Filtering by priority and read status
 */
const useAnnouncementStore = create((set, get) => ({
  // Data
  announcements: [],
  selectedAnnouncement: null,
  unreadCount: 0,

  // UI state
  loading: false,
  error: null,
  filter: 'all', // 'all', 'unread', 'important', 'urgent'

  // ============================================
  // Helper: Get auth headers
  // ============================================
  _getAuthHeaders: () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  // ============================================
  // Selectors (computed from state)
  // ============================================

  /**
   * Get pinned announcements
   */
  getPinnedAnnouncements: () => {
    return get().announcements.filter((a) => a.pinned);
  },

  /**
   * Get unread announcements
   */
  getUnreadAnnouncements: () => {
    return get().announcements.filter((a) => !a.isRead);
  },

  /**
   * Get filtered announcements based on current filter
   */
  getFilteredAnnouncements: () => {
    const { announcements, filter } = get();
    switch (filter) {
      case 'unread':
        return announcements.filter((a) => !a.isRead);
      case 'important':
        return announcements.filter((a) => a.priority === 'important');
      case 'urgent':
        return announcements.filter((a) => a.priority === 'urgent');
      case 'all':
      default:
        return announcements;
    }
  },

  // ============================================
  // Announcement CRUD Operations
  // ============================================

  /**
   * Fetch all announcements with optional filtering
   * @param {Object} params - { priority, pinnedOnly, includeRead }
   */
  fetchAnnouncements: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const searchParams = new URLSearchParams();
      if (params.priority) searchParams.append('priority', params.priority);
      if (params.pinnedOnly) searchParams.append('pinnedOnly', params.pinnedOnly);
      if (params.includeRead !== undefined) searchParams.append('includeRead', params.includeRead);

      const queryString = searchParams.toString();
      const url = `/api/v1/announcements${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to fetch announcements'));
      }

      set({ announcements: data.data.announcements || [], loading: false });
      return data.data.announcements;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Fetch unread announcement count
   */
  fetchUnreadCount: async () => {
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch('/api/v1/announcements/unread-count', { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to fetch unread count'));
      }

      set({ unreadCount: data.data.count || 0 });
      return data.data.count;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  /**
   * Fetch a single announcement by ID (also marks as read)
   * @param {string} id - Announcement ID
   */
  fetchAnnouncementById: async (id) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/announcements/${id}`, { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to fetch announcement'));
      }

      const announcement = data.data.announcement;
      set({ selectedAnnouncement: announcement, loading: false });

      // Update the announcement in the list to mark as read
      set((state) => {
        const existingAnnouncement = state.announcements.find((a) => a._id === id);
        const wasUnread = existingAnnouncement && !existingAnnouncement.isRead;

        return {
          announcements: state.announcements.map((a) =>
            a._id === id ? { ...a, isRead: true } : a
          ),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        };
      });

      return announcement;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Create a new announcement
   * @param {Object} announcementData - Announcement data
   */
  createAnnouncement: async (announcementData) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch('/api/v1/announcements', {
        method: 'POST',
        headers,
        body: JSON.stringify(announcementData),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to create announcement'));
      }

      const announcement = data.data.announcement;
      // Prepend to announcements array (newest first)
      set((state) => ({
        announcements: [announcement, ...state.announcements],
        loading: false,
      }));
      return announcement;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Update an existing announcement
   * @param {string} id - Announcement ID
   * @param {Object} announcementData - Updated data
   */
  updateAnnouncement: async (id, announcementData) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/announcements/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(announcementData),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to update announcement'));
      }

      const updatedAnnouncement = data.data.announcement;
      set((state) => ({
        announcements: state.announcements.map((a) => (a._id === id ? updatedAnnouncement : a)),
        selectedAnnouncement:
          state.selectedAnnouncement?._id === id ? updatedAnnouncement : state.selectedAnnouncement,
        loading: false,
      }));
      return updatedAnnouncement;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  /**
   * Delete an announcement
   * @param {string} id - Announcement ID
   */
  deleteAnnouncement: async (id) => {
    set({ loading: true, error: null });
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/announcements/${id}`, {
        method: 'DELETE',
        headers,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to delete announcement'));
      }

      set((state) => ({
        announcements: state.announcements.filter((a) => a._id !== id),
        selectedAnnouncement:
          state.selectedAnnouncement?._id === id ? null : state.selectedAnnouncement,
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ============================================
  // Read Status Operations
  // ============================================

  /**
   * Mark a single announcement as read
   * @param {string} id - Announcement ID
   */
  markAsRead: async (id) => {
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/announcements/${id}/read`, {
        method: 'POST',
        headers,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to mark announcement as read'));
      }

      set((state) => {
        const announcement = state.announcements.find((a) => a._id === id);
        const wasUnread = announcement && !announcement.isRead;

        return {
          announcements: state.announcements.map((a) =>
            a._id === id ? { ...a, isRead: true } : a
          ),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        };
      });
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  /**
   * Mark all announcements as read
   */
  markAllAsRead: async () => {
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch('/api/v1/announcements/read-all', {
        method: 'POST',
        headers,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to mark all announcements as read'));
      }

      set((state) => ({
        announcements: state.announcements.map((a) => ({ ...a, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // ============================================
  // Pin Operations
  // ============================================

  /**
   * Toggle pin status of an announcement
   * @param {string} id - Announcement ID
   */
  togglePin: async (id) => {
    try {
      const headers = get()._getAuthHeaders();
      const response = await fetch(`/api/v1/announcements/${id}/toggle-pin`, {
        method: 'POST',
        headers,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data.error, 'Failed to toggle pin status'));
      }

      const updatedAnnouncement = data.data.announcement;
      set((state) => ({
        announcements: state.announcements.map((a) =>
          a._id === id ? { ...a, pinned: updatedAnnouncement.pinned } : a
        ),
        selectedAnnouncement:
          state.selectedAnnouncement?._id === id
            ? { ...state.selectedAnnouncement, pinned: updatedAnnouncement.pinned }
            : state.selectedAnnouncement,
      }));
      return updatedAnnouncement;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // ============================================
  // UI State Actions
  // ============================================

  /**
   * Set selected announcement locally (without API call)
   * @param {Object|null} announcement - Announcement object or null
   */
  setSelectedAnnouncement: (announcement) => {
    set({ selectedAnnouncement: announcement });
  },

  /**
   * Set filter for announcements
   * @param {string} filter - 'all', 'unread', 'important', 'urgent'
   */
  setFilter: (filter) => {
    set({ filter });
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set({
      announcements: [],
      selectedAnnouncement: null,
      unreadCount: 0,
      loading: false,
      error: null,
      filter: 'all',
    });
  },
}));

export default useAnnouncementStore;
