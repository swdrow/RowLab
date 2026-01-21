import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Undo2,
  Redo2,
  Sparkles,
  Download,
  Users,
  ChevronDown,
  Save,
} from 'lucide-react';
import useLineupStore from '../../../store/lineupStore';

// ============================================
// Lineup Toolbar
// Top action bar for the Kanban lineup builder
// ============================================

interface LineupToolbarProps {
  onAddBoat: () => void;
  onToggleAthletePanel: () => void;
  athletePanelOpen: boolean;
  onAISuggest?: () => void;
}

export default function LineupToolbar({
  onAddBoat,
  onToggleAthletePanel,
  athletePanelOpen,
  onAISuggest,
}: LineupToolbarProps) {
  const { lineupName, activeBoats } = useLineupStore();
  const [nameEditing, setNameEditing] = useState(false);
  const [tempName, setTempName] = useState(lineupName || '');

  const filledSeats = activeBoats.reduce((acc, boat) => {
    // seats is array of { seatNumber, side, athlete }
    const rowerCount = boat.seats?.filter((s: any) => s?.athlete !== null).length || 0;
    const coxCount = boat.coxswain ? 1 : 0;
    return acc + rowerCount + coxCount;
  }, 0);

  const totalSeats = activeBoats.reduce((acc, boat) => {
    return acc + (boat.numSeats || 0) + (boat.hasCoxswain ? 1 : 0);
  }, 0);

  return (
    <div className="toolbar">
      <div className="flex items-center gap-4">
        {/* Lineup Name */}
        <div className="flex items-center gap-2">
          {nameEditing ? (
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={() => setNameEditing(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setNameEditing(false);
                if (e.key === 'Escape') {
                  setTempName(lineupName || '');
                  setNameEditing(false);
                }
              }}
              className="px-3 py-1.5 bg-surface-700 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              placeholder="Lineup name..."
              autoFocus
            />
          ) : (
            <button
              onClick={() => setNameEditing(true)}
              className="text-white font-semibold hover:text-indigo-400 transition-colors"
            >
              {lineupName || 'Untitled Lineup'}
            </button>
          )}
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-white/10" />

        {/* Stats */}
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span className="font-medium text-white">{activeBoats.length}</span>
          <span>boats</span>
          <span className="mx-1 text-white/20">•</span>
          <span className="font-medium text-white">{filledSeats}</span>
          <span>/</span>
          <span>{totalSeats}</span>
          <span>seats filled</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Add Boat */}
        <motion.button
          onClick={onAddBoat}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={16} />
          Add Boat
        </motion.button>

        {/* Separator */}
        <div className="h-5 w-px bg-white/10" />

        {/* Quick Actions */}
        <button className="btn-icon" title="Undo (Ctrl+Z)" aria-label="Undo (Ctrl+Z)">
          <Undo2 size={18} aria-hidden="true" />
        </button>
        <button className="btn-icon" title="Redo (Ctrl+Shift+Z)" aria-label="Redo (Ctrl+Shift+Z)">
          <Redo2 size={18} aria-hidden="true" />
        </button>

        {/* Separator */}
        <div className="h-5 w-px bg-white/10" />

        {/* AI Suggest */}
        {onAISuggest && (
          <motion.button
            onClick={onAISuggest}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 hover:from-indigo-500/30 hover:to-purple-500/30 transition-all text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sparkles size={16} />
            AI Suggest
          </motion.button>
        )}

        {/* Export */}
        <button className="btn-icon" title="Export to PDF" aria-label="Export to PDF">
          <Download size={18} aria-hidden="true" />
        </button>

        {/* Save */}
        <button className="btn-icon" title="Save Lineup" aria-label="Save lineup">
          <Save size={18} aria-hidden="true" />
        </button>

        {/* Toggle Athlete Panel */}
        <motion.button
          onClick={onToggleAthletePanel}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
            athletePanelOpen
              ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
              : 'bg-surface-700 border-white/10 text-text-secondary hover:text-white'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Users size={16} />
          Athletes
          <ChevronDown
            size={14}
            className={`transition-transform ${athletePanelOpen ? 'rotate-180' : ''}`}
          />
        </motion.button>
      </div>
    </div>
  );
}
