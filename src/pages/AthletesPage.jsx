import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Users,
  ChevronRight,
  X,
  Activity,
  Award,
  TrendingUp,
  Clock,
  Ship,
  BarChart3,
  Grid,
  List
} from 'lucide-react';
import useLineupStore from '../store/lineupStore';

// Simple fade-in animation - no stagger to avoid flicker
const cardAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.2 }
};

// Side badge component
const SideBadge = ({ side }) => {
  const config = {
    P: { label: 'Port', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    S: { label: 'Starboard', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    B: { label: 'Both', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    Cox: { label: 'Coxswain', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
  };

  const { label, color } = config[side] || { label: side, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };

  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${color}`}>
      {label}
    </span>
  );
};

// Athlete card component
const AthleteCard = ({ athlete, onClick, view, headshotMap }) => {
  const headshot = headshotMap?.get(athlete.id);

  if (view === 'grid') {
    return (
      <motion.div
        {...cardAnimation}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onClick(athlete)}
        className="glass-card rounded-2xl p-6 border border-white/10 hover:border-white/20 cursor-pointer transition-colors group"
      >
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-2 border-white/20 group-hover:border-indigo-400/50 transition-colors">
              <img
                src={headshot || '/images/placeholder-avatar.svg'}
                alt={`${athlete.firstName} ${athlete.lastName}`}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Country flag overlay */}
            {athlete.country && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 bg-white">
                <img
                  src={`/api/flags/${athlete.country.toLowerCase()}`}
                  alt={athlete.country}
                  className="w-full h-full object-cover"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}
          </div>

          {/* Name */}
          <h3 className="font-bold text-white mb-1">
            {athlete.firstName} {athlete.lastName}
          </h3>

          {/* Side badge */}
          <div className="mb-3">
            <SideBadge side={athlete.side} />
          </div>

          {/* Mock stats */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              --:--
            </span>
            <span className="flex items-center gap-1">
              <Ship className="w-3 h-3" />
              0
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // List view
  return (
    <motion.div
      {...cardAnimation}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onClick(athlete)}
      className="glass-card rounded-xl p-4 border border-white/10 hover:border-white/20 cursor-pointer transition-colors flex items-center gap-4"
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/20 flex-shrink-0">
        <img
          src={headshot || '/images/placeholder-avatar.svg'}
          alt={`${athlete.firstName} ${athlete.lastName}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-white truncate">
          {athlete.lastName}, {athlete.firstName}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <SideBadge side={athlete.side} />
          {athlete.country && (
            <span className="text-xs text-gray-500">{athlete.country}</span>
          )}
        </div>
      </div>

      {/* Mock erg time */}
      <div className="text-right">
        <div className="text-sm font-mono text-gray-400">--:--</div>
        <div className="text-xs text-gray-500">2k</div>
      </div>

      <ChevronRight className="w-5 h-5 text-gray-400" />
    </motion.div>
  );
};

// Athlete detail modal
const AthleteDetailModal = ({ athlete, onClose, headshotMap }) => {
  if (!athlete) return null;

  const headshot = headshotMap?.get(athlete.id);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative glass-elevated rounded-3xl p-8 max-w-2xl w-full border border-white/20 shadow-glass-floating"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-start gap-6 mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-2 border-white/20">
                <img
                  src={headshot || '/images/placeholder-avatar.svg'}
                  alt={`${athlete.firstName} ${athlete.lastName}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {athlete.country && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl overflow-hidden border-2 border-white dark:border-gray-800 bg-white shadow-lg">
                  <img
                    src={`/api/flags/${athlete.country.toLowerCase()}`}
                    alt={athlete.country}
                    className="w-full h-full object-cover"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </div>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">
                {athlete.firstName} {athlete.lastName}
              </h2>
              <div className="flex items-center gap-3">
                <SideBadge side={athlete.side} />
                {athlete.country && (
                  <span className="text-gray-400">{athlete.country}</span>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-subtle rounded-xl p-4 text-center">
              <Activity className="w-6 h-6 mx-auto mb-2 text-indigo-400" />
              <div className="text-lg font-bold text-white">--:--</div>
              <div className="text-xs text-gray-400">2k Time</div>
            </div>
            <div className="glass-subtle rounded-xl p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-400" />
              <div className="text-lg font-bold text-white">--</div>
              <div className="text-xs text-gray-400">Watts</div>
            </div>
            <div className="glass-subtle rounded-xl p-4 text-center">
              <Ship className="w-6 h-6 mx-auto mb-2 text-purple-400" />
              <div className="text-lg font-bold text-white">0</div>
              <div className="text-xs text-gray-400">Lineups</div>
            </div>
            <div className="glass-subtle rounded-xl p-4 text-center">
              <Award className="w-6 h-6 mx-auto mb-2 text-amber-400" />
              <div className="text-lg font-bold text-white">--</div>
              <div className="text-xs text-gray-400">Rank</div>
            </div>
          </div>

          {/* Performance Section */}
          <div className="glass-subtle rounded-xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance History
            </h3>
            <div className="text-center py-8 text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No erg data available</p>
              <p className="text-sm mt-1">Upload erg tests to see performance history</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

function AthletesPage() {
  const { athletes, headshotMap } = useLineupStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sideFilter, setSideFilter] = useState('all');
  const [sortBy, setSortBy] = useState('lastName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedAthlete, setSelectedAthlete] = useState(null);

  // Filter and sort athletes
  const filteredAthletes = useMemo(() => {
    let result = [...athletes];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.firstName.toLowerCase().includes(query) ||
        a.lastName.toLowerCase().includes(query) ||
        a.country?.toLowerCase().includes(query)
      );
    }

    // Filter by side
    if (sideFilter !== 'all') {
      result = result.filter(a => a.side === sideFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'lastName') {
        comparison = a.lastName.localeCompare(b.lastName);
      } else if (sortBy === 'firstName') {
        comparison = a.firstName.localeCompare(b.firstName);
      } else if (sortBy === 'country') {
        comparison = (a.country || '').localeCompare(b.country || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [athletes, searchQuery, sideFilter, sortBy, sortOrder]);

  // Side counts for filter badges
  const sideCounts = useMemo(() => {
    return {
      all: athletes.length,
      P: athletes.filter(a => a.side === 'P').length,
      S: athletes.filter(a => a.side === 'S').length,
      B: athletes.filter(a => a.side === 'B').length,
      Cox: athletes.filter(a => a.side === 'Cox').length
    };
  }, [athletes]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">
          Athlete Roster
        </h1>
        <p className="text-gray-400">
          Manage your team's athletes and view their performance data
        </p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-4 mb-6 border border-white/10"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search athletes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-white placeholder-gray-500"
            />
          </div>

          {/* Side filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
            {[
              { value: 'all', label: 'All' },
              { value: 'P', label: 'Port' },
              { value: 'S', label: 'Starboard' },
              { value: 'B', label: 'Both' },
              { value: 'Cox', label: 'Cox' }
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSideFilter(value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  sideFilter === value
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {label} ({sideCounts[value]})
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Results count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-4 text-sm text-gray-400"
      >
        Showing {filteredAthletes.length} of {athletes.length} athletes
      </motion.div>

      {/* Athletes grid/list */}
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-3'
        }
      >
        {filteredAthletes.map((athlete) => (
          <AthleteCard
            key={athlete.id}
            athlete={athlete}
            onClick={setSelectedAthlete}
            view={viewMode}
            headshotMap={headshotMap}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredAthletes.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
          <h3 className="text-xl font-bold text-gray-300 mb-2">
            No Athletes Found
          </h3>
          <p className="text-gray-400">
            {searchQuery || sideFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Add athletes to get started'}
          </p>
        </motion.div>
      )}

      {/* Athlete detail modal */}
      {selectedAthlete && (
        <AthleteDetailModal
          athlete={selectedAthlete}
          onClose={() => setSelectedAthlete(null)}
          headshotMap={headshotMap}
        />
      )}
    </div>
  );
}

export default AthletesPage;
