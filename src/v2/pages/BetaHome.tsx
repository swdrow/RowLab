export default function BetaHome() {
  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative px-6 pt-8 pb-6 mb-2 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-copper/[0.06] via-accent-copper/[0.02] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-accent-copper/30 to-transparent" />
        <div className="relative flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-copper mb-2">
              BETA PREVIEW
            </p>
            <h1 className="text-4xl font-display font-bold text-ink-bright tracking-tight">
              RowLab V2
            </h1>
            <p className="text-sm text-ink-secondary mt-2">
              Welcome to the V2 redesign. This is a clean room implementation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
