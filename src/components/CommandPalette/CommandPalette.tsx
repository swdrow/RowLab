import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Home,
  Anchor,
  Users,
  Activity,
  BarChart3,
  Dumbbell,
  Plus,
  Download,
  Upload,
  Settings,
  Sparkles,
  FileText,
  ArrowRight,
  Command,
} from 'lucide-react';
import { commandPaletteVariants } from '../../theme/tokens/motion';

// Command types
interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  shortcut?: string[];
  action: () => void;
  category: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Define all commands
  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      subtitle: 'View team overview',
      icon: Home,
      shortcut: ['G', 'D'],
      action: () => { navigate('/app'); onClose(); },
      category: 'Navigation',
      keywords: ['home', 'main', 'overview'],
    },
    {
      id: 'nav-lineup',
      title: 'Go to Lineup Builder',
      subtitle: 'Create and manage lineups',
      icon: Anchor,
      shortcut: ['G', 'L'],
      action: () => { navigate('/app/lineup'); onClose(); },
      category: 'Navigation',
      keywords: ['boats', 'create', 'assign'],
    },
    {
      id: 'nav-athletes',
      title: 'Go to Athletes',
      subtitle: 'Manage athlete roster',
      icon: Users,
      shortcut: ['G', 'A'],
      action: () => { navigate('/app/athletes'); onClose(); },
      category: 'Navigation',
      keywords: ['roster', 'rowers', 'team'],
    },
    {
      id: 'nav-erg',
      title: 'Go to Erg Data',
      subtitle: 'View erg test results',
      icon: Dumbbell,
      shortcut: ['G', 'E'],
      action: () => { navigate('/app/erg'); onClose(); },
      category: 'Navigation',
      keywords: ['test', 'ergo', '2k', 'scores'],
    },
    {
      id: 'nav-analytics',
      title: 'Go to Analytics',
      subtitle: 'Performance insights',
      icon: BarChart3,
      shortcut: ['G', 'N'],
      action: () => { navigate('/app/analytics'); onClose(); },
      category: 'Navigation',
      keywords: ['stats', 'charts', 'reports'],
    },
    {
      id: 'nav-boat-view',
      title: 'Go to Boat View',
      subtitle: '3D visualization',
      icon: Activity,
      shortcut: ['G', 'B'],
      action: () => { navigate('/app/boat-view'); onClose(); },
      category: 'Navigation',
      keywords: ['3d', 'visual', 'diagram'],
    },

    // Actions
    {
      id: 'action-new-lineup',
      title: 'Create New Lineup',
      subtitle: 'Start a new boat lineup',
      icon: Plus,
      shortcut: ['Cmd', 'N'],
      action: () => { navigate('/app/lineup'); onClose(); },
      category: 'Actions',
      keywords: ['add', 'new', 'create'],
    },
    {
      id: 'action-export-pdf',
      title: 'Export to PDF',
      subtitle: 'Download lineup as PDF',
      icon: Download,
      shortcut: ['Cmd', 'P'],
      action: () => { onClose(); }, // TODO: Implement export
      category: 'Actions',
      keywords: ['download', 'print', 'save'],
    },
    {
      id: 'action-import-data',
      title: 'Import Data',
      subtitle: 'Upload CSV or Excel file',
      icon: Upload,
      action: () => { onClose(); }, // TODO: Implement import
      category: 'Actions',
      keywords: ['csv', 'excel', 'upload'],
    },

    // AI
    {
      id: 'ai-suggest',
      title: 'AI Lineup Suggestions',
      subtitle: 'Get AI-powered recommendations',
      icon: Sparkles,
      shortcut: ['Cmd', 'J'],
      action: () => { onClose(); }, // TODO: Implement AI suggestions
      category: 'AI',
      keywords: ['suggest', 'recommend', 'optimize'],
    },

    // Settings
    {
      id: 'settings-preferences',
      title: 'Settings',
      subtitle: 'Configure preferences',
      icon: Settings,
      shortcut: ['Cmd', ','],
      action: () => { navigate('/app/settings'); onClose(); },
      category: 'Settings',
      keywords: ['preferences', 'config', 'options'],
    },
  ], [navigate, onClose]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;

    const lowerQuery = query.toLowerCase();
    return commands.filter((cmd) => {
      const matchTitle = cmd.title.toLowerCase().includes(lowerQuery);
      const matchSubtitle = cmd.subtitle?.toLowerCase().includes(lowerQuery);
      const matchKeywords = cmd.keywords?.some(kw => kw.includes(lowerQuery));
      return matchTitle || matchSubtitle || matchKeywords;
    });
  }, [commands, query]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: { [key: string]: CommandItem[] } = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filteredCommands, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedEl = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  let flatIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="command-palette-backdrop"
        variants={commandPaletteVariants.overlay}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={onClose}
      />

      {/* Palette */}
      <motion.div
        className="command-palette"
        variants={commandPaletteVariants.content}
        initial="initial"
        animate="animate"
        exit="exit"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="command-palette-input-wrapper">
          <Search className="command-palette-icon" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="command-palette-kbd">ESC</span>
        </div>

        {/* Command List */}
        <div ref={listRef} className="command-palette-list custom-scrollbar">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-text-tertiary">
              <Command size={32} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">No commands found</p>
              <p className="text-xs mt-2 opacity-50">Try a different search</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category} className="command-palette-group">
                <div className="command-palette-group-title">{category}</div>
                {items.map((item) => {
                  const currentIndex = flatIndex++;
                  const isSelected = currentIndex === selectedIndex;
                  const Icon = item.icon;

                  return (
                    <motion.div
                      key={item.id}
                      data-index={currentIndex}
                      className={`command-palette-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Icon className="command-palette-item-icon" size={18} />
                      <div className="command-palette-item-content">
                        <div className="command-palette-item-title">{item.title}</div>
                        {item.subtitle && (
                          <div className="command-palette-item-subtitle">{item.subtitle}</div>
                        )}
                      </div>
                      {item.shortcut && (
                        <div className="command-palette-item-shortcut">
                          {item.shortcut.map((key, i) => (
                            <span key={i} className="kbd">
                              {key === 'Cmd' ? '⌘' : key}
                            </span>
                          ))}
                        </div>
                      )}
                      {isSelected && (
                        <ArrowRight size={14} className="text-text-muted ml-2" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="command-palette-footer">
          <div className="command-palette-footer-hint">
            <span className="kbd">↑</span>
            <span className="kbd">↓</span>
            <span className="text-text-muted">to navigate</span>
          </div>
          <div className="command-palette-footer-hint">
            <span className="kbd">↵</span>
            <span className="text-text-muted">to select</span>
          </div>
          <div className="command-palette-footer-hint">
            <span className="kbd">esc</span>
            <span className="text-text-muted">to close</span>
          </div>
        </div>
      </motion.div>
    </>
  );
}
