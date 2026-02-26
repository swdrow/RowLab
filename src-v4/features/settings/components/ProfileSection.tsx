/**
 * Profile settings section -- edit display name, bio, and avatar.
 * Uses existing profile API hooks for optimistic PATCH mutations.
 */
import { useState, useRef, useCallback } from 'react';
import { IconUser, IconCamera, IconCheck } from '@/components/icons';
import { useQuery } from '@tanstack/react-query';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { profileQueryOptions, useUpdateProfile, useUploadAvatar } from '@/features/profile/api';

export function ProfileSection() {
  const { data: profile, isLoading } = useQuery(profileQueryOptions());
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [nameInitialized, setNameInitialized] = useState(false);
  const [bioInitialized, setBioInitialized] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [bioSaved, setBioSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form state when profile data loads
  if (profile && !nameInitialized) {
    setName(profile.name || '');
    setNameInitialized(true);
  }
  if (profile && !bioInitialized) {
    setBio(profile.bio || '');
    setBioInitialized(true);
  }

  const handleSaveName = useCallback(() => {
    if (!name.trim()) return;
    updateProfile.mutate(
      { name: name.trim() },
      {
        onSuccess: () => {
          setNameSaved(true);
          setTimeout(() => setNameSaved(false), 2000);
        },
      }
    );
  }, [name, updateProfile]);

  const handleSaveBio = useCallback(() => {
    updateProfile.mutate(
      { bio: bio.trim() || undefined },
      {
        onSuccess: () => {
          setBioSaved(true);
          setTimeout(() => setBioSaved(false), 2000);
        },
      }
    );
  }, [bio, updateProfile]);

  const handleAvatarChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        uploadAvatar.mutate(file);
      }
    },
    [uploadAvatar]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-shimmer">
          <div className="h-6 w-48 rounded bg-edge-default/50 mb-2" />
          <div className="h-4 w-72 rounded bg-edge-default/30" />
        </div>
        <div className="h-40 rounded-xl bg-edge-default/30 animate-shimmer" />
        <div className="h-28 rounded-xl bg-edge-default/30 animate-shimmer" />
      </div>
    );
  }

  const BIO_MAX = 160;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Profile"
        description="Manage your public-facing profile information"
        icon={<IconUser className="w-4 h-4" />}
      />

      {/* Avatar */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="relative">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-edge-default"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-void-deep border-2 border-edge-default flex items-center justify-center">
                <IconUser className="w-8 h-8 text-text-faint" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent-teal text-void-deep flex items-center justify-center hover:bg-accent-teal/90 transition-colors cursor-pointer"
              aria-label="Change avatar"
            >
              <IconCamera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-text-bright">Profile Photo</p>
            <p className="text-xs text-text-dim mt-0.5">JPG, PNG, or WebP. Max 5MB.</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-accent-teal hover:underline mt-1 cursor-pointer"
            >
              {uploadAvatar.isPending ? 'Uploading...' : 'Change Photo'}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
      </Card>

      {/* Display Name */}
      <Card>
        <label className="block text-sm font-medium text-text-bright mb-1.5">Display Name</label>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="
              flex-1 px-3 py-2 rounded-lg text-sm
              bg-void-surface border border-edge-default text-text-bright
              placeholder:text-text-faint
              focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent-teal
              transition-colors
            "
            placeholder="Your display name"
          />
          <Button
            size="sm"
            onClick={handleSaveName}
            loading={updateProfile.isPending && !bioSaved}
            disabled={name.trim() === (profile?.name || '')}
          >
            {nameSaved ? (
              <>
                <IconCheck className="w-3.5 h-3.5" />
                Saved
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </Card>

      {/* Bio */}
      <Card>
        <label className="block text-sm font-medium text-text-bright mb-1.5">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
          maxLength={BIO_MAX}
          rows={3}
          className="
            w-full px-3 py-2 rounded-lg text-sm resize-none
            bg-void-surface border border-edge-default text-text-bright
            placeholder:text-text-faint
            focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent-teal
            transition-colors
          "
          placeholder="Tell us about yourself..."
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-text-faint">
            {bio.length}/{BIO_MAX} characters
          </span>
          <Button
            size="sm"
            onClick={handleSaveBio}
            loading={updateProfile.isPending && !nameSaved}
            disabled={(bio.trim() || null) === (profile?.bio || null)}
          >
            {bioSaved ? (
              <>
                <IconCheck className="w-3.5 h-3.5" />
                Saved
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
