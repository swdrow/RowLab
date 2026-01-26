import * as RadixHoverCard from '@radix-ui/react-hover-card';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useState } from 'react';

interface HoverCardProps {
  children: ReactNode;
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  openDelay?: number;
  closeDelay?: number;
}

export function HoverCard({
  children,
  content,
  side = 'bottom',
  align = 'center',
  openDelay = 300,
  closeDelay = 100,
}: HoverCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <RadixHoverCard.Root
      open={open}
      onOpenChange={setOpen}
      openDelay={openDelay}
      closeDelay={closeDelay}
    >
      <RadixHoverCard.Trigger asChild>{children}</RadixHoverCard.Trigger>

      <AnimatePresence>
        {open && (
          <RadixHoverCard.Portal forceMount>
            <RadixHoverCard.Content
              asChild
              side={side}
              align={align}
              sideOffset={8}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="bg-surface-elevated rounded-lg border border-bdr-default shadow-xl p-4 z-50 max-w-xs"
              >
                {content}
                <RadixHoverCard.Arrow className="fill-surface-elevated" />
              </motion.div>
            </RadixHoverCard.Content>
          </RadixHoverCard.Portal>
        )}
      </AnimatePresence>
    </RadixHoverCard.Root>
  );
}

// Pre-built hover cards for common entities
interface AthleteHoverCardProps {
  athlete: {
    id: string;
    firstName: string;
    lastName: string;
    sidePreference?: string;
    avatar?: string;
    latestErgTest?: {
      testType: string;
      time: number;
    };
  };
  children: ReactNode;
}

export function AthleteHoverCard({ athlete, children }: AthleteHoverCardProps) {
  const formatErgTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <HoverCard
      content={
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {athlete.avatar ? (
              <img
                src={athlete.avatar}
                alt={`${athlete.firstName} ${athlete.lastName}`}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-medium">
                {athlete.firstName[0]}{athlete.lastName[0]}
              </div>
            )}
            <div>
              <div className="font-medium text-txt-primary">
                {athlete.firstName} {athlete.lastName}
              </div>
              {athlete.sidePreference && (
                <div className="text-sm text-txt-secondary">
                  {athlete.sidePreference} side
                </div>
              )}
            </div>
          </div>

          {athlete.latestErgTest && (
            <div className="pt-2 border-t border-bdr-default">
              <div className="text-xs text-txt-muted">Latest {athlete.latestErgTest.testType}</div>
              <div className="font-mono text-txt-primary">
                {formatErgTime(athlete.latestErgTest.time)}
              </div>
            </div>
          )}
        </div>
      }
    >
      {children}
    </HoverCard>
  );
}

interface SessionHoverCardProps {
  session: {
    id: string;
    name: string;
    type: string;
    date: string;
    pieces?: Array<{ name: string }>;
  };
  children: ReactNode;
}

export function SessionHoverCard({ session, children }: SessionHoverCardProps) {
  return (
    <HoverCard
      content={
        <div className="space-y-2">
          <div>
            <div className="font-medium text-txt-primary">{session.name}</div>
            <div className="text-sm text-txt-secondary">
              {session.type} · {new Date(session.date).toLocaleDateString()}
            </div>
          </div>

          {session.pieces && session.pieces.length > 0 && (
            <div className="pt-2 border-t border-bdr-default">
              <div className="text-xs text-txt-muted mb-1">Pieces</div>
              <div className="space-y-1">
                {session.pieces.slice(0, 3).map((piece, i) => (
                  <div key={i} className="text-sm text-txt-secondary">{piece.name}</div>
                ))}
                {session.pieces.length > 3 && (
                  <div className="text-sm text-txt-muted">+{session.pieces.length - 3} more</div>
                )}
              </div>
            </div>
          )}
        </div>
      }
    >
      {children}
    </HoverCard>
  );
}
