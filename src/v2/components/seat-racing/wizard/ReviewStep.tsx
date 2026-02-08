import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useSessionWizard } from '@/v2/hooks/useSessionWizard';
import { useAthletes } from '@/v2/hooks/useAthletes';
import { useBradleyTerryRankings } from '@/v2/hooks/useAdvancedRankings';
import { PencilIcon, CheckCircleIcon, AlertTriangleIcon } from 'lucide-react';
import { RankingsImpactPreview } from './RankingsImpactPreview';

/**
 * Format date for display (e.g., "January 24, 2026")
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Format time for display (e.g., "1:32.5")
 */
function formatTimeDisplay(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${minutes}:${secs.padStart(4, '0')}`;
}

/**
 * ReviewSection - Section container with edit button
 */
interface ReviewSectionProps {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}

function ReviewSection({ title, onEdit, children }: ReviewSectionProps) {
  return (
    <div className="border border-bdr-default rounded-lg p-4 bg-bg-surface">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-lg text-txt-primary">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm text-interactive-primary hover:underline flex items-center gap-1 transition-colors"
        >
          <PencilIcon className="w-4 h-4" />
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

/**
 * ReviewField - Label/value pair display
 */
interface ReviewFieldProps {
  label: string;
  value: string;
}

function ReviewField({ label, value }: ReviewFieldProps) {
  return (
    <div>
      <dt className="text-sm text-txt-secondary">{label}</dt>
      <dd className="text-txt-primary mt-0.5">{value}</dd>
    </div>
  );
}

/**
 * PieceReview - Shows piece details with boat times
 */
interface PieceReviewProps {
  piece: any;
  index: number;
}

function PieceReview({ piece, index }: PieceReviewProps) {
  return (
    <div className="mb-4 p-3 bg-bg-elevated rounded border border-bdr-subtle">
      <h4 className="font-medium text-txt-primary mb-2">Piece #{index + 1}</h4>
      <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
        <span className="text-txt-secondary">
          Distance: <span className="text-txt-primary">{piece.distanceMeters || '—'}m</span>
        </span>
        <span className="text-txt-secondary">
          Direction: <span className="text-txt-primary">{piece.direction || '—'}</span>
        </span>
      </div>
      {piece.notes && (
        <p className="text-sm text-txt-secondary mb-2">
          Notes: <span className="text-txt-primary">{piece.notes}</span>
        </p>
      )}
      <div className="mt-2 space-y-1">
        <p className="text-xs font-medium text-txt-secondary uppercase tracking-wide mb-1">
          Boat Times
        </p>
        {piece.boats && piece.boats.length > 0 ? (
          piece.boats.map((boat: any, j: number) => (
            <div
              key={j}
              className="flex justify-between text-sm py-1 border-t border-bdr-subtle first:border-t-0"
            >
              <span className="text-txt-primary">{boat.name}</span>
              <span className="font-mono text-txt-primary">
                {boat.finishTimeSeconds ? (
                  formatTimeDisplay(boat.finishTimeSeconds)
                ) : (
                  <span className="text-txt-muted">—</span>
                )}
              </span>
            </div>
          ))
        ) : (
          <span className="text-xs text-txt-muted">No boats</span>
        )}
      </div>
    </div>
  );
}

/**
 * PieceAssignmentsReview - Shows athlete assignments for a piece
 */
interface PieceAssignmentsReviewProps {
  piece: any;
  index: number;
}

function PieceAssignmentsReview({ piece, index }: PieceAssignmentsReviewProps) {
  const { data: athletes } = useAthletes();

  const getAthleteName = (id: string): string => {
    const athlete = athletes?.find((a) => a.id === id);
    return athlete ? `${athlete.firstName} ${athlete.lastName}` : 'Unknown';
  };

  return (
    <div className="mb-4">
      <h4 className="font-medium text-txt-primary mb-2">Piece #{index + 1}</h4>
      {piece.boats && piece.boats.length > 0 ? (
        piece.boats.map((boat: any, j: number) => (
          <div key={j} className="mb-3">
            <h5 className="text-sm text-txt-secondary mb-1">{boat.name}</h5>
            <div className="flex flex-wrap gap-1">
              {boat.assignments && boat.assignments.length > 0 ? (
                boat.assignments.map((assignment: any, k: number) => (
                  <span
                    key={k}
                    className="text-xs bg-bg-elevated px-2 py-1 rounded border border-bdr-subtle text-txt-primary"
                  >
                    Seat {assignment.seatNumber}: {getAthleteName(assignment.athleteId)}
                  </span>
                ))
              ) : (
                <span className="text-xs text-txt-muted italic">No assignments</span>
              )}
            </div>
          </div>
        ))
      ) : (
        <span className="text-xs text-txt-muted">No boats</span>
      )}
    </div>
  );
}

/**
 * ValidationSummary - Shows warnings or success state
 */
interface ValidationSummaryProps {
  data: any;
}

function ValidationSummary({ data }: ValidationSummaryProps) {
  const issues: string[] = [];

  // Check for missing times
  if (data.pieces && data.pieces.length > 0) {
    data.pieces.forEach((piece: any, i: number) => {
      if (piece.boats && piece.boats.length > 0) {
        piece.boats.forEach((boat: any) => {
          if (!boat.finishTimeSeconds) {
            issues.push(`Piece ${i + 1}, ${boat.name}: Missing finish time`);
          }
        });
      }
    });

    // Check for missing assignments
    data.pieces.forEach((piece: any, i: number) => {
      if (piece.boats && piece.boats.length > 0) {
        piece.boats.forEach((boat: any) => {
          if (!boat.assignments || boat.assignments.length === 0) {
            issues.push(`Piece ${i + 1}, ${boat.name}: No athletes assigned`);
          }
        });
      }
    });
  }

  if (issues.length === 0) {
    return (
      <div className="p-3 bg-green-500/10 text-green-600 rounded-lg flex items-center gap-2 border border-green-500/20">
        <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
        <span>Ready to submit! All data looks good.</span>
      </div>
    );
  }

  return (
    <div className="p-3 bg-orange-500/10 text-orange-600 rounded-lg border border-orange-500/20">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangleIcon className="w-5 h-5 flex-shrink-0" />
        <span className="font-medium">Warnings (you can still submit)</span>
      </div>
      <ul className="list-disc list-inside text-sm space-y-0.5 ml-7">
        {issues.map((issue, i) => (
          <li key={i}>{issue}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Step 3: Review & Submit (3-step wizard)
 *
 * Displays all session data for final review before submission.
 * Allows editing by navigating back to specific steps.
 * Shows rankings impact preview with before/after comparison.
 */
export function ReviewStep() {
  const { watch } = useFormContext();
  const wizard = useSessionWizard();
  const data = watch();

  // Fetch current rankings for impact preview
  const { data: rankingsData } = useBradleyTerryRankings();
  const currentRankings =
    rankingsData?.athletes?.map((athlete) => ({
      athleteId: athlete.id,
      rating: athlete.rating || 1500,
      rank: athlete.rank || 0,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Session Metadata Section */}
      <ReviewSection title="Session Info" onEdit={() => wizard.goToStep(0)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReviewField label="Date" value={formatDate(data.date)} />
          <ReviewField label="Boat Class" value={data.boatClass || 'Not specified'} />
          <ReviewField label="Conditions" value={data.conditions || 'Not specified'} />
          <ReviewField label="Location" value={data.location || 'Not specified'} />
        </div>
        {data.description && (
          <div className="mt-3 pt-3 border-t border-bdr-subtle">
            <ReviewField label="Description" value={data.description} />
          </div>
        )}
      </ReviewSection>

      {/* Pieces & Assignments Section (combined for 3-step wizard) */}
      <ReviewSection
        title={`Pieces & Assignments (${data.pieces?.length || 0} pieces)`}
        onEdit={() => wizard.goToStep(1)}
      >
        {data.pieces && data.pieces.length > 0 ? (
          data.pieces.map((piece: any, i: number) => (
            <div key={i} className="mb-4">
              <PieceReview piece={piece} index={i} />
              <div className="mt-2 pl-4">
                <PieceAssignmentsReview piece={piece} index={i} />
              </div>
            </div>
          ))
        ) : (
          <p className="text-txt-muted text-sm">No pieces added yet</p>
        )}
      </ReviewSection>

      {/* Validation Summary */}
      <ValidationSummary data={data} />

      {/* Rankings Impact Preview */}
      <RankingsImpactPreview sessionData={data} currentRankings={currentRankings} />
    </div>
  );
}
