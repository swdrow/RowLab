/**
 * Dashboard hero section with time-of-day greeting and streak indicator.
 * Displayed at the top of the personal dashboard.
 */

import { motion } from 'motion/react';
import { slideUp } from '@/lib/animations';
import { StreakIndicator } from './StreakIndicator';

interface HeroSectionProps {
  userName: string;
  streak: {
    current: number;
    longest: number;
  };
  className?: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour <= 16) return 'Good afternoon';
  return 'Good evening';
}

function getFirstName(fullName: string): string {
  return fullName.split(' ')[0] || fullName;
}

export function HeroSection({ userName, streak, className = '' }: HeroSectionProps) {
  const greeting = getGreeting();
  const firstName = getFirstName(userName);

  return (
    <motion.div className={`flex flex-col gap-2 ${className}`} {...slideUp}>
      <h1 className="text-2xl lg:text-3xl font-display font-semibold text-heading-gradient">
        {greeting}, {firstName}
      </h1>
      <p className="text-text-dim">Here&apos;s your training overview</p>
      <StreakIndicator current={streak.current} longest={streak.longest} className="mt-1" />
    </motion.div>
  );
}
