/**
 * ProfileHero -- Strava-style hero banner with avatar, stats, and team badges.
 *
 * Features:
 * - Banner area: uploaded image or abstract geometric CSS gradient
 * - Avatar: uploaded photo or colored initials circle
 * - Camera icon overlays for avatar and banner upload
 * - Inline-editable name and bio
 * - Headline stats: total meters, workouts, hours, streak
 * - Team badges showing role
 */
import { useRef } from 'react';
import { motion } from 'motion/react';
import { IconCamera, IconWaves, IconDumbbell, IconClock, IconFlame } from '@/components/icons';
import type { IconComponent } from '@/types/icons';

import { slideUp } from '@/lib/animations';
import { formatNumber } from '@/lib/format';
import { CornerBrackets } from '@/components/ui/CornerBrackets';
import { useUpdateProfile, useUploadAvatar, useUploadBanner } from '../api';
import { InlineEdit } from './InlineEdit';
import type { ProfileData, StatsData } from '../types';

interface ProfileHeroProps {
  profile: ProfileData;
  stats: StatsData;
}

export function ProfileHero({ profile, stats }: ProfileHeroProps) {
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const uploadBanner = useUploadBanner();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleNameSave = (name: string) => {
    if (name) updateProfile.mutate({ name });
  };

  const handleBioSave = (bio: string) => {
    updateProfile.mutate({ bio });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar.mutate(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadBanner.mutate(file);
    e.target.value = '';
  };

  const totalHours = Math.floor((stats.allTime.totalDurationSeconds ?? 0) / 3600);

  return (
    <motion.div {...slideUp}>
      <CornerBrackets>
        {/* Banner */}
        <div className="relative h-48 w-full sm:rounded-t-xl overflow-hidden group">
          {profile.bannerUrl ? (
            <img
              src={profile.bannerUrl}
              alt="Profile banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <DefaultBanner />
          )}

          {/* Banner upload overlay */}
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors cursor-pointer"
            aria-label="Upload banner image"
          >
            <IconCamera
              width={24}
              height={24}
              className="text-white opacity-0 group-hover:opacity-80 transition-opacity"
            />
          </button>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerUpload}
            className="hidden"
            aria-hidden="true"
          />
        </div>

        {/* Avatar + info section */}
        <div className="px-4 pb-4">
          {/* Avatar */}
          <div className="relative -mt-12 inline-block group/avatar">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-void-deep"
              />
            ) : (
              <AvatarInitials name={profile.name} size={96} />
            )}

            {/* Avatar upload overlay */}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover/avatar:bg-black/30 transition-colors cursor-pointer"
              aria-label="Upload avatar"
            >
              <IconCamera
                width={16}
                height={16}
                className="text-white opacity-0 group-hover/avatar:opacity-80 transition-opacity"
              />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              aria-hidden="true"
            />
          </div>

          {/* Name and bio */}
          <div className="mt-2">
            <InlineEdit
              value={profile.name}
              onSave={handleNameSave}
              placeholder="Your name"
              as="h1"
              className="text-2xl font-display font-semibold text-text-bright"
              maxLength={100}
            />
            <div className="mt-1">
              <InlineEdit
                value={profile.bio ?? ''}
                onSave={handleBioSave}
                placeholder="Add a bio"
                as="p"
                className="text-sm text-text-dim"
                maxLength={300}
              />
            </div>
          </div>

          {/* Headline stats */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeadlineStat
              icon={IconWaves}
              label="Total Meters"
              value={formatNumber(stats.allTime.totalMeters)}
            />
            <HeadlineStat
              icon={IconDumbbell}
              label="Workouts"
              value={formatNumber(stats.allTime.workoutCount)}
            />
            <HeadlineStat icon={IconClock} label="Hours" value={formatNumber(totalHours)} />
            <HeadlineStat
              icon={IconFlame}
              label="Day Streak"
              value={String(stats.streak.current)}
            />
          </div>

          {/* Team badges */}
          {profile.teams.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.teams.map((team) => (
                <span
                  key={team.teamId}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-void-deep text-text-dim border border-edge-default"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-teal" />
                  {team.teamName}
                  <span className="text-text-faint capitalize">({team.role})</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </CornerBrackets>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function HeadlineStat({
  icon: Icon,
  label,
  value,
}: {
  icon: IconComponent;
  label: string;
  value: string;
}) {
  return (
    <div className="panel rounded-xl p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-void-deep flex items-center justify-center shrink-0">
        <Icon width={16} height={16} className="text-accent-teal" />
      </div>
      <div className="min-w-0">
        <div className="text-text-bright text-base font-semibold truncate">{value}</div>
        <div className="text-text-faint text-xs truncate">{label}</div>
      </div>
    </div>
  );
}

/** Colored initials fallback for avatar. Deterministic hue from name. */
function AvatarInitials({ name, size = 80 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Deterministic color from name hash
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-text-bright border-4 border-void-deep"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        background: `oklch(0.55 0.15 ${hue})`,
      }}
    >
      {initials}
    </div>
  );
}

/** Abstract geometric default banner using CSS gradients. */
function DefaultBanner() {
  return (
    <div
      className="w-full h-full"
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 20% 50%, oklch(0.35 0.08 50 / 0.5), transparent),
          radial-gradient(ellipse 60% 80% at 80% 30%, oklch(0.30 0.06 220 / 0.4), transparent),
          radial-gradient(ellipse 50% 50% at 50% 80%, oklch(0.25 0.04 280 / 0.3), transparent),
          linear-gradient(135deg, oklch(0.18 0.02 50), oklch(0.12 0.01 220))
        `,
      }}
    />
  );
}
