import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  BarChart3,
  Users,
  Timer,
  Trophy,
  Zap,
  Shield,
  ArrowRight,
  Play
} from 'lucide-react';
import '../v2/styles/landing.css';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Feature data
const features = [
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Roster Management',
    description: 'Track athlete biometrics, attendance, and performance in one place. Import from CSV in seconds.'
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Erg Data & Analytics',
    description: 'Auto-sync from Concept2 Logbook. Track PRs, compare splits, and visualize progress over time.'
  },
  {
    icon: <Timer className="w-6 h-6" />,
    title: 'Smart Seat Racing',
    description: 'ELO-based rankings with statistical confidence. Matrix seat racing with Latin Square scheduling.'
  },
  {
    icon: <Trophy className="w-6 h-6" />,
    title: 'Lineup Builder',
    description: 'Drag-and-drop lineup creation with validation warnings. Export print-ready PDFs for race day.'
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Live Sessions',
    description: 'Monitor ergs in real-time during practice. Automatic attendance and performance tracking.'
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'NCAA Compliance',
    description: 'Track 20-hour rule automatically. Generate audit-ready compliance reports.'
  }
];

// Metrics data
const metrics = [
  { value: '10,000+', label: 'Athletes Tracked' },
  { value: '500+', label: 'Teams Using RowLab' },
  { value: '2M+', label: 'Erg Tests Recorded' },
  { value: '99.9%', label: 'Uptime' }
];

// Animated section wrapper
const AnimatedSection: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeInUp}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-md bg-[#0F0F0F]/80 border-b border-[#292524]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight">
            RowLab
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm text-[#A8A29E] hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h1 className="landing-hero-title">
            The Precision Instrument<br />for Rowing Teams
          </h1>
          <p className="landing-hero-subtitle">
            Built for coaches who demand data-driven decisions. Manage rosters, track performance,
            and build winning lineups with scientific precision.
          </p>
          <div className="landing-cta-group">
            <Link to="/signup" className="landing-cta-primary">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#demo" className="landing-cta-secondary">
              <Play className="w-5 h-5" />
              Watch Demo
            </a>
          </div>
        </motion.div>
      </section>

      {/* Metrics */}
      <section className="landing-metrics">
        <motion.div
          className="landing-metrics-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          {metrics.map((metric, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <div className="landing-metric-value">{metric.value}</div>
              <div className="landing-metric-label">{metric.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <AnimatedSection>
          <h2 className="text-3xl font-bold text-center mb-4">
            Everything You Need to Win
          </h2>
          <p className="text-[#A8A29E] text-center max-w-2xl mx-auto mb-12">
            From daily roster management to race day strategy, RowLab gives coaches
            the tools they need to make better decisions, faster.
          </p>
        </AnimatedSection>

        <motion.div
          className="landing-feature-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="landing-feature-card"
              variants={fadeInUp}
            >
              <div className="landing-feature-icon">{feature.icon}</div>
              <h3 className="landing-feature-title">{feature.title}</h3>
              <p className="landing-feature-description">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Testimonial */}
      <section className="landing-testimonials">
        <AnimatedSection>
          <blockquote className="landing-quote">
            "RowLab transformed how we evaluate athletes. The seat racing analytics
            give us confidence in our lineup decisions that we never had before."
          </blockquote>
          <p className="landing-quote-author">
            - Head Coach, Division I Rowing Program
          </p>
        </AnimatedSection>
      </section>

      {/* Final CTA */}
      <section className="landing-final-cta">
        <AnimatedSection>
          <h2 className="landing-final-cta-title">
            Ready to Build Better Lineups?
          </h2>
          <p className="text-[#A8A29E] mb-8 max-w-xl mx-auto">
            Join hundreds of teams using RowLab to make data-driven decisions.
            Start your free trial today - no credit card required.
          </p>
          <Link to="/signup" className="landing-cta-primary">
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[#292524]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#A8A29E]">
          <p>&copy; {new Date().getFullYear()} RowLab. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <a href="mailto:support@rowlab.app" className="hover:text-white transition-colors">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
