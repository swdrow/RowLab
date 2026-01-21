import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
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
  List,
  Sparkles
} from 'lucide-react';
import useLineupStore from '../store/lineupStore';
import { getCountryFlag } from '../utils/fileLoader';
import { PageContainer } from '../components/Layout';
import SpotlightCard from '../components/ui/SpotlightCard';
import { OrganicBlob } from '../components/Generative';

// Side badge component - Precision Instrument style
const SideBadge = ({ side }) => {
  const config = {
    P: { label: 'Port', bg: 'bg-danger-red/15', text: 'text-danger-red', border: 'border-danger-red/30' },
    S: { label: 'Starboard', bg: 'bg-blade-blue/15', text: 'text-blade-blue', border: 'border-blade-blue/30' },
    B: { label: 'Both', bg: 'bg-warning-orange/15', text: 'text-warning-orange', border: 'border-warning-orange/30' },
    Cox: { label: 'Coxswain', bg: 'bg-coxswain-violet/15', text: 'text-coxswain-violet', border: 'border-coxswain-violet/30' }
  };

  const { label, bg, text, border } = config[side] || { label: side, bg: 'bg-void-elevated', text: 'text-text-muted', border: 'border-white/10' };

  return (
    <span className={`px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-md border ${bg} ${text} ${border}`}>
      {label}
    </span>
  );
};

// Athlete card component with Precision Instrument styling
const AthleteCard = ({ athlete, onClick, view, headshotMap }) => {
  const headshot = headshotMap?.get(athlete.id);

  // Side-based accent color - static mapping for Tailwind JIT
  const accentStyles = {
    P: {
      glowBg: 'bg-danger-red/20',
      borderColor: 'border-danger-red/30',
      ringColor: 'ring-danger-red/10'
    },
    S: {
      glowBg: 'bg-blade-blue/20',
      borderColor: 'border-blade-blue/30',
      ringColor: 'ring-blade-blue/10'
    },
    Cox: {
      glowBg: 'bg-coxswain-violet/20',
      borderColor: 'border-coxswain-violet/30',
      ringColor: 'ring-coxswain-violet/10'
    },
    B: {
      glowBg: 'bg-warning-orange/20',
      borderColor: 'border-warning-orange/30',
      ringColor: 'ring-warning-orange/10'
    }
  };

  const styles = accentStyles[athlete.side] || accentStyles.B;

  if (view === 'grid') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onClick(athlete)}
        className="cursor-pointer group"
      >
        <SpotlightCard
          className={`
            h-full rounded-xl
            bg-void-elevated border border-white/5
            hover:translate-y-[-2px]
            hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.4)]
            transition-all duration-150 ease-out
          `}
        >
          <div className="p-5 flex flex-col items-center text-center">
            {/* Avatar with glow effect */}
            <div className="relative mb-4">
              <div className={`absolute inset-0 ${styles.glowBg} rounded-full blur-xl scale-75 opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className={`relative w-16 h-16 rounded-full overflow-hidden bg-void-elevated border-2 ${styles.borderColor} ring-2 ${styles.ringColor} ring-offset-2 ring-offset-void-surface`}>
                <img
                  src={headshot || '/images/placeholder-avatar.svg'}
                  alt={`${athlete.firstName} ${athlete.lastName}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Country flag emoji */}
              {athlete.country && getCountryFlag(athlete.country) && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full overflow-hidden border-2 border-void-surface bg-void-elevated shadow-md flex items-center justify-center">
                  <span className="text-sm">{getCountryFlag(athlete.country)}</span>
                </div>
              )}
            </div>

            {/* Name */}
            <h3 className="font-display font-semibold text-text-primary mb-2 tracking-[-0.02em]">
              {athlete.firstName} {athlete.lastName}
            </h3>

            {/* Side badge */}
            <div className="mb-3">
              <SideBadge side={athlete.side} />
            </div>

            {/* Stats mini bar */}
            <div className="w-full pt-3 border-t border-white/[0.04]">
              <div className="flex items-center justify-center gap-6 text-xs text-text-muted">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blade-blue" />
                  <span className="font-mono">--:--</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Ship className="w-3.5 h-3.5 text-text-muted" />
                  <span className="font-mono">0</span>
                </span>
              </div>
            </div>
          </div>
        </SpotlightCard>
      </motion.div>
    );
  }

  // List view with Precision Instrument styling
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onClick(athlete)}
      className="cursor-pointer group"
    >
      <SpotlightCard
        className={`
          rounded-xl
          bg-void-elevated border border-white/5
          hover:border-white/10
          transition-all duration-150 ease-out
        `}
      >
        <div className="p-4 flex items-center gap-4">
          {/* Avatar */}
          <div className={`w-11 h-11 rounded-full overflow-hidden bg-void-elevated border-2 ${styles.borderColor} flex-shrink-0`}>
            <img
              src={headshot || '/images/placeholder-avatar.svg'}
              alt={`${athlete.firstName} ${athlete.lastName}`}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-medium text-text-primary truncate tracking-[-0.02em]">
              {athlete.lastName}, {athlete.firstName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <SideBadge side={athlete.side} />
              {athlete.country && (
                <span className="text-xs text-text-muted">{athlete.country}</span>
              )}
            </div>
          </div>

          {/* Erg time */}
          <div className="text-right">
            <div className="text-sm font-mono text-blade-blue">--:--</div>
            <div className="text-xs text-text-muted">2k</div>
          </div>

          <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-blade-blue group-hover:translate-x-1 transition-all" />
        </div>
      </SpotlightCard>
    </motion.div>
  );
};

// Athlete detail modal - Precision Instrument glass morphism
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
        {/* Backdrop with blur */}
        <div className="absolute inset-0 bg-void-deep/80 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.15, ease: [0, 0, 0.2, 1] }}
          onClick={(e) => e.stopPropagation()}
          className={`
            relative p-6 max-w-2xl w-full rounded-2xl
            bg-void-elevated border border-white/5
            shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]
          `}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-lg bg-void-elevated/50 border border-white/[0.06] flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-void-elevated transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-start gap-5 mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-void-elevated border-2 border-white/[0.06]">
                <img
                  src={headshot || '/images/placeholder-avatar.svg'}
                  alt={`${athlete.firstName} ${athlete.lastName}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {athlete.country && getCountryFlag(athlete.country) && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg overflow-hidden border-2 border-void-surface bg-void-elevated shadow-sm flex items-center justify-center">
                  <span className="text-lg">{getCountryFlag(athlete.country)}</span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold text-text-primary mb-2 font-display tracking-[-0.02em]">
                {athlete.firstName} {athlete.lastName}
              </h2>
              <div className="flex items-center gap-3">
                <SideBadge side={athlete.side} />
                {athlete.country && (
                  <span className="text-text-muted">{athlete.country}</span>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid with neon accents */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-blade-blue/5 border border-blade-blue/10">
              <Activity className="w-5 h-5 text-blade-blue mb-2" />
              <div className="text-2xl font-mono font-bold text-text-primary tabular-nums">--:--</div>
              <div className="text-[10px] uppercase tracking-widest text-text-muted font-mono">2K Time</div>
            </div>
            <div className="p-4 rounded-xl bg-blade-blue/5 border border-blade-blue/10">
              <TrendingUp className="w-5 h-5 text-blade-blue mb-2" />
              <div className="text-2xl font-mono font-bold text-text-primary tabular-nums">--</div>
              <div className="text-[10px] uppercase tracking-widest text-text-muted font-mono">Watts</div>
            </div>
            <div className="p-4 rounded-xl bg-coxswain-violet/5 border border-coxswain-violet/10">
              <Ship className="w-5 h-5 text-coxswain-violet mb-2" />
              <div className="text-2xl font-mono font-bold text-text-primary tabular-nums">0</div>
              <div className="text-[10px] uppercase tracking-widest text-text-muted font-mono">Lineups</div>
            </div>
            <div className="p-4 rounded-xl bg-warning-orange/5 border border-warning-orange/10">
              <Award className="w-5 h-5 text-warning-orange mb-2" />
              <div className="text-2xl font-mono font-bold text-text-primary tabular-nums">--</div>
              <div className="text-[10px] uppercase tracking-widest text-text-muted font-mono">Rank</div>
            </div>
          </div>

          {/* Performance Section */}
          <div className="p-5 rounded-xl bg-void-deep/50 border border-white/[0.04]">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2 font-display tracking-[-0.02em]">
              <BarChart3 className="w-5 h-5 text-blade-blue" />
              Performance History
            </h3>
            <div className="text-center py-6 text-text-muted">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-text-secondary">No erg data available</p>
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

  // Filter button style helper
  const getFilterButtonClass = (value) => {
    const isActive = sideFilter === value;
    const colorMap = {
      all: isActive ? 'bg-blade-blue text-void-deep shadow-[0_0_15px_rgba(0,112,243,0.3)]' : 'bg-void-elevated/50 text-text-secondary hover:text-text-primary',
      P: isActive ? 'bg-danger-red/20 text-danger-red border-danger-red/30' : 'bg-void-elevated/50 text-text-secondary hover:text-danger-red',
      S: isActive ? 'bg-blade-blue/20 text-blade-blue border-blade-blue/30' : 'bg-void-elevated/50 text-text-secondary hover:text-blade-blue',
      B: isActive ? 'bg-warning-orange/20 text-warning-orange border-warning-orange/30' : 'bg-void-elevated/50 text-text-secondary hover:text-warning-orange',
      Cox: isActive ? 'bg-coxswain-violet/20 text-coxswain-violet border-coxswain-violet/30' : 'bg-void-elevated/50 text-text-secondary hover:text-coxswain-violet'
    };
    return `px-3 py-1.5 text-sm font-medium rounded-lg border border-white/[0.06] transition-all duration-200 ${colorMap[value]}`;
  };

  return (
    <PageContainer maxWidth="2xl" className="relative py-4 sm:py-6">
      {/* Background atmosphere - void glows */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blade-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-danger-red/3 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,112,243,0.15)]">
            <Users size={20} className="text-blade-blue" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-primary tracking-[-0.02em]">
            Athlete Roster
          </h1>
        </div>
        <p className="text-sm sm:text-base text-text-secondary ml-[52px]">
          Manage your team's athletes and view their performance data
        </p>
      </motion.div>

      {/* Controls - Precision Instrument Card */}
      <SpotlightCard
        className={`
          rounded-xl mb-5
          bg-void-elevated border border-white/5
        `}
      >
        <div className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search athletes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-void-deep/50 border border-white/[0.06] text-text-primary placeholder-text-muted focus:outline-none focus:border-blade-blue/30 focus:shadow-[0_0_0_3px_rgba(0,112,243,0.1)] transition-all"
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
                  className={getFilterButtonClass(value)}
                >
                  {label} ({sideCounts[value]})
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-void-deep/50 rounded-lg p-1 border border-white/[0.04]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-blade-blue/15 text-blade-blue shadow-sm'
                    : 'text-text-muted hover:text-text-primary hover:bg-void-elevated/50'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-blade-blue/15 text-blade-blue shadow-sm'
                    : 'text-text-muted hover:text-text-primary hover:bg-void-elevated/50'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </SpotlightCard>

      {/* Results count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-4 flex items-center justify-between"
      >
        <span className="text-sm text-text-muted">
          Showing <span className="text-blade-blue font-medium">{filteredAthletes.length}</span> of {athletes.length} athletes
        </span>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Sparkles className="w-3.5 h-3.5 text-blade-blue" />
          <span>Click to view details</span>
        </div>
      </motion.div>

      {/* Athletes grid/list */}
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-2'
        }
      >
        {filteredAthletes.map((athlete, i) => (
          <motion.div
            key={athlete.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
          >
            <AthleteCard
              athlete={athlete}
              onClick={setSelectedAthlete}
              view={viewMode}
              headshotMap={headshotMap}
            />
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {filteredAthletes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 relative"
        >
          {/* Organic blob background */}
          <OrganicBlob
            color="rgba(124, 58, 237, 0.12)"
            size={300}
            duration={12}
            blur={70}
            opacity={0.5}
            className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          />
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-void-elevated border border-white/[0.06] flex items-center justify-center">
              <Users className="w-10 h-10 text-text-muted" />
            </div>
            <h3 className="text-lg font-display font-semibold text-text-primary mb-2 tracking-[-0.02em]">No Athletes Found</h3>
            <p className="text-text-secondary max-w-sm mx-auto">
              {searchQuery || sideFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add athletes to get started'}
            </p>
          </div>
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
    </PageContainer>
  );
}

export default AthletesPage;
