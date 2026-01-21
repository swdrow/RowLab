import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Ship, Layers } from 'lucide-react';
import useLineupStore from '../store/lineupStore';
import BoatVisualizer from '../components/BoatVisualizer';

// Boat selector card
const BoatCard = ({ boat, isSelected, onClick }) => {
  const filledSeats = boat.seats.filter(s => s.athlete).length;
  const totalSeats = boat.seats.length;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        w-full p-3 rounded-xl text-left transition-all
        ${isSelected
          ? 'bg-gradient-to-r from-blade-blue/20 to-coxswain-violet/20 border-blade-blue'
          : 'glass-subtle border-white/10 hover:border-white/20'
        }
        border
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center
          ${isSelected ? 'bg-blade-blue' : 'bg-white/10'}
        `}>
          <Ship className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-text-primary text-sm truncate">
            {boat.boatConfig?.name || 'Boat'}
          </div>
          <div className="text-xs text-text-muted">
            {filledSeats}/{totalSeats} seats filled
          </div>
        </div>
      </div>
    </motion.button>
  );
};

function BoatViewPage() {
  const { activeBoats, boatConfigs } = useLineupStore();
  const [selectedBoatId, setSelectedBoatId] = useState(activeBoats[0]?.id || null);

  const selectedBoat = activeBoats.find(b => b.id === selectedBoatId);

  // Demo boat if no active boats
  const demoBoat = {
    id: 'demo',
    boatConfig: boatConfigs.find(c => c.name === 'Varsity 8+') || { name: 'Eight', numSeats: 8, hasCoxswain: true },
    shellName: 'Demo Shell',
    seats: Array(8).fill(null).map((_, i) => ({
      seatNumber: i + 1,
      side: i % 2 === 0 ? 'Port' : 'Starboard',
      athlete: i < 4 ? { lastName: `Rower${i + 1}`, firstName: 'Demo' } : null
    })),
    coxswain: { lastName: 'Cox', firstName: 'Demo' }
  };

  const displayBoat = selectedBoat || (activeBoats.length === 0 ? demoBoat : null);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-text-primary mb-1 flex items-center gap-3">
          <Ship className="w-7 h-7 text-blade-blue" />
          Boat View
        </h1>
        <p className="text-text-secondary text-sm">
          Visual representation of your boat lineups
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Visualizer */}
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl overflow-hidden border border-white/10 shadow-lg h-[400px]"
          >
            {displayBoat ? (
              <BoatVisualizer
                boat={displayBoat}
                onSeatClick={() => {
                  // TODO: Show seat detail modal
                }}
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-void-elevated">
                <div className="text-center">
                  <Ship className="w-12 h-12 mx-auto mb-3 text-text-muted" />
                  <p className="text-text-secondary">No boat selected</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="glass-card rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-coxswain-violet" />
              Active Boats
            </h3>

            <div className="space-y-2">
              {activeBoats.length > 0 ? (
                activeBoats.map(boat => (
                  <BoatCard
                    key={boat.id}
                    boat={boat}
                    isSelected={boat.id === selectedBoatId}
                    onClick={() => setSelectedBoatId(boat.id)}
                  />
                ))
              ) : (
                <div className="text-center py-6">
                  <Ship className="w-8 h-8 mx-auto mb-2 text-text-muted" />
                  <p className="text-text-secondary text-xs">No boats in lineup</p>
                  <p className="text-text-muted text-xs mt-1">Showing demo boat</p>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="glass-subtle rounded-xl p-4 border border-white/5">
            <h4 className="text-xs font-medium text-text-secondary mb-2">
              About This View
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              This is a stylized top-down view of your boat. Colored seats indicate assigned athletes.
              Oars appear for occupied positions.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default BoatViewPage;
