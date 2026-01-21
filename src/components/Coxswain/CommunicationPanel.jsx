import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Clock, Check, AlertCircle } from 'lucide-react';

/**
 * CommunicationPanel - Structured notes tied to workout sessions
 *
 * Displays coach's pre-workout notes (read-only) and allows coxswain
 * to enter post-workout notes with athlete observations and equipment notes.
 *
 * @param {Object} preWorkoutNotes - Coach's instructions (read-only)
 * @param {Object} postWorkoutNotes - Coxswain's notes (editable)
 * @param {Function} onSaveNotes - Callback to save post-workout notes
 */
export function CommunicationPanel({
  preWorkoutNotes,
  postWorkoutNotes,
  onSaveNotes,
}) {
  const [preExpanded, setPreExpanded] = useState(true);
  const [postExpanded, setPostExpanded] = useState(true);
  const [sessionReport, setSessionReport] = useState(postWorkoutNotes?.sessionReport || '');
  const [athleteObservations, setAthleteObservations] = useState(postWorkoutNotes?.athleteObservations || '');
  const [equipmentNotes, setEquipmentNotes] = useState(postWorkoutNotes?.equipmentNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(postWorkoutNotes?.savedAt || null);
  const [isDirty, setIsDirty] = useState(false);

  const MAX_CHARS = 1000;

  // Load saved draft from localStorage
  useEffect(() => {
    try {
      const draft = localStorage.getItem('coxswain-notes-draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.sessionReport) setSessionReport(parsed.sessionReport);
        if (parsed.athleteObservations) setAthleteObservations(parsed.athleteObservations);
        if (parsed.equipmentNotes) setEquipmentNotes(parsed.equipmentNotes);
      }
    } catch (e) {
      console.warn('Failed to load notes draft:', e);
    }
  }, []);

  // Auto-save draft to localStorage
  useEffect(() => {
    const draft = { sessionReport, athleteObservations, equipmentNotes };
    localStorage.setItem('coxswain-notes-draft', JSON.stringify(draft));
    setIsDirty(true);
  }, [sessionReport, athleteObservations, equipmentNotes]);

  // Update from props when they change
  useEffect(() => {
    if (postWorkoutNotes) {
      setSessionReport(postWorkoutNotes.sessionReport || '');
      setAthleteObservations(postWorkoutNotes.athleteObservations || '');
      setEquipmentNotes(postWorkoutNotes.equipmentNotes || '');
      setLastSaved(postWorkoutNotes.savedAt || null);
      setIsDirty(false);
    }
  }, [postWorkoutNotes]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const notes = {
        sessionReport,
        athleteObservations,
        equipmentNotes,
        savedAt: new Date().toISOString(),
      };
      await onSaveNotes?.(notes);
      setLastSaved(notes.savedAt);
      setIsDirty(false);
      localStorage.removeItem('coxswain-notes-draft');
    } catch (e) {
      console.error('Failed to save notes:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const hasContent = sessionReport || athleteObservations || equipmentNotes;

  return (
    <div className="bg-void-elevated border border-white/[0.06] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <span className="font-display text-sm font-semibold text-text-primary uppercase tracking-wider">
          Communication
        </span>
      </div>

      {/* Pre-Workout Section (Coach's notes) */}
      <div className="border-b border-white/[0.06]">
        <button
          onClick={() => setPreExpanded(!preExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors duration-100"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blade-blue" />
            <span className="text-sm font-medium text-text-primary">
              Pre-Workout (Coach)
            </span>
          </div>
          {preExpanded ? (
            <ChevronUp size={16} className="text-text-muted" />
          ) : (
            <ChevronDown size={16} className="text-text-muted" />
          )}
        </button>

        {preExpanded && (
          <div className="px-4 pb-4 animate-fade-in">
            {preWorkoutNotes ? (
              <div className="space-y-3">
                {/* Workout Instructions */}
                {preWorkoutNotes.instructions && (
                  <div className="p-3 bg-blade-blue/5 border border-blade-blue/20 rounded-lg">
                    <div className="text-xs text-blade-blue uppercase tracking-wider mb-1 font-medium">
                      Workout
                    </div>
                    <p className="text-sm text-text-primary whitespace-pre-wrap">
                      {preWorkoutNotes.instructions}
                    </p>
                  </div>
                )}

                {/* Focus Points */}
                {preWorkoutNotes.focusPoints && preWorkoutNotes.focusPoints.length > 0 && (
                  <div className="p-3 bg-coxswain-violet/5 border border-coxswain-violet/20 rounded-lg">
                    <div className="text-xs text-coxswain-violet uppercase tracking-wider mb-2 font-medium">
                      Focus Points
                    </div>
                    <ul className="space-y-1">
                      {preWorkoutNotes.focusPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                          <span className="text-coxswain-violet mt-0.5">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Technical Cues */}
                {preWorkoutNotes.technicalCues && preWorkoutNotes.technicalCues.length > 0 && (
                  <div className="p-3 bg-warning-orange/5 border border-warning-orange/20 rounded-lg">
                    <div className="text-xs text-warning-orange uppercase tracking-wider mb-2 font-medium">
                      Technical Cues
                    </div>
                    <ul className="space-y-1">
                      {preWorkoutNotes.technicalCues.map((cue, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                          <AlertCircle size={12} className="text-warning-orange mt-1 flex-shrink-0" />
                          {cue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Timestamp */}
                {preWorkoutNotes.createdAt && (
                  <div className="flex items-center gap-1 text-xs text-text-muted">
                    <Clock size={12} />
                    <span>Posted {formatTimestamp(preWorkoutNotes.createdAt)}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-text-muted italic">
                No instructions from coach yet.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Post-Workout Section (Coxswain's notes) */}
      <div>
        <button
          onClick={() => setPostExpanded(!postExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors duration-100"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-coxswain-violet" />
            <span className="text-sm font-medium text-text-primary">
              Post-Workout (Your Notes)
            </span>
            {isDirty && hasContent && (
              <span className="text-[10px] text-warning-orange uppercase">Unsaved</span>
            )}
          </div>
          {postExpanded ? (
            <ChevronUp size={16} className="text-text-muted" />
          ) : (
            <ChevronDown size={16} className="text-text-muted" />
          )}
        </button>

        {postExpanded && (
          <div className="px-4 pb-4 space-y-4 animate-fade-in">
            {/* Session Report */}
            <div>
              <label htmlFor="session-report" className="block text-xs text-text-muted uppercase tracking-wider mb-2">
                Session Report
              </label>
              <textarea
                id="session-report"
                value={sessionReport}
                onChange={(e) => setSessionReport(e.target.value.slice(0, MAX_CHARS))}
                placeholder="How did the session go? Key observations..."
                rows={3}
                className="w-full px-3 py-2 bg-void-surface border border-white/[0.08] rounded-lg text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-blade-blue/50 focus:shadow-focus-blue transition-all duration-100"
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs ${sessionReport.length > MAX_CHARS * 0.9 ? 'text-warning-orange' : 'text-text-muted'}`}>
                  {sessionReport.length}/{MAX_CHARS}
                </span>
              </div>
            </div>

            {/* Athlete Observations */}
            <div>
              <label htmlFor="athlete-observations" className="block text-xs text-text-muted uppercase tracking-wider mb-2">
                Athlete Observations
              </label>
              <textarea
                id="athlete-observations"
                value={athleteObservations}
                onChange={(e) => setAthleteObservations(e.target.value.slice(0, MAX_CHARS))}
                placeholder="Individual athlete notes, timing, technique..."
                rows={2}
                className="w-full px-3 py-2 bg-void-surface border border-white/[0.08] rounded-lg text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-blade-blue/50 focus:shadow-focus-blue transition-all duration-100"
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs ${athleteObservations.length > MAX_CHARS * 0.9 ? 'text-warning-orange' : 'text-text-muted'}`}>
                  {athleteObservations.length}/{MAX_CHARS}
                </span>
              </div>
            </div>

            {/* Equipment Notes */}
            <div>
              <label htmlFor="equipment-notes" className="block text-xs text-text-muted uppercase tracking-wider mb-2">
                Equipment Notes
              </label>
              <textarea
                id="equipment-notes"
                value={equipmentNotes}
                onChange={(e) => setEquipmentNotes(e.target.value.slice(0, MAX_CHARS))}
                placeholder="Boat condition, oar issues, rigging notes..."
                rows={2}
                className="w-full px-3 py-2 bg-void-surface border border-white/[0.08] rounded-lg text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-blade-blue/50 focus:shadow-focus-blue transition-all duration-100"
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs ${equipmentNotes.length > MAX_CHARS * 0.9 ? 'text-warning-orange' : 'text-text-muted'}`}>
                  {equipmentNotes.length}/{MAX_CHARS}
                </span>
              </div>
            </div>

            {/* Save button and timestamp */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                {lastSaved && (
                  <>
                    <Check size={12} className="text-success" />
                    <span>Last saved {formatTimestamp(lastSaved)}</span>
                  </>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving || !hasContent}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isSaving || !hasContent
                    ? 'bg-white/[0.04] text-text-disabled cursor-not-allowed'
                    : 'bg-coxswain-violet text-white hover:bg-coxswain-violet/90 active:scale-[0.98]'
                }`}
              >
                {isSaving ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunicationPanel;
