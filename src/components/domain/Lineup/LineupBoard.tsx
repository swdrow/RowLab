import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { Plus, X, Users, Anchor, Boat } from '@phosphor-icons/react';
import BoatColumn from '../Boat/BoatColumn';
import AthleteBankPanel from '../Athlete/AthleteBankPanel';
import useLineupStore from '../../../store/lineupStore';
import SpotlightCard from '../../ui/SpotlightCard';
import { OrganicBlob } from '../../Generative';

interface Athlete {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  side?: string;
  ergScore?: number;
}

export default function LineupBoard() {
  const {
    activeBoats,
    boatConfigs,
    addBoat,
    removeBoat,
    assignToSeat,
    assignToCoxswain,
  } = useLineupStore();

  const [athletePanelOpen, setAthletePanelOpen] = useState(false);
  const [showBoatPicker, setShowBoatPicker] = useState(false);
  const [draggedAthlete, setDraggedAthlete] = useState<Athlete | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'athlete') {
      setDraggedAthlete(active.data.current.athlete);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setDraggedAthlete(null);

      if (!over || !active.data.current) return;

      const draggedData = active.data.current;
      const dropData = over.data.current;

      if (draggedData.type === 'athlete' && dropData?.type === 'seat') {
        const athlete = draggedData.athlete;
        const { boatId, seatNumber, isCoxswain } = dropData;

        if (isCoxswain) {
          assignToCoxswain(boatId, athlete);
        } else {
          assignToSeat(boatId, seatNumber, athlete);
        }
      }
    },
    [assignToSeat, assignToCoxswain]
  );

  const handleAddBoat = useCallback(
    (boatType: string) => {
      const config = boatConfigs.find((c: any) => c.name.endsWith(boatType));
      if (config) {
        addBoat(config, undefined);
      } else {
        const numSeats = parseInt(boatType.replace(/[^\d]/g, '')) || 8;
        const hasCoxswain = boatType.includes('+');
        addBoat({ id: `config-${Date.now()}`, name: boatType, numSeats, hasCoxswain }, undefined);
      }
      setShowBoatPicker(false);
    },
    [boatConfigs, addBoat]
  );

  const filledSeats = activeBoats.reduce((acc, boat) => {
    const rowers = boat.seats?.filter((s: any) => s?.athlete !== null).length || 0;
    return acc + rowers + (boat.coxswain ? 1 : 0);
  }, 0);

  const totalSeats = activeBoats.reduce((acc, boat) => {
    return acc + (boat.numSeats || 0) + (boat.hasCoxswain ? 1 : 0);
  }, 0);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full relative">
        {/* Background atmosphere */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] opacity-[0.03]" style={{ backgroundColor: 'var(--accent-green)' }}>
          <div className="w-full h-full rounded-full blur-3xl" style={{ backgroundColor: 'inherit' }} />
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/20 flex items-center justify-center">
              <Anchor size={18} className="text-[var(--accent-green)]" />
            </div>
            <div>
              <h1 className="font-display font-semibold text-[var(--text-primary)] tracking-[-0.02em]">Lineup Builder</h1>
              {activeBoats.length > 0 && (
                <span className="text-xs text-[var(--text-muted)] font-mono tabular-nums">
                  <span className="text-[var(--accent-green)] font-medium">{filledSeats}</span>/{totalSeats} seats filled
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBoatPicker(true)}
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Boat</span>
            </button>
            <button
              onClick={() => setAthletePanelOpen(!athletePanelOpen)}
              className={`btn ${athletePanelOpen ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Users size={16} />
              <span className="hidden sm:inline">Athletes</span>
            </button>
          </div>
        </div>

        {/* Board */}
        <div className="lineup-board">
          <AnimatePresence mode="popLayout">
            {activeBoats.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex items-center justify-center p-8 relative"
              >
                {/* Organic blob background for empty state */}
                <OrganicBlob
                  color="rgba(0, 112, 243, 0.15)"
                  size={350}
                  duration={12}
                  blur={80}
                  opacity={0.4}
                  className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                />
                <div className="text-center max-w-md relative z-10">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center">
                    <Boat size={40} className="text-[var(--text-muted)]" />
                  </div>
                  <h2 className="text-xl font-display font-semibold text-[var(--text-primary)] mb-2 tracking-[-0.02em]">No boats yet</h2>
                  <p className="text-[var(--text-secondary)] mb-6">
                    Add a boat to start building your lineup
                  </p>
                  <button
                    onClick={() => setShowBoatPicker(true)}
                    className="btn btn-primary"
                  >
                    <Plus size={16} />
                    Add Boat
                  </button>
                </div>
              </motion.div>
            ) : (
              <>
                {activeBoats.map((boat: any, index: number) => (
                  <BoatColumn
                    key={boat.id}
                    boat={boat}
                    index={index}
                    onRemove={() => removeBoat(boat.id)}
                  />
                ))}
                <button
                  onClick={() => setShowBoatPicker(true)}
                  className="add-boat"
                >
                  <Plus size={24} />
                  <span className="text-sm">Add Boat</span>
                </button>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Athlete Panel */}
        <AthleteBankPanel
          isOpen={athletePanelOpen}
          onClose={() => setAthletePanelOpen(false)}
        />

        {/* Boat Picker Modal */}
        <AnimatePresence>
          {showBoatPicker && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                onClick={() => setShowBoatPicker(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-sm z-[60]"
              >
                <SpotlightCard className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/20 flex items-center justify-center">
                          <Boat size={18} className="text-[var(--accent-green)]" />
                        </div>
                        <h2 className="text-lg font-display font-semibold text-[var(--text-primary)] tracking-[-0.02em]">Add Boat</h2>
                      </div>
                      <button
                        onClick={() => setShowBoatPicker(false)}
                        className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-input)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Sweeping Boats */}
                    <div className="mb-3">
                      <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Sweeping</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {['8+', '8-', '4+', '4-', '2+', '2-'].map((type) => (
                          <button
                            key={type}
                            onClick={() => handleAddBoat(type)}
                            className="py-2.5 px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--accent-green)]/40 hover:bg-[var(--accent-green)]/5 text-[var(--text-primary)] font-display font-semibold text-base transition-all duration-200"
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sculling Boats */}
                    <div>
                      <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Sculling</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {['8x', '4x+', '4x', '2x', '1x'].map((type) => (
                          <button
                            key={type}
                            onClick={() => handleAddBoat(type)}
                            className="py-2.5 px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--accent-green)]/40 hover:bg-[var(--accent-green)]/5 text-[var(--text-primary)] font-display font-semibold text-base transition-all duration-200"
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedAthlete && (
          <div className="athlete-card dragging">
            <div className="athlete-avatar">
              {draggedAthlete.firstName?.[0] || draggedAthlete.name?.[0] || '?'}
            </div>
            <span className="athlete-name">
              {draggedAthlete.name ||
                `${draggedAthlete.firstName || ''} ${draggedAthlete.lastName || ''}`.trim()}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
