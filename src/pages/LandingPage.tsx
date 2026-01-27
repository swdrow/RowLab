import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Users,
  BarChart3,
  Timer,
  Trophy,
  Calendar,
  Ship,
  ClipboardCheck,
  Target,
  Zap,
  ArrowRight,
  Check
} from 'lucide-react';
import {
  BentoTile,
  LineupPreview,
  MetricPreview,
  CalendarPreview,
  RankingPreview
} from '../v2/components/landing';
import '../v2/styles/landing.css';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Animated section wrapper
const AnimatedSection: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => {
  const ref = React.useRef(null);
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
      <nav className="landing-nav">
        <div className="landing-nav-content">
          <Link to="/" className="landing-nav-logo">
            RowLab
          </Link>
          <div className="landing-nav-links">
            <Link to="/login" className="landing-nav-link">
              Sign In
            </Link>
            <Link to="/signup" className="landing-nav-cta">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero - Editorial */}
      <section className="landing-hero-editorial">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative z-10"
        >
          <h1 className="landing-headline">
            Build Faster Boats
          </h1>
          <p className="landing-subheadline">
            The complete platform for rowing team management.
            From daily lineups to race day.
          </p>
          <div className="landing-cta-group">
            <Link to="/signup" className="landing-cta-primary">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="landing-cta-secondary">
              See Features
            </a>
          </div>
        </motion.div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="landing-section">
        <AnimatedSection>
          <div className="landing-section-header">
            <h2 className="landing-section-title">Everything You Need</h2>
            <p className="landing-section-subtitle">
              Purpose-built tools for coaches who demand precision.
            </p>
          </div>
        </AnimatedSection>

        <div className="landing-bento">
          {/* Large: Lineup Builder */}
          <BentoTile
            size="large"
            className="bento-lineup"
            icon={<Trophy className="w-6 h-6" />}
            title="Lineup Builder"
            description="Drag-and-drop crew assignment with seat validation. Build race-ready lineups in minutes, not hours. Export print-ready PDFs for the dock."
            preview={<LineupPreview />}
          />

          {/* Medium: Seat Racing */}
          <BentoTile
            size="medium"
            className="bento-seat"
            icon={<BarChart3 className="w-6 h-6" />}
            title="Smart Seat Racing"
            description="Bradley-Terry statistical rankings with confidence intervals. Matrix scheduling using Latin Square optimization. Replace guesswork with data."
            preview={<RankingPreview />}
          />

          {/* Medium: Training */}
          <BentoTile
            size="medium"
            className="bento-train"
            icon={<Calendar className="w-6 h-6" />}
            title="Training Calendar"
            description="Periodization planning. Schedule sessions, track TSS, and maintain optimal training load throughout the season."
            preview={<CalendarPreview />}
          />

          {/* Small: Erg Data */}
          <BentoTile
            size="small"
            className="bento-erg"
            icon={<Timer className="w-6 h-6" />}
            title="Erg Data"
            description="Centralized erg test tracking. All 2K, 6K, and piece data in one place."
            preview={<MetricPreview />}
          />

          {/* Small: Fleet */}
          <BentoTile
            size="small"
            className="bento-fleet"
            icon={<Ship className="w-6 h-6" />}
            title="Fleet Management"
            description="Track shells, oars, and equipment. Know what's available and race-ready."
          />

          {/* Medium: Race Day */}
          <BentoTile
            size="medium"
            className="bento-raceday"
            icon={<Target className="w-6 h-6" />}
            title="Race Day Command"
            description="Real-time regatta coordination. Warmup schedules, lane assignments, timeline tracking. Keep your team organized from trailer to trophy."
          />

          {/* Small: Availability */}
          <BentoTile
            size="small"
            className="bento-avail"
            icon={<ClipboardCheck className="w-6 h-6" />}
            title="Availability"
            description="Weekly calendars show who can row, when. No more last-minute lineup scrambles."
          />

          {/* Small: Roster */}
          <BentoTile
            size="small"
            className="bento-roster"
            icon={<Users className="w-6 h-6" />}
            title="Roster Management"
            description="Complete athlete database with biometrics, attendance, and performance history."
          />

          {/* Small: Gamification */}
          <BentoTile
            size="small"
            className="bento-gamify"
            icon={<Zap className="w-6 h-6" />}
            title="Athlete Engagement"
            description="Achievements, challenges, and streaks. Keep athletes motivated and accountable."
          />
        </div>
      </section>

      {/* For Coaches / For Athletes */}
      <section className="landing-section">
        <AnimatedSection>
          <div className="landing-section-header">
            <h2 className="landing-section-title">Built for Your Whole Team</h2>
          </div>
        </AnimatedSection>

        <div className="landing-split">
          <AnimatedSection>
            <div className="landing-split-column">
              <h3 className="landing-split-title">For Coaches</h3>
              <ul className="landing-split-list">
                <li className="landing-split-item">
                  <Check className="landing-split-icon w-5 h-5" />
                  <span>Make data-driven lineup decisions with statistical confidence</span>
                </li>
                <li className="landing-split-item">
                  <Check className="landing-split-icon w-5 h-5" />
                  <span>Track NCAA 20-hour compliance automatically</span>
                </li>
                <li className="landing-split-item">
                  <Check className="landing-split-icon w-5 h-5" />
                  <span>Coordinate race day logistics from one dashboard</span>
                </li>
                <li className="landing-split-item">
                  <Check className="landing-split-icon w-5 h-5" />
                  <span>Monitor training load and prevent overtraining</span>
                </li>
                <li className="landing-split-item">
                  <Check className="landing-split-icon w-5 h-5" />
                  <span>Generate reports for recruiting and compliance</span>
                </li>
              </ul>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <div className="landing-split-column">
              <h3 className="landing-split-title">For Athletes</h3>
              <ul className="landing-split-list">
                <li className="landing-split-item">
                  <Check className="landing-split-icon w-5 h-5" />
                  <span>See your boat assignments and practice schedules</span>
                </li>
                <li className="landing-split-item">
                  <Check className="landing-split-icon w-5 h-5" />
                  <span>Track your erg PRs and progress over time</span>
                </li>
                <li className="landing-split-item">
                  <Check className="landing-split-icon w-5 h-5" />
                  <span>Earn achievements and compete on leaderboards</span>
                </li>
                <li className="landing-split-item">
                  <Check className="landing-split-icon w-5 h-5" />
                  <span>Log availability and communicate with coaches</span>
                </li>
                <li className="landing-split-item">
                  <Check className="landing-split-icon w-5 h-5" />
                  <span>View race day warmup times and assignments</span>
                </li>
              </ul>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Final CTA */}
      <section className="landing-final-cta">
        <AnimatedSection>
          <h2 className="landing-final-cta-title">
            Ready to Build Faster Boats?
          </h2>
          <p className="landing-final-cta-subtitle">
            Start your free trial today. No credit card required.
          </p>
          <Link to="/signup" className="landing-cta-primary">
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-content">
          <p>&copy; {new Date().getFullYear()} RowLab. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <a href="mailto:support@rowlab.app">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
