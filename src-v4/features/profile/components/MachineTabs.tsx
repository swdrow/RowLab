/**
 * Segmented control for switching between erg machines.
 * Active tab uses accent-copper styling; inactive tabs are muted.
 */

import { Waves, Mountain, Bike } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type MachineType = 'rower' | 'skierg' | 'bikerg';

interface MachineOption {
  id: MachineType;
  label: string;
  icon: LucideIcon;
}

const MACHINES: MachineOption[] = [
  { id: 'rower', label: 'RowErg', icon: Waves },
  { id: 'skierg', label: 'SkiErg', icon: Mountain },
  { id: 'bikerg', label: 'BikeErg', icon: Bike },
];

interface MachineTabsProps {
  activeMachine: MachineType;
  onMachineChange: (machine: MachineType) => void;
}

export function MachineTabs({ activeMachine, onMachineChange }: MachineTabsProps) {
  return (
    <div className="flex gap-2" role="tablist" aria-label="Erg machine selector">
      {MACHINES.map(({ id, label, icon: Icon }) => {
        const isActive = activeMachine === id;
        return (
          <button
            key={id}
            onClick={() => onMachineChange(id)}
            role="tab"
            aria-selected={isActive}
            className={`
              flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium
              border transition-colors duration-150
              ${
                isActive
                  ? 'bg-accent-copper/20 text-accent-copper border-accent-copper/30'
                  : 'text-ink-secondary hover:text-ink-primary bg-ink-deep/30 border-transparent hover:border-ink-border/30'
              }
            `}
          >
            <Icon size={14} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
