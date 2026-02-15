/**
 * ProfileSkeleton -- full-page loading skeleton matching the profile layout.
 *
 * Renders shimmer placeholders for banner, avatar, name, bio,
 * stat cards, tab bar, and content area.
 */
export function ProfileSkeleton() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Banner skeleton */}
      <div className="h-48 w-full rounded-b-xl animate-shimmer bg-ink-well" />

      {/* Avatar + info area */}
      <div className="px-4 -mt-12">
        {/* Avatar circle */}
        <div className="w-24 h-24 rounded-full animate-shimmer bg-ink-well border-4 border-ink-deep" />

        {/* Name + bio */}
        <div className="mt-3 space-y-2">
          <div className="h-7 w-48 rounded-md animate-shimmer bg-ink-well" />
          <div className="h-4 w-72 rounded-md animate-shimmer bg-ink-well" />
        </div>

        {/* Headline stats */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-shimmer bg-ink-well" />
          ))}
        </div>
      </div>

      {/* Tab bar skeleton */}
      <div className="mt-6 px-4 border-b border-ink-border">
        <div className="flex gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 w-20 rounded-md animate-shimmer bg-ink-well mb-3" />
          ))}
        </div>
      </div>

      {/* Content area skeleton */}
      <div className="px-4 py-6 space-y-4">
        <div className="h-32 rounded-xl animate-shimmer bg-ink-well" />
        <div className="h-48 rounded-xl animate-shimmer bg-ink-well" />
      </div>
    </div>
  );
}
