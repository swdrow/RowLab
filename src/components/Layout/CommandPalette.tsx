import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Ship,
  Users,
  Activity,
  BarChart3,
  Settings,
  Dumbbell,
  MessageSquare,
  Zap,
  Clock,
  ArrowRight,
  Hash,
  Command,
  Mic
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
  category: 'navigation' | 'action' | 'recent';
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * CommandPalette - Keyboard-driven navigation and actions
 *
 * Precision Instrument design:
 * - Opens with Cmd+K / Ctrl+K
 * - Fuzzy search through navigation and actions
 * - Recent items tracking
 * - Keyboard navigation
 */
export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation commands
  const navigationCommands: CommandItem[] = useMemo(() => [
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      subtitle: 'Team overview and quick stats',
      icon: <LayoutDashboard size={18} />,
      action: () => navigate('/app'),
      keywords: ['home', 'overview', 'main'],
      category: 'navigation'
    },
    {
      id: 'nav-lineup',
      title: 'Lineup Builder',
      subtitle: 'Create and manage boat lineups',
      icon: <Ship size={18} />,
      action: () => navigate('/app/lineup'),
      keywords: ['boats', 'seats', 'assignment', 'builder'],
      category: 'navigation'
    },
    {
      id: 'nav-coxswain',
      title: 'Coxswain View',
      subtitle: 'Race-ready lineup display',
      icon: <Mic size={18} />,
      action: () => navigate('/app/coxswain'),
      keywords: ['cox', 'race', 'display'],
      category: 'navigation'
    },
    {
      id: 'nav-athletes',
      title: 'Athletes',
      subtitle: 'Manage roster and profiles',
      icon: <Users size={18} />,
      action: () => navigate('/app/athletes'),
      keywords: ['roster', 'rowers', 'team', 'members'],
      category: 'navigation'
    },
    {
      id: 'nav-erg',
      title: 'Erg Data',
      subtitle: 'Performance testing results',
      icon: <Dumbbell size={18} />,
      action: () => navigate('/app/erg'),
      keywords: ['erg', 'testing', '2k', '6k', 'concept2'],
      category: 'navigation'
    },
    {
      id: 'nav-analytics',
      title: 'Analytics',
      subtitle: 'Performance insights and trends',
      icon: <BarChart3 size={18} />,
      action: () => navigate('/app/analytics'),
      keywords: ['stats', 'charts', 'insights', 'performance'],
      category: 'navigation'
    },
    {
      id: 'nav-seat-racing',
      title: 'Seat Racing',
      subtitle: 'Run and analyze seat races',
      icon: <Activity size={18} />,
      action: () => navigate('/app/seat-racing'),
      keywords: ['racing', 'comparison', 'elo', 'ranking'],
      category: 'navigation'
    },
    {
      id: 'nav-racing',
      title: 'Racing',
      subtitle: 'Race management and results',
      icon: <Clock size={18} />,
      action: () => navigate('/app/racing'),
      keywords: ['regatta', 'results', 'race day'],
      category: 'navigation'
    },
    {
      id: 'nav-communication',
      title: 'Communication',
      subtitle: 'Team messaging and announcements',
      icon: <MessageSquare size={18} />,
      action: () => navigate('/app/communication'),
      keywords: ['messages', 'announcements', 'team'],
      category: 'navigation'
    },
    {
      id: 'nav-advanced',
      title: 'Advanced',
      subtitle: 'Advanced features and tools',
      icon: <Zap size={18} />,
      action: () => navigate('/app/advanced'),
      keywords: ['ai', 'optimization', 'tools'],
      category: 'navigation'
    },
    {
      id: 'nav-settings',
      title: 'Settings',
      subtitle: 'App preferences and account',
      icon: <Settings size={18} />,
      action: () => navigate('/app/settings'),
      keywords: ['preferences', 'account', 'profile', 'config'],
      category: 'navigation'
    },
  ], [navigate]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      return navigationCommands;
    }

    const lowerQuery = query.toLowerCase();
    return navigationCommands.filter(cmd => {
      const matchTitle = cmd.title.toLowerCase().includes(lowerQuery);
      const matchSubtitle = cmd.subtitle?.toLowerCase().includes(lowerQuery);
      const matchKeywords = cmd.keywords?.some(k => k.includes(lowerQuery));
      return matchTitle || matchSubtitle || matchKeywords;
    });
  }, [query, navigationCommands]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      selectedEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const content = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-void-surface/95 backdrop-blur-xl saturate-[180%] border border-white/[0.08] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]"
          onClick={e => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-white/[0.06]">
            <Search size={18} className="text-text-muted flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search or jump to..."
              className="flex-1 h-14 bg-transparent text-text-primary placeholder-text-muted text-base outline-none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <kbd className="flex items-center gap-0.5 px-1.5 py-1 text-[10px] font-mono text-text-muted bg-white/[0.04] border border-white/[0.06] rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div
            ref={listRef}
            className="max-h-[50vh] overflow-y-auto py-2"
          >
            {filteredCommands.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Hash size={32} className="mx-auto mb-2 text-text-muted" />
                <p className="text-text-secondary text-sm">No results for "{query}"</p>
              </div>
            ) : (
              <>
                {/* Navigation section */}
                <div className="px-3 py-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Navigation
                  </span>
                </div>
                {filteredCommands.map((cmd, index) => (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                      ${index === selectedIndex
                        ? 'bg-blade-blue/10 text-text-primary'
                        : 'text-text-secondary hover:bg-white/[0.04]'
                      }
                    `}
                  >
                    <span className={`
                      flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                      ${index === selectedIndex
                        ? 'bg-blade-blue/20 text-blade-blue'
                        : 'bg-white/[0.04] text-text-muted'
                      }
                    `}>
                      {cmd.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{cmd.title}</p>
                      {cmd.subtitle && (
                        <p className="text-xs text-text-muted truncate">{cmd.subtitle}</p>
                      )}
                    </div>
                    {index === selectedIndex && (
                      <ArrowRight size={14} className="flex-shrink-0 text-blade-blue" />
                    )}
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.06] bg-void-deep/50">
            <div className="flex items-center gap-3 text-[10px] text-text-muted">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded">ESC</kbd>
                Close
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-text-muted">
              <Command size={10} />
              <span>RowLab</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

export default CommandPalette;
