import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, X, Check, Search, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import useTrainingPlanStore from '../../store/trainingPlanStore';

/**
 * AthleteAssignmentPanel - Assign training plans to athletes
 */
function AthleteAssignmentPanel({ plan }) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: plan?.startDate ? format(new Date(plan.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    endDate: plan?.endDate ? format(new Date(plan.endDate), 'yyyy-MM-dd') : '',
  });
  const [loading, setLoading] = useState(false);

  const { assignToAthletes, removeAssignment } = useTrainingPlanStore();

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/v1/teams/members', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch team members: ${response.status} ${response.statusText}`, errorText);
          return;
        }

        const data = await response.json();
        if (data.success && data.data) {
          // Filter to only show athletes (not coaches/owners)
          const athletes = (data.data.members || []).filter(m => m.role === 'ATHLETE');
          setTeamMembers(athletes);
        }
      } catch (err) {
        console.error('Failed to fetch team members:', err);
      }
    };
    fetchTeamMembers();
  }, []);

  // Filter members by search
  const filteredMembers = teamMembers.filter((member) => {
    const name = member.user?.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Already assigned member IDs
  const assignedMemberIds = new Set((plan?.assignments || []).map((a) => a.athleteId));

  // Toggle member selection
  const toggleMember = (memberId) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Handle assign
  const handleAssign = async () => {
    if (selectedMembers.length === 0 || !dateRange.startDate) return;

    setLoading(true);
    try {
      await assignToAthletes(plan.id, selectedMembers, dateRange);
      setShowAssignModal(false);
      setSelectedMembers([]);
    } catch (err) {
      console.error('Failed to assign plan:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle remove assignment
  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm('Remove this athlete from the plan?')) return;
    try {
      await removeAssignment(plan.id, assignmentId);
    } catch (err) {
      console.error('Failed to remove assignment:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-text-primary">Assigned Athletes</h3>
          <p className="text-sm text-text-muted mt-1">
            {plan?.assignments?.length || 0} athletes assigned to this plan
          </p>
        </div>
        <button
          onClick={() => setShowAssignModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blade-blue text-void-deep font-medium text-sm hover:shadow-[0_0_20px_rgba(0,112,243,0.4)] transition-all"
        >
          <Plus size={18} />
          <span>Assign Athletes</span>
        </button>
      </div>

      {/* Assignments List */}
      {(plan?.assignments?.length || 0) === 0 ? (
        <div className="rounded-xl bg-void-surface border border-white/[0.06] p-8 text-center">
          <Users size={40} className="mx-auto text-text-muted opacity-50" />
          <p className="text-text-muted mt-4">No athletes assigned yet</p>
          <button
            onClick={() => setShowAssignModal(true)}
            className="mt-3 text-blade-blue text-sm hover:underline"
          >
            Assign your first athlete
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plan.assignments.map((assignment) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-void-surface border border-white/[0.06] group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center">
                    <span className="text-sm font-medium text-blade-blue">
                      {(assignment.athlete?.name || 'A').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-text-primary">
                      {assignment.athlete?.name || 'Unknown Athlete'}
                    </h4>
                    <p className="text-xs text-text-muted">
                      {assignment.athlete?.role || 'Athlete'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveAssignment(assignment.id)}
                  className="p-1.5 rounded-lg text-text-muted opacity-0 group-hover:opacity-100 hover:text-danger-red hover:bg-danger-red/10 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-white/[0.04]">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Calendar size={12} />
                  <span>
                    {format(new Date(assignment.startDate), 'MMM d, yyyy')}
                    {assignment.endDate && ` - ${format(new Date(assignment.endDate), 'MMM d, yyyy')}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`
                    px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide
                    ${assignment.status === 'active' ? 'bg-success/10 text-success' : ''}
                    ${assignment.status === 'completed' ? 'bg-blade-blue/10 text-blade-blue' : ''}
                    ${assignment.status === 'cancelled' ? 'bg-text-muted/10 text-text-muted' : ''}
                  `}>
                    {assignment.status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Assign Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-void-deep/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAssignModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl bg-void-elevated border border-white/[0.08] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                <div>
                  <h3 className="font-medium text-text-primary">Assign Athletes</h3>
                  <p className="text-xs text-text-muted mt-0.5">Select athletes to assign to this plan</p>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Date Range */}
              <div className="p-4 border-b border-white/[0.06] space-y-3">
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider">
                  Assignment Period
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-text-muted mb-1">Start Date *</label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary text-sm focus:outline-none focus:border-blade-blue/40 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-muted mb-1">End Date</label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary text-sm focus:outline-none focus:border-blade-blue/40 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-white/[0.06]">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search athletes..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-void-surface border border-white/[0.06] text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-blade-blue/40 transition-all"
                  />
                </div>
              </div>

              {/* Member List */}
              <div className="flex-1 overflow-y-auto p-2">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-text-muted text-sm">
                    {teamMembers.length === 0 ? 'No athletes in team' : 'No athletes found'}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredMembers.map((member) => {
                      const isAssigned = assignedMemberIds.has(member.id);
                      const isSelected = selectedMembers.includes(member.id);

                      return (
                        <button
                          key={member.id}
                          onClick={() => !isAssigned && toggleMember(member.id)}
                          disabled={isAssigned}
                          className={`
                            w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left
                            ${isAssigned
                              ? 'opacity-50 cursor-not-allowed bg-void-surface'
                              : isSelected
                                ? 'bg-blade-blue/10 border border-blade-blue/30'
                                : 'hover:bg-white/[0.04] border border-transparent'
                            }
                          `}
                        >
                          <div className={`
                            w-5 h-5 rounded border flex items-center justify-center transition-all
                            ${isSelected
                              ? 'bg-blade-blue border-blade-blue'
                              : 'border-white/20'
                            }
                          `}>
                            {isSelected && <Check size={12} className="text-void-deep" />}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center">
                            <span className="text-xs font-medium text-blade-blue">
                              {(member.user?.name || 'A').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {member.user?.name || 'Unknown'}
                            </p>
                            {isAssigned && (
                              <p className="text-[10px] text-text-muted">Already assigned</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between p-4 border-t border-white/[0.06]">
                <span className="text-xs text-text-muted">
                  {selectedMembers.length} selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 rounded-lg text-text-secondary text-sm hover:text-text-primary hover:bg-white/[0.04] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssign}
                    disabled={loading || selectedMembers.length === 0 || !dateRange.startDate}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blade-blue text-void-deep font-medium text-sm hover:shadow-[0_0_20px_rgba(0,112,243,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-void-deep border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    Assign
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AthleteAssignmentPanel;
