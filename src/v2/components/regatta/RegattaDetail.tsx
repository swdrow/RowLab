import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Clock,
  Trophy,
  Flag,
} from 'lucide-react';
import { Dialog } from '@headlessui/react';
import type { Regatta, Event, Race, RaceResult } from '../../types/regatta';
import { EventForm } from './EventForm';
import { RaceForm } from './RaceForm';
import { ResultsForm } from './ResultsForm';
import { MarginBadge } from './MarginDisplay';
import {
  useCreateEvent,
  useDeleteEvent,
  useCreateRace,
  useDeleteRace,
  useBatchAddResults,
} from '../../hooks/useRaces';

type RegattaDetailProps = {
  regatta: Regatta;
  onEdit: () => void;
};

export function RegattaDetail({ regatta, onEdit }: RegattaDetailProps) {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [modalContent, setModalContent] = useState<{
    type: 'event' | 'race' | 'results';
    eventId?: string;
    race?: Race;
  } | null>(null);

  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const createRace = useCreateRace();
  const deleteRace = useDeleteRace();
  const batchAddResults = useBatchAddResults();

  const isMultiDay = regatta.endDate && regatta.endDate !== regatta.date;
  const regattaDays = isMultiDay
    ? Math.ceil(
        (new Date(regatta.endDate!).getTime() - new Date(regatta.date).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1
    : 1;

  const toggleEvent = (eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  // Get winner time for margin calculations
  const getWinnerTime = (results: RaceResult[]) => {
    const winner = results.find((r) => r.place === 1);
    return winner?.finishTimeSeconds || null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-lg p-6 border border-ink-border">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-txt-primary">{regatta.name}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-txt-secondary">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(parseISO(regatta.date), 'MMMM d, yyyy')}
                {isMultiDay && ` - ${format(parseISO(regatta.endDate!), 'MMMM d, yyyy')}`}
              </span>
              {regatta.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {regatta.location}
                </span>
              )}
              {regatta.courseType && (
                <span className="flex items-center gap-1">
                  <Flag className="w-4 h-4" />
                  {regatta.courseType}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {regatta.externalUrl && (
              <a
                href={regatta.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-ink-hover transition-colors text-txt-secondary"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            )}
            <button
              onClick={onEdit}
              className="p-2 rounded-lg hover:bg-ink-hover transition-colors text-txt-secondary"
            >
              <Edit className="w-5 h-5" />
            </button>
          </div>
        </div>

        {regatta.teamGoals && (
          <div className="mt-4 p-3 bg-data-good/10 rounded-lg border border-data-good/20">
            <p className="text-sm font-medium text-data-good">Team Goals</p>
            <p className="text-sm text-txt-primary mt-1">{regatta.teamGoals}</p>
          </div>
        )}
      </div>

      {/* Events */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-txt-primary">Events</h3>
          <button
            onClick={() => setModalContent({ type: 'event' })}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium
                     bg-accent-primary text-white rounded-lg hover:bg-accent-primary-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>

        {!regatta.events || regatta.events.length === 0 ? (
          <div className="text-center py-8 text-txt-secondary">
            <Flag className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No events yet. Add events to start building your race schedule.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {regatta.events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isExpanded={expandedEvents.has(event.id)}
                onToggle={() => toggleEvent(event.id)}
                onAddRace={() => setModalContent({ type: 'race', eventId: event.id })}
                onDeleteEvent={() => deleteEvent.mutate(event.id)}
                onAddResults={(race) => setModalContent({ type: 'results', race })}
                onDeleteRace={(raceId) => deleteRace.mutate(raceId)}
                getWinnerTime={getWinnerTime}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal for forms */}
      <Dialog open={!!modalContent} onClose={() => setModalContent(null)} className="relative z-50">
        <div className="fixed inset-0 bg-ink-deep/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg glass-card rounded-xl shadow-xl p-6">
            <Dialog.Title className="text-lg font-semibold text-txt-primary mb-4">
              {modalContent?.type === 'event' && 'Add Event'}
              {modalContent?.type === 'race' && 'Add Race'}
              {modalContent?.type === 'results' && `Enter Results: ${modalContent.race?.eventName}`}
            </Dialog.Title>

            {modalContent?.type === 'event' && (
              <EventForm
                regattaDays={regattaDays}
                onSubmit={(data) => {
                  createEvent.mutate({ regattaId: regatta.id, event: data });
                  setModalContent(null);
                }}
                onCancel={() => setModalContent(null)}
                isSubmitting={createEvent.isPending}
              />
            )}

            {modalContent?.type === 'race' && modalContent.eventId && (
              <RaceForm
                regattaDate={regatta.date}
                onSubmit={(data) => {
                  createRace.mutate({ eventId: modalContent.eventId!, race: data });
                  setModalContent(null);
                }}
                onCancel={() => setModalContent(null)}
                isSubmitting={createRace.isPending}
              />
            )}

            {modalContent?.type === 'results' && modalContent.race && (
              <ResultsForm
                race={modalContent.race}
                existingResults={modalContent.race.results}
                onSubmit={(results) => {
                  batchAddResults.mutate({ raceId: modalContent.race!.id, results });
                  setModalContent(null);
                }}
                onCancel={() => setModalContent(null)}
                isSubmitting={batchAddResults.isPending}
              />
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

// Sub-components
function EventCard({
  event,
  isExpanded,
  onToggle,
  onAddRace,
  onDeleteEvent,
  onAddResults,
  onDeleteRace,
  getWinnerTime,
}: {
  event: Event;
  isExpanded: boolean;
  onToggle: () => void;
  onAddRace: () => void;
  onDeleteEvent: () => void;
  onAddResults: (race: Race) => void;
  onDeleteRace: (raceId: string) => void;
  getWinnerTime: (results: RaceResult[]) => number | null;
}) {
  const raceCount = event.races?.length || 0;

  return (
    <div className="glass-card rounded-lg border border-ink-border overflow-hidden">
      {/* Event header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-ink-hover transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-txt-tertiary" />
          ) : (
            <ChevronRight className="w-5 h-5 text-txt-tertiary" />
          )}
          <div>
            <h4 className="font-medium text-txt-primary">{event.name}</h4>
            <p className="text-sm text-txt-secondary">
              {raceCount} {raceCount === 1 ? 'race' : 'races'}
              {event.scheduledDay && ` • Day ${event.scheduledDay}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onAddRace}
            className="p-1.5 rounded hover:bg-ink-base text-txt-tertiary hover:text-txt-primary transition-colors"
            title="Add race"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onDeleteEvent}
            className="p-1.5 rounded hover:bg-ink-base text-txt-tertiary hover:text-data-poor transition-colors"
            title="Delete event"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Races */}
      <AnimatePresence>
        {isExpanded && event.races && event.races.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-ink-border"
          >
            {event.races.map((race) => (
              <RaceRow
                key={race.id}
                race={race}
                onAddResults={() => onAddResults(race)}
                onDelete={() => onDeleteRace(race.id)}
                winnerTime={getWinnerTime(race.results || [])}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RaceRow({
  race,
  onAddResults,
  onDelete,
  winnerTime,
}: {
  race: Race;
  onAddResults: () => void;
  onDelete: () => void;
  winnerTime: number | null;
}) {
  const hasResults = race.results && race.results.length > 0;
  const ownResult = race.results?.find((r) => r.isOwnTeam);

  return (
    <div className="px-4 py-3 border-b border-ink-border last:border-b-0 hover:bg-ink-hover/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="font-medium text-txt-primary text-sm">{race.eventName}</p>
            <p className="text-xs text-txt-tertiary">
              {race.boatClass} • {race.distanceMeters}m
              {race.scheduledTime && (
                <>
                  {' '}
                  • <Clock className="w-3 h-3 inline" />{' '}
                  {format(parseISO(race.scheduledTime), 'h:mm a')}
                </>
              )}
            </p>
          </div>

          {/* Our result badge */}
          {ownResult && (
            <div className="flex items-center gap-2">
              {ownResult.place === 1 && <Trophy className="w-4 h-4 text-data-warning" />}
              <span className="text-sm font-medium text-txt-primary">
                {ownResult.place ? `${ownResult.place}${getOrdinal(ownResult.place)}` : '—'}
              </span>
              {ownResult.finishTimeSeconds && winnerTime && (
                <MarginBadge
                  marginSeconds={ownResult.marginBackSeconds}
                  winnerTimeSeconds={winnerTime}
                  boatClass={race.boatClass}
                  distanceMeters={race.distanceMeters}
                />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAddResults}
            className="px-2 py-1 text-xs font-medium rounded
                     bg-ink-base text-txt-secondary hover:bg-data-good hover:text-white
                     transition-colors"
          >
            {hasResults ? 'Edit Results' : 'Add Results'}
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-ink-base text-txt-tertiary hover:text-data-poor transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
