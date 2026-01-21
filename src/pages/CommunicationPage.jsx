import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, X, Bell, BellOff, Megaphone } from 'lucide-react';
import useAnnouncementStore from '../store/announcementStore';
import useAuthStore from '../store/authStore';
import AnnouncementList from '../components/Communication/AnnouncementList';
import AnnouncementForm from '../components/Communication/AnnouncementForm';
import AnnouncementDetail from '../components/Communication/AnnouncementDetail';
import SpotlightCard from '../components/ui/SpotlightCard';

/**
 * CommunicationPage - Main page for team announcements and communication
 * Redesigned with Precision Instrument design system
 */
function CommunicationPage() {
  // Store hooks
  const {
    announcements,
    unreadCount,
    loading,
    filter,
    fetchAnnouncements,
    fetchUnreadCount,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    togglePin,
    markAllAsRead,
    setFilter,
  } = useAnnouncementStore();

  const { activeTeamRole } = useAuthStore();

  // Local state
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState(null);

  // Check if user can manage announcements (COACH or OWNER)
  const canManageAnnouncements = activeTeamRole === 'COACH' || activeTeamRole === 'OWNER';

  // Fetch announcements and unread count on mount
  useEffect(() => {
    fetchAnnouncements();
    fetchUnreadCount();
  }, [fetchAnnouncements, fetchUnreadCount]);

  // Handlers
  const handleAnnouncementClick = (announcement) => {
    setViewingAnnouncement(announcement);
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  const handleDelete = async (announcement) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await deleteAnnouncement(announcement._id || announcement.id);
        await fetchAnnouncements();
        setViewingAnnouncement(null);
      } catch (err) {
        console.error('Failed to delete announcement:', err);
        // Error is displayed via store error state
      }
    }
  };

  const handleTogglePin = async (announcement) => {
    try {
      await togglePin(announcement._id || announcement.id);
      await fetchAnnouncements();
    } catch (err) {
      console.error('Failed to toggle pin:', err);
      // Error is displayed via store error state
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      await fetchAnnouncements();
      await fetchUnreadCount();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      // Error is displayed via store error state
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement._id || editingAnnouncement.id, formData);
      } else {
        await createAnnouncement(formData);
      }
      setShowForm(false);
      setEditingAnnouncement(null);
      await fetchAnnouncements();
    } catch (err) {
      console.error('Failed to submit announcement:', err);
      // Error is displayed via store error state
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAnnouncement(null);
  };

  const handleCloseDetail = () => {
    setViewingAnnouncement(null);
  };

  const handleNewAnnouncement = () => {
    setEditingAnnouncement(null);
    setShowForm(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      className="min-h-screen bg-void-deep"
    >
      {/* Atmospheric background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-coxswain-violet/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blade-blue/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
            className="mb-8"
          >
            <SpotlightCard className="p-6" spotlightColor="rgba(124, 58, 237, 0.08)">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-coxswain-violet/10 border border-coxswain-violet/20 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.15)]">
                    <Megaphone className="w-6 h-6 text-coxswain-violet" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-text-primary tracking-[-0.02em]">
                      Communication
                    </h1>
                    <p className="text-sm text-text-secondary mt-0.5">
                      Team announcements and updates
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blade-blue/10 border border-blade-blue/20"
                    >
                      <Bell className="w-3.5 h-3.5 text-blade-blue" />
                      <span className="text-sm font-medium text-blade-blue">
                        {unreadCount} unread
                      </span>
                    </motion.div>
                  )}
                </div>

                {canManageAnnouncements && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNewAnnouncement}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blade-blue text-void-deep font-medium text-sm transition-all duration-150 ease-out hover:shadow-[0_0_20px_rgba(0,112,243,0.3)] focus:outline-none focus:ring-2 focus:ring-blade-blue/50 focus:ring-offset-2 focus:ring-offset-void-deep"
                  >
                    <Plus className="w-4 h-4" />
                    New Announcement
                  </motion.button>
                )}
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Announcement List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <AnnouncementList
              announcements={announcements}
              loading={loading}
              onAnnouncementClick={handleAnnouncementClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
              canEdit={canManageAnnouncements}
              filter={filter}
              onFilterChange={handleFilterChange}
              onMarkAllRead={handleMarkAllRead}
            />
          </motion.div>

          {/* Create/Edit Modal */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-void-deep/80 backdrop-blur-xl"
                onClick={handleFormCancel}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                  className="relative max-w-lg w-full mx-4 rounded-xl border border-white/5 bg-void-elevated shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-coxswain-violet/10 border border-coxswain-violet/20 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-coxswain-violet" />
                      </div>
                      <h2 className="text-lg font-semibold text-text-primary">
                        {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
                      </h2>
                    </div>
                    <button
                      onClick={handleFormCancel}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="px-6 py-5">
                    <AnnouncementForm
                      announcement={editingAnnouncement}
                      onSubmit={handleFormSubmit}
                      onCancel={handleFormCancel}
                      loading={loading}
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* View Detail Modal */}
          <AnimatePresence>
            {viewingAnnouncement && (
              <AnnouncementDetail
                announcement={viewingAnnouncement}
                onClose={handleCloseDetail}
                onEdit={handleEdit}
                onDelete={handleDelete}
                canEdit={canManageAnnouncements}
                asModal={true}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default CommunicationPage;
