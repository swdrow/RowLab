import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import SeatSlot from './SeatSlot';
import useShellStore from '../../../store/shellStore';
import useLineupStore from '../../../store/lineupStore';

interface Athlete {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  side?: string;
}

interface Seat {
  seatNumber: number;
  side: string;
  athlete: Athlete | null;
}

interface Boat {
  id: string;
  name: string;
  numSeats: number;
  hasCoxswain: boolean;
  seats: Seat[];
  coxswain: Athlete | null;
  shellName?: string | null;
}

interface BoatColumnProps {
  boat: Boat;
  index: number;
  onRemove: () => void;
}

export default function BoatColumn({ boat, index, onRemove }: BoatColumnProps) {
  const filledSeats = useMemo(() => {
    const rowers = boat.seats?.filter((s) => s.athlete !== null).length || 0;
    return rowers + (boat.coxswain ? 1 : 0);
  }, [boat.seats, boat.coxswain]);

  const totalSeats = boat.numSeats + (boat.hasCoxswain ? 1 : 0);

  const { shells } = useShellStore();
  const { updateBoatShell } = useLineupStore();
  const boatShells = shells.filter(s => s.boatClass === boat.name);

  const seatNumbers = useMemo(() => {
    return Array.from({ length: boat.numSeats }, (_, i) => boat.numSeats - i);
  }, [boat.numSeats]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.05 }}
      className="boat-column"
    >
      {/* Header */}
      <div className="boat-header">
        <div>
          <h3 className="boat-name">{boat.name}</h3>
          <span className="boat-count">{filledSeats}/{totalSeats}</span>
        </div>
        {boatShells.length > 0 && (
          <select
            value={boat.shellName || ''}
            onChange={(e) => updateBoatShell(boat.id, e.target.value || null)}
            className="ml-2 px-2 py-1 text-xs rounded border border-white/10 bg-void-elevated text-text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="">Shell...</option>
            {boatShells.map(shell => (
              <option key={shell.id} value={shell.name}>
                {shell.name}
              </option>
            ))}
          </select>
        )}
        <button onClick={onRemove} className="btn-icon" title="Remove boat">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Seats */}
      <div className="boat-seats">
        {/* Coxswain */}
        {boat.hasCoxswain && (
          <SeatSlot
            boatId={boat.id}
            seatNumber={0}
            isCoxswain
            athlete={boat.coxswain}
            side="cox"
          />
        )}

        {/* Rower seats */}
        {seatNumbers.map((seatNumber) => {
          const seat = boat.seats?.find((s) => s.seatNumber === seatNumber);
          const side = seat?.side || (seatNumber % 2 === 0 ? 'port' : 'starboard');
          return (
            <SeatSlot
              key={seatNumber}
              boatId={boat.id}
              seatNumber={seatNumber}
              athlete={seat?.athlete || null}
              side={side}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
