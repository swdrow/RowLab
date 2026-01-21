import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Loader2, Timer, Ship } from 'lucide-react';
import useRegattaStore from '../../store/regattaStore';
import SpotlightCard from '../ui/SpotlightCard';

// Custom Input component
const InputField = ({ className = '', ...props }) => (
  <input
    {...props}
    className={`w-full px-3 py-2 rounded-lg bg-void-deep/50 border border-white/[0.06] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blade-blue/50 focus:ring-1 focus:ring-blade-blue/20 transition-all duration-200 text-sm ${className}`}
  />
);

// Checkbox component
const Checkbox = ({ checked, onChange, className = '', ariaLabel }) => (
  <label className="flex items-center justify-center cursor-pointer">
    <div className="relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
        aria-label={ariaLabel}
      />
      <div className={`w-5 h-5 rounded border transition-all duration-200 flex items-center justify-center ${
        checked
          ? 'bg-blade-blue border-blade-blue shadow-[0_0_10px_rgba(0,112,243,0.3)]'
          : 'border-white/[0.1] bg-void-deep/50 hover:border-white/[0.2]'
      } ${className}`}>
        {checked && (
          <svg className="w-3 h-3 text-void-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
  </label>
);

/**
 * RaceResultsEntry - Form for entering race results
 * Redesigned with Precision Instrument design system
 */
function RaceResultsEntry({ regatta, race, onClose }) {
  const { batchAddResults } = useRegattaStore();

  const [results, setResults] = useState([
    { teamName: '', finishTime: '', place: 1, isOwnTeam: true },
    { teamName: '', finishTime: '', place: 2, isOwnTeam: false },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    const match = timeStr.match(/^(\d+):(\d{1,2}(?:\.\d+)?)$/);
    if (!match) return null;
    const minutes = parseInt(match[1], 10);
    const seconds = parseFloat(match[2]);
    if (seconds >= 60) return null;
    return minutes * 60 + seconds;
  };

  const addRow = () => {
    setResults([
      ...results,
      { teamName: '', finishTime: '', place: results.length + 1, isOwnTeam: false },
    ]);
  };

  const removeRow = (index) => {
    if (results.length <= 1) return;
    const updated = results.filter((_, i) => i !== index);
    recalculatePlaces(updated);
  };

  const updateResult = (index, field, value) => {
    const updated = [...results];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'finishTime') {
      recalculatePlaces(updated);
    } else {
      setResults(updated);
    }
  };

  const recalculatePlaces = (resultsList) => {
    const withTimes = resultsList.map((r, i) => ({
      ...r,
      index: i,
      timeSeconds: parseTime(r.finishTime) || Infinity,
    }));

    const sorted = [...withTimes].sort((a, b) => a.timeSeconds - b.timeSeconds);

    // Create new array with updated place values instead of mutating
    const updatedResults = resultsList.map((result, idx) => {
      const sortedItem = sorted.find((s) => s.index === idx);
      const newPlace = sorted.indexOf(sortedItem) + 1;
      return { ...result, place: newPlace };
    });

    setResults(updatedResults);
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);

    try {
      const validResults = results
        .filter((r) => r.teamName.trim() && r.finishTime.trim())
        .map((r) => ({
          teamName: r.teamName.trim(),
          finishTimeSeconds: parseTime(r.finishTime),
          place: r.place,
          isOwnTeam: r.isOwnTeam,
        }))
        .filter((r) => r.finishTimeSeconds !== null);

      if (validResults.length === 0) {
        setError('Please enter at least one result with team name and valid time');
        return;
      }

      await batchAddResults(race.id, validResults);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save results');
    } finally {
      setSaving(false);
    }
  };

  const getPlaceDisplay = (place) => {
    if (place === 1) return '1st';
    if (place === 2) return '2nd';
    if (place === 3) return '3rd';
    if (place === 11 || place === 12 || place === 13) return `${place}th`;
    const lastDigit = place % 10;
    if (lastDigit === 1) return `${place}st`;
    if (lastDigit === 2) return `${place}nd`;
    if (lastDigit === 3) return `${place}rd`;
    return `${place}th`;
  };

  return (
    <SpotlightCard className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{race.eventName}</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blade-blue/10 text-blade-blue text-xs font-medium rounded-full border border-blade-blue/20">
              <Ship className="w-3 h-3" />
              {race.boatClass}
            </span>
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Timer className="w-3 h-3" />
              {race.distanceMeters}m
            </span>
            {race.isHeadRace && (
              <span className="px-2.5 py-1 bg-coxswain-violet/10 text-coxswain-violet text-xs font-medium rounded-full border border-coxswain-violet/20">
                Head Race
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-all duration-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-danger-red/10 border border-danger-red/20 rounded-lg"
        >
          <p className="text-sm text-danger-red">{error}</p>
        </motion.div>
      )}

      {/* Results Table */}
      <div className="overflow-x-auto -mx-2">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider w-16">
                Place
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Team
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-28">
                Time
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-text-muted uppercase tracking-wider w-16">
                Ours
              </th>
              <th className="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {results.map((result, index) => (
              <tr
                key={index}
                className={result.isOwnTeam ? 'bg-blade-blue/5' : ''}
              >
                <td className="px-3 py-3">
                  <span className={`text-sm font-mono ${
                    result.place <= 3 ? 'text-warning-orange font-bold' : 'text-text-secondary'
                  }`}>
                    {getPlaceDisplay(result.place)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <InputField
                    value={result.teamName}
                    onChange={(e) => updateResult(index, 'teamName', e.target.value)}
                    placeholder="Team name"
                  />
                </td>
                <td className="px-3 py-3">
                  <InputField
                    value={result.finishTime}
                    onChange={(e) => updateResult(index, 'finishTime', e.target.value)}
                    placeholder="0:00.0"
                    className="text-center font-mono"
                  />
                </td>
                <td className="px-3 py-3 text-center">
                  <Checkbox
                    checked={result.isOwnTeam}
                    onChange={(e) => updateResult(index, 'isOwnTeam', e.target.checked)}
                    ariaLabel={`Mark ${result.teamName || 'team'} as our team`}
                  />
                </td>
                <td className="px-3 py-3">
                  {results.length > 1 && (
                    <button
                      onClick={() => removeRow(index)}
                      className="p-1.5 text-text-muted hover:text-danger-red transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.06]">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={addRow}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Add Row
        </motion.button>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-all duration-200"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blade-blue text-void-deep font-medium text-sm transition-all duration-150 ease-out hover:shadow-[0_0_20px_rgba(0,112,243,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Results'}
          </motion.button>
        </div>
      </div>
    </SpotlightCard>
  );
}

export default RaceResultsEntry;
