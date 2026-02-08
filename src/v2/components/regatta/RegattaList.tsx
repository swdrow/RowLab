import { format, parseISO, isPast, isFuture, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  MapPin,
  ChevronRight,
  MoreVertical,
  Trash2,
  Copy,
  Edit,
  Anchor,
} from 'lucide-react';
import { Menu } from '@headlessui/react';
import type { Regatta } from '../../types/regatta';

type RegattaListProps = {
  regattas: Regatta[];
  isLoading?: boolean;
  onSelect: (regatta: Regatta) => void;
  onEdit: (regatta: Regatta) => void;
  onDelete: (regatta: Regatta) => void;
  onDuplicate: (regatta: Regatta) => void;
};

export function RegattaList({
  regattas,
  isLoading,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
}: RegattaListProps) {
  const upcoming = regattas.filter((r) => isFuture(parseISO(r.date)) || isToday(parseISO(r.date)));
  const past = regattas.filter((r) => isPast(parseISO(r.date)) && !isToday(parseISO(r.date)));

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-white/[0.02] rounded-2xl h-24 border border-white/[0.06]"
          />
        ))}
      </div>
    );
  }

  if (regattas.length === 0) {
    return (
      <div className="relative text-center py-20 rounded-2xl border border-ink-border bg-ink-raised overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-copper/[0.05] to-transparent pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-accent-copper/40 to-transparent" />
        <Anchor className="w-16 h-16 mx-auto mb-5 text-accent-copper/40" strokeWidth={1} />
        <p className="text-2xl font-display font-semibold text-ink-bright">No regattas yet</p>
        <p className="text-sm text-ink-secondary mt-2 max-w-xs mx-auto">
          Create your first regatta to start tracking race results and team rankings
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {upcoming.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-4 rounded-full bg-accent-copper" />
            <h3 className="text-xs font-bold text-accent-copper uppercase tracking-[0.2em]">
              Upcoming
            </h3>
            <div className="flex-1 h-px bg-gradient-to-r from-accent-copper/20 to-transparent" />
            <span className="text-xs font-mono text-accent-copper/60 tabular-nums font-semibold">
              {upcoming.length}
            </span>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {upcoming.map((regatta, i) => (
                <RegattaCard
                  key={regatta.id}
                  regatta={regatta}
                  index={i}
                  onSelect={onSelect}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-4 rounded-full bg-ink-muted" />
            <h3 className="text-xs font-bold text-ink-secondary uppercase tracking-[0.2em]">
              Past
            </h3>
            <div className="flex-1 h-px bg-gradient-to-r from-ink-border to-transparent" />
            <span className="text-xs font-mono text-ink-tertiary tabular-nums">{past.length}</span>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {past.map((regatta, i) => (
                <RegattaCard
                  key={regatta.id}
                  regatta={regatta}
                  index={i}
                  onSelect={onSelect}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  isPast
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}
    </div>
  );
}

function RegattaCard({
  regatta,
  index,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  isPast = false,
}: {
  regatta: Regatta;
  index: number;
  onSelect: (r: Regatta) => void;
  onEdit: (r: Regatta) => void;
  onDelete: (r: Regatta) => void;
  onDuplicate: (r: Regatta) => void;
  isPast?: boolean;
}) {
  const dateStr = format(parseISO(regatta.date), 'MMM d, yyyy');
  const isMultiDay = regatta.endDate && regatta.endDate !== regatta.date;
  const endDateStr = isMultiDay ? ` — ${format(parseISO(regatta.endDate!), 'MMM d')}` : '';
  const monthStr = format(parseISO(regatta.date), 'MMM').toUpperCase();
  const dayStr = format(parseISO(regatta.date), 'd');
  const isTodayRegatta = isToday(parseISO(regatta.date));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.04, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      {/* Card with left accent border */}
      <div
        className={`
          relative rounded-2xl overflow-hidden cursor-pointer
          bg-ink-raised border border-ink-border
          shadow-card hover:shadow-card-hover
          transition-all duration-200
          hover:-translate-y-px hover:border-accent-copper/30
          ${isPast ? 'opacity-60 hover:opacity-80' : ''}
        `}
        onClick={() => onSelect(regatta)}
      >
        {/* Left accent bar */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 ${
            isTodayRegatta ? 'bg-data-good' : isPast ? 'bg-ink-muted' : 'bg-accent-copper'
          }`}
        />

        {/* Live indicator glow for today's regattas */}
        {isTodayRegatta && (
          <div className="absolute inset-0 bg-gradient-to-r from-data-good/[0.06] to-transparent pointer-events-none" />
        )}

        <div className="flex items-center p-5 pl-6 gap-5">
          {/* Date badge */}
          <div
            className={`
              flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center
              ${
                isTodayRegatta
                  ? 'bg-data-good/[0.12] ring-1 ring-data-good/20'
                  : isPast
                    ? 'bg-ink-deep/50 ring-1 ring-ink-border'
                    : 'bg-accent-copper/[0.10] ring-1 ring-accent-copper/20'
              }
            `}
          >
            <span
              className={`text-[10px] font-bold tracking-widest ${
                isTodayRegatta ? 'text-data-good' : isPast ? 'text-ink-muted' : 'text-accent-copper'
              }`}
            >
              {monthStr}
            </span>
            <span
              className={`text-2xl font-display font-bold -mt-0.5 ${
                isTodayRegatta
                  ? 'text-data-good'
                  : isPast
                    ? 'text-ink-secondary'
                    : 'text-accent-copper'
              }`}
            >
              {dayStr}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-ink-bright truncate text-base">{regatta.name}</h4>
              {isTodayRegatta && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-data-good/[0.12] text-data-good ring-1 ring-data-good/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-data-good animate-pulse-subtle" />
                  Live
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 mt-1.5 text-sm text-ink-secondary">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-ink-tertiary" />
                {dateStr}
                {endDateStr}
              </span>
              {regatta.location && (
                <span className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-ink-tertiary flex-shrink-0" />
                  {regatta.location}
                </span>
              )}
            </div>

            {regatta._count?.races !== undefined && (
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-mono text-ink-tertiary px-2 py-0.5 rounded-md bg-ink-deep/50 tabular-nums">
                  {regatta._count.races} {regatta._count.races === 1 ? 'race' : 'races'}
                </span>
                {regatta.courseType && (
                  <span className="text-xs text-ink-tertiary px-2 py-0.5 rounded-md bg-ink-deep/50">
                    {regatta.courseType}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Menu as="div" className="relative">
              <Menu.Button
                className="p-2 rounded-xl hover:bg-ink-hover transition-colors
                           opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4 text-ink-secondary" />
              </Menu.Button>
              <Menu.Items
                className="absolute right-0 mt-1 w-48 rounded-xl shadow-2xl border border-ink-border bg-ink-float py-1 z-10
                                      backdrop-blur-xl"
              >
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-ink-primary ${
                        active ? 'bg-ink-hover' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(regatta);
                      }}
                    >
                      <Edit className="w-4 h-4 text-ink-secondary" />
                      Edit
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-ink-primary ${
                        active ? 'bg-ink-hover' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(regatta);
                      }}
                    >
                      <Copy className="w-4 h-4 text-ink-secondary" />
                      Duplicate
                    </button>
                  )}
                </Menu.Item>
                <div className="my-1 h-px bg-ink-border" />
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-data-poor ${
                        active ? 'bg-data-poor/[0.08]' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(regatta);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Menu>
            <ChevronRight
              className="w-5 h-5 text-accent-copper/50 opacity-0 group-hover:opacity-100
                                       group-hover:translate-x-0.5 transition-all duration-200"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
