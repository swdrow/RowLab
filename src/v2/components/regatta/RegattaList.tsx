import { format, parseISO, isPast, isFuture, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, ChevronRight, MoreVertical, Trash2, Copy, Edit } from 'lucide-react';
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
  // Group by upcoming/past
  const upcoming = regattas.filter((r) => isFuture(parseISO(r.date)) || isToday(parseISO(r.date)));
  const past = regattas.filter((r) => isPast(parseISO(r.date)) && !isToday(parseISO(r.date)));

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-ink-raised rounded-lg h-20" />
        ))}
      </div>
    );
  }

  if (regattas.length === 0) {
    return (
      <div className="text-center py-12 text-txt-secondary">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="text-lg font-medium">No regattas yet</p>
        <p className="text-sm">Create your first regatta to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {upcoming.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-txt-secondary uppercase tracking-wide mb-3">
            Upcoming
          </h3>
          <div className="space-y-2">
            <AnimatePresence>
              {upcoming.map((regatta) => (
                <RegattaCard
                  key={regatta.id}
                  regatta={regatta}
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
          <h3 className="text-sm font-medium text-txt-secondary uppercase tracking-wide mb-3">
            Past
          </h3>
          <div className="space-y-2">
            <AnimatePresence>
              {past.map((regatta) => (
                <RegattaCard
                  key={regatta.id}
                  regatta={regatta}
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
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  isPast = false,
}: {
  regatta: Regatta;
  onSelect: (r: Regatta) => void;
  onEdit: (r: Regatta) => void;
  onDelete: (r: Regatta) => void;
  onDuplicate: (r: Regatta) => void;
  isPast?: boolean;
}) {
  const dateStr = format(parseISO(regatta.date), 'MMM d, yyyy');
  const isMultiDay = regatta.endDate && regatta.endDate !== regatta.date;
  const endDateStr = isMultiDay ? ` - ${format(parseISO(regatta.endDate!), 'MMM d')}` : '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`
        group relative glass-card rounded-lg border border-ink-border
        hover:border-ink-border-strong transition-colors cursor-pointer
        ${isPast ? 'opacity-70' : ''}
      `}
    >
      <div className="flex items-center p-4 gap-4" onClick={() => onSelect(regatta)}>
        {/* Date badge */}
        <div className="flex-shrink-0 w-14 h-14 bg-data-good/10 rounded-lg flex flex-col items-center justify-center">
          <span className="text-xs font-medium text-data-good uppercase">
            {format(parseISO(regatta.date), 'MMM')}
          </span>
          <span className="text-lg font-bold text-data-good">
            {format(parseISO(regatta.date), 'd')}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-txt-primary truncate">{regatta.name}</h4>
          <div className="flex items-center gap-3 mt-1 text-sm text-txt-secondary">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {dateStr}
              {endDateStr}
            </span>
            {regatta.location && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                {regatta.location}
              </span>
            )}
          </div>
          {regatta._count?.races !== undefined && (
            <span className="text-xs text-txt-tertiary mt-1 inline-block">
              {regatta._count.races} {regatta._count.races === 1 ? 'race' : 'races'}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Menu as="div" className="relative">
            <Menu.Button
              className="p-2 rounded-md hover:bg-ink-hover transition-colors opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4 text-txt-secondary" />
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-1 w-48 glass-card rounded-lg shadow-lg border border-ink-border py-1 z-10">
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                      active ? 'bg-ink-hover' : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(regatta);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                      active ? 'bg-ink-hover' : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(regatta);
                    }}
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-data-poor ${
                      active ? 'bg-ink-hover' : ''
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
          <ChevronRight className="w-4 h-4 text-txt-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </motion.div>
  );
}
