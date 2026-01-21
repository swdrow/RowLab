import React, { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import {
  Rotate3D,
  Ship,
  Users,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RefreshCw,
  Eye,
  Layers
} from 'lucide-react';
import useLineupStore from '../store/lineupStore';

// Lazy load the 3D viewer to avoid SSR issues
const Boat3DViewer = React.lazy(() => import('../components/3D/Boat3DViewer'));

// Fallback loading component
const Loading3D = () => (
  <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-blue-950 rounded-2xl">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blade-blue to-coxswain-violet flex items-center justify-center"
    >
      <Rotate3D className="w-8 h-8 text-white" />
    </motion.div>
  </div>
);

// Boat selector card
const BoatSelectorCard = ({ boat, isSelected, onClick }) => {
  const filledSeats = boat.seats.filter(s => s.athlete).length;
  const totalSeats = boat.seats.length;
  const hasCox = boat.coxswain;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        w-full p-4 rounded-xl text-left transition-all
        ${isSelected
          ? 'bg-gradient-to-r from-blade-blue/20 to-coxswain-violet/20 border-blade-blue'
          : 'glass-card border-white/10 hover:border-white/20'
        }
        border
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center
          ${isSelected
            ? 'bg-gradient-to-br from-blade-blue to-coxswain-violet'
            : 'bg-white/10'
          }
        `}>
          <Ship className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white truncate">
            {boat.boatConfig?.name || 'Boat'}
          </div>
          <div className="text-xs text-gray-400">
            {boat.shellName || 'No shell assigned'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-white">
            {filledSeats + (hasCox ? 1 : 0)}/{totalSeats + (boat.boatConfig?.hasCoxswain ? 1 : 0)}
          </div>
          <div className="text-xs text-gray-500">seats</div>
        </div>
      </div>
    </motion.button>
  );
};

function Boat3DPage() {
  const { activeBoats, boatConfigs } = useLineupStore();
  const [selectedBoatId, setSelectedBoatId] = useState(activeBoats[0]?.id || null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const selectedBoat = activeBoats.find(b => b.id === selectedBoatId);

  // Create a demo boat if no active boats
  const demoBoat = {
    id: 'demo',
    boatConfig: boatConfigs.find(c => c.name === 'Varsity 8+') || { name: 'Eight', numSeats: 8, hasCoxswain: true },
    shellName: 'Demo Shell',
    seats: Array(8).fill(null).map((_, i) => ({
      seatNumber: i + 1,
      side: i % 2 === 0 ? 'Port' : 'Starboard',
      athlete: null
    })),
    coxswain: null,
    isExpanded: true
  };

  const displayBoat = selectedBoat || (activeBoats.length === 0 ? demoBoat : null);

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : 'container mx-auto px-4 py-8'}`}>
      {/* Header */}
      {!isFullscreen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <Rotate3D className="w-8 h-8 text-blade-blue" />
            3D Boat Visualization
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Interactive 3D view of your boat lineups
          </p>
        </motion.div>
      )}

      <div className={`grid ${isFullscreen ? '' : 'lg:grid-cols-4'} gap-6 ${isFullscreen ? 'h-full' : ''}`}>
        {/* 3D Viewer */}
        <div className={`${isFullscreen ? 'h-full' : 'lg:col-span-3 h-[600px]'} relative`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-glass-floating"
          >
            <Suspense fallback={<Loading3D />}>
              {displayBoat ? (
                <Boat3DViewer
                  boat={displayBoat}
                  autoRotate={autoRotate}
                  onSeatClick={() => {
                    // TODO: Show seat detail modal
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-blue-950">
                  <div className="text-center">
                    <Ship className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-xl font-medium text-gray-400 mb-2">
                      No Boat Selected
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Add a boat to your lineup to view it in 3D
                    </p>
                  </div>
                </div>
              )}
            </Suspense>
          </motion.div>

          {/* Viewer controls */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`
                p-3 rounded-xl border transition-all
                ${autoRotate
                  ? 'bg-blade-blue/20 border-blade-blue text-blade-blue'
                  : 'glass-card border-white/10 text-gray-400 hover:text-white'
                }
              `}
              title={autoRotate ? 'Stop rotation' : 'Auto rotate'}
            >
              {autoRotate ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-3 rounded-xl glass-card border border-white/10 text-gray-400 hover:text-white transition-all"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Seat legend */}
          <div className="absolute bottom-4 left-4 glass-card rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-port" />
                <span className="text-gray-400">Port</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-starboard" />
                <span className="text-gray-400">Starboard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span className="text-gray-400">Coxswain</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Boat selector */}
        {!isFullscreen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-coxswain-violet" />
                Active Boats
              </h3>

              <div className="space-y-3">
                {activeBoats.length > 0 ? (
                  activeBoats.map(boat => (
                    <BoatSelectorCard
                      key={boat.id}
                      boat={boat}
                      isSelected={boat.id === selectedBoatId}
                      onClick={() => setSelectedBoatId(boat.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Ship className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-400 text-sm">
                      No boats in lineup
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Viewing demo boat
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Selected boat info */}
            {displayBoat && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-4 border border-white/10"
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blade-blue" />
                  Boat Details
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type</span>
                    <span className="text-white font-medium">{displayBoat.boatConfig?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Shell</span>
                    <span className="text-white font-medium">{displayBoat.shellName || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Seats</span>
                    <span className="text-white font-medium">{displayBoat.seats.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Coxswain</span>
                    <span className="text-white font-medium">
                      {displayBoat.boatConfig?.hasCoxswain ? 'Yes' : 'No'}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-white/10">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Crew</span>
                    </div>
                    {displayBoat.seats.filter(s => s.athlete).length > 0 ? (
                      <div className="space-y-2">
                        {displayBoat.seats
                          .filter(s => s.athlete)
                          .map((seat, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className={`
                                w-2 h-2 rounded-full
                                ${seat.side === 'Port' ? 'bg-port' : 'bg-starboard'}
                              `} />
                              <span className="text-gray-300 text-xs">
                                #{seat.seatNumber} - {seat.athlete.lastName}
                              </span>
                            </div>
                          ))
                        }
                        {displayBoat.coxswain && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-gray-300 text-xs">
                              Cox - {displayBoat.coxswain.lastName}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-xs">No athletes assigned</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Info card */}
            <div className="glass-subtle rounded-xl p-4 border border-white/5">
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                3D Controls
              </h4>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Click and drag to rotate</li>
                <li>• Scroll to zoom in/out</li>
                <li>• Right-click drag to pan</li>
                <li>• Click seats to select</li>
              </ul>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Boat3DPage;
