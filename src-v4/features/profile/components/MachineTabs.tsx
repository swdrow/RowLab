/**
 * Segmented control for switching between erg machines.
 * Active tab uses accent styling; inactive tabs are muted.
 */

import { IconWaves, IconMountain, IconBike } from '@/components/icons';
import type { IconComponent } from '@/types/icons';

export type MachineType = 'rower' | 'skierg' | 'bikerg';

interface MachineOption {
  id: MachineType;
  label: string;
  icon: IconComponent;
}

const MACHINES: MachineOption[] = [
  { id: 'rower', label: 'RowErg', icon: IconWaves },
  { id: 'skierg', label: 'SkiErg', icon: IconMountain },
  { id: 'bikerg', label: 'BikeErg', icon: IconBike },
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
                  ? 'bg-accent-sand/15 text-accent-sand border-accent-sand/30'
                  : 'text-text-dim hover:text-text-bright bg-void-deep/30 border-transparent hover:border-edge-default/30'
              }
            `}
          >
            <Icon width={14} height={14} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
