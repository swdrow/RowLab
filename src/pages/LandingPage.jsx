import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Users,
  BarChart3,
  Target,
  Layers,
  Activity,
  Timer,
  Check,
  Github,
  Linkedin,
  ChevronRight,
  Zap,
  Shield,
  Clock,
  ChevronDown,
} from 'lucide-react';

// Precision Instrument Components
import { HeroCockpitCard, LineupPreview } from '../components/landing/HeroCockpitCard';
import { AuroraBackground, FieldLines, OrganicBlob } from '../components/Generative';
import { DataStreamTicker } from '../components/landing/DataStreamTicker';
import { SpotlightBentoCard, BentoGrid, bentoSpans } from '../components/landing/SpotlightBentoCard';
import { DisplayXL, DisplayLG, DisplayMD, BodyLG, MonoLabel } from '../components/ui/Typography';
import SpotlightCard from '../components/ui/SpotlightCard';

/**
 * RowLab Landing Page - Precision Instrument Design
 * Raycast/Linear/Vercel aesthetic
 * Dark mode only, warm void backgrounds, neon accents
 */

// ============================================
// ANIMATION VARIANTS - Precision Instrument Timing
// NO spring/bounce - pure ease-out for "wired to data" feel
// ============================================
const precisionEase = [0, 0, 0.2, 1]; // ease-out - instant start, smooth stop

const fadeInUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: precisionEase } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.15, ease: precisionEase } },
};

// ============================================
// HERO SECTION - Precision Instrument Design
// ============================================
const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center px-6 pt-32 pb-24 overflow-hidden">
      {/* Background - App Store spotlight effect */}
      <div className="absolute inset-0 bg-void-deep" />

      {/* Generative Aurora Background */}
      <AuroraBackground
        color1="#0070F3"
        color2="#7C3AED"
        color3="#06B6D4"
        intensity={0.18}
        speed={0.8}
        className="z-0"
      />

      {/* Secondary glow (kept for depth) */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-20"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0, 112, 243, 0.15) 0%, transparent 60%)',
        }}
      />

      <div className="relative max-w-5xl mx-auto w-full">
        {/* Status Badge - Raycast style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: precisionEase }}
          className="flex justify-center mb-10"
        >
          <div
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl
              bg-void-surface/60 backdrop-blur-xl
              border border-white/10"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blade-blue opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blade-blue shadow-[0_0_10px_rgba(0,112,243,0.5)]"></span>
            </span>
            <MonoLabel color="muted">THE COACHING PLATFORM FOR ROWING</MonoLabel>
          </div>
        </motion.div>

        {/* Headline - Editorial serif */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05, ease: precisionEase }}
          className="text-center mb-6"
        >
          <h1 className="font-display text-5xl sm:text-6xl lg:text-[72px] font-semibold leading-[1.1] tracking-[-0.02em] text-text-primary">
            Stop guessing.
          </h1>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-[72px] font-semibold leading-[1.1] tracking-[-0.02em] text-blade-blue">
            Start winning.
          </h1>
        </motion.div>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1, ease: precisionEase }}
          className="text-center font-body text-lg leading-relaxed text-text-secondary max-w-2xl mx-auto mb-10"
        >
          RowLab combines erg data, seat racing results, and visual lineup building
          into one precision instrument—so you can make selection decisions backed by data, not hunches.
        </motion.p>

        {/* CTAs - Glow buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15, ease: precisionEase }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <Link
            to="/register"
            className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
              bg-gradient-to-b from-blade-blue to-blade-blue/90
              text-void-deep font-medium text-sm
              shadow-[0_0_20px_-5px_rgba(0,112,243,0.4)]
              hover:shadow-[0_0_30px_-5px_rgba(0,112,243,0.5)]
              hover:translate-y-[-1px] active:translate-y-0
              transition-all duration-150"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            to="/app"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
              bg-white/[0.04] backdrop-blur-xl
              border border-white/10
              text-text-primary font-medium text-sm
              hover:bg-white/[0.08] hover:border-white/20
              transition-all duration-200"
          >
            Try Demo
          </Link>
        </motion.div>

        {/* Hero Visual - 3D Cockpit Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.2, ease: precisionEase }}
          className="flex justify-center"
          style={{ perspective: 1200 }}
        >
          <HeroCockpitCard>
            <LineupPreview />
          </HeroCockpitCard>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.2, ease: precisionEase }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <MonoLabel color="muted">SCROLL</MonoLabel>
          <ChevronDown className="w-4 h-4 text-text-muted" />
        </motion.div>
      </div>
    </section>
  );
};

// ============================================
// HOW IT WORKS SECTION - Enhanced with visuals
// ============================================
const HowItWorksSection = () => {
  const steps = [
    {
      num: '01',
      title: 'Import Your Roster',
      description: 'Add athletes manually or import from spreadsheets. Track erg scores, side preferences, and weight.',
      icon: Users,
      visual: (
        <div className="flex gap-1 mb-3">
          {['Thompson', 'Garcia', 'Chen'].map((name, i) => (
            <div key={i} className="flex items-center gap-1 px-2 py-1 rounded bg-void-surface/50 border border-white/[0.06] text-[9px]">
              <div className={`w-1.5 h-1.5 rounded-full ${i % 2 === 0 ? 'bg-port' : 'bg-starboard'}`} />
              <span className="text-text-muted">{name}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      num: '02',
      title: 'Run Seat Races',
      description: 'Log piece times and let RowLab calculate margins automatically. See who moves the boat.',
      icon: Target,
      visual: (
        <div className="font-mono text-[10px] space-y-1 mb-3">
          <div className="flex justify-between px-2 py-1 rounded bg-void-surface/50 border border-white/[0.06]">
            <span className="text-text-muted">P1:</span>
            <span className="text-blade-blue">A +2.3s</span>
          </div>
          <div className="flex justify-between px-2 py-1 rounded bg-blade-blue/10 border border-blade-blue/20">
            <span className="text-text-muted">Margin:</span>
            <span className="text-blade-blue font-semibold">A wins</span>
          </div>
        </div>
      ),
    },
    {
      num: '03',
      title: 'Build Lineups',
      description: 'Drag athletes into boats with our visual builder. Port and starboard are color-coded.',
      icon: Layers,
      visual: (
        <div className="flex items-center gap-0.5 mb-3">
          <div className="w-4 h-5 rounded-sm bg-coxswain/20 border border-coxswain/30" />
          {[8,7,6,5,4,3,2,1].map((n, i) => (
            <div key={n} className={`w-4 h-5 rounded-sm border ${
              i % 2 === 0 ? 'bg-port/15 border-port/30' : 'bg-starboard/15 border-starboard/30'
            }`} />
          ))}
        </div>
      ),
    },
    {
      num: '04',
      title: 'Analyze & Iterate',
      description: 'Track performance over time. Compare lineups. Make data-driven adjustments.',
      icon: BarChart3,
      visual: (
        <div className="h-8 flex items-end gap-0.5 mb-3">
          {[55, 48, 52, 45, 42, 38, 35].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-blade-blue/40 rounded-t transition-all"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      ),
    },
  ];

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="/images/landing/boathouse-sunset.jpg"
          alt=""
          className="w-full h-full object-cover opacity-[0.06] grayscale contrast-[1.2]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-void-deep via-void-deep/97 to-void-deep" />
      </div>

      {/* Generative field lines - subtle data flow */}
      <FieldLines
        count={4}
        color="rgba(0, 112, 243, 0.04)"
        duration={16}
        direction="horizontal"
        className="absolute inset-0 z-[1]"
      />

      {/* Accent glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blade-blue/6 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-coxswain-violet/5 rounded-full blur-[80px]" />

      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <MonoLabel color="green" className="mb-4 block">HOW IT WORKS</MonoLabel>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold text-text-primary mb-5 tracking-[-0.02em]">
            From spreadsheets to{' '}
            <span className="text-blade-blue">speed</span>
            {' '}in minutes.
          </h2>
          <p className="font-body text-lg text-text-secondary max-w-xl mx-auto">
            No complex setup. No training required. Just import your athletes and start building faster boats.
          </p>
        </motion.div>

        {/* Connection line */}
        <div className="hidden md:block absolute top-[280px] left-1/2 -translate-x-1/2 w-[80%] h-px bg-white/[0.08]" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid md:grid-cols-4 gap-5"
        >
          {steps.map((step, index) => (
            <motion.div key={index} variants={fadeInUp} className="relative">
              {/* Step number badge - positioned above card */}
              <div className="absolute -top-3 left-5 z-10">
                <div className="w-7 h-7 rounded-lg bg-blade-blue flex items-center justify-center shadow-glow-green">
                  <span className="font-mono text-xs font-bold text-void-deep">{step.num}</span>
                </div>
              </div>

              <SpotlightCard
                className="h-full bg-void-surface/60 backdrop-blur-xl border border-white/[0.06] rounded-xl p-5 pt-8"
                spotlightColor="rgba(0, 112, 243, 0.08)"
              >
                {/* Visual artifact */}
                {step.visual}

                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center mb-3">
                  <step.icon className="w-5 h-5 text-blade-blue" />
                </div>

                <h3 className="font-display text-base font-semibold text-text-primary mb-2">{step.title}</h3>
                <p className="font-body text-sm text-text-secondary leading-relaxed">{step.description}</p>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// ============================================
// INTEGRATION BAR (replaces fake social proof)
// ============================================
const IntegrationBar = () => (
  <section className="py-12 px-6 border-y border-border-subtle bg-bg-surface/30">
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
        <p className="text-text-muted text-sm">Works seamlessly with:</p>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-base/50 border border-border-subtle">
            <div className="w-5 h-5 rounded bg-[#003366] flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">C2</span>
            </div>
            <span className="text-text-primary text-sm font-medium">Concept2 Logbook</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-base/50 border border-border-subtle">
            <div className="w-5 h-5 rounded bg-[#0F9D58] flex items-center justify-center">
              <Layers className="w-3 h-3 text-white" />
            </div>
            <span className="text-text-primary text-sm font-medium">Google Sheets</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-base/50 border border-border-subtle">
            <div className="w-5 h-5 rounded bg-[#D93025] flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">PDF</span>
            </div>
            <span className="text-text-primary text-sm font-medium">PDF Export</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ============================================
// COMPARISON SECTION - RowLab vs Spreadsheets
// ============================================
const ComparisonSection = () => {
  const comparisons = [
    {
      category: 'Lineup Building',
      old: 'Copy-paste names into cells, manually track sides',
      new: 'Drag-and-drop with instant port/starboard visualization',
      icon: Layers,
    },
    {
      category: 'Seat Racing',
      old: 'Complex formulas, manual calculations, errors',
      new: 'Enter times, get instant accurate margins',
      icon: Target,
    },
    {
      category: 'Erg Tracking',
      old: 'Multiple sheets, inconsistent formats, lost data',
      new: 'One source of truth with Concept2 import',
      icon: Activity,
    },
    {
      category: 'Selection Day',
      old: 'Scramble through tabs, outdated versions',
      new: 'Real-time updates, instant PDF exports',
      icon: Clock,
    },
  ];

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Background image with overlay - new rowing photo */}
      <div className="absolute inset-0">
        <img
          src="/images/landing/eight-skyline.jpg"
          alt=""
          className="w-full h-full object-cover opacity-[0.08] grayscale contrast-[1.2]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-void-deep via-void-deep/95 to-void-deep" />
      </div>

      {/* Generative organic blob for depth */}
      <OrganicBlob
        color="rgba(239, 68, 68, 0.08)"
        size={500}
        duration={15}
        blur={120}
        opacity={0.3}
        className="left-0 top-1/4"
      />

      {/* Accent glows */}
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-blade-blue/6 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] bg-port/8 rounded-full blur-[100px]" />

      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-14"
        >
          <MonoLabel color="green" className="mb-4 block">THE DIFFERENCE</MonoLabel>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold text-text-primary mb-5 tracking-[-0.02em]">
            Leave the spreadsheet{' '}
            <span className="text-port" style={{ textShadow: '0 0 30px rgba(239, 68, 68, 0.3)' }}>
              chaos
            </span>
            {' '}behind.
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="space-y-4"
        >
          {comparisons.map((item, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-void-surface/40 backdrop-blur-xl">
                {/* Inner highlight */}
                <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

                <div className="grid md:grid-cols-[200px_1fr_1fr] items-stretch">
                  {/* Category */}
                  <div className="flex items-center gap-3 p-5 border-b md:border-b-0 md:border-r border-white/[0.06] bg-void-surface/30">
                    <div className="w-10 h-10 rounded-xl bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-blade-blue" />
                    </div>
                    <span className="font-display text-sm font-semibold text-text-primary">{item.category}</span>
                  </div>

                  {/* Old way */}
                  <div className="p-5 border-b md:border-b-0 md:border-r border-white/[0.06] bg-port/[0.02]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-port/20 flex items-center justify-center">
                        <span className="text-port text-xs">✕</span>
                      </div>
                      <MonoLabel color="muted">SPREADSHEET</MonoLabel>
                    </div>
                    <p className="font-body text-sm text-text-secondary">{item.old}</p>
                  </div>

                  {/* New way */}
                  <div className="p-5 bg-blade-blue/[0.02]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-blade-blue/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-blade-blue" />
                      </div>
                      <MonoLabel color="green">ROWLAB</MonoLabel>
                    </div>
                    <p className="font-body text-sm text-text-primary">{item.new}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// ============================================
// FEATURE VISUAL ARTIFACTS
// ============================================

// Mini boat diagram artifact
const LineupArtifact = () => (
  <div className="flex items-center gap-0.5 mb-4">
    <div className="w-5 h-6 rounded bg-coxswain/20 border border-coxswain/30 flex items-center justify-center">
      <span className="text-[8px] font-bold text-coxswain">C</span>
    </div>
    {[8,7,6,5,4,3,2,1].map((n, i) => (
      <div key={n} className={`w-5 h-6 rounded border flex items-center justify-center ${
        i % 2 === 0 ? 'bg-port/15 border-port/30' : 'bg-starboard/15 border-starboard/30'
      }`}>
        <span className={`text-[8px] font-bold ${i % 2 === 0 ? 'text-port' : 'text-starboard'}`}>{n}</span>
      </div>
    ))}
  </div>
);

// Mini erg split artifact
const ErgArtifact = () => (
  <div className="font-mono text-xs space-y-1 mb-4 bg-bg-base/50 rounded p-2 border border-border-subtle">
    <div className="flex justify-between text-text-muted">
      <span>500m</span><span className="text-success">1:42.3</span>
    </div>
    <div className="flex justify-between text-text-muted">
      <span>1000m</span><span className="text-success">1:43.1</span>
    </div>
    <div className="flex justify-between text-text-muted">
      <span>1500m</span><span className="text-warning">1:44.8</span>
    </div>
    <div className="flex justify-between text-text-primary font-medium border-t border-border-subtle pt-1">
      <span>2000m</span><span>6:52.4</span>
    </div>
  </div>
);

// Seat racing margin artifact
const SeatRaceArtifact = () => (
  <div className="text-xs space-y-1.5 mb-4">
    <div className="flex items-center gap-2">
      <span className="text-text-muted w-16">Piece 1:</span>
      <span className="text-text-primary">A +2.3s</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-text-muted w-16">Piece 2:</span>
      <span className="text-text-primary">B +1.8s</span>
    </div>
    <div className="flex items-center gap-2 pt-1 border-t border-border-subtle">
      <span className="text-text-muted w-16">Margin:</span>
      <span className="text-success font-medium">A +0.5s</span>
    </div>
  </div>
);

// Mini trend chart artifact
const TrendArtifact = () => (
  <div className="h-10 flex items-end gap-0.5 mb-4">
    {[65, 58, 62, 55, 50, 48, 45].map((h, i) => (
      <div
        key={i}
        className="flex-1 bg-success/30 rounded-t"
        style={{ height: `${h}%` }}
      />
    ))}
  </div>
);

// ============================================
// FEATURES BENTO GRID
// ============================================
// FEATURES BENTO GRID - Precision Instrument
// ============================================
const FeaturesSection = () => {
  return (
    <section className="py-28 px-6 bg-void-deep relative overflow-hidden">
      {/* Crew action background - subtle imagery */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="/images/landing/crew-on-water.jpg"
          alt=""
          className="w-full h-full object-cover opacity-[0.04] grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-void-deep via-void-deep/98 to-void-deep" />
      </div>

      {/* Generative field lines - flowing data aesthetic */}
      <FieldLines
        count={5}
        color="rgba(124, 58, 237, 0.035)"
        duration={14}
        direction="horizontal"
        className="absolute inset-0 z-[1]"
      />

      {/* Subtle background accents */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-coxswain-violet/10 rounded-full blur-[100px] -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blade-blue/5 rounded-full blur-[100px] translate-x-1/2" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <MonoLabel color="green" className="mb-4 block">FEATURES</MonoLabel>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-[56px] font-semibold text-text-primary mb-5 tracking-[-0.02em]">
            Everything you need to{' '}
            <span className="text-blade-blue">engineer speed.</span>
          </h2>
          <p className="font-body text-lg text-text-secondary max-w-xl mx-auto">
            Purpose-built tools for coaches who demand excellence.
          </p>
        </motion.div>

        {/* Chronicle-Style Bento Grid */}
        <BentoGrid>
          {/* Hero Feature - Visual Lineup Builder */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className={bentoSpans.heroFeature}
          >
            <SpotlightBentoCard
              className="h-full"
              spotlightColor="rgba(0, 112, 243, 0.1)"
              backgroundImage="/images/landing/boathouse-oars.jpg"
            >
              <MonoLabel color="green" className="mb-3">LINEUP BUILDER</MonoLabel>
              <h3 className="font-display text-2xl font-semibold text-text-primary mb-3 tracking-[-0.02em]">
                Visual Lineup Builder
              </h3>
              <p className="font-body text-[15px] text-text-secondary leading-relaxed mb-6 max-w-md">
                Drag and drop athletes into seats with instant port/starboard visualization.
                No more confusing spreadsheets—see your boat come together in real-time.
              </p>
              <LineupArtifact />
            </SpotlightBentoCard>
          </motion.div>

          {/* Erg Data Tracking */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className={bentoSpans.mediumTop}
          >
            <SpotlightBentoCard
              className="h-full"
              spotlightColor="rgba(124, 58, 237, 0.08)"
              backgroundImage="/images/landing/boathouse-sunset.jpg"
            >
              <MonoLabel color="violet" className="mb-3">ERG TRACKING</MonoLabel>
              <h3 className="font-display text-xl font-semibold text-text-primary mb-2 tracking-[-0.02em]">
                Erg Data Tracking
              </h3>
              <p className="font-body text-sm text-text-secondary leading-relaxed mb-4">
                Import from Concept2 or enter manually. Track 2k, 6k, and 30-min tests.
              </p>
              <ErgArtifact />
            </SpotlightBentoCard>
          </motion.div>

          {/* Seat Racing */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className={bentoSpans.mediumBottom}
          >
            <SpotlightBentoCard className="h-full" spotlightColor="rgba(0, 112, 243, 0.08)">
              <MonoLabel color="green" className="mb-3">SEAT RACING</MonoLabel>
              <h3 className="font-display text-xl font-semibold text-text-primary mb-2 tracking-[-0.02em]">
                Seat Racing Calculator
              </h3>
              <p className="font-body text-sm text-text-secondary leading-relaxed mb-4">
                Enter piece times. RowLab handles the math. Get clear margins.
              </p>
              <SeatRaceArtifact />
            </SpotlightBentoCard>
          </motion.div>

          {/* Analytics */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className={bentoSpans.wide}
          >
            <SpotlightBentoCard
              className="h-full"
              spotlightColor="rgba(124, 58, 237, 0.08)"
              backgroundImage="/images/landing/team-carrying-shell.jpg"
            >
              <MonoLabel color="violet" className="mb-3">ANALYTICS</MonoLabel>
              <h3 className="font-display text-xl font-semibold text-text-primary mb-2 tracking-[-0.02em]">
                Performance Analytics
              </h3>
              <p className="font-body text-sm text-text-secondary leading-relaxed mb-4">
                Watch erg scores improve. Compare athletes. Identify who's peaking when it matters.
              </p>
              <TrendArtifact />
            </SpotlightBentoCard>
          </motion.div>

          {/* Multi-Boat */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className={bentoSpans.narrow}
          >
            <SpotlightBentoCard
              className="h-full"
              spotlightColor="rgba(0, 112, 243, 0.08)"
              backgroundImage="/images/landing/boathouse-sunset.jpg"
            >
              <MonoLabel color="green" className="mb-3">FLEET</MonoLabel>
              <h3 className="font-display text-xl font-semibold text-text-primary mb-2 tracking-[-0.02em]">
                Multi-Boat Management
              </h3>
              <p className="font-body text-sm text-text-secondary leading-relaxed">
                From the V8+ down to the novice 4+, manage your entire fleet in one place.
              </p>
            </SpotlightBentoCard>
          </motion.div>
        </BentoGrid>
      </div>
    </section>
  );
};

// ============================================
// CAPABILITIES SECTION - Precision Instrument (Enhanced)
// ============================================
const CapabilitiesSection = () => {
  const capabilities = [
    { value: 'Unlimited', label: 'Athletes per team', icon: Users, highlight: true },
    { value: 'All tests', label: '2k, 6k, 30min supported', icon: Timer },
    { value: 'Any boat', label: '1x to 8+ configurations', icon: Layers },
    { value: 'Open', label: 'Source available', icon: Shield },
    { value: 'Instant', label: 'Margin calculations', icon: Zap, highlight: true },
    { value: 'PDF', label: 'Export lineups', icon: Activity },
  ];

  return (
    <section className="relative py-20 px-6 overflow-hidden">
      {/* Background with subtle texture */}
      <div className="absolute inset-0 bg-void-surface/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-blade-blue/[0.02] via-transparent to-coxswain-violet/[0.02]" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/[0.06]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/[0.06]" />

      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6"
        >
          {capabilities.map((cap, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="relative group text-center"
            >
              {/* Hover glow effect */}
              <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${
                cap.highlight ? 'bg-blade-blue/5' : 'bg-white/[0.02]'
              }`} />

              <div className="relative p-4">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 transition-all duration-150 group-hover:scale-110 ${
                  cap.highlight
                    ? 'bg-blade-blue/15 border border-blade-blue/30 shadow-[0_0_20px_rgba(0,112,243,0.15)]'
                    : 'bg-void-elevated border border-white/[0.08]'
                }`}>
                  <cap.icon className={`w-6 h-6 ${cap.highlight ? 'text-blade-blue' : 'text-text-secondary'}`} />
                </div>
                <p className={`font-mono text-2xl font-bold mb-1.5 tabular-nums ${
                  cap.highlight ? 'text-blade-blue' : 'text-text-primary'
                }`}>
                  {cap.value}
                </p>
                <p className="font-body text-xs text-text-muted leading-tight">{cap.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// ============================================
// PRODUCT SHOWCASE - Mini App Preview
// ============================================
const MiniAppPreview = () => {
  // Sample roster data for the preview
  const athletes = [
    { name: 'Thompson', erg: '6:02.4', side: 'P' },
    { name: 'Garcia', erg: '6:05.1', side: 'S' },
    { name: 'Chen', erg: '6:08.3', side: 'P' },
    { name: 'Okonkwo', erg: '6:04.7', side: 'S' },
    { name: 'Williams', erg: '6:09.2', side: 'P' },
    { name: 'Kim', erg: '6:07.8', side: 'S' },
  ];

  const boats = [
    { name: 'Varsity 8+', status: '6/8', type: '8+' },
    { name: 'JV 8+', status: '8/8', type: '8+', complete: true },
    { name: '1V4+', status: '4/4', type: '4+', complete: true },
  ];

  return (
    <div className="flex h-full bg-bg-base">
      {/* Mini sidebar */}
      <div className="w-12 bg-bg-surface border-r border-border-subtle flex flex-col items-center py-3 gap-3">
        <div className="w-7 h-7 rounded-lg bg-success flex items-center justify-center">
          <Layers className="w-3.5 h-3.5 text-bg-base" />
        </div>
        <div className="w-7 h-7 rounded-lg bg-bg-highlight flex items-center justify-center">
          <Users className="w-3.5 h-3.5 text-text-muted" />
        </div>
        <div className="w-7 h-7 rounded-lg hover:bg-bg-highlight flex items-center justify-center">
          <Activity className="w-3.5 h-3.5 text-text-muted" />
        </div>
        <div className="w-7 h-7 rounded-lg hover:bg-bg-highlight flex items-center justify-center">
          <BarChart3 className="w-3.5 h-3.5 text-text-muted" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Athlete list panel */}
        <div className="w-44 border-r border-border-subtle p-3">
          <div className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-2">Athletes</div>
          <div className="space-y-1">
            {athletes.map((athlete, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded bg-bg-surface border border-border-subtle text-[10px]">
                <div className={`w-1.5 h-1.5 rounded-full ${athlete.side === 'P' ? 'bg-port' : 'bg-starboard'}`} />
                <span className="text-text-primary flex-1 truncate">{athlete.name}</span>
                <span className="font-mono text-text-muted text-[9px]">{athlete.erg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lineup panel */}
        <div className="flex-1 p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-medium text-text-muted uppercase tracking-wide">Lineups</div>
            <div className="text-[9px] text-success">+ New Boat</div>
          </div>

          {/* Boat cards */}
          <div className="space-y-2">
            {boats.map((boat, i) => (
              <div key={i} className={`p-2 rounded-lg border ${i === 0 ? 'bg-bg-elevated border-border-strong' : 'bg-bg-surface border-border-subtle'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-text-primary">{boat.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${boat.complete ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                    {boat.status}
                  </span>
                </div>
                {/* Mini boat diagram */}
                <div className="flex items-center gap-0.5">
                  <div className="w-3 h-4 rounded-sm bg-coxswain/20 border border-coxswain/30" />
                  {(boat.type === '8+' ? [8,7,6,5,4,3,2,1] : [4,3,2,1]).map((n, j) => (
                    <div key={n} className={`w-3 h-4 rounded-sm border ${
                      j % 2 === 0 ? 'bg-port/15 border-port/30' : 'bg-starboard/15 border-starboard/30'
                    } ${(i > 0 || n <= 6) ? 'opacity-100' : 'opacity-40'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductShowcase = () => (
  <section className="relative py-28 px-6 overflow-hidden">
    {/* Background with subtle grid */}
    <div className="absolute inset-0 bg-void-deep" />
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '64px 64px',
      }}
    />

    {/* Accent glows */}
    <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-blade-blue/6 rounded-full blur-[100px] -translate-y-1/2" />
    <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-coxswain-violet/8 rounded-full blur-[80px] -translate-y-1/2" />

    <div className="relative max-w-5xl mx-auto">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        className="text-center mb-14"
      >
        <MonoLabel color="green" className="mb-4 block">PRODUCT PREVIEW</MonoLabel>
        <h2 className="font-display text-4xl sm:text-5xl font-semibold text-text-primary mb-5 tracking-[-0.02em]">
          See your entire roster{' '}
          <span className="text-blade-blue">at a glance.</span>
        </h2>
        <p className="font-body text-lg text-text-secondary max-w-lg mx-auto">
          Build lineups in seconds, not hours. Our visual interface makes selection intuitive.
        </p>
      </motion.div>

      {/* App Screenshot */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={scaleIn}
        className="relative max-w-4xl mx-auto"
      >
        <div className="absolute -inset-8 bg-success/5 rounded-3xl blur-3xl" />
        <div className="absolute -inset-4 bg-atmosphere-water/10 rounded-2xl blur-2xl" />

        <SpotlightCard className="relative bg-bg-elevated border border-border-default rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
          {/* Inner light */}
          <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

          {/* Browser chrome */}
          <div className="bg-bg-base border-b border-border-default px-4 py-2.5 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-error/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="px-3 py-1 rounded-md bg-bg-surface text-[10px] text-text-muted">
                rowlab.net/app/lineup
              </div>
            </div>
          </div>

          {/* Mini app preview */}
          <div className="h-72 sm:h-80">
            <MiniAppPreview />
          </div>
        </SpotlightCard>
      </motion.div>
    </div>
  </section>
);

// ============================================
// FAQ SECTION
// ============================================
const FAQItem = ({ question, answer, isOpen, onClick }) => (
  <motion.div
    initial={false}
    className="border-b border-border-subtle last:border-0"
  >
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between py-5 text-left"
    >
      <span className="text-base font-medium text-text-primary pr-4">{question}</span>
      <ChevronRight
        className={`w-5 h-5 text-text-muted flex-shrink-0 transition-transform duration-200 ${
          isOpen ? 'rotate-90' : ''
        }`}
      />
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <p className="pb-5 text-sm text-text-secondary leading-relaxed">
            {answer}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

// ============================================
// ROADMAP SECTION - What's Coming Next
// ============================================
const RoadmapSection = () => {
  const roadmapItems = [
    {
      status: 'live',
      title: 'Visual Lineup Builder',
      description: 'Drag-and-drop athletes into boats with instant port/starboard visualization.',
      icon: Layers,
    },
    {
      status: 'live',
      title: 'Seat Racing Calculator',
      description: 'Automatic margin calculations from your piece times. No more spreadsheet formulas.',
      icon: Target,
    },
    {
      status: 'live',
      title: 'Erg Data Tracking',
      description: 'Import from Concept2 or enter manually. Track 2k, 6k, and custom tests.',
      icon: Activity,
    },
    {
      status: 'coming',
      title: 'Race Prediction Engine',
      description: 'AI-powered speed predictions based on crew composition and historical data.',
      icon: Zap,
    },
    {
      status: 'coming',
      title: 'Team Communication',
      description: 'Built-in announcements and notifications to keep your athletes informed.',
      icon: Users,
    },
    {
      status: 'planned',
      title: 'Telemetry Integration',
      description: 'Connect with SpeedCoach, NK, and other real-time data sources.',
      icon: BarChart3,
    },
  ];

  const statusColors = {
    live: { bg: 'bg-blade-blue/15', border: 'border-blade-blue/30', text: 'text-blade-blue', label: 'LIVE' },
    coming: { bg: 'bg-coxswain-violet/15', border: 'border-coxswain-violet/30', text: 'text-coxswain-violet', label: 'COMING SOON' },
    planned: { bg: 'bg-warning/15', border: 'border-warning/30', text: 'text-warning', label: 'PLANNED' },
  };

  return (
    <section className="relative py-20 px-6 overflow-hidden">
      {/* Subtle divider */}
      <div className="absolute top-0 inset-x-0 h-px bg-white/[0.06]" />

      {/* Accent glows */}
      <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-coxswain-violet/6 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-0 w-[350px] h-[350px] bg-blade-blue/5 rounded-full blur-[80px]" />

      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <MonoLabel color="violet" className="mb-4 block">ROADMAP</MonoLabel>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-text-primary mb-4 tracking-[-0.02em]">
            Built for today,{' '}
            <span className="text-coxswain-violet" style={{ textShadow: '0 0 30px rgba(124, 58, 237, 0.4)' }}>
              evolving for tomorrow.
            </span>
          </h2>
          <p className="font-body text-base text-text-secondary max-w-lg mx-auto">
            We're constantly shipping new features based on what coaches actually need.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {roadmapItems.map((item, index) => {
            const status = statusColors[item.status];
            return (
              <motion.div key={index} variants={fadeInUp}>
                <SpotlightCard
                  className="h-full bg-void-surface/40 backdrop-blur-xl border border-white/[0.06] rounded-xl p-5"
                  spotlightColor={item.status === 'live' ? 'rgba(0, 112, 243, 0.08)' : 'rgba(124, 58, 237, 0.08)'}
                >
                  {/* Status badge */}
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg} border ${status.border} mb-4`}>
                    {item.status === 'live' && (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status.bg} opacity-75`}></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blade-blue"></span>
                      </span>
                    )}
                    <span className={`font-mono text-[9px] tracking-wider uppercase ${status.text}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Icon and title */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-lg ${status.bg} border ${status.border} flex items-center justify-center flex-shrink-0`}>
                      <item.icon className={`w-4 h-4 ${status.text}`} />
                    </div>
                    <h3 className="font-display text-base font-semibold text-text-primary leading-tight pt-1">
                      {item.title}
                    </h3>
                  </div>

                  <p className="font-body text-sm text-text-secondary leading-relaxed">
                    {item.description}
                  </p>
                </SpotlightCard>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'What makes RowLab different from a spreadsheet?',
      answer: 'RowLab is purpose-built for rowing. The visual lineup builder shows port/starboard at a glance. Seat racing calculations are automatic. Erg data imports directly from Concept2. Everything a coach needs is in one place, designed specifically for how rowing teams actually work.',
    },
    {
      question: 'Can I import my existing athlete data?',
      answer: 'Yes. You can import athletes and erg data from spreadsheets (CSV/Excel) or directly from Concept2 logbook. Most coaches are up and running with their full roster in under 10 minutes.',
    },
    {
      question: 'How does seat racing work in RowLab?',
      answer: 'Enter your piece times for each boat in each piece. RowLab calculates the margin—accounting for which rower was in which boat—and tells you clearly who came out ahead. No more mental math or second-guessing.',
    },
    {
      question: 'Is my team data secure?',
      answer: 'Your data is stored securely and is only accessible to your team. We use industry-standard encryption. You can export or delete your data at any time.',
    },
    {
      question: 'Can I try it before committing?',
      answer: 'Absolutely. The Novice plan is free forever with 1 boat and up to 20 athletes. Perfect for trying out the platform with your team before upgrading.',
    },
    {
      question: 'Do you offer discounts for high school programs?',
      answer: 'Yes! We offer educational discounts for high school and club programs. Contact us for details on reduced pricing for qualifying programs.',
    },
  ];

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-void-deep" />

      {/* Accent glows */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blade-blue/5 rounded-full blur-[100px]" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-coxswain-violet/6 rounded-full blur-[80px]" />

      <div className="relative max-w-3xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-14"
        >
          <MonoLabel color="green" className="mb-4 block">FAQ</MonoLabel>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold text-text-primary mb-5 tracking-[-0.02em]">
            Common{' '}
            <span className="text-blade-blue">questions</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <SpotlightCard className="bg-bg-surface border border-border-default rounded-2xl p-6">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              />
            ))}
          </SpotlightCard>
        </motion.div>
      </div>
    </section>
  );
};

// ============================================
// BUILT FOR COACHES SECTION - Enhanced
// ============================================
const BuiltForCoachesSection = () => {
  const benefits = [
    {
      icon: Clock,
      title: 'Save Hours Every Week',
      description: 'Stop wrestling with spreadsheets. Build and adjust lineups in minutes, not hours.',
      stat: '10x',
      statLabel: 'faster lineup creation',
    },
    {
      icon: Target,
      title: 'Make Better Decisions',
      description: 'Let data guide your selections. Seat racing results and erg trends at your fingertips.',
      stat: '100%',
      statLabel: 'calculation accuracy',
    },
    {
      icon: Zap,
      title: 'Move Fast on Race Day',
      description: 'Scratch an athlete? Swap seats in seconds. Print updated lineups instantly.',
      stat: '<30s',
      statLabel: 'to adjust a lineup',
    },
  ];

  return (
    <section className="relative py-28 px-6 overflow-hidden">
      {/* Background with boathouse image */}
      <div className="absolute inset-0">
        <img
          src="/images/landing/boathouse-sky.jpg"
          alt=""
          className="w-full h-full object-cover opacity-[0.06] grayscale contrast-[1.2]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-void-deep via-void-deep/95 to-void-deep/90" />
      </div>

      {/* Gradient accents */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-coxswain-violet/8 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[350px] bg-blade-blue/6 rounded-full blur-[80px]" />

      {/* Top and bottom borders */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/[0.08]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/[0.08]" />

      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <MonoLabel color="violet" className="mb-4 block">WHY ROWLAB</MonoLabel>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold text-text-primary mb-5 tracking-[-0.02em]">
            Built by coaches,{' '}
            <span className="text-coxswain-violet" style={{ textShadow: '0 0 30px rgba(124, 58, 237, 0.4)' }}>
              for coaches.
            </span>
          </h2>
          <p className="font-body text-lg text-text-secondary max-w-xl mx-auto">
            We've been in the launch. We know the chaos of selection week.
            RowLab is the tool we wish we had.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-6"
        >
          {benefits.map((benefit, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <SpotlightCard
                className="h-full bg-void-surface/50 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 text-center"
                spotlightColor="rgba(124, 58, 237, 0.08)"
              >
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-coxswain-violet/15 border border-coxswain-violet/25 mb-5">
                  <benefit.icon className="w-6 h-6 text-coxswain-violet" />
                </div>

                {/* Stat */}
                <div className="mb-4">
                  <p className="font-mono text-4xl font-bold text-blade-blue mb-1">
                    {benefit.stat}
                  </p>
                  <p className="font-mono text-[10px] tracking-wider uppercase text-text-muted">
                    {benefit.statLabel}
                  </p>
                </div>

                {/* Title and description */}
                <h3 className="font-display text-lg font-semibold text-text-primary mb-2">{benefit.title}</h3>
                <p className="font-body text-sm text-text-secondary leading-relaxed">{benefit.description}</p>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// ============================================
// PRICING SECTION - Precision Instrument
// ============================================
const PricingCard = ({ name, price, period, description, features, popular, cta }) => (
  <div
    className={`relative overflow-hidden rounded-2xl transition-all duration-150
      ${popular
        ? `border border-transparent shadow-glow-green
           [background-image:linear-gradient(#121214,#121214),linear-gradient(to_bottom,rgba(0,112,243,0.4),rgba(0,112,243,0.1))]
           [background-origin:padding-box,border-box]
           [background-clip:padding-box,border-box]`
        : `border border-transparent
           [background-image:linear-gradient(#0c0c0e,#0c0c0e),linear-gradient(to_bottom,rgba(255,255,255,0.12),rgba(255,255,255,0))]
           [background-origin:padding-box,border-box]
           [background-clip:padding-box,border-box]
           hover:shadow-[0_0_40px_-10px_rgba(0,112,243,0.2)]`
      }
      hover:-translate-y-1`}
  >
    {/* Inner highlight */}
    <div className="absolute inset-x-0 top-0 h-px bg-white/20" />

    {popular && (
      <div className="absolute -top-px left-1/2 -translate-x-1/2">
        <div className="px-4 py-1.5 rounded-b-lg bg-blade-blue text-void-deep text-xs font-semibold shadow-glow-green">
          Popular
        </div>
      </div>
    )}

    <div className="relative p-8 pt-10">
      <div className="mb-6">
        <MonoLabel color={popular ? 'green' : 'muted'} className="mb-2 block">{name.toUpperCase()}</MonoLabel>
        <p className="font-body text-sm text-text-muted">{description}</p>
      </div>
      <div className="mb-8">
        <span className={`font-mono text-5xl font-semibold tabular-nums ${popular ? 'text-blade-blue' : 'text-text-primary'}`}>
          {price}
        </span>
        {period && <span className="font-body text-text-muted text-sm ml-2">{period}</span>}
      </div>
      <ul className="space-y-4 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 font-body text-sm text-text-secondary">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              popular ? 'bg-blade-blue/20' : 'bg-white/[0.08]'
            }`}>
              <Check className={`w-3 h-3 ${popular ? 'text-blade-blue' : 'text-text-secondary'}`} />
            </div>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        to="/register"
        className={`block w-full text-center py-3.5 rounded-xl font-medium transition-all duration-200 ${
          popular
            ? 'bg-blade-blue text-void-deep hover:shadow-glow-green hover:scale-[1.02] active:scale-[0.98]'
            : `bg-white/[0.06] border border-transparent text-text-primary
               [background-image:linear-gradient(rgba(255,255,255,0.06),rgba(255,255,255,0.06)),linear-gradient(to_bottom,rgba(255,255,255,0.15),rgba(255,255,255,0))]
               [background-origin:padding-box,border-box]
               [background-clip:padding-box,border-box]
               hover:bg-white/[0.1]`
        }`}
      >
        {cta}
      </Link>
    </div>
  </div>
);

const PricingSection = () => {
  const tiers = [
    {
      name: 'Novice',
      price: 'Free',
      period: null,
      description: 'Perfect for trying out RowLab or managing a small group',
      features: [
        '1 boat configuration',
        'Up to 20 athletes',
        'Basic roster with erg tracking',
        'Drag-and-drop lineup builder',
      ],
      popular: false,
      cta: 'Start Free Forever',
    },
    {
      name: 'Varsity',
      price: '$15',
      period: '/mo per squad',
      description: 'Everything you need to run a competitive program',
      features: [
        'Unlimited athletes',
        'Multiple boat configurations',
        'Full erg tracking with PRs & trends',
        'Seat racing calculator',
        'PDF lineup exports',
        'Priority email support',
      ],
      popular: true,
      cta: 'Start 14-Day Free Trial',
    },
    {
      name: 'Gold Cup',
      price: '$80',
      period: '/mo',
      description: 'For large clubs managing multiple squads',
      features: [
        'Unlimited squads (men\'s, women\'s, novice)',
        'Everything in Varsity',
        'Equipment & oar tracking',
        'Advanced performance analytics',
        'Dedicated support',
        'Custom onboarding',
      ],
      popular: false,
      cta: 'Contact Us',
    },
  ];

  return (
    <section className="py-28 px-6 bg-void-surface/30 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-coxswain-violet/10 rounded-full blur-[100px]" />

      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-primary mb-4 tracking-[-0.02em]">
            Simple pricing for every program.
          </h2>
          <p className="text-text-secondary text-lg">
            Start free, upgrade when you need more.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-6"
        >
          {tiers.map((tier, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <PricingCard {...tier} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// ============================================
// FINAL CTA - Precision Instrument
// ============================================
const FinalCTA = () => (
  <section className="relative py-36 px-6 overflow-hidden">
    {/* Background image with overlay */}
    <div className="absolute inset-0">
      <img
        src="/images/landing/boathouse-sky.jpg"
        alt=""
        className="w-full h-full object-cover opacity-15 grayscale contrast-[1.2]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-void-deep via-void-deep/95 to-void-deep/80" />
    </div>

    {/* Generative organic blobs - living atmosphere */}
    <OrganicBlob
      color="rgba(0, 112, 243, 0.12)"
      size={450}
      duration={14}
      blur={100}
      opacity={0.4}
      className="left-1/4 top-1/3"
    />
    <OrganicBlob
      color="rgba(124, 58, 237, 0.1)"
      size={400}
      duration={18}
      blur={90}
      opacity={0.35}
      className="right-1/4 bottom-1/3"
    />

    {/* Dual-tone ambient lighting */}
    <div className="absolute top-1/3 left-1/4 w-[600px] h-[400px] bg-blade-blue/10 rounded-full blur-[100px]" />
    <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[350px] bg-coxswain-violet/15 rounded-full blur-[100px]" />

    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeInUp}
      className="relative max-w-3xl mx-auto text-center"
    >
      <MonoLabel color="green" className="mb-6 block">GET STARTED</MonoLabel>
      <h2 className="font-display text-4xl sm:text-5xl lg:text-[56px] font-semibold text-text-primary mb-6 tracking-[-0.02em]">
        Your next{' '}
        <span className="text-blade-blue">fast lineup</span>
        {' '}is waiting.
      </h2>
      <p className="font-body text-lg text-text-secondary mb-12 max-w-lg mx-auto">
        Stop second-guessing selections. Start making decisions with confidence.
        Free to start, no credit card required.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/register"
          className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full
            bg-blade-blue text-void-deep font-semibold text-lg
            hover:shadow-glow-green-lg transition-all duration-150
            hover:scale-[1.02] active:scale-[0.98]"
        >
          Create Free Account
          <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <Link
          to="/app"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full
            border border-transparent text-text-primary font-semibold text-lg
            [background-image:linear-gradient(rgba(18,18,20,0.9),rgba(18,18,20,0.9)),linear-gradient(to_bottom,rgba(255,255,255,0.15),rgba(255,255,255,0))]
            [background-origin:padding-box,border-box]
            [background-clip:padding-box,border-box]
            hover:bg-white/[0.08] transition-all duration-200"
        >
          Try the Demo
        </Link>
      </div>
    </motion.div>
  </section>
);

// ============================================
// FOOTER - Precision Instrument
// ============================================
const Footer = () => (
  <footer className="py-20 px-6 border-t border-white/[0.04] bg-void-deep">
    <div className="max-w-5xl mx-auto">
      <div className="grid md:grid-cols-4 gap-10 mb-14">
        {/* Logo & Tagline */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blade-blue flex items-center justify-center shadow-glow-green">
              <Layers className="w-5 h-5 text-void-deep" />
            </div>
            <span className="font-display text-xl font-semibold text-text-primary">RowLab</span>
          </div>
          <p className="font-body text-sm text-text-muted leading-relaxed">
            The operating system for competitive rowing. Build faster boats with data.
          </p>
        </div>

        {/* Links */}
        <div>
          <MonoLabel color="muted" className="mb-5 block">PRODUCT</MonoLabel>
          <ul className="space-y-3">
            <li><Link to="/app" className="font-body text-sm text-text-secondary hover:text-blade-blue transition-colors">Features</Link></li>
            <li><a href="#pricing" className="font-body text-sm text-text-secondary hover:text-blade-blue transition-colors">Pricing</a></li>
            <li><Link to="/app" className="font-body text-sm text-text-secondary hover:text-blade-blue transition-colors">Demo</Link></li>
          </ul>
        </div>

        <div>
          <MonoLabel color="muted" className="mb-5 block">RESOURCES</MonoLabel>
          <ul className="space-y-3">
            <li><a href="https://github.com/swdrow/RowLab" className="font-body text-sm text-text-secondary hover:text-blade-blue transition-colors">Documentation</a></li>
            <li><a href="https://github.com/swdrow/RowLab/releases" className="font-body text-sm text-text-secondary hover:text-blade-blue transition-colors">Changelog</a></li>
          </ul>
        </div>

        <div>
          <MonoLabel color="muted" className="mb-5 block">CONNECT</MonoLabel>
          <ul className="space-y-3">
            <li>
              <a href="https://github.com/swdrow/RowLab" target="_blank" rel="noopener noreferrer" className="font-body text-sm text-text-secondary hover:text-blade-blue transition-colors flex items-center gap-2">
                <Github className="w-4 h-4" />
                GitHub
              </a>
            </li>
            <li>
              <a href="https://www.linkedin.com/in/samwduncan" target="_blank" rel="noopener noreferrer" className="font-body text-sm text-text-secondary hover:text-blade-blue transition-colors flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-mono text-xs text-text-muted tracking-wide">
          &copy; {new Date().getFullYear()} RowLab. All rights reserved.
        </p>
        <p className="font-mono text-xs text-text-muted tracking-wide">
          Built with care by rowers.
        </p>
      </div>
    </div>
  </footer>
);

// ============================================
// NAVIGATION - Glass Effect with Gradient Stroke
// ============================================
const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.15, ease: precisionEase }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-150 ${
        scrolled
          ? `bg-void-deep/80 backdrop-blur-xl saturate-[180%]
             border-b border-transparent
             [background-image:linear-gradient(rgba(8,8,10,0.9),rgba(8,8,10,0.9)),linear-gradient(to_right,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]
             [background-origin:padding-box,border-box]
             [background-clip:padding-box,border-box]
             shadow-[0_4px_30px_rgba(0,0,0,0.3)]`
          : ''
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-blade-blue flex items-center justify-center group-hover:shadow-glow-green transition-shadow duration-150">
              <Layers className="w-5 h-5 text-void-deep" />
            </div>
            <span className="font-display text-lg font-semibold text-text-primary">RowLab</span>
          </Link>

          {/* Nav Links - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { href: '#features', label: 'Features' },
              { href: '#pricing', label: 'Pricing' },
              { to: '/app', label: 'Demo' },
            ].map((item) => {
              const Component = item.to ? Link : 'a';
              return (
                <Component
                  key={item.label}
                  {...(item.to ? { to: item.to } : { href: item.href })}
                  className="relative px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors
                    after:content-[''] after:absolute after:bottom-1 after:left-4 after:right-4
                    after:h-[1px] after:bg-blade-blue after:scale-x-0 after:opacity-0
                    after:transition-all after:duration-200
                    hover:after:scale-x-100 hover:after:opacity-100"
                >
                  {item.label}
                </Component>
              );
            })}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="group inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full
                bg-blade-blue text-void-deep text-sm font-medium
                hover:shadow-glow-green transition-all duration-150
                hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

// ============================================
// MAIN COMPONENT - Precision Instrument Assembly
// ============================================
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-void-deep text-text-primary">
      <Navigation />
      <main>
        <HeroSection />
        <DataStreamTicker className="border-y border-white/[0.04]" />
        <IntegrationBar />
        <HowItWorksSection />
        <div id="features">
          <FeaturesSection />
        </div>
        <CapabilitiesSection />
        <ComparisonSection />
        <ProductShowcase />
        <BuiltForCoachesSection />
        <RoadmapSection />
        <div id="pricing">
          <PricingSection />
        </div>
        <FAQSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
