import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Trophy, Sparkles } from 'lucide-react';
import TelemetryImport from '../components/Advanced/TelemetryImport';
import CombinedRankings from '../components/Advanced/CombinedRankings';
import AILineupOptimizer from '../components/Advanced/AILineupOptimizer';
import SpotlightCard from '../components/ui/SpotlightCard';

const TABS = [
  { id: 'telemetry', label: 'Telemetry', icon: Activity, color: 'green' },
  { id: 'rankings', label: 'Combined Scoring', icon: Trophy, color: 'orange' },
  { id: 'optimizer', label: 'AI Optimizer', icon: Sparkles, color: 'violet' },
];

const colorConfig = {
  green: {
    active: 'bg-blade-blue/10 border-blade-blue/30 text-blade-blue shadow-[0_0_15px_rgba(0,112,243,0.2)]',
    icon: 'text-blade-blue',
  },
  orange: {
    active: 'bg-warning-orange/10 border-warning-orange/30 text-warning-orange shadow-[0_0_15px_rgba(245,158,11,0.2)]',
    icon: 'text-warning-orange',
  },
  violet: {
    active: 'bg-coxswain-violet/10 border-coxswain-violet/30 text-coxswain-violet shadow-[0_0_15px_rgba(124,58,237,0.2)]',
    icon: 'text-coxswain-violet',
  },
};

export default function AdvancedPage() {
  const [activeTab, setActiveTab] = useState('telemetry');

  const activeTabConfig = TABS.find(t => t.id === activeTab);

  return (
    <div className="relative p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Background atmosphere - void glow */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-coxswain-violet/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-blade-blue/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-6"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-coxswain-violet/10 border border-coxswain-violet/20 flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.15)]">
            <Sparkles className="w-5 h-5 text-coxswain-violet" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-primary tracking-[-0.02em]">
            Advanced Analytics
          </h1>
        </div>
        <p className="text-sm sm:text-base text-text-secondary ml-[52px]">
          Telemetry import, combined scoring, and AI-powered optimization
        </p>
      </motion.div>

      {/* Tab navigation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <SpotlightCard
          className={`
            inline-flex p-1.5 rounded-xl
            bg-void-elevated border border-white/5
          `}
        >
          <div className="flex gap-1">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const colors = colorConfig[tab.color];
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
                    transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                    ${isActive
                      ? `${colors.active} border`
                      : 'text-text-muted hover:text-text-secondary hover:bg-void-elevated/50 border border-transparent'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? colors.icon : ''}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </SpotlightCard>
      </motion.div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'telemetry' && <TelemetryImport />}
        {activeTab === 'rankings' && <CombinedRankings />}
        {activeTab === 'optimizer' && <AILineupOptimizer />}
      </motion.div>
    </div>
  );
}
