/**
 * ShareCardPreview - Live preview with download/copy/share actions
 * Phase 38-04
 *
 * Features:
 * - Live card preview with skeleton loader
 * - Responsive layout (mobile: stacked, desktop: side-by-side)
 * - Action buttons: Copy Image, Download PNG, Share (mobile), Post to Strava (placeholder)
 * - Canvas design system styling
 * - Integrates useShareCardFlow and useClipboard hooks
 */

import React, { useEffect } from 'react';
import { Download, Copy, ShareFat, Check } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';
import { useShareCardFlow } from '../hooks/useShareCard';
import { useClipboard } from '../hooks/useClipboard';
import { ShareOptionsPanel } from './ShareOptionsPanel';
import { SPRING_CONFIG, FADE_IN_VARIANTS } from '../../../utils/animations';

interface ShareCardPreviewProps {
  workoutId: string;
  cardType: string;
  initialOptions?: {
    showName?: boolean;
    brandingType?: 'personal' | 'team';
    teamId?: string | null;
    qrCode?: boolean;
    printUrl?: boolean;
    format?: '1:1' | '9:16';
  };
}

/**
 * Skeleton loader for card preview
 */
function CardSkeleton({ format }: { format: '1:1' | '9:16' }) {
  const aspectRatio = format === '1:1' ? 'aspect-square' : 'aspect-[9/16]';

  return (
    <div
      className={`w-full ${aspectRatio} rounded-xl bg-bg-surface-elevated/30 border border-bdr-subtle overflow-hidden`}
    >
      <div className="w-full h-full bg-gradient-to-br from-bg-surface-elevated/50 to-bg-surface/50 animate-pulse" />
    </div>
  );
}

/**
 * ShareCardPreview - Main preview component
 */
export function ShareCardPreview({ workoutId, cardType, initialOptions }: ShareCardPreviewProps) {
  const { teams } = useAuth();
  const { card, options, setOption, setFormat, generate, isGenerating, error } = useShareCardFlow(
    workoutId,
    cardType
  );
  const {
    copyImage,
    copied,
    error: clipboardError,
    isSupported: clipboardSupported,
  } = useClipboard();

  // Apply initial options on mount
  useEffect(() => {
    if (initialOptions) {
      Object.entries(initialOptions).forEach(([key, value]) => {
        if (value !== undefined) {
          setOption(key, value);
        }
      });
    }
  }, []); // Only run once on mount

  /**
   * Download PNG
   */
  const handleDownload = () => {
    if (!card) return;

    const link = document.createElement('a');
    link.href = card.url;
    link.download = `rowlab-${cardType}-${card.shareId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Copy image to clipboard
   */
  const handleCopy = async () => {
    if (!card) return;
    await copyImage(card.url);
  };

  /**
   * Web Share API (mobile)
   */
  const handleShare = async () => {
    if (!card) return;

    // Check if Web Share API is supported
    if (!navigator.share) {
      console.warn('Web Share API not supported');
      return;
    }

    try {
      // Fetch image as blob
      const response = await fetch(card.url);
      const blob = await response.blob();
      const file = new File([blob], `rowlab-${cardType}.png`, { type: 'image/png' });

      await navigator.share({
        title: 'My RowLab Share Card',
        text: 'Check out my erg stats!',
        files: [file],
      });
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  /**
   * Placeholder Strava post (Phase 39)
   */
  const handleStravaPost = () => {
    // TODO(phase-39): Implement Strava integration
    console.log('Strava integration coming in Phase 39');
  };

  const shareSupported = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="w-full">
      {/* Mobile: Stacked layout */}
      <div className="md:hidden space-y-6">
        {/* Card preview */}
        <div className="w-full">
          {isGenerating || !card ? (
            <CardSkeleton format={options.format} />
          ) : error ? (
            <div className="w-full aspect-square rounded-xl bg-status-error/10 border border-status-error/20 flex items-center justify-center p-6">
              <div className="text-center">
                <p className="text-status-error font-medium mb-2">Generation failed</p>
                <p className="text-sm text-txt-secondary mb-4">{error.message}</p>
                <button
                  onClick={generate}
                  className="px-4 py-2 rounded-xl bg-interactive-primary text-txt-inverse hover:bg-interactive-hover transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <motion.img
              key={card.shareId}
              src={card.url}
              alt="Share card preview"
              className="w-full rounded-xl shadow-lg"
              variants={FADE_IN_VARIANTS}
              initial="hidden"
              animate="visible"
              transition={SPRING_CONFIG}
            />
          )}
        </div>

        {/* Options panel */}
        <ShareOptionsPanel
          options={options}
          onOptionsChange={setOption}
          userTeams={teams}
          format={options.format}
          onFormatChange={setFormat}
        />

        {/* Action buttons (sticky at bottom on mobile) */}
        {card && (
          <div className="sticky bottom-4 left-0 right-0 flex flex-wrap gap-2 p-4 rounded-xl bg-bg-surface-elevated/95 backdrop-blur-sm border border-bdr-subtle shadow-lg">
            {/* Copy Image */}
            {clipboardSupported && (
              <button
                onClick={handleCopy}
                disabled={copied}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all
                  ${
                    copied
                      ? 'bg-status-success/20 text-status-success border border-status-success/30'
                      : 'bg-interactive-primary text-txt-inverse hover:bg-interactive-hover hover:shadow-glow-copper'
                  }
                `}
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" weight="bold" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" weight="bold" />
                    Copy
                  </>
                )}
              </button>
            )}

            {/* Download PNG */}
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-bg-surface-elevated/50 border border-bdr-default text-txt-primary font-medium hover:bg-bg-hover hover:border-bdr-strong transition-all"
            >
              <Download className="w-5 h-5" weight="bold" />
              Download
            </button>

            {/* Share (mobile only) */}
            {shareSupported && (
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-bg-surface-elevated/50 border border-bdr-default text-txt-primary font-medium hover:bg-bg-hover hover:border-bdr-strong transition-all"
              >
                <ShareFat className="w-5 h-5" weight="bold" />
                Share
              </button>
            )}

            {/* Strava placeholder (full width) */}
            <button
              onClick={handleStravaPost}
              disabled
              title="Coming in Phase 39"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-bg-surface-elevated/30 border border-bdr-subtle text-txt-tertiary font-medium cursor-not-allowed opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
              </svg>
              Post to Strava (Coming Soon)
            </button>
          </div>
        )}
      </div>

      {/* Desktop: Side-by-side layout */}
      <div className="hidden md:grid md:grid-cols-[60%_40%] md:gap-6">
        {/* Left: Card preview */}
        <div className="w-full">
          {isGenerating || !card ? (
            <CardSkeleton format={options.format} />
          ) : error ? (
            <div className="w-full aspect-square rounded-xl bg-status-error/10 border border-status-error/20 flex items-center justify-center p-6">
              <div className="text-center">
                <p className="text-status-error font-medium mb-2">Generation failed</p>
                <p className="text-sm text-txt-secondary mb-4">{error.message}</p>
                <button
                  onClick={generate}
                  className="px-4 py-2 rounded-xl bg-interactive-primary text-txt-inverse hover:bg-interactive-hover transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <motion.img
              key={card.shareId}
              src={card.url}
              alt="Share card preview"
              className="w-full rounded-xl shadow-lg"
              variants={FADE_IN_VARIANTS}
              initial="hidden"
              animate="visible"
              transition={SPRING_CONFIG}
            />
          )}

          {/* Action buttons (below card on desktop) */}
          {card && (
            <div className="mt-6 flex flex-wrap gap-3">
              {/* Copy Image */}
              {clipboardSupported && (
                <button
                  onClick={handleCopy}
                  disabled={copied}
                  className={`
                    flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all
                    ${
                      copied
                        ? 'bg-status-success/20 text-status-success border border-status-success/30'
                        : 'bg-interactive-primary text-txt-inverse hover:bg-interactive-hover hover:shadow-glow-copper'
                    }
                  `}
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" weight="bold" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" weight="bold" />
                      Copy Image
                    </>
                  )}
                </button>
              )}

              {/* Download PNG */}
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-bg-surface-elevated/50 border border-bdr-default text-txt-primary font-medium hover:bg-bg-hover hover:border-bdr-strong transition-all"
              >
                <Download className="w-5 h-5" weight="bold" />
                Download PNG
              </button>

              {/* Strava placeholder */}
              <button
                onClick={handleStravaPost}
                disabled
                title="Coming in Phase 39"
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-bg-surface-elevated/30 border border-bdr-subtle text-txt-tertiary font-medium cursor-not-allowed opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
                Post to Strava (Coming Soon)
              </button>
            </div>
          )}

          {/* Clipboard error message */}
          {clipboardError && <p className="mt-3 text-sm text-status-warning">{clipboardError}</p>}
        </div>

        {/* Right: Options panel */}
        <div className="w-full">
          <ShareOptionsPanel
            options={options}
            onOptionsChange={setOption}
            userTeams={teams}
            format={options.format}
            onFormatChange={setFormat}
          />
        </div>
      </div>
    </div>
  );
}
