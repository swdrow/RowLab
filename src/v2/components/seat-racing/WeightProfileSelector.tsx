import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CaretDown, Faders } from '@phosphor-icons/react';
import { useWeightProfiles } from '../../hooks/useCompositeRankings';
import type { RankingWeightProfile } from '../../types/advancedRanking';

interface WeightProfileSelectorProps {
  selectedProfileId: string;
  customWeights?: { onWater: number; erg: number; attendance: number };
  onProfileChange: (profileId: string) => void;
  onCustomWeightsChange: (weights: { onWater: number; erg: number; attendance: number }) => void;
}

export function WeightProfileSelector({
  selectedProfileId,
  customWeights,
  onProfileChange,
  onCustomWeightsChange,
}: WeightProfileSelectorProps) {
  const { profiles, isLoading } = useWeightProfiles();
  const [isExpanded, setIsExpanded] = useState(false);
  const [localWeights, setLocalWeights] = useState(
    customWeights || {
      onWater: 0.75,
      erg: 0.15,
      attendance: 0.1,
    }
  );

  // Sync local weights when profile changes
  useEffect(() => {
    if (selectedProfileId !== 'custom') {
      const profile = profiles.find((p) => p.id === selectedProfileId);
      if (profile) {
        setLocalWeights(profile.weights);
      }
    }
  }, [selectedProfileId, profiles]);

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  const handleWeightChange = (key: 'onWater' | 'erg' | 'attendance', value: number) => {
    // Calculate remaining weight to distribute
    const remaining = 1 - value;
    const otherKeys = ['onWater', 'erg', 'attendance'].filter((k) => k !== key) as Array<
      'onWater' | 'erg' | 'attendance'
    >;
    const otherTotal = otherKeys.reduce((sum, k) => sum + localWeights[k], 0);

    const newWeights = { ...localWeights, [key]: value };

    // Redistribute remaining weight proportionally to other factors
    if (otherTotal > 0) {
      otherKeys.forEach((k) => {
        newWeights[k] = (localWeights[k] / otherTotal) * remaining;
      });
    } else {
      // If others are 0, split evenly
      otherKeys.forEach((k) => {
        newWeights[k] = remaining / otherKeys.length;
      });
    }

    // Round to avoid floating point issues
    newWeights.onWater = Math.round(newWeights.onWater * 100) / 100;
    newWeights.erg = Math.round(newWeights.erg * 100) / 100;
    newWeights.attendance = Math.round((1 - newWeights.onWater - newWeights.erg) * 100) / 100;

    setLocalWeights(newWeights);
    onProfileChange('custom');
    onCustomWeightsChange(newWeights);
  };

  return (
    <div className="space-y-3">
      {/* Profile selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-txt-secondary">Weight Profile:</label>
        <div className="relative">
          <select
            value={selectedProfileId}
            onChange={(e) => {
              onProfileChange(e.target.value);
              if (e.target.value !== 'custom') {
                setIsExpanded(false);
              }
            }}
            className="appearance-none pl-3 pr-8 py-1.5 bg-surface-secondary border border-bdr-primary rounded-lg text-sm text-txt-primary focus:ring-2 focus:ring-accent-primary cursor-pointer"
            disabled={isLoading}
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
          <CaretDown
            size={16}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-txt-secondary pointer-events-none"
          />
        </div>

        {/* Toggle custom sliders */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-1.5 rounded-lg transition-colors ${
            isExpanded
              ? 'bg-accent-primary text-white'
              : 'bg-surface-secondary text-txt-secondary hover:bg-surface-hover'
          }`}
          title="Customize weights"
        >
          <Faders size={16} />
        </button>
      </div>

      {/* Weight display summary */}
      <div className="flex items-center gap-4 text-xs text-txt-secondary">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[var(--data-good)]" />
          On-Water: {(localWeights.onWater * 100).toFixed(0)}%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[var(--data-warning)]" />
          Erg: {(localWeights.erg * 100).toFixed(0)}%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[var(--data-excellent)]" />
          Attendance: {(localWeights.attendance * 100).toFixed(0)}%
        </span>
      </div>

      {/* Custom weight sliders */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-surface-secondary rounded-lg space-y-4">
              <WeightSlider
                label="On-Water Performance"
                value={localWeights.onWater}
                onChange={(v) => handleWeightChange('onWater', v)}
                color="blue"
                description="Seat racing and practice comparisons"
              />
              <WeightSlider
                label="Erg Performance"
                value={localWeights.erg}
                onChange={(v) => handleWeightChange('erg', v)}
                color="orange"
                description="2k tests and erg workouts"
              />
              <WeightSlider
                label="Attendance"
                value={localWeights.attendance}
                onChange={(v) => handleWeightChange('attendance', v)}
                color="green"
                description="Practice attendance rate (30 days)"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// SLIDER COMPONENT
// ============================================

interface WeightSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color: 'blue' | 'orange' | 'green';
  description: string;
}

function WeightSlider({ label, value, onChange, color, description }: WeightSliderProps) {
  const colorClasses = {
    blue: 'bg-[var(--data-good)]',
    orange: 'bg-[var(--data-warning)]',
    green: 'bg-[var(--data-excellent)]',
  };

  // Resolve accent color from CSS variables for slider thumb
  const accentColors = {
    blue:
      getComputedStyle(document.documentElement).getPropertyValue('--data-good').trim() ||
      '#3B82F6',
    orange:
      getComputedStyle(document.documentElement).getPropertyValue('--data-warning').trim() ||
      '#F59E0B',
    green:
      getComputedStyle(document.documentElement).getPropertyValue('--data-excellent').trim() ||
      '#22C55E',
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-txt-primary">{label}</span>
        <span className="text-sm text-txt-secondary">{(value * 100).toFixed(0)}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-surface-primary rounded-lg appearance-none cursor-pointer"
        style={{
          accentColor: accentColors[color],
        }}
      />
      <p className="text-xs text-txt-secondary">{description}</p>
    </div>
  );
}

export default WeightProfileSelector;
