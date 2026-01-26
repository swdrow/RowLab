import { useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Plus, Trash, CaretDown, CaretUp, DotsSixVertical } from '@phosphor-icons/react';
import type { PieceSegment } from '../../../types/session';

const SEGMENTS: { value: PieceSegment; label: string }[] = [
  { value: 'WARMUP', label: 'Warmup' },
  { value: 'MAIN', label: 'Main' },
  { value: 'COOLDOWN', label: 'Cooldown' },
];

interface PieceEditorProps {
  sessionType: string;
}

export function PieceEditor({ sessionType }: PieceEditorProps) {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'pieces',
  });

  const [expandedSegments, setExpandedSegments] = useState<Record<PieceSegment, boolean>>({
    WARMUP: true,
    MAIN: true,
    COOLDOWN: true,
  });

  const toggleSegment = (segment: PieceSegment) => {
    setExpandedSegments((prev) => ({ ...prev, [segment]: !prev[segment] }));
  };

  // Watch all piece segments
  const pieces = useWatch({ control, name: 'pieces' }) || [];

  // Group pieces by segment
  const piecesBySegment = SEGMENTS.map((segment) => ({
    ...segment,
    pieces: fields
      .map((field, index) => ({ ...field, index }))
      .filter((_, i) => pieces[i]?.segment === segment.value),
  }));

  const addPiece = (segment: PieceSegment) => {
    append({
      segment,
      name: '',
      description: '',
      order: fields.length,
      distance: undefined,
      duration: undefined,
      targetSplit: undefined,
      targetRate: undefined,
      targetWatts: undefined,
      notes: '',
    });
  };

  return (
    <div className="space-y-4">
      {piecesBySegment.map((segment) => (
        <div
          key={segment.value}
          className="border border-bdr-default rounded-lg overflow-hidden"
        >
          {/* Segment header */}
          <button
            type="button"
            onClick={() => toggleSegment(segment.value)}
            className="w-full flex items-center justify-between px-4 py-3 bg-surface-default
              text-txt-primary font-medium hover:bg-surface-hover transition-colors"
          >
            <span className="flex items-center gap-2">
              {segment.label}
              <span className="text-sm text-txt-muted">({segment.pieces.length} pieces)</span>
            </span>
            {expandedSegments[segment.value] ? (
              <CaretUp className="w-5 h-5" />
            ) : (
              <CaretDown className="w-5 h-5" />
            )}
          </button>

          {/* Pieces list */}
          {expandedSegments[segment.value] && (
            <div className="p-4 space-y-3 bg-surface-elevated">
              {segment.pieces.length === 0 ? (
                <div className="text-center py-4 text-txt-muted">
                  No {segment.label.toLowerCase()} pieces yet
                </div>
              ) : (
                segment.pieces.map((piece) => (
                  <div
                    key={piece.id}
                    className="flex items-start gap-3 p-3 bg-surface-default rounded-lg border border-bdr-default"
                  >
                    {/* Drag handle */}
                    <div className="mt-2 cursor-grab text-txt-muted hover:text-txt-secondary">
                      <DotsSixVertical className="w-5 h-5" />
                    </div>

                    {/* Piece fields */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Name */}
                      <div className="md:col-span-2">
                        <input
                          {...register(`pieces.${piece.index}.name`)}
                          placeholder="Piece name (e.g., 4x2000m, 40' SS)"
                          className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-bdr-default
                            text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent-primary"
                        />
                      </div>

                      {/* Distance */}
                      <div>
                        <label className="block text-xs text-txt-muted mb-1">Distance (m)</label>
                        <input
                          type="number"
                          {...register(`pieces.${piece.index}.distance`, { valueAsNumber: true })}
                          placeholder="2000"
                          className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-bdr-default
                            text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent-primary"
                        />
                      </div>

                      {/* Duration */}
                      <div>
                        <label className="block text-xs text-txt-muted mb-1">Duration (min)</label>
                        <input
                          type="number"
                          {...register(`pieces.${piece.index}.duration`, { valueAsNumber: true })}
                          placeholder="40"
                          className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-bdr-default
                            text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent-primary"
                        />
                      </div>

                      {/* Erg-specific targets */}
                      {sessionType === 'ERG' && (
                        <>
                          <div>
                            <label className="block text-xs text-txt-muted mb-1">Target Split (sec/500m)</label>
                            <input
                              type="number"
                              step="0.1"
                              {...register(`pieces.${piece.index}.targetSplit`, { valueAsNumber: true })}
                              placeholder="105"
                              className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-bdr-default
                                text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-txt-muted mb-1">Target Rate (spm)</label>
                            <input
                              type="number"
                              {...register(`pieces.${piece.index}.targetRate`, { valueAsNumber: true })}
                              placeholder="24"
                              className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-bdr-default
                                text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent-primary"
                            />
                          </div>
                        </>
                      )}

                      {/* Notes */}
                      <div className="md:col-span-2">
                        <label className="block text-xs text-txt-muted mb-1">Notes</label>
                        <input
                          {...register(`pieces.${piece.index}.notes`)}
                          placeholder="Rest 3' between pieces"
                          className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-bdr-default
                            text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-accent-primary"
                        />
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => remove(piece.index)}
                      className="mt-2 p-1.5 rounded-lg text-txt-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}

              {/* Add piece button */}
              <button
                type="button"
                onClick={() => addPiece(segment.value)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-bdr-default
                  text-txt-muted hover:text-accent-primary hover:border-accent-primary transition-colors w-full justify-center"
              >
                <Plus className="w-4 h-4" />
                Add {segment.label} Piece
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
